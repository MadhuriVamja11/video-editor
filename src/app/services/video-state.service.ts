import { Injectable, signal, computed } from '@angular/core';
import { VideoClip } from '../models/video-clip.model';

@Injectable({ providedIn: 'root' })
export class VideoStateService {
  readonly clips        = signal<VideoClip[]>([]);
  readonly activeIndex  = signal(0);
  readonly currentTime  = signal(0);
  readonly isPlaying    = signal(false);
  readonly volume       = signal(1);
  readonly playbackRate = signal(1);

  readonly clip     = computed(() => this.clips()[this.activeIndex()] ?? null);
  readonly duration = computed(() => this.clip()?.duration ?? 0);

  addClip(clip: VideoClip) {
    if (clip.duration <= 0 || !Number.isFinite(clip.duration)) {
      console.warn('VideoStateService: skipped clip with invalid duration', clip.duration);
      return;
    }
    const wasEmpty = this.clips().length === 0;
    this.clips.update(arr => [...arr, clip]);
    if (wasEmpty) {
      this.activeIndex.set(0);
      this.currentTime.set(0);
      this.isPlaying.set(false);
    }
  }

  setActiveIndex(index: number) {
    if (index < 0 || index >= this.clips().length) return;
    this.activeIndex.set(index);
    this.currentTime.set(0);
    this.isPlaying.set(false);
  }

  reset() {
    this.clips.set([]);
    this.activeIndex.set(0);
    this.currentTime.set(0);
    this.isPlaying.set(false);
    this.volume.set(1);
    this.playbackRate.set(1);
  }
}
