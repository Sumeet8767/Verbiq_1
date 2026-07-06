import cv2
import torch
import numpy as np
from ultralytics import YOLO
from datetime import datetime
import torch.backends.cudnn as cudnn
import mediapipe as mp
import os
import json
import time

# Setup
cudnn.benchmark = True
#device = 'cuda' if torch.cuda.is_available() else 'cpu'

import torch

if torch.cuda.is_available():
    print(f" PyTorch GPU available: {torch.cuda.get_device_name(0)}")
    device = torch.device("cuda")
else:
    print("No GPU found for PyTorch.")
    device = torch.device("cpu")


# Load YOLO model
model_path = os.path.join(os.path.dirname(__file__), "yolo11n.pt")
model = YOLO(model_path)
model.to(device)

# MediaPipe Face Mesh
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    static_image_mode=False, 
    max_num_faces=5,
    min_detection_confidence=0.6,
    min_tracking_confidence=0.6
    )

# COCO labels (Standard Order)
COCO_LABELS = [
    "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train",
    "truck", "boat", "traffic light", "fire hydrant", "stop sign", "parking meter",
    "bench", "bird", "cat", "dog", "horse", "sheep", "cow", "elephant", "bear",
    "zebra", "giraffe", "backpack", "umbrella", "handbag", "tie", "suitcase",
    "frisbee", "skis", "snowboard", "sports ball", "kite", "baseball bat",
    "baseball glove", "skateboard", "surfboard", "tennis racket", "bottle",
    "wine glass", "cup", "fork", "knife", "spoon", "bowl", "banana", "apple",
    "sandwich", "orange", "broccoli", "carrot", "hot dog", "pizza", "donut",
    "cake", "chair", "couch", "potted plant", "bed", "dining table", "toilet",
    "tv", "laptop", "mouse", "remote", "keyboard", "cell phone", "microwave",
    "oven", "toaster", "sink", "refrigerator", "book", "clock", "vase", "scissors",
    "teddy bear", "hair drier", "toothbrush"
]
TARGET_CLASSES = {"person", "laptop", "cell phone", "tv", "book"}
CLASS_THRESHOLDS = {
    "person": 0.35,
    "cell phone": 0.20,
    "laptop": 0.40,
    "book": 0.40,
    "tv": 0.40
}

log_file = os.path.join("logs", "proctoring_log.jsonl")
screenshot_dir = "suspicious_frames"
os.makedirs(screenshot_dir, exist_ok=True)
MAX_WARNINGS = 3

LEFT_IRIS = [474, 475, 476, 477]
RIGHT_IRIS = [469,470, 471, 472]

gaze_history = []

phone_history = []
person_history = []

# def detect_gaze_direction(landmarks, width, height):
#     left_eye_indices = [33, 133, 159, 145]
#     left_eye_points = [(int(landmarks[i].x * width), int(landmarks[i].y * height)) for i in left_eye_indices]
#     left_x = np.mean([p[0] for p in left_eye_points])
#     eye_position_ratio = left_x / width

#     if eye_position_ratio < 0.4:
#         return "Looking Left"
#     elif eye_position_ratio > 0.6:
#         return "Looking Right"
#     else:
#         return "Looking Center"

#def get_iris_center(landmarks, iris_indices, width, height):
    
    # points = np.array([
    #     (
    #         landmarks[i].x * width,
    #         landmarks[i].y * height
    #     )
    #     for i in iris_indices
    # ])
    
def get_iris_center(landmarks, iris_indices, width, height):
        
    valid_points = []
        
    for i in iris_indices:
            
        if i < len(landmarks):
                
            valid_points.append(
            (
                landmarks[i].x * width,
                landmarks[i].y * height
            )
        )
            
    if len(valid_points) == 0:
        return None
        
    points = np.array(valid_points)    
    
    return np.mean(points, axis=0)

