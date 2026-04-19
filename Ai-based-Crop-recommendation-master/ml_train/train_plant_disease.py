#!/usr/bin/env python3
"""
PlantVillage CNN trainer — MobileNetV2 transfer learning.

Dataset layout (PlantVillage "color" split):
  <data_dir>/
    Apple___Apple_scab/   *.jpg
    Apple___Black_rot/    *.jpg
    ...

Usage:
  pip install -r requirements-training.txt
  python train_plant_disease.py --data_dir "/path/to/plantvillage/color"

Outputs (written to --output_dir, default = this script's folder):
  plant_disease_model.keras   ← full Keras model (used by analyze_image.py)
  plant_disease_model.tflite  ← quantised TFLite (optional fast inference)
  plant_disease_classes.json  ← {"class_names": [...]}
  training_report.json        ← accuracy / loss curves + final metrics
"""
from __future__ import annotations

import argparse
import json
import os
import time
from pathlib import Path

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")

import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, Model


# ── CLI ────────────────────────────────────────────────────────────────────────
def parse_args():
    p = argparse.ArgumentParser(description="Train PlantVillage CNN (MobileNetV2)")
    p.add_argument("--data_dir",      required=True,  help="Root folder with one sub-folder per class")
    p.add_argument("--output_dir",    default=str(Path(__file__).resolve().parent))
    p.add_argument("--img_size",      type=int,   default=224)
    p.add_argument("--batch_size",    type=int,   default=32)
    p.add_argument("--epochs_head",   type=int,   default=10,  help="Frozen-backbone phase")
    p.add_argument("--epochs_finetune", type=int, default=10,  help="Unfrozen fine-tune phase")
    p.add_argument("--val_split",     type=float, default=0.20)
    p.add_argument("--seed",          type=int,   default=42)
    p.add_argument("--no_tflite",     action="store_true", help="Skip TFLite export")
    return p.parse_args()


# ── Augmentation layer (applied only during training) ─────────────────────────
def augmentation_layer():
    return keras.Sequential([
        layers.RandomFlip("horizontal"),
        layers.RandomRotation(0.15),
        layers.RandomZoom(0.15),
        layers.RandomTranslation(0.10, 0.10),
        layers.RandomBrightness(0.15),
        layers.RandomContrast(0.15),
    ], name="augmentation")


# ── Model ──────────────────────────────────────────────────────────────────────
def build_model(num_classes: int, img_size: int) -> tuple[Model, Model]:
    """Returns (full_model, base_model) so we can unfreeze base later."""
    base = keras.applications.MobileNetV2(
        input_shape=(img_size, img_size, 3),
        include_top=False,
        weights="imagenet",
    )
    base.trainable = False

    aug = augmentation_layer()

    inputs = keras.Input(shape=(img_size, img_size, 3), name="image_input")
    x = aug(inputs)
    x = keras.applications.mobilenet_v2.preprocess_input(x)
    x = base(x, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.30)(x)
    x = layers.Dense(256, activation="relu")(x)
    x = layers.Dropout(0.20)(x)
    outputs = layers.Dense(num_classes, activation="softmax", name="predictions")(x)

    model = Model(inputs, outputs)
    return model, base


def unfreeze_top(base: Model, unfreeze_from: int = 100) -> None:
    base.trainable = True
    for layer in base.layers[:unfreeze_from]:
        layer.trainable = False


# ── Class-weight helper ────────────────────────────────────────────────────────
def compute_class_weights(ds: tf.data.Dataset, num_classes: int) -> dict:
    counts = np.zeros(num_classes, dtype=np.int64)
    for _, labels in ds:
        for lbl in labels.numpy():
            counts[int(lbl)] += 1
    total = counts.sum()
    weights = {}
    for i, c in enumerate(counts):
        weights[i] = float(total / (num_classes * max(c, 1)))
    return weights


# ── TFLite export ──────────────────────────────────────────────────────────────
def export_tflite(model: Model, out_path: Path, rep_ds: tf.data.Dataset) -> None:
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]

    def rep_gen():
        for imgs, _ in rep_ds.take(50):
            for img in imgs:
                yield [tf.expand_dims(img, 0)]

    converter.representative_dataset = rep_gen
    converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS_INT8]
    converter.inference_input_type  = tf.uint8
    converter.inference_output_type = tf.uint8
    try:
        tflite_model = converter.convert()
        out_path.write_bytes(tflite_model)
        print(f"TFLite model saved → {out_path}  ({len(tflite_model)/1024:.0f} KB)")
    except Exception as e:
        print(f"[WARN] TFLite INT8 export failed ({e}); trying float16 fallback...")
        converter2 = tf.lite.TFLiteConverter.from_keras_model(model)
        converter2.optimizations = [tf.lite.Optimize.DEFAULT]
        converter2.target_spec.supported_types = [tf.float16]
        tflite_model = converter2.convert()
        out_path.write_bytes(tflite_model)
        print(f"TFLite (float16) saved → {out_path}  ({len(tflite_model)/1024:.0f} KB)")


