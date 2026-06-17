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

  readonly waveformEl = viewChild<ElementRef<HTMLDivElement>>('waveformContainer');

  readonly clip        = this.state.clip;
  readonly currentTime = this.state.currentTime;
  readonly duration    = this.state.duration;
  readonly formatTime  = formatTime;

  private wavesurfer: WaveSurfer | null = null;
  readonly thumbnails  = signal<string[]>([]);

  readonly playheadPct = computed(() => {
    const dur = this.duration();
    return dur > 0 ? (this.currentTime() / dur) * 100 : 0;
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
        vid.addEventListener('error', () => reject(), { once: true });
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

  ngOnDestroy(): void {
    this.wavesurfer?.destroy();
  }
}
