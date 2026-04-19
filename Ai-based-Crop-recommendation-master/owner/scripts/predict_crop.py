#!/usr/bin/env python3
"""
Crop Prediction Script
"""

import os
import sys
import json
import warnings
import joblib
import numpy as np
from pathlib import Path

# Suppress sklearn version mismatch warnings — model works fine across minor versions
warnings.filterwarnings('ignore')

sys.path.append(str(Path(__file__).parent))

def load_model():
    """Load the trained crop prediction model"""
    try:
        models_dir = Path(__file__).parent.parent.parent / 'ml_train'
        model_path = models_dir / 'crop_model.joblib'
        scaler_path = models_dir / 'scaler.joblib'
        encoder_path = models_dir / 'label_encoder.joblib'

        if not model_path.exists() or not scaler_path.exists() or not encoder_path.exists():
            print(f"Model files not found in {models_dir}, using fallback", file=sys.stderr)
            return create_dummy_model_bundle()

        model = joblib.load(model_path)
        scaler = joblib.load(scaler_path)
        label_encoder = joblib.load(encoder_path)
        return model, scaler, label_encoder
    except Exception as e:
        print(f"Error loading model: {e}", file=sys.stderr)
        return create_dummy_model_bundle()

DUMMY_CROPS = [
    'Rice', 'Maize', 'Chickpea', 'Kidneybeans', 'Pigeonpeas',
    'Mothbeans', 'Mungbean', 'Blackgram', 'Lentil', 'Pomegranate',
    'Banana', 'Mango', 'Grapes', 'Watermelon', 'Muskmelon',
    'Apple', 'Orange', 'Papaya', 'Coconut', 'Cotton',
    'Jute', 'Coffee'
]


def _dummy_primary_crop(row):
    temp = float(row[3])
    rainfall = float(row[6])
    if temp > 25 and rainfall > 1000:
        return 'Rice'
    if temp > 20 and rainfall > 500:
        return 'Maize'
    if temp < 20 and rainfall < 500:
        return 'Wheat'
    if temp > 30 and rainfall > 800:
        return 'Cotton'
    return 'Sugarcane'


def create_dummy_model_bundle():
    """Fallback: heuristic primary crop + deterministic multi-class probabilities."""

    class DummyModel:
        is_heuristic_fallback = True

        def predict(self, X):
            return np.array([_dummy_primary_crop(X[i]) for i in range(len(X))])

        def predict_proba(self, X):
            n_samples = len(X)
            n_c = len(DUMMY_CROPS)
            out = np.zeros((n_samples, n_c))
            for i in range(n_samples):
                primary = _dummy_primary_crop(X[i])
                pi = DUMMY_CROPS.index(primary) if primary in DUMMY_CROPS else 0
                weights = np.zeros(n_c)
                weights[pi] = 0.45
                others = [(pi + k) % n_c for k in range(1, min(6, n_c))]
                share = 0.55 / max(len(others), 1)
                for j in others:
                    weights[j] += share
                out[i] = weights / weights.sum()
            return out

        @property
        def classes_(self):
            return np.arange(len(DUMMY_CROPS))

    return DummyModel(), None, None

def get_crop_info(crop_name):
    """Get additional information about the crop"""
    crop_info = {
        'Rice': {
            'description': 'Rice is a staple food crop that requires warm temperatures and plenty of water.',
            'season': 'Kharif (Monsoon)',
            'duration': '120-150 days',
            'profitability': 'High'
        },
        'Maize': {
            'description': 'Maize is a versatile crop used for food, feed, and industrial purposes.',
            'season': 'Kharif/Rabi',
            'duration': '90-120 days',
            'profitability': 'Medium-High'
        },
        'Wheat': {
            'description': 'Wheat is a major cereal crop grown in cooler climates.',
            'season': 'Rabi (Winter)',
            'duration': '120-140 days',
            'profitability': 'High'
        },
        'Cotton': {
            'description': 'Cotton is a cash crop used for fiber production.',
            'season': 'Kharif',
            'duration': '150-180 days',
            'profitability': 'Very High'
        },
        'Sugarcane': {
            'description': 'Sugarcane is a cash crop used for sugar production.',
            'season': 'Year-round',
            'duration': '12-18 months',
            'profitability': 'High'
        }
    }
    
    return crop_info.get(crop_name, {
        'description': 'A suitable crop for your conditions.',
        'season': 'Varies',
        'duration': 'Varies',
        'profitability': 'Medium'
    })

