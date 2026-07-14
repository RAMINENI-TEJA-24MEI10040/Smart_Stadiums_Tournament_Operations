# Security Policy & OWASP Mitigations

This document outlines the security architecture, OWASP Top 10 mitigations, and Generative AI safety guardrails implemented in the Smart Stadiums platform.

---

## 1. Authentication & Authorization

### 1.1 Password Hashing
- We use **bcryptjs** to hash user passwords before database persistence.
- A salt round factor of **10** is used to ensure resistance against dictionary and brute-force attacks while maintaining server efficiency.
- Cleartext passwords are never stored or logged.

### 1.2 JWT Authentication Flow
- User authentication resolves to a signed JSON Web Token (JWT) containing the user identity and role.
- **Key Validation Requirements**:
  - Signed using the HMAC SHA256 algorithm.
  - Verification strictly requires the presence of `JWT_SECRET` in environment variables. If the variable is missing, the service immediately throws a bootstrapping error and halts execution.
  - Configured with a strict expiration window of **24 hours**.

### 1.3 Role-Based Access Control (RBAC)
Endpoints are guarded using an RBAC middleware checking user roles:
- **Director / OpsManager**: Full permissions to schedule matches, alter gate statuses, reallocate volunteers, and trigger AI tools.
- **Security / Police**: Access restricted to incident dispatches and live safety reports.
- **Volunteer**: Access restricted to personal portal shift check-in and check-out logs.

---

## 2. Input Validation & Parameter Safety

### 2.1 Zod Request Schema Validation
Every route input is validated against a compile-safe **Zod schema** before reaching the controller:
- **Registration**: Enforces email formats, username limits, and role boundaries.
- **Matches**: Verifies start and end datetime bounds.
- **Incidents**: Restricts severity levels to `'High' | 'Medium' | 'Low'`.
- If validation fails, Express halts execution and returns a structured `HTTP 400 Bad Request` listing all failing parameters.

### 2.2 parameterized Queries
- Access to SQLite (`sql.js` WebAssembly) and PostgreSQL uses parameterized queries.
- Raw SQL query string concatenation is strictly forbidden, eliminating SQL Injection vulnerabilities.

---

## 3. Generative AI Safety Guardrails

To prevent compromise of LLM contexts, we pass user prompts through the `AiGuardrails` validator:

### 3.1 Prompt Injection Detection
- Prompts are dynamically scanned against injection threat definitions (e.g. commands containing "ignore previous instructions", "system instructions override").
- High-risk queries are immediately blocked, returning an execution error.

### 3.2 PII (Personally Identifiable Information) Masking
- An automated regex filter replaces sensitive patterns before the prompt is sent to the LLM:
  - Phone Numbers: Replaced with `[PHONE_MASKED]`.
  - Credit Cards: Replaced with `[CARD_MASKED]`.
  - Emails: Replaced with `[EMAIL_MASKED]`.

### 3.3 Hallucination & Output Validation
- AI recommendations (e.g. re-routing paths or gate releases) are checked against actual database assets (e.g., verifying gate existence) before the UI renders the suggestions.

---

## 4. Secure Headers & Infrastructure Mitigations

### 4.1 Helmet.js Configuration
Secure HTTP headers are set automatically on every response:
- **Content-Security-Policy (CSP)**: Locks script sources to `'self'` and trusted CDNs, preventing Cross-Site Scripting (XSS).
- **HSTS (Strict-Transport-Security)**: Enforced for a maximum duration of 1 year:
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- **X-Frame-Options**: Enforced to `'SAMEORIGIN'` to prevent clickjacking attacks.
- **X-Content-Type-Options**: Set to `'nosniff'` to prevent mime-sniffing.

### 4.2 API Rate Limiting
- An in-memory rate-limiter protects endpoints, limiting requests to **150 calls per 1 minute** per IP.
- Excess calls receive an immediate `HTTP 429 Too Many Requests` status code.

### 4.3 Production Error Sanitization
- Under `NODE_ENV=production`, the global error middleware strips all TypeScript stack traces from responses.
- Users receive a generic `Internal System Error` message, preventing structural information disclosure.

---

## 5. Security Checklist & Auditing

- [x] Password hashing using Bcrypt
- [x] Secure HTTP headers (Helmet)
- [x] Cross-Origin Resource Sharing (CORS) whitelists
- [x] Input validation via Zod schemas
- [x] Parameterized SQL repository queries
- [x] No hardcoded JWT secrets
- [x] PII data masking regex rules
- [x] Prompt injection scanner
- [x] Stack trace sanitization in production
