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

  videoEl = viewChild<ElementRef<HTMLVideoElement>>('videoEl');

  clip = this.state.clip;
  isPlaying = this.state.isPlaying;
  volume = this.state.volume;
  playbackRate = this.state.playbackRate;
  currentTime = this.state.currentTime;
  duration = this.state.duration;
  isMuted = signal(false);

  readonly speeds = [0.5, 1, 1.5, 2];

  private rafId: number | null = null;
  private isSeeking = false;

  constructor() {
    // Load new video source whenever the clip changes
    effect(() => {
      const c = this.clip();
      const video = this.videoEl()?.nativeElement;
      if (!video) return;
      video.src = c?.url ?? '';
      if (c) video.load();
    });

    // Keep volume in sync
    effect(() => {
      const vol = this.volume();
      const video = this.videoEl()?.nativeElement;
      if (video) video.volume = vol;
    });

    // Keep playback rate in sync
    effect(() => {
      const rate = this.playbackRate();
      const video = this.videoEl()?.nativeElement;
      if (video) video.playbackRate = rate;
    });

    // Drive play / pause from signal
    effect(() => {
      const playing = this.isPlaying();
      const video = this.videoEl()?.nativeElement;
      if (!video) return;
      if (playing) {
        video.play().catch(() => this.state.isPlaying.set(false));
        this.startRaf();
      } else {
        video.pause();
        this.stopRaf();
      }
    });
  }

  togglePlay() {
    if (!this.clip()) return;
    this.state.isPlaying.set(!this.state.isPlaying());
  }

  // ── Seek ──────────────────────────────────────────────────────────────

  onSeekStart() {
    this.isSeeking = true;
    this.stopRaf();
  }

  onSeeking(event: Event) {
    const time = Number.parseFloat((event.target as HTMLInputElement).value);
    const video = this.videoEl()?.nativeElement;
    if (video) video.currentTime = time;
    this.state.currentTime.set(time);
  }

  onSeekEnd(event: Event) {
    this.isSeeking = false;
    const time = Number.parseFloat((event.target as HTMLInputElement).value);
    const video = this.videoEl()?.nativeElement;
    if (video) video.currentTime = time;
    this.state.currentTime.set(time);
    if (this.isPlaying()) this.startRaf();
  }

  // ── Volume ────────────────────────────────────────────────────────────

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

  // ── Speed ─────────────────────────────────────────────────────────────

  setSpeed(rate: number) {
    this.state.playbackRate.set(rate);
  }

  // ── Video events ──────────────────────────────────────────────────────

  onVideoEnded() {
    this.state.isPlaying.set(false);
    this.state.currentTime.set(0);
    const video = this.videoEl()?.nativeElement;
    if (video) video.currentTime = 0;
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  readonly formatTime = formatTime;

  private startRaf() {
    if (this.rafId !== null) return;
    const tick = () => {
      const video = this.videoEl()?.nativeElement;
      if (video && !video.paused && !this.isSeeking) {
        this.state.currentTime.set(video.currentTime);
      }
      if (this.state.isPlaying()) {
        this.rafId = requestAnimationFrame(tick);
      } else {
        this.rafId = null;
      }
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
