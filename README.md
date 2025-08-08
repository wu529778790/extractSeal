# 印章提取库 / 演示 (Vite + Vue)

DeepWiki: <https://deepwiki.com/wu529778790/extractSeal>

基于 OpenCV.js 的印章提取工具与库，可以自动从图片中识别和提取印章图像。

![20250225183255](https://gcore.jsdelivr.net/gh/wu529778790/image/blog/20250225183255.png)

## 功能特点

- 自动检测和提取图片中的圆形印章
- 支持自定义印章颜色，默认为红色
- 支持同时提取多个印章
- 基于HSV颜色空间的精确颜色匹配
- 使用霍夫圆变换进行印章形状检测
- 网页端实时处理，无需服务器

## 作为库使用（NPM）

安装：

```bash
npm i extract-seal
```

浏览器在使用时需先加载 OpenCV.js（提供全局 `cv`），例如：

```html
<script src="https://docs.opencv.org/4.5.0/opencv.js"></script>
```

使用示例：

```js
import StampExtractor from 'extract-seal'

const extractor = new StampExtractor()
await extractor.initOpenCV()

// 从 File 提取
const stamps = await extractor.extractFromFile(file, { color: '#ff0000' })

// 或从 HTMLImageElement 提取
const img = new Image()
img.src = 'xxx.png'
img.onload = () => {
  const result = extractor.extractFromImage(img, { color: '#ff0000' })
}
```

## 演示项目（本仓库）安装与运行

### 安装依赖

```bash
npm install
# 或者使用 pnpm
pnpm install
```

### 开发模式运行

```bash
npm run dev
```

### 构建生产版本（库）

```bash
npm run build
```

## 注意事项

- 由于 OpenCV.js 的 npm 包在浏览器环境中存在兼容性问题，本项目使用 CDN 方式引入 OpenCV.js，并通过全局 `cv` 使用。
- 首次加载可能需要等待OpenCV.js下载完成

## 许可证

MIT
