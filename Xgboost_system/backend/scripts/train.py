import pandas as pd
import numpy as np
import xgboost as xgb
import optuna
import joblib
from sklearn.cluster import KMeans
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score
import os

print("Loading dataset...")
df = pd.read_csv('data/processed_train.csv')

print("Applying Cyclical Time Encoding...")
df['time_sin'] = np.sin(2 * np.pi * df['timestamp'] / 24.0)
df['time_cos'] = np.cos(2 * np.pi * df['timestamp'] / 24.0)
df['day_sin'] = np.sin(2 * np.pi * (df['day'] % 7) / 7.0)
df['day_cos'] = np.cos(2 * np.pi * (df['day'] % 7) / 7.0)

print("Running K-Means Clustering on Geohashes...")
geohash_profile = df.groupby('geohash')['demand'].mean().reset_index()
kmeans = KMeans(n_clusters=4, random_state=42, n_init=10)
geohash_profile['cluster_id'] = kmeans.fit_predict(geohash_profile[['demand']])
df = df.merge(geohash_profile[['geohash', 'cluster_id']], on='geohash', how='left')

print("Encoding categorical features...")
cat_features = ['RoadType', 'LargeVehicles', 'Landmarks', 'Weather']
encoders = {}
for col in cat_features:
    le = LabelEncoder()
    df[col] = df[col].astype(str)
    df[col] = le.fit_transform(df[col])
    encoders[col] = le

os.makedirs('model', exist_ok=True)
print("Saving Spatial Index for Broadcasting...")
static_cols = ['geohash', 'lat', 'lon', 'RoadType', 'NumberofLanes', 'LargeVehicles', 'Landmarks', 'cluster_id']
spatial_index = df[static_cols].drop_duplicates('geohash').set_index('geohash')
spatial_index.to_csv('model/spatial_index.csv', index=True)

import json
encoder_mappings = {col: list(le.classes_) for col, le in encoders.items()}
with open('model/encoder_mappings.json', 'w') as f:
    json.dump(encoder_mappings, f)

print("Preparing data for XGBoost...")
features = ['time_sin', 'time_cos', 'day_sin', 'day_cos', 'Temperature', 'Weather', 
            'RoadType', 'NumberofLanes', 'LargeVehicles', 'Landmarks', 'cluster_id', 'lat', 'lon']
X = df[features]
y = df['demand']

X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)

def objective(trial):
    param = {
        'max_depth': trial.suggest_int('max_depth', 3, 7),
        'learning_rate': trial.suggest_float('learning_rate', 0.05, 0.3),
        'n_estimators': trial.suggest_int('n_estimators', 50, 150),
        'subsample': trial.suggest_float('subsample', 0.8, 1.0),
        'colsample_bytree': trial.suggest_float('colsample_bytree', 0.8, 1.0)
    }
    model = xgb.XGBRegressor(**param, random_state=42, objective='reg:squarederror', n_jobs=-1)
    model.fit(X_train, y_train)
    preds = model.predict(X_val)
    return r2_score(y_val, preds)

print("Running Optuna for hyperparameter tuning...")
study = optuna.create_study(direction='maximize')
study.optimize(objective, n_trials=3)

print(f"Best trial R2: {study.best_value}")
print(f"Best params: {study.best_params}")

print("Training final model...")
best_model = xgb.XGBRegressor(**study.best_params, random_state=42, objective='reg:squarederror', n_jobs=-1)
best_model.fit(X_train, y_train)
val_preds = best_model.predict(X_val)
final_r2 = r2_score(y_val, val_preds)
from sklearn.metrics import mean_squared_error
final_rmse = np.sqrt(mean_squared_error(y_val, val_preds))
print(f"Final RMSE: {final_rmse:.4f}")
print(f"Final 100 x R^2 score: {100 * final_r2:.2f}")

best_model.save_model('model/xgboost_model.json')
print("Model saved to model/xgboost_model.json")
