# 时光展柜 Memory Cabinet v0.2C1

**版本**: 0.2.0-alpha.3

## 项目说明

本项目是"时光展柜"口述历史记忆卡片系统的恢复重建版本。

- **MemoryItem 数据层和视图层**：均为契约驱动的人工重新实现，基于测试契约和数据结构规范从零构建
- **不是原仓库的精确恢复**：原源码和完整 Git 历史未找到，本仓库为重建产物
- **当前没有 AI 能力**：所有卡片创建、编辑均为纯人工操作
- **Exhibition 尚未实现**：展柜展示功能计划在后续版本实现

## 功能

### 六种记忆卡片类型
1. event - 事件
2. person - 人物
3. place - 地点
4. object - 物品
5. 	ime - 时间
6. concept - 概念

### 原文证据链
- 每张卡片都关联到访谈原文的字符范围（sourceStart / sourceEnd）
- 创建时自动从 IndexedDB 重新截取原文
- 支持查看原文上下文和来源访谈链接

### 版本兼容
- **schemaVersion 1**：兼容导入（仅项目和访谈）
- **schemaVersion 2**：兼容导入（项目+访谈+会话状态）
- **schemaVersion 3**：完整支持（项目+访谈+记忆卡片），导入时所有 ID 重新生成，引用正确重写

## 技术栈
- Vue 3 + TypeScript + Vite
- IndexedDB (Dexie.js)
- Vitest（单元测试）
- Playwright（E2E 测试）

## 开发命令
`ash
npm install
npm run typecheck   # TypeScript 类型检查
npm run test        # 单元测试 (Vitest)
npm run build       # 生产构建
npm run test:e2e    # E2E 测试 (Playwright)
npm run dev         # 开发服务器
`
