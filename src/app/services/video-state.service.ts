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
  readonly trimStart    = signal(0);
  readonly trimEnd      = signal(0);

  readonly videoElement = signal<HTMLVideoElement | null>(null);

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
      this.trimStart.set(0);
      this.trimEnd.set(clip.duration);
    }
  }

  setActiveIndex(index: number) {
    if (index < 0 || index >= this.clips().length) return;
    this.activeIndex.set(index);
    this.currentTime.set(0);
    this.isPlaying.set(false);
    const clip = this.clips()[index];
    this.trimStart.set(0);
    this.trimEnd.set(clip.duration);
  }

  reorderClips(from: number, to: number) {
    if (from === to) return;
    const arr = [...this.clips()];
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    const active = this.activeIndex();
    this.clips.set(arr);
    if (from === active) {
      this.activeIndex.set(to);
    } else if (from < active && to >= active) {
      this.activeIndex.set(active - 1);
    } else if (from > active && to <= active) {
      this.activeIndex.set(active + 1);
    }
  }

  removeClip(index: number) {
    const arr = [...this.clips()];
    arr.splice(index, 1);
    const active = this.activeIndex();
    this.clips.set(arr);
    if (arr.length === 0) {
      this.activeIndex.set(0);
      this.currentTime.set(0);
      this.isPlaying.set(false);
      this.trimStart.set(0);
      this.trimEnd.set(0);
    } else if (index < active) {
      this.activeIndex.set(active - 1);
    } else if (index === active) {
      const newIndex = Math.min(active, arr.length - 1);
      this.activeIndex.set(newIndex);
      this.currentTime.set(0);
      this.isPlaying.set(false);
      this.trimStart.set(0);
      this.trimEnd.set(arr[newIndex].duration);
    }
  }

  reset() {
    this.clips.set([]);
    this.activeIndex.set(0);
    this.currentTime.set(0);
    this.isPlaying.set(false);
    this.volume.set(1);
    this.playbackRate.set(1);
    this.trimStart.set(0);
    this.trimEnd.set(0);
  }
}
