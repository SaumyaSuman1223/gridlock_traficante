# Data Analysis & Machine Learning Pipeline

## 1. Exploratory Data Analysis (EDA) Goals
Before building the model, the backend data pipeline must extract insights from the raw dataset (`train.csv`).

* **Spatial Hotspots:** Calculate the mean and max demand per geohash.
* **Temporal Bottlenecks:** Plot time-series aggregations to spot rush hours.
* **Spatial-Temporal Clustering (Behavioral Grouping):**
  * *Algorithm:* We will apply unsupervised learning algorithms (**K-Means** or **HDBSCAN**) on the historical profiles of the geohashes.
  * *Logic:* By clustering geohashes based on their demand across different hours and days, we can classify zones functionally (e.g., "Commercial District", "Residential Zone", "Logistics Corridor").
* **Feature Correlation:** 
  * **Pearson Correlation (Numerical):** Algorithm to measure linear correlation between two sets of data (e.g., Temperature and Demand), returning a coefficient between -1 and 1.
  * **ANOVA (Categorical):** Analysis of Variance algorithm to determine if the means of demand are statistically significantly different across different Weather categories.

## 2. Data Preprocessing & Feature Engineering
The raw data is not model-ready. The following steps will be executed in a dedicated `preprocess.py` script:

* **Geohash Decoding Logic (Addressing Spatial Bounding Boxes):** 
    * *Crucial Context:* Geohashes represent discrete spatial areas (bounding boxes), not exact points. We must explicitly declare and match the **Geohash Precision Level** (e.g., Level 6, which covers roughly 1.2 km × 600 m) to ensure spatial continuity in our grids.
    * *Algorithm:* Base32 decoding. The geohash string is converted into a binary string representing longitude and latitude bifurcations. While it denotes an area, for rendering purposes, we will calculate the centroid (midpoint) of this bounding box to get `lat` and `lon`.
* **Handling Missing Values & Anomalies:**
    * *Interpolation Logic:* Missing temperatures will use linear interpolation: $y = y_1 + ((x - x_1) / (x_2 - x_1)) \cdot (y_2 - y_1)$.
    * *Outlier Clipping:* Values above the 99th percentile are set to the 99th percentile value to prevent the squared error loss function from heavily weighting anomalies.
* **Feature Engineering:**
    * **Cyclical Time Encoding (Trigonometric Logic):** Time is cyclical. To make a machine learning model understand that hour 23 is close to hour 0, we project the hour onto a unit circle using sine and cosine functions:
        * $Time\_Sin = \sin(2 \cdot \pi \cdot \text{hour} / 24)$
        * $Time\_Cos = \cos(2 \cdot \pi \cdot \text{hour} / 24)$
    * **One-Hot Encoding:** Convert categoricals into binary matrices.

## 3. Model Training & Validation
* **Target Variable:** `demand` (Continuous Regression).
* **Evaluation Metrics (Hackathon Specific):** 
    * Primary: RMSE (Root Mean Squared Error) to penalize large errors during training.
    * Hackathon Metric: **Scaled Score**. The analytics panel will compute the raw coefficient of determination ($R^2$) and explicitly calculate the hackathon target metric: $\text{Score} = 100 \times R^2$.
* **Algorithm Selection: XGBoost (Extreme Gradient Boosting)**
    * **Underlying Logic:** XGBoost is an ensemble learning method that builds decision trees sequentially. Each new tree attempts to correct the residual errors made by the previous trees.
    * **Objective Function:** We will use `reg:squarederror`, minimizing $Obj = \sum L(y_i, \hat{y}_i) + \Omega(f_k)$, where $L$ is the Mean Squared Error loss, and $\Omega$ represents the regularization term (L1/L2) that penalizes overly complex trees to prevent overfitting.
    * **Sparsity-Aware Split Finding:** XGBoost natively handles missing data. At every node, it learns a "default direction" (left or right) for missing values that optimizes the training loss.
* **Hyperparameter Tuning (Optimization Algorithm):** Use `Optuna`, which implements the Tree-structured Parzen Estimator (TPE) algorithm. TPE is a Bayesian optimization technique that probabilistically models the performance of hyperparameters to efficiently search the hyperparameter space (unlike brute-force GridSearch).

## 4. Extracting Insights for the Dashboard
* **Feature Importance Logic:** 
    * XGBoost calculates feature importance using "Gain": the average training loss reduction gained when using a feature for splitting across all trees. Higher gain implies a more critical feature.
* **SHAP (SHapley Additive exPlanations) Logic:** 
    * *Algorithm:* Grounded in cooperative game theory. SHAP assigns each feature an importance value for a *specific* prediction by calculating the marginal contribution of that feature across all possible permutations of features. This will allow the UI to explain *why* a specific intersection is predicted to have high traffic at 5 PM.