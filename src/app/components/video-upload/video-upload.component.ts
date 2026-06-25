import { Component, inject, signal } from '@angular/core';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { VideoStateService } from '../../services/video-state.service';
import { VideoClip } from '../../models/video-clip.model';
import { formatTime } from '../../utils/time.utils';

@Component({
  selector: 'app-video-upload',
  standalone: true,
  imports: [DragDropModule],
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

  // ── Clip list interactions ─────────────────────────────────────────────

  selectClip(index: number) {
    this.state.setActiveIndex(index);
  }

  drop(event: CdkDragDrop<VideoClip[]>) {
    this.state.reorderClips(event.previousIndex, event.currentIndex);
  }

  removeClip(event: MouseEvent, index: number) {
    event.stopPropagation();
    this.state.removeClip(index);
  }

  // ── File loading ───────────────────────────────────────────────────────

  private loadFile(file: File) {
    if (!file.type.startsWith('video/')) return;
    const url = URL.createObjectURL(file);

    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = url;

    let actualDuration = 0;

    video.addEventListener('loadedmetadata', () => {
      if (!Number.isFinite(video.duration) || video.duration <= 0) {
        // Some WebM files (e.g. YouTube downloads) report Infinity duration because the
        // encoder never wrote the total length. Seeking past the end forces the browser
        // to scan to the real end; video.currentTime after seeked gives the true length.
        video.currentTime = 1e101;
        return;
      }
      actualDuration = video.duration;
      video.currentTime = video.duration * 0.1;
    });

    video.addEventListener('seeked', () => {
      if (actualDuration === 0) {
        actualDuration = video.currentTime;
        if (actualDuration <= 0) {
          console.warn('VideoUpload: could not determine duration for', file.name);
          return;
        }
        video.currentTime = actualDuration * 0.1;
        return;
      }
      const thumbnail = this.extractThumbnail(video);
      const clip: VideoClip = { file, url, duration: actualDuration, thumbnail };
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
