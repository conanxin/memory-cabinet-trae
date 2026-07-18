# 数据 Schema v2

## 数据库

- 名称：`memory-cabinet-v02`
- 版本：2
- 表：`projects`、`narrators`、`consents`、`interviews`

## 索引

| 表 | 索引 | 类型 |
|---|---|---|
| projects | id | 主键 |
| projects | title | 普通索引 |
| projects | updatedAt | 普通索引 |
| narrators | id | 主键 |
| narrators | projectId | 唯一索引 |
| consents | id | 主键 |
| consents | projectId | 唯一索引 |
| interviews | id | 主键 |
| interviews | projectId | 普通索引 |
| interviews | interviewDate | 普通索引 |
| interviews | updatedAt | 普通索引 |

## Project

| 字段 | 类型 | 说明 |
|---|---|---|
| id | string (UUID) | 主键 |
| title | string | 项目名称 |
| description | string | 项目说明 |
| narratorId | string | 主要讲述者 ID |
| schemaVersion | number | 数据版本号（当前为 2） |
| createdAt | string (ISO-8601) | 创建时间 |
| updatedAt | string (ISO-8601) | 更新时间 |

## Narrator

| 字段 | 类型 | 说明 |
|---|---|---|
| id | string (UUID) | 主键 |
| projectId | string | 所属项目 ID（唯一） |
| name | string | 姓名 |
| relationshipToInterviewer | string | 与采访者关系 |
| birthYear | number \| null | 出生年份 |
| notes | string | 备注 |
| createdAt | string (ISO-8601) | 创建时间 |
| updatedAt | string (ISO-8601) | 更新时间 |

## Consent

| 字段 | 类型 | 说明 |
|---|---|---|
| id | string (UUID) | 主键 |
| projectId | string | 所属项目 ID（唯一） |
| consentToRecord | boolean | 同意被记录 |
| consentToStoreQuotes | boolean | 同意保存原话 |
| consentToStorePhotos | boolean | 同意保存照片 |
| consentToFamilyView | boolean | 允许家庭查看 |
| consentToPublicDisplay | boolean | 允许公开展示 |
| confirmedAt | string (ISO-8601) | 确认时间 |
| confirmationMethod | string | 确认方式 |
| notes | string | 备注 |
| createdAt | string (ISO-8601) | 创建时间 |
| updatedAt | string (ISO-8601) | 更新时间 |

## InterviewSession

| 字段 | 类型 | 说明 |
|---|---|---|
| id | string (UUID) | 主键 |
| projectId | string | 所属项目 ID |
| title | string | 访谈标题 |
| interviewDate | string (ISO-8601) | 访谈日期 |
| interviewer | string | 采访者姓名 |
| location | string | 访谈地点 |
| rawTranscript | string | 原始口述文字 |
| notes | string | 备注 |
| createdAt | string (ISO-8601) | 创建时间 |
| updatedAt | string (ISO-8601) | 更新时间 |

## 导出格式

```json
{
  "format": "memory-cabinet-project",
  "schemaVersion": 2,
  "appVersion": "0.2.0-alpha.2",
  "exportedAt": "ISO-8601",
  "project": {},
  "narrator": {},
  "consent": {},
  "interviews": []
}
```

## v1 到 v2 迁移说明

- 保留已有 Project、Narrator 和 Consent 数据，不删除旧数据
- 已有项目升级后访谈列表为空
- IndexedDB 版本从 1 升级到 2 时自动创建 `interviews` 表
- 已有 v1 项目的 `schemaVersion` 字段在导出时更新为 2

## JSON v1 与 v2 兼容策略

- schemaVersion 1 没有 `interviews` 字段，导入后 `interviews` 默认为空数组
- schemaVersion 2 包含 `interviews` 数组
- 导入时根据 `schemaVersion` 字段决定是否填充 `interviews`
- 导入 v1 备份后项目的 `schemaVersion` 更新为 2

## 删除级联规则

- 删除 Project 时在同一个 transaction 中删除：
  1. Narrator（narrators.projectId === project.id）
  2. Consent（consents.projectId === project.id）
  3. 该项目下全部 InterviewSession（interviews.projectId === project.id）

## 约束

- 一个项目只能有一位主要讲述者（narrators.projectId 唯一索引）
- 一个项目只能有一份当前同意记录（consents.projectId 唯一索引）
- 一个项目可以有多个访谈会话（interviews.projectId 普通索引）
- 所有 ID 使用 `crypto.randomUUID()` 生成
- 导入时生成全新 ID，不覆盖已有项目
- 同名项目导入时自动添加"（导入副本）"后缀
