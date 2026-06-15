import { Component, computed, signal } from '@angular/core';
import { formatTime } from '../../utils/time.utils';

const FRAME_MARKERS = Array.from({ length: 11 }, (_, i) => ((i + 1) / 12) * 100);

@Component({
  selector: 'app-video-player',
  standalone: true,
  imports: [],
  templateUrl: './video-player.component.html',
  styleUrl: './video-player.component.scss',
})
export class VideoPlayerComponent {
  clip         = signal<any>(null);
  isPlaying    = signal(false);
  volume       = signal(1);
  playbackRate = signal(1);
  currentTime  = signal(0);
  duration     = signal(0);
  trimStart    = signal(0);
  trimEnd      = signal(0);
  isMuted      = signal(false);

  readonly speeds       = [0.5, 1, 1.5, 2];
  readonly frameMarkers = FRAME_MARKERS;
  readonly formatTime   = formatTime;

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

  readonly exportPreview = computed(() => '');

  togglePlay()                         {}
  skipBack()                           {}
  skipForward()                        {}
  onVolumeChange(_event: Event)        {}
  toggleMute()                         {}
  onSpeedChange(_event: Event)         {}
  onTimelineClick(_event: MouseEvent)  {}
  exportTrimJson()                     {}
  onVideoEnded()                       {}
}
