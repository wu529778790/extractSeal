const express = require("express");
const cors = require("cors");
const multer = require("multer");
const stampRoutes = require("./routes/stampRoutes");

const app = express();
const port = process.env.PORT || 3000;

// 配置 multer 用于处理文件上传
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 限制文件大小为 5MB
  },
});

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由
app.use("/api/stamp", stampRoutes);

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "服务器内部错误",
    error: err.message,
  });
});

app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
});