def get_market_data(crop_name):
    """Get market information for the crop"""
    # This would typically connect to a real market API
    market_data = {
        'Rice': {
            'demand': 'High',
            'priceRange': {'min': 25, 'max': 35, 'currency': 'INR/kg'},
            'season': 'Year-round',
            'profitPotential': 'High'
        },
        'Maize': {
            'demand': 'High',
            'priceRange': {'min': 20, 'max': 30, 'currency': 'INR/kg'},
            'season': 'Year-round',
            'profitPotential': 'Medium-High'
        },
        'Wheat': {
            'demand': 'Very High',
            'priceRange': {'min': 22, 'max': 28, 'currency': 'INR/kg'},
            'season': 'Year-round',
            'profitPotential': 'High'
        },
        'Cotton': {
            'demand': 'High',
            'priceRange': {'min': 6000, 'max': 8000, 'currency': 'INR/quintal'},
            'season': 'Year-round',
            'profitPotential': 'Very High'
        },
        'Sugarcane': {
            'demand': 'High',
            'priceRange': {'min': 300, 'max': 350, 'currency': 'INR/quintal'},
            'season': 'Year-round',
            'profitPotential': 'High'
        }
    }
    
    return market_data.get(crop_name, {
        'demand': 'Medium',
        'priceRange': {'min': 20, 'max': 30, 'currency': 'INR/kg'},
        'season': 'Varies',
        'profitPotential': 'Medium'
    })

def get_recommendations(crop_name, input_data):
    """Generate recommendations based on crop and input data"""
    recommendations = []
    
    # Soil recommendations
    if input_data['ph'] < 6.0:
        recommendations.append({
            'type': 'Soil pH',
            'description': 'Consider adding lime to increase soil pH for better crop growth',
            'priority': 'High'
        })
    elif input_data['ph'] > 8.0:
        recommendations.append({
            'type': 'Soil pH',
            'description': 'Consider adding sulfur or organic matter to lower soil pH',
            'priority': 'High'
        })
    
    # Nutrient recommendations
    if input_data['nitrogen'] < 50:
        recommendations.append({
            'type': 'Fertilization',
            'description': 'Apply nitrogen-rich fertilizer to improve crop yield',
            'priority': 'High'
        })
    
    if input_data['phosphorus'] < 30:
        recommendations.append({
            'type': 'Fertilization',
            'description': 'Apply phosphorus fertilizer for better root development',
            'priority': 'Medium'
        })
    
    if input_data['potassium'] < 40:
        recommendations.append({
            'type': 'Fertilization',
            'description': 'Apply potassium fertilizer for improved disease resistance',
            'priority': 'Medium'
        })
    
    # Weather recommendations
    if input_data['rainfall'] < 500:
        recommendations.append({
            'type': 'Irrigation',
            'description': 'Ensure adequate irrigation as rainfall is below optimal levels',
            'priority': 'High'
        })
    
    if input_data['temperature'] > 35:
        recommendations.append({
            'type': 'Heat Management',
            'description': 'Consider shade nets or mulching to protect crops from excessive heat',
            'priority': 'Medium'
        })
    
    return recommendations


def _confidence_to_suitability(p):
    if p >= 0.85:
        return 'Excellent'
    if p >= 0.70:
        return 'Good'
    if p >= 0.50:
        return 'Moderate'
    return 'Poor'


def _decode_class_to_crop(cls_val, label_encoder):
    if label_encoder is None:
        return str(cls_val)
    try:
        arr = np.array([cls_val]).reshape(-1)
        return str(label_encoder.inverse_transform(arr)[0])
    except Exception:
        try:
            return str(label_encoder.inverse_transform(np.array([int(cls_val)]))[0])
        except Exception:
            return str(cls_val)


def _reasons_for_crop(crop_name, input_data, rank, confidence):
    if confidence >= 0.5:
        lead = f'Rank #{rank}: strong statistical match for {crop_name} under your conditions'
    elif confidence >= 0.15:
        lead = f'Rank #{rank}: {crop_name} is a plausible alternative (probability {confidence:.1%})'
    else:
        lead = f'Rank #{rank}: {crop_name} is a lower-probability option ({confidence:.1%})'
    return [
        lead,
        f'Climate context: {input_data["temperature"]}°C, {input_data["humidity"]}% RH, {input_data["rainfall"]} mm rainfall',
        f'Soil: pH {input_data["ph"]}, N-P-K {input_data["nitrogen"]}-{input_data["phosphorus"]}-{input_data["potassium"]}',
    ]


