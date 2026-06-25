import { Component, inject, signal } from '@angular/core';
import { VideoStateService } from '../../services/video-state.service';
import { formatTime, formatTimeHMS } from '../../utils/time.utils';

@Component({
  selector: 'app-export-panel',
  standalone: true,
  templateUrl: './export-panel.component.html',
  styleUrl: './export-panel.component.scss',
})
export class ExportPanelComponent {
  private readonly state = inject(VideoStateService);

  readonly clip          = this.state.clip;
  readonly trimStart     = this.state.trimStart;
  readonly trimEnd       = this.state.trimEnd;
  readonly formatTime    = formatTime;
  readonly formatTimeHMS = formatTimeHMS;

  readonly exporting      = signal(false);
  readonly exportProgress = signal(0);

  exportJson() {
    const data = {
      startTime: formatTimeHMS(this.trimStart()),
      endTime:   formatTimeHMS(this.trimEnd()),
    };

    // Unique filename: trim_<clip-12chars>_<HHmmss>.json
    const clipName = (this.clip()?.file.name.replace(/\.[^.]+$/, '') ?? 'clip').slice(0, 12);
    const now      = new Date();
    const stamp    = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    const filename = `trim_${clipName}_${stamp}.json`;

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // WHY THIS IS SLOW:
  //   Uses captureStream() + MediaRecorder which records the video in real-time.
  //   The video must physically play at 1× speed for frames to be captured —
  //   a 30-second trim takes ~30 seconds to export. There is no way to speed
  //   this up with this approach; it is fundamentally bound to playback speed.
  //
  // ADDITIONAL LIMITATIONS:
  //   - captureStream() is NOT supported on iOS Safari (mobile export broken).
  //   - Firefox Android support is partial/unreliable.
  //   - Output is always WebM regardless of input format.
  //
  // FASTER ALTERNATIVE (not implemented — requires ~30 MB WASM download on first use):
  //   FFmpeg.wasm (@ffmpeg/ffmpeg) processes the file directly without real-time playback.
  //   A 30-second trim drops to ~2–5 seconds. Supports all browsers incl. iOS Safari.
  //   Trade-off: ~30 MB cold download from CDN + needs COOP/COEP headers for multi-threading.
  async exportVideo() {
    const clip = this.clip();
    if (!clip || this.exporting()) return;

    this.exporting.set(true);
    this.exportProgress.set(0);

    const start    = this.trimStart();
    const end      = this.trimEnd();
    const duration = end - start;

    // Hidden video element dedicated to export — avoids disrupting main player
    const video = document.createElement('video');
    video.src              = clip.url;
    video.muted            = true;
    video.style.position   = 'fixed';
    video.style.opacity    = '0';
    video.style.pointerEvents = 'none';
    document.body.appendChild(video);

    await new Promise<void>(resolve => { video.onloadedmetadata = () => resolve(); });
    video.currentTime = start;
    await new Promise<void>(resolve => { video.onseeked = () => resolve(); });

    const stream   = (video as any).captureStream() as MediaStream;
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : 'video/webm';

    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks: BlobPart[] = [];

    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

    recorder.onstop = () => {
      document.body.removeChild(video);
      const blob     = new Blob(chunks, { type: 'video/webm' });
      const url      = URL.createObjectURL(blob);
      const a        = document.createElement('a');
      const clipName = clip.file.name.replace(/\.[^.]+$/, '');
      a.href         = url;
      a.download     = `trim_${clipName}.webm`;
      a.click();
      URL.revokeObjectURL(url);
      this.exporting.set(false);
      this.exportProgress.set(0);
    };

    recorder.start(100);
    video.play();

    const interval = setInterval(() => {
      const elapsed = video.currentTime - start;
      this.exportProgress.set(Math.min(99, Math.round((elapsed / duration) * 100)));

      if (video.currentTime >= end) {
        clearInterval(interval);
        video.pause();
        recorder.stop();
      }
    }, 100);
  }
}
