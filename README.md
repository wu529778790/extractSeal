# extract-seal｜浏览器印章提取（OpenCV.js）

基于 OpenCV.js 的轻量印章提取库，从图片中自动识别并裁剪圆形印章。内置并同源加载 OpenCV 脚本，适合内网/离线环境。

Demo（原图在左｜提取结果在右）：`https://wu529778790.github.io/extractSeal/`

## 亮点

- 自研颜色筛选（HSV）+ 霍夫圆检测，准确提取圆形印章
- 支持自定义印章颜色（默认红色 `#ff0000`）
- 自动提取多枚印章，返回透明底 PNG（base64）
- 内置 OpenCV 资源，`initOpenCV` 一步加载，无需外网

---

## 安装

```bash
npm i extract-seal
# 或
pnpm add extract-seal
# 或
yarn add extract-seal
```

## 快速上手

```ts
import { initOpenCV, extractFromFile, extractFromImage } from 'extract-seal'

// 1) 初始化（默认 60s 超时，可自定义 { timeoutMs, url }）
await initOpenCV()

// 2) 从 File 提取（返回 base64[]）
const stamps = await extractFromFile(file, { color: '#ff0000' })

// 或：从 <img> 元素提取
const img = new Image()
img.src = '/path/to/image.png'
await img.decode()
const list = extractFromImage(img, { color: '#ff0000' })
```

也支持默认导出：

```ts
import ExtractSeal from 'extract-seal'
await ExtractSeal.initOpenCV()
const stamps = await ExtractSeal.extractFromFile(file, { color: '#ff0000' })
```

## API（精简）

- `initOpenCV(options?) => Promise<boolean>`
  - `options.url?: string` 自定义 OpenCV 脚本地址（一般无需设置）
  - `options.timeoutMs?: number` 超时，默认 `60000`
- `extractFromFile(file: File, options?) => Promise<string[]>`
- `extractFromImage(img: HTMLImageElement, options?) => string[]`
  - `options.color?: string` 目标印章颜色（十六进制），如 `#ff0000`

低阶方法（调用前需确保已 `await initOpenCV()`）：

- `extractStampToMat(img: HTMLImageElement, color: string) => cv.Mat`
- `extractCircles(mat: cv.Mat) => string[]`（裁剪后 PNG base64 列表）
- `detectCircles(mat: cv.Mat) => { x: number; y: number; radius: number }[]`
- `cropCircle(mat: cv.Mat, circle) => string`（PNG base64）
- `rgbToHsv(r, g, b) => [h, s, v]`
- `hexToRgba(hex) => [r, g, b, a]`

类型声明：已内置于 `types/index.d.ts`。

## 浏览器直连（CDN/UMD）

```html
<script src="https://unpkg.com/extract-seal/dist/stamp-extractor.umd.js"></script>
<script>
  (async () => {
    const { initOpenCV, extractFromFile } = window.ExtractSeal
    await initOpenCV()
    // 然后处理 <input type="file"> 选取的文件
  })()
</script>
```

## 许可

MIT
