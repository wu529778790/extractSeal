// StampExtractor类 - 用于从图像中提取印章
// 不再直接导入 OpenCV.js
// import cv from "opencv.js";

class StampExtractor {
  constructor() {
    this.cvReady = false;
    this.initOpenCV();
  }

  /**
   * 初始化OpenCV
   * @returns {Promise} 返回一个Promise，在OpenCV准备就绪时resolve
   */
  initOpenCV() {
    return new Promise((resolve) => {
      if (typeof cv !== "undefined") {
        this.cvReady = true;
        resolve(true);
      } else {
        // 等待OpenCV加载完成
        const checkInterval = setInterval(() => {
          if (typeof cv !== "undefined") {
            clearInterval(checkInterval);
            this.cvReady = true;
            resolve(true);
          }
        }, 100);

        // 设置超时，避免无限等待
        setTimeout(() => {
          if (!this.cvReady) {
            clearInterval(checkInterval);
            console.error("OpenCV.js 加载超时");
            resolve(false);
          }
        }, 30000); // 30秒超时
      }
    });
  }

  /**
   * 检查OpenCV是否已准备就绪
   * @throws {Error} 如果OpenCV未加载则抛出错误
   */
  checkOpenCV() {
    if (!this.cvReady) {
      throw new Error("OpenCV.js未加载，请等待加载完成");
    }
  }

