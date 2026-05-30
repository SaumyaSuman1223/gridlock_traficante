# Implementation Plan: Detailed Development Phases

This document outlines the step-by-step execution plan, highlighting where core algorithms and logic are implemented.

## Phase 1: Project Setup & Data Foundation (Backend)
**Goal:** Establish the backend environment and implement geospatial decoding logic.
* **Step 1.1:** Initialize the Git repository and create `backend` and `frontend` folders.
* **Step 1.2:** Set up Python virtual environment (`backend`). Create `requirements.txt`.
* **Step 1.3 (Algorithm Logic):** Create `backend/scripts/preprocess.py`. Implement the geohash Base32 decoding algorithm to generate precise `lat` and `lon` centroids. Document the specific **Geohash Precision Level**. Apply linear interpolation algorithms to handle missing `Temperature` data.
* **Step 1.4:** Build a master **Spatial Index** mapping each geohash to its static features (e.g., `RoadType`, `NumberOfLanes`). This is a crucial data structure for future broadcasting.
* **Step 1.5:** Initialize the FastAPI app (`backend/app/main.py`) with `asyncio` endpoints to ensure non-blocking I/O. Build the `/api/historical-data` GET endpoint.

## Phase 2: Map Rendering & Architecture (Frontend)
**Goal:** Set up the React app and implement the WebGL rendering pipeline.
* **Step 2.1:** Scaffold React app via Vite. Install `deck.gl`, `zustand`, `lodash.debounce`.
* **Step 2.2:** Implement `MapComponent.jsx`. Configure MapLibre with the Web Mercator projection system.
* **Step 2.3 (Rendering Logic):** Implement the Deck.gl `ColumnLayer`. Define the three rendering modes: Historical, Prediction, and **Delta ($\Delta$) View**. Write the diverging color scale logic for the Delta mode.
* **Step 2.4:** Connect frontend to `/api/historical-data` and verify the GPU-accelerated rendering.

## Phase 3: Machine Learning Engineering (Data Science)
**Goal:** Train the XGBoost model utilizing advanced feature engineering algorithms.
* **Step 3.1:** Create `Training.ipynb`.
* **Step 3.2 (Math Logic):** Implement cyclical time encoding using sine/cosine transformations.
* **Step 3.3 (Unsupervised Learning):** Run **K-Means clustering** over geohash historical time-profiles to classify them into behavioral clusters (e.g., Commercial, Residential).
* **Step 3.4 (ML Algorithm):** Train the `XGBRegressor` on the target metric (evaluating using both RMSE and the hackathon's required **$100 \times R^2$** scaling). Use Optuna's TPE algorithm for hyperparameters.
* **Step 3.5:** Serialize the model utilizing `joblib` into a `.pkl` file.

## Phase 4: Inference API & Spatial Broadcasting
**Goal:** Expose the model via a high-performance REST API.
* **Step 4.1 (Design Pattern):** Update FastAPI. Implement a Singleton class pattern to load the XGBoost `.pkl` model into memory *only once* at startup.
* **Step 4.2:** Create the `/api/predict` POST endpoint.
* **Step 4.3 (Broadcast Prediction Challenge):** Inside the endpoint, accept the user's simulation inputs (Time, Temp, Weather). Create a DataFrame of all unique geohashes. **Crucially**, merge this DataFrame with the master Spatial Index from Step 1.4 to map static features (`RoadType`, `NumberOfLanes`) back to each geohash. Broadcast the dynamic user inputs across all rows.
* **Step 4.4:** Feed this fully reconstructed matrix into the XGBoost `predict()` function.
* **Step 4.5 (Graph Theory):** Execute the Spatial Adjacency Graph algorithm to calculate congestion cascades and spillover effects based on the new predictions. Return the final JSON array.

## Phase 5: UI Orchestration & Debouncing
**Goal:** Connect the interactive controls to the prediction API safely.
* **Step 5.1:** Build the "Simulation Control Panel" with React components.
* **Step 5.2:** Set up the Zustand store to manage `simulationParams` and `mapData`.
* **Step 5.3 (Control Logic):** Implement a 300ms debounce algorithm using `lodash` on all slider inputs.
* **Step 5.4:** Write the `useEffect` hook that observes `simulationParams`, triggers the debounced API call, and updates `mapData` on success.
* **Step 5.5 (Animation Logic):** Configure Deck.gl's `transitions` property so the 3D columns animate smoothly. Build the analytical sidebar with Recharts to display the $100 \times R^2$ scores and local SHAP waterfalls.
