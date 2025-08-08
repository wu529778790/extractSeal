<template>
  <div
    style="
      max-width: 860px;
      margin: 24px auto;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial,
        sans-serif;
    ">
    <h2 style="margin: 0 0 12px">印章提取 Demo（极简版）</h2>
    <p style="margin: 0 0 16px; color: #666">
      只保留必要的加载与提取流程，便于验证 npm 包功能
    </p>

    <div
      v-if="!cvReady"
      style="
        padding: 24px;
        background: #f6f7f9;
        border-radius: 10px;
        text-align: center;
        color: #555;
      ">
      正在加载 OpenCV.js，请稍候…
    </div>

    <div v-else style="display: grid; gap: 16px">
      <input type="file" accept="image/*" @change="handleFile" />

      <div v-if="error" style="color: #c00">{{ error }}</div>

      <div
        v-if="stamps.length"
        style="
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 12px;
        ">
        <img
          v-for="(s, i) in stamps"
          :key="i"
          :src="s"
          :alt="`stamp-${i + 1}`"
          style="
            width: 100%;
            border: 1px solid #eee;
            border-radius: 8px;
            background: #fff;
          " />
      </div>

      <div v-else style="color: #888">尚无提取结果</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { initOpenCV, extractFromFile } from "../lib/index.js";

const cvReady = ref(false);
const error = ref("");
const stamps = ref([]);

onMounted(async () => {
  try {
    const ok = await initOpenCV({ timeoutMs: 60000 });
    // 兼容 cv 作为 Promise 的情况
    if (window.cv && typeof window.cv.then === "function") {
      await window.cv; // resolve 后 window.cv 会变成模块对象
    }
    cvReady.value = !!ok || (window.cv && typeof window.cv.Mat === "function");
  } catch (e) {
    error.value = e?.message || "OpenCV 加载失败";
  }
});

function handleFile(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  error.value = "";
  stamps.value = [];
  extractFromFile(file, { color: "#ff0000" })
    .then((list) => (stamps.value = list))
    .catch((err) => (error.value = err?.message || "处理失败"));
}
</script>
