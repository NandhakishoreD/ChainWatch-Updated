"""
ML Correlation Model for supply chain risk analysis.

Uses scikit-learn to perform cross-factor correlation analysis on
news, weather, and port congestion data. Provides:
1. Risk Score Prediction (Ridge Regression)
2. Delay Estimation (Random Forest Regressor)
3. Feature Correlation Analysis
"""

import pickle
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.linear_model import Ridge
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import cross_val_score
from backend.services.data_logger import load_history


MODEL_DIR = Path(__file__).parent
MODEL_FILE = MODEL_DIR / "model.pkl"

# Feature columns used for training and prediction
FEATURE_COLUMNS = [
    "news_severity",
    "weather_severity",
    "port_severity",
    "vessel_count",
    "avg_speed",
    "wind_speed_kmh",
    "rainfall_mm",
    "temperature_c",
    "moored_count",
    "stationary_count",
]

# Minimum number of records required to train a model
MIN_TRAINING_RECORDS = 30


class CorrelationModel:
    """ML model for cross-factor supply chain risk correlation analysis."""

    def __init__(self):
        self.risk_model: Ridge | None = None
        self.delay_model: RandomForestRegressor | None = None
        self.scaler: StandardScaler | None = None
        self.correlation_matrix: pd.DataFrame | None = None
        self.feature_importances: dict | None = None
        self.is_trained: bool = False
        self.training_samples: int = 0
        self.cv_risk_score: float = 0.0
        self.cv_delay_score: float = 0.0

        # Try to load a saved model on init
        self._load_model()

    def _load_model(self):
        """Load a previously trained model from disk."""
        if MODEL_FILE.exists():
            try:
                with open(MODEL_FILE, "rb") as f:
                    saved = pickle.load(f)
                self.risk_model = saved["risk_model"]
                self.delay_model = saved["delay_model"]
                self.scaler = saved["scaler"]
                self.correlation_matrix = saved.get("correlation_matrix")
                self.feature_importances = saved.get("feature_importances")
                self.is_trained = True
                self.training_samples = saved.get("training_samples", 0)
                self.cv_risk_score = saved.get("cv_risk_score", 0.0)
                self.cv_delay_score = saved.get("cv_delay_score", 0.0)
                print(f"[ML] Loaded model trained on {self.training_samples} samples")
            except Exception as e:
                print(f"[ML] Failed to load model: {e}")
                self.is_trained = False

    def _save_model(self):
        """Save the trained model to disk."""
        MODEL_DIR.mkdir(parents=True, exist_ok=True)
        data = {
            "risk_model": self.risk_model,
            "delay_model": self.delay_model,
            "scaler": self.scaler,
            "correlation_matrix": self.correlation_matrix,
            "feature_importances": self.feature_importances,
            "training_samples": self.training_samples,
            "cv_risk_score": self.cv_risk_score,
            "cv_delay_score": self.cv_delay_score,
        }
        with open(MODEL_FILE, "wb") as f:
            pickle.dump(data, f)
        print(f"[ML] Saved model to {MODEL_FILE}")

    def _prepare_dataframe(self, records: list[dict]) -> pd.DataFrame:
        """Convert raw records to a clean DataFrame with numeric features."""
        df = pd.DataFrame(records)

        # Ensure all feature columns exist with defaults
        for col in FEATURE_COLUMNS:
            if col not in df.columns:
                df[col] = 0.0

        # Fill missing values
        df[FEATURE_COLUMNS] = df[FEATURE_COLUMNS].fillna(0.0)

        # Ensure numeric types
        for col in FEATURE_COLUMNS:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0.0)

        return df

    def train(self, records: list[dict] | None = None) -> dict:
        """
        Train the ML models on historical data.

        Args:
            records: Optional list of training records. If None, loads from history.

        Returns:
            Training summary dict with metrics.
        """
        if records is None:
            records = load_history()

        if len(records) < MIN_TRAINING_RECORDS:
            return {
                "status": "insufficient_data",
                "records": len(records),
                "required": MIN_TRAINING_RECORDS,
            }

        df = self._prepare_dataframe(records)
        self.training_samples = len(df)

        # Prepare features
        X = df[FEATURE_COLUMNS].values

        # Target: risk score
        y_risk = df["heuristic_risk_score"].values if "heuristic_risk_score" in df.columns else np.ones(len(df))
        y_risk = np.clip(y_risk, 1.0, 5.0)

        # Target: delay hours
        y_delay = df["avg_delay_hours"].values if "avg_delay_hours" in df.columns else np.zeros(len(df))
        y_delay = np.clip(y_delay, 0, 500)

        # Scale features
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)

        # 1. Train Risk Score Predictor (Ridge Regression)
        self.risk_model = Ridge(alpha=1.0)
        self.risk_model.fit(X_scaled, y_risk)

        # Cross-validation scores
        cv_risk = cross_val_score(Ridge(alpha=1.0), X_scaled, y_risk, cv=min(5, len(X)), scoring="r2")
        self.cv_risk_score = float(np.mean(cv_risk))

        # 2. Train Delay Estimator (Random Forest)
        self.delay_model = RandomForestRegressor(
            n_estimators=100,
            max_depth=8,
            random_state=42,
            min_samples_split=5,
        )
        self.delay_model.fit(X_scaled, y_delay)

        cv_delay = cross_val_score(
            RandomForestRegressor(n_estimators=50, max_depth=8, random_state=42, min_samples_split=5),
            X_scaled, y_delay, cv=min(5, len(X)), scoring="r2",
        )
        self.cv_delay_score = float(np.mean(cv_delay))

        # 3. Compute correlation matrix
        feature_df = df[FEATURE_COLUMNS].copy()
        feature_df["risk_score"] = y_risk
        feature_df["delay_hours"] = y_delay
        self.correlation_matrix = feature_df.corr()

        # 4. Extract feature importances from Random Forest
        importances = self.delay_model.feature_importances_
        self.feature_importances = {
            FEATURE_COLUMNS[i]: round(float(importances[i]) * 100, 1)
            for i in range(len(FEATURE_COLUMNS))
        }

        self.is_trained = True
        self._save_model()

        return {
            "status": "trained",
            "training_samples": self.training_samples,
            "risk_model_r2": round(self.cv_risk_score, 3),
            "delay_model_r2": round(self.cv_delay_score, 3),
            "feature_importances": self.feature_importances,
        }

    def predict(self, features: dict) -> dict | None:
        """
        Run ML prediction on a single data point.

        Args:
            features: dict with keys matching FEATURE_COLUMNS

        Returns:
            dict with ml_risk_score, ml_delay_hours, correlations, etc.
            Returns None if model is not trained.
        """
        if not self.is_trained:
            return None

        # Build feature vector
        feature_vector = np.array(
            [[features.get(col, 0.0) for col in FEATURE_COLUMNS]],
            dtype=np.float64,
        )

        # Handle NaN values
        feature_vector = np.nan_to_num(feature_vector, nan=0.0)

        # Scale
        X_scaled = self.scaler.transform(feature_vector)

        # Predict risk score
        risk_score = float(self.risk_model.predict(X_scaled)[0])
        risk_score = round(max(1.0, min(5.0, risk_score)), 2)

        # Predict delay
        delay_hours = float(self.delay_model.predict(X_scaled)[0])
        delay_hours = round(max(0, delay_hours), 1)

        # Risk level
        if risk_score < 2.5:
            risk_level = "Low"
        elif risk_score < 3.5:
            risk_level = "Medium"
        else:
            risk_level = "High"

        # Get top correlations with risk_score
        top_correlations = self._get_top_correlations()

        # Confidence based on training data size
        confidence = min(1.0, self.training_samples / 200)

        return {
            "ml_risk_score": risk_score,
            "ml_delay_hours": delay_hours,
            "ml_risk_level": risk_level,
            "top_correlations": top_correlations,
            "feature_importances": self.feature_importances or {},
            "confidence": round(confidence, 2),
            "training_samples": self.training_samples,
            "model_r2_risk": round(self.cv_risk_score, 3),
            "model_r2_delay": round(self.cv_delay_score, 3),
        }

    def _get_top_correlations(self, n: int = 5) -> list[dict]:
        """Extract top N cross-factor correlations from the correlation matrix."""
        if self.correlation_matrix is None:
            return []

        corr = self.correlation_matrix.copy()
        top = []

        # Get upper triangle (avoid duplicates and self-correlation)
        for i, col1 in enumerate(corr.columns):
            for j, col2 in enumerate(corr.columns):
                if j <= i:
                    continue
                val = corr.iloc[i, j]
                if not np.isnan(val) and abs(val) > 0.1:
                    top.append({
                        "factor_1": col1,
                        "factor_2": col2,
                        "correlation": round(float(val), 3),
                        "strength": "strong" if abs(val) > 0.6 else ("moderate" if abs(val) > 0.3 else "weak"),
                    })

        # Sort by absolute correlation value
        top.sort(key=lambda x: abs(x["correlation"]), reverse=True)
        return top[:n]

    def get_status(self) -> dict:
        """Get current model status."""
        return {
            "is_trained": self.is_trained,
            "training_samples": self.training_samples,
            "model_r2_risk": round(self.cv_risk_score, 3) if self.is_trained else None,
            "model_r2_delay": round(self.cv_delay_score, 3) if self.is_trained else None,
            "feature_importances": self.feature_importances,
        }


# Module-level singleton so the model is shared across the app
_model_instance: CorrelationModel | None = None


def get_model() -> CorrelationModel:
    """Get or create the singleton model instance."""
    global _model_instance
    if _model_instance is None:
        _model_instance = CorrelationModel()
    return _model_instance


def train_model_if_needed() -> dict:
    """Train the model from history data if it hasn't been trained yet."""
    model = get_model()
    if not model.is_trained:
        records = load_history()
        if len(records) >= MIN_TRAINING_RECORDS:
            return model.train(records)
        else:
            return {"status": "insufficient_data", "records": len(records), "required": MIN_TRAINING_RECORDS}
    return model.get_status()
