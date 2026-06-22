import { Component, inject } from '@angular/core';
import { VideoStateService } from '../../services/video-state.service';
import { formatTime, formatTimeHMS } from '../../utils/time.utils';

@Component({
  selector: 'app-export-panel',
  standalone: true,
  templateUrl: './export-panel.component.html',
  styleUrl: './export-panel.component.scss',
})
export class ExportPanelComponent {
  private readonly state = inject(VideoStateService);

  readonly clip        = this.state.clip;
  readonly trimStart   = this.state.trimStart;
  readonly trimEnd     = this.state.trimEnd;
  readonly formatTime  = formatTime;
  readonly formatTimeHMS = formatTimeHMS;

  exportJson() {
    const data = {
      startTime: formatTimeHMS(this.trimStart()),
      endTime:   formatTimeHMS(this.trimEnd()),
    };

    // Unique filename: trim_<clip-12chars>_<HHmmss>.json
    const clipName = (this.clip()?.file.name.replace(/\.[^.]+$/, '') ?? 'clip').slice(0, 12);
    const now      = new Date();
    const stamp    = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    const filename = `trim_${clipName}_${stamp}.json`;

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
