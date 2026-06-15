import { Component, signal } from '@angular/core';
import { formatTime } from '../../utils/time.utils';

@Component({
  selector: 'app-video-upload',
  standalone: true,
  imports: [],
  templateUrl: './video-upload.component.html',
  styleUrl: './video-upload.component.scss',
})
export class VideoUploadComponent {
  isDragging = signal(false);
  clip       = signal<any>(null);

  readonly formatTime = formatTime;

  onDragOver(_event: DragEvent)  {}
  onDragLeave(_event: DragEvent) {}
  onDrop(_event: DragEvent)      {}
  onFileSelect(_event: Event)    {}
}
