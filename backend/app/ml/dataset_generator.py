"""
Agricultural Dataset Generator for AgriDirect
Generates realistic multi-year historical Agmarknet mandi price & arrival data
coupled with Open-Meteo style weather covariates (temperature, precipitation, humidity)
and realistic seasonal cycles & supply shocks for Indian agricultural markets.
"""

import os
import math
import random
import datetime
from typing import List, Dict, Any
import pandas as pd
import numpy as np

# Seed for reproducibility
random.seed(42)
np.random.seed(42)

COMMODITIES_CONFIG = {
    "Tomato": {
        "base_price": 28.0,
        "base_arrival": 850.0,  # quintals
        "volatility": 0.22,
        "spoilage_rate_per_day": 0.08,
        "peak_months": [11, 12, 1, 2],  # Rabi peak arrival
        "lean_months": [6, 7, 8],        # Monsoon lean supply
        "temp_sensitivity": 0.45,
        "rain_shock_factor": 1.35
    },
    "Onion": {
        "base_price": 32.0,
        "base_arrival": 1200.0,
        "volatility": 0.28,
        "spoilage_rate_per_day": 0.03,
        "peak_months": [1, 2, 3, 4],
        "lean_months": [8, 9, 10],
        "temp_sensitivity": 0.25,
        "rain_shock_factor": 1.40
    },
    "Potato": {
        "base_price": 20.0,
        "base_arrival": 2200.0,
        "volatility": 0.15,
        "spoilage_rate_per_day": 0.02,
        "peak_months": [2, 3, 4],
        "lean_months": [9, 10, 11],
        "temp_sensitivity": 0.20,
        "rain_shock_factor": 1.15
    },
    "Wheat": {
        "base_price": 24.5,
        "base_arrival": 3500.0,
        "volatility": 0.09,
        "spoilage_rate_per_day": 0.005,
        "peak_months": [4, 5, 6],
        "lean_months": [11, 12, 1],
        "temp_sensitivity": 0.10,
        "rain_shock_factor": 1.10
    },
    "Rice": {
        "base_price": 36.0,
        "base_arrival": 2800.0,
        "volatility": 0.08,
        "spoilage_rate_per_day": 0.005,
        "peak_months": [10, 11, 12, 1],
        "lean_months": [6, 7, 8],
        "temp_sensitivity": 0.12,
        "rain_shock_factor": 1.12
    },
    "Mustard": {
        "base_price": 54.0,
        "base_arrival": 600.0,
        "volatility": 0.14,
        "spoilage_rate_per_day": 0.008,
        "peak_months": [3, 4, 5],
        "lean_months": [9, 10, 11],
        "temp_sensitivity": 0.15,
        "rain_shock_factor": 1.18
    }
}

MANDIS_CONFIG = {
    "Ranchi": {
        "state": "Jharkhand",
        "district": "Ranchi",
        "lat": 23.3441,
        "lon": 85.3096,
        "price_multiplier": 1.00,
        "base_temp": 24.0,
        "monsoon_rain_intensity": 14.0
    },
    "Ramgarh": {
        "state": "Jharkhand",
        "district": "Ramgarh",
        "lat": 23.6332,
        "lon": 85.5139,
        "price_multiplier": 0.94,
        "base_temp": 24.5,
        "monsoon_rain_intensity": 13.5
    },
    "Kolkata": {
        "state": "West Bengal",
        "district": "Kolkata",
        "lat": 22.5726,
        "lon": 88.3639,
        "price_multiplier": 1.18,
        "base_temp": 27.0,
        "monsoon_rain_intensity": 18.0
    },
    "Patna": {
        "state": "Bihar",
        "district": "Patna",
        "lat": 25.5941,
        "lon": 85.1376,
        "price_multiplier": 1.05,
        "base_temp": 26.0,
        "monsoon_rain_intensity": 12.0
    },
    "Delhi": {
        "state": "Delhi",
        "district": "Azadpur",
        "lat": 28.7041,
        "lon": 77.1025,
        "price_multiplier": 1.12,
        "base_temp": 25.0,
        "monsoon_rain_intensity": 8.0
    },
    "Mumbai": {
        "state": "Maharashtra",
        "district": "Vashi",
        "lat": 19.0760,
        "lon": 72.8777,
        "price_multiplier": 1.22,
        "base_temp": 28.0,
        "monsoon_rain_intensity": 25.0
    }
}


