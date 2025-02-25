# 印章提取工具 (Vite + Vue版本)

基于OpenCV.js的印章提取工具，可以自动从图片中识别和提取印章图像。

## 功能特点

- 自动识别图片中的印章
- 支持自定义印章颜色
- 提取多个印章
- 基于Vue 3和Vite构建
- 使用CDN方式引入OpenCV.js (解决npm包兼容性问题)

## 安装与运行

### 安装依赖

```bash
npm install
```

### 开发模式运行

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## 使用方法

1. 选择印章颜色（默认为红色）
2. 上传包含印章的图片
3. 等待处理完成，查看提取的印章结果

## 技术栈

- Vue 3
- Vite
- OpenCV.js (CDN引入)

## 注意事项

- 由于OpenCV.js的npm包在浏览器环境中存在兼容性问题，本项目使用CDN方式引入OpenCV.js
- 首次加载可能需要等待OpenCV.js下载完成

## 许可证

MIT
