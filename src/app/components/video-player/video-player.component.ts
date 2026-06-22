import { Component, inject, OnDestroy, viewChild, ElementRef, effect, signal } from '@angular/core';
import { VideoStateService } from '../../services/video-state.service';
import { formatTime } from '../../utils/time.utils';

@Component({
  selector: 'app-video-player',
  standalone: true,
  imports: [],
  templateUrl: './video-player.component.html',
  styleUrl: './video-player.component.scss',
})
export class VideoPlayerComponent implements OnDestroy {
  private readonly state    = inject(VideoStateService);
  private readonly videoEl  = viewChild<ElementRef<HTMLVideoElement>>('videoEl');
  private readonly seekBarEl = viewChild<ElementRef<HTMLInputElement>>('seekBar');

  readonly clip         = this.state.clip;
  readonly isPlaying    = this.state.isPlaying;
  readonly volume       = this.state.volume;
  readonly playbackRate = this.state.playbackRate;
  readonly currentTime  = this.state.currentTime;
  readonly duration     = this.state.duration;
  readonly isMuted      = signal(false);

  readonly speeds     = [0.5, 1, 1.5, 2];
  readonly formatTime = formatTime;

  private rafId: number | null = null;

  constructor() {
    // Load video src when clip or element changes
    effect(() => {
      const clip  = this.clip();
      const video = this.videoEl()?.nativeElement;
      if (!video) return;
      this.state.videoElement.set(video);
      video.src = clip?.url ?? '';
      if (clip) video.load();
    });

    // Sync volume to video element
    effect(() => {
      const video = this.videoEl()?.nativeElement;
      if (video) video.volume = this.volume();
    });

    // Sync playback rate to video element
    effect(() => {
      const video = this.videoEl()?.nativeElement;
      if (video) video.playbackRate = this.playbackRate();
    });

    // Play / pause based on isPlaying signal
    effect(() => {
      const video = this.videoEl()?.nativeElement;
      if (!video) return;

      if (this.isPlaying()) {
        // If at or past trimEnd, jump back to trimStart before playing
        if (video.currentTime >= this.state.trimEnd()) {
          video.currentTime = this.state.trimStart();
        }
        video.play().catch(() => this.state.isPlaying.set(false));
        this.startRaf();
      } else {
        video.pause();
        this.stopRaf();
      }
    });
  }

  // ── Playback controls ──────────────────────────────────────────────────────

  togglePlay() {
    if (!this.clip()) return;
    this.state.isPlaying.set(!this.state.isPlaying());
  }

  skipBack() {
    const video = this.videoEl()?.nativeElement;
    if (!video) return;
    const time = Math.max(0, video.currentTime - 5);
    video.currentTime = time;
    this.state.currentTime.set(time);
    this.syncSeekBar(time);
  }

  skipForward() {
    const video = this.videoEl()?.nativeElement;
    if (!video) return;
    const time = Math.min(this.duration(), video.currentTime + 5);
    video.currentTime = time;
    this.state.currentTime.set(time);
    this.syncSeekBar(time);
  }

  onSeek(event: Event) {
    const time = parseFloat((event.target as HTMLInputElement).value);
    const video = this.videoEl()?.nativeElement;
    if (video) video.currentTime = time;
    this.state.currentTime.set(time);
  }

  // ── Volume ─────────────────────────────────────────────────────────────────

  onVolumeChange(event: Event) {
    const vol = Number.parseFloat((event.target as HTMLInputElement).value);
    this.state.volume.set(vol);
    this.isMuted.set(vol === 0);
    const video = this.videoEl()?.nativeElement;
    if (video) video.muted = vol === 0;
  }

  toggleMute() {
    const video = this.videoEl()?.nativeElement;
    if (!video) return;
    const muted = !this.isMuted();
    this.isMuted.set(muted);
    video.muted = muted;
  }

  // ── Playback speed ─────────────────────────────────────────────────────────

  onSpeedChange(event: Event) {
    const val = Number.parseFloat((event.target as HTMLSelectElement).value);
    this.state.playbackRate.set(val);
  }

  // ── Video events ───────────────────────────────────────────────────────────

  onVideoEnded() {
    const trimStart = this.state.trimStart();
    this.state.isPlaying.set(false);
    this.state.currentTime.set(trimStart);
    const video = this.videoEl()?.nativeElement;
    if (video) video.currentTime = trimStart;
    this.syncSeekBar(trimStart);
  }

  // ── RAF loop — syncs seek bar and enforces trim end at ~60fps ──────────────

  private startRaf() {
    if (this.rafId !== null) return;

    const tick = () => {
      const video = this.videoEl()?.nativeElement;
      if (video && !video.paused) {
        const time = video.currentTime;

        // Reached trim end — pause and reset to trim start
        if (time >= this.state.trimEnd()) {
          const trimStart = this.state.trimStart();
          video.pause();
          video.currentTime = trimStart;
          this.state.currentTime.set(trimStart);
          this.state.isPlaying.set(false);
          this.syncSeekBar(trimStart);
          this.rafId = null;
          return;
        }

        this.state.currentTime.set(time);
        this.syncSeekBar(time);
      }

      this.rafId = this.state.isPlaying() ? requestAnimationFrame(tick) : null;
    };

    this.rafId = requestAnimationFrame(tick);
  }

  private stopRaf() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  // Update seek bar DOM value directly to avoid fighting Angular binding during drag
  private syncSeekBar(time: number) {
    const seekBar = this.seekBarEl()?.nativeElement;
    if (seekBar && document.activeElement !== seekBar) {
      seekBar.value = String(time);
    }
  }

  ngOnDestroy() {
    this.stopRaf();
  }
}
