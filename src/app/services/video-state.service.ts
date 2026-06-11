import { Injectable, signal, computed } from '@angular/core';
import { VideoClip } from '../models/video-clip.model';

@Injectable({ providedIn: 'root' })
export class VideoStateService {
  // Core video state
  clip = signal<VideoClip | null>(null);
  currentTime = signal(0);
  isPlaying = signal(false);
  volume = signal(1);
  playbackRate = signal(1);

  // Trim state
  trimStart = signal(0);
  trimEnd = signal(0);

  // Computed helpers
  duration = computed(() => this.clip()?.duration ?? 0);
  trimDuration = computed(() => this.trimEnd() - this.trimStart());

  setClip(clip: VideoClip) {
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
  }
}
