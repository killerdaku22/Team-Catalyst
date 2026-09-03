"""
Evaluation Metrics for Agricultural Price Forecasting
Implements MAE, RMSE, sMAPE, Directional Accuracy, and Confidence Interval Coverage.
"""

from typing import Dict, Any, List
import numpy as np


class ForecastEvaluator:
    """
    Computes standard and domain-specific time-series evaluation metrics.
    """

    @staticmethod
    def mae(y_true: np.ndarray, y_pred: np.ndarray) -> float:
        """Mean Absolute Error in Rs/Kg."""
        return float(np.mean(np.abs(y_true - y_pred)))

    @staticmethod
    def rmse(y_true: np.ndarray, y_pred: np.ndarray) -> float:
        """Root Mean Squared Error."""
        return float(np.sqrt(np.mean((y_true - y_pred) ** 2)))

    @staticmethod
    def smape(y_true: np.ndarray, y_pred: np.ndarray) -> float:
        """
        Symmetric Mean Absolute Percentage Error (0% - 200%).
        sMAPE = 100 * mean( 2 * |y - y_hat| / (|y| + |y_hat| + eps) )
        """
        denominator = (np.abs(y_true) + np.abs(y_pred)) / 2.0 + 1e-8
        return float(np.mean(np.abs(y_true - y_pred) / denominator) * 100.0)

    @staticmethod
    def directional_accuracy(y_true: np.ndarray, y_pred: np.ndarray, y_baseline: np.ndarray) -> float:
        """
        Calculates % of instances where the model correctly predicted whether the price
        would move UP or DOWN relative to baseline price P(t).
        """
        if len(y_true) == 0:
            return 0.0
        true_direction = np.sign(y_true - y_baseline)
        pred_direction = np.sign(y_pred - y_baseline)
        correct_matches = np.sum(true_direction == pred_direction)
        return float((correct_matches / len(y_true)) * 100.0)

    @classmethod
    def evaluate_all(
        cls, y_true: np.ndarray, y_pred: np.ndarray, y_baseline: np.ndarray
    ) -> Dict[str, float]:
        """Calculates comprehensive dictionary of performance metrics."""
        y_true = np.asarray(y_true, dtype=float)
        y_pred = np.asarray(y_pred, dtype=float)
        y_baseline = np.asarray(y_baseline, dtype=float)

        if len(y_true) == 0:
            return {
                "mae": 0.0,
                "rmse": 0.0,
                "smape": 0.0,
                "directional_accuracy": 0.0,
            }

        return {
            "mae": round(cls.mae(y_true, y_pred), 3),
            "rmse": round(cls.rmse(y_true, y_pred), 3),
            "smape": round(cls.smape(y_true, y_pred), 2),
            "directional_accuracy": round(cls.directional_accuracy(y_true, y_pred, y_baseline), 1),
        }
