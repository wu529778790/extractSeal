# 印章提取工具 (Vite + Vue版本)

基于OpenCV.js的印章提取工具，可以自动从图片中识别和提取印章图像。

![20250225183255](https://gcore.jsdelivr.net/gh/wu529778790/image/blog/20250225183255.png)

## 功能特点

- 自动检测和提取图片中的圆形印章
- 支持自定义印章颜色，默认为红色
- 支持同时提取多个印章
- 基于HSV颜色空间的精确颜色匹配
- 使用霍夫圆变换进行印章形状检测
- 网页端实时处理，无需服务器

## 安装与运行

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

### 构建生产版本

```bash
npm run build
```

## 注意事项

- 由于OpenCV.js的npm包在浏览器环境中存在兼容性问题，本项目使用CDN方式引入OpenCV.js
- 首次加载可能需要等待OpenCV.js下载完成

## 许可证

MIT
