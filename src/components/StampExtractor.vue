<template>
  <div class="stamp-extractor">
    <div class="header">
      <h1>印章提取工具</h1>
      <p>支持从图片中自动提取和识别印章</p>
    </div>

    <div v-if="!cvReady" class="loading-cv">正在加载 OpenCV.js，请稍候...</div>

    <div v-else>
      <div class="control-panel">
        <div class="control-item">
          <label for="colorInput">印章颜色：</label>
          <input type="color" id="colorInput" v-model="stampColor" />
        </div>
        <div class="control-item">
          <label for="imageInput">选择图片：</label>
          <input
            type="file"
            id="imageInput"
            accept="image/*"
            @change="handleImageSelect" />
        </div>
      </div>

      <div class="image-section">
        <div class="image-container">
          <h2>原始图片</h2>
          <div id="originalImageContainer">
            <img v-if="originalImage" :src="originalImage" alt="原图" />
          </div>
        </div>
        <div class="image-container">
          <h2>提取的印章</h2>
          <div id="imageContainer">
            <img
              v-for="(stamp, index) in extractedStamps"
              :key="index"
              :src="stamp"
              :alt="`提取的印章 ${index + 1}`" />
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading">正在处理图片，请稍候...</div>
    <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
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
};

const hideError = () => {
  errorMessage.value = "";
};

const handleImageSelect = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    loading.value = true;
    displayOriginalImage(file);
    const stamps = await stampExtractor.value.extractFromFile(file, {
      color: stampColor.value,
    });
    extractedStamps.value = stamps;
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
</script>

<style scoped>
.stamp-extractor {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.control-panel {
  display: flex;
  gap: 20px;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.control-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.control-item label {
  font-weight: bold;
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
  border-radius: 8px;
}

.image-container h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
}

#originalImageContainer img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

#imageContainer {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 15px;
}

#imageContainer img {
  width: 100%;
  height: auto;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

#imageContainer img:hover {
  transform: scale(1.1);
}

.loading {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 20px 40px;
  border-radius: 8px;
  z-index: 1000;
}

.error-message {
  color: #dc3545;
  padding: 10px;
  margin-top: 10px;
  background-color: #f8d7da;
  border-radius: 4px;
  text-align: center;
}

.loading-cv {
  text-align: center;
  padding: 40px;
  font-size: 18px;
  color: #666;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 30px;
}
</style>
