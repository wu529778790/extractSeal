# extract-seal｜浏览器印章提取（OpenCV.js）

基于 OpenCV.js 的轻量印章提取库，从图片中自动识别并裁剪圆形印章。内置并同源加载 OpenCV 脚本.

Demo：<https://wu529778790.github.io/extractSeal/>

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

## API

### 高阶 API

| 函数 | 签名 | 说明 | 返回 |
| --- | --- | --- | --- |
| `initOpenCV` | `(options?) => Promise<boolean>` | 加载并初始化 OpenCV（内置同源脚本） | 是否成功 |
| `extractFromFile` | `(file: File, options?) => Promise<string[]>` | 从文件中提取印章 | PNG base64 数组 |
| `extractFromImage` | `(img: HTMLImageElement, options?) => string[]` | 从 `<img>` 元素提取印章 | PNG base64 数组 |

### 选项

OpenCVLoadOptions（`initOpenCV`）

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `url` | `string` | 内置同源地址 | 自定义 OpenCV.js 脚本地址（一般无需设置） |
| `timeoutMs` | `number` | `60000` | 初始化超时毫秒数 |

ExtractOptions（`extractFromFile`/`extractFromImage`）

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `color` | `string` | `#ff0000` | 目标印章颜色（十六进制） |

### 低阶方法（需先 `await initOpenCV()`）

| 函数 | 签名 | 说明 |
| --- | --- | --- |
| `extractStampToMat` | `(img: HTMLImageElement, color: string) => cv.Mat` | 颜色筛选后输出对应 `cv.Mat` |
| `extractCircles` | `(mat: cv.Mat) => string[]` | 基于圆检测裁剪，输出 PNG base64 数组 |
| `detectCircles` | `(mat: cv.Mat) => { x: number; y: number; radius: number }[]` | 返回检测到的圆参数列表 |
| `cropCircle` | `(mat: cv.Mat, circle) => string` | 将圆区域裁剪为透明底 PNG（base64） |
| `rgbToHsv` | `(r: number, g: number, b: number) => [number, number, number]` | RGB 转 HSV（OpenCV 标准量化） |
| `hexToRgba` | `(hex: string) => [number, number, number, number]` | 十六进制颜色转 RGBA |

类型声明已内置于 `types/index.d.ts`。

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
