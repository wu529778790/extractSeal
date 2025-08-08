# 印章提取库 / 演示 (Vite + Vue)

DeepWiki: <https://deepwiki.com/wu529778790/extractSeal>

基于 OpenCV.js 的印章提取库，可从图片中自动识别并提取印章图像。内置 OpenCV 资源，默认同源加载，适合内网环境。

![20250225183255](https://gcore.jsdelivr.net/gh/wu529778790/image/blog/20250225183255.png)

## 功能特点

- 自动检测并提取图片中的圆形印章
- 支持自定义印章颜色（默认红色）
- 支持同时提取多个印章
- 基于 HSV 颜色空间进行颜色筛选
- 使用霍夫圆变换进行形状检测
- 浏览器端实时处理，无需服务器

## 作为库使用（NPM）

安装：

```bash
npm i extract-seal
```

无需手动引入外部脚本，库会在 `initOpenCV` 时自动加载内置的 OpenCV 资源（同源 URL）。

使用示例：

```js
import { initOpenCV, extractFromFile, extractFromImage } from 'extract-seal'

// 默认 60s 超时；也可自定义 { timeoutMs, url }
await initOpenCV()

// 从 File 提取
const stamps = await extractFromFile(file, { color: '#ff0000' })

// 或从 HTMLImageElement 提取
const img = new Image()
img.src = 'xxx.png'
img.onload = async () => {
  await initOpenCV()
  const list = extractFromImage(img, { color: '#ff0000' })
}
```

也可使用默认导出对象：

```js
import ExtractSeal from 'extract-seal'

await ExtractSeal.initOpenCV()
const stamps = await ExtractSeal.extractFromFile(file, { color: '#ff0000' })
```

### API 概览

- `initOpenCV(options?) => Promise<boolean>`
  - `options.url?: string` 自定义 OpenCV 脚本地址（一般不需要设置）
  - `options.timeoutMs?: number` 初始化超时（默认 60000）
- `extractFromFile(file: File, options?) => Promise<string[]>`
- `extractFromImage(img: HTMLImageElement, options?) => string[]`
  - `options.color?: string` 目标印章颜色，十六进制，如 `#ff0000`

低阶算法方法（命名导出，调用前需先 `await initOpenCV()`）：

- `extractStampToMat(img: HTMLImageElement, color: string) => cv.Mat`
- `extractCircles(mat: cv.Mat) => string[]`（返回裁剪后的 PNG base64 列表）
- `detectCircles(mat: cv.Mat) => { x: number; y: number; radius: number }[]`
- `cropCircle(mat: cv.Mat, circle) => string`（返回 PNG base64）
- `rgbToHsv(r, g, b) => [h, s, v]`
- `hexToRgba(hex) => [r, g, b, a]`

默认导出为一个对象（非类），包含上述同名方法，方便按旧习惯 `import ExtractSeal from 'extract-seal'` 直接使用。

类型声明已内置于 `types/index.d.ts`。

### 通过 `<script>` 使用（UMD）

构建后可直接在浏览器中通过全局变量使用：

```html
<script src="/dist/stamp-extractor.umd.js"></script>
<script>
  // UMD 全局名：StampExtractor
  StampExtractor.initOpenCV().then(() => {
    // 传入 HTMLImageElement，或使用 extractFromFile 处理 File
    const list = StampExtractor.extractFromImage(img, { color: '#ff0000' })
    console.log(list)
  })
  
  // 低阶函数同样可用
  // const mat = StampExtractor.extractStampToMat(img, '#ff0000')
  // const circles = StampExtractor.detectCircles(mat)
  // ...
  
  // 注意：请先 initOpenCV 再调用算法函数
  
  </script>
```

## 演示项目（本仓库）

目录结构：

- `lib/`：npm 包源码（库入口 `lib/index.js`）
- `src/`：演示代码（开发时挂载为页面）

### 安装与启动

```bash
npm install
npm run dev
```

### 构建库产物

```bash
npm run build
# 产物：dist/stamp-extractor.es.js、dist/stamp-extractor.umd.js
```

## 注意事项

- 默认同源加载内置 OpenCV 资源，无需联网；首次加载可能稍慢。
- 如果你确实要走自定义地址，可 `initOpenCV({ url: '...' })` 明确指定。

## 许可证

MIT
