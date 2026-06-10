# 心动配对前端原型

这是一个基于 `Vite + React + Supabase` 的恋爱配对产品原型，已经打通了登录注册、资料完善、推荐卡片、双向匹配和即时聊天的完整主链路。

## 当前功能

- 邮箱注册与登录
- 首次登录资料完善
- 将用户资料写入 `profiles`
- 推荐异性卡片并支持喜欢 / 无感
- 双向喜欢后自动创建 `matches`
- 匹配成功弹窗与聊天入口
- 基于 Supabase Realtime 的即时聊天

## 技术栈

- `React 19`
- `Vite 8`
- `Supabase Auth / Database / Realtime`
- `lucide-react`
- `canvas-confetti`

## 本地启动

1. 安装依赖

```bash
npm install
```

2. 配置环境变量

复制 `.env.example` 为 `.env`，并填入你自己的 Supabase 项目配置：

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

3. 启动开发环境

```bash
npm run dev
```

4. 构建生产版本

```bash
npm run build
```

5. 本地预览构建结果

```bash
npm run preview
```

## 数据库脚本

仓库内已经提供了初始化和功能补充所需的 SQL：

- `supabase_schema.sql`：基础表结构与示例数据
- `supabase_schema_fixed.sql`：更稳的可重复执行版本
- `supabase_schema_run.sql`：适合直接粘贴运行的版本
- `supabase_auth_policies.sql`：`profiles` 的自写入权限策略
- `supabase_likes_matches_flow.sql`：`likes / matches` 所需字段与策略
- `supabase_messages_realtime.sql`：`messages` 表与 Realtime 相关配置

## 目录结构

```text
public/
  favicon.svg
  icons.svg

src/
  assets/           静态资源
  components/       页面与业务组件
  data/             示例数据
  App.jsx           应用主入口
  main.jsx          React 挂载入口
  index.css         全局样式
  supabaseClient.js Supabase 客户端
```

## 核心页面

- `src/components/Login.jsx`：登录 / 注册页
- `src/components/OnboardingFlow.jsx`：首次资料完善
- `src/components/MatchCardPage.jsx`：配对卡片页
- `src/components/MatchSuccessModal.jsx`：匹配成功弹窗
- `src/components/ChatRoom.jsx`：即时聊天室

## 当前状态

已完成的主流程：

- 注册并登录
- 完善资料并写入数据库
- 浏览推荐卡片
- 点赞 / 无感写库
- 双向喜欢触发匹配
- 进入聊天室
- 消息实时同步

## 后续可继续扩展

- 会话列表页
- 未读消息状态
- 头像上传
- 用户资料编辑
- 举报 / 拉黑
- 推荐算法优化
