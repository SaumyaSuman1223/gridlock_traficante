from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np
import os
import joblib
from pathlib import Path
from contextlib import asynccontextmanager

# Define paths
BASE_DIR = Path(__file__).resolve().parent.parent
data_path = BASE_DIR / "data" / "processed_train.csv"
model_dir = BASE_DIR / "model"

# Global Singletons
ml_models = {}
spatial_index = None
df_historical = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global df_historical, spatial_index, ml_models
    
    print("Initializing Singleton Models & Data...")
    
    # Load historical data
    if os.path.exists(data_path):
        cols_to_load = ['geohash', 'lat', 'lon', 'demand', 'timestamp', 'day', 'RoadType']
        df_historical = pd.read_csv(data_path, usecols=cols_to_load)
    
    # Load ML models
    model_path = model_dir / "xgboost_model.json"
    spatial_index_path = model_dir / "spatial_index.csv"
    encoders_path = model_dir / "encoder_mappings.json"
    
    if os.path.exists(model_path) and os.path.exists(spatial_index_path):
        import xgboost as xgb
        import json
        
        xgb_reg = xgb.XGBRegressor()
        xgb_reg.load_model(str(model_path))
        ml_models['xgb'] = xgb_reg
        
        with open(encoders_path, 'r') as f:
            ml_models['encoders'] = json.load(f)
            
        spatial_index = pd.read_csv(spatial_index_path).set_index('geohash')
        print("ML Models loaded successfully.")
    else:
        print("Warning: ML models not found. Run Phase 3 training script.")
        
    yield
    # Clean up on shutdown
    ml_models.clear()

app = FastAPI(title="Traffic Demand ML API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SimulationParams(BaseModel):
    time: float # 0 to 24
    day: int # 0 to 6
    temperature: float
    weather: str

@app.get("/api/historical-data")
async def get_historical_data(limit: int = 10000, day: int = None):
    global df_historical
    if df_historical is None:
        return {"error": "Data not loaded on server."}
        
    filtered_df = df_historical
    if day is not None:
        filtered_df = filtered_df[filtered_df['day'] == day]
        
    if len(filtered_df) > limit:
        result_df = filtered_df.head(limit)
    else:
        result_df = filtered_df
        
    return result_df.to_dict(orient="records")

@app.post("/api/predict")
async def predict_demand(params: SimulationParams):
    global spatial_index, ml_models
    
    if spatial_index is None or 'xgb' not in ml_models:
        return {"error": "Model not loaded."}
        
    xgb_model = ml_models['xgb']
    encoders = ml_models['encoders']
    
    # Create broadcast DataFrame from spatial index
    df_pred = spatial_index.copy().reset_index()
    
    # Apply cyclic time
    df_pred['time_sin'] = np.sin(2 * np.pi * params.time / 24.0)
    df_pred['time_cos'] = np.cos(2 * np.pi * params.time / 24.0)
    df_pred['day_sin'] = np.sin(2 * np.pi * params.day / 7.0)
    df_pred['day_cos'] = np.cos(2 * np.pi * params.day / 7.0)
    
    # Broadcast static inputs
    df_pred['Temperature'] = params.temperature
    
    # Encode Weather
    weather_val = params.weather
    weather_classes = encoders['Weather']
    if weather_val not in weather_classes:
        weather_val = weather_classes[0]
    df_pred['Weather'] = weather_classes.index(weather_val)
    
    # Re-order features correctly for XGBoost
    features = ['time_sin', 'time_cos', 'day_sin', 'day_cos', 'Temperature', 'Weather', 
                'RoadType', 'NumberofLanes', 'LargeVehicles', 'Landmarks', 'cluster_id', 'lat', 'lon']
                
    X = df_pred[features]
    
    # Predict
    preds = xgb_model.predict(X)
    df_pred['demand'] = preds
    
    # Apply Spatial Adjacency Graph Logic (Congestion cascades and spillover effects)
    # Use NearestNeighbors to find adjacent geohashes and diffuse demand
    from sklearn.neighbors import NearestNeighbors
    coords = df_pred[['lat', 'lon']].values
    nn = NearestNeighbors(n_neighbors=5, metric='haversine')
    # convert coordinates to radians for haversine
    coords_rad = np.radians(coords)
    nn.fit(coords_rad)
    distances, indices = nn.kneighbors(coords_rad)
    
    # Calculate spillover (add 10% of neighbors' average demand)
    spillover_demand = np.zeros(len(preds))
    for i, neighbors in enumerate(indices):
        # neighbors[0] is the point itself, neighbors[1:] are adjacent
        spillover_demand[i] = np.mean(preds[neighbors[1:]]) * 0.10
        
    df_pred['demand'] = preds + spillover_demand
    
    # Format response
    res = df_pred[['geohash', 'lat', 'lon', 'demand', 'RoadType']].copy()
    
    # Decode RoadType for the tooltip
    road_classes = encoders['RoadType']
    res['RoadType'] = res['RoadType'].map(lambda x: road_classes[int(x)] if int(x) < len(road_classes) else 'Standard')
    
    return res.to_dict(orient="records")

@app.get("/")
async def root():
    return {"message": "Traffic Demand API is running."}
