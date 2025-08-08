import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // 库构建配置
  build: {
    lib: {
      entry: "lib/index.js",
      name: "StampExtractor",
      fileName: (format) =>
        format === "es" ? "stamp-extractor.es.js" : "stamp-extractor.umd.js",
      formats: ["es", "umd"],
    },
    rollupOptions: {
      // 不打包外部依赖，opencv 由运行时动态 import 或 CDN 注入
      external: ["@techstark/opencv-js"],
      output: {
        exports: "named",
        globals: {
          "@techstark/opencv-js": "cv",
        },
      },
    },
    sourcemap: true,
    emptyOutDir: true,
  },
});
