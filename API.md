# REST API Specifications

This document specifies the REST routes, Zod validation schemas, and sample request/response JSON structures for the Smart Stadiums backend server.

---

## 1. Authentication Endpoints

All authorization requires a `Authorization: Bearer <JWT_TOKEN>` header for guarded routes.

### 1.1 User Registration
- **Route**: `POST /api/auth/register`
- **Method**: `POST`
- **Auth Required**: No
- **Payload Schema**:
```json
{
  "username": "opsmanager1",
  "password": "securepassword",
  "role": "OpsManager",
  "name": "Marcus Aurelius",
  "email": "marcus@stadium.org"
}
```
- **Response (201 Created)**:
```json
{
  "status": "Success",
  "message": "User registered successfully",
  "data": {
    "id": "usr-1721020304",
    "username": "opsmanager1",
    "role": "OpsManager",
    "name": "Marcus Aurelius",
    "email": "marcus@stadium.org"
  }
}
```

### 1.2 User Login
- **Route**: `POST /api/auth/login`
- **Method**: `POST`
- **Auth Required**: No
- **Payload Schema**:
```json
{
  "username": "opsmanager1",
  "password": "securepassword"
}
```
- **Response (200 OK)**:
```json
{
  "status": "Success",
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "usr-1721020304",
      "username": "opsmanager1",
      "role": "OpsManager"
    }
  }
}
```

---

## 2. Tournament Matches API

### 2.1 Get Matches
- **Route**: `GET /api/matches`
- **Method**: `GET`
- **Auth Required**: No
- **Response (200 OK)**: Resolves with an array of matches.

### 2.2 Schedule Match
- **Route**: `POST /api/matches`
- **Method**: `POST`
- **Auth Required**: Yes (Roles: `OpsManager`, `Director`)
- **Payload Schema**:
```json
{
  "homeTeam": "Brazil",
  "awayTeam": "Germany",
  "startTime": "2026-07-15T18:00:00.000Z",
  "endTime": "2026-07-15T20:00:00.000Z",
  "venue": "Stadium Main Arena",
  "referee": "Michael Oliver"
}
```
- **Response (201 Created)**:
```json
{
  "status": "Success",
  "message": "Match scheduled successfully",
  "data": {
    "id": "match-1721029402",
    "homeTeam": "Brazil",
    "awayTeam": "Germany",
    "startTime": "2026-07-15T18:00:00.000Z",
    "endTime": "2026-07-15T20:00:00.000Z",
    "venue": "Stadium Main Arena",
    "referee": "Michael Oliver",
    "safetyLog": ["Match scheduled successfully"]
  }
}
```

### 2.3 Update Match Status
- **Route**: `PATCH /api/matches/:id/status`
- **Method**: `PATCH`
- **Auth Required**: Yes (Roles: `OpsManager`, `Director`)
- **Payload Schema**:
```json
{
  "status": "Live",
  "safetyMessage": "Gates opened. Spectators entering."
}
```
- **Response (200 OK)**: Returns updated match entity.

---

## 3. IoT Telemetry & Gates

### 3.1 Get Telemetry
- **Route**: `GET /api/stadium/telemetry`
- **Method**: `GET`
- **Auth Required**: No
- **Response (200 OK)**: Returns aggregated metrics card.

### 3.2 Update Gate Sensor parameters
- **Route**: `PUT /api/stadium/gates/:id/telemetry`
- **Method**: `PUT`
- **Auth Required**: No
- **Payload Schema**:
```json
{
  "turnstileFlowRate": 160,
  "currentOccupancy": 920,
  "capacityLimit": 1200
}
```
- **Response (200 OK)**: Returns updated gate details.

### 3.3 Get System Health Checks
- **Route**: `GET /api/stadium/health`
- **Method**: `GET`
- **Auth Required**: No
- **Response (200 OK)**: Returns server parameters (uptime, memory percentages, CPU loads).

---

## 4. Safety Incidents Dispatcher

### 4.1 File Incident
- **Route**: `POST /api/incidents`
- **Method**: `POST`
- **Auth Required**: Yes (Roles: `OpsManager`, `Security`)
- **Payload Schema**:
```json
{
  "title": "Corridor crowd congestion",
  "description": "Exits on Section C stands blocked by bottlenecks.",
  "severity": "Medium",
  "location": "Section C Stand corridor"
}
```
- **Response (201 Created)**: Returns filed incident.

### 4.2 Compile AI Briefing Report
- **Route**: `POST /api/incidents/:id/ai-summary`
- **Method**: `POST`
- **Auth Required**: Yes (Roles: `OpsManager`, `Security`)
- **Response (200 OK)**:
```json
{
  "status": "Success",
  "message": "AI briefing report compiled successfully",
  "data": {
    "id": "inc-172948293",
    "aiSummary": "Executive Briefing: Ticket scanning hardware failure resolved..."
  }
}
```

---

## 5. GenAI Orchestration

### 5.1 AI Command Query
- **Route**: `POST /api/ai/query`
- **Method**: `POST`
- **Auth Required**: Yes
- **Payload Schema**:
```json
{
  "query": "Identify congested gates and recommend actions.",
  "sessionId": "session-ops-main"
}
```
- **Response (200 OK)**:
```json
{
  "status": "Success",
  "source": "Live Model",
  "data": {
    "agentName": "Crowd",
    "responseText": "Congested gates identified at East entrance. Recommend opening alternate Gate 4 West.",
    "confidenceScore": 0.98,
    "suggestedTools": [
      {
        "name": "updateGateStatus",
        "params": { "gateId": "gate-4", "status": "Open" }
      }
    ],
    "metrics": {
      "latencyMs": 85,
      "tokens": 165,
      "costUSD": 0.00004
    }
  }
}
```