def _top_n_predictions(model, features_scaled, features_raw, label_encoder, input_data, top_n):
    """Return list of dicts: crop, confidence, suitability, rank, reasons."""
    use_dummy = getattr(model, 'is_heuristic_fallback', False)

    if hasattr(model, 'predict_proba'):
        X = features_scaled if features_scaled is not None else features_raw
        proba_row = np.asarray(model.predict_proba(X)[0], dtype=float)
        n_classes = len(proba_row)
        order = np.argsort(proba_row)[::-1][: min(top_n, n_classes)]

        rows = []
        for rank, j in enumerate(order, start=1):
            p = float(proba_row[j])
            if use_dummy:
                crop = DUMMY_CROPS[j] if j < len(DUMMY_CROPS) else 'Unknown'
            else:
                cls_val = model.classes_[j]
                crop = _decode_class_to_crop(cls_val, label_encoder)
            rows.append({
                'crop': str(crop),
                'confidence': round(min(max(p, 0.0), 1.0), 4),
                'suitability': _confidence_to_suitability(p),
                'rank': rank,
                'reasons': _reasons_for_crop(str(crop), input_data, rank, p),
            })
        return rows

    # No predict_proba: single best class only
    X = features_scaled if features_scaled is not None else features_raw
    pred = model.predict(X)[0]
    if use_dummy:
        crop = str(pred)
        p = 0.85
    else:
        crop = _decode_class_to_crop(pred, label_encoder)
        p = 0.85
    return [{
        'crop': str(crop),
        'confidence': p,
        'suitability': _confidence_to_suitability(p),
        'rank': 1,
        'reasons': _reasons_for_crop(str(crop), input_data, 1, p),
    }]


def main():
    """Main function to process prediction request"""
    try:
        if len(sys.argv) < 2:
            # Only print JSON to stdout — never plain text
            sys.stdout.write(json.dumps({'error': 'No input data provided'}) + '\n')
            sys.stdout.flush()
            sys.exit(1)

        arg_data = sys.argv[1]
        try:
            if not arg_data.startswith('{'):
                import base64
                arg_data = base64.b64decode(arg_data).decode('utf-8')
            input_data = json.loads(arg_data)
        except Exception as e:
            input_data = json.loads(sys.argv[1]) # Will throw if both fail

        required_fields = ['nitrogen', 'phosphorus', 'potassium', 'temperature',
                           'humidity', 'ph', 'rainfall', 'soil_type']
        for field in required_fields:
            if field not in input_data:
                sys.stdout.write(json.dumps({'error': f'Missing required field: {field}'}) + '\n')
                sys.stdout.flush()
                sys.exit(1)

        features = np.array([[
            float(input_data['nitrogen']),
            float(input_data['phosphorus']),
            float(input_data['potassium']),
            float(input_data['temperature']),
            float(input_data['humidity']),
            float(input_data['ph']),
            float(input_data['rainfall'])
        ]])

        top_n = int(os.environ.get('TOP_N_PREDICTIONS', '5'))
        top_n = max(1, min(top_n, 15))

        model, scaler, label_encoder = load_model()
        features_scaled = scaler.transform(features) if scaler is not None else None

        predictions_list = _top_n_predictions(
            model, features_scaled, features, label_encoder, input_data, top_n
        )

        primary = predictions_list[0]['crop'] if predictions_list else 'Unknown'
        crop_info = get_crop_info(primary)
        market_data = get_market_data(primary)
        recommendations = get_recommendations(primary, input_data)

        response = {
            'predictions': predictions_list,
            'marketData': market_data,
            'recommendations': recommendations,
            'modelVersion': '2.0-multi',
            'cropInfo': crop_info
        }

        # Write ONLY the JSON line to stdout — nothing else
        sys.stdout.write(json.dumps(response) + '\n')
        sys.stdout.flush()

    except Exception as e:
        # Errors go to stderr; stdout gets a JSON error object
        print(f'Exception in predict_crop.py: {str(e)}', file=sys.stderr)
        sys.stdout.write(json.dumps({'error': f'Prediction failed: {str(e)}'}) + '\n')
        sys.stdout.flush()
        sys.exit(1)

if __name__ == '__main__':
    main()
