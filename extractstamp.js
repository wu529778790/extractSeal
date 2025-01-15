// 移除 import 语句，因为我们使用全局的 cv 对象

let cvReady = false;
const primaryColor = "#ff0000";

function initOpenCV(callback) {
  if (typeof cv !== "undefined") {
    cvReady = true;
    console.log("OpenCV.js 已加载");
    callback && callback(true);
  } else {
    console.log("等待 OpenCV.js 加载...");
    document.addEventListener("opencv-ready", () => {
      cvReady = true;
      console.log("OpenCV.js 已加载");
      callback && callback(true);
    });
  }
}

/**
 * 提取指定颜色的印章
 * @param img 要处理的图像
 * @param extractColor 要提取的颜色，十六进制格式，如 "#FF0000"
 * @param setColor 设置提取区域的新颜色，十六进制格式，如 "#0000FF"
 * @returns 处理后的图像
 *
 * @example
 * // 提取红色印章并将其设置为蓝色
 * const img = document.getElementById('myImage');
 * const extractedImg = extractStampWithColor(img, "#FF0000", "#0000FF");
 *
 * // 提取绿色印章并将其设置为黄色
 * const greenStamp = document.querySelector('.stamp-image');
 * const yellowStamp = extractStampWithColor(greenStamp, "#00FF00", "#FFFF00");
 */
function extractStampWithColorImpl(
  img,
  setColor = "#ff0000"
) {
  if (cvReady) {
    // 获取图片的宽高
    const imgWidth = img.width;
    const imgHeight = img.height;
    console.log("图片宽度:", imgWidth, "图片高度:", imgHeight);
    let src = cv.imread(img);
    let dst = new cv.Mat();
    let mask = new cv.Mat();

    // 转换为HSV颜色空间
    cv.cvtColor(src, dst, cv.COLOR_RGBA2RGB);
    cv.cvtColor(dst, dst, cv.COLOR_RGB2HSV);

    // 定义红色的HSV范围
    // 低值范围 (0-10)
    let lowRedA = new cv.Mat(dst.rows, dst.cols, dst.type(), [0, 50, 50, 0]);
    let highRedA = new cv.Mat(dst.rows, dst.cols, dst.type(), [10, 255, 255, 255]);
    
    // 高值范围 (170-180)
    let lowRedB = new cv.Mat(dst.rows, dst.cols, dst.type(), [170, 50, 50, 0]);
    let highRedB = new cv.Mat(dst.rows, dst.cols, dst.type(), [180, 255, 255, 255]);

    // 创建掩码
    let maskA = new cv.Mat();
    let maskB = new cv.Mat();
    cv.inRange(dst, lowRedA, highRedA, maskA);
    cv.inRange(dst, lowRedB, highRedB, maskB);

    // 合并掩码
    cv.add(maskA, maskB, mask);

    // 将十六进制颜色值转换为RGBA
    const dstColor = hexToRgba(setColor);
    console.log("dstColor:", dstColor);

    // 创建带有 alpha 通道的目标图像
    let result = new cv.Mat(src.rows, src.cols, cv.CV_8UC4, [0, 0, 0, 0]);

    // 创建指定颜色的图像（带有 alpha 通道）
    let colorMat = new cv.Mat(src.rows, src.cols, cv.CV_8UC4, [
      ...dstColor.slice(0, 3),
      255,
    ]);

    // 使用掩码将提取的区域设置为指定颜色，非提取区域保持透明
    colorMat.copyTo(result, mask);

    // 创建隐藏的canvas用来保存提取后的图片
    const hiddenCanvas = document.createElement("canvas");
    hiddenCanvas.width = result.cols;
    hiddenCanvas.height = result.rows;
    cv.imshow(hiddenCanvas, result);
    let dataURL = hiddenCanvas.toDataURL("image/png");

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
    colorMat.delete();
    result.delete();
    return dataURL;
  } else {
    console.error("OpenCV.js 未加载");
    return img;
  }
}

/**
 * 提取直接成图片
 * @param {*} img 图片
 * @param {*} setColor 设置的颜色，比如提取红色设置红色那么能够进行对印章的填充
 * @returns
 */
