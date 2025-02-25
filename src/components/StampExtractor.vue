<template>
  <div class="stamp-extractor">
    <div class="header">
      <h1>印章提取工具</h1>
      <p>支持从图片中自动提取和识别印章</p>
    </div>

    <div v-if="!cvReady" class="loading-cv">
      <div class="spinner"></div>
      <p>正在加载 OpenCV.js，请稍候...</p>
    </div>

    <div v-else class="main-content">
      <div class="control-panel">
        <div class="control-item">
          <label for="colorInput">印章颜色：</label>
          <div class="color-picker-container">
            <input
              type="color"
              id="colorInput"
              v-model="stampColor"
              class="color-picker"
              title="选择印章颜色" />
            <span class="color-value">{{ stampColor }}</span>
          </div>
        </div>
        <div class="control-item">
          <label for="imageInput">选择图片：</label>
          <div class="file-input-wrapper">
            <button class="file-input-button">
              <i class="icon-upload"></i> 选择文件
            </button>
            <input
              type="file"
              id="imageInput"
              accept="image/*"
              @change="handleImageSelect"
              class="file-input" />
            <span v-if="selectedFileName" class="file-name">{{
              selectedFileName
            }}</span>
          </div>
        </div>
        <div class="control-item">
          <button
            class="process-button"
            @click="processCurrentImage"
            :disabled="!originalImage || loading">
            <i class="icon-process"></i> 处理图片
          </button>
        </div>
      </div>

      <div class="image-section">
        <div class="image-container original-container">
          <h2>原始图片</h2>
          <div id="originalImageContainer" class="image-display">
            <img v-if="originalImage" :src="originalImage" alt="原图" />
            <div v-else class="no-image">
              <i class="icon-image"></i>
              <p>请选择图片</p>
            </div>
          </div>
        </div>
        <div class="image-container result-container">
          <h2>
            提取的印章
            <span v-if="extractedStamps.length"
              >({{ extractedStamps.length }})</span
            >
          </h2>
          <div id="imageContainer" class="image-display">
            <div v-if="extractedStamps.length" class="stamps-grid">
              <div
                v-for="(stamp, index) in extractedStamps"
                :key="index"
                class="stamp-item"
                @click="previewStamp(stamp)">
                <img :src="stamp" :alt="`提取的印章 ${index + 1}`" />
                <div class="stamp-actions">
                  <button
                    class="action-button"
                    @click.stop="downloadStamp(stamp, index)">
                    <i class="icon-download"></i>
                  </button>
                </div>
              </div>
            </div>
            <div v-else-if="loading" class="processing-placeholder">
              <div class="spinner"></div>
              <p>正在处理...</p>
            </div>
            <div v-else class="no-image">
              <i class="icon-stamp"></i>
              <p>暂无提取结果</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-overlay">
      <div class="loading-content">
        <div class="spinner"></div>
        <p>正在处理图片，请稍候...</p>
      </div>
    </div>

    <div v-if="errorMessage" class="error-message">
      <i class="icon-error"></i> {{ errorMessage }}
      <button class="close-error" @click="hideError">×</button>
    </div>

    <div
      v-if="previewImage"
      class="stamp-preview-overlay"
      @click="closePreview">
      <div class="stamp-preview-container" @click.stop>
        <img :src="previewImage" alt="印章预览" />
        <div class="preview-actions">
          <button
            class="preview-button"
            @click="downloadStamp(previewImage, 'preview')">
            <i class="icon-download"></i> 下载
          </button>
          <button class="preview-button close-button" @click="closePreview">
            <i class="icon-close"></i> 关闭
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import StampExtractorUtil from "../utils/StampExtractor";

// 响应式状态
const stampColor = ref("#ff0000");
const originalImage = ref(null);
const extractedStamps = ref([]);
const loading = ref(false);
const errorMessage = ref("");
const cvReady = ref(false);
const stampExtractor = ref(null);
const selectedFileName = ref("");
const previewImage = ref(null);
const currentFile = ref(null);

// 生命周期钩子
onMounted(() => {
  stampExtractor.value = new StampExtractorUtil();
  stampExtractor.value
    .initOpenCV()
    .then((success) => {
      if (success) {
        console.log("OpenCV.js 已加载完成");
        cvReady.value = true;
      } else {
        showError("OpenCV.js 加载失败，请刷新页面重试");
      }
    })
    .catch((error) => {
      showError("OpenCV.js 加载失败");
    });
});

// 方法
const showError = (message) => {
  errorMessage.value = message;
  // 5秒后自动关闭错误提示
  setTimeout(() => {
    if (errorMessage.value === message) {
      hideError();
    }
  }, 5000);
};

const hideError = () => {
  errorMessage.value = "";
};

const handleImageSelect = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  currentFile.value = file;
  selectedFileName.value = file.name;
  displayOriginalImage(file);

  // 自动处理图片
  processCurrentImage();
};

