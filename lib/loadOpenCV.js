const CDN_FALLBACK =
  "https://cdn.jsdelivr.net/npm/@techstark/opencv-js/dist/opencv.js";
let DEFAULT_SOURCE = undefined; // 动态注入本地同源 url，失败则走 import 或 CDN

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

    // 等待 onRuntimeInitialized / ready 回调，同时增加轮询兜底
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

      // 支持 Emscripten 新的 ready Promise
      if (
        cvGlobal &&
        cvGlobal.ready &&
        typeof cvGlobal.ready.then === "function"
      ) {
        cvGlobal.ready.then(() => {
          clearTimeout(timeout);
          resolve(true);
        });
      }

      const poll = setInterval(() => {
        if (window.cv && typeof window.cv.Mat === "function") {
          clearInterval(poll);
          clearTimeout(timeout);
          resolve(true);
        }
      }, 50);
    }
  });
}

export function loadOpenCV(options = {}) {
  const { url, timeoutMs = 60000 } = options;

  if (typeof window === "undefined") {
    return Promise.reject(new Error("OpenCV.js 仅支持在浏览器环境中加载"));
  }

  // 如果已存在且可用
  if (window.cv && typeof window.cv.Mat === "function") {
    return Promise.resolve(true);
  }

  // 避免重复加载
  if (!loadingPromise) {
    loadingPromise = new Promise(async (resolve, reject) => {
      const injectScript = (src) =>
        new Promise((res, rej) => {
          const exists = Array.from(document.scripts).some(
            (s) => s.src === src
          );
          if (exists) return res(true);
          const script = document.createElement("script");
          script.src = src;
          script.async = true;
          script.crossOrigin = "anonymous";
          script.onerror = () => rej(new Error("OpenCV.js 加载失败"));
          script.onload = () => res(true);
          document.head.appendChild(script);
        });

      const finalize = () => {
        if (
          window.cv &&
          window.cv.ready &&
          typeof window.cv.ready.then === "function"
        ) {
          window.cv.ready.then(() => resolve(true)).catch(reject);
          return;
        }
        waitForRuntimeInitialized(timeoutMs)
          .then(() => resolve(true))
          .catch(reject);
      };

      try {
        if (typeof url === "string" && /^https?:\/\//i.test(url)) {
          // 指定自定义 CDN
          await injectScript(url);
          finalize();
          return;
        }

        // 先尝试运行时动态 import 包（不会被打进主包）
        const dynamicImport = new Function("s", "return import(s)");
        await dynamicImport("@techstark/opencv-js");
        finalize();
      } catch (e) {
        // 回退到 jsDelivr CDN
        try {
          await injectScript(CDN_FALLBACK);
          finalize();
        } catch (e2) {
          reject(e2);
        }
      }
    });
  }

  return loadingPromise;
}

export default loadOpenCV;
