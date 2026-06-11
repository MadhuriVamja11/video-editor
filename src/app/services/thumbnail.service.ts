import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThumbnailService {
  extract(url: string, seekTo = 1): Promise<string> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.src = url;
      video.crossOrigin = 'anonymous';
      video.currentTime = seekTo;

      video.addEventListener('seeked', () => {
        const canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 90;
        canvas.getContext('2d')!.drawImage(video, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg'));
      });

      video.addEventListener('error', reject);
    });
  }
}