def detect_gaze_direction(
    landmarks, 
    width, 
    height
    ):
    
    if len(landmarks) < 478:
        return "Looking Center"
    
    iris_center = get_iris_center(
        landmarks,
        LEFT_IRIS,
        width,
        height
    )
    
    if iris_center is None:
        return "Looking Center"
    
    left_corner = np.array([
        landmarks[33].x * width,
        landmarks[33].y * height
    ])
    
    right_corner = np.array([
        landmarks[133].x * width,
        landmarks[133].y * height
    ])
    
    eye_width = np.linalg.norm(
        right_corner - left_corner
    )
    
    if eye_width == 0:
        return "Looking Center"
    
    iris_ratio = (
        iris_center[0] - left_corner[0]
    ) / eye_width
    
    if iris_ratio < 0.35:
        return "Looking Left"
    
    elif iris_ratio > 0.65:
        return "Looking Right"
    
    return "Looking Center"

def detect_head_pose(landmarks, width, height):
    
    nose = np.array([
        landmarks[1].x * width,
        landmarks[1].y * height
    ])
    
    left_cheek = np.array([
        landmarks[234].x * width,
        landmarks[234].y * height
    ])
    
    right_cheek = np.array([
        landmarks[454].x * width,
        landmarks[454].y * height
    ])
    
    forehead = np.array([
        landmarks[10].x * width,
        landmarks[10].y * height
    ])
    
    chin = np.array([
        landmarks[152].x * width,
        landmarks[152].y * height
    ])
    
    face_center_x = (
        left_cheek[0] + right_cheek[0]
    ) / 2
    
    horizontal_ratio = (
        nose[0] - face_center_x
    ) / (right_cheek[0] - left_cheek[0])
    
    face_center_y = (
        forehead[1] + chin[1]
    ) / 2
    
    vertical_ratio = (
        nose[1] - face_center_y
    ) / (chin[1] - forehead[1])
    
    if horizontal_ratio < -0.08:
        return "Head Left"
    
    elif horizontal_ratio > 0.08:
        return "Head Right"
    
    elif vertical_ratio < -0.05:
        return "Head Up"
    
    elif vertical_ratio < 0.08:
        return "Head Down"
    
    return "Head Center"

warning_count = 0
MAX_WARNINGS = 3

last_screenshot_time = 0
SCREENSHOT_COOLDOWN = 5
MIN_FACE_RATIO = 0.04

no_face_start_time = None

