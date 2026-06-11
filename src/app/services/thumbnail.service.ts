import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThumbnailService {
  extract(url: string, seekTo = 1): Promise<string> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');

      const cleanup = () => {
        video.removeEventListener('seeked', onSeeked);
        video.removeEventListener('error', onError);
        video.src = '';
        video.load(); // release media resource
      };

      const onSeeked = () => {
        cleanup();
        const canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 90;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D context unavailable'));
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg'));
      };

      const onError = () => {
        cleanup();
        reject(new Error('Failed to load video for thumbnail'));
      };

      // Set currentTime only after metadata is loaded so the seek is valid.
      // Clamp to 10% of duration to handle clips shorter than seekTo.
      video.addEventListener('loadedmetadata', () => {
        video.currentTime = video.duration > 0
          ? Math.min(seekTo, video.duration * 0.1)
          : 0;
      }, { once: true });

      video.addEventListener('seeked', onSeeked);
      video.addEventListener('error', onError);
      video.crossOrigin = 'anonymous';
      video.src = url;
    });
  }
}
