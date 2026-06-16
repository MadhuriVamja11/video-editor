import { Component, computed, inject, OnDestroy, viewChild, ElementRef, effect, output } from '@angular/core';
import WaveSurfer from 'wavesurfer.js';
import { VideoStateService } from '../../services/video-state.service';
import { formatTime } from '../../utils/time.utils';

// Evenly-spaced vertical dividers across the clip block (purely visual)
const FRAME_MARKERS = Array.from({ length: 11 }, (_, i) => ((i + 1) / 12) * 100);

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [],
  templateUrl: './timeline.component.html',
  styleUrl: './timeline.component.scss',
})
export class TimelineComponent implements OnDestroy {
  private readonly state = inject(VideoStateService);
  private readonly waveformRef = viewChild<ElementRef<HTMLElement>>('waveformRef');
  private wavesurfer: WaveSurfer | null = null;

  // Emits the seeked time (in seconds) up to the parent player
  readonly seeked = output<number>();

  readonly clip = this.state.clip;
  readonly currentTime = this.state.currentTime;
  readonly duration = this.state.duration;

  // Playhead position as a percentage of the timeline width
  readonly playheadPct = computed(() => {
    const dur = this.duration();
    return dur > 0 ? (this.currentTime() / dur) * 100 : 0;
  });

  // Time-ruler tick marks scaled to the clip's duration
  readonly ticks = computed(() => {
    const dur = this.duration();
    if (dur <= 0) return [];

    let interval: number;
    if (dur <= 30) interval = 4;
    else if (dur <= 90) interval = 10;
    else if (dur <= 300) interval = 30;
    else interval = 60;

    const marks: { label: string; pct: number }[] = [];
    for (let t = 0; t <= dur; t += interval) {
      marks.push({ label: formatTime(t), pct: (t / dur) * 100 });
    }
    return marks;
  });

  readonly frameMarkers = FRAME_MARKERS;

  constructor() {
    // Re-create WaveSurfer whenever a new clip is loaded
    effect(() => {
      const clip = this.clip();
      const container = this.waveformRef()?.nativeElement;

      this.wavesurfer?.destroy();
      this.wavesurfer = null;

      if (!clip || !container) return;

      this.wavesurfer = WaveSurfer.create({
        container,
        waveColor: '#3a5bbf',
        progressColor: '#4f8ef7',
        cursorWidth: 0,
        height: 40,
        interact: false,
        normalize: true,
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        url: clip.url,
      });
    });
  }

  // Click on the timeline ruler → calculate position → emit seek time to parent
  onTimelineClick(event: MouseEvent) {
    const dur = this.duration();
    if (dur <= 0) return;

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    this.seeked.emit(pct * dur);
  }

  ngOnDestroy() {
    this.wavesurfer?.destroy();
  }
}
