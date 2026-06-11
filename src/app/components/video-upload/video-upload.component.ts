import { Component, inject, signal } from '@angular/core';
import { VideoStateService } from '../../services/video-state.service';
import { ThumbnailService } from '../../services/thumbnail.service';
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
  private readonly thumbnailService = inject(ThumbnailService);

  isDragging = signal(false);
  clip = this.state.clip;

  readonly formatTime = formatTime;

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    // Only clear when leaving the zone entirely (not child elements)
    const target = event.relatedTarget as Node | null;
    if (!(event.currentTarget as HTMLElement).contains(target)) {
      this.isDragging.set(false);
    }
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file?.type.startsWith('video/')) {
      this.loadFile(file);
    }
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.loadFile(file);
    input.value = '';
  }

  private async loadFile(file: File) {
    const prevUrl = this.state.clip()?.url;
    const url = URL.createObjectURL(file);

    // Single video decode extracts both thumbnail and duration.
    // If extraction fails, duration=0 causes setClip to discard the clip safely.
    const { thumbnail, duration } = await this.thumbnailService
      .extractWithDuration(url)
      .catch(() => ({ thumbnail: '', duration: 0 }));

    this.state.setClip({ file, url, duration, thumbnail });

    // Revoke only after the new clip is in state so the player never holds a dead URL.
    if (prevUrl) URL.revokeObjectURL(prevUrl);
  }
}