# ── Main ───────────────────────────────────────────────────────────────────────
def main():
    args = parse_args()
    data_dir = Path(args.data_dir)
    if not data_dir.is_dir():
        raise SystemExit(f"data_dir not found: {data_dir}")

    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    keras.utils.set_random_seed(args.seed)
    tf.config.experimental.enable_op_determinism()

    print(f"\n{'='*60}")
    print(f"  PlantVillage CNN Training  |  TF {tf.__version__}")
    print(f"  data_dir : {data_dir}")
    print(f"  output   : {out_dir}")
    print(f"{'='*60}\n")

    # ── Datasets ──────────────────────────────────────────────────────────────
    common = dict(
        directory=str(data_dir),
        validation_split=args.val_split,
        seed=args.seed,
        image_size=(args.img_size, args.img_size),
        batch_size=args.batch_size,
        label_mode="int",
    )
    train_ds = keras.utils.image_dataset_from_directory(subset="training",  **common)
    val_ds   = keras.utils.image_dataset_from_directory(subset="validation", **common)

    class_names = train_ds.class_names
    num_classes = len(class_names)
    print(f"Classes found: {num_classes}")
    if num_classes < 2:
        raise SystemExit("Need at least 2 classes.")

    # Save class names immediately so inference can start even if training is interrupted
    classes_path = out_dir / "plant_disease_classes.json"
    classes_path.write_text(json.dumps({"class_names": class_names}, indent=2), encoding="utf-8")
    print(f"Class names saved → {classes_path}")

    # Performance pipeline (no .cache() on large datasets to avoid OOM)
    AUTOTUNE = tf.data.AUTOTUNE
    train_ds = train_ds.prefetch(AUTOTUNE)
    val_ds   = val_ds.prefetch(AUTOTUNE)

    # ── Class weights ──────────────────────────────────────────────────────────
    print("Computing class weights...")
    class_weights = compute_class_weights(train_ds, num_classes)

    # ── Build model ────────────────────────────────────────────────────────────
    model, base_model = build_model(num_classes, args.img_size)
    model.summary(line_length=90)

    # ── Phase 1: train head only ───────────────────────────────────────────────
    model.compile(
        optimizer=keras.optimizers.Adam(1e-3),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )

    callbacks_head = [
        keras.callbacks.EarlyStopping(
            monitor="val_accuracy", patience=4, restore_best_weights=True, verbose=1
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss", factor=0.5, patience=2, min_lr=1e-6, verbose=1
        ),
        keras.callbacks.ModelCheckpoint(
            str(out_dir / "plant_disease_model.keras"),
            monitor="val_accuracy", save_best_only=True, verbose=1
        ),
    ]

    print(f"\n── Phase 1: head training ({args.epochs_head} epochs max) ──")
    t0 = time.time()
    h1 = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=args.epochs_head,
        class_weight=class_weights,
        callbacks=callbacks_head,
        verbose=1,
    )

    # ── Phase 2: fine-tune top layers ─────────────────────────────────────────
    unfreeze_top(base_model, unfreeze_from=100)
    model.compile(
        optimizer=keras.optimizers.Adam(1e-5),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )

    callbacks_ft = [
        keras.callbacks.EarlyStopping(
            monitor="val_accuracy", patience=5, restore_best_weights=True, verbose=1
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss", factor=0.3, patience=2, min_lr=1e-7, verbose=1
        ),
        keras.callbacks.ModelCheckpoint(
            str(out_dir / "plant_disease_model.keras"),
            monitor="val_accuracy", save_best_only=True, verbose=1
        ),
    ]

    print(f"\n── Phase 2: fine-tuning ({args.epochs_finetune} epochs max) ──")
    h2 = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=args.epochs_finetune,
        class_weight=class_weights,
        callbacks=callbacks_ft,
        verbose=1,
    )
    elapsed = time.time() - t0

    # ── Final evaluation ───────────────────────────────────────────────────────
    print("\nEvaluating on validation set...")
    loss, acc = model.evaluate(val_ds, verbose=0)
    print(f"\nFinal val accuracy : {acc:.4f}  ({acc*100:.2f}%)")
    print(f"Final val loss     : {loss:.4f}")
    print(f"Total training time: {elapsed/60:.1f} min")

    # ── Save training report ───────────────────────────────────────────────────
    def _to_list(v):
        return [float(x) for x in v] if v else []

    report = {
        "num_classes": num_classes,
        "img_size": args.img_size,
        "val_accuracy": round(acc, 4),
        "val_loss": round(loss, 4),
        "training_time_min": round(elapsed / 60, 2),
        "phase1": {
            "accuracy":     _to_list(h1.history.get("accuracy")),
            "val_accuracy": _to_list(h1.history.get("val_accuracy")),
            "loss":         _to_list(h1.history.get("loss")),
            "val_loss":     _to_list(h1.history.get("val_loss")),
        },
        "phase2": {
            "accuracy":     _to_list(h2.history.get("accuracy")),
            "val_accuracy": _to_list(h2.history.get("val_accuracy")),
            "loss":         _to_list(h2.history.get("loss")),
            "val_loss":     _to_list(h2.history.get("val_loss")),
        },
    }
    report_path = out_dir / "training_report.json"
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"Training report    → {report_path}")

    # ── TFLite export ──────────────────────────────────────────────────────────
    if not args.no_tflite:
        print("\nExporting TFLite model...")
        export_tflite(model, out_dir / "plant_disease_model.tflite", val_ds)

    print(f"\n✅  All outputs saved to: {out_dir}")
    print("    plant_disease_model.keras")
    print("    plant_disease_classes.json")
    if not args.no_tflite:
        print("    plant_disease_model.tflite")
    print("    training_report.json\n")


if __name__ == "__main__":
    main()
