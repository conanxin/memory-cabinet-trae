# 数据 Schema v1

## 数据库

- 名称：`memory-cabinet-v02`
- 版本：1
- 表：`projects`、`narrators`、`consents`

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

## Project

| 字段 | 类型 | 说明 |
|---|---|---|
| id | string (UUID) | 主键 |
| title | string | 项目名称 |
| description | string | 项目说明 |
| narratorId | string | 主要讲述者 ID |
| schemaVersion | number | 数据版本号（当前为 1） |
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

## 导出格式

```json
{
  "format": "memory-cabinet-project",
  "schemaVersion": 1,
  "appVersion": "0.2.0-alpha.1",
  "exportedAt": "ISO-8601",
  "project": {},
  "narrator": {},
  "consent": {}
}
```

## 约束

- 一个项目只能有一位主要讲述者（narrators.projectId 唯一索引）
- 一个项目只能有一份当前同意记录（consents.projectId 唯一索引）
- 所有 ID 使用 `crypto.randomUUID()` 生成
- 导入时生成全新 ID，不覆盖已有项目
- 同名项目导入时自动添加"（导入副本）"后缀