def proctor_frame(frame):
    
    start_time = time.time()
    
    global warning_count
    global last_screenshot_time
    global no_face_start_time
    
    
    height, width, _ = frame.shape

    # === GAZE DETECTION ===
    gaze_direction = "No face"
    head_pose = "Unkown"
    
    face_ratio = 0
    face_too_small = False
    
    left_count = 0
    right_count = 0
    
    iris_ratio_debug = None
    
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results_gaze = face_mesh.process(frame_rgb)
    
    print(
        f"faceDetected={results_gaze.multi_face_landmarks is not None}"
    )

    if results_gaze.multi_face_landmarks:
        landmarks = results_gaze.multi_face_landmarks[0].landmark
        
        no_face_start_time = None
        
        head_pose = detect_head_pose(
            landmarks,
            width,
            height
        )
        face_points = np.array([
            (
                int(lm.x * width),
                int(lm.y * height)
            )
            for lm in landmarks
        ])
        
        x, y, w, h = cv2.boundingRect(face_points)
        
        face_area = w * h
        frame_area = width * height
        
        face_ratio = face_area / frame_area
        
        face_too_small = face_ratio < MIN_FACE_RATIO
        
        try:        
            current_gaze = detect_gaze_direction(
                landmarks, 
                width, 
                height
                )
        except Exception as e:
            print("GAZE ERROR:",e)
            current_gaze = "Looking Center"
        
        gaze_history.append(current_gaze)
        
        if len(gaze_history) > 10:
            gaze_history.pop(0)
            
        left_count = gaze_history.count("Looking Left")
        right_count = gaze_history.count("Looking Right")
        
        if left_count >= 5:
            gaze_direction = "Looking Left"
            
        elif right_count >= 5:
            gaze_direction = "Looking Right"
        
        else: 
            gaze_direction = "Looking Center"
            
    else:

        print("NO FACE DETECTED")

        if no_face_start_time is None:

            no_face_start_time = time.time()

            print("Started no-face timer")

        else:

            elapsed = time.time() - no_face_start_time

            if elapsed > 10:

                print("NO FACE FOR 10 SECONDS")

                return {
                    "suspicious": True,
                    "warning": "Face not detected for more than 10 seconds.",
                    "terminate": True
                }

            elif elapsed > 3:

                print("NO FACE FOR 3 SECONDS")

                return {
                    "suspicious": True,
                    "warning": "Please stay visible to the camera."
                }

    # === OBJECT DETECTION ===
    results = model.predict(frame, verbose=False)

    person_count = 0
    device_count = 0
    detections = []
    
    confirmed_phone = False
    confirmed_multiple_people = False

    for result in results:
        boxes = result.boxes.xyxy.cpu().numpy()
        scores = result.boxes.conf.cpu().numpy()
        class_ids = result.boxes.cls.cpu().numpy().astype(int)

        for (x1, y1, x2, y2), score, class_id in zip(boxes, scores, class_ids):
            label = COCO_LABELS[class_id]
            
            required_conf = CLASS_THRESHOLDS.get(
                label,
                0.50
            )
            
            if score < required_conf:
                continue
            
            if label not in TARGET_CLASSES:
                continue
            if label == "person":
                person_count += 1
            else:
                device_count += 1
            detections.append({
                "label": label,
                "score": float(score),
                "box": [int(x1), int(y1), int(x2), int(y2)]
            })
        
    phone_detected = device_count > 0
    multiple_people = person_count > 1
            
    phone_history.append(phone_detected)
    person_history.append(multiple_people)
            
    if len(phone_history) > 10:
        phone_history.pop(0)
                
    if len(person_history) > 10:
        person_history.pop(0)
        
    phone_count = sum(phone_history)
    person_count_history = sum(person_history)
    
    print(
        f"Persons={person_count}, "
        f"Devices={device_count}, "
        f"PhoneHistory={phone_count}, "
        f"PersonHistory={person_count_history}"
    )
        
    confirmed_phone = phone_detected
    confirmed_multiple_people = multiple_people
            
    suspicious = (
        gaze_direction == "No face" or
        confirmed_multiple_people or
        confirmed_phone or
        (
            not face_too_small and
            (
                gaze_direction in ["Looking Left", "Looking Right"]
                or head_pose in [
                    "Head Left",
                    "Head Right",
                    "Head Down"
                ]
            )
        )
    )    
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    current_time = time.time()
    
    serious_violation = (
        confirmed_multiple_people or 
        confirmed_phone
    )
    
    if serious_violation:
        
        if current_time - last_screenshot_time > SCREENSHOT_COOLDOWN:
            
            filename = os.path.join(
                screenshot_dir,
                f"suspicious_{int(current_time)}.jpg"
            )
            
            # Screenshot saving disabled
            
            last_screenshot_time = current_time
            
            print(f"Screenshot_saved: {filename}")
            
            try:
                os.remove(filename)
                print(f"ScreenShot deleted: {filename}")
            except Exception as e:
                print(f"Could not delete screenshot: {e}")

    # Issue warning if below max count
    warning_msg = ""
    if suspicious:
        
        if gaze_direction == "No face":
            warning_msg = (
                "Face not detected for more than 10 seconds."
                )
        
        if confirmed_multiple_people:
            warning_msg = (
                "Multiple faces detected." 
                "Please ensure only you are visible."
                )
            
        elif confirmed_phone:
            warning_msg = (
                "Electronic device detected." 
                "Please remove all unauthorized devices."
                )
            
        elif gaze_direction in ["Looking Left", "Looking Right"]:
            warning_msg = f"Suspicious movement detected: {gaze_direction}. Please focus on the screen."
            
        else:
            warning_msg = "Suspicious activity detected."
    
    if face_too_small:
        if warning_msg:
            warning_msg += "Move Closer to the camera."
        else:
            warning_msg = (
                "Move closer to the camera. "
                "Face is to small fro reliable proctoring."
            )
            
    print(
        f"Gaze={gaze_direction} | "
        f"Head={head_pose}"
        f"FaceRatio={face_ratio:.3f} | "
        f"LeftCount={left_count} | "
        f"RightCount={right_count} | "
        f"History={len(gaze_history)}"
    )

    log_entry = {
        "timestamp": timestamp,
        "gaze_direction": gaze_direction,
        "person_count": person_count,
        "device_count": device_count,
        "suspicious": suspicious,
        "detections": detections,
        "warning": warning_msg
    }

    with open(log_file, "a") as f:
        f.write(json.dumps(log_entry) + "\n")
        
    print(
        "Detection Time:",
        round(time.time() - start_time, 3 ),
        "seconds"
    )

    return log_entry

