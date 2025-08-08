import { loadOpenCV } from "./loadOpenCV.js";
import { extractFromImage as coreExtractFromImage } from "./StampExtractor.js";

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

// 兼容：提供一个轻量 class 包装，内部委托到函数式实现
export class StampExtractor {
  async initOpenCV(options = {}) {
    return initOpenCV(options);
  }
  async extractFromFile(file, options = {}) {
    return extractFromFile(file, options);
  }
  extractFromImage(img, options = {}) {
    return extractFromImage(img, options);
  }
}

export { loadOpenCV };
export default StampExtractor;
