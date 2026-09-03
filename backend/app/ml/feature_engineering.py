"""
Feature Engineering Engine for Agricultural Price Forecasting
Generates lag features, rolling statistics, momentum indicators, weather covariates,
calendar seasonality, and cross-mandi spatial features.
"""

from typing import List, Tuple, Optional
import numpy as np
import pandas as pd


class AgriculturalFeatureEngineer:
    """
    Constructs time-series and tabular features for agricultural price prediction.
    Strictly prevents lookahead bias (future data leakage).
    """

    PRICE_LAGS = [1, 2, 3, 7, 14, 30]
    ROLLING_WINDOWS = [3, 7, 14, 30]
    ARRIVAL_LAGS = [1, 7]

    def __init__(self):
        self.feature_columns: List[str] = []

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Transforms clean market dataset into feature-engineered panel dataframe.
        """
        df = df.copy()
        df["date"] = pd.to_datetime(df["date"])
        df = df.sort_values(by=["commodity", "market", "date"]).reset_index(drop=True)

        feature_dfs = []

        # 1. Group-level time series features (per commodity & market)
        for (comm, market), group in df.groupby(["commodity", "market"]):
            group = group.copy()

            # A. Price Lags
            for lag in self.PRICE_LAGS:
                group[f"price_lag_{lag}"] = group["modal_price"].shift(lag)

            # B. Price Rolling Statistics (shifted by 1 to prevent lookahead)
            shifted_price = group["modal_price"].shift(1)
            for window in self.ROLLING_WINDOWS:
                group[f"rolling_mean_{window}"] = shifted_price.rolling(window=window, min_periods=1).mean()
                group[f"rolling_std_{window}"] = (
                    shifted_price.rolling(window=window, min_periods=1).std().fillna(0.0)
                )

            # Rolling Volatility (std / mean)
            group["volatility_7d"] = (
                group["rolling_std_7"] / group["rolling_mean_7"].replace(0, np.nan)
            ).fillna(0.0)

            # C. Price Momentum & Percentage Changes
            group["price_change_1d_pct"] = (
                (group["price_lag_1"] - group["price_lag_2"]) / group["price_lag_2"].replace(0, np.nan)
            ).fillna(0.0)
            group["price_change_7d_pct"] = (
                (group["price_lag_1"] - group["price_lag_7"]) / group["price_lag_7"].replace(0, np.nan)
            ).fillna(0.0)

            # D. Arrival Lags & Arrival Momentum
            for lag in self.ARRIVAL_LAGS:
                group[f"arrival_lag_{lag}"] = group["arrival_quantity"].shift(lag)

            shifted_arrival = group["arrival_quantity"].shift(1)
            group["arrival_rolling_mean_7"] = shifted_arrival.rolling(window=7, min_periods=1).mean()
            group["arrival_change_7d_pct"] = (
                (group["arrival_lag_1"] - group["arrival_lag_7"]) / group["arrival_lag_7"].replace(0, np.nan)
            ).fillna(0.0)

            # E. Weather Covariates (Shifted to reflect recent/forecast weather)
            group["temp_lag_1"] = group["temperature"].shift(1).fillna(group["temperature"])
            group["rainfall_lag_1"] = group["rainfall"].shift(1).fillna(0.0)
            group["rainfall_rolling_sum_3"] = (
                group["rainfall"].shift(1).rolling(window=3, min_periods=1).sum().fillna(0.0)
            )
            group["humidity_lag_1"] = group["humidity"].shift(1).fillna(group["humidity"])

            # Heat wave & Deluge flags
            group["is_heatwave"] = (group["temp_lag_1"] >= 38.0).astype(int)
            group["is_heavy_rain"] = (group["rainfall_rolling_sum_3"] >= 35.0).astype(int)

            feature_dfs.append(group)

        featured_df = pd.concat(feature_dfs, ignore_index=True)

        # 2. Cross-Mandi Spatial Spreads (Average price of same commodity across other mandis on same date)
        mandi_daily_avg = (
            featured_df.groupby(["commodity", "date"])["modal_price"]
            .mean()
            .reset_index()
            .rename(columns={"modal_price": "national_benchmark_price"})
        )
        featured_df = pd.merge(featured_df, mandi_daily_avg, on=["commodity", "date"], how="left")
        featured_df["benchmark_lag_1"] = (
            featured_df.groupby(["commodity", "market"])["national_benchmark_price"].shift(1)
        )
        featured_df["spatial_price_spread"] = (
            featured_df["price_lag_1"] - featured_df["benchmark_lag_1"]
        ).fillna(0.0)

        # 3. Calendar & Seasonality Features
        dates = pd.to_datetime(featured_df["date"])
        featured_df["month"] = dates.dt.month
        featured_df["day_of_week"] = dates.dt.dayofweek
        featured_df["day_of_year"] = dates.dt.dayofyear
        featured_df["is_weekend"] = (dates.dt.dayofweek >= 5).astype(int)

        # Cyclical Sine/Cosine encodings for annual and weekly periods
        featured_df["sin_day_of_year"] = np.sin(2 * np.pi * featured_df["day_of_year"] / 365.25)
        featured_df["cos_day_of_year"] = np.cos(2 * np.pi * featured_df["day_of_year"] / 365.25)
        featured_df["sin_month"] = np.sin(2 * np.pi * featured_df["month"] / 12.0)
        featured_df["cos_month"] = np.cos(2 * np.pi * featured_df["month"] / 12.0)

        # 4. Multi-Horizon Future Targets: t+1, t+3, t+7, t+14
        for horizon in [1, 3, 7, 14]:
            featured_df[f"target_price_{horizon}d"] = (
                featured_df.groupby(["commodity", "market"])["modal_price"].shift(-horizon)
            )

        # Identify numeric feature columns
        exclude_cols = [
            "date", "commodity", "state", "district", "market", "variety",
            "min_price", "max_price", "modal_price", "arrival_quantity",
            "is_outlier", "national_benchmark_price",
            "target_price_1d", "target_price_3d", "target_price_7d", "target_price_14d"
        ]
        self.feature_columns = [col for col in featured_df.columns if col not in exclude_cols]

        return featured_df

    def get_feature_matrix(
        self, df: pd.DataFrame, target_horizon: int = 1
    ) -> Tuple[pd.DataFrame, pd.Series, List[str]]:
        """
        Extracts clean feature matrix X and target y for a specific forecast horizon.
        Drops rows with NaN caused by lagging or target shift.
        """
        target_col = f"target_price_{target_horizon}d"
        if target_col not in df.columns:
            raise ValueError(f"Target column {target_col} not found in dataframe.")

        valid_mask = df[target_col].notnull() & df[self.feature_columns].notnull().all(axis=1)
        valid_df = df[valid_mask].copy()

        X = valid_df[self.feature_columns]
        y = valid_df[target_col]
        return X, y, self.feature_columns