function extractStampWithColorToOpencvMat(
    img,
    setColor = "#ff0000"
) {
  if (cvReady) {
    // 获取图片的宽高
    const imgWidth = img.width;
    const imgHeight = img.height;
    console.log("图片宽度:", imgWidth, "图片高度:", imgHeight);
    let src = cv.imread(img);
    let dst = new cv.Mat();
    let mask = new cv.Mat();

    // 转换为HSV颜色空间
    cv.cvtColor(src, dst, cv.COLOR_RGBA2RGB);
    cv.cvtColor(dst, dst, cv.COLOR_RGB2HSV);

    // 定义红色的HSV范围
    // 低值范围 (0-10)
    let lowRedA = new cv.Mat(dst.rows, dst.cols, dst.type(), [0, 50, 50, 0]);
    let highRedA = new cv.Mat(dst.rows, dst.cols, dst.type(), [10, 255, 255, 255]);

    // 高值范围 (170-180)
    let lowRedB = new cv.Mat(dst.rows, dst.cols, dst.type(), [170, 50, 50, 0]);
    let highRedB = new cv.Mat(dst.rows, dst.cols, dst.type(), [180, 255, 255, 255]);

    // 创建掩码
    let maskA = new cv.Mat();
    let maskB = new cv.Mat();
    cv.inRange(dst, lowRedA, highRedA, maskA);
    cv.inRange(dst, lowRedB, highRedB, maskB);

    // 合并掩码
    cv.add(maskA, maskB, mask);

    // 将十六进制颜色值转换为RGBA
    const dstColor = hexToRgba(setColor);
    console.log("dstColor:", dstColor);

    // 创建带有 alpha 通道的目标图像
    let result = new cv.Mat(src.rows, src.cols, cv.CV_8UC4, [0, 0, 0, 0]);

    // 创建指定颜色的图像（带有 alpha 通道）
    let colorMat = new cv.Mat(src.rows, src.cols, cv.CV_8UC4, [
      ...dstColor.slice(0, 3),
      255,
    ]);

    // 使用掩码将提取的区域设置为指定颜色，非提取区域保持透明
    colorMat.copyTo(result, mask);

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
    colorMat.delete();
    return result;
  } else {
    console.error("OpenCV.js 未加载");
    return img;
  }
}

// 提取直接成图片
function extractStampWithColorToImage(
    img,
    setColor = "#ff0000"
) {
  if (cvReady) {
    const result  = extractStampWithColorToOpencvMat(img, setColor)
    // 创建隐藏的canvas用来保存提取后的图片
    const hiddenCanvas = document.createElement("canvas");
    hiddenCanvas.width = result.cols;
    hiddenCanvas.height = result.rows;
    cv.imshow(hiddenCanvas, result);
    let dataURL = hiddenCanvas.toDataURL("image/png");

    result.delete();
    return dataURL;
  } else {
    console.error("OpenCV.js 未加载");
    return img;
  }
}

/**
 * 提取红色的印章
 * @param file 图片文件
 * @param setColor 设置的颜色，比如提取红色设置红色那么能够进行对印章的填充
 * @returns
 */
function extractStampWithFile(file, setColor) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const result = extractStampWithImage(img, setColor);
      resolve(result);
    };
    img.onerror = (error) => {
      console.error("图片加载失败", error);
      reject(new Error("图片加载失败"));
    };
    img.src = URL.createObjectURL(file);
  });
}

/**
 * 检测图像中的圆形
 * @param dst 检测圆形的图像
 * @returns 检测到的圆形列表
 */
function detectCircles(dst) {
  // 创建一个新的Mat对象来存储检测到的圆形
  let circles = new cv.Mat();
  // 计算最小和最大半径，用于限制检测到的圆形大小
  let minRadius = Math.min(dst.rows, dst.cols) * 0.03; // 最小半径为图像最小边的5%
  let maxRadius = Math.min(dst.rows, dst.cols) * 0.5; // 最大半径为图像最小边的50%
  // 使用Hough变换检测圆形
  cv.HoughCircles(
    dst,
    circles,
    cv.HOUGH_GRADIENT,
    1, // 两个圆心之间的最小距离
    dst.rows / 6, // 检测圆心之间的最小距离
    200, // 修改检测圆形的阈值为200
    50, // 检测值
    minRadius, // 检测圆形的最小半径
    maxRadius // 检测圆形的最大半径
  );

  // 初始化一个空数组来存储检测到的圆形信息
  let detectedCircles = [];
  // 遍历检测到的圆形
  for (let i = 0; i < circles.cols; i++) {
    // 将检测到的圆形信息转换为对象形式
    detectedCircles.push({
      x: circles.data32F[i * 3], // 圆心x坐标
      y: circles.data32F[i * 3 + 1], // 圆心y坐标
      radius: circles.data32F[i * 3 + 2] // 半径
    });
  }
  console.log("detectedCircles:", detectedCircles, maxRadius, minRadius, dst.rows, dst.cols);
  // 根据半径大小对检测到的圆形进行排序，确保最大的圆形排在前面
  detectedCircles.sort((a, b) => b.radius - a.radius);

  // 释放内存
  circles.delete();
  // 返回最大的3个圆形
  return detectedCircles.slice(0, 6);
}


