# Crop-Disease-Detector 🌾🩺 

CropDoctor is a crop disease detection web application built with **Flask**, **OpenCV**, and **YOLOv11** object detection models. It helps farmers and researchers scan crops for diseases, get instant diagnostic results, and receive recommendations for treatment and prevention.

---

## 🚀 Features
- **YOLOv11 Disease Detection**: Custom trained model to detect crop diseases from uploaded images.
- **Detailed Recommendations**: Provides instant treatment and prevention steps based on the detected disease.
- **Scan History**: Stores and tracks previous scans, severity percentage, and health score in a local database.
- **User Authentication**: Secure user registration, login, and profile management.

---

## 🛠️ Setup and Installation

### 1. Clone the Repository
```bash
git clone https://github.com/Kaushikghosh2004/Crop-Disease-Detection.git
cd CropDoctor-Detection/CropDoctor
```

### 2. Set Up a Virtual Environment
We recommend using a Python virtual environment to manage dependencies:
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies
Install all the required packages:
```bash
pip install -r requirements.txt
```

### 4. Run the Application
Start the Flask development server:
```bash
python app.py
```
Open your browser and navigate to `http://localhost:8000`.

---

## 📁 Datasets and Model Training
> [!NOTE]
> The raw training datasets (`Dataset/` and `PlantDataset_YOLO11/` directories) are approximately **8 GB** in total and have been excluded from this GitHub repository to comply with file size limits.
>
> If you wish to retrain the model:
> 1. Place your YOLO-formatted dataset inside `PlantDataset_YOLO11/` at the root directory.
> 2. Run the training script:
>    ```bash
>    python train_model.py
>    ```

---

## 📦 Project Structure
```text
CropDoctor-Detection/
├── CropDoctor/
│   ├── models/                  # Trained model weights (best.pt)
│   ├── static/                  # Stylesheets, scripts, images
│   ├── templates/               # HTML template files
│   ├── app.py                   # Main Flask application
│   ├── recommendations.py       # Disease recommendation dictionary
│   ├── requirements.txt         # Dependencies
│   └── train_model.py           # YOLO training script
├── .gitignore                   # Excludes venv, datasets, and local database
└── README.md                    # Project documentation
```
