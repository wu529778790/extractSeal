import { loadOpenCV } from "./loadOpenCV.js";
import {
  extractFromImage as coreExtractFromImage,
  extractStampToMat,
  extractCircles,
  detectCircles,
  cropCircle,
  rgbToHsv,
  hexToRgba,
} from "./StampExtractor.js";
export {
  extractStampToMat,
  extractCircles,
  detectCircles,
  cropCircle,
  rgbToHsv,
  hexToRgba,
} from "./StampExtractor.js";

let cvReadyPromise = null;

export async function initOpenCV(options = {}) {
  if (!cvReadyPromise) {
    cvReadyPromise = loadOpenCV(options).then(() => true);
  }
  return cvReadyPromise;
}

async function ensureReady() {
  await (cvReadyPromise ?? initOpenCV());
}

export async function extractFromFile(file, options = {}) {
  await ensureReady();
  const img = await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("图片加载失败"));
    image.src = URL.createObjectURL(file);
  });
  return extractFromImage(img, options);
}

export function extractFromImage(img, options = {}) {
  // 已确保 OpenCV 就绪，直接调用核心函数
  return coreExtractFromImage(img, options);
}

export { loadOpenCV };
export default {
  initOpenCV,
  extractFromFile,
  extractFromImage,
  loadOpenCV,
  // 算法相关原子方法（调用前需确保 OpenCV 已初始化）
  extractStampToMat,
  extractCircles,
  detectCircles,
  cropCircle,
  rgbToHsv,
  hexToRgba,
};
