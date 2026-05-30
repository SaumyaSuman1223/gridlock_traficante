import pandas as pd
import pygeohash as pgh
import os
from pathlib import Path

def decode_geohash(gh):
    try:
        lat, lon = pgh.decode(gh)
        return pd.Series({'lat': lat, 'lon': lon})
    except Exception:
        return pd.Series({'lat': None, 'lon': None})

def preprocess_data(input_path, output_path):
    print(f"Loading data from {input_path}...")
    df = pd.read_csv(input_path)
    
    print("Decoding geohashes...")
    # This might take a few seconds for 77k rows
    coords = df['geohash'].apply(decode_geohash)
    df = pd.concat([df, coords], axis=1)
    
    print("Handling missing values...")
    # Numericals
    if 'Temperature' in df.columns:
        df['Temperature'] = df['Temperature'].interpolate(method='linear').ffill().bfill()
    if 'NumberOfLanes' in df.columns:
        df['NumberOfLanes'] = df['NumberOfLanes'].fillna(df['NumberOfLanes'].mode()[0])
        
    # Categoricals
    cat_cols = ['RoadType', 'Weather', 'LargeVehicles', 'Landmarks']
    for col in cat_cols:
        if col in df.columns:
            df[col] = df[col].fillna('Unknown')
            
    print(f"Saving processed data to {output_path}...")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)
    print("Done!")

if __name__ == "__main__":
    # Setup paths relative to the script location
    script_dir = Path(__file__).resolve().parent
    root_dir = script_dir.parent.parent
    
    input_file = root_dir / "dataset" / "train.csv"
    output_file = script_dir.parent / "data" / "processed_train.csv"
    
    preprocess_data(input_file, output_file)