/**
 * 提取印章圆形
 * @param {*} img
 * @returns
 */
function extractCircles(img) {
  let src = cv.imread(img);
  let dst = new cv.Mat();

  // 转换为灰度图
  cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);

  // 应用高斯模糊以减少噪声
  cv.GaussianBlur(dst, dst, new cv.Size(5, 5), 2, 2);

  // 创建画布
  let canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  let ctx = canvas.getContext("2d");
  // 绘制原始图像
  ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
  let croppedStamps = [];
  let circles = [];
  // 检测圆形
  circles = detectCircles(dst);
  console.log("circles:", circles);
  circles.forEach((circle) => {
    console.log("draw circle:", circle);
    croppedStamps.push(cropAndDownloadCircle(img, circle));
  });
  // 释放内存
  src.delete();
  dst.delete();

  return croppedStamps;
}

/**
 * 提取印章圆形
 * @param {*} cvMat
 * @returns
 */
function extractCirclesWithCvMat(cvMat) {
  let dst = new cv.Mat();
  // 转换为灰度图
  cv.cvtColor(cvMat, dst, cv.COLOR_RGBA2GRAY);
  // 应用高斯模糊以减少噪声
  cv.GaussianBlur(dst, dst, new cv.Size(5, 5), 2, 2);
  
  let croppedStamps = [];
  // 检测圆形
  let circles = detectCircles(dst);
  console.log("circles:", circles);
  circles.forEach((circle) => {
    console.log("draw circle:", circle);
    croppedStamps.push(cropAndDownloadCircle(cvMat, circle));
  });
  // 释放内存
  dst.delete();
  
  return croppedStamps;
}

function cropAndDownloadCircle(cvMat, circle) {
  // 定义缩放因子，使裁剪范围比圆形大一些
  const scaleFactor = 1.2;
  // 计算新的半径和尺寸
  let newRadius = circle.radius * scaleFactor;
  let size = Math.round(newRadius * 2);

  // 创建一个新的Mat来存储裁剪后的图像
  let croppedMat = new cv.Mat();
  let rect = new cv.Rect(
    Math.round(circle.x - newRadius),
    Math.round(circle.y - newRadius),
    size,
    size
  );

  // 确保裁剪区域在图像范围内
  rect.x = Math.max(0, Math.min(rect.x, cvMat.cols - rect.width));
  rect.y = Math.max(0, Math.min(rect.y, cvMat.rows - rect.height));
  rect.width = Math.min(rect.width, cvMat.cols - rect.x);
  rect.height = Math.min(rect.height, cvMat.rows - rect.y);

  // 裁剪图像
  croppedMat = cvMat.roi(rect);

  // 创建圆形掩码
  let mask = new cv.Mat.zeros(size, size, cv.CV_8UC1);
  let center = new cv.Point(size / 2, size / 2);
  cv.circle(mask, center, Math.round(newRadius), new cv.Scalar(255, 255, 255), -1);

  // 应用掩码
  let result = new cv.Mat();
  cv.bitwise_and(croppedMat, croppedMat, result, mask);

  // 将结果转换为PNG数据URL
  let imgData = new ImageData(new Uint8ClampedArray(result.data), result.cols, result.rows);
  let canvas = document.createElement('canvas');
  canvas.width = result.cols;
  canvas.height = result.rows;
  let ctx = canvas.getContext('2d');
  ctx.putImageData(imgData, 0, 0);
  let dataURL = canvas.toDataURL("image/png");

  // 释放内存
  croppedMat.delete();
  mask.delete();
  result.delete();

  return dataURL;
}

/**
 * 将十六进制颜色值转换为RGBA
 * @param hex
 * @returns
 */
function hexToRgba(hex) {
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  let a = 255;
  if (hex.length === 9) {
    a = parseInt(hex.slice(7, 9), 16);
  }
  return [r, g, b, a];
}

function extractStampWithImage(img, setColor) {
  let distImgList = [];
  let cvMat = extractStampWithColorToOpencvMat(img, setColor);
  // 提取圆圈并获取结果
  distImgList = extractCirclesWithCvMat(cvMat);
  return distImgList;
}

// 在文件末尾，将函数添加到全局作用域
window.initOpenCV = initOpenCV;
window.extractStampWithFile = extractStampWithFile;
window.extractStampWithImage = extractStampWithImage;

