# Contributing Guidelines: Code Quality Standards

We welcome contributions to the Smart Stadiums platform. To maintain our high score in code quality and clean architecture, please follow these guidelines.

---

## 1. Architectural Rules & Standards

- **SOLID Principles**: Each class must have a single responsibility. Business operations should be encapsulated in application services, not inside Express controllers.
- **Strict Typing**: TypeScript is configured in strict mode. Do not use `any` unless absolutely unavoidable (e.g. mock interface fallback parameters).
- **Security Check**: Enforce parameterized query patterns to block SQL injections. Ensure all input properties are Zod schema validated.
- **A11y Check**: Double-check all UI elements are WCAG 2.2 AA compliant. Ensure modal overlays include focus traps.

---

## 2. Coding Workflow

1. **Format Code**:
   Run ESLint before checking in code:
   ```bash
   npm run lint
   ```
2. **Write Tests**:
   Ensure code additions are backed by Jest/Vitest automated tests:
   ```bash
   npm run test
   ```
   Verify code coverage is maintained above 90%.

3. **Git Commit Format**:
   Follow semantic commit formats (Angular style):
   - `feat(auth): add password hashing encryption`
   - `fix(telemetry): fix gate congestion percentage calculations`
   - `docs(a11y): update high contrast theme maps`
   - `test(ai): check prompt injection security guardrail`
