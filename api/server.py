from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import base64
import pickle
import cv2
import re
from unidecode import unidecode
from main import EventAccessControl
from difflib import SequenceMatcher

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

access_control = EventAccessControl()


def normalize_for_search(text):
    text = unidecode(text.lower().strip())
    text = re.sub(r"[^a-z\s]", "", text)
    text = " ".join(text.split())
    return text


def fuzzy_match(search_term, target, threshold=0.6):
    search_normalized = normalize_for_search(search_term)
    target_normalized = normalize_for_search(target)

    if search_normalized in target_normalized:
        return True

    if target_normalized.startswith(search_normalized):
        return True

    words_search = search_normalized.split()
    words_target = target_normalized.split()

    for search_word in words_search:
        for target_word in words_target:
            ratio = SequenceMatcher(None, search_word, target_word).ratio()
            if ratio >= threshold:
                return True
            if search_word in target_word or target_word.startswith(search_word):
                return True

    return False


def sanitize_name(name):
    name = name.strip()
    name = " ".join(name.split())
    return name


@app.get("/")
async def root():
    return {"message": "Event Access Control API", "status": "running"}


@app.post("/api/register")
async def register_member(
    first_name: str = Form(...),
    last_name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(None),
    image: UploadFile = File(None),
    camera_image: str = Form(None),
):
    try:
        first_name = sanitize_name(first_name)
        last_name = sanitize_name(last_name)

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
            raise HTTPException(
                status_code=400,
                detail="No image provided. Please upload a file or capture from camera",
            )

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
            content={
                "message": "Member registered successfully",
                "data": {
                    "first_name": first_name,
                    "last_name": last_name,
                    "email": email,
                    "phone": phone,
                },
            },
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")


@app.get("/api/members")
async def get_members(search: str = None):
    try:
        members = access_control.db.get_all_members()
        members_list = []

        for m in members:
            member_data = {
                "id": m["id"],
                "first_name": m["first_name"],
                "last_name": m["last_name"],
                "email": m["email"],
                "phone": m["phone"],
                "photo": None,
            }

            if m.get("face_image"):
                try:
                    face_image = pickle.loads(m["face_image"])
                    is_success, buffer = cv2.imencode(
                        ".jpg", cv2.cvtColor(face_image, cv2.COLOR_RGB2BGR)
                    )
                    if is_success:
                        img_base64 = base64.b64encode(buffer).decode("utf-8")
                        member_data["photo"] = f"data:image/jpeg;base64,{img_base64}"
                except:
                    member_data["photo"] = None

            members_list.append(member_data)

        if search:
            filtered_members = []

            for member in members_list:
                full_name = f"{member['first_name']} {member['last_name']}"
                search_normalized = normalize_for_search(search)
                full_name_normalized = normalize_for_search(full_name)
                first_name_normalized = normalize_for_search(member["first_name"])
                last_name_normalized = normalize_for_search(member["last_name"])

                score = 0

                if search_normalized == full_name_normalized:
                    score = max(score, 1000)

                if (
                    search_normalized == first_name_normalized
                    or search_normalized == last_name_normalized
                ):
                    score = max(score, 900)

                if full_name_normalized.startswith(search_normalized):
                    score = max(score, 800)

                if first_name_normalized.startswith(
                    search_normalized
                ) or last_name_normalized.startswith(search_normalized):
                    score = max(score, 700)

                if search_normalized in full_name_normalized:
                    score = max(score, 600)

                if (
                    search_normalized in first_name_normalized
                    or search_normalized in last_name_normalized
                ):
                    score = max(score, 500)

                if fuzzy_match(search, full_name):
                    score = max(score, 300)

                if fuzzy_match(search, member["first_name"]) or fuzzy_match(
                    search, member["last_name"]
                ):
                    score = max(score, 200)

                if search.lower() in member["email"].lower():
                    score = max(score, 150)

                if member["phone"] and search in member["phone"]:
                    score = max(score, 150)

                if search in str(member["id"]):
                    score = max(score, 150)

                if score > 0:
                    filtered_members.append((score, member))

            filtered_members.sort(key=lambda x: x[0], reverse=True)
            members_list = [member for score, member in filtered_members]

        return {"members": members_list}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch members: {str(e)}"
        )


@app.delete("/api/members/{member_id}")
async def delete_member(member_id: int):
    try:
        access_control.delete_member(member_id)
        return {"message": f"Member {member_id} deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to delete member: {str(e)}"
        )


@app.post("/api/verify")
async def verify_member(request: dict):
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


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
