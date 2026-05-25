# Pxz's videos

一个使用 Node.js + Express 搭建的个人视频网站。首页会自动读取 `public/videos` 文件夹里的 `.mp4` 视频，并以简化版 YouTube 的黑白灰风格展示。

## 功能

- 首页显示本地视频列表
- 支持搜索视频标题
- 支持在线播放 `public/videos` 里的 `.mp4` 视频
- 简洁的黑白灰界面风格

## 项目结构

```text
.
├─ package.json
├─ package-lock.json
├─ server.js
├─ public/
│  ├─ css/
│  │  └─ styles.css
│  └─ videos/
│     └─ 放入你的 .mp4 视频
├─ .gitignore
└─ README.md
```

## 本地运行

先安装依赖：

```bash
npm install
```

启动项目：

```bash
npm start
```

打开浏览器访问：

```text
http://localhost:3000
```

开发模式：

```bash
npm run dev
```

## 添加视频

把 `.mp4` 文件放到：

```text
public/videos
```

然后刷新首页即可看到视频列表。

## 上传到 GitHub

建议上传这些内容：

```text
package.json
package-lock.json
server.js
public/
.gitignore
README.md
```

不要上传：

```text
node_modules/
*.log
.env
```

注意：GitHub Pages 不能直接运行 Express 服务。如果需要公网访问，可以把 GitHub 仓库连接到 Render、Railway、Fly.io、Vercel 等支持 Node.js 服务的平台。
