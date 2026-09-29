# 雪人老师·微信小程序开发引导（xueren-wx-miniprogram-guide）

> 全程用 WorkBuddy 引导用户**从零开发并发布**自己的微信小程序（**不需要装微信开发者工具**）。
> 6 阶段对话式向导：需求澄清 → 注册 AppID → 生成骨架 → 出预览二维码真机验证 → 接 WB 云后端 → 上传开发版本 + 引导手动提审 + 审核通过后手动点发布上线。

## 特性

- **零工具门槛**：全程命令行，不引导用户下载微信开发者工具
- **6 阶段对话向导**：每步先问再动，每步真机扫码验证
- **一键脚本**：`assets/publish.js` 支持 `preview` / `upload` / `review` / `doctor` 子命令
- **合规诚实**：明确告知"提交审核 / 发布最后一步必须手动点"——微信没开放自动提审 / 自动发布接口
- **数据严谨**：涉及审核时长、类目资质等具体数字均要求 ≥2 独立来源交叉验证再写入交付物

## 安装（作为 AI 工具的 skill）

本 skill 遵循通用 SKILL 规范（`SKILL.md` + `meta.json` + 资源目录），可装入任何支持 skill 的 AI 工具（WorkBuddy、Claude Code、Cursor 等）。

1. 克隆仓库：

   ```bash
   git clone https://github.com/JackieZheng/xueren-wx-miniprogram-guide.git
   ```

2. 把目录放进你的 AI 工具 skills 目录（以 WorkBuddy 为例）：

   ```bash
   # Windows
   xcopy /E /I xueren-wx-miniprogram-guide %USERPROFILE%\.workbuddy\skills\xueren-wx-miniprogram-guide
   # macOS / Linux
   cp -r xueren-wx-miniprogram-guide ~/.workbuddy/skills/
   ```

3. 发布脚本依赖 `miniprogram-ci`：

   ```bash
   cd xueren-wx-miniprogram-guide
   npm install miniprogram-ci
   ```

## 使用方式

装好后**使用就是普通的对话形式**——在 AI 工具里说一句"帮我从零做一个微信小程序"，它会按 6 阶段引导你走完：

| 阶段 | 做什么 | 验收 |
|------|--------|------|
| 0 需求澄清 | 问名字 / 用途 / 个人号还是企业号 | 3 个问题已答 |
| 1 注册拿 AppID | 引导访问 mp.weixin.qq.com 注册 | 拿到 `wx` 开头 18 位 AppID |
| 2 生成骨架 | 建 app.js/json/wxss、pages、scripts/publish.js | 项目目录就绪 |
| 3 预览二维码 | `node scripts/publish.js preview` | 手机扫码看到首页 |
| 4 接云后端 | 建表 + RLS + 前端读写 | 真机看到云端数据 |
| 5 上传 + 提审 | `node scripts/publish.js upload` → 后台手动提审 | 后台"审核中" |
| 6 发布上线 | 审核通过后**手动点发布** | 微信可搜到 |

> 详细向导说明见 `SKILL.md`；阶段 2-6 常见坑见 `references/pitfalls.md`；提审 checklist 见 `references/publish_checklist.md`。

## 项目结构

```
xueren-wx-miniprogram-guide/
├── SKILL.md                      # skill 定义（frontmatter + 6 阶段向导）
├── meta.json                     # skill 元数据
├── .gitignore
├── assets/
│   └── publish.js                # 一键 preview/upload/review/doctor 脚本模板
├── references/
│   ├── pitfalls.md               # 阶段 2-6 常见坑速查
│   └── publish_checklist.md      # 提审前 checklist 模板
└── LICENSE
```

## 注意事项（务必读）

- **AppID / 上传密钥 / AppSecret 绝不进版本库**：放用户项目 `.env`，`.gitignore` 已排除。
- **审核通过 ≠ 上线**：微信不会自动发布，必须手动点「发布」按钮（阶段 6）。
- **不自动提审 / 不自动发布**：微信没开放这两个接口，任何声称能自动化的第三方工具都要警惕，可能违反微信开发者协议导致封号。
- **术语严格**：全程用「开发版本 / 审核版本 / 线上版本」，不用「体验版 / 提审」口语。
- **真机为准**：模拟器正常但真机异常（或反之），以真机扫码结果为准。

## 版本

- **v1.0.4**（2026-09-28）：脱敏本地路径、补充开源发布元数据（GitHub 链接）
- **v1.0.3**（2026-09-27）：6 阶段向导初版发布

## License

[MIT](./LICENSE) © 2026 雪人 (XueRen)

---

GitHub: https://github.com/JackieZheng/xueren-wx-miniprogram-guide
