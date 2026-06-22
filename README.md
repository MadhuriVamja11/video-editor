# Video Trim & Preview Editor — POC

**Author:** Madhuri Vamja · madhuri@simformsolutions.com  
**Date:** June 2026  
**Stack:** Angular 20 · Signals · WaveSurfer.js · Angular CDK · Canvas API

---

## Overview

A browser-based video trim and preview editor built as a proof-of-concept. Upload a local video file, preview it with custom playback controls, trim it visually on a timeline with waveform display, and export the trim range as a JSON file — no backend or video encoding required.

---

## Demo

![Video Trim Editor Demo](src/assets/demo.mp4)

> **Evidence video:** See `src/assets/demo.mp4*` for a full walkthrough of upload → trim → export.

---

## Features

| Feature | Status |
|---|---|
| Drag-and-drop or browse video upload | Done |
| Thumbnail extraction from video frame (Canvas API) | Done |
| Custom HTML5 player — play/pause, seek, volume, speed | Done |
| Seek bar + current time / duration display (M:SS) | Done |
| Playback speed selector (0.5×, 1×, 1.5×, 2×) | Done |
| Timeline with adaptive time ruler (tick marks) | Done |
| WaveSurfer.js audio waveform on timeline | Done |
| Thumbnail filmstrip on timeline | Done |
| Draggable trim handles (left = start, right = end) | Done |
| Minimum trim gap enforcement (≥ 0.5 s) | Done |
| Greyed-out regions outside trim range | Done |
| Playback loops within trim bounds, pauses at trim end | Done |
| Clip list with drag-to-reorder (Angular CDK) | Done |
| Export trim as `{ startTime, endTime }` JSON file | Done |
| Keyboard shortcut: Space = play/pause | Done |
| No backend — runs entirely in the browser | Done |

---

## Architecture

```
src/app/
├── services/
│   └── video-state.service.ts     — Angular Signals state store (single source of truth)
├── components/
│   ├── video-upload/              — Drag-drop zone, file picker, clip list, thumbnail
│   ├── video-player/              — Custom controls, RAF playhead sync, trim enforcement
│   ├── timeline/                  — Ruler, filmstrip, WaveSurfer waveform, trim handles
│   └── export-panel/              — JSON download button
├── models/
│   └── video-clip.model.ts        — VideoClip interface
└── utils/
    └── time.utils.ts              — formatTime (M:SS) and formatTimeHMS (HH:MM:SS)
```

**State management:** Angular Signals — `signal()`, `computed()`, `effect()`. All components share a single `VideoStateService`; no NgRx or prop drilling.

---

## Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Framework | Angular 20 (Standalone) | Team standard; Signals for reactive state |
| Drag & Drop | Angular CDK | Official CDK, no extra deps |
| Waveform | WaveSurfer.js 7 | Lightweight, MediaElement backend |
| Thumbnails | Canvas API | Built-in, no library needed |
| Video Playback | HTML5 Video API | Native browser support |
| Styling | SCSS | Team standard |

---

## Getting Started

**Prerequisites:** Node.js 18+ and Angular CLI installed.

```bash
# Install dependencies
npm install

# Start dev server
npm start
```

Open `http://localhost:4200` in your browser.

```bash
# Production build
npm run build
```

---

## How to Use

1. **Upload** — drag a `.mp4` file onto the upload zone, or click **Browse**.
2. **Preview** — the video loads with a thumbnail card and custom player controls.
3. **Trim** — on the timeline, drag the **left handle** to set trim start and the **right handle** to set trim end. The greyed-out regions outside the handles are excluded.
4. **Play trimmed clip** — playback is restricted to the trim range and loops automatically.
5. **Export** — click **Export JSON** in the export panel to download `trim_<name>_<timestamp>.json`:

```json
{
  "startTime": "00:00:05",
  "endTime": "00:00:42"
}
```

---

## Key Implementation Notes

- **Trim boundary enforcement:** The RAF (requestAnimationFrame) loop runs at ~60 fps and pauses playback as soon as `currentTime >= trimEnd`, ensuring frame-accurate stopping without relying on the lower-frequency `timeupdate` event.
- **Seek bar / playhead sync:** Direct DOM writes during RAF avoid Angular binding conflicts when the user is actively dragging the seek thumb.
- **WaveSurfer integration:** Uses the MediaElement backend so the waveform shares the same `<video>` element; no double-decode overhead.
- **Memory safety:** `URL.revokeObjectURL()` is called on each re-upload to prevent blob URL leaks.
- **Thumbnail filmstrip:** 2–12 thumbnails are generated asynchronously by seeking the video element to evenly-spaced timestamps and capturing Canvas frames.
-

## Out of Scope (POC)

- Actual video rendering or encoding
- Multi-track timeline
- Cloud upload or backend integration
- Audio-only waveform editing
- Mobile / responsive layout
