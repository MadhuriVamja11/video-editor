import { Component } from '@angular/core';
import { VideoUploadComponent } from './components/video-upload/video-upload.component';
import { VideoPlayerComponent } from './components/video-player/video-player.component';
import { TimelineComponent } from './components/timeline/timeline.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [VideoUploadComponent, VideoPlayerComponent, TimelineComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
