import { Component, inject } from '@angular/core';
import { VideoUploadComponent } from './components/video-upload/video-upload.component';
import { VideoPlayerComponent } from './components/video-player/video-player.component';
import { VideoStateService } from './services/video-state.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [VideoUploadComponent, VideoPlayerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  clip = inject(VideoStateService).clip;
}
