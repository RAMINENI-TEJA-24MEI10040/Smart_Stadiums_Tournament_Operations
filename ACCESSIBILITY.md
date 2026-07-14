# Accessibility Guidelines: WCAG 2.2 AA Compliance

This document outlines the accessibility guidelines, keyboard mappings, and ARIA markup implemented in the Smart Stadiums web dashboard.

---

## 1. Compliance Checklist (WCAG 2.2 AA)

- **1.1.1 Non-text Content (A)**: All image SVGs contain `role="img"` and `aria-label` or `aria-hidden="true"`. Heatmap canvas sections are described textually.
- **1.4.3 Contrast (Minimum) (AA)**: Text contrast exceeds 4.5:1. High contrast overrides supply a 7:1 ratio (pure white/yellow on black).
- **2.1.1 Keyboard (A)**: All features (forms, tabs, copilot drawers) are navigable via Tab, Enter, Space, and Arrow keys.
- **2.4.1 Skip Blocks (A)**: A skip-navigation link (`#main-content-section`) allows keyboard users to bypass headers.
- **2.4.3 Focus Order (A)**: Modals and flyout drawers capture and trap keyboard focus when active.
- **2.4.7 Focus Visible (A)**: Global CSS rules override browser outline rings to supply thick focus rings (`--focus-ring`).

---

## 2. Accessible Components & Layouts

### 2.1 Keyboard Navigation & Focus Trap
- Flyout drawers and modal dialogs are equipped with focus loop traps.
- Pressing `Escape` instantly closes active drawers and returns focus to the trigger button.
- Active tabs are set with `role="tab"` and track selection using `aria-selected`.

### 2.2 Screen Reader Landmarks & ARIA
- Pages are structured with semantic HTML5 elements: `<header>`, `<nav>`, `<main>`, `<section>`, and `<footer>`.
- Dynamic results announcements use `aria-live="polite"` to notify screen readers of content changes (e.g. chat updates).

### 2.3 Voice Integration
- Visual or physical limitations are mitigated by a **Voice Assistant mode** inside the AI Copilot.
- Combines browser Speech Recognition (Speech-to-Text) with Speech Synthesis (Text-to-Speech), letting users query operations verbally.
- Gate occupancy labels use text descriptions (e.g. "Gate 2 is Congested") instead of color-only alerts.