const processCurrentImage = async () => {
  if (!currentFile.value) return;

  try {
    loading.value = true;
    extractedStamps.value = [];

    const stamps = await stampExtractor.value.extractFromFile(
      currentFile.value,
      {
        color: stampColor.value,
      }
    );

    extractedStamps.value = stamps;

    if (stamps.length === 0) {
      showError("未能从图片中提取到印章，请尝试调整印章颜色或选择其他图片");
    }

    hideError();
  } catch (error) {
    console.error("处理图片时出错:", error);
    showError(error.message || "处理图片时出错");
  } finally {
    loading.value = false;
  }
};

const displayOriginalImage = (file) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    originalImage.value = e.target.result;
  };
  reader.readAsDataURL(file);
};

const previewStamp = (stamp) => {
  previewImage.value = stamp;
};

const closePreview = () => {
  previewImage.value = null;
};

const downloadStamp = (stampUrl, index) => {
  const link = document.createElement("a");
  link.href = stampUrl;
  link.download = `印章_${index + 1}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
</script>

<style scoped>
.stamp-extractor {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
  color: #333;
}

.header {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eaeaea;
}

.header h1 {
  color: #2c3e50;
  margin-bottom: 10px;
  font-size: 2.2rem;
}

.header p {
  color: #666;
  font-size: 1.1rem;
}

.main-content {
  animation: fadeIn 0.5s ease;
}

.control-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.control-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.control-item label {
  font-weight: bold;
  min-width: 80px;
}

.color-picker-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.color-picker {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  padding: 0;
  background: none;
}

.color-value {
  font-family: monospace;
  font-size: 0.9rem;
  color: #666;
}

.file-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
}

.file-input-button {
  background-color: #4a6cf7;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: background-color 0.3s;
}

.file-input-button:hover {
  background-color: #3a5ce5;
}

.file-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.file-name {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.9rem;
  color: #666;
}

.process-button {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.3s;
}

.process-button:hover:not(:disabled) {
  background-color: #218838;
}

.process-button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
  opacity: 0.7;
}

.image-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin-bottom: 30px;
}

.image-container {
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease;
}

.image-container:hover {
  transform: translateY(-5px);
}

.image-container h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #2c3e50;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  gap: 10px;
}

.image-display {
  min-height: 300px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  border: 1px dashed #ddd;
}

#originalImageContainer img {
  max-width: 100%;
  max-height: 400px;
  height: auto;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stamps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 15px;
  padding: 15px;
  width: 100%;
  height: 100%;
  overflow-y: auto;
}

.stamp-item {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  background-color: white;
  padding: 10px;
}

.stamp-item:hover {
  transform: scale(1.05);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
}

.stamp-item img {
  width: 100%;
  height: auto;
  display: block;
}

.stamp-actions {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  padding: 5px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.stamp-item:hover .stamp-actions {
  opacity: 1;
}

.action-button {
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.action-button:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.no-image {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #aaa;
  padding: 40px;
  text-align: center;
}

.no-image i {
  font-size: 3rem;
  margin-bottom: 10px;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.loading-content {
  background-color: white;
  padding: 30px 50px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
}

.loading-cv {
  text-align: center;
  padding: 60px;
  font-size: 18px;
  color: #666;
  background-color: #f8f9fa;
  border-radius: 12px;
  margin-bottom: 30px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #4a6cf7;
  animation: spin 1s linear infinite;
}

.error-message {
  color: #dc3545;
  padding: 15px;
  margin-top: 20px;
  background-color: #f8d7da;
  border-radius: 8px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  position: relative;
  animation: slideIn 0.3s ease;
}

.close-error {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #dc3545;
  cursor: pointer;
  padding: 0 5px;
}

.stamp-preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease;
}

.stamp-preview-container {
  background-color: white;
  padding: 20px;
  border-radius: 12px;
  max-width: 80%;
  max-height: 80%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
}

.stamp-preview-container img {
  max-width: 100%;
  max-height: 60vh;
  object-fit: contain;
}

.preview-actions {
  display: flex;
  gap: 15px;
}

.preview-button {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.3s;
}

.preview-button:first-child {
  background-color: #4a6cf7;
  color: white;
}

.preview-button:first-child:hover {
  background-color: #3a5ce5;
}

.close-button {
  background-color: #f8f9fa;
  color: #333;
}

.close-button:hover {
  background-color: #e9ecef;
}

.processing-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 15px;
  padding: 40px;
}

/* 图标样式 */
.icon-upload:before {
  content: "↑";
}

.icon-download:before {
  content: "↓";
}

.icon-process:before {
  content: "⚙";
}

.icon-image:before {
  content: "🖼";
}

.icon-stamp:before {
  content: "🔖";
}

.icon-error:before {
  content: "⚠";
}

.icon-close:before {
  content: "✕";
}

/* 动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .image-section {
    grid-template-columns: 1fr;
  }

  .control-panel {
    flex-direction: column;
    align-items: flex-start;
  }

  .control-item {
    width: 100%;
  }
}
</style>
