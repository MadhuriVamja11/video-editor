import { Component, inject } from '@angular/core';
import { VideoStateService } from '../../services/video-state.service';
import { formatTime } from '../../utils/time.utils';

@Component({
  selector: 'app-export-panel',
  standalone: true,
  templateUrl: './export-panel.component.html',
  styleUrl: './export-panel.component.scss',
})
export class ExportPanelComponent {
  private readonly state = inject(VideoStateService);

  readonly clip       = this.state.clip;
  readonly trimStart  = this.state.trimStart;
  readonly trimEnd    = this.state.trimEnd;
  readonly formatTime = formatTime;

  exportJson() {
    const data = {
      startTime: Math.round(this.trimStart() * 1000) / 1000,
      endTime:   Math.round(this.trimEnd()   * 1000) / 1000,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'trim.json';
    a.click();
    URL.revokeObjectURL(url);
  }
}
