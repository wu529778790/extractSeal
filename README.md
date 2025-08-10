# 印章提取库

基于 OpenCV.js 的印章提取库，可从图片中自动识别并提取印章图像。内置 OpenCV 资源，默认同源加载，适合内网环境。

演示：<https://wu529778790.github.io/extractSeal/>

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
