# UI/UX Design & Frontend Architecture Logic

## 1. Overall Layout & Architecture
The interface will be an immersive, full-screen Single Page Application (SPA) split into three tightly integrated zones communicating via a central Zustand state store.

## 2. State Management & Data Flow Logic
* **State Management (Zustand):** Zustand utilizes a simplified Flux pattern (pub/sub). When a user changes a control, an action is dispatched, updating the immutable state tree. Components subscribed to specific state slices (like the map layer subscribing to `mapData`) automatically re-render when their slice changes.
* **Debouncing Algorithm for API Calls:**
    * *Problem:* Dragging a "Time" slider rapidly could fire 50 API requests to FastAPI per second, crashing the backend.
    * *Logic (Lodash `_.debounce`):* We implement a timer-based debouncing algorithm. When the user moves the slider, it clears an existing timeout and sets a new one (e.g., for 300ms). The API call is only triggered if the timeout completes without being cleared by another slider movement. This ensures only the *final* state is sent to the prediction endpoint.

## 3. Zone A: The Interactive Map (Main Viewport)
* **Technology:** Deck.gl rendered over a MapLibre GL JS basemap.
* **Geospatial Projection Logic (Web Mercator):** The Earth is a sphere, but monitors are flat. The frontend uses the Web Mercator projection algorithm to project latitude and longitude coordinates into 2D screen pixels. This projection preserves local angles and shapes, which is critical for accurate geohash rendering.
* **Visualization Layer Modes (Tri-State Logic):**
    The map provides three distinct visualization modes:
    1. **Historical Mode:** Displays raw, past `demand` data aggregated by the currently selected time block.
    2. **Prediction Mode:** Displays the XGBoost model's predicted `demand` under simulated "What-If" conditions.
    3. **Delta (Anomalous) View ($\Delta$ Mode):** 
        * *Logic:* Calculates the exact difference: `Predicted Demand` - `Historical Baseline`.
        * *Insight:* On the map, any geohash that matches expected typical patterns shows as completely transparent. If a cell turns **bright blue**, it indicates traffic is significantly lower than typical. If it turns **bright red**, the model is predicting an unexpected traffic spike (anomaly prediction).
* **Rendering Algorithms:**
    * `HexagonLayer` & `ColumnLayer`: Uses a GPU-accelerated binning algorithm. It converts all point data into screen-space, hashes them into a grid, and calculates the color/elevation based on aggregated values in real-time.
    * **Color Interpolation:** The map uses linear interpolation for colors, adjusting the gradient dynamically depending on the active Layer Mode (e.g., Diverging Red-to-Blue scale for the Delta Mode).

## 4. Zone B: The Analytical Side-Panel (Floating Left Drawer)
* **Components:**
    * **Time-Series Chart (Recharts):** Relies on SVG rendering algorithms.
    * **Feature Importance Chart (Recharts):** Renders the XGBoost "Gain" values fetched from the backend.

## 5. Zone C: The "What-If" Simulation Control Panel
* **Purpose:** The core simulation interface. 
* **State Flow Logic:**
    1. User adjusts a control (e.g., Weather to "Rainy").
    2. Zustand state updates immediately.
    3. The debounce algorithm starts counting (300ms).
    4. Timer completes; Axios `POST` request fires to `/api/predict`.
    5. The frontend enters a loading state.
    6. Backend responds with the array of predicted demands.
    7. Zustand updates `mapData`.
    8. Deck.gl's reactive lifecycle detects the new data array, diffs the changes, and initiates a GPU-level transition (animation algorithm) to smoothly morph the columns from their old heights to their new predicted heights.