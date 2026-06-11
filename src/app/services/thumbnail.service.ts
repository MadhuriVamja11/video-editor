import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThumbnailService {
  /** Extract a thumbnail frame and video duration in a single video decode. */
  extractWithDuration(url: string, seekTo = 1): Promise<{ thumbnail: string; duration: number }> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      let resolvedDuration = 0;
      let needsThumbnailSeek = false;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      const cleanup = () => {
        if (timeoutId !== null) { clearTimeout(timeoutId); timeoutId = null; }
        video.removeEventListener('seeked', onSeeked);
        video.removeEventListener('error', onError);
        video.src = '';
        video.load();
      };

      const captureFrame = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 90;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          cleanup();
          reject(new Error('Canvas 2D context unavailable'));
          return;
        }
        // drawImage before cleanup so the decoded frame buffer is still intact.
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnail = canvas.toDataURL('image/jpeg');
        cleanup();
        resolve({ thumbnail, duration: resolvedDuration });
      };

      const onSeeked = () => {
        if (needsThumbnailSeek) {
          // First seek resolved the real duration for streaming WebM.
          // Now seek to the actual thumbnail frame before capturing.
          needsThumbnailSeek = false;
          resolvedDuration = Number.isFinite(video.duration) ? video.duration : 0;
          video.currentTime = Math.min(seekTo, resolvedDuration * 0.1);
          return;
        }
        captureFrame();
      };

      const onError = () => {
        cleanup();
        reject(new Error('Failed to load video'));
      };

      video.addEventListener('seeked', onSeeked);
      video.addEventListener('error', onError);

      // Capture duration once metadata is ready, then seek to the thumbnail frame.
      // Clamp to 10% of duration so very short clips still get a frame.
      video.addEventListener('loadedmetadata', () => {
        const duration = video.duration;
        if (Number.isFinite(duration) && duration > 0) {
          resolvedDuration = duration;
          video.currentTime = Math.min(seekTo, duration * 0.1);
        } else {
          // Streaming WebM (screen recordings) reports Infinity at loadedmetadata.
          // Seeking past the end forces the browser to scan the full file and
          // update video.duration to the real value before 'seeked' fires.
          needsThumbnailSeek = true;
          video.currentTime = 1e9;
        }
      }, { once: true });

      // Timeout guard: if loadedmetadata never fires (unsupported codec, network
      // error, or revoked blob URL), the seeked/error listeners would leak.
      timeoutId = setTimeout(() => {
        timeoutId = null;
        cleanup();
        reject(new Error('Video metadata load timed out'));
      }, 15000);

      video.crossOrigin = 'anonymous';
      video.src = url;
    });
  }

  /** Extract only a thumbnail frame (no duration). */
  extract(url: string, seekTo = 1): Promise<string> {
    return this.extractWithDuration(url, seekTo).then(({ thumbnail }) => thumbnail);
  }
}
