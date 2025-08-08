export interface ExtractOptions {
  color?: string;
}

export interface OpenCVLoadOptions {
  url?: string;
  timeoutMs?: number;
}

export default class StampExtractor {
  private cvReady: boolean;
  constructor();
  initOpenCV(options?: OpenCVLoadOptions): Promise<boolean>;
  extractFromFile(file: File, options?: ExtractOptions): Promise<string[]>;
  extractFromImage(img: HTMLImageElement, options?: ExtractOptions): string[];
}

export { StampExtractor };
export function loadOpenCV(options?: OpenCVLoadOptions): Promise<boolean>;
