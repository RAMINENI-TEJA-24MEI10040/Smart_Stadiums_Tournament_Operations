# Security Policy: OWASP Mitigations & Guardrails

This document outlines the security architecture and OWASP Top 10 mitigations implemented in the Smart Stadiums platform.

---

## 1. Core Security Features

### 1.1 OWASP Top 10 Mitigations
- **A01:2021-Broken Access Control**: Enforced using strict **JWT authentication** and **Role-Based Access Control (RBAC)** guards on endpoints.
- **A03:2021-Injection**: Prevented by using **parameterized queries** in both SQLite and Postgres repositories. Raw SQL queries are never concatenated. Input schemas are strictly validated via **Zod** schema validations.
- **A05:2021-Security Misconfiguration**: Enforced via **Helmet.js** with secure Content Security Policies (CSP), HTTP Strict Transport Security (HSTS), XSS protection filters, and CORS whitelisting.

---

## 2. Infrastructure Security Middlewares

### 2.1 Content Security Policy (CSP)
Helmet is configured with strict script and connect controls:
- Scripts are restricted to self and safe inline elements.
- Stylesheets are locked down to trusted CDNs (Google Fonts).
- Image uploads are restricted to data URIs and verified domains.

### 2.2 HSTS (HTTP Strict Transport Security)
Enforced for a maximum duration of 1 year:
`Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`

### 2.3 IP Flood Protection (Rate Limiting)
An in-memory sliding window rate limiter protects endpoints:
- Limits requests to **150 requests per 1 minute** per client IP.
- Excess requests are immediately blocked and returned with HTTP 429 Too Many Requests.

---

## 3. Data Integrity & Logging

### 3.1 Input Validation Layer
Every write route intercepts payloads using a validation middleware:
- Bodies are parsed against **Zod schemas** (e.g. email checks, character lengths, coordinate boundaries).
- Any validation mismatch returns a formatted HTTP 400 Bad Request listing the fields that failed.

### 3.2 Audit Logging
All mutative operations (POST, PUT, DELETE, PATCH) are intercept-logged:
- Outputs to standard console logs containing: Timestamp, User, Access Role, Method, Path, Response Status, and Latency.
- Protects confidentiality by ensuring no passwords, JWT tokens, or credit cards are logged.
