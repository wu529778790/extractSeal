import { NextResponse } from "next/server";
import sharp from "sharp";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json({ error: "没有上传文件" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 基础图像处理
    const { data, info } = await sharp(buffer)
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { width, height } = info;

    // 用于存储红色像素的位置
    let sumX = 0;
    let sumY = 0;
    let redPixelCount = 0;
    let maxDistance = 0;

    // 红色像素判定
    const isRedPixel = (r: number, g: number, b: number) => {
      const maxGB = Math.max(g, b);
      return (
        r > 40 && // 基础红色阈值
        r > maxGB * 1.15 && // 基础红色比例
        r - maxGB > 15 // 基础红色差异
      );
    };

    // 第一次遍历：找到所有红色像素并计算中心点
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 3;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        if (isRedPixel(r, g, b)) {
          sumX += x;
          sumY += y;
          redPixelCount++;
        }
      }
    }

    if (redPixelCount === 0) {
      return NextResponse.json({ error: "未检测到印章" }, { status: 400 });
    }

    const centerX = sumX / redPixelCount;
    const centerY = sumY / redPixelCount;

    // 第二次遍历：计算最大半径
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 3;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        if (isRedPixel(r, g, b)) {
          const dx = x - centerX;
          const dy = y - centerY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          maxDistance = Math.max(maxDistance, distance);
        }
      }
    }

    // 计算裁剪区域
    const radius = Math.ceil(maxDistance) + 10;
    const minX = Math.max(0, Math.floor(centerX - radius));
    const minY = Math.max(0, Math.floor(centerY - radius));
    const maxX = Math.min(width - 1, Math.ceil(centerX + radius));
    const maxY = Math.min(height - 1, Math.ceil(centerY + radius));

    const cropWidth = maxX - minX + 1;
    const cropHeight = maxY - minY + 1;

    // 创建裁剪后的图像数据
    const croppedData = Buffer.alloc(cropWidth * cropHeight * 4, 0);

    // 复制印章区域的数据
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= maxDistance + 2) {
          const srcIdx = (y * width + x) * 3;
          const dstIdx = ((y - minY) * cropWidth + (x - minX)) * 4;
          const r = data[srcIdx];
          const g = data[srcIdx + 1];
          const b = data[srcIdx + 2];

          if (isRedPixel(r, g, b)) {
            croppedData[dstIdx] = r; // 保持原始红色值
            croppedData[dstIdx + 1] = 0;
            croppedData[dstIdx + 2] = 0;
            croppedData[dstIdx + 3] = 255;
          } else {
            croppedData[dstIdx] = 0;
            croppedData[dstIdx + 1] = 0;
            croppedData[dstIdx + 2] = 0;
            croppedData[dstIdx + 3] = 0;
          }
        }
      }
    }

    // 最终图像处理
    const processedImage = await sharp(croppedData, {
      raw: {
        width: cropWidth,
        height: cropHeight,
        channels: 4,
      },
    })
      .png()
      .toBuffer();

    const base64Image = processedImage.toString("base64");

    return NextResponse.json({
      image: `data:image/png;base64,${base64Image}`,
    });
  } catch (error) {
    console.error("处理印章时出错:", error);
    return NextResponse.json({ error: "处理印章时出错" }, { status: 500 });
  }
}
