import os
import shutil
import yaml
from pathlib import Path
from collections import defaultdict
from ultralytics import YOLO

def create_subset():
    project_root = Path(__file__).resolve().parent
    dataset_root = project_root.parent / "PlantDataset_YOLO11"
    temp_dir = project_root / "temp_subsample"
    
    # 1. Clean existing temp if any
    if temp_dir.exists():
        shutil.rmtree(temp_dir)
        
    # Create subdirs
    for split in ["train", "val"]:
        (temp_dir / split / "images").mkdir(parents=True, exist_ok=True)
        (temp_dir / split / "labels").mkdir(parents=True, exist_ok=True)

    print("Grouping dataset images by class...")
    
    # Group train images by class
    train_by_class = defaultdict(list)
    orig_train_lbl_dir = dataset_root / "train" / "labels"
    orig_train_img_dir = dataset_root / "train" / "images"
    
    for lbl_file in orig_train_lbl_dir.glob("*.txt"):
        img_file = orig_train_img_dir / f"{lbl_file.stem}.jpg"
        if img_file.exists():
            try:
                with open(lbl_file, "r") as f:
                    line = f.readline().strip()
                    if line:
                        class_id = int(line.split()[0])
                        train_by_class[class_id].append((img_file, lbl_file))
            except Exception as e:
                pass

    # Group val images by class
    val_by_class = defaultdict(list)
    orig_val_lbl_dir = dataset_root / "val" / "labels"
    orig_val_img_dir = dataset_root / "val" / "images"
    
    for lbl_file in orig_val_lbl_dir.glob("*.txt"):
        img_file = orig_val_img_dir / f"{lbl_file.stem}.jpg"
        if img_file.exists():
            try:
                with open(lbl_file, "r") as f:
                    line = f.readline().strip()
                    if line:
                        class_id = int(line.split()[0])
                        val_by_class[class_id].append((img_file, lbl_file))
            except Exception as e:
                pass

    print(f"Found {len(train_by_class)} classes in training set, {len(val_by_class)} in validation set.")
    
    # 2. Copy selected images per class
    train_count = 0
    val_count = 0
    
    # Copy up to 30 training images per class
    for class_id, items in train_by_class.items():
        for img_path, lbl_path in items[:30]:
            shutil.copy2(img_path, temp_dir / "train" / "images" / img_path.name)
            shutil.copy2(lbl_path, temp_dir / "train" / "labels" / lbl_path.name)
            train_count += 1
            
    # Copy up to 5 validation images per class
    for class_id, items in val_by_class.items():
        for img_path, lbl_path in items[:5]:
            shutil.copy2(img_path, temp_dir / "val" / "images" / img_path.name)
            shutil.copy2(lbl_path, temp_dir / "val" / "labels" / lbl_path.name)
            val_count += 1
            
    print(f"Copied {train_count} training and {val_count} validation images to temporary directory.")
    
    # 3. Read class names from original yaml
    with open(dataset_root / "data.yaml", "r") as f:
        orig_yaml = yaml.safe_load(f)
    class_names = orig_yaml.get("names", [])
    
    # 4. Write temporary yaml file
    temp_yaml_path = temp_dir / "data.yaml"
    temp_yaml_config = {
        "path": str(temp_dir.resolve()),
        "train": "train/images",
        "val": "val/images",
        "nc": len(class_names),
        "names": class_names
    }
    
    with open(temp_yaml_path, "w") as f:
        yaml.safe_dump(temp_yaml_config, f, default_flow_style=False)
        
    print("Temporary dataset configuration successfully written.")
    return temp_yaml_path

def train():
    project_root = Path(__file__).resolve().parent
    model_output_dir = project_root / "models"
    
    # Create the subset
    temp_yaml_path = create_subset()
    
    print("Loading YOLO11n...")
    model = YOLO("yolo11n.pt")
    
    print("Starting training...")
    results = model.train(
        data=str(temp_yaml_path),
        epochs=5,
        imgsz=192,
        batch=32,
        device="cpu",
        workers=4,
        project=str(model_output_dir),
        name="cropdoctor_model",
        exist_ok=True,
        verbose=True
    )
    
    best_weights = model_output_dir / "cropdoctor_model" / "weights" / "best.pt"
    final_model = model_output_dir / "best.pt"
    
    if best_weights.exists():
        shutil.copy2(str(best_weights), str(final_model))
        print(f"Success! Model copied to {final_model}")
    else:
        print("Error: Could not find trained weights.")
        
    # Clean up
    try:
        shutil.rmtree(project_root / "temp_subsample")
        print("Cleaned up temporary directory.")
    except Exception as e:
        print(f"Warning: could not delete temporary folder: {e}")

if __name__ == "__main__":
    train()
