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
      // 保持默认（不 external），我们用 ?url 注入静态资源
      external: [],
      output: {
        exports: "named",
        globals: {},
      },
    },
    sourcemap: true,
    emptyOutDir: true,
  },
});
