# Vercel 部署 AI 红娘指南

这份文档只解决一件事：把 `AI 红娘破冰` 安全地部署起来，并确保 `DeepSeek API Key` 不会暴露到前端。

## 先说结论

当前项目原本已经可以部署到 `GitHub Pages`，但 `AI 红娘` 这类要用到服务端密钥的功能，不适合继续只放在纯静态托管上。

推荐做法是：

1. 前端和服务端一起部署到 `Vercel`
2. 把 `DeepSeek API Key` 配在 `Vercel` 的环境变量里
3. 前端通过 `/api/ai-matchmaker` 调用服务端函数

这样浏览器里永远看不到真实密钥。

## 仓库里已经准备好的文件

这次功能改动已经补好以下内容：

- `src/components/ChatRoom.jsx`
  聊天页里的 `AI 红娘` 按钮、回填输入框和粉色气泡动画
- `api/ai-matchmaker.js`
  服务端代理，请求 `DeepSeek deepseek-chat`
- `.env.example`
  `DEEPSEEK_API_KEY` 示例
- `vercel.json`
  `Vite` 项目的 `Vercel` 构建配置

## 第一步：导入仓库到 Vercel

1. 打开 [Vercel](https://vercel.com/)
2. 用 GitHub 账号登录
3. 点击 `Add New...`
4. 选择 `Project`
5. 选择你的仓库 `ruanzifeng518-art/my-dating-app`
6. 点击 `Import`

如果页面识别到了 `Vite`，保持默认即可。仓库里也已经有 `vercel.json`，所以构建参数不用你手动重写。

## 第二步：配置环境变量

进入：

`Project -> Settings -> Environment Variables`

新增下面这一条：

- Name: `DEEPSEEK_API_KEY`
- Value: 你的 `DeepSeek API Key`

建议勾选环境：

- `Production`
- `Preview`
- 如果你也想在 `vercel dev` 里本地联调，就再勾 `Development`

这里最重要的是两点：

1. 变量名必须是 `DEEPSEEK_API_KEY`
2. 不要写成 `VITE_DEEPSEEK_API_KEY`

因为 `VITE_` 开头会被前端拿到，这样就不安全了。

## 第三步：确认构建配置

当前仓库里的 `vercel.json` 已经是：

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

一般情况下你不需要再改。

## 第四步：重新部署

环境变量配置完成后：

1. 回到 `Deployments`
2. 找到最新一次部署
3. 点击 `Redeploy`

或者你也可以重新推一条提交到 GitHub，`Vercel` 会自动重新构建。

## 第五步：部署完成后怎么验证

部署成功以后，按这个顺序验证：

1. 打开你的 `Vercel` 域名
2. 登录测试账号
3. 进入任意聊天页
4. 点击输入框旁边的 `AI 红娘`
5. 等待返回话术
6. 确认返回结果自动填入输入框
7. 确认出现粉色气泡升起动画

如果这一步通了，说明：

- 前端按钮逻辑正常
- 服务端函数可访问
- `DeepSeek API Key` 已生效
- 模型返回内容能正常回填

## 本地怎么联调

如果你只运行：

```bash
npm run dev
```

这只会启动前端，不会启动 `Vercel` 的 `api/` 服务端函数。

如果你要本地完整调试 `AI 红娘`，推荐这样做：

```bash
npm install -g vercel
vercel link
vercel env pull .env.local
vercel dev
```

这样本地会同时运行：

- 前端页面
- `api/ai-matchmaker.js`

## 常见问题

### 点了 AI 红娘没反应

先看浏览器控制台和网络请求里有没有调用：

`/api/ai-matchmaker`

如果根本没有打出去，优先检查前端按钮逻辑。

### 返回 500

优先检查：

1. `Vercel` 是否已经配置 `DEEPSEEK_API_KEY`
2. 配完后有没有重新部署
3. `DeepSeek API Key` 是否本身有效

### 返回 404

通常说明：

- 当前访问的不是 `Vercel` 部署版本
- 或者 `api/ai-matchmaker.js` 没被一起部署上去

如果你打开的还是 `GitHub Pages` 域名，那么它不会提供这个服务端接口。

### GitHub Pages 为什么不适合直接做这个功能

因为 `GitHub Pages` 是纯静态托管，只能放前端文件，不能安全保存服务端密钥。

而 `DeepSeek API Key` 一旦直接写进前端，任何人都能在浏览器里看到，所以这是不安全的。

## 推荐的最终使用方式

如果你想要最省事，推荐直接把整套项目迁到 `Vercel` 作为主站。

如果你想两边都保留，也可以这样分工：

- `GitHub Pages`
  继续作为纯静态展示版本
- `Vercel`
  作为带 `AI 红娘` 的完整交互版本

## 你现在只要做的事

1. 把仓库导入 `Vercel`
2. 添加 `DEEPSEEK_API_KEY`
3. 重新部署
4. 打开聊天页点击 `AI 红娘`
