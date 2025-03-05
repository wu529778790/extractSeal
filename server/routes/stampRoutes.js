const express = require("express");
const router = express.Router();
const multer = require("multer");
const stampController = require("../controllers/stampController");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 限制 5MB
  },
});

// 统一的印章处理接口
router.post("/process", upload.single("image"), stampController.processStamp);

module.exports = router;
