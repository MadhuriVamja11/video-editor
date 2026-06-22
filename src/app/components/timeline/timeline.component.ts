import { Component, inject, computed, viewChild, ElementRef, effect, signal, OnDestroy } from '@angular/core';
import WaveSurfer from 'wavesurfer.js';
import { VideoStateService } from '../../services/video-state.service';
import { formatTime } from '../../utils/time.utils';

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [],
  templateUrl: './timeline.component.html',
  styleUrl: './timeline.component.scss',
})
export class TimelineComponent implements OnDestroy {
  private readonly state = inject(VideoStateService);

  readonly waveformEl  = viewChild<ElementRef<HTMLDivElement>>('waveformContainer');
  readonly tracksColEl = viewChild<ElementRef<HTMLDivElement>>('tracksCol');

  readonly clip        = this.state.clip;
  readonly currentTime = this.state.currentTime;
  readonly duration    = this.state.duration;
  readonly trimStart   = this.state.trimStart;
  readonly trimEnd     = this.state.trimEnd;
  readonly formatTime  = formatTime;

  private wavesurfer: WaveSurfer | null = null;
  readonly thumbnails  = signal<string[]>([]);

  readonly playheadPct = computed(() => {
    const dur = this.duration();
    return dur > 0 ? (this.currentTime() / dur) * 100 : 0;
  });

  readonly trimStartPct = computed(() => {
    const dur = this.duration();
    return dur > 0 ? (this.trimStart() / dur) * 100 : 0;
  });

  readonly trimEndPct = computed(() => {
    const dur = this.duration();
    return dur > 0 ? (this.trimEnd() / dur) * 100 : 100;
  });

  readonly timeMarks = computed(() => {
    const dur = this.duration();
    if (dur <= 0) return [];

    let step = 1;
    if (dur > 120) step = 30;
    else if (dur > 60) step = 15;
    else if (dur > 30) step = 10;
    else if (dur > 15) step = 5;
    else if (dur > 5)  step = 2;

    const marks: { time: number; left: number }[] = [];
    for (let t = 0; t <= dur; t += step) {
      marks.push({ time: t, left: (t / dur) * 100 });
    }
    return marks;
  });

  constructor() {
    // (Re)create WaveSurfer when container, video element, or clip changes
    effect(() => {
      const container = this.waveformEl()?.nativeElement;
      const media     = this.state.videoElement();
      const clip      = this.clip();

      this.wavesurfer?.destroy();
      this.wavesurfer = null;

      if (!container || !media || !clip) return;

      this.wavesurfer = WaveSurfer.create({
        container,
        media,
        url:           clip.url,
        waveColor:     '#3a5bbf',
        progressColor: '#4f8ef7',
        cursorWidth:   0,
        height:        56,
        interact:      false,
        normalize:     true,
        barWidth:      2,
        barGap:        1,
        barRadius:     2,
      });
    });

    // Generate thumbnail filmstrip when clip changes
    effect(() => {
      const clip = this.clip();
      this.thumbnails.set([]);
      if (clip) void this.generateThumbs(clip.url, clip.duration);
    });
  }

  private async generateThumbs(url: string, duration: number): Promise<void> {
    const count = Math.min(Math.max(2, Math.ceil(duration / 3)), 12);
    const vid   = document.createElement('video');
    vid.src     = url;
    vid.muted   = true;
    vid.preload = 'auto';

    try {
      await new Promise<void>((resolve, reject) => {
        vid.addEventListener('loadedmetadata', () => resolve(), { once: true });
        vid.addEventListener('error', () => reject(new Error('video load failed')), { once: true });
      });

      const canvas  = document.createElement('canvas');
      canvas.width  = 96;
      canvas.height = 54;
      const ctx = canvas.getContext('2d')!;
      const thumbs: string[] = [];

      for (let i = 0; i < count; i++) {
        vid.currentTime = i === 0 ? 0 : (i / (count - 1)) * duration;
        await new Promise<void>(r => vid.addEventListener('seeked', () => r(), { once: true }));
        ctx.drawImage(vid, 0, 0, 96, 54);
        thumbs.push(canvas.toDataURL('image/jpeg', 0.7));
      }

      this.thumbnails.set(thumbs);
    } finally {
      vid.src = '';
    }
  }

  // Click anywhere on track to seek
  onTrackClick(event: MouseEvent) {
    const el = event.currentTarget as HTMLElement;
    const { left, width } = el.getBoundingClientRect();
    const time = ((event.clientX - left) / width) * this.duration();
    const video = this.state.videoElement();
    if (video) video.currentTime = time;
    this.state.currentTime.set(time);
  }

  // Drag a trim handle left or right
  startTrimDrag(event: MouseEvent, handle: 'start' | 'end') {
    event.preventDefault();
    event.stopPropagation(); // don't trigger track click / seek

    const tracksEl = this.tracksColEl()?.nativeElement;
    if (!tracksEl) return;

    const onMove = (e: MouseEvent) => {
      const rect = tracksEl.getBoundingClientRect();
      const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const time = pct * this.duration();

      if (handle === 'start') {
        // Keep at least 0.5s gap from trim end
        this.state.trimStart.set(Math.max(0, Math.min(time, this.state.trimEnd() - 0.5)));
      } else {
        // Keep at least 0.5s gap from trim start
        this.state.trimEnd.set(Math.max(this.state.trimStart() + 0.5, Math.min(time, this.duration())));
      }
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  ngOnDestroy(): void {
    this.wavesurfer?.destroy();
  }
}
