import cv2
import numpy as np
from db import DatabaseManager
import pickle


class EventAccessControl:
    def __init__(self, db_path="event_access.db"):
        self.db = DatabaseManager(db_path)

        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        )
        self.recognizer = cv2.face.LBPHFaceRecognizer_create()
        self.recognizer_trained = False

        self.load_recognizer()

    def train_recognizer(self):
        members = self.db.get_all_members()

        if len(members) == 0:
            self.recognizer_trained = False
            return

        faces = []
        labels = []

        for member in members:
            face_img = pickle.loads(member["face_data"])
            faces.append(face_img)
            labels.append(member["id"])

        self.recognizer.train(faces, np.array(labels))
        self.recognizer_trained = True

    def load_recognizer(self):
        self.train_recognizer()

    def preprocess_face(self, face_roi):
        face_roi = cv2.resize(face_roi, (200, 200))
        face_roi = cv2.equalizeHist(face_roi)

        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        face_roi = clahe.apply(face_roi)

        return face_roi

    def detect_faces(self, frame):
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(100, 100),
            flags=cv2.CASCADE_SCALE_IMAGE,
        )
        return faces, gray

    def process_image_data(self, image_data):
        if isinstance(image_data, bytes):
            nparr = np.frombuffer(image_data, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        else:
            frame = image_data

        if frame is None:
            raise ValueError("Could not decode image")

        faces, gray = self.detect_faces(frame)

        if len(faces) == 0:
            raise ValueError("No face detected in the image")

        if len(faces) > 1:
            largest_face = max(faces, key=lambda face: face[2] * face[3])
            x, y, w, h = largest_face
        else:
            x, y, w, h = faces[0]

        face_roi = gray[y : y + h, x : x + w]
        face_image = frame[y : y + h, x : x + w]

        face_roi = self.preprocess_face(face_roi)

        face_image = cv2.resize(face_image, (200, 200))
        face_image = cv2.cvtColor(face_image, cv2.COLOR_BGR2RGB)

        return face_roi, face_image

    def register_from_image_data(
        self, image_data, first_name, last_name, email=None, phone=None
    ):
        try:
            face_roi, face_image = self.process_image_data(image_data)
            self.db.register_member(
                first_name, last_name, email, phone, face_roi, face_image
            )
            self.train_recognizer()
            return True
        except Exception as e:
            raise e

    def verify_face(self, image_data):
        try:
            if not self.recognizer_trained:
                return {"recognized": False, "detail": "No members registered yet"}

            face_roi, _ = self.process_image_data(image_data)

            label, confidence = self.recognizer.predict(face_roi)

            threshold = 70
            if confidence < threshold:
                member = self.db.get_member_by_id(label)
                if member:
                    return {
                        "recognized": True,
                        "member_id": member["id"],
                        "first_name": member["first_name"],
                        "last_name": member["last_name"],
                        "confidence": float(confidence),
                    }

            return {"recognized": False, "confidence": float(confidence)}

        except ValueError as e:
            return {"recognized": False, "detail": str(e)}
        except Exception as e:
            raise e

    def delete_member(self, member_id):
        self.db.delete_member(member_id)
        self.train_recognizer()
