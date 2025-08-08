export interface ExtractOptions {
  color?: string;
}

export default class StampExtractor {
  private cvReady: boolean;
  constructor();
  initOpenCV(): Promise<boolean>;
  extractFromFile(file: File, options?: ExtractOptions): Promise<string[]>;
  extractFromImage(img: HTMLImageElement, options?: ExtractOptions): string[];
}

export { StampExtractor };
