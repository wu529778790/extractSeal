const cv = require("opencv-wasm");
const { createCanvas, Image } = require("canvas");

class StampService {
  constructor() {
    // 确保 OpenCV 已加载
    cv.onRuntimeInitialized = () => {
      console.log("OpenCV 已加载");
    };
  }

  // 将 Buffer 转换为 Mat
  _bufferToMat(buffer) {
    // 创建 canvas 并加载图像
    const img = new Image();
    img.src = buffer;
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    // 获取图像数据
    const imageData = ctx.getImageData(0, 0, img.width, img.height);

    // 创建 Mat
    const mat = cv.matFromImageData(imageData);
    return mat;
  }

  // 将 Mat 转换为 Base64
  _matToBase64(mat) {
    // 创建 canvas
    const canvas = createCanvas(mat.cols, mat.rows);
    const ctx = canvas.getContext("2d");

    // 将 Mat 转换为 ImageData
    const imageData = new ImageData(
      new Uint8ClampedArray(mat.data),
      mat.cols,
      mat.rows
    );
    ctx.putImageData(imageData, 0, 0);

    // 转换为 base64
    return canvas.toDataURL("image/png");
  }

  // 十六进制颜色转 BGR
  _hexToBGR(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return new cv.Scalar(b, g, r, 255);
  }

  // 提取印章
  async extractStamp(buffer) {
    const result = await this.extractStampWithColor(buffer, "#ff0000");
    return result;
  }

  // 提取印章并设置颜色
  async extractStampWithColor(buffer, color) {
    const src = this._bufferToMat(buffer);
    const dst = new cv.Mat();
    const mask = new cv.Mat();

    // 转换为 HSV 颜色空间
    cv.cvtColor(src, dst, cv.COLOR_BGR2HSV);

    // 定义红色的 HSV 范围
    const lowRedA = new cv.Mat(1, 1, cv.CV_8UC3, [0, 50, 50, 0]);
    const highRedA = new cv.Mat(1, 1, cv.CV_8UC3, [10, 255, 255, 0]);
    const lowRedB = new cv.Mat(1, 1, cv.CV_8UC3, [170, 50, 50, 0]);
    const highRedB = new cv.Mat(1, 1, cv.CV_8UC3, [180, 255, 255, 0]);

    // 创建掩码
    const maskA = new cv.Mat();
    const maskB = new cv.Mat();
    cv.inRange(dst, lowRedA, highRedA, maskA);
    cv.inRange(dst, lowRedB, highRedB, maskB);
    cv.bitwise_or(maskA, maskB, mask);

    // 创建结果图像
    const result = new cv.Mat(
      src.rows,
      src.cols,
      cv.CV_8UC4,
      this._hexToBGR(color)
    );
    cv.copyTo(result, result, mask);

    // 检测圆形
    const circles = await this.detectCircles(buffer);
    const stampImages = [];

    // 裁剪每个检测到的圆形区域
    for (const circle of circles) {
      const { x, y, radius } = circle;
      const scaleFactor = 1.2;
      const newRadius = radius * scaleFactor;
      const size = Math.round(newRadius * 2);

      // 确保裁剪区域在图像范围内
      const rect = new cv.Rect(
        Math.max(0, Math.min(Math.round(x - newRadius), result.cols - size)),
        Math.max(0, Math.min(Math.round(y - newRadius), result.rows - size)),
        Math.min(size, result.cols),
        Math.min(size, result.rows)
      );

      const croppedMat = result.roi(rect);
      const circleMask = new cv.Mat(
        rect.height,
        rect.width,
        cv.CV_8UC1,
        new cv.Scalar(0)
      );
      const center = new cv.Point(rect.width / 2, rect.height / 2);
      cv.circle(
        circleMask,
        center,
        Math.round(newRadius),
        new cv.Scalar(255),
        -1
      );

      const maskedStamp = new cv.Mat();
      cv.copyTo(croppedMat, maskedStamp, circleMask);
      stampImages.push(this._matToBase64(maskedStamp));

      croppedMat.delete();
      circleMask.delete();
      maskedStamp.delete();
    }

    // 释放内存
    src.delete();
    dst.delete();
    mask.delete();
    maskA.delete();
    maskB.delete();
    lowRedA.delete();
    highRedA.delete();
    lowRedB.delete();
    highRedB.delete();
    result.delete();

    return stampImages;
  }

  // 检测圆形
  async detectCircles(buffer) {
    const src = this._bufferToMat(buffer);
    const gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_BGR2GRAY);
    cv.GaussianBlur(gray, gray, new cv.Size(5, 5), 2);

    const minRadius = Math.min(src.rows, src.cols) * 0.03;
    const maxRadius = Math.min(src.rows, src.cols) * 0.5;

    const circles = new cv.Mat();
    cv.HoughCircles(
      gray,
      circles,
      cv.HOUGH_GRADIENT,
      1,
      gray.rows / 6,
      200,
      50,
      minRadius,
      maxRadius
    );

    const result = [];
    for (let i = 0; i < circles.cols; i++) {
      result.push({
        x: circles.data32F[i * 3],
        y: circles.data32F[i * 3 + 1],
        radius: circles.data32F[i * 3 + 2],
      });
    }

    // 排序并限制数量
    const sortedCircles = result
      .sort((a, b) => b.radius - a.radius)
      .slice(0, 6);

    // 释放内存
    src.delete();
    gray.delete();
    circles.delete();

    return sortedCircles;
  }
}

module.exports = new StampService();
