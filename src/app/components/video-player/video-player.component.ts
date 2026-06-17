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
  private readonly state = inject(VideoStateService);
  private readonly videoEl = viewChild<ElementRef<HTMLVideoElement>>('videoEl');

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
    effect(() => {
      const clip  = this.clip();
      const video = this.videoEl()?.nativeElement;
      if (!video) return;
      this.state.videoElement.set(video);
      video.src = clip?.url ?? '';
      if (clip) video.load();
    });

    effect(() => {
      const video = this.videoEl()?.nativeElement;
      if (video) video.volume = this.volume();
    });

    effect(() => {
      const video = this.videoEl()?.nativeElement;
      if (video) video.playbackRate = this.playbackRate();
    });

    effect(() => {
      const video = this.videoEl()?.nativeElement;
      if (!video) return;

      if (this.isPlaying()) {
        video.play().catch(() => this.state.isPlaying.set(false));
        this.startRaf();
      } else {
        video.pause();
        this.stopRaf();
      }
    });
  }

  // ── Playback controls ──────────────────────────────────────────────────

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
  }

  skipForward() {
    const video = this.videoEl()?.nativeElement;
    if (!video) return;
    const time = Math.min(this.duration(), video.currentTime + 5);
    video.currentTime = time;
    this.state.currentTime.set(time);
  }

  // ── Volume ─────────────────────────────────────────────────────────────

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

  // ── Playback speed ─────────────────────────────────────────────────────

  onSpeedChange(event: Event) {
    const val = Number.parseFloat((event.target as HTMLSelectElement).value);
    this.state.playbackRate.set(val);
  }

  // ── Video events ───────────────────────────────────────────────────────

  onVideoEnded() {
    this.state.isPlaying.set(false);
    this.state.currentTime.set(0);
    const video = this.videoEl()?.nativeElement;
    if (video) video.currentTime = 0;
  }

  // ── RAF loop — keeps currentTime signal in sync at ~60fps ──────────────

  private startRaf() {
    if (this.rafId !== null) return;

    const tick = () => {
      const video = this.videoEl()?.nativeElement;
      if (video && !video.paused) {
        this.state.currentTime.set(video.currentTime);
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

  ngOnDestroy() {
    this.stopRaf();
  }
}
