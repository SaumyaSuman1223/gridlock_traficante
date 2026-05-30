# Project Architecture & Technology Stack

## 1. Core Objective
Develop a full-stack geospatial dashboard to predict and analyze traffic demand. The system must allow users to visualize historical traffic patterns, identify spatial bottlenecks via Geohashes, and simulate "what-if" scenarios using a machine learning model.

## 2. System Architecture & Core Algorithms
The application follows a decoupled client-server architecture, optimized for high-concurrency and large-scale spatial data rendering.

* **Frontend (Visualization & Interaction):** React SPA (Single Page Application) built with Vite. 
  * **Rendering Algorithm (WebGL):** The frontend relies on Deck.gl, which uses a WebGL-based rendering pipeline. Instead of rendering DOM elements, it passes data directly to the GPU via shaders, allowing it to render millions of data points at 60 FPS. 
  * **Spatial Aggregation Logic:** For the `HexagonLayer`, Deck.gl implements a binning algorithm that projects geographic coordinates into screen space, divides the screen into a hexagonal grid, and aggregates the `demand` values (e.g., sum or mean) for all points falling within each bin.
* **Backend (Data Processing & Inference):** FastAPI.
  * **Concurrency Logic:** FastAPI uses Python's `asyncio` event loop. Incoming HTTP requests do not block the thread; I/O operations (like fetching from a database if added later) are awaited, allowing a single server process to handle thousands of concurrent connections.
  * **Model Memory Management (Singleton Pattern):** The XGBoost model is large. To prevent memory leaks and slow response times, the model is loaded into memory exactly once at server startup using a Python Singleton pattern. The `/api/predict` endpoint references this single in-memory instance for lightning-fast inference.
* **Machine Learning Engine:** Scikit-Learn / XGBoost. The ML models will be pre-trained offline and saved as serialized pickle files.

## 3. Technology Stack Selection

### A. Frontend (React Environment)
* **Framework:** React 18+ (via Vite for fast compilation).
* **Geospatial Visualization:** **Deck.gl**. Specifically using `HexagonLayer` or `ColumnLayer` for 3D extrusion based on traffic demand, and `ScatterplotLayer` for point data.
* **Basemap Provider:** MapLibre GL JS integrated via `react-map-gl`.
* **Analytical Charts:** Recharts for rendering demand vs. temperature/time line charts.
* **Styling & UI:** Tailwind CSS for utility-first styling, paired with Shadcn/ui (Radix UI primitives).
* **State Management:** Zustand. A lightweight state manager using the Flux architecture (unidirectional data flow) but avoiding Redux's heavy boilerplate.
* **Data Fetching:** Axios, wrapped in React Query for caching logic (stale-while-revalidate algorithm).

### B. Backend (Python/FastAPI)
* **Framework:** FastAPI (Python 3.10+).
* **Data Manipulation:** Pandas and GeoPandas for reading CSVs, joining data, and spatial operations.
* **Geospatial Decoding:** `python-geohash` library. 
  * **Geohash Algorithm Details:** Geohashing is a public domain geographic coding system that interleaves the bits of latitude and longitude coordinates, then encodes them using Base32. It creates a hierarchical spatial data structure (a Z-order curve). Our backend will decode these strings back into bounding boxes and calculate the centroid.
* **ML Framework:** XGBoost.
* **Server/Deployment:** Uvicorn as the ASGI server.

## 4. Directory Structure
```text
project-root/
│
├── frontend/               # React/Vite SPA
│   ├── src/
│   │   ├── components/     # UI components (charts, panels, map layers)
│   │   ├── store/          # Zustand state definitions
│   │   ├── api/            # Axios API wrappers
│   │   └── App.jsx
│   └── package.json
│
├── backend/                # FastAPI application
│   ├── app/
│   │   ├── main.py         # FastAPI entry point
│   │   ├── api/            # API routing and endpoints
│   │   ├── services/       # ML inference and data logic
│   │   └── core/           # Configs (CORS, env vars)
│   ├── models/             # Pickled XGBoost models
│   ├── data/               # Raw and processed CSVs
│   └── requirements.txt
│
└── ml_pipeline/            # Jupyter notebooks and training scripts
```

## 5. API Contract (Data Flow)
1.  **`/api/historical-data` (GET):** 
    * *Purpose:* Fetches the historical `train.csv` data.
    * *Query Params:* `start_time`, `end_time`, `limit`.
    * *Response:* JSON array of features containing `{ geohash, lat, lon, demand, timestamp }`.
2.  **`/api/predict` (POST):** 
    * *Purpose:* Receives a JSON payload and returns predicted `demand`.
    * *Request Body:* `{ timestamp: "14:30", temperature: 25, weather: "Sunny", day_of_week: "Monday" }`.
    * *Response:* JSON array of `{ geohash, predicted_demand }`.