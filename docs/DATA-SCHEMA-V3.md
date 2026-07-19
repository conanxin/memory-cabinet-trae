# Data Schema V3 (schemaVersion: 3)

## MemoryItem

`	ypescript
interface MemoryItem {
  id: string                          // UUID v4
  projectId: string                   // 关联项目
  interviewSessionId: string | null   // 关联访谈
  sourceId: string | null             // 来源ID
  type: MemoryItemType                // 六种类型之一
  title: string                        // 卡片标题
  originalText: string                 // 原文截取
  editedText: string                   // 编辑后文本（默认=originalText）
  sourceStart: number | null           // 原文起始位置
  sourceEnd: number | null             // 原文结束位置
  sourceType: SourceType               // 来源类型
  certainty: Certainty                  // 可信度
  visibility: Visibility                // 可见性
  reviewStatus: ReviewStatus            // 审核状态
  createdAt: string                     // ISO 时间
  updatedAt: string                     // ISO 时间
}
`

### 枚举值

**MemoryItemType** (6种):
- event - 事件
- person - 人物
- place - 地点
- object - 物品
- 	ime - 时间
- concept - 概念

**SourceType** (5种):
- irst_hand - 一手资料
- second_hand - 二手资料
- document - 文档
- photo - 照片
- other - 其他

**Certainty** (4种):
- confirmed - 已确认
- probable - 很可能
- pproximate - 近似
- uncertain - 不确定

**Visibility** (3种):
- public - 公开
- internal - 内部
- private - 私有

**ReviewStatus** (3种):
- draft - 草稿
- confirmed - 已确认
- excluded - 已排除

## 导出格式 (ExportFormatV3)

`json
{
  "schemaVersion": 3,
  "appVersion": "0.2.0-alpha.3",
  "exportedAt": "...",
  "projects": [...],
  "interviewSessions": [...],
  "memoryItems": [...]
}
`

## 数据库版本
IndexedDB schema version: 3
