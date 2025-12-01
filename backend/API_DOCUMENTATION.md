# Planning Center API Documentation

## 🚀 Base URL
```
http://localhost:3000/api
```

## 🔐 Authentication

Toate endpoint-urile (exceptând `/auth/login`) necesită autentificare JWT.

### Header format:
```
Authorization: Bearer <token>
```

---

## 📡 Endpoints

### Authentication

#### POST `/auth/login`
Login cu username și parolă.

**Request:**
```json
{
  "username": "admin",
  "password": "Admin123!"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "admin",
    "full_name": "Administrator",
    "email": "admin@bisericavertical.ro",
    "roles": ["admin_global"],
    "roleDetails": [...]
  }
}
```

#### GET `/auth/me`
Get current user info.

**Response:**
```json
{
  "user": {
    "id": 1,
    "username": "admin",
    "full_name": "Administrator",
    "roles": ["admin_global"]
  }
}
```

---

### Services

#### GET `/services`
List all services (filtered by permissions).

**Query params:**
- `from` - Date from (YYYY-MM-DD)
- `to` - Date to (YYYY-MM-DD)
- `type` - Service type
- `status` - Service status

**Response:**
```json
{
  "services": [
    {
      "id": 1,
      "title": "Serviciu Biserică",
      "service_type": "biserica_duminica",
      "date": "2025-10-20",
      "time": "10:00",
      "location": "Biserica Vertical",
      "status": "scheduled"
    }
  ]
}
```

#### GET `/services/:id`
Get service details with items.

#### POST `/services`
Create new service (admin only).

**Request:**
```json
{
  "title": "Serviciu Biserică",
  "service_type": "biserica_duminica",
  "date": "2025-10-27",
  "time": "10:00",
  "location": "Biserica Vertical",
  "description": "Serviciu regulat"
}
```

---

### Voting

#### POST `/services/:id/open-voting`
Open voting for a service (admin only).

**Request:**
```json
{
  "roleTypes": ["trupa", "sound", "media"],
  "counts": {
    "trupa": 5,
    "sound": 1,
    "media": 1
  },
  "deadline": "2025-10-17T23:59:59"
}
```

#### GET `/votes/pending`
Get services where user needs to vote.

#### POST `/votes`
Submit vote for availability.

**Request:**
```json
{
  "pollId": 123,
  "vote": "available",
  "notes": "Pot întârzia 10 minute"
}
```

#### GET `/services/:id/votes`
Get vote results (admin only).

---

### Assignments

#### GET `/assignments/my-assignments`
Get assignments for current user.

**Query params:**
- `status` - Filter by status (pending, confirmed, declined)
- `upcoming` - Only upcoming (true/false)

#### POST `/assignments`
Create assignment (admin only).

**Request:**
```json
{
  "serviceId": 456,
  "userId": 7,
  "roleType": "trupa",
  "roleDetail": "Lead Vocal"
}
```

#### POST `/assignments/:id/confirm`
Confirm assignment (user).

#### POST `/assignments/:id/decline`
Decline assignment (user).

**Request:**
```json
{
  "reason": "Am o urgență de familie"
}
```

---

### Songs

#### GET `/songs`
List all songs with filters.

**Query params:**
- `search` - Search by title or artist
- `key` - Filter by key signature
- `tags` - Filter by tags
- `artist` - Filter by artist
- `limit` - Results limit (default: 50)

#### GET `/songs/:id`
Get song details with files.

#### POST `/songs`
Create new song (admin_trupa only).

**Request:**
```json
{
  "title": "Dumnezeul Cel Viu",
  "artist": "Worship Together",
  "key_signature": "D",
  "tempo": 72,
  "tags": "[\"laudă\", \"închinare\"]",
  "language": "ro"
}
```

---

### Notifications

#### GET `/notifications`
Get notifications for current user.

**Query params:**
- `limit` - Number of notifications (default: 20)
- `unread` - Only unread (true/false)

#### GET `/notifications/unread-count`
Get count of unread notifications.

#### PUT `/notifications/:id/read`
Mark notification as read.

#### PUT `/notifications/read-all`
Mark all notifications as read.

---

### Users (admin_global only)

#### GET `/users`
List all users.

#### GET `/users/:id`
Get user details with roles.

#### POST `/users`
Create new user.

**Request:**
```json
{
  "username": "new.user",
  "password": "password123",
  "full_name": "New User",
  "email": "new@test.ro",
  "phone": "+40700000000"
}
```

#### POST `/users/:id/roles`
Assign roles to user.

**Request:**
```json
{
  "roleIds": [1, 2, 5]
}
```

#### GET `/users/roles/all`
Get all available roles.

---

## 🔑 Roles & Permissions

### Departments (10):
1. `trupa` - Trupă Laudă
2. `trupa_tabara` - Trupă Tabără
3. `media` - Media/Video
4. `cafea` - Cafenea/Ospitalitate
5. `tineret` - Tineret UNITED
6. `grupa_copii` - Grupă Copii
7. `bun_venit` - Bun venit Biserică
8. `bun_venit_tineret` - Bun venit Tineret
9. `special` - Evenimente Speciale
10. `sound` - Sound/Tehnic

### Admin (11):
11. `admin_trupa`
12. `admin_trupa_tabara`
13. `admin_media`
14. `admin_cafea`
15. `admin_tineret`
16. `admin_grupa_copii`
17. `admin_bun_venit`
18. `admin_bun_venit_tineret`
19. `admin_special`
20. `admin_sound`
21. `admin_global` - Super Admin

---

## 🧪 Test Credentials

### Admin:
```
Username: admin
Password: Admin123!
Roles: admin_global
```

### Test Users:
```
Username: maria.popescu
Password: password123
Roles: trupa

Username: paul.radu  
Password: password123
Roles: sound, admin_sound
```

---

## ⚠️ Error Responses

### 400 Bad Request
```json
{
  "error": "Missing required fields"
}
```

### 401 Unauthorized
```json
{
  "error": "Access token required"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions",
  "required": ["admin_global"],
  "current": ["trupa"]
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

---

## 📊 Database Info

- **Total tables**: 13
- **Roles**: 21 (10 departments + 11 admin)
- **Engine**: SQLite3
- **File**: `backend/database.db`

---

**Server health check:**
```
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-13T12:00:00.000Z",
  "environment": "development"
}
```

