# Event Access Control API Documentation

## Base URLs

- **Node.js API**: `http://localhost:3001`
- **Python API**: `http://localhost:8000`

## Authentication

Currently, the API does not require authentication. For production, implement JWT or API key authentication.

## Node.js API Endpoints

### Members

#### Get All Members
```http
GET /api/members
```

**Query Parameters:**
- `search` (optional): Search term for filtering members

**Response:**
```json
{
  "members": [
    {
      "id": 1,
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "phone": "1234567890",
      "photo": "http://localhost:8000/api/face/image/1"
    }
  ]
}
```

#### Register Member
```http
POST /api/members/register
Content-Type: multipart/form-data
```

**Body (FormData):**
- `first_name` (required): Member's first name
- `last_name` (required): Member's last name
- `email` (required): Member's email (unique)
- `phone` (optional): Member's phone number
- `image` (optional): Photo file upload
- `camera_image` (optional): Base64 encoded image from camera

**Response:**
```json
{
  "message": "Member registered successfully",
  "data": {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "1234567890"
  }
}
```

#### Delete Member
```http
DELETE /api/members/:member_id
```

**Response:**
```json
{
  "message": "Member 1 deleted successfully"
}
```

### Verification

#### Verify Face
```http
POST /api/verify
Content-Type: application/json
```

**Body:**
```json
{
  "camera_image": "data:image/jpeg;base64,..."
}
```

**Response (Recognized):**
```json
{
  "recognized": true,
  "member_id": 1,
  "name": "John Doe",
  "confidence": 45.32
}
```

**Response (Not Recognized):**
```json
{
  "recognized": false,
  "detail": "Face not recognized"
}
```

## Python API Endpoints

### Face Recognition

#### Register Face
```http
POST /api/face/register
Content-Type: multipart/form-data
```

**Body (FormData):**
- `first_name` (required): Member's first name
- `last_name` (required): Member's last name
- `email` (required): Member's email
- `phone` (optional): Member's phone number
- `image` (optional): Photo file upload
- `camera_image` (optional): Base64 encoded image

**Response:**
```json
{
  "message": "Face registered successfully"
}
```

#### Verify Face
```http
POST /api/face/verify
Content-Type: application/json
```

**Body:**
```json
{
  "camera_image": "data:image/jpeg;base64,..."
}
```

**Response:**
```json
{
  "recognized": true,
  "member_id": 1,
  "name": "John Doe",
  "confidence": 45.32
}
```

#### Get Member Image
```http
GET /api/face/image/:member_id
```

**Response:**
- Content-Type: `image/jpeg`
- Binary image data

## Error Responses

All endpoints return consistent error responses:

```json
{
  "detail": "Error message description"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `404` - Not Found
- `500` - Internal Server Error

## Search Algorithm

The search endpoint uses fuzzy matching with scoring:

- Exact full name match: 1000 points
- Exact first/last name match: 900 points
- Full name starts with query: 800 points
- First/last name starts with query: 700 points
- Full name contains query: 600 points
- First/last name contains query: 500 points
- Fuzzy match on full name: 300 points
- Fuzzy match on first/last name: 200 points
- Email/phone/ID contains query: 150 points

Results are sorted by score (highest first).

## Rate Limiting

Not currently implemented. For production, consider adding rate limiting middleware.

## CORS

Current CORS configuration allows:
- `http://localhost:5173` (React dev server)
- `http://localhost:3000`
- `http://localhost:3001`

Update in production to allow only your domain.
