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

## GitHub Pages 自动部署

本项目配置了GitHub Actions，可以在代码提交到main分支时自动构建并部署到GitHub Pages。

### 如何使用

1. 确保你的GitHub仓库已启用GitHub Pages功能
   - 进入仓库设置 -> Pages
   - 在"Build and deployment"部分，选择"GitHub Actions"作为源

2. 将代码提交到main分支

   ```bash
   git add .
   git commit -m "更新内容"
   git push origin main
   ```

3. GitHub Actions将自动运行部署工作流
   - 可以在仓库的Actions标签页查看部署进度
   - 部署完成后，应用将可以通过 `https://[用户名].github.io/extractSeal/` 访问

### 手动触发部署

你也可以手动触发部署：

1. 进入仓库的Actions标签页
2. 选择"部署到GitHub Pages"工作流
3. 点击"Run workflow"按钮

## 注意事项

- 如果你的仓库名称不是`extractSeal`，请修改`vite.config.js`中的`base`选项为你的仓库名称
- 首次部署可能需要几分钟才能生效
