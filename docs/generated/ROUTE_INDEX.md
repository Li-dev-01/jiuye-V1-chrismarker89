# 🗺️ 前端路由索引

> **总计**: 40 个路由
> **最后更新**: 2025/10/7

## /

| 路径 | 组件 |
|------|------|
| `/` | Navigate to="/questionnaire/survey" replace / |

## /analytics

| 路径 | 组件 |
|------|------|
| `/analytics` | Navigate to="/analytics/v2" replace / |
| `/analytics/visualization` | Navigate to="/analytics/v1" replace / |
| `/analytics/nav` | Navigate to="/analytics/v2" replace / |

## /my

| 路径 | 组件 |
|------|------|
| `/my/content` | PublicRouteGuard |
| `/my/questionnaires` | PublicRouteGuard |
| `/my/content/edit` | PublicRouteGuard |

## /my-content

| 路径 | 组件 |
|------|------|
| `/my-content` | PublicRouteGuard |

## /test

| 路径 | 组件 |
|------|------|
| `/test/state` | PublicRouteGuard |
| `/test` | PublicRouteGuard |
| `/test/google-oauth` | PublicRouteGuard |
| `/test/permissions` | PublicRouteGuard |
| `/test/floating-components` | PublicRouteGuard |
| `/test/violation-content` | PublicRouteGuard |
| `/test/login-separation` | PublicRouteGuard |

## /auth

| 路径 | 组件 |
|------|------|
| `/auth/google/callback` | PublicRouteGuard |
| `/auth/google/callback/questionnaire` | PublicRouteGuard |

## /user

| 路径 | 组件 |
|------|------|
| `/user/profile` | UserRouteGuard |
| `/user/settings` | PublicRouteGuard |
| `/user/login-history` | UserRouteGuard |
| `/user/two-factor` | UserRouteGuard |

## /questionnaire-v2

| 路径 | 组件 |
|------|------|
| `/questionnaire-v2` | Navigate to="/questionnaire" replace / |
| `/questionnaire-v2/survey` | Navigate to="/questionnaire/survey" replace / |
| `/questionnaire-v2/complete` | Navigate to="/questionnaire/complete" replace / |
| `/questionnaire-v2/analytics` | Navigate to="/analytics/v2" replace / |

## /questionnaire-v1

| 路径 | 组件 |
|------|------|
| `/questionnaire-v1` | Navigate to="/questionnaire/survey" replace / |

## /questionnaire2

| 路径 | 组件 |
|------|------|
| `/questionnaire2` | Navigate to="/questionnaire" replace / |

## /debug

| 路径 | 组件 |
|------|------|
| `/debug/google-oauth` | PublicRouteGuard |
| `/debug/oauth-url` | PublicRouteGuard |
| `/debug/auth` | PublicRouteGuard |
| `/debug/permissions` | PublicRouteGuard |
| `/debug/auth-systems` | PublicRouteGuard |
| `/debug/simple-admin` | NewAdminRouteGuard |
| `/debug/admin-data` | PublicRouteGuard |
| `/debug/management-auth` | ManagementAuthDebugPage / |
| `/debug/user-content-test` | UserContentTestPage / |
| `/debug/user-content-simple` | SimpleUserContentTest / |
| `/debug/user-content-direct` | UserContentManagementPage / |

## /demo

| 路径 | 组件 |
|------|------|
| `/demo/ai` | AIDemoPage / |

## /dev

| 路径 | 组件 |
|------|------|
| `/dev/admin-routes-test` | PublicRouteGuard |

