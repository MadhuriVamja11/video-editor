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

  readonly clips       = this.state.clips;
  readonly activeIndex = this.state.activeIndex;
  readonly isDragging  = signal(false);
  readonly formatTime  = formatTime;

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
    const files = event.dataTransfer?.files;
    if (files) Array.from(files).forEach(f => this.loadFile(f));
  }

  onFileSelect(event: Event) {
    const files = (event.target as HTMLInputElement).files;
    if (files) Array.from(files).forEach(f => this.loadFile(f));
    (event.target as HTMLInputElement).value = '';
  }

  // ── Thumbnail click — switch active video ──────────────────────────────

  selectClip(index: number) {
    this.state.setActiveIndex(index);
  }

  // ── File loading ───────────────────────────────────────────────────────

  private loadFile(file: File) {
    if (!file.type.startsWith('video/')) return;
    const url = URL.createObjectURL(file);

    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = url;

    video.addEventListener('loadedmetadata', () => {
      if (!Number.isFinite(video.duration) || video.duration <= 0) {
        console.warn('VideoUpload: could not determine duration for', file.name);
        return;
      }
      video.currentTime = video.duration * 0.1;
    });

    video.addEventListener('seeked', () => {
      const thumbnail = this.extractThumbnail(video);
      const clip: VideoClip = { file, url, duration: video.duration, thumbnail };
      this.state.addClip(clip);
    });
  }

  private extractThumbnail(video: HTMLVideoElement): string {
    const canvas = document.createElement('canvas');
    canvas.width  = 160;
    canvas.height = 90;
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.7);
  }
}
