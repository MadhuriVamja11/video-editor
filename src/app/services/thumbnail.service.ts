import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThumbnailService {
  /** Extract a thumbnail frame and video duration in a single video decode. */
  extractWithDuration(url: string, seekTo = 1): Promise<{ thumbnail: string; duration: number }> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      let duration = 0;

      const cleanup = () => {
        video.removeEventListener('seeked', onSeeked);
        video.removeEventListener('error', onError);
        video.src = '';
        video.load();
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
        resolve({ thumbnail: canvas.toDataURL('image/jpeg'), duration });
      };

      const onError = () => {
        cleanup();
        reject(new Error('Failed to load video'));
      };

      // Capture duration once metadata is ready, then seek to the thumbnail frame.
      // Clamp to 10% of duration so very short clips still get a frame.
      video.addEventListener('loadedmetadata', () => {
        duration = video.duration;
        video.currentTime = duration > 0 ? Math.min(seekTo, duration * 0.1) : 0;
      }, { once: true });

      video.addEventListener('seeked', onSeeked);
      video.addEventListener('error', onError);
      video.crossOrigin = 'anonymous';
      video.src = url;
    });
  }

  /** Extract only a thumbnail frame (no duration). */
  extract(url: string, seekTo = 1): Promise<string> {
    return this.extractWithDuration(url, seekTo).then(({ thumbnail }) => thumbnail);
  }
}
