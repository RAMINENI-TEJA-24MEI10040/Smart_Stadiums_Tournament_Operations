# REST API Specifications: Smart Stadium Operations

This document specifies the REST routes, Zod validation schemas, and sample request/response JSON structures for the Smart Stadiums backend server.

---

## 1. Authentication Endpoints

All authorization requires a `Bearer <JWT_TOKEN>` header.

### 1.1 User Registration
- **Route**: `POST /api/auth/register`
- **Payload**:
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
- **Payload**:
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

## 2. Tournament matches

### 2.1 Schedule Match
- **Route**: `POST /api/matches`
- **Role Lock**: `OpsManager`, `Director`
- **Payload**:
```json
{
  "homeTeam": "Manchester United",
  "awayTeam": "Liverpool",
  "startTime": "2026-07-15T18:00:00.000Z",
  "endTime": "2026-07-15T20:00:00.000Z",
  "venue": "Stadium Main Arena",
  "referee": "Michael Oliver"
}
```
- **Response (211 Created)**:
```json
{
  "status": "Success",
  "message": "Match scheduled successfully",
  "data": {
    "id": "match-1721029402",
    "homeTeam": "Manchester United",
    "awayTeam": "Liverpool",
    "startTime": "2026-07-15T18:00:00.000Z",
    "endTime": "2026-07-15T20:00:00.000Z",
    "venue": "Stadium Main Arena",
    "referee": "Michael Oliver",
    "safetyLog": ["Match scheduled successfully"]
  }
}
```

---

## 3. IoT Telemetry & Gates

### 3.1 Get Stadium Telemetry
- **Route**: `GET /api/stadium/telemetry`
- **Response (200 OK)**:
```json
{
  "status": "Success",
  "data": {
    "totalAttendance": 2800,
    "activeGatesCount": 3,
    "congestedGatesCount": 1,
    "averageQueueTime": 15.4,
    "co2Level": 480,
    "sustainabilityScore": 86,
    "powerConsumption": 390
  }
}
```

### 3.2 Update Gate Sensor parameters
- **Route**: `PUT /api/stadium/gates/:id/telemetry`
- **Payload**:
```json
{
  "turnstileFlowRate": 160,
  "currentOccupancy": 920,
  "capacityLimit": 1200
}
```

---

## 4. Safety incidents Dispatcher

### 4.1 Report Incident
- **Route**: `POST /api/incidents`
- **Role Lock**: `OpsManager`, `Security`
- **Payload**:
```json
{
  "title": "Turnstile scanner failure",
  "description": "Gate 2 turnstile ticket scanner offline. Queue bottleneck forming.",
  "severity": "Medium",
  "location": "Gate 2 East entrance"
}
```

### 4.2 Compile AI Briefing Report
- **Route**: `POST /api/incidents/:id/summary`
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
- **Payload**:
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
    "responseText": "{\n  \"intent\": \"Crowd Congestion Analysis\",\n  \"riskScore\": 78,\n  \"congestedAreas\": [\"Gate 2 (East Gate)\"],\n  \"explanation\": \"East Gate 2 occupancy is at 1150/1200 capacity limit...\"\n}",
    "confidenceScore": 0.98,
    "suggestedTools": [
      {
        "name": "updateGateStatus",
        "params": { "gateId": "gate-3", "status": "Open" }
      }
    ],
    "metrics": {
      "latencyMs: 80",
      "tokens": 165,
      "costUSD": 0.00004
    }
  }
}
```