def generate_agricultural_dataset(
    start_date: str = "2024-01-01",
    end_date: str = "2026-09-02",
    inject_outliers: bool = True
) -> pd.DataFrame:
    """
    Generates realistic daily Agmarknet records across commodities and mandis.
    """
    start = datetime.datetime.strptime(start_date, "%Y-%m-%d").date()
    end = datetime.datetime.strptime(end_date, "%Y-%m-%d").date()
    num_days = (end - start).days + 1

    records: List[Dict[str, Any]] = []

    for comm_name, comm_cfg in COMMODITIES_CONFIG.items():
        for mandi_name, mandi_cfg in MANDIS_CONFIG.items():
            base_p = comm_cfg["base_price"] * mandi_cfg["price_multiplier"]
            curr_p = base_p
            curr_arrival = comm_cfg["base_arrival"] * (1.0 if mandi_name in ["Ranchi", "Ramgarh", "Patna"] else 2.5)

            for d in range(num_days):
                curr_date = start + datetime.timedelta(days=d)
                month = curr_date.month
                day_of_year = curr_date.timetuple().tm_yday
                is_weekend = curr_date.weekday() >= 5

                # Seasonal Temperature
                temp_annual_cycle = math.sin(2 * math.pi * (day_of_year - 80) / 365.25)
                temp = mandi_cfg["base_temp"] + 9.0 * temp_annual_cycle + np.random.normal(0, 1.8)

                # Seasonal Monsoon Rainfall (June to Sept)
                is_monsoon = 1 if 6 <= month <= 9 else 0
                if is_monsoon:
                    rain_prob = 0.55
                    rain = float(np.random.exponential(mandi_cfg["monsoon_rain_intensity"])) if random.random() < rain_prob else 0.0
                    humidity = float(np.clip(75.0 + np.random.normal(0, 8.0) + (rain * 0.4), 45.0, 98.0))
                else:
                    rain_prob = 0.08
                    rain = float(np.random.exponential(1.5)) if random.random() < rain_prob else 0.0
                    humidity = float(np.clip(45.0 + np.random.normal(0, 10.0), 20.0, 85.0))

                # Supply / Arrival Seasonality
                if month in comm_cfg["peak_months"]:
                    arrival_factor = 1.45 + 0.25 * math.sin(math.pi * (month % 3) / 3)
                    price_seasonal_pressure = -0.18
                elif month in comm_cfg["lean_months"]:
                    arrival_factor = 0.60 + 0.15 * math.sin(math.pi * (month % 3) / 3)
                    price_seasonal_pressure = 0.22
                else:
                    arrival_factor = 1.0
                    price_seasonal_pressure = 0.0

                # Weather impacts
                temp_shock = 0.0
                if temp > 38.0 and comm_name in ["Tomato", "Onion"]:
                    temp_shock = 0.08

                rain_shock = 0.0
                if rain > 35.0:
                    rain_shock = 0.12 * comm_cfg["rain_shock_factor"]
                    arrival_factor *= 0.65

                # Mean-reverting random walk for price with momentum
                noise = np.random.normal(0, comm_cfg["volatility"] * 0.06)
                mean_reversion = 0.03 * (base_p * (1.0 + price_seasonal_pressure) - curr_p) / base_p
                
                pct_change = float(noise + mean_reversion + temp_shock + (rain_shock * 0.5))
                curr_p = curr_p * (1.0 + pct_change)
                curr_p = max(curr_p, base_p * 0.35)  # price floor

                # Daily arrivals
                arrival_noise = np.random.normal(0, 0.12)
                if is_weekend:
                    arrival_noise -= 0.20
                daily_arrival = max(10.0, curr_arrival * arrival_factor * (1.0 + arrival_noise))

                spread = curr_p * np.random.uniform(0.04, 0.12)
                modal_price = round(curr_p, 2)
                min_price = round(max(1.0, modal_price - spread * np.random.uniform(0.8, 1.2)), 2)
                max_price = round(modal_price + spread * np.random.uniform(0.8, 1.4), 2)

                if min_price > modal_price:
                    min_price = round(modal_price * 0.95, 2)
                if max_price < modal_price:
                    max_price = round(modal_price * 1.05, 2)

                record = {
                    "date": curr_date.strftime("%Y-%m-%d"),
                    "commodity": comm_name,
                    "state": mandi_cfg["state"],
                    "district": mandi_cfg["district"],
                    "market": mandi_name,
                    "arrival_quantity": round(daily_arrival, 1),
                    "min_price": min_price,
                    "max_price": max_price,
                    "modal_price": modal_price,
                    "temperature": round(temp, 1),
                    "rainfall": round(rain, 1),
                    "humidity": round(humidity, 1),
                    "is_monsoon": is_monsoon,
                    "variety": "Desi / Standard"
                }

                records.append(record)

    df = pd.DataFrame(records)

    if inject_outliers and len(df) > 100:
        anom_indices = np.random.choice(df.index, size=int(len(df) * 0.005), replace=False)
        for idx in anom_indices:
            anom_type = random.choice(["unit_error", "extreme_spike", "inverted_bounds", "missing_val"])
            if anom_type == "unit_error":
                df.at[idx, "modal_price"] = df.at[idx, "modal_price"] * 100.0
            elif anom_type == "extreme_spike":
                df.at[idx, "modal_price"] = df.at[idx, "modal_price"] * 4.5
            elif anom_type == "inverted_bounds":
                df.at[idx, "min_price"] = df.at[idx, "max_price"] + 15.0
            elif anom_type == "missing_val":
                df.at[idx, "arrival_quantity"] = np.nan

    return df


def save_default_datasets(output_dir: str):
    """Generates and saves the datasets to CSV."""
    os.makedirs(output_dir, exist_ok=True)
    df = generate_agricultural_dataset(start_date="2024-01-01", end_date="2026-09-02", inject_outliers=True)
    raw_path = os.path.join(output_dir, "agmarknet_historical_prices.csv")
    df.to_csv(raw_path, index=False)
    print(f"Generated {len(df)} records saved to {raw_path}")
    return df


if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_dir = os.path.abspath(os.path.join(current_dir, "../../../dataset"))
    save_default_datasets(dataset_dir)
