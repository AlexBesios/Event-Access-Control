from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
import base64
import pickle
import cv2
import sqlite3
from main import EventAccessControl

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

access_control = EventAccessControl()


@app.get("/")
async def root():
    return {"message": "Face Recognition Microservice", "status": "running"}


@app.post("/api/face/register")
async def register_face(
    first_name: str = Form(...),
    last_name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(None),
    image: UploadFile = File(None),
    camera_image: str = Form(None),
):
    try:
        image_data = None

        if image:
            contents = await image.read()
            image_data = contents
        elif camera_image:
            if "," in camera_image:
                camera_image = camera_image.split(",")[1]
            image_bytes = base64.b64decode(camera_image)
            image_data = image_bytes
        else:
            raise HTTPException(status_code=400, detail="No image provided")

        try:
            access_control.register_from_image_data(
                image_data, first_name, last_name, email, phone
            )
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            if "UNIQUE constraint failed" in str(e):
                raise HTTPException(status_code=400, detail="Email already registered")
            raise HTTPException(status_code=500, detail=f"Registration error: {str(e)}")

        return JSONResponse(
            status_code=201,
            content={"message": "Face registered successfully"},
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")


@app.post("/api/face/verify")
async def verify_face(request: dict):
    try:
        camera_image = request.get("camera_image")

        if not camera_image:
            raise HTTPException(status_code=400, detail="No image provided")

        if "," in camera_image:
            camera_image = camera_image.split(",")[1]

        image_bytes = base64.b64decode(camera_image)

        result = access_control.verify_face(image_bytes)

        if result["recognized"]:
            return {
                "recognized": True,
                "member_id": result["member_id"],
                "name": f"{result['first_name']} {result['last_name']}",
                "confidence": result["confidence"],
            }
        else:
            return {"recognized": False, "detail": "Face not recognized"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")


@app.get("/api/face/image/{member_id}")
async def get_member_image(member_id: int):
    try:
        conn = sqlite3.connect("event_access.db")
        cursor = conn.cursor()
        cursor.execute("SELECT face_image FROM members WHERE id = ?", (member_id,))
        row = cursor.fetchone()
        conn.close()

        if not row or not row[0]:
            raise HTTPException(status_code=404, detail="Image not found")

        face_image = pickle.loads(row[0])
        face_image_bgr = cv2.cvtColor(face_image, cv2.COLOR_RGB2BGR)
        _, buffer = cv2.imencode(".jpg", face_image_bgr)

        return Response(content=buffer.tobytes(), media_type="image/jpeg")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get image: {str(e)}")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
