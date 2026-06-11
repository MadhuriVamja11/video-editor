import { Component, computed, inject, OnDestroy, viewChild, ElementRef, effect, signal } from '@angular/core';
import { VideoStateService } from '../../services/video-state.service';
import { formatTime } from '../../utils/time.utils';

const FRAME_MARKERS = Array.from({ length: 11 }, (_, i) => ((i + 1) / 12) * 100);

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

  clip        = this.state.clip;
  isPlaying   = this.state.isPlaying;
  volume      = this.state.volume;
  playbackRate = this.state.playbackRate;
  currentTime = this.state.currentTime;
  duration    = this.state.duration;
  trimStart   = this.state.trimStart;
  trimEnd     = this.state.trimEnd;

  isMuted = signal(false);

  readonly speeds = [0.5, 1, 1.5, 2];

  private rafId: number | null = null;

  // ── Computed display values ───────────────────────────────────────────

  readonly playheadPct = computed(() => {
    const dur = this.duration();
    return dur > 0 ? (this.currentTime() / dur) * 100 : 0;
  });

  readonly trimLeftPct = computed(() => {
    const dur = this.duration();
    return dur > 0 ? (this.trimStart() / dur) * 100 : 0;
  });

  readonly trimRightPct = computed(() => {
    const dur = this.duration();
    return dur > 0 ? ((dur - this.trimEnd()) / dur) * 100 : 0;
  });

  readonly ticks = computed(() => {
    const dur = this.duration();
    if (dur <= 0) return [];
    let interval: number;
    if (dur <= 30) interval = 4;
    else if (dur <= 90) interval = 10;
    else if (dur <= 300) interval = 30;
    else interval = 60;
    const result: { label: string; pct: number }[] = [];
    for (let t = 0; t <= dur; t += interval) {
      result.push({ label: formatTime(t), pct: (t / dur) * 100 });
    }
    return result;
  });

  readonly frameMarkers = FRAME_MARKERS;

  readonly exportPreview = computed(() => {
    const range = this.state.trimRange();
    if (!range) return '';
    return `{ "start": ${range.start.toFixed(1)}, "end": ${range.end.toFixed(1)} }`;
  });

  readonly formatTime = formatTime;

  constructor() {
    effect(() => {
      const c = this.clip();
      const video = this.videoEl()?.nativeElement;
      if (!video) return;
      video.src = c?.url ?? '';
      if (c) video.load();
    });

    effect(() => {
      const vol = this.volume();
      const video = this.videoEl()?.nativeElement;
      if (video) video.volume = vol;
    });

    effect(() => {
      const rate = this.playbackRate();
      const video = this.videoEl()?.nativeElement;
      if (video) video.playbackRate = rate;
    });

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

  // ── Playback ──────────────────────────────────────────────────────────

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

  onSpeedChange(event: Event) {
    const val = Number.parseFloat((event.target as HTMLSelectElement).value);
    this.state.playbackRate.set(val);
  }

  // ── Timeline seek ─────────────────────────────────────────────────────

  onTimelineClick(event: MouseEvent) {
    const dur = this.duration();
    if (dur <= 0) return;
    const el = event.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const time = pct * dur;
    const video = this.videoEl()?.nativeElement;
    if (video) video.currentTime = time;
    this.state.currentTime.set(time);
  }

  // ── Export ────────────────────────────────────────────────────────────

  exportTrimJson() {
    const range = this.state.trimRange();
    if (!range) return;
    const json = JSON.stringify({ start: +range.start.toFixed(1), end: +range.end.toFixed(1) }, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trim.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  // ── Video events ──────────────────────────────────────────────────────

  onVideoEnded() {
    this.state.isPlaying.set(false);
    this.state.currentTime.set(0);
    const video = this.videoEl()?.nativeElement;
    if (video) video.currentTime = 0;
  }

  // ── RAF loop ──────────────────────────────────────────────────────────

  private startRaf() {
    if (this.rafId !== null) return;
    const tick = () => {
      const video = this.videoEl()?.nativeElement;
      if (video && !video.paused) {
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