# import cv2
# import torch
# import numpy as np
# from ultralytics import YOLO
# import time
# from collections import  Counter
# from datetime import  datetime
# import torch.backends.cudnn as cudnn
# import json
# import os
#
#
# # Enable cuDNN for speed
# cudnn.benchmark = True
#
# # Set detection confidence threshold
# threshold = 0.7
# device = 'cuda' if torch.cuda.is_available() else 'cpu'
#
# # Output folders
# log_file = "proctoring_log.json"
# screenshot_dir = "suspicious_frames"
# os.makedirs(screenshot_dir, exist_ok=True)
#
# # Load model
# model = YOLO("M:\\PythonProject\\model\\yolo11n.pt")  # Update path if needed
# model.to(device)
#
# # Classes to monitor for exam security
# TARGET_CLASSES = {"person", "laptop", "cell phone", "tv"}
#
# # COCO classes
# COCO_LABELS = [
#     "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train",
#     "truck", "boat", "traffic light", "fire hydrant", "stop sign", "parking meter",
#     "bench", "bird", "cat", "dog", "horse", "sheep", "cow", "elephant", "bear",
#     "zebra", "giraffe", "backpack", "umbrella", "handbag", "tie", "suitcase",
#     "frisbee", "skis", "snowboard", "sports ball", "kite", "baseball bat",
#     "baseball glove", "skateboard", "surfboard", "tennis racket", "bottle",
#     "wine glass", "cup", "fork", "knife", "spoon", "bowl", "banana", "apple",
#     "sandwich", "orange", "broccoli", "carrot", "hot dog", "pizza", "donut",
#     "cake", "chair", "couch", "potted plant", "bed", "dining table", "toilet",
#     "tv", "laptop", "mouse", "remote", "keyboard", "cell phone", "microwave",
#     "oven", "toaster", "sink", "refrigerator", "book", "clock", "vase", "scissors",
#     "teddy bear", "hair drier", "toothbrush"
# ]
#
#
# threshold = 0.7
# log_file = "proctoring_log.json"
# screenshot_dir = "suspicious_frames"
# os.makedirs(screenshot_dir, exist_ok=True)
#
#
# def detect_frame(frame):
#     results = model.predict(frame, verbose=False)
#
#     person_count = 0
#     device_count = 0
#     frame_detections = []
#     warning_count = 0
#     MAX_WARNINGS = 3
#
#     for result in results:
#         boxes = result.boxes.xyxy.cpu().numpy()
#         scores = result.boxes.conf.cpu().numpy()
#         class_ids = result.boxes.cls.cpu().numpy().astype(int)
#
#         for (x1, y1, x2, y2), score, class_id in zip(boxes, scores, class_ids):
#             if score < threshold:
#                 continue
#             label = COCO_LABELS[class_id]
#             if label not in TARGET_CLASSES:
#                 continue
#             if label == "person":
#                 person_count += 1
#             else:
#                 device_count += 1
#             frame_detections.append({
#                 "label": label,
#                 "score": float(score),
#                 "box": [int(x1), int(y1), int(x2), int(y2)]
#             })
#
#     suspicious = person_count > 1 or device_count > 0
#     timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
#
#     if suspicious:
#         path = os.path.join(screenshot_dir, f"suspicious_{int(time.time())}.jpg")
#         cv2.imwrite(path, frame)
#
#     # Issue warning if below max count
#     if warning_count < MAX_WARNINGS:
#         warning_msg = f"[WARNING] Suspicious activity detected at {timestamp}."
#         warning_count += 1
#     elif warning_count == MAX_WARNINGS:
#         warning_msg ="[INFO] Maximum number of warnings reached. No further warnings will be issued."
#
#     log_entry = {
#         "timestamp": timestamp,
#         "person_count": person_count,
#         "device_count": device_count,
#         "suspicious": suspicious,
#         "detections": frame_detections,
#         "warning":warning_msg,
#         "warning_count":warning_count
#
#     }
#
#     with open(log_file, "a") as f:
#         json.dump(log_entry, f)
#         f.write(",\n")
#
#     return log_entry
#
