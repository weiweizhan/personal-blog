---
title: Hello World
date: 2024-01-20
category: 人文
tags: [博客, 随笔]
excerpt: 这是我的第一篇博客文章，记录了建立这个博客的初衷和期望。
---

# Hello World

欢迎来到我的博客！这是我使用 Node.js 和 Express 搭建的个人博客系统。

## 技术栈

- Node.js
- Express
- EJS 模板引擎
- Markdown 支持
- 代码高亮

## 示例代码

```javascript
const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('Hello, World!');
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
```

## 未来计划

1. 添加评论功能
2. 实现用户认证
3. 添加搜索功能
4. 优化性能
