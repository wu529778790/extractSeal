# extractSeal

基于OpenCV.js的印章提取工具，可以自动从图片中识别和提取印章图像。

## 功能特点

- 自动检测和提取图片中的圆形印章
- 支持自定义印章颜色，默认为红色
- 支持同时提取多个印章
- 基于HSV颜色空间的精确颜色匹配
- 使用霍夫圆变换进行印章形状检测
- 网页端实时处理，无需服务器

## 在线使用

1. 打开 `index.html` 文件
2. 选择要处理的图片文件
3. 可选：调整印章颜色（默认为红色）
4. 等待处理完成，查看提取结果

## 技术实现

- 使用 OpenCV.js 进行图像处理
- HSV 颜色空间转换实现精确的印章颜色识别
- 霍夫圆变换（HoughCircles）实现印章形状检测
- Canvas API 实现图像显示和导出

## 开发说明

### 依赖

- OpenCV.js (v4.5.0)

### 核心类

- `StampExtractor`: 印章提取核心类
  - `extractFromFile`: 从文件提取印章
  - `extractFromImage`: 从图像提取印章
  - `extractStampToMat`: 印章颜色提取
  - `detectCircles`: 圆形检测
  - `cropCircle`: 印章裁剪

### 使用示例

```javascript
// 创建提取器实例
const extractor = new StampExtractor();

// 等待 OpenCV 加载完成
await extractor.initOpenCV();

// 提取印章（支持自定义颜色）
const stamps = await extractor.extractFromFile(imageFile, { 
    color: "#ff0000" // 红色
});
```

## 注意事项

- 确保图片中的印章边缘清晰
- 图片分辨率不宜过大，建议控制在 2000x2000 像素以内
- 印章颜色与背景应有足够的对比度

## 开源协议

MIT License
