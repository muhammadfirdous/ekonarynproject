# Eko Naryn API

Express.js REST API for the Eko Naryn recycling platform.

## Base URL

```
http://localhost:4000/api/v1
```

## Authentication

JWT-based auth. Include token in Authorization header:
```
Authorization: Bearer <access_token>
```

### Auth Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | No | Register new resident |
| POST | `/auth/login` | No | Login with phone + password |
| POST | `/auth/refresh` | No | Refresh access token |
| GET | `/auth/me` | Yes | Get current user profile |

### Users
| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/users` | Yes | Admin | List all users (filterable) |
| GET | `/users/:id` | Yes | Any | Get user by ID |
| PUT | `/users/:id` | Yes | Admin/Self | Update user |
| DELETE | `/users/:id` | Yes | Admin | Delete user |

### Materials
| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/materials` | No | - | List all materials + prices |
| POST | `/materials` | Yes | Admin | Create material |
| PUT | `/materials/:id` | Yes | Admin | Update material |
| DELETE | `/materials/:id` | Yes | Admin | Delete material |

### Pickup Requests
| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/requests` | Yes | Resident | Create pickup request |
| GET | `/requests` | Yes | Any | List requests (filtered by role) |
| GET | `/requests/:id` | Yes | Any | Get request details |
| PUT | `/requests/:id/status` | Yes | Admin/Worker | Update request status |
| DELETE | `/requests/:id` | Yes | Admin/Owner | Delete request |

### Collections
| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/collections` | Yes | Worker/Admin | Log collection (multipart w/ photo) |
| GET | `/collections` | Yes | Worker/Admin | List collections |
| GET | `/collections/:id` | Yes | Any | Get collection details |
| PUT | `/collections/:id` | Yes | Worker/Admin | Update collection |

### Trips
| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/trips` | Yes | Worker/Admin | Create trip |
| GET | `/trips` | Yes | Worker/Admin | List trips |
| GET | `/trips/:id` | Yes | Any | Get trip details |
| PUT | `/trips/:id` | Yes | Worker/Admin | Update trip |

### Routes
| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/routes` | Yes | Admin | Create route |
| GET | `/routes` | Yes | Worker/Admin | List routes |
| GET | `/routes/:id` | Yes | Any | Get route details |
| PUT | `/routes/:id` | Yes | Worker/Admin | Update route |

### Financial
| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/financial` | Yes | Admin | Create financial record |
| GET | `/financial` | Yes | Admin | List financial records |
| GET | `/financial/summary` | Yes | Admin | Get financial summary |

### Analytics
| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/analytics/overview` | Yes | Admin | Dashboard overview stats |
| GET | `/analytics/monthly` | Yes | Admin | Monthly breakdown |
| GET | `/analytics/materials` | Yes | Admin | Material-wise breakdown |
| GET | `/analytics/workers` | Yes | Admin | Per-worker statistics |

### Schedule
| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/schedule` | No | - | Get collection schedule |
| POST | `/schedule` | Yes | Admin | Create schedule entry |
| PUT | `/schedule/:id` | Yes | Admin | Update schedule entry |

## Test Credentials

| Role | Phone | Password |
|------|-------|----------|
| Admin | +996700000001 | admin123 |
| Worker | +996700000002 | worker123 |
| Resident | +996700100001 | resident123 |
