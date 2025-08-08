import { opencvScriptUrl } from "./opencv-asset.js";
const DEFAULT_SOURCE = opencvScriptUrl; // 内置同源 URL

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
      typeof window.cv === "object" &&
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

      // 如果 cv 是一个 Promise（@techstark/opencv-js 行为），等待其 resolve 后替换全局
      if (window.cv && typeof window.cv.then === "function") {
        const p = window.cv;
        p.then((mod) => {
          try {
            if (mod && typeof mod === "object") {
              window.cv = mod;
            }
          } finally {
            clearTimeout(timeout);
            resolve(true);
          }
        }).catch((err) => {
          clearTimeout(timeout);
          reject(err);
        });
        return;
      }

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
        if (
          window.cv &&
          typeof window.cv === "object" &&
          typeof window.cv.Mat === "function"
        ) {
          clearInterval(poll);
          clearTimeout(timeout);
          resolve(true);
        }
      }, 50);
    }
  });
}

export function loadOpenCV(options = {}) {
  const { url = DEFAULT_SOURCE, timeoutMs = 60000 } = options;

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
      // 预占 Module 以确保 onRuntimeInitialized 可被挂接
      if (typeof window !== "undefined") {
        if (!window.cv || typeof window.cv !== "object") {
          window.cv = {};
        }
        const prevCb = window.cv.onRuntimeInitialized;
        window.__cvRuntimeReady = false;
        window.cv.onRuntimeInitialized = () => {
          window.__cvRuntimeReady = true;
          if (typeof prevCb === "function") prevCb();
        };
      }

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

      // 始终通过同源 URL 注入，不再请求外网
      await injectScript(url);
      finalize();
    });
  }

  return loadingPromise;
}

export default loadOpenCV;
