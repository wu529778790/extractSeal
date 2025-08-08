import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// 独立的 Demo 构建配置，不影响库构建
// 使用 BASE_PATH 指定 GitHub Pages 的仓库子路径，例如：/your-repo/
// 本地开发与预览可不设置，默认为 "/"
const base = process.env.BASE_PATH || "/";

export default defineConfig({
  base,
  plugins: [vue()],
  build: {
    outDir: "dist-demo",
    emptyOutDir: true,
    rollupOptions: {
      input: "index.html",
    },
  },
});
