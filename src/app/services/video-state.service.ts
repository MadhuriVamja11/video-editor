import { Injectable, signal, computed } from '@angular/core';
import { VideoClip } from '../models/video-clip.model';

@Injectable({ providedIn: 'root' })
export class VideoStateService {
  // ── State signals ──────────────────────────────────────────────────────
  readonly clip         = signal<VideoClip | null>(null);
  readonly currentTime  = signal(0);
  readonly isPlaying    = signal(false);
  readonly volume       = signal(1);
  readonly playbackRate = signal(1);

  // ── Derived values ─────────────────────────────────────────────────────
  readonly duration = computed(() => this.clip()?.duration ?? 0);

  // ── Actions ────────────────────────────────────────────────────────────

  setClip(clip: VideoClip) {
    if (clip.duration <= 0 || !Number.isFinite(clip.duration)) {
      console.warn('VideoStateService: skipped clip with invalid duration', clip.duration);
      return;
    }
    this.clip.set(clip);
    this.currentTime.set(0);
    this.isPlaying.set(false);
  }

  reset() {
    this.clip.set(null);
    this.currentTime.set(0);
    this.isPlaying.set(false);
    this.volume.set(1);
    this.playbackRate.set(1);
  }
}
