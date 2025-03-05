import { NextResponse } from "next/server";
import sharp from "sharp";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json({ error: "没有上传文件" }, { status: 400 });
    }

    // 直接从内存中读取图片
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 使用 Sharp 处理图像
    const image = sharp(buffer);

    // 获取图像信息
    const metadata = await image.metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    // 提取红色通道
    const { data } = await image.raw().toBuffer({ resolveWithObject: true });

    // 用于存储红色像素的位置，以计算印章中心
    let sumX = 0;
    let sumY = 0;
    let redPixelCount = 0;
    let maxDistance = 0;

    // 第一次遍历：找到所有红色像素并计算实际中心点
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 3;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        if (r > 150 && r > g * 1.5 && r > b * 1.5) {
          sumX += x;
          sumY += y;
          redPixelCount++;
        }
      }
    }

    if (redPixelCount === 0) {
      return NextResponse.json({ error: "未检测到印章" }, { status: 400 });
    }

    // 计算实际的印章中心
    const sealCenterX = sumX / redPixelCount;
    const sealCenterY = sumY / redPixelCount;

    // 第二次遍历：找到最大半径
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 3;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        if (r > 150 && r > g * 1.5 && r > b * 1.5) {
          const dx = x - sealCenterX;
          const dy = y - sealCenterY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          maxDistance = Math.max(maxDistance, distance);
        }
      }
    }

    // 添加一些边距到半径
    const radius = Math.ceil(maxDistance) + 10;

    // 计算裁剪区域
    const minX = Math.max(0, Math.floor(sealCenterX - radius));
    const minY = Math.max(0, Math.floor(sealCenterY - radius));
    const maxX = Math.min(width - 1, Math.ceil(sealCenterX + radius));
    const maxY = Math.min(height - 1, Math.ceil(sealCenterY + radius));

    // 计算裁剪区域的尺寸
    const cropWidth = maxX - minX + 1;
    const cropHeight = maxY - minY + 1;

    // 创建裁剪后的图像数据（使用白色背景）
    const croppedData = Buffer.alloc(cropWidth * cropHeight * 3, 255); // 初始化为白色

    // 复制印章区域的数据
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dx = x - sealCenterX;
        const dy = y - sealCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= maxDistance) {
          const srcIdx = (y * width + x) * 3;
          const dstIdx = ((y - minY) * cropWidth + (x - minX)) * 3;
          const r = data[srcIdx];
          const g = data[srcIdx + 1];
          const b = data[srcIdx + 2];

          if (r > 150 && r > g * 1.5 && r > b * 1.5) {
            croppedData[dstIdx] = r;
            croppedData[dstIdx + 1] = 0;
            croppedData[dstIdx + 2] = 0;
          }
        }
      }
    }

    // 将处理后的图像转换为 base64
    const processedImage = await sharp(croppedData, {
      raw: {
        width: cropWidth,
        height: cropHeight,
        channels: 3,
      },
    })
      .gamma(1.5) // 增加对比度
      .sharpen() // 锐化
      .jpeg({
        quality: 100, // 最高质量
        chromaSubsampling: "4:4:4", // 保持色彩清晰
      })
      .toBuffer();

    // 将 buffer 转换为 base64
    const base64Image = processedImage.toString("base64");

    return NextResponse.json({
      image: `data:image/jpeg;base64,${base64Image}`,
    });
  } catch (error) {
    console.error("处理印章时出错:", error);
    return NextResponse.json({ error: "处理印章时出错" }, { status: 500 });
  }
}
