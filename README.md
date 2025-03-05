# ExtractStamp API 服务

这是一个基于 OpenCV 的印章提取 API 服务，可以从图片中提取印章图案，支持颜色设置和圆形检测。

## 功能特点

- 支持从图片中提取红色印章
- 可以自定义提取后的印章颜色
- 支持圆形印章的自动检测
- 返回 Base64 格式的透明背景图片
- RESTful API 设计
- 支持跨域请求

## 安装和运行

### 环境要求

- Node.js >= 14.0.0
- npm 或 pnpm

### 安装步骤

1. 克隆仓库：

```bash
git clone https://github.com/yourusername/extractstamp.git
cd extractstamp
```

2. 安装依赖：

```bash
pnpm install
# 或者使用 npm
npm install
```

3. 启动服务：

```bash
# 开发模式（支持热重载）
pnpm run dev

# 生产模式
pnpm start
```

服务默认运行在 <http://localhost:3000>

## API 文档

### 印章处理接口

```http
POST /api/stamp/process
Content-Type: multipart/form-data
```

**参数：**

- `image`: 图片文件（必需）
- `color`: 十六进制颜色值，如 "#ff0000"（可选，默认为红色）
- `detectOnly`: 是否只检测圆形，不提取印章（可选，默认为 false）
- `returnCircles`: 是否在返回印章的同时返回圆形信息（可选，默认为 false）

**响应格式：**

```json
{
  "success": true,
  "data": {
    // 响应数据
  }
}
```

**响应示例：**

1. 提取印章（默认行为）：

```json
{
  "success": true,
  "data": {
    "stamps": [
      "data:image/png;base64,..."  // 提取的印章图片（Base64）
    ]
  }
}
```

2. 只检测圆形（detectOnly=true）：

```json
{
  "success": true,
  "data": [
    {
      "x": 100,      // 圆心 X 坐标
      "y": 100,      // 圆心 Y 坐标
      "radius": 50   // 圆形半径
    }
  ]
}
```

3. 提取印章并返回圆形信息（returnCircles=true）：

```json
{
  "success": true,
  "data": {
    "stamps": [
      "data:image/png;base64,..."  // 提取的印章图片（Base64）
    ],
    "circles": [
      {
        "x": 100,
        "y": 100,
        "radius": 50
      }
    ]
  }
}
```

### 错误响应

```json
{
  "success": false,
  "message": "错误信息"
}
```

常见错误码：

- 400: 请求参数错误（如未上传图片）
- 500: 服务器内部错误

## 使用示例

### 使用 curl

```bash
# 提取印章（默认红色）
curl -X POST -F "image=@stamp.jpg" http://localhost:3000/api/stamp/process

# 提取蓝色印章
curl -X POST -F "image=@stamp.jpg" -F "color=#0000ff" http://localhost:3000/api/stamp/process

# 只检测圆形
curl -X POST -F "image=@stamp.jpg" -F "detectOnly=true" http://localhost:3000/api/stamp/process

# 提取印章并返回圆形信息
curl -X POST -F "image=@stamp.jpg" -F "returnCircles=true" http://localhost:3000/api/stamp/process
```

### 使用 JavaScript

```javascript
async function processStamp(imageFile, options = {}) {
  const formData = new FormData();
  formData.append('image', imageFile);
  
  // 添加可选参数
  Object.entries(options).forEach(([key, value]) => {
    formData.append(key, value);
  });
  
  const response = await fetch('http://localhost:3000/api/stamp/process', {
    method: 'POST',
    body: formData
  });
  
  return await response.json();
}

// 使用示例：
// 1. 提取红色印章
processStamp(imageFile);

// 2. 提取蓝色印章
processStamp(imageFile, { color: '#0000ff' });

// 3. 只检测圆形
processStamp(imageFile, { detectOnly: true });

// 4. 提取印章并返回圆形信息
processStamp(imageFile, { returnCircles: true });
```

## 注意事项

1. 上传的图片大小限制为 5MB
2. 支持的图片格式：JPEG、PNG、BMP
3. 印章检测主要针对红色印章，其他颜色可能无法准确识别
4. 圆形检测会返回最多 6 个最大的圆形区域
5. 所有返回的图片都是 PNG 格式，带有透明背景

## License

ISC
