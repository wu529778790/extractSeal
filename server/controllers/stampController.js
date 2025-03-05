const cv = require("opencv-wasm");
const stampService = require("../services/stampService");

class StampController {
  // 统一的印章处理方法
  async processStamp(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "请上传图片",
        });
      }

      const {
        color = "#ff0000", // 设置印章颜色，默认红色
        detectOnly = "false", // 是否只检测圆形，不提取印章
        returnCircles = "false", // 是否在提取印章的同时返回圆形信息
      } = req.body;

      const buffer = req.file.buffer;
      let result;

      if (detectOnly === "true") {
        // 只检测圆形
        result = await stampService.detectCircles(buffer);
        return res.json({
          success: true,
          data: result,
        });
      }

      // 提取印章
      const stamps = await stampService.extractStampWithColor(buffer, color);

      result = {
        stamps,
      };

      // 如果需要同时返回圆形信息
      if (returnCircles === "true") {
        const circles = await stampService.detectCircles(buffer);
        result.circles = circles;
      }

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new StampController();
