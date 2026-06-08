# MLNLP 官网优化计划（Optimization Plan）

> 本文档记录 MLNLP 社区官网（mlnlpworld.com）的优化建议与执行规划，供维护者参考与跟踪进度。
>
> 维护者：网站优化负责人 · 最后更新：2026-06-08

---

## 0. 协作流程（Workflow）

为保证主分支稳定，所有优化按以下流程进行：

```bash
# 1. 克隆项目到本地
git clone https://github.com/MLNLP-World/mlnlp-website.git
cd mlnlp-website

# 2. 为每一项优化创建独立分支（例：图片优化）
git checkout -b optimize/images

# 3. 完成修改后提交
git add .
git commit -m "optimize: 压缩并转换站点图片为 WebP"

# 4. 推送到远程并发起 Pull Request
git push -u origin optimize/images
```

> 建议：一个分支只做一类改动，便于 Review 与回滚。

---

## 1. 现状速览（Current State）

| 维度 | 现状 |
| --- | --- |
| 站点类型 | 纯静态站点，部署于 GitHub Pages（自定义域名 `mlnlpworld.com`） |
| 技术栈 | 原生 HTML + Bootstrap + jQuery |
| 数据方案 | 用 `sql.js`（WASM）在浏览器端直接读取 `db/mlnlp.sqlite`（约 528KB）渲染数据 |
| 仓库体积 | 去掉 `.git` 后约 **143MB**，其中**图片约 131MB** |
| 图片资产 | 289 个 PNG + 58 个 JPG |

问题集中在三块：**图片体积**、**第三方库冗余**、**SEO / 工程化缺失**。

---

## 2. 优化清单（按收益优先级排序）

### 🔴 P0 · 图片优化（预计可减少约 80% 体积）

这是当前最严重、收益最大的问题，直接影响首屏加载速度与 GitHub Pages 配额。

- [ ] **格式转换**：289 张照片误存为 PNG。人物 / 活动照片属连续色调图，应转为 **WebP**（或退而求其次用 JPG），通常可缩小 3–10 倍。
- [ ] **尺寸限制**：单图过大，如 `committee/zhaojieyu.png`（8.6MB）、`maozihao.png`（6.4MB）。长边限制到约 1200px、质量 80。预计 131MB → 15–25MB。
- [ ] **懒加载**：全站目前仅 1 处 `loading="lazy"`。为所有 `<img>` 添加 `loading="lazy"`。
- [ ] **防布局抖动**：为图片补全 `width` / `height` 属性，改善 CLS（Cumulative Layout Shift）。
- [ ] **缩略图**：头像类小图生成缩略图，原图仅在详情页加载。

### 🟠 P1 · 第三方库瘦身（vendor 占 13MB+）

- [ ] **清理 Bootstrap 冗余**：`assets/vendor/bootstrap` 单独占 7.9MB，因同时提交了完整版 + 压缩版 + RTL 版 + 所有 `.map` source map。生产环境只需 `bootstrap.min.css` + `bootstrap.bundle.min.js`。删除全部 `.map`、未压缩文件、`*.rtl.*`。
- [ ] **评估 jQuery**：`jquery.min.js`（84KB），确认 `main.js` 依赖程度，可能可移除。
- [ ] **考虑 CDN**：Bootstrap / 字体可改用 CDN 引入，减小仓库并利用浏览器缓存。

### 🟡 P2 · SEO 与可访问性（目前几乎空白）

- [ ] **补全 meta**：所有页面的 `<meta name="description">`、`<meta name="keywords">` 均为空。
- [ ] **社交分享标签**：补充 Open Graph（`og:title` / `og:description` / `og:image`）与 Twitter Card，改善分享到微信 / Twitter 的展示。
- [ ] **语言声明**：`<html lang="en">` 与中文内容不符，应改为 `lang="zh-CN"`。
- [ ] **基础设施**：生成标准 `favicon`（目前直接用 `logo.jpeg`）、`sitemap.xml`、`robots.txt`。

### 🟡 P3 · 代码与架构

- [ ] **数据加载方案**：每次进页面需下载约 688KB WASM + 528KB SQLite 并在前端建库查询。数据量小且基本静态，可考虑**构建时将 SQLite 导出为 JSON**，前端直接 `fetch`，省去整套 WASM 依赖（改动较大，首屏收益明显）。
- [ ] **修复 N+1 查询**：`assets/js/db/activity.js` 中 `findActivitiesByPage` 对每个活动单独查询嘉宾，应改为单条 `IN (...)` 或 JOIN。
- [ ] **参数化查询**：查询使用 `${type}` 直接拼接 URL 参数，建议改用 `sql.js` 的参数化接口（`db.exec(sql, params)`）。
- [ ] **清理死代码**：`index.html` 头部 Google Analytics 已注释，但 `gtag('config', ...)` 仍在执行，README 也已注明"删除谷歌分析脚本"，应彻底清除。

---

## 3. 建议执行顺序（Roadmap）

1. **P0 图片优化** —— 收益最大、风险最低（转 WebP + 全站懒加载）。
2. **P1 vendor 瘦身** —— 删除 map / 未压缩 / RTL 文件。
3. **P2 SEO meta 补全 + lang 修正** —— 改动小、价值高。
4. **P3 架构级优化** —— JSON 替代 sql.js、修复 N+1（后续迭代）。

---

## 4. 进度跟踪（Changelog）

| 日期 | 分支 / PR | 内容 | 状态 |
| --- | --- | --- | --- |
| 2026-06-08 | `optimization-plan` | 创建优化计划文档 | ✅ 已完成 |
