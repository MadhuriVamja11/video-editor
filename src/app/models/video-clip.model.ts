export interface VideoClip {
  file: File;
  url: string;
  duration: number;
  thumbnail: string;
}

export interface TrimRange {
  start: number;
  end: number;
}
