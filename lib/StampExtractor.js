function assertCVReady() {
  if (
    typeof window === "undefined" ||
    !window.cv ||
    typeof window.cv.Mat !== "function"
  ) {
    throw new Error("OpenCV.js未加载，请先调用 initOpenCV()");
  }
}

export function extractFromImage(img, options = {}) {
  assertCVReady();
  const { color = "#ff0000" } = options;
  const cvMat = extractStampToMat(img, color);
  return extractCircles(cvMat);
}

export function rgbToHsv(r, g, b) {
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

export function extractStampToMat(img, color) {
  const src = cv.imread(img); // RGBA
  const hsv = new cv.Mat();
  const mask = new cv.Mat();

  try {
    // 转换为HSV颜色空间
    const rgb = new cv.Mat();
    cv.cvtColor(src, rgb, cv.COLOR_RGBA2RGB);
    cv.cvtColor(rgb, hsv, cv.COLOR_RGB2HSV);

    // 将输入的颜色转换为HSV
    const rgbaColor = hexToRgba(color);
    const [h, s, v] = rgbToHsv(rgbaColor[0], rgbaColor[1], rgbaColor[2]);

    // 定义HSV范围（色相±10，饱和度和亮度范围固定）
    const hueRange = 10;
    const lowH = (h - hueRange + 180) % 180;
    const highH = (h + hueRange) % 180;

    // 创建掩码
    const maskA = new cv.Mat();
    const low = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [lowH, 50, 50, 0]);
    const high = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [
      highH,
      255,
      255,
      255,
    ]);
    cv.inRange(hsv, low, high, maskA);

    // 如果色相范围跨越了0/180边界，需要创建第二个掩码
    if (lowH > highH) {
      const maskB = new cv.Mat();
      const lowB = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [0, 50, 50, 0]);
      const highB = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [
        highH,
        255,
        255,
        255,
      ]);
      cv.inRange(hsv, lowB, highB, maskB);

      const maskC = new cv.Mat();
      const lowC = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [
        lowH,
        50,
        50,
        0,
      ]);
      const highC = new cv.Mat(
        hsv.rows,
        hsv.cols,
        hsv.type(),
        [179, 255, 255, 255]
      );
      cv.inRange(hsv, lowC, highC, maskC);

      cv.add(maskB, maskC, mask);
      cv.add(mask, maskA, mask);

      [maskB, maskC, lowB, highB, lowC, highC].forEach((m) => m.delete());
    } else {
      maskA.copyTo(mask);
    }

    // 创建结果图像（纯色填充）
    const dstColor = hexToRgba(color);
    const result = new cv.Mat(src.rows, src.cols, cv.CV_8UC4, [0, 0, 0, 0]);
    const colorMat = new cv.Mat(src.rows, src.cols, cv.CV_8UC4, [
      ...dstColor.slice(0, 3),
      255,
    ]);
    colorMat.copyTo(result, mask);

    // 清理内存
    [rgb, hsv, mask, maskA, low, high, colorMat].forEach((m) => m.delete());
    src.delete();

    return result;
  } catch (error) {
    // 发生错误时清理内存
    [src, hsv, mask].forEach((m) => m.delete());
    throw error;
  }
}

export function extractCircles(cvMat) {
  const dst = new cv.Mat();
  try {
    cv.cvtColor(cvMat, dst, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(dst, dst, new cv.Size(5, 5), 2, 2);

    const circles = detectCircles(dst);
    const stamps = circles.map((circle) => cropCircle(cvMat, circle));

    cvMat.delete();
    dst.delete();
    return stamps;
  } catch (error) {
    cvMat.delete();
    dst.delete();
    throw error;
  }
}

export function detectCircles(dst) {
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

export function cropCircle(cvMat, circle) {
  const scaleFactor = 1.2;
  const newRadius = circle.radius * scaleFactor;
  const size = Math.round(newRadius * 2);

  try {
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

    const mask = new cv.Mat.zeros(cropped.rows, cropped.cols, cv.CV_8UC1);
    const center = new cv.Point(cropped.cols / 2, cropped.rows / 2);
    const radius = Math.min(cropped.cols, cropped.rows) / 2;
    cv.circle(mask, center, radius, new cv.Scalar(255, 255, 255, 255), -1);

    const result = new cv.Mat();
    cropped.copyTo(result, mask);
    const ch = new cv.MatVector();
    cv.split(result, ch);
    const alphaSrc = ch.get(3);
    const alphaFinal = new cv.Mat();
    cv.bitwise_and(alphaSrc, mask, alphaFinal);
    ch.set(3, alphaFinal);
    cv.merge(ch, result);
    alphaSrc.delete();
    alphaFinal.delete();
    ch.delete();
    mask.delete();

    const canvas = document.createElement("canvas");
    canvas.width = result.cols;
    canvas.height = result.rows;
    cv.imshow(canvas, result);
    const base64 = canvas.toDataURL("image/png");

    [cropped, result].forEach((m) => m.delete());

    return base64;
  } catch (error) {
    throw error;
  }
}

export function hexToRgba(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b, 255];
}
