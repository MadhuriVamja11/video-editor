import { Component, inject, signal } from '@angular/core';
import { VideoStateService } from '../../services/video-state.service';
import { VideoClip } from '../../models/video-clip.model';
import { formatTime } from '../../utils/time.utils';

@Component({
  selector: 'app-video-upload',
  standalone: true,
  imports: [],
  templateUrl: './video-upload.component.html',
  styleUrl: './video-upload.component.scss',
})
export class VideoUploadComponent {
  private readonly state = inject(VideoStateService);

  readonly clip       = this.state.clip;
  readonly isDragging = signal(false);
  readonly formatTime = formatTime;

  // ── Drag & drop ────────────────────────────────────────────────────────

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(_event: DragEvent) {
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) this.loadFile(file);
  }

  onFileSelect(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.loadFile(file);
  }

  // ── File loading ───────────────────────────────────────────────────────

  private loadFile(file: File) {
    const url = URL.createObjectURL(file);

    // Use a hidden <video> to read duration and grab a thumbnail frame
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = url;

    video.addEventListener('loadedmetadata', () => {
      // Some containers report Infinity until they fully buffer — skip those
      if (!Number.isFinite(video.duration) || video.duration <= 0) {
        console.warn('VideoUpload: could not determine duration for', file.name);
        return;
      }

      // Seek to 10% of the video to grab a representative thumbnail
      video.currentTime = video.duration * 0.1;
    });

    video.addEventListener('seeked', () => {
      const thumbnail = this.extractThumbnail(video);
      const clip: VideoClip = { file, url, duration: video.duration, thumbnail };
      this.state.setClip(clip);
    });
  }

  // Draws the current video frame onto a canvas and returns a data URL
  private extractThumbnail(video: HTMLVideoElement): string {
    const canvas = document.createElement('canvas');
    canvas.width  = 160;
    canvas.height = 90;
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.7);
  }
}
