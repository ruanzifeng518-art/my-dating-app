# 心动配对最终交付清单

## 项目概况

- 项目名称：`心动配对前端原型`
- 类型：`Vite + React + Supabase` 恋爱社交产品原型
- 当前状态：主链路已完成，可直接演示
- 当前仓库提交：`bc2990d`

## 已完成能力

- 邮箱注册与登录
- 首次资料完善
- `profiles` 资料写库
- 推荐卡片浏览
- 喜欢 / 无感写库
- 双向喜欢生成 `matches`
- 会话列表展示
- 即时聊天
- 资料编辑
- GitHub Pages 上线

## 在线地址

- 网站地址：`https://ruanzifeng518-art.github.io/my-dating-app/`
- 部署方式：`GitHub Pages`
- 工作流文件：`.github/workflows/deploy-pages.yml`

## 演示账号

- 男号：`qa20260611app+001@example.com` / `Test123456`
- 女号：`qa20260611app+002@example.com` / `Test123456`

当前已验证：

- 两个账号都能登录
- 已建立匹配关系
- 会话列表可以看到对方
- 女号发消息后，男号重新登录可看到最新消息

## 核心文档

- `README.md`
  项目总览、技术栈、展示图、部署说明、演示入口
- `DEMO_GUIDE.md`
  演示顺序、测试账号、讲解路径、排查说明
- `PITCH_2MIN.md`
  2 分钟简版项目讲稿
- `PITCH_5MIN.md`
  5 分钟完整版项目讲稿
- `PROJECT_CHEATSHEET.md`
  临场答辩前速看卖点卡

## 展示资源

- `public/showcase/login-showcase.svg`
- `public/showcase/match-showcase.svg`
- `public/showcase/chat-showcase.svg`
- `public/hero-preview.png`

## 数据库脚本

- `supabase_schema.sql`
- `supabase_schema_fixed.sql`
- `supabase_schema_run.sql`
- `supabase_auth_policies.sql`
- `supabase_likes_matches_flow.sql`
- `supabase_messages_realtime.sql`

推荐执行顺序：

1. `supabase_schema_run.sql` 或 `supabase_schema_fixed.sql`
2. `supabase_auth_policies.sql`
3. `supabase_likes_matches_flow.sql`
4. `supabase_messages_realtime.sql`

## 关键页面

- `src/components/Login.jsx`
- `src/components/OnboardingFlow.jsx`
- `src/components/MatchCardPage.jsx`
- `src/components/MatchesDrawer.jsx`
- `src/components/ChatRoom.jsx`
- `src/components/ProfileEditorModal.jsx`

## 当前适合怎么交付

你现在可以把这套项目用于：

- 课程作业提交
- 项目答辩展示
- 面试作品展示
- GitHub 仓库展示

## 如果要发给别人

最推荐一起发这几样：

1. 仓库地址
2. 在线地址
3. `README.md`
4. `DEMO_GUIDE.md`
5. `PITCH_2MIN.md` 或 `PITCH_5MIN.md`

## 最后确认

- 代码已推送到远端
- 线上版本已可访问
- 演示账号已准备
- 讲稿已准备
- 展示图已准备
- 文档入口已整理
