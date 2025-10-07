# 📡 API端点索引

> **总计**: 52 个API端点
> **最后更新**: 2025/10/7

## 📊 统计

| 分类 | 数量 |
|------|------|
| /config | 2 |
| /config/reset | 1 |
| /emergency/stop | 1 |
| /emergency/strict | 1 |
| /config/history | 1 |
| /status | 3 |
| /config/test | 1 |
| /monitoring | 1 |
| /undefined | 6 |
| /user-profile | 1 |
| /database | 1 |
| /:id | 4 |
| /pending-reviews | 1 |
| /submit-review | 1 |
| /stats | 1 |
| /dashboard | 1 |
| /featured | 1 |
| /test-tags/:storyId | 1 |
| /available-tags | 1 |
| /:id/like | 1 |
| /:id/dislike | 1 |
| /:id/png | 1 |
| /user/:userId | 1 |
| /debug/status | 1 |
| /debug/raw-data | 1 |
| /debug/init | 1 |
| /health | 1 |
| /health/database | 1 |
| /health/consistency | 1 |
| /health/migrations | 1 |
| /health/detailed | 1 |
| /ping | 1 |
| /env | 1 |
| /connectivity | 1 |
| /summary | 1 |
| /dimension/:dimensionId | 1 |
| /question/:questionId | 1 |
| /cross-analysis | 1 |
| /employment-report | 1 |
| /real-time-stats | 1 |
| /data-quality | 1 |

---

## /config

| 方法 | 路径 | 描述 | 文件 |
|------|------|------|------|
| `GET   ` | `/config` | / | routes/admin/securityConfig.ts |
| `PUT   ` | `/config` | / | routes/admin/securityConfig.ts |

## /config/reset

| 方法 | 路径 | 描述 | 文件 |
|------|------|------|------|
| `POST  ` | `/config/reset` | / | routes/admin/securityConfig.ts |

## /emergency/stop

| 方法 | 路径 | 描述 | 文件 |
|------|------|------|------|
| `POST  ` | `/emergency/stop` | / | routes/admin/securityConfig.ts |

## /emergency/strict

| 方法 | 路径 | 描述 | 文件 |
|------|------|------|------|
| `POST  ` | `/emergency/strict` | / | routes/admin/securityConfig.ts |

## /config/history

| 方法 | 路径 | 描述 | 文件 |
|------|------|------|------|
| `GET   ` | `/config/history` | / | routes/admin/securityConfig.ts |

## /status

| 方法 | 路径 | 描述 | 文件 |
|------|------|------|------|
| `GET   ` | `/status` | / | routes/admin/securityConfig.ts |
| `GET   ` | `/status` | 管理员状态检查 | routes/admin.ts |
| `GET   ` | `/status` | / | routes/test/turnstile.ts |

## /config/test

| 方法 | 路径 | 描述 | 文件 |
|------|------|------|------|
| `POST  ` | `/config/test` | / | routes/admin/securityConfig.ts |

## /monitoring

| 方法 | 路径 | 描述 | 文件 |
|------|------|------|------|
| `GET   ` | `/monitoring` | / | routes/admin/securityConfig.ts |

## /undefined

| 方法 | 路径 | 描述 | 文件 |
|------|------|------|------|
| `GET   ` | `/` | 基础管理员信息端点 | routes/admin.ts |
| `POST  ` | `/` | 提交问卷 (公开接口，不需要认证) | routes/questionnaire.ts |
| `GET   ` | `/` | 获取问卷列表 (需要认证) | routes/questionnaire.ts |
| `GET   ` | `/` | 获取故事列表 | routes/stories.ts |
| `POST  ` | `/` | 创建故事 - 使用三层审核流程 | routes/stories.ts |
| `POST  ` | `/` | / | routes/test/turnstile.ts |

## /user-profile

| 方法 | 路径 | 描述 | 文件 |
|------|------|------|------|
| `ALL   ` | `/user-profile` | 注册子路由 | routes/admin.ts |

## /database

| 方法 | 路径 | 描述 | 文件 |
|------|------|------|------|
| `ALL   ` | `/database` | 注册子路由 | routes/admin.ts |

## /:id

| 方法 | 路径 | 描述 | 文件 |
|------|------|------|------|
| `GET   ` | `/:id` | 获取单个问卷详情 (需要认证) | routes/questionnaire.ts |
| `PUT   ` | `/:id` | 更新问卷状态 (需要审核员权限) | routes/questionnaire.ts |
| `GET   ` | `/:id` | 获取单个故事详情 | routes/stories.ts |
| `DELETE` | `/:id` | 删除故事 | routes/stories.ts |

## /pending-reviews

| 方法 | 路径 | 描述 | 文件 |
|------|------|------|------|
| `GET   ` | `/pending-reviews` | 获取待审核列表 | routes/reviewer.ts |

## /submit-review

| 方法 | 路径 | 描述 | 文件 |
|------|------|------|------|
| `POST  ` | `/submit-review` | 提交审核结果 | routes/reviewer.ts |

## /stats

