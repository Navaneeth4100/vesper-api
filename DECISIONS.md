# Technical & Design Decisions — Vesper AI Landing Page

## 1. Why Specific Design & Technology Choices Were Made

### Technology Choice: Vanilla HTML5 / Modern CSS Custom Properties / Vanilla JS (Zero-Dependency)
- **Zero Build Step & Instant Load**: To guarantee sub-50ms initial load time and zero framework overhead, we selected vanilla JavaScript paired with a modular CSS custom properties system. This allows the landing page to run instantly in any environment without bundle compilation or hydration lag.
- **Obsidian Dark-Mode Aesthetic (`#07090E`)**: Developer tool products (e.g. Vercel, Supabase, Linear) achieve high perceptual quality with deep obsidian backdrops, ultra-crisp typography (`Inter` and `JetBrains Mono`), glassmorphism card containers (`backdrop-filter: blur(20px)`), and focused neon violet (`#8B5CF6`) / electric cyan (`#06B6D4`) accent glows.
- **Interactive Live Workbench in the Hero**: Rather than presenting static screenshots or videos, the hero section features a real, interactive API workbench card (`POST`, `GET`, `PUT` routes, execution latency sliders, status code pickers, and real-time syntax-highlighted JSON rendering). This delivers the "wow, I want an account" reaction within the first 3 seconds.

---

## 2. Trade-Off Made Under Time Limit & 1-Week Roadmap

### Trade-Off Under Time Limit
- **Local State Mock Simulation instead of WebAssembly Engine**: Due to single-session delivery constraints, the live API workbench simulates edge response delays and status codes using asynchronous JavaScript timeouts and client-side payload templates, rather than compiling an actual WebAssembly OpenAPI parser in-browser.

### What Would Be Done With a Full Week
1. **In-Browser WebAssembly Engine (`vesper-wasm`)**: Compile the Rust OpenAPI parser into WASM so users can upload their actual `.yaml` / `.json` OpenAPI 3.1 files and test live mock routes locally in their browser without sending data to a backend.
2. **Interactive Command Palette (`⌘K`)**: Implement a full fuzzy-search modal allowing developers to search API endpoints, generate client SDKs, and jump directly to documentation.
3. **Live WebSocket / Server-Sent Events (SSE) Stream Demo**: Add a tab demonstrating streaming AI response payloads (`text/event-stream`) with real-time character typing animation.

---

## 3. Where AI Tools Were Leveraged & What Was Manually Verified

### AI Leverage
- **Design System Token Synthesis**: Assisted in calculating cohesive color tokens, HSL adjustments for neon glow overlays, and responsive font size scales (`clamp()`).
- **Synthetic Data Generation**: Drafted realistic OpenAPI schema payloads and mock responses (OpenAI completion schema, real-time edge analytics payload, and user state state machine).

### Manual Verification & Engineering Rigor
- **Responsive Layout & Overflow Audit**: Manually audited CSS flex and grid behaviors from 390px mobile viewports (iPhone 14/15) up to 1440px+ ultra-wide desktops to guarantee zero horizontal scrollbar (`overflow-x: hidden`).
- **Interactive Event Listener Integrity**: Verified state switching for all endpoint tabs, latency slider event binding, HTTP status code response toggling, clipboard copy toasts, and button loading spinners.
- **Accessibility & Contrast**: Confirmed text contrast ratios against dark obsidian surfaces for both code blocks and body typography.