  /**
   * 从图像文件中提取印章
   * @param {File} file - 图像文件
   * @param {Object} options - 配置选项
   * @param {string} [options.color="#ff0000"] - 印章颜色（十六进制格式）
   * @returns {Promise<string[]>} 返回提取的印章图像列表（base64格式）
   */
  async extractFromFile(file, options = {}) {
    const { color = "#ff0000" } = options;
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          const result = this.extractFromImage(img, { color });
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = () => reject(new Error("图片加载失败"));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * 从Image对象中提取印章
   * @param {HTMLImageElement} img - Image对象
   * @param {Object} options - 配置选项
   * @param {string} [options.color="#ff0000"] - 印章颜色（十六进制格式）
   * @returns {string[]} 返回提取的印章图像列表（base64格式）
   */
  extractFromImage(img, options = {}) {
    this.checkOpenCV();
    const { color = "#ff0000" } = options;
    const cvMat = this.extractStampToMat(img, color);
    return this.extractCircles(cvMat);
  }

  /**
   * 将RGB颜色转换为HSV颜色
   * @private
   */
  rgbToHsv(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h,
      s,
      v = max;

    const d = max - min;
    s = max === 0 ? 0 : d / max;

    if (max === min) {
      h = 0;
    } else {
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return [Math.round(h * 180), Math.round(s * 255), Math.round(v * 255)];
  }

  extractStampToMat(img, color) {
    const src = cv.imread(img);
    const dst = new cv.Mat();
    const mask = new cv.Mat();

    try {
      // 转换为HSV颜色空间
      cv.cvtColor(src, dst, cv.COLOR_RGBA2RGB);
      cv.cvtColor(dst, dst, cv.COLOR_RGB2HSV);

      // 将输入的颜色转换为HSV
      const rgbaColor = this.hexToRgba(color);
      const [h, s, v] = this.rgbToHsv(rgbaColor[0], rgbaColor[1], rgbaColor[2]);

      // 定义HSV范围（色相±10，饱和度和亮度范围固定）
      const hueRange = 10;
      const lowH = (h - hueRange + 180) % 180;
      const highH = (h + hueRange) % 180;

      // 创建掩码
      const maskA = new cv.Mat();
      const low = new cv.Mat(dst.rows, dst.cols, dst.type(), [lowH, 50, 50, 0]);
      const high = new cv.Mat(dst.rows, dst.cols, dst.type(), [
        highH,
        255,
        255,
        255,
      ]);
      cv.inRange(dst, low, high, maskA);

      // 如果色相范围跨越了0/180边界，需要创建第二个掩码
      if (lowH > highH) {
        const maskB = new cv.Mat();
        const lowB = new cv.Mat(dst.rows, dst.cols, dst.type(), [0, 50, 50, 0]);
        const highB = new cv.Mat(dst.rows, dst.cols, dst.type(), [
          highH,
          255,
          255,
          255,
        ]);
        cv.inRange(dst, lowB, highB, maskB);

        const maskC = new cv.Mat();
        const lowC = new cv.Mat(dst.rows, dst.cols, dst.type(), [
          lowH,
          50,
          50,
          0,
        ]);
        const highC = new cv.Mat(
          dst.rows,
          dst.cols,
          dst.type(),
          [179, 255, 255, 255]
        );
        cv.inRange(dst, lowC, highC, maskC);

        cv.add(maskB, maskC, mask);
        cv.add(mask, maskA, mask);

        [maskB, maskC, lowB, highB, lowC, highC].forEach((m) => m.delete());
      } else {
        maskA.copyTo(mask);
      }

      // 创建结果图像
      const dstColor = this.hexToRgba(color);
      const result = new cv.Mat(src.rows, src.cols, cv.CV_8UC4, [0, 0, 0, 0]);
      const colorMat = new cv.Mat(src.rows, src.cols, cv.CV_8UC4, [
        ...dstColor.slice(0, 3),
        255,
      ]);
      colorMat.copyTo(result, mask);

      // 清理内存
      [src, dst, mask, maskA, low, high, colorMat].forEach((m) => m.delete());

      return result;
    } catch (error) {
      // 发生错误时清理内存
      [src, dst, mask].forEach((m) => m.delete());
      throw error;
    }
  }

  /**
   * 从Mat对象中提取圆形印章
   * @private
   */
  extractCircles(cvMat) {
    const dst = new cv.Mat();
    try {
      cv.cvtColor(cvMat, dst, cv.COLOR_RGBA2GRAY);
      cv.GaussianBlur(dst, dst, new cv.Size(5, 5), 2, 2);

      const circles = this.detectCircles(dst);
      const stamps = circles.map((circle) => this.cropCircle(cvMat, circle));

      cvMat.delete();
      dst.delete();
      return stamps;
    } catch (error) {
      cvMat.delete();
      dst.delete();
      throw error;
    }
  }

  /**
   * 检测图像中的圆形
   * @private
   */
  detectCircles(dst) {
    const circles = new cv.Mat();
    try {
      const minRadius = Math.min(dst.rows, dst.cols) * 0.03;
      const maxRadius = Math.min(dst.rows, dst.cols) * 0.5;

      cv.HoughCircles(
        dst,
        circles,
        cv.HOUGH_GRADIENT,
        1,
        dst.rows / 6,
        200,
        50,
        minRadius,
        maxRadius
      );

      const detectedCircles = [];
      for (let i = 0; i < circles.cols; i++) {
        detectedCircles.push({
          x: circles.data32F[i * 3],
          y: circles.data32F[i * 3 + 1],
          radius: circles.data32F[i * 3 + 2],
        });
      }

      circles.delete();
      return detectedCircles.sort((a, b) => b.radius - a.radius).slice(0, 6);
    } catch (error) {
      circles.delete();
      throw error;
    }
  }

  /**
   * 裁剪圆形区域
   * @private
   */
  cropCircle(cvMat, circle) {
    const scaleFactor = 1.2;
    const newRadius = circle.radius * scaleFactor;
    const size = Math.round(newRadius * 2);

    try {
      // 裁剪图像
      const rect = new cv.Rect(
        Math.max(
          0,
          Math.min(Math.round(circle.x - newRadius), cvMat.cols - size)
        ),
        Math.max(
          0,
          Math.min(Math.round(circle.y - newRadius), cvMat.rows - size)
        ),
        Math.min(size, cvMat.cols),
        Math.min(size, cvMat.rows)
      );

      const cropped = new cv.Mat();
      cvMat.roi(rect).copyTo(cropped);

      // 创建圆形掩码
      const mask = new cv.Mat.zeros(cropped.rows, cropped.cols, cv.CV_8UC1);
      const center = new cv.Point(cropped.cols / 2, cropped.rows / 2);
      const radius = Math.min(cropped.cols, cropped.rows) / 2;
      cv.circle(mask, center, radius, new cv.Scalar(255, 255, 255, 255), -1);

      // 应用掩码
      const result = new cv.Mat();
      const alpha = new cv.Mat.zeros(cropped.rows, cropped.cols, cv.CV_8UC1);
      const color = new cv.Scalar(0, 0, 0, 0);
      cv.bitwise_not(mask, alpha);
      cv.subtract(alpha, alpha, alpha);
      cropped.copyTo(result, mask);

      // 转换为base64
      const canvas = document.createElement("canvas");
      canvas.width = result.cols;
      canvas.height = result.rows;
      cv.imshow(canvas, result);
      const base64 = canvas.toDataURL("image/png");

      // 清理内存
      [cropped, mask, result, alpha].forEach((m) => m.delete());

      return base64;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 将十六进制颜色转换为RGBA数组
   * @private
   */
  hexToRgba(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b, 255];
  }
}

export default StampExtractor;
