import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // 库构建配置
  build: {
    lib: {
      entry: "src/index.js",
      name: "StampExtractor",
      fileName: (format) =>
        format === "es" ? "stamp-extractor" : "stamp-extractor",
      formats: ["es", "umd"],
    },
    rollupOptions: {
      // 不打包外部依赖（这里没有直接依赖）。OpenCV 通过全局变量 cv 提供。
      external: [],
      output: {
        globals: {
          // 如果未来以 npm 包形式引入 opencv.js，可在此声明全局映射
          // "opencv.js": "cv",
        },
      },
    },
    sourcemap: true,
    emptyOutDir: true,
  },
});
