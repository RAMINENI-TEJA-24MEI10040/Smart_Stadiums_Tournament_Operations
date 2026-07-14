# Accessibility Guidelines & WCAG 2.2 AA Compliance

This document outlines the accessibility guidelines, keyboard mappings, and ARIA markup implemented in the Smart Stadiums web dashboard.

---

## 1. WCAG 2.2 AA Compliance Checklist & Targets

The application is audited against the following Web Content Accessibility Guidelines (WCAG) parameters:

| Success Criterion | Level | Implementation Method | Source Files / Styles |
| :--- | :--- | :--- | :--- |
| **1.1.1 Non-text Content** | A | All icon SVGs contain `role="img"` or `aria-hidden="true"`. The heat map canvas contains an `aria-label` description. | `OperationsDashboard.tsx` |
| **1.4.3 Contrast (Minimum)** | AA | Text-to-background contrast exceeds 4.5:1. High-contrast theme overrides raise this past **7:1**. | `theme.css`, `variables.css` |
| **2.1.1 Keyboard** | A | All buttons, links, dropdown inputs, and panel triggers are reachable via `Tab` and executable via `Enter`/`Space`. | `App.tsx`, `AIAssistantDrawer.tsx` |
| **2.4.1 Skip Blocks** | A | A "Skip to Main Content" anchor link is embedded at the absolute top of the DOM. | `App.tsx` |
| **2.4.3 Focus Order** | A | DOM flow matches visual tab indexes. Active modals and drawers capture and loop keyboard focus. | `AIAssistantDrawer.tsx` |
| **2.4.7 Focus Visible** | A | High-contrast focus outline rings are defined globally on all focusable elements. | `theme.css` |
| **3.3.2 Labels or Instructions**| A | Forms inputs are linked to descriptive text tags using `<label htmlFor="...">`. | `MatchScheduler.tsx`, `VolunteerPortal.tsx` |

---

## 2. Keyboard Navigation & Focus Management

### 2.1 Tab Index & Focus Orders
- Normal DOM elements use the default logical tab order.
- Action items (such as the AI Assistant drawer toggle) are reachable via `Tab`.
- Forms do not use positive `tabindex` values, preserving the natural reading order.

### 2.2 Flyout Drawer Focus Trap
When the AI Copilot Drawer is toggled open, a focus loop is established:
1. Keyboard focus is shifted immediately to the close button inside the drawer.
2. Focus is trapped using a listener intercepting `Tab` key presses:
   - Tabbing forward from the last element loops focus back to the close button.
   - Shift-tabbing backward from the close button loops focus to the last element (Send button).
3. Pressing `Escape` closes the drawer and returns focus to the drawer toggle button.

---

## 3. Screen Reader Landmarks & ARIA Roles

### 3.1 Landmark Mappings
The page layout uses HTML5 semantic tags to outline the workspace structure:
- Navigation bar wrapped inside `<nav aria-label="Main Navigation">`.
- Core views wrapped inside `<main id="main-content-section">`.
- Distinct panels labeled via `<section aria-labelledby="...">`.

### 3.2 Dynamic Announcements (ARIA Live Regions)
- The AI chat feed uses `aria-live="polite"` inside its message container. When a new message is appended (either user query or agent response), screen readers announce the message without interrupting the user's active reading context.
- Alerts and error banners use `role="alert"` (equivalent to `aria-live="assertive"`) to notify users of failed requests immediately.

---

## 4. High Contrast & Styling Tokens

A dedicated **Accessibility Override** stylesheet manages themes:
- Spectators and operators can toggle High Contrast Mode.
- This override updates CSS custom properties to high-contrast colors (meeting WCAG AAA contrast ratio > 7:1):
  - Primary text changes to absolute white (`#ffffff`).
  - Active links change to high-visibility yellow (`#ffff00`).
  - Focus rings update to a thick `3px solid #ffaa00`.
- All CSS animations are bypassed if the user's system preferences match `prefers-reduced-motion: reduce`.

---

## 5. Voice UI (STT & TTS)

For users with physical or visual limitations, a Voice Control layer is integrated:
- **Speech Recognition (STT)**: Utilizes the browser's Web Speech API (`webkitSpeechRecognition`). Operators can dictate prompt queries verbally by clicking the microphone button.
- **Speech Synthesis (TTS)**: Reads out the AI Orchestrator's responses using `window.speechSynthesis`. Operators can toggle voice feedback on or off using the volume icon.
- **Color-Independent Warnings**: Status indicators use text warnings (e.g. "Congested") rather than depending on colors alone.
