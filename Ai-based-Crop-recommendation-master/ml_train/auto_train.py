#!/usr/bin/env python3
"""
auto_train.py - Download PlantVillage dataset + train CNN, fully automated.

Usage (from project root):
    python ml_train/auto_train.py
    python ml_train/auto_train.py --epochs_head 5 --epochs_finetune 5
    python ml_train/auto_train.py --data_dir C:/my_dataset  (skip download)
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.request
import zipfile
from pathlib import Path

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")

# ── paths ──────────────────────────────────────────────────────────────────────
ROOT            = Path(__file__).resolve().parent
DATASET_URL     = "https://github.com/spMohanty/PlantVillage-Dataset/archive/refs/heads/master.zip"
DATASET_ZIP     = ROOT / "plantvillage.zip"
EXTRACTED_COLOR = ROOT / "PlantVillage-Dataset-master" / "raw" / "color"


# ── download helpers ───────────────────────────────────────────────────────────
def _progress(count, block, total):
    done = count * block
    pct  = min(100, done * 100 // total) if total > 0 else 0
    sys.stdout.write(f"\r  {pct:3d}%  {done/1_048_576:.1f} MB")
    sys.stdout.flush()


def download_dataset():
    if DATASET_ZIP.exists():
        print(f"[*] Zip already present: {DATASET_ZIP} - skipping download.")
        return
    print("[*] Downloading PlantVillage dataset (~1.5 GB) ...")
    print(f"    {DATASET_URL}")
    print("    This may take 5-15 minutes.\n")
    try:
        urllib.request.urlretrieve(DATASET_URL, DATASET_ZIP, reporthook=_progress)
        print()
        print(f"[OK] Downloaded -> {DATASET_ZIP}")
    except Exception as e:
        DATASET_ZIP.unlink(missing_ok=True)
        raise SystemExit(f"[ERROR] Download failed: {e}")


def extract_dataset():
    if EXTRACTED_COLOR.is_dir() and any(EXTRACTED_COLOR.iterdir()):
        print(f"[*] Already extracted: {EXTRACTED_COLOR}")
        return
    print("[*] Extracting zip (~2 minutes) ...")
    try:
        with zipfile.ZipFile(DATASET_ZIP, "r") as z:
            members = z.namelist()
            for i, m in enumerate(members, 1):
                z.extract(m, ROOT)
                if i % 5000 == 0:
                    sys.stdout.write(f"\r  {i}/{len(members)} files")
                    sys.stdout.flush()
        print(f"\n[OK] Extracted to {ROOT}")
    except zipfile.BadZipFile:
        DATASET_ZIP.unlink(missing_ok=True)
        raise SystemExit("[ERROR] Zip corrupted. Delete plantvillage.zip and re-run.")


def find_data_dir() -> Path:
    if EXTRACTED_COLOR.is_dir():
        subs = [d for d in EXTRACTED_COLOR.iterdir() if d.is_dir()]
        if len(subs) >= 2:
            return EXTRACTED_COLOR
    manual = ROOT / "dataset"
    if manual.is_dir():
        subs = [d for d in manual.iterdir() if d.is_dir()]
        if len(subs) >= 2:
            return manual
    raise SystemExit(
        "[ERROR] Dataset not found.\n"
        f"  Expected: {EXTRACTED_COLOR}\n"
        f"  Or place dataset in: {ROOT / 'dataset'}\n"
        "  Each sub-folder = one class, containing .jpg images."
    )


# ── training ───────────────────────────────────────────────────────────────────
def train(data_dir: Path, args):
    import numpy as np
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras import layers, Model

    print("\n" + "=" * 60)
    print(f"  PlantVillage CNN  |  TF {tf.__version__}")
    print(f"  data_dir : {data_dir}")
    print(f"  output   : {ROOT}")
    print("=" * 60 + "\n")

    keras.utils.set_random_seed(args.seed)

    # datasets
    common = dict(
        directory=str(data_dir),
        validation_split=0.20,
        seed=args.seed,
        image_size=(224, 224),
        batch_size=args.batch_size,
        label_mode="int",
    )
    train_ds = keras.utils.image_dataset_from_directory(subset="training",   **common)
    val_ds   = keras.utils.image_dataset_from_directory(subset="validation", **common)

    class_names = train_ds.class_names
    num_classes = len(class_names)
    print(f"Classes : {num_classes}")
    if num_classes < 2:
        raise SystemExit("Need at least 2 classes.")

    classes_path = ROOT / "plant_disease_classes.json"
    classes_path.write_text(
        json.dumps({"class_names": class_names}, indent=2), encoding="utf-8"
    )
    print(f"Classes saved -> {classes_path}")

    AUTOTUNE = tf.data.AUTOTUNE
    train_ds = train_ds.prefetch(AUTOTUNE)
    val_ds   = val_ds.prefetch(AUTOTUNE)

    # class weights
    print("Computing class weights ...")
    counts = np.zeros(num_classes, dtype=np.int64)
    for _, lbls in train_ds:
        for lbl in lbls.numpy():
            counts[int(lbl)] += 1
    total_imgs = counts.sum()
    class_weights = {
        i: float(total_imgs / (num_classes * max(c, 1)))
        for i, c in enumerate(counts)
    }

    # model
    base = keras.applications.MobileNetV2(
        input_shape=(224, 224, 3), include_top=False, weights="imagenet"
    )
    base.trainable = False

    aug = keras.Sequential([
        layers.RandomFlip("horizontal"),
        layers.RandomRotation(0.15),
        layers.RandomZoom(0.15),
        layers.RandomBrightness(0.15),
        layers.RandomContrast(0.15),
    ], name="augmentation")

    inputs  = keras.Input(shape=(224, 224, 3), name="image_input")
    x       = aug(inputs)
    x       = keras.applications.mobilenet_v2.preprocess_input(x)
    x       = base(x, training=False)
    x       = layers.GlobalAveragePooling2D()(x)
    x       = layers.BatchNormalization()(x)
    x       = layers.Dropout(0.30)(x)
    x       = layers.Dense(256, activation="relu")(x)
    x       = layers.Dropout(0.20)(x)
    outputs = layers.Dense(num_classes, activation="softmax", name="predictions")(x)
    model   = Model(inputs, outputs)

    model_path = str(ROOT / "plant_disease_model.keras")

    # phase 1 - head only
    model.compile(
        optimizer=keras.optimizers.Adam(1e-3),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    cbs1 = [
        keras.callbacks.EarlyStopping(
            monitor="val_accuracy", patience=4, restore_best_weights=True, verbose=1),
        keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss", factor=0.5, patience=2, min_lr=1e-6, verbose=1),
        keras.callbacks.ModelCheckpoint(
            model_path, monitor="val_accuracy", save_best_only=True, verbose=1),
    ]
    print(f"\n-- Phase 1: head training (max {args.epochs_head} epochs) --")
    t0 = time.time()
    h1 = model.fit(
        train_ds, validation_data=val_ds,
        epochs=args.epochs_head, class_weight=class_weights,
        callbacks=cbs1, verbose=1,
    )

    # phase 2 - fine-tune
    base.trainable = True
    for layer in base.layers[:100]:
        layer.trainable = False

    model.compile(
        optimizer=keras.optimizers.Adam(1e-5),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    cbs2 = [
        keras.callbacks.EarlyStopping(
            monitor="val_accuracy", patience=5, restore_best_weights=True, verbose=1),
        keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss", factor=0.3, patience=2, min_lr=1e-7, verbose=1),
        keras.callbacks.ModelCheckpoint(
            model_path, monitor="val_accuracy", save_best_only=True, verbose=1),
    ]
    print(f"\n-- Phase 2: fine-tuning (max {args.epochs_finetune} epochs) --")
    h2 = model.fit(
        train_ds, validation_data=val_ds,
        epochs=args.epochs_finetune, class_weight=class_weights,
        callbacks=cbs2, verbose=1,
    )

    elapsed = time.time() - t0

    # evaluate
    loss, acc = model.evaluate(val_ds, verbose=0)
    print(f"\nFinal val accuracy : {acc*100:.2f}%")
    print(f"Final val loss     : {loss:.4f}")
    print(f"Training time      : {elapsed/60:.1f} min")

    # save report
    def _fl(v): return [float(x) for x in v] if v else []
    report = {
        "num_classes": num_classes,
        "val_accuracy": round(acc, 4),
        "val_loss": round(loss, 4),
        "training_time_min": round(elapsed / 60, 2),
        "phase1": {
            "accuracy":     _fl(h1.history.get("accuracy")),
            "val_accuracy": _fl(h1.history.get("val_accuracy")),
        },
        "phase2": {
            "accuracy":     _fl(h2.history.get("accuracy")),
            "val_accuracy": _fl(h2.history.get("val_accuracy")),
        },
    }
    (ROOT / "training_report.json").write_text(
        json.dumps(report, indent=2), encoding="utf-8"
    )
    print(f"Report saved -> {ROOT / 'training_report.json'}")

    # tflite export
    if not args.no_tflite:
        print("\nExporting TFLite model ...")
        tflite_path = ROOT / "plant_disease_model.tflite"
        try:
            converter = tf.lite.TFLiteConverter.from_keras_model(model)
            converter.optimizations = [tf.lite.Optimize.DEFAULT]
            converter.target_spec.supported_types = [tf.float16]
            tflite_bytes = converter.convert()
            tflite_path.write_bytes(tflite_bytes)
            print(f"TFLite saved -> {tflite_path}  ({len(tflite_bytes)//1024} KB)")
        except Exception as e:
            print(f"[WARN] TFLite export failed: {e} - Keras model still usable.")

    print("\n" + "=" * 60)
    print("  Training complete!")
    print(f"  Model    -> {model_path}")
    print(f"  Classes  -> {classes_path}")
    print(f"  Accuracy -> {acc*100:.2f}%")
    print("=" * 60 + "\n")


# ── CLI ────────────────────────────────────────────────────────────────────────
def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("--skip_download",   action="store_true")
    p.add_argument("--data_dir",        type=str, default=None,
                   help="Path to folder with class sub-folders (skips download)")
    p.add_argument("--epochs_head",     type=int, default=10)
    p.add_argument("--epochs_finetune", type=int, default=10)
    p.add_argument("--batch_size",      type=int, default=32)
    p.add_argument("--seed",            type=int, default=42)
    p.add_argument("--no_tflite",       action="store_true")
    return p.parse_args()


def main():
    args = parse_args()

    if args.data_dir:
        data_dir = Path(args.data_dir)
        if not data_dir.is_dir():
            raise SystemExit(f"[ERROR] --data_dir not found: {data_dir}")
    else:
        if not args.skip_download:
            download_dataset()
            extract_dataset()
        data_dir = find_data_dir()

    print(f"[OK] Dataset: {data_dir}")
    classes  = [d for d in data_dir.iterdir() if d.is_dir()]
    img_exts = {".jpg", ".jpeg", ".png"}
    imgs     = sum(
        len([f for f in c.iterdir() if f.suffix.lower() in img_exts])
        for c in classes
    )
    print(f"     {len(classes)} classes, {imgs:,} images\n")

    train(data_dir, args)


if __name__ == "__main__":
    main()
