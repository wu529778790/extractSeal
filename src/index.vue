<template>
  <div
    style="
      max-width: 1120px;
      margin: 24px auto;
      padding: 0 12px;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial,
        sans-serif;
    ">
    <h2 style="margin: 0 0 8px">印章提取 Demo</h2>

    <div
      v-if="!cvReady"
      style="
        padding: 28px;
        background: #f6f7f9;
        border-radius: 12px;
        text-align: center;
        color: #555;
      ">
      正在加载 OpenCV.js，请稍候…
    </div>

    <div v-else style="display: grid; gap: 16px">
      <div
        style="
          display: grid;
          grid-template-columns: 1fr auto auto;
          gap: 12px;
          align-items: center;
        ">
        <label
          style="
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 14px;
            background: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            cursor: pointer;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
          ">
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            @change="handleFile"
            style="display: none" />
          <span style="color: #111; font-weight: 600">选择图片</span>
          <span style="color: #6b7280; font-size: 13px">支持 png/jpg</span>
        </label>

        <div
          style="
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            background: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
          ">
          <span style="font-size: 13px; color: #374151">目标颜色</span>
          <input
            type="color"
            v-model="color"
            style="
              width: 28px;
              height: 28px;
              border: none;
              background: transparent;
              padding: 0;
            " />
          <span style="font-size: 12px; color: #6b7280">{{ color }}</span>
        </div>

        <button
          @click="clearAll"
          style="
            padding: 10px 14px;
            background: #f3f4f6;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            color: #374151;
            cursor: pointer;
          ">
          清空
        </button>
      </div>

      <div v-if="error" style="color: #c00">{{ error }}</div>
      <div v-if="loading" style="color: #6b7280">正在处理…</div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px">
        <!-- Left: Original Image -->
        <div
          style="
            background: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
            min-height: 260px;
          ">
          <div
            style="
              padding: 10px 12px;
              border-bottom: 1px solid #f1f5f9;
              font-size: 13px;
              color: #374151;
              font-weight: 600;
            ">
            原图
          </div>
          <div
            style="
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 12px;
              background: #fafafa;
            ">
            <img
              v-if="imgUrl"
              :src="imgUrl"
              alt="original"
              style="
                max-width: 100%;
                max-height: 520px;
                object-fit: contain;
                border-radius: 8px;
              " />
            <div v-else style="color: #9ca3af; font-size: 14px">
              请点击上方“选择图片”
            </div>
          </div>
        </div>

        <!-- Right: Results -->
        <div
          style="
            background: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
            min-height: 260px;
          ">
          <div
            style="
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 10px 12px;
              border-bottom: 1px solid #f1f5f9;
            ">
            <div style="font-size: 13px; color: #374151; font-weight: 600">
              提取结果
            </div>
            <div style="font-size: 12px; color: #6b7280">
              {{ stamps.length ? `共 ${stamps.length} 个` : "—" }}
            </div>
          </div>
          <div style="padding: 12px; background: #fafafa">
            <div
              v-if="stamps.length"
              style="
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                gap: 12px;
              ">
              <a
                v-for="(s, i) in stamps"
                :key="i"
                :href="s"
                target="_blank"
                :download="`stamp-${i + 1}.png`"
                style="display: block"
                title="点击查看/下载">
                <img
                  :src="s"
                  :alt="`stamp-${i + 1}`"
                  style="
                    width: 100%;
                    border: 1px solid #eee;
                    border-radius: 10px;
                    background: #fff;
                  " />
              </a>
            </div>
            <div v-else style="color: #9ca3af; font-size: 14px">
              尚无提取结果
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from "vue";
import { initOpenCV, extractFromFile } from "../lib/index.js";

const cvReady = ref(false);
const error = ref("");
const stamps = ref([]);
const loading = ref(false);
const color = ref("#ff0000");
const imgUrl = ref("");
const fileInput = ref(null);
let lastFile = null;
let lastUrl = "";

onMounted(async () => {
  try {
    const ok = await initOpenCV({ timeoutMs: 60000 });
    if (window.cv && typeof window.cv.then === "function") {
      await window.cv;
    }
    cvReady.value = !!ok || (window.cv && typeof window.cv.Mat === "function");
  } catch (e) {
    error.value = e?.message || "OpenCV 加载失败";
  }
});

onUnmounted(() => {
  if (lastUrl) URL.revokeObjectURL(lastUrl);
});

function handleFile(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  lastFile = file;
  error.value = "";
  stamps.value = [];
  if (lastUrl) URL.revokeObjectURL(lastUrl);
  lastUrl = URL.createObjectURL(file);
  imgUrl.value = lastUrl;
  runExtract();
}

function runExtract() {
  if (!lastFile) return;
  loading.value = true;
  extractFromFile(lastFile, { color: color.value })
    .then((list) => (stamps.value = list))
    .catch((err) => (error.value = err?.message || "处理失败"))
    .finally(() => (loading.value = false));
}

function clearAll() {
  stamps.value = [];
  error.value = "";
  loading.value = false;
  lastFile = null;
  imgUrl.value = "";
  if (fileInput.value) fileInput.value.value = "";
  if (lastUrl) {
    URL.revokeObjectURL(lastUrl);
    lastUrl = "";
  }
}

watch(color, () => {
  // 颜色变化时，如果已有图片，自动重新提取
  if (lastFile) runExtract();
});
</script>
