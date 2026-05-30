**Traffic Demand Prediction — Problem Documentation**

---

### **1\. Objective**

Build a machine learning system to predict **traffic demand** at a given place and time using historical data. The prediction target is a continuous numerical value representing traffic intensity.

---

### **2\. Problem Type**

* Supervised Learning  
* Regression Task  
* Goal: Maximize prediction accuracy using R2R^2R2 score

---

### **3\. Dataset Structure**

**Files Provided**

* `train.csv` → (77,299 rows × 11 columns)  
* `test.csv` → (41,778 rows × 10 columns)  
* `sample_submission.csv` → (5 rows × 2 columns)

---

### **4\. Feature Description**

| Column Name | Description |
| ----- | ----- |
| Index | Unique identifier for each data point |
| geohash | Encoded geographic location |
| day | Day number of observation |
| timestamp | Time index within the day |
| RoadType | Type of road (e.g., Residential, Highway) |
| NumberOfLanes | Number of lanes on the road |
| LargeVehicles | Whether large vehicles are allowed |
| Landmarks | Presence of landmarks nearby |
| Temperature | Temperature at the location |
| Weather | Weather condition (e.g., Sunny, Rainy) |
| demand (target) | Traffic demand at given time and location |

---

### **5\. Train vs Test Difference**

* **Train dataset** includes `demand` (target variable)  
* **Test dataset** does NOT include `demand`  
* Objective: Predict `demand` for all rows in test dataset

---

### **6\. Target Variable**

* Column: `demand`  
* Type: Continuous numerical  
* Represents traffic intensity at a specific time and location

---

### **7\. Evaluation Metric**

Score=max⁡(0,  100×R2(actual,predicted))\\text{Score} \= \\max(0,\\; 100 \\times R^2(\\text{actual}, \\text{predicted}))Score=max(0,100×R2(actual,predicted))

* Metric: R2R^2R2 (coefficient of determination)  
* Score scaled between 0 and 100  
* Negative R2R^2R2 is clipped to 0

---

### **8\. Data Characteristics**

* Mixed data types:  
  * Numerical: `day`, `timestamp`, `NumberOfLanes`, `Temperature`  
  * Categorical: `RoadType`, `Weather`, `LargeVehicles`, `Landmarks`  
  * Spatial: `geohash`  
* Missing values present (e.g., RoadType, Temperature, Weather)  
* Temporal component via `day` and `timestamp`  
* Spatial clustering via `geohash`

---

### **9\. Prediction Requirements**

* Predict `demand` for all rows in `test.csv`  
* Output format:  
  * CSV file  
  * Shape: **41778 × 2**  
  * Columns:  
    * `Index`  
    * `demand`

---

### **10\. Submission Constraints**

* File must be `.csv`  
* Index must match test dataset  
* Column names must match `sample_submission.csv`  
* Order must be preserved

---

### **11\. Key Challenges**

* Handling missing values  
* Encoding categorical variables  
* Extracting useful information from `geohash`  
* Capturing temporal patterns  
* Modeling non-linear relationships  
* Avoiding overfitting

---

### **12\. System Expectation**

The final system should:

* Ingest raw tabular data  
* Perform preprocessing and feature engineering  
* Train a regression model  
* Generate predictions on unseen test data  
* Output a valid submission file

