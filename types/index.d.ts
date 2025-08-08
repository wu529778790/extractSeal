export interface ExtractOptions {
  color?: string;
}

export interface OpenCVLoadOptions {
  url?: string;
  timeoutMs?: number;
}

export function initOpenCV(options?: OpenCVLoadOptions): Promise<boolean>;
export function extractFromFile(
  file: File,
  options?: ExtractOptions
): Promise<string[]>;
export function extractFromImage(
  img: HTMLImageElement,
  options?: ExtractOptions
): string[];
export function loadOpenCV(options?: OpenCVLoadOptions): Promise<boolean>;

// 低阶算法函数（调用前需确保 OpenCV 已初始化）
export function extractStampToMat(img: HTMLImageElement, color: string): any; // cv.Mat in runtime
export function extractCircles(mat: any): string[]; // returns base64[]
export function detectCircles(
  mat: any
): Array<{ x: number; y: number; radius: number }>;
export function cropCircle(
  mat: any,
  circle: { x: number; y: number; radius: number }
): string; // base64 PNG
export function rgbToHsv(
  r: number,
  g: number,
  b: number
): [number, number, number];
export function hexToRgba(hex: string): [number, number, number, number];

declare const _default: {
  initOpenCV: typeof initOpenCV;
  extractFromFile: typeof extractFromFile;
  extractFromImage: typeof extractFromImage;
  loadOpenCV: typeof loadOpenCV;
  extractStampToMat: typeof extractStampToMat;
  extractCircles: typeof extractCircles;
  detectCircles: typeof detectCircles;
  cropCircle: typeof cropCircle;
  rgbToHsv: typeof rgbToHsv;
  hexToRgba: typeof hexToRgba;
};
export default _default;
