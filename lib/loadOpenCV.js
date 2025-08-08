const DEFAULT_SOURCE = "@techstark/opencv-js";

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
  const { url = DEFAULT_SOURCE, timeoutMs = 30000 } = options;

  if (typeof window === "undefined") {
    return Promise.reject(new Error("OpenCV.js 仅支持在浏览器环境中加载"));
  }

  // 如果已存在且可用
  if (window.cv && typeof window.cv.Mat === "function") {
    return Promise.resolve(true);
  }

  // 避免重复加载
  if (!loadingPromise) {
    loadingPromise = new Promise((resolve, reject) => {
      const isHttp = typeof url === "string" && /^https?:\/\//i.test(url);
      if (isHttp) {
        // 外链 CDN 模式（可能受 CORS 限制，谨慎使用）
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
      } else {
        // 包内依赖模式（推荐，避免 CORS）
        import("@techstark/opencv-js")
          .then(() => waitForRuntimeInitialized(timeoutMs))
          .then(() => resolve(true))
          .catch((err) => reject(err));
      }
    });
  }

  return loadingPromise;
}

export default loadOpenCV;