| 方法 | 路径 | 描述 | 文件 |
|------|------|------|------|
| `GET   ` | `/stats` | 获取审核统计 | routes/reviewer.ts |

## /dashboard

| 方法 | 路径 | 描述 | 文件 |
|------|------|------|------|
| `GET   ` | `/dashboard` | 获取审核员仪表板数据 | routes/reviewer.ts |

## /featured

| 方法 | 路径 | 描述 | 文件 |
|------|------|------|------|
| `GET   ` | `/featured` | 获取精选故事 - 必须在 /:id 之前定义 | routes/stories.ts |

## /test-tags/:storyId

| 方法 | 路径 | 描述 | 文件 |
|------|------|------|------|
| `GET   ` | `/test-tags/:storyId` | 测试标签关联查询 | routes/stories.ts |

## /available-tags

| 方法 | 路径 | 描述 | 文件 |
|------|------|------|------|
| `GET   ` | `/available-tags` | 获取所有可用标签 | routes/stories.ts |

## /:id/like

| 方法 | 路径 | 描述 | 文件 |
|------|------|------|------|
| `POST  ` | `/:id/like` | 点赞故事 | routes/stories.ts |

## /:id/dislike

| 方法 | 路径 | 描述 | 文件 |
|------|------|------|------|
| `POST  ` | `/:id/dislike` | 踩故事 | routes/stories.ts |

## /:id/png

| 方法 | 路径 | 描述 | 文件 |
|------|------|------|------|
| `GET   ` | `/:id/png/:theme?` | 获取故事PNG卡片下载链接（暂时禁用权限验证） | routes/stories.ts |

## /user/:userId

| 方法 | 路径 | 描述 | 文件 |
|------|------|------|------|
| `GET   ` | `/user/:userId` | 获取用户故事列表 | routes/stories.ts |

## /debug/status

| 方法 | 路径 | 描述 | 文件 |
|------|------|------|------|
| `GET   ` | `/debug/status` | 数据库状态检查API | routes/stories.ts |

## /debug/raw-data

| 方法 | 路径 | 描述 | 文件 |
|------|------|------|------|
| `GET   ` | `/debug/raw-data` | 调试：查看原始数据 | routes/stories.ts |

## /debug/init

| 方法 | 路径 | 描述 | 文件 |
|------|------|------|------|
| `POST  ` | `/debug/init` | 强制初始化数据库 | routes/stories.ts |

## /health

| 方法 | 路径 | 描述 | 文件 |
|------|------|------|------|
| `GET   ` | `/health` | 基础健康检查 | routes/system-health-simple.ts |

## /health/database

| 方法 | 路径 | 描述 | 文件 |
|------|------|------|------|
| `GET   ` | `/health/database` | 数据库健康检查 | routes/system-health-simple.ts |

## /health/consistency

| 方法 | 路径 | 描述 | 文件 |
|------|------|------|------|
| `GET   ` | `/health/consistency` | 数据一致性检查 | routes/system-health-simple.ts |

## /health/migrations

| 方法 | 路径 | 描述 | 文件 |
|------|------|------|------|
| `GET   ` | `/health/migrations` | 迁移状态检查 | routes/system-health-simple.ts |

## /health/detailed

| 方法 | 路径 | 描述 | 文件 |
|------|------|------|------|
| `GET   ` | `/health/detailed` | 综合健康检查 | routes/system-health-simple.ts |

## /ping

| 方法 | 路径 | 描述 | 文件 |
|------|------|------|------|
| `GET   ` | `/ping` | / | routes/test/simple.ts |

## /env

| 方法 | 路径 | 描述 | 文件 |
|------|------|------|------|
| `GET   ` | `/env` | / | routes/test/simple.ts |

## /connectivity

| 方法 | 路径 | 描述 | 文件 |
|------|------|------|------|
| `GET   ` | `/connectivity` | / | routes/test/turnstile.ts |

## /summary

| 方法 | 路径 | 描述 | 文件 |
|------|------|------|------|
| `GET   ` | `/summary` | / | routes/visualization.ts |

## /dimension/:dimensionId

| 方法 | 路径 | 描述 | 文件 |
|------|------|------|------|
| `GET   ` | `/dimension/:dimensionId` | / | routes/visualization.ts |

## /question/:questionId

| 方法 | 路径 | 描述 | 文件 |
|------|------|------|------|
| `GET   ` | `/question/:questionId` | / | routes/visualization.ts |

## /cross-analysis

| 方法 | 路径 | 描述 | 文件 |
|------|------|------|------|
| `GET   ` | `/cross-analysis` | / | routes/visualization.ts |

## /employment-report

| 方法 | 路径 | 描述 | 文件 |
|------|------|------|------|
| `GET   ` | `/employment-report` | / | routes/visualization.ts |

## /real-time-stats

| 方法 | 路径 | 描述 | 文件 |
|------|------|------|------|
| `GET   ` | `/real-time-stats` | / | routes/visualization.ts |

## /data-quality

| 方法 | 路径 | 描述 | 文件 |
|------|------|------|------|
| `GET   ` | `/data-quality` | / | routes/visualization.ts |

