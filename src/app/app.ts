import { Component, HostListener, inject } from '@angular/core';
import { VideoUploadComponent } from './components/video-upload/video-upload.component';
import { VideoPlayerComponent } from './components/video-player/video-player.component';
import { TimelineComponent } from './components/timeline/timeline.component';
import { ExportPanelComponent } from './components/export-panel/export-panel.component';
import { VideoStateService } from './services/video-state.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [VideoUploadComponent, VideoPlayerComponent, TimelineComponent, ExportPanelComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly state = inject(VideoStateService);

  // Space bar toggles play/pause (unless focus is in a form field)
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    const tag = (event.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    if (event.code === 'Space') {
      event.preventDefault();
      if (this.state.clip()) {
        this.state.isPlaying.set(!this.state.isPlaying());
      }
    }
  }
}
