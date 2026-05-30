# Analytical Insights & Advanced Features Specification

## 1. Core Analytics Questions the Dashboard Must Answer
1. **Where are the structural bottlenecks?** (Geohashes where demand regularly spikes regardless of weather anomalies).
2. **How elastic is traffic relative to weather?** (Quantifying the percentage change in global traffic intensity when moving from "Sunny" to "Rainy" conditions).
3. **Which areas are highly sensitive to temperature?** (Identifying grid blocks where demand correlates tightly with extreme temperature variations).
4. **Hackathon Metric Tracking:** Evaluate the global predictive power of the model.
   * **Algorithmic Logic:** The dashboard will calculate and display both the raw $R^2$ metric (for data science transparency) and the scaled score $\text{Score} = 100 \times R^2$ to align exactly with the hackathon's grading metric.

## 2. Advanced Insights Engine (Algorithms & Logic)

### A. Spatial-Temporal Clustering (Backend ML)
Instead of merely plotting raw demand, the system will categorize geographical zones based on their behavioral signatures over time.
* **Algorithm:** We will use **K-Means** or **HDBSCAN** (Hierarchical Density-Based Spatial Clustering of Applications with Noise) on the historical profiles of the geohashes (demand pivoted by hour of day).
* **Feature Engineering for Clustering:** Create a matrix where rows are unique geohashes and columns are average demand at `hour=0`, `hour=1` ... `hour=23`.
* **The Insight:** This allows the frontend to color-code geohashes by behavior type rather than just current volume. 
  * *Cluster 1:* "Commercial Districts" (high weekday demand, low weekend).
  * *Cluster 2:* "Residential Zones" (morning and evening commuter spikes).
  * *Cluster 3:* "Logistics Corridors" (consistent, non-cyclical heavy traffic).

### B. Bottleneck & Congestion Cascade Analysis (Graph Theory)
Because geohashes represent distinct spatial bounding boxes, we can predict how traffic jams spill over.
* **Algorithm (Spatial Adjacency Graph):** The backend will construct a graph $G = (V, E)$ where vertices $V$ are geohashes and edges $E$ connect adjacent geohashes (calculated by geographical proximity or overlapping bounding box edges).
* **The Insight:** When a user spikes the demand in a specific geohash via the simulation panel (e.g., simulating a road closure or major event), the backend runs a propagation algorithm (like Breadth-First Search with distance decay) to trace how that traffic spills over into adjacent cells over the next time steps, analyzing "traffic propagation loops" across the grid network.

## 3. Targeted Visualization Widgets (Zone B Sidebar)
To maximize data transparency, the side panel will feature key analytical chart engines powered by Recharts:

### Widget 1: Spatial-Temporal Elasticity Curve (Line Chart)
* **X-Axis:** Timestamp (00:00 - 23:59)
* **Y-Axis:** Aggregated Demand
* **Lines:** Multi-series plotting (Line 1: Historical Mean, Line 2: Active Simulation Prediction). 
* **Insight:** Allows instant visual identification of the exact hour a predictive scenario deviates from typical traffic patterns.

### Widget 2: Feature Response Distribution (Bar Chart)
* **X-Axis:** Categorical Feature Splits (e.g., Weather conditions or Road Types)
* **Y-Axis:** Average Predictive Variance ($\sigma$)
* **Insight:** Answers the question, "Does a change in weather impact Residential roads or Highways more severely?"

### Widget 3: Local SHAP Explanation Waterfall
* **X-Axis:** Positive/Negative marginal contributions to the local prediction.
* **Y-Axis:** Dataset Features (`Temperature`, `Weather`, `NumberOfLanes`, etc.)
* **Insight:** When a user clicks an isolated geohash cell on the map, this waterfall chart breaks open the ML model's mathematical reasoning, proving exactly which variable forced that specific cell to turn red or green.
