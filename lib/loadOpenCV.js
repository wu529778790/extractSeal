const DEFAULT_OPENCV_URL = "https://docs.opencv.org/4.5.0/opencv.js";

let loadingPromise = null;

function waitForRuntimeInitialized(timeoutMs) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("OpenCV.js 初始化超时"));
    }, timeoutMs);

    // 如果 cv 已经初始化
    if (
      typeof window !== "undefined" &&
      window.cv &&
      typeof window.cv.Mat === "function"
    ) {
      clearTimeout(timeout);
      resolve(true);
      return;
    }

    // 等待 onRuntimeInitialized 回调
    if (typeof window !== "undefined") {
      const cvGlobal = (window.cv = window.cv || {});
      const prev = cvGlobal.onRuntimeInitialized;
      cvGlobal.onRuntimeInitialized = () => {
        try {
          if (typeof prev === "function") prev();
        } finally {
          clearTimeout(timeout);
          resolve(true);
        }
      };
    }
  });
}

export function loadOpenCV(options = {}) {
  const { url = DEFAULT_OPENCV_URL, timeoutMs = 30000 } = options;

  if (typeof window === "undefined") {
    return Promise.reject(new Error("OpenCV.js 仅支持在浏览器环境中加载"));
  }

  // 如果已存在且可用
  if (window.cv && typeof window.cv.Mat === "function") {
    return Promise.resolve(true);
  }

  // 避免重复注入脚本
  if (!loadingPromise) {
    loadingPromise = new Promise((resolve, reject) => {
      // 如果已经有同 URL 的 script，在其上等待
      const exists = Array.from(document.scripts).some((s) => s.src === url);
      if (!exists) {
        const script = document.createElement("script");
        script.src = url;
        script.async = true;
        script.crossOrigin = "anonymous";
        script.onerror = () => reject(new Error("OpenCV.js 加载失败"));
        document.head.appendChild(script);
      }

      waitForRuntimeInitialized(timeoutMs)
        .then(() => resolve(true))
        .catch(reject);
    });
  }

  return loadingPromise;
}

export default loadOpenCV;
