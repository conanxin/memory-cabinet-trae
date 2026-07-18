# 时光展柜 v0.2A

家庭口述史记录工具，本地优先。

## 重要说明

- **本地优先**：所有数据保存在浏览器本地 IndexedDB 中，不会上传到任何服务器。
- **当前没有 AI**：本版本不包含任何 AI 功能。
- **当前没有账号**：本版本不需要登录，没有账号系统。
- **当前没有云同步**：数据仅在当前浏览器中可用，不会同步到其他设备。
- **数据可能丢失**：清理浏览器数据可能导致项目丢失。
- **请定期导出备份**：使用导出功能将项目保存为 JSON 文件。
- **独立项目**：本仓库与比赛稳定版 `memory-cabinet-trae` 是两个完全独立的项目。

## 功能

- 创建口述史项目，记录主要讲述者信息
- 细粒度同意状态管理（5 项同意）
- IndexedDB 本地持久化，页面刷新后恢复
- JSON 导出/导入（信封结构，导入为新项目）
- 删除本地项目

## 技术栈

- Vue 3 + TypeScript + Vite
- Vue Router 4
- Dexie.js（IndexedDB）
- Vitest（单元测试）
- Playwright（E2E 测试）

## 开发

```bash
npm install
npm run dev        # 启动开发服务器
npm run typecheck  # TypeScript 类型检查
npm run test       # 运行单元测试
npm run test:e2e   # 运行 E2E 测试
npm run build      # 构建
```

## 与比赛稳定版的关系

本仓库（v0.2A）是全新的产品化代码项目，不依赖、不修改、不迁移比赛稳定版。

比赛稳定版地址：`D:\Project\memory-cabinet-trae`
