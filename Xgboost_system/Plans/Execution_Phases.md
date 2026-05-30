# Project Execution & Sprint Plan

## Phase 1: Data Prep & API Skeleton (Backend Focus)
1.  Set up the FastAPI project structure.
2.  Write a Python script to decode the `geohash` column into lat/lon coordinates.
3.  Clean the `train.csv` data (handle missing values).
4.  Create a basic `/api/historical` endpoint that returns a JSON sample of decoded geohashes and their demand.

## Phase 2: Map Rendering (Frontend Focus)
1.  Initialize the React/Vite application.
2.  Install `deck.gl` and `react-map-gl`. Set up a Mapbox access token.
3.  Fetch data from the FastAPI `/api/historical` endpoint.
4.  Render the data on the map using a Deck.gl `ScatterplotLayer` or `GridCellLayer`, using the `demand` value to determine the color of the cell.

## Phase 3: Machine Learning & Inference
1.  Train the XGBoost regression model in a Jupyter Notebook using the cleaned data.
2.  Export the model to the FastAPI project.
3.  Create the `/api/predict` POST endpoint. It should accept features (time, weather, temp), run them through the loaded model for all geohashes, and return the predicted demand array.

## Phase 4: Control Panel Integration
1.  Build the UI controls (sliders, dropdowns) in React.
2.  Connect the controls to a central state (e.g., Zustand).
3.  Write the `useEffect` hook: Whenever a control changes, trigger the `/api/predict` endpoint, update the map data state, and re-render the Deck.gl layer with the new predictions.
4.  Add Recharts/Plotly graphs to the side panel to visualize the distribution of the predictions.