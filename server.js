const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const publicDir = path.join(__dirname, "public");
const videosDir = path.join(publicDir, "videos");
const R2_BASE_URL = "https://pub-bb8e0543cbd9475d85ccd4887c1f2155.r2.dev";

app.use(express.static(publicDir));

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getVideos() {
  if (!fs.existsSync(videosDir)) {
    return [];
  }

  return fs
    .readdirSync(videosDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".mp4"))
    .map((entry) => {
      const filePath = path.join(videosDir, entry.name);
      const stats = fs.statSync(filePath);
      let title = path.basename(entry.name, path.extname(entry.name)).replaceAll(/[-_]+/g, " ");
      
      // 特殊处理 test.mp4 显示为梓川咲太
      if (entry.name.toLowerCase() === "test.mp4") {
        title = "梓川咲太";
      }

      return {
        filename: entry.name,
        title,
        size: stats.size,
        updatedAt: stats.mtime
      };
    })
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** unitIndex;
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function renderLayout({ title, content, searchValue = "" }) {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <link rel="stylesheet" href="/css/styles.css">
  </head>
  <body>
    <header class="topbar">
      <a class="brand" href="/" aria-label="返回首页">
        <span class="brand-mark">▶</span>
        <span>MiniTube</span>
      </a>
      <form class="search" action="/" method="get">
        <input type="search" name="q" placeholder="搜索本地视频" value="${escapeHtml(searchValue)}">
      </form>
      <div class="user-dot" aria-hidden="true"></div>
    </header>
    <main>
      ${content}
    </main>
  </body>
</html>`;
}

function renderHome(videos, query = "") {
  const normalizedQuery = query.trim().toLowerCase();
  const filteredVideos = normalizedQuery
    ? videos.filter((video) => video.title.toLowerCase().includes(normalizedQuery))
    : videos;

  const cards = filteredVideos
    .map((video) => {
      const href = `/watch/${encodeURIComponent(video.filename)}`;
      const videoSrc = `${R2_BASE_URL}/${encodeURIComponent(video.filename)}`;
      const updated = new Intl.DateTimeFormat("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }).format(video.updatedAt);

      return `<article class="video-card">
         <a class="thumb" href="${href}" aria-label="播放 ${escapeHtml(video.title)}">
          <video src="${videoSrc}#t=0.1" muted preload="metadata"></video>
          <span class="play-badge">▶</span>
        </a>
        <div class="video-meta">
          <a class="video-title" href="${href}">${escapeHtml(video.title)}</a>
          <p>${escapeHtml(formatBytes(video.size))} · ${escapeHtml(updated)}</p>
        </div>
      </article>`;
    })
    .join("");

  const emptyMessage = normalizedQuery
    ? "没有找到匹配的视频。"
    : "还没有视频。把 mp4 文件放进 public/videos 文件夹后刷新页面。";

  return renderLayout({
    title: "MiniTube",
    searchValue: query,
    content: `<section class="hero">
        <div>
          <p class="eyebrow">Local Video Library</p>
          <h1>本地迷你视频网站</h1>
        </div>
        <span>${filteredVideos.length} 个视频</span>
      </section>
      ${
        filteredVideos.length
          ? `<section class="video-grid">${cards}</section>`
          : `<section class="empty-state">${escapeHtml(emptyMessage)}</section>`
      }`
  });
}

function renderWatch(video, relatedVideos) {
  const videoSrc = `${R2_BASE_URL}/${encodeURIComponent(video.filename)}`;
  const relatedCards = relatedVideos
    .filter((item) => item.filename !== video.filename)
    .slice(0, 8)
    .map((item) => {
      const href = `/watch/${encodeURIComponent(item.filename)}`;
      return `<a class="related-item" href="${href}">
        <video src="${R2_BASE_URL}/${encodeURIComponent(item.filename)}#t=0.1" muted preload="metadata"></video>
        <span>${escapeHtml(item.title)}</span>
      </a>`;
    })
    .join("");

  return renderLayout({
    title: `${video.title} - MiniTube`,
    content: `<section class="watch-layout">
        <div class="player-column">
          <video class="player" src="${videoSrc}" controls autoplay></video>
          <div class="watch-info">
            <h1>${escapeHtml(video.title)}</h1>
            <p>${escapeHtml(formatBytes(video.size))}</p>
          </div>
        </div>
        <aside class="related">
          <h2>更多视频</h2>
          ${relatedCards || `<p class="muted">暂无其他视频</p>`}
        </aside>
      </section>`
  });
}

app.get("/", (req, res) => {
  const videos = getVideos();
  res.send(renderHome(videos, req.query.q || ""));
});

app.get("/watch/:filename", (req, res) => {
  const filename = path.basename(req.params.filename);
  const videos = getVideos();
  const video = videos.find((item) => item.filename === filename);

  if (!video) {
    res.status(404).send(
      renderLayout({
        title: "视频不存在 - MiniTube",
        content: `<section class="empty-state">没有找到这个视频。<br><a href="/">返回首页</a></section>`
      })
    );
    return;
  }

  res.send(renderWatch(video, videos));
});

app.listen(PORT, () => {
  console.log(`MiniTube is running at http://localhost:${PORT}`);
});
