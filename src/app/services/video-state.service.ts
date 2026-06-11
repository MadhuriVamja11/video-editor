import { Injectable, signal, computed } from '@angular/core';
import { VideoClip, TrimRange } from '../models/video-clip.model';

@Injectable({ providedIn: 'root' })
export class VideoStateService {
  clip = signal<VideoClip | null>(null);
  currentTime = signal(0);
  isPlaying = signal(false);
  volume = signal(1);
  playbackRate = signal(1);

  trimStart = signal(0);
  trimEnd = signal(0);

  duration = computed(() => this.clip()?.duration ?? 0);

  // Clamped to 0 — prevents negative duration if handles cross
  trimDuration = computed(() => Math.max(0, this.trimEnd() - this.trimStart()));

  // Typed as TrimRange | null — null when no clip is loaded (distinguishes uninitialised from zero-length)
  trimRange = computed<TrimRange | null>(() =>
    this.clip() ? { start: this.trimStart(), end: this.trimEnd() } : null
  );

  setClip(clip: VideoClip) {
    if (clip.duration <= 0 || !Number.isFinite(clip.duration)) {
      console.warn('VideoStateService: ignored clip with invalid duration', clip.duration);
      return;
    }
    this.clip.set(clip);
    this.trimStart.set(0);
    this.trimEnd.set(clip.duration);
    this.currentTime.set(0);
    this.isPlaying.set(false);
  }

  reset() {
    this.clip.set(null);
    this.currentTime.set(0);
    this.isPlaying.set(false);
    this.trimStart.set(0);
    this.trimEnd.set(0);
    this.volume.set(1);
    this.playbackRate.set(1);
  }
}
