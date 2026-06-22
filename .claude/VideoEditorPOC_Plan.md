# Video Trim & Preview Editor — POC Plan & Estimation

**Project:** Video Trim & Preview Editor (Angular POC)  
**Prepared by:** Madhuri  
**Date:** June 10, 2026  
**Effort:** 5 Working Days (1 Developer)

---

## 1. Objective

Build a browser-based video trim and preview editor as a proof-of-concept. The user can upload a local video, preview it with custom controls, trim it visually using a timeline, and export the trim range as JSON — with no backend or video rendering required.

---

## 2. Scope

### In Scope
- Upload local video file (drag-drop or browse)
- Custom HTML5 video player (play/pause, seek, volume, speed)
- Single-track timeline with playhead
- Visual trim handles (drag to set start/end)
- Playback restricted to trimmed portion
- Export trim as `{ startTime, endTime }` JSON file
- Thumbnail preview on upload card

### Out of Scope
- Actual video rendering or encoding
- Multi-track timeline
- Cloud upload or backend integration
- Audio-only waveform editing
- Mobile/responsive layout (desktop first for POC)

---

## 3. Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Framework | Angular 17+ | Team standard, Signals for reactive state |
| Drag & Drop | Angular CDK | Official CDK, no extra deps |
| Waveform | WaveSurfer.js | Lightweight, MediaElement backend |
| Thumbnails | Canvas API | Built-in, no library needed |
| Video Playback | HTML5 Video API | Native browser support |
| Styling | SCSS | Team standard |

---

## 4. Architecture

```
src/app/
├── services/
│   ├── video-state.service.ts     ← Angular Signals state store
│   └── thumbnail.service.ts       ← Canvas frame extraction
├── components/
│   ├── video-upload/              ← Drag-drop + file picker
│   ├── video-player/              ← Custom controls + HTML5 video
│   ├── timeline/                  ← Ruler + clip block + trim handles + playhead
│   └── export-panel/              ← JSON download
└── models/
    └── video-clip.model.ts
```

**State Management:** Angular Signals (no NgRx needed for POC scope).  
All components share a single `VideoStateService` — no prop drilling.

---

## 5. Task Breakdown & Estimation

### Day 1 — Project Setup & Video Upload (8h)

| Task | Est. |
|---|---|
| Project scaffold (`ng new`, install CDK + WaveSurfer) | 1h |
| `VideoStateService` — define all signals and computed values | 1.5h |
| `VideoUploadComponent` — drag-drop zone + file browse button | 2h |
| `createObjectURL` wiring, load video metadata (duration) | 1h |
| Basic `<video>` element renders uploaded file | 1h |
| Manual testing + fixes | 1.5h |

**Day 1 Total: 8h**

---

### Day 2 — Custom Video Player Controls (8h)

| Task | Est. |
|---|---|
| Hide native browser controls | 0.5h |
| Play / Pause button (synced to signal) | 1h |
| Seek bar (range input, synced bidirectionally) | 1.5h |
| Volume slider + mute toggle | 1h |
| Playback speed selector (0.5×, 1×, 2×) | 1h |
| Current time / total duration display (MM:SS) | 1h |
| `requestAnimationFrame` loop for smooth playhead sync | 1h |
| Manual testing + fixes | 1h |

**Day 2 Total: 8h**

---

### Day 3 — Timeline Component (8h)

| Task | Est. |
|---|---|
| Timeline container with time ruler (tick marks at intervals) | 2h |
| Clip block — spans full video duration, proportional width | 1h |
| Playhead — absolutely positioned, driven by signal | 1.5h |
| Click-to-seek on timeline | 1h |
| WaveSurfer.js waveform integration (MediaElement backend) | 2h |
| Manual testing + fixes | 0.5h |

**Day 3 Total: 8h**

---

### Day 4 — Trim Handles & Trim Enforcement (8h)

| Task | Est. |
|---|---|
| Left trim handle — CDK drag, constrained to [0, trimEnd] | 2h |
| Right trim handle — CDK drag, constrained to [trimStart, duration] | 1.5h |
| Enforce minimum gap between handles (≥ 0.5s) | 0.5h |
| Grey-out / darken regions outside trim range | 1h |
| Playback loops within trim bounds, pauses at trimEnd | 1h |
| Trim start/end values displayed in UI | 0.5h |
| Manual testing + edge cases | 1.5h |

**Day 4 Total: 8h**

---

### Day 5 — Thumbnail, Export & Polish (8h)

| Task | Est. |
|---|---|
| Canvas API thumbnail extraction from video frame | 1.5h |
| Thumbnail displayed on upload card with duration badge | 1h |
| Export JSON button → Blob download (`{ startTime, endTime }`) | 1h |
| Keyboard shortcut: Space = play/pause | 0.5h |
| Edge cases: re-upload, very short clips, zero-duration | 1h |
| UI polish — spacing, icons, loading states | 1.5h |
| Final end-to-end test pass | 1.5h |

**Day 5 Total: 8h**

---

## 6. Summary Estimation

| Phase | Days | Hours |
|---|---|---|
| Day 1 — Setup & Upload | 1 day | 8h |
| Day 2 — Player Controls | 1 day | 8h |
| Day 3 — Timeline | 1 day | 8h |
| Day 4 — Trim Handles | 1 day | 8h |
| Day 5 — Thumbnail + Export + Polish | 1 day | 8h |
| **Total** | **5 days** | **40h** |

> Buffer recommendation: Add 1 day (8h) buffer for review feedback, scope changes, or unexpected browser compatibility issues. Final delivery: **6 working days**.

---

## 7. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| WaveSurfer re-renders on container resize | Medium | Debounce `ResizeObserver` callback |
| CDK drag events firing outside Angular zone | Medium | Wrap signal writes in `NgZone.run()` |
| Canvas CORS error on video frames | Low | Only affects remote URLs; local `blob:` URLs are safe |
| `createObjectURL` memory leak on re-upload | Low | Call `URL.revokeObjectURL()` on each re-upload |
| Trim handles overlapping at clip boundaries | Low | Enforce minimum gap constraint in drag logic |
| Browser differences in `timeupdate` accuracy | Low | Use `requestAnimationFrame` instead of `timeupdate` |

---

## 8. Deliverables

- [ ] Fully functional Angular POC (source code)
- [ ] README with setup instructions (`npm install && ng serve`)
- [ ] Working demo — upload, trim, export JSON
- [ ] No backend required — runs entirely in browser

---

## 9. Dependencies

- Node.js 18+ and Angular CLI installed
- No backend / API integration needed
- Test video file for demo (any `.mp4`)

---

*Prepared for TL review — June 10, 2026*
