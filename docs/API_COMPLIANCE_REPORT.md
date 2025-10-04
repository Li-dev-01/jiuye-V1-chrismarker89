# API规范性检查报告

生成时间: 10/3/2025, 8:32:11 PM

## 总体评分

**等级: F** (38.1分)

## 各项得分

- **RESTful规范**: 75.8分
- **命名一致性**: 38.7分
- **冗余检查**: 23.6分
- **安全性**: 52.6分

## RESTful规范违规 (370项)

- **/api/admin/dashboard/stats**: 资源名称应使用复数形式: dashboard
  *建议: 将 dashboard 改为复数形式*

- **/api/admin/debug/tables**: 资源名称应使用复数形式: debug
  *建议: 将 debug 改为复数形式*

- **/api/admin/users/:userId/status**: URL段应使用小写: :userId
  *建议: 将 :userId 改为小写*

- **/api/admin/users/:userId**: URL段应使用小写: :userId
  *建议: 将 :userId 改为小写*

- **/api/admin/users/batch**: 资源名称应使用复数形式: batch
  *建议: 将 batch 改为复数形式*

- **/api/admin/users/export**: 资源名称应使用复数形式: export
  *建议: 将 export 改为复数形式*

- **/api/admin/users/manage**: 资源名称应使用复数形式: manage
  *建议: 将 manage 改为复数形式*

- **/api/admin/content/categories**: 资源名称应使用复数形式: content
  *建议: 将 content 改为复数形式*

- **/api/admin/content/categories**: 资源名称应使用复数形式: content
  *建议: 将 content 改为复数形式*

- **/api/admin/content/tags**: 资源名称应使用复数形式: content
  *建议: 将 content 改为复数形式*

- **/api/admin/content/tags**: 资源名称应使用复数形式: content
  *建议: 将 content 改为复数形式*

- **/api/admin/content/tags/:id**: 资源名称应使用复数形式: content
  *建议: 将 content 改为复数形式*

- **/api/admin/content/tags/:id**: 资源名称应使用复数形式: content
  *建议: 将 content 改为复数形式*

- **/api/admin/content/tags/recommend**: 资源名称应使用复数形式: content
  *建议: 将 content 改为复数形式*

- **/api/admin/content/tags/recommend**: 资源名称应使用复数形式: recommend
  *建议: 将 recommend 改为复数形式*

- **/api/admin/content/tags/stats**: 资源名称应使用复数形式: content
  *建议: 将 content 改为复数形式*

- **/api/admin/content/tags/merge**: 资源名称应使用复数形式: content
  *建议: 将 content 改为复数形式*

- **/api/admin/content/tags/merge**: 资源名称应使用复数形式: merge
  *建议: 将 merge 改为复数形式*

- **/api/admin/content/tags/cleanup**: 资源名称应使用复数形式: content
  *建议: 将 content 改为复数形式*

- **/api/admin/content/tags/cleanup**: 资源名称应使用复数形式: cleanup
  *建议: 将 cleanup 改为复数形式*

- **/api/admin/content/:contentType/:contentId/tags**: 资源名称应使用复数形式: content
  *建议: 将 content 改为复数形式*

- **/api/admin/content/:contentType/:contentId/tags**: URL段应使用小写: :contentType
  *建议: 将 :contentType 改为小写*

- **/api/admin/content/:contentType/:contentId/tags**: URL段应使用小写: :contentId
  *建议: 将 :contentId 改为小写*

- **/api/admin/content/:contentType/:contentId/tags**: URL嵌套过深，建议不超过4层
  *建议: 重新设计资源层次结构*

- **/api/admin/content/:contentType/:contentId/tags**: 资源名称应使用复数形式: content
  *建议: 将 content 改为复数形式*

- **/api/admin/content/:contentType/:contentId/tags**: URL段应使用小写: :contentType
  *建议: 将 :contentType 改为小写*

- **/api/admin/content/:contentType/:contentId/tags**: URL段应使用小写: :contentId
  *建议: 将 :contentId 改为小写*

- **/api/admin/content/:contentType/:contentId/tags**: URL嵌套过深，建议不超过4层
  *建议: 重新设计资源层次结构*

- **/api/admin/content/by-tags**: 资源名称应使用复数形式: content
  *建议: 将 content 改为复数形式*

- **/api/admin/content/tags/stats**: 资源名称应使用复数形式: content
  *建议: 将 content 改为复数形式*

- **/api/admin/content/tags/merge**: 资源名称应使用复数形式: content
  *建议: 将 content 改为复数形式*

- **/api/admin/content/tags/merge**: 资源名称应使用复数形式: merge
  *建议: 将 merge 改为复数形式*

- **/api/admin/content/tags/cleanup**: 资源名称应使用复数形式: content
  *建议: 将 content 改为复数形式*

- **/api/admin/content/tags/cleanup**: 资源名称应使用复数形式: cleanup
  *建议: 将 cleanup 改为复数形式*

- **/api/admin/content/tags/recommend**: 资源名称应使用复数形式: content
  *建议: 将 content 改为复数形式*

- **/api/admin/content/tags/recommend**: 资源名称应使用复数形式: recommend
  *建议: 将 recommend 改为复数形式*

- **/api/admin/test-data/verify**: 资源名称应使用复数形式: test-data
  *建议: 将 test-data 改为复数形式*

- **/api/admin/test-data/verify**: 资源名称应使用复数形式: verify
  *建议: 将 verify 改为复数形式*

- **/api/admin/database/tables**: 资源名称应使用复数形式: database
  *建议: 将 database 改为复数形式*

- **/api/admin/audit-config**: 资源名称应使用复数形式: audit-config
  *建议: 将 audit-config 改为复数形式*

- **/api/admin/audit-config**: 资源名称应使用复数形式: audit-config
  *建议: 将 audit-config 改为复数形式*

- **/api/admin/audit-test**: 资源名称应使用复数形式: audit-test
  *建议: 将 audit-test 改为复数形式*

- **/api/admin/ip-access-control/rules**: 资源名称应使用复数形式: ip-access-control
  *建议: 将 ip-access-control 改为复数形式*

- **/api/admin/ip-access-control/rules**: 资源名称应使用复数形式: ip-access-control
  *建议: 将 ip-access-control 改为复数形式*

- **/api/admin/ip-access-control/rules/:ruleId**: 资源名称应使用复数形式: ip-access-control
  *建议: 将 ip-access-control 改为复数形式*

- **/api/admin/ip-access-control/rules/:ruleId**: URL段应使用小写: :ruleId
  *建议: 将 :ruleId 改为小写*

- **/api/admin/ip-access-control/rules/:ruleId**: 资源名称应使用复数形式: ip-access-control
  *建议: 将 ip-access-control 改为复数形式*

- **/api/admin/ip-access-control/rules/:ruleId**: URL段应使用小写: :ruleId
  *建议: 将 :ruleId 改为小写*

- **/api/admin/ip-access-control/time-policies**: 资源名称应使用复数形式: ip-access-control
  *建议: 将 ip-access-control 改为复数形式*

- **/api/admin/ip-access-control/stats**: 资源名称应使用复数形式: ip-access-control
  *建议: 将 ip-access-control 改为复数形式*

- **/api/admin/intelligent-security/anomalies**: 资源名称应使用复数形式: intelligent-security
  *建议: 将 intelligent-security 改为复数形式*

- **/api/admin/intelligent-security/threats**: 资源名称应使用复数形式: intelligent-security
  *建议: 将 intelligent-security 改为复数形式*

- **/api/admin/intelligent-security/fingerprints**: 资源名称应使用复数形式: intelligent-security
  *建议: 将 intelligent-security 改为复数形式*

- **/api/admin/intelligent-security/responses**: 资源名称应使用复数形式: intelligent-security
  *建议: 将 intelligent-security 改为复数形式*

- **/api/admin/intelligent-security/stats**: 资源名称应使用复数形式: intelligent-security
  *建议: 将 intelligent-security 改为复数形式*

- **/api/admin/login-monitor/records**: 资源名称应使用复数形式: login-monitor
  *建议: 将 login-monitor 改为复数形式*

- **/api/admin/login-monitor/alerts**: 资源名称应使用复数形式: login-monitor
  *建议: 将 login-monitor 改为复数形式*

- **/api/admin/login-monitor/charts**: 资源名称应使用复数形式: login-monitor
  *建议: 将 login-monitor 改为复数形式*

- **/api/admin/users/download/${Date.now()}.${format}**: 资源名称应使用复数形式: download
  *建议: 将 download 改为复数形式*

- **/api/admin/users/download/${Date.now()}.${format}**: URL段应使用小写: ${Date.now()}.${format}
  *建议: 将 ${Date.now()}.${format} 改为小写*

- **/api/admin/api/questionnaire/submit**: 资源名称应使用复数形式: questionnaire
  *建议: 将 questionnaire 改为复数形式*

- **/api/admin/api/questionnaire/submit**: 资源名称应使用复数形式: submit
  *建议: 将 submit 改为复数形式*

- **/api/admin/api/reviewer/pending-reviews**: 资源名称应使用复数形式: reviewer
  *建议: 将 reviewer 改为复数形式*

- **/api/questionnaire/**: 资源名称应使用复数形式: questionnaire
  *建议: 将 questionnaire 改为复数形式*

- **/api/questionnaire/**: 资源名称应使用复数形式: questionnaire
  *建议: 将 questionnaire 改为复数形式*

- **/api/questionnaire/:id**: 资源名称应使用复数形式: questionnaire
  *建议: 将 questionnaire 改为复数形式*

- **/api/questionnaire/:id**: 资源名称应使用复数形式: questionnaire
  *建议: 将 questionnaire 改为复数形式*

- **/api/reviewer/pending-reviews**: 资源名称应使用复数形式: reviewer
  *建议: 将 reviewer 改为复数形式*

- **/api/reviewer/submit-review**: 资源名称应使用复数形式: reviewer
  *建议: 将 reviewer 改为复数形式*

- **/api/reviewer/submit-review**: 资源名称应使用复数形式: submit-review
  *建议: 将 submit-review 改为复数形式*

- **/api/reviewer/stats**: 资源名称应使用复数形式: reviewer
  *建议: 将 reviewer 改为复数形式*

- **/api/reviewer/dashboard**: 资源名称应使用复数形式: reviewer
  *建议: 将 reviewer 改为复数形式*

- **/api/reviewer/dashboard**: 资源名称应使用复数形式: dashboard
  *建议: 将 dashboard 改为复数形式*

- **/api/simple-auth/login**: 资源名称应使用复数形式: simple-auth
  *建议: 将 simple-auth 改为复数形式*

- **/api/simple-auth/verify**: 资源名称应使用复数形式: simple-auth
  *建议: 将 simple-auth 改为复数形式*

- **/api/simple-auth/verify**: 资源名称应使用复数形式: verify
  *建议: 将 verify 改为复数形式*

- **/api/simple-auth/me**: 资源名称应使用复数形式: simple-auth
  *建议: 将 simple-auth 改为复数形式*

- **/api/simple-auth/me**: 资源名称应使用复数形式: me
  *建议: 将 me 改为复数形式*

- **/api/simple-admin/dashboard**: 资源名称应使用复数形式: simple-admin
  *建议: 将 simple-admin 改为复数形式*

- **/api/simple-admin/dashboard**: 资源名称应使用复数形式: dashboard
  *建议: 将 dashboard 改为复数形式*

- **/api/simple-admin/users**: 资源名称应使用复数形式: simple-admin
  *建议: 将 simple-admin 改为复数形式*

- **/api/simple-admin/analytics**: 资源名称应使用复数形式: simple-admin
  *建议: 将 simple-admin 改为复数形式*

- **/api/simple-admin/api/endpoints**: 资源名称应使用复数形式: simple-admin
  *建议: 将 simple-admin 改为复数形式*

- **/api/simple-reviewer/dashboard**: 资源名称应使用复数形式: simple-reviewer
  *建议: 将 simple-reviewer 改为复数形式*

- **/api/simple-reviewer/dashboard**: 资源名称应使用复数形式: dashboard
  *建议: 将 dashboard 改为复数形式*

- **/api/simple-reviewer/pending-reviews**: 资源名称应使用复数形式: simple-reviewer
  *建议: 将 simple-reviewer 改为复数形式*

- **/api/questionnaire/submit**: 资源名称应使用复数形式: questionnaire
  *建议: 将 questionnaire 改为复数形式*

- **/api/questionnaire/submit**: 资源名称应使用复数形式: submit
  *建议: 将 submit 改为复数形式*

- **/api/admin/dashboard/stats**: 资源名称应使用复数形式: dashboard
  *建议: 将 dashboard 改为复数形式*

- **/api/admin/users/export**: 资源名称应使用复数形式: export
  *建议: 将 export 改为复数形式*

- **/api/reviewer/content**: 资源名称应使用复数形式: reviewer
  *建议: 将 reviewer 改为复数形式*

- **/api/reviewer/content**: 资源名称应使用复数形式: content
  *建议: 将 content 改为复数形式*

- **/api/reviewer/audit/submit**: 资源名称应使用复数形式: reviewer
  *建议: 将 reviewer 改为复数形式*

- **/api/reviewer/audit/submit**: 资源名称应使用复数形式: audit
  *建议: 将 audit 改为复数形式*

- **/api/reviewer/audit/submit**: 资源名称应使用复数形式: submit
  *建议: 将 submit 改为复数形式*

- **/api/questionnaire**: 资源名称应使用复数形式: questionnaire
  *建议: 将 questionnaire 改为复数形式*

- **/api/questionnaire/:id**: 资源名称应使用复数形式: questionnaire
  *建议: 将 questionnaire 改为复数形式*

- **/api/universal-questionnaire/submit**: 资源名称应使用复数形式: universal-questionnaire
  *建议: 将 universal-questionnaire 改为复数形式*

- **/api/universal-questionnaire/submit**: 资源名称应使用复数形式: submit
  *建议: 将 submit 改为复数形式*

- **/api/universal-questionnaire/count**: 资源名称应使用复数形式: universal-questionnaire
  *建议: 将 universal-questionnaire 改为复数形式*

- **/api/universal-questionnaire/count**: 资源名称应使用复数形式: count
  *建议: 将 count 改为复数形式*

- **/api/analytics/distribution**: 资源名称应使用复数形式: distribution
  *建议: 将 distribution 改为复数形式*

- **/api/heart-voices/submit**: 资源名称应使用复数形式: submit
  *建议: 将 submit 改为复数形式*

- **/api/errors/report**: 资源名称应使用复数形式: report
  *建议: 将 report 改为复数形式*

- **/api/stories/featured**: 资源名称应使用复数形式: featured
  *建议: 将 featured 改为复数形式*

- **/api/stories/test-tags/:storyId**: URL段应使用小写: :storyId
  *建议: 将 :storyId 改为小写*

- **/api/stories/:id/like**: 资源名称应使用复数形式: like
  *建议: 将 like 改为复数形式*

- **/api/stories/:id/dislike**: 资源名称应使用复数形式: dislike
  *建议: 将 dislike 改为复数形式*

- **/api/stories/:id/png/:theme?**: 资源名称应使用复数形式: png
  *建议: 将 png 改为复数形式*

- **/api/stories/user/:userId**: 资源名称应使用复数形式: user
  *建议: 将 user 改为复数形式*

- **/api/stories/user/:userId**: URL段应使用小写: :userId
  *建议: 将 :userId 改为小写*

- **/api/stories/debug/status**: 资源名称应使用复数形式: debug
  *建议: 将 debug 改为复数形式*

- **/api/stories/debug/raw-data**: 资源名称应使用复数形式: debug
  *建议: 将 debug 改为复数形式*

- **/api/stories/debug/raw-data**: 资源名称应使用复数形式: raw-data
  *建议: 将 raw-data 改为复数形式*

- **/api/stories/debug/init**: 资源名称应使用复数形式: debug
  *建议: 将 debug 改为复数形式*

- **/api/stories/debug/init**: 资源名称应使用复数形式: init
  *建议: 将 init 改为复数形式*

- **/api/summary**: 资源名称应使用复数形式: summary
  *建议: 将 summary 改为复数形式*

- **/api/dimension/:dimensionId**: 资源名称应使用复数形式: dimension
  *建议: 将 dimension 改为复数形式*

- **/api/dimension/:dimensionId**: URL段应使用小写: :dimensionId
  *建议: 将 :dimensionId 改为小写*

- **/api/question/:questionId**: 资源名称应使用复数形式: question
  *建议: 将 question 改为复数形式*

- **/api/question/:questionId**: URL段应使用小写: :questionId
  *建议: 将 :questionId 改为小写*

- **/api/employment-report**: 资源名称应使用复数形式: employment-report
  *建议: 将 employment-report 改为复数形式*

- **/api/data-quality**: 资源名称应使用复数形式: data-quality
  *建议: 将 data-quality 改为复数形式*

- **/api/api-docs/swagger.json**: 资源名称应使用复数形式: swagger.json
  *建议: 将 swagger.json 改为复数形式*

- **/api/version**: 资源名称应使用复数形式: version
  *建议: 将 version 改为复数形式*

- **/api/v1**: 资源名称应使用复数形式: v1
  *建议: 将 v1 改为复数形式*

- **/api/v2**: 资源名称应使用复数形式: v2
  *建议: 将 v2 改为复数形式*

- **/api/uuid**: 资源名称应使用复数形式: uuid
  *建议: 将 uuid 改为复数形式*

- **/api/questionnaire**: 资源名称应使用复数形式: questionnaire
  *建议: 将 questionnaire 改为复数形式*

- **/api/universal-questionnaire**: 资源名称应使用复数形式: universal-questionnaire
  *建议: 将 universal-questionnaire 改为复数形式*

- **/api/reviewer**: 资源名称应使用复数形式: reviewer
  *建议: 将 reviewer 改为复数形式*

- **/api/tiered-audit**: 资源名称应使用复数形式: tiered-audit
  *建议: 将 tiered-audit 改为复数形式*

- **/api/admin/data-generator**: 资源名称应使用复数形式: data-generator
  *建议: 将 data-generator 改为复数形式*

- **/api/super-admin**: 资源名称应使用复数形式: super-admin
  *建议: 将 super-admin 改为复数形式*

- **/api/questionnaire-auth**: 资源名称应使用复数形式: questionnaire-auth
  *建议: 将 questionnaire-auth 改为复数形式*

- **/api/user-content-management**: 资源名称应使用复数形式: user-content-management
  *建议: 将 user-content-management 改为复数形式*

- **/api/file-management**: 资源名称应使用复数形式: file-management
  *建议: 将 file-management 改为复数形式*

- **/api/auto-png**: 资源名称应使用复数形式: auto-png
  *建议: 将 auto-png 改为复数形式*

- **/api/png-test**: 资源名称应使用复数形式: png-test
  *建议: 将 png-test 改为复数形式*

- **/api/review**: 资源名称应使用复数形式: review
  *建议: 将 review 改为复数形式*

- **/api/database-monitor**: 资源名称应使用复数形式: database-monitor
  *建议: 将 database-monitor 改为复数形式*

- **/api/security**: 资源名称应使用复数形式: security
  *建议: 将 security 改为复数形式*

- **/api/auth/google**: 资源名称应使用复数形式: google
  *建议: 将 google 改为复数形式*

- **/api/admin/google-whitelist**: 资源名称应使用复数形式: google-whitelist
  *建议: 将 google-whitelist 改为复数形式*

- **/api/user/login-history**: 资源名称应使用复数形式: user
  *建议: 将 user 改为复数形式*

- **/api/user/login-history**: 资源名称应使用复数形式: login-history
  *建议: 将 login-history 改为复数形式*

- **/api/admin/ip-access-control**: 资源名称应使用复数形式: ip-access-control
  *建议: 将 ip-access-control 改为复数形式*

- **/api/user/two-factor**: 资源名称应使用复数形式: user
  *建议: 将 user 改为复数形式*

- **/api/user/two-factor**: 资源名称应使用复数形式: two-factor
  *建议: 将 two-factor 改为复数形式*

- **/api/admin/intelligent-security**: 资源名称应使用复数形式: intelligent-security
  *建议: 将 intelligent-security 改为复数形式*

- **/api/***: 资源名称应使用复数形式: *
  *建议: 将 * 改为复数形式*

- **/api/v1**: 资源名称应使用复数形式: v1
  *建议: 将 v1 改为复数形式*

- **/api/v2**: 资源名称应使用复数形式: v2
  *建议: 将 v2 改为复数形式*

- **/api/version**: 资源名称应使用复数形式: version
  *建议: 将 version 改为复数形式*

- **/api/v1/**: 资源名称应使用复数形式: v1
  *建议: 将 v1 改为复数形式*

- **/api/v2/**: 资源名称应使用复数形式: v2
  *建议: 将 v2 改为复数形式*

- **/api/health-test**: 资源名称应使用复数形式: health-test
  *建议: 将 health-test 改为复数形式*

- **/api/api-docs/swagger.json**: 资源名称应使用复数形式: swagger.json
  *建议: 将 swagger.json 改为复数形式*

- **/api/images/auto-generate/stats**: 资源名称应使用复数形式: auto-generate
  *建议: 将 auto-generate 改为复数形式*

- **/api/images/auto-generate/batch-generate**: 资源名称应使用复数形式: auto-generate
  *建议: 将 auto-generate 改为复数形式*

- **/api/images/auto-generate/batch-generate**: 资源名称应使用复数形式: batch-generate
  *建议: 将 batch-generate 改为复数形式*

- **/api/errors/report**: 资源名称应使用复数形式: report
  *建议: 将 report 改为复数形式*

- **/api/admin/database-test**: 资源名称应使用复数形式: database-test
  *建议: 将 database-test 改为复数形式*

- **/api/stats/simple**: 资源名称应使用复数形式: simple
  *建议: 将 simple 改为复数形式*

- **/api/images/auto-generate/stats**: 资源名称应使用复数形式: auto-generate
  *建议: 将 auto-generate 改为复数形式*

- **/api/images/auto-generate/batch-generate**: 资源名称应使用复数形式: auto-generate
  *建议: 将 auto-generate 改为复数形式*

- **/api/images/auto-generate/batch-generate**: 资源名称应使用复数形式: batch-generate
  *建议: 将 batch-generate 改为复数形式*

- **/api/track**: 资源名称应使用复数形式: track
  *建议: 将 track 改为复数形式*

- **/api/uuid**: 资源名称应使用复数形式: uuid
  *建议: 将 uuid 改为复数形式*

- **/api/user-creation**: 资源名称应使用复数形式: user-creation
  *建议: 将 user-creation 改为复数形式*

- **/api/questionnaire**: 资源名称应使用复数形式: questionnaire
  *建议: 将 questionnaire 改为复数形式*

- **/api/universal-questionnaire**: 资源名称应使用复数形式: universal-questionnaire
  *建议: 将 universal-questionnaire 改为复数形式*

- **/api/questionnaire-auth**: 资源名称应使用复数形式: questionnaire-auth
  *建议: 将 questionnaire-auth 改为复数形式*

- **/api/reviewer**: 资源名称应使用复数形式: reviewer
  *建议: 将 reviewer 改为复数形式*

- **/api/tiered-audit**: 资源名称应使用复数形式: tiered-audit
  *建议: 将 tiered-audit 改为复数形式*

- **/api/admin/database**: 资源名称应使用复数形式: database
  *建议: 将 database 改为复数形式*

- **/api/auth/google**: 资源名称应使用复数形式: google
  *建议: 将 google 改为复数形式*

- **/api/admin/google-whitelist**: 资源名称应使用复数形式: google-whitelist
  *建议: 将 google-whitelist 改为复数形式*

- **/api/user/login-history**: 资源名称应使用复数形式: user
  *建议: 将 user 改为复数形式*

- **/api/user/login-history**: 资源名称应使用复数形式: login-history
  *建议: 将 login-history 改为复数形式*

- **/api/admin/ip-access-control**: 资源名称应使用复数形式: ip-access-control
  *建议: 将 ip-access-control 改为复数形式*

- **/api/user/two-factor**: 资源名称应使用复数形式: user
  *建议: 将 user 改为复数形式*

- **/api/user/two-factor**: 资源名称应使用复数形式: two-factor
  *建议: 将 two-factor 改为复数形式*

- **/api/admin/intelligent-security**: 资源名称应使用复数形式: intelligent-security
  *建议: 将 intelligent-security 改为复数形式*

- **/api/admin/login-monitor**: 资源名称应使用复数形式: login-monitor
  *建议: 将 login-monitor 改为复数形式*

- **/api/user-content-management**: 资源名称应使用复数形式: user-content-management
  *建议: 将 user-content-management 改为复数形式*

- **/api/simple-auth**: 资源名称应使用复数形式: simple-auth
  *建议: 将 simple-auth 改为复数形式*

- **/api/simple-reviewer**: 资源名称应使用复数形式: simple-reviewer
  *建议: 将 simple-reviewer 改为复数形式*

- **/api/simple-admin**: 资源名称应使用复数形式: simple-admin
  *建议: 将 simple-admin 改为复数形式*

- **/api/uuid**: 资源名称应使用复数形式: uuid
  *建议: 将 uuid 改为复数形式*

- **/api/questionnaire**: 资源名称应使用复数形式: questionnaire
  *建议: 将 questionnaire 改为复数形式*

- **/api/universal-questionnaire**: 资源名称应使用复数形式: universal-questionnaire
  *建议: 将 universal-questionnaire 改为复数形式*

- **/api/review**: 资源名称应使用复数形式: review
  *建议: 将 review 改为复数形式*

- **/api/analytics/visualization**: 资源名称应使用复数形式: visualization
  *建议: 将 visualization 改为复数形式*

- **/api/reviewer**: 资源名称应使用复数形式: reviewer
  *建议: 将 reviewer 改为复数形式*

- **/api/admin/data-generator**: 资源名称应使用复数形式: data-generator
  *建议: 将 data-generator 改为复数形式*

- **/api/questionnaire-auth**: 资源名称应使用复数形式: questionnaire-auth
  *建议: 将 questionnaire-auth 改为复数形式*

- **/api/admin/database**: 资源名称应使用复数形式: database
  *建议: 将 database 改为复数形式*

- **/api/audit**: 资源名称应使用复数形式: audit
  *建议: 将 audit 改为复数形式*

- **/api/database-fix**: 资源名称应使用复数形式: database-fix
  *建议: 将 database-fix 改为复数形式*

- **/api/png-management**: 资源名称应使用复数形式: png-management
  *建议: 将 png-management 改为复数形式*

- **/api/security**: 资源名称应使用复数形式: security
  *建议: 将 security 改为复数形式*

- **/api/admin/dashboard/stats**: 资源名称应使用复数形式: dashboard
  *建议: 将 dashboard 改为复数形式*

- **/api/admin/questionnaires/<int:questionnaire_id>**: URL段应使用连字符而不是下划线: <int:questionnaire_id>
  *建议: 将 <int:questionnaire_id> 改为使用连字符*

- **/api/admin/audit-config**: 资源名称应使用复数形式: audit-config
  *建议: 将 audit-config 改为复数形式*

- **/api/admin/audit-config**: 资源名称应使用复数形式: audit-config
  *建议: 将 audit-config 改为复数形式*

- **/api/admin/users/<user_id>/status**: URL段应使用连字符而不是下划线: <user_id>
  *建议: 将 <user_id> 改为使用连字符*

- **/api/admin/reviewers/<reviewer_id>/activity**: URL段应使用连字符而不是下划线: <reviewer_id>
  *建议: 将 <reviewer_id> 改为使用连字符*

- **/api/admin/reviewers/<reviewer_id>/activity**: 资源名称应使用复数形式: activity
  *建议: 将 activity 改为复数形式*

- **/api/admin/content/categories**: 资源名称应使用复数形式: content
  *建议: 将 content 改为复数形式*

- **/api/admin/content/tags**: 资源名称应使用复数形式: content
  *建议: 将 content 改为复数形式*

- **/api/admin/content/categories**: 资源名称应使用复数形式: content
  *建议: 将 content 改为复数形式*

- **/api/admin/content/tags**: 资源名称应使用复数形式: content
  *建议: 将 content 改为复数形式*

- **/api/admin/database/status**: 资源名称应使用复数形式: database
  *建议: 将 database 改为复数形式*

- **/api/admin/project/status**: 资源名称应使用复数形式: project
  *建议: 将 project 改为复数形式*

- **/api/admin/project/control**: 资源名称应使用复数形式: project
  *建议: 将 project 改为复数形式*

- **/api/admin/project/control**: 资源名称应使用复数形式: control
  *建议: 将 control 改为复数形式*

- **/api/admin/user-behavior/analysis**: 资源名称应使用复数形式: user-behavior
  *建议: 将 user-behavior 改为复数形式*

- **/api/admin/user-behavior/cleanup**: 资源名称应使用复数形式: user-behavior
  *建议: 将 user-behavior 改为复数形式*

- **/api/admin/user-behavior/cleanup**: 资源名称应使用复数形式: cleanup
  *建议: 将 cleanup 改为复数形式*

- **/api/admin/dashboard/stats**: 资源名称应使用复数形式: dashboard
  *建议: 将 dashboard 改为复数形式*

- **/api/admin/questionnaires/<int:questionnaire_id>**: URL段应使用连字符而不是下划线: <int:questionnaire_id>
  *建议: 将 <int:questionnaire_id> 改为使用连字符*

- **/api/admin/audit-config**: 资源名称应使用复数形式: audit-config
  *建议: 将 audit-config 改为复数形式*

- **/api/admin/audit-config**: 资源名称应使用复数形式: audit-config
  *建议: 将 audit-config 改为复数形式*

- **/api/admin/users/<user_id>/status**: URL段应使用连字符而不是下划线: <user_id>
  *建议: 将 <user_id> 改为使用连字符*

- **/api/admin/reviewers/<reviewer_id>/activity**: URL段应使用连字符而不是下划线: <reviewer_id>
  *建议: 将 <reviewer_id> 改为使用连字符*

- **/api/admin/reviewers/<reviewer_id>/activity**: 资源名称应使用复数形式: activity
  *建议: 将 activity 改为复数形式*

- **/api/admin/content/categories**: 资源名称应使用复数形式: content
  *建议: 将 content 改为复数形式*

- **/api/admin/content/tags**: 资源名称应使用复数形式: content
  *建议: 将 content 改为复数形式*

- **/api/admin/content/categories**: 资源名称应使用复数形式: content
  *建议: 将 content 改为复数形式*

- **/api/admin/content/tags**: 资源名称应使用复数形式: content
  *建议: 将 content 改为复数形式*

- **/api/admin/database/status**: 资源名称应使用复数形式: database
  *建议: 将 database 改为复数形式*

- **/api/admin/project/status**: 资源名称应使用复数形式: project
  *建议: 将 project 改为复数形式*

- **/api/admin/project/control**: 资源名称应使用复数形式: project
  *建议: 将 project 改为复数形式*

- **/api/admin/project/control**: 资源名称应使用复数形式: control
  *建议: 将 control 改为复数形式*

- **/api/admin/user-behavior/analysis**: 资源名称应使用复数形式: user-behavior
  *建议: 将 user-behavior 改为复数形式*

- **/api/admin/user-behavior/cleanup**: 资源名称应使用复数形式: user-behavior
  *建议: 将 user-behavior 改为复数形式*

- **/api/admin/user-behavior/cleanup**: 资源名称应使用复数形式: cleanup
  *建议: 将 cleanup 改为复数形式*

- **/api/audit/process**: 资源名称应使用复数形式: audit
  *建议: 将 audit 改为复数形式*

- **/api/audit/pending**: 资源名称应使用复数形式: audit
  *建议: 将 audit 改为复数形式*

- **/api/audit/pending**: 资源名称应使用复数形式: pending
  *建议: 将 pending 改为复数形式*

- **/api/audit/manual-review**: 资源名称应使用复数形式: audit
  *建议: 将 audit 改为复数形式*

- **/api/audit/manual-review**: 资源名称应使用复数形式: manual-review
  *建议: 将 manual-review 改为复数形式*

- **/api/audit/config**: 资源名称应使用复数形式: audit
  *建议: 将 audit 改为复数形式*

- **/api/audit/level**: 资源名称应使用复数形式: audit
  *建议: 将 audit 改为复数形式*

- **/api/audit/level**: 资源名称应使用复数形式: level
  *建议: 将 level 改为复数形式*

- **/api/audit/stats**: 资源名称应使用复数形式: audit
  *建议: 将 audit 改为复数形式*

- **/api/audit/history**: 资源名称应使用复数形式: audit
  *建议: 将 audit 改为复数形式*

- **/api/audit/history**: 资源名称应使用复数形式: history
  *建议: 将 history 改为复数形式*

- **/api/audit/test**: 资源名称应使用复数形式: audit
  *建议: 将 audit 改为复数形式*

- **/api/audit/test**: 资源名称应使用复数形式: test
  *建议: 将 test 改为复数形式*

- **/api/audit/process**: 资源名称应使用复数形式: audit
  *建议: 将 audit 改为复数形式*

- **/api/audit/pending**: 资源名称应使用复数形式: audit
  *建议: 将 audit 改为复数形式*

- **/api/audit/pending**: 资源名称应使用复数形式: pending
  *建议: 将 pending 改为复数形式*

- **/api/audit/manual-review**: 资源名称应使用复数形式: audit
  *建议: 将 audit 改为复数形式*

- **/api/audit/manual-review**: 资源名称应使用复数形式: manual-review
  *建议: 将 manual-review 改为复数形式*

- **/api/audit/config**: 资源名称应使用复数形式: audit
  *建议: 将 audit 改为复数形式*

- **/api/audit/level**: 资源名称应使用复数形式: audit
  *建议: 将 audit 改为复数形式*

- **/api/audit/level**: 资源名称应使用复数形式: level
  *建议: 将 level 改为复数形式*

- **/api/audit/stats**: 资源名称应使用复数形式: audit
  *建议: 将 audit 改为复数形式*

- **/api/audit/history**: 资源名称应使用复数形式: audit
  *建议: 将 audit 改为复数形式*

- **/api/audit/history**: 资源名称应使用复数形式: history
  *建议: 将 history 改为复数形式*

- **/api/audit/test**: 资源名称应使用复数形式: audit
  *建议: 将 audit 改为复数形式*

- **/api/audit/test**: 资源名称应使用复数形式: test
  *建议: 将 test 改为复数形式*

- **/api/heart-voices/<int:voice_id>**: URL段应使用连字符而不是下划线: <int:voice_id>
  *建议: 将 <int:voice_id> 改为使用连字符*

- **/api/heart-voices/user/<int:user_id>**: 资源名称应使用复数形式: user
  *建议: 将 user 改为复数形式*

- **/api/heart-voices/user/<int:user_id>**: URL段应使用连字符而不是下划线: <int:user_id>
  *建议: 将 <int:user_id> 改为使用连字符*

- **/api/heart-voices/<int:voice_id>/like**: URL段应使用连字符而不是下划线: <int:voice_id>
  *建议: 将 <int:voice_id> 改为使用连字符*

- **/api/heart-voices/<int:voice_id>/like**: 资源名称应使用复数形式: like
  *建议: 将 like 改为复数形式*

- **/api/heart-voices/<int:voice_id>**: URL段应使用连字符而不是下划线: <int:voice_id>
  *建议: 将 <int:voice_id> 改为使用连字符*

- **/api/heart-voices/user/<int:user_id>**: 资源名称应使用复数形式: user
  *建议: 将 user 改为复数形式*

- **/api/heart-voices/user/<int:user_id>**: URL段应使用连字符而不是下划线: <int:user_id>
  *建议: 将 <int:user_id> 改为使用连字符*

- **/api/heart-voices/<int:voice_id>/like**: URL段应使用连字符而不是下划线: <int:voice_id>
  *建议: 将 <int:voice_id> 改为使用连字符*

- **/api/heart-voices/<int:voice_id>/like**: 资源名称应使用复数形式: like
  *建议: 将 like 改为复数形式*

- **/api/analytics/distribution**: 资源名称应使用复数形式: distribution
  *建议: 将 distribution 改为复数形式*

- **/api/analytics/sync**: 资源名称应使用复数形式: sync
  *建议: 将 sync 改为复数形式*

- **/api/analytics/sync/status**: 资源名称应使用复数形式: sync
  *建议: 将 sync 改为复数形式*

- **/api/analytics/performance**: 资源名称应使用复数形式: performance
  *建议: 将 performance 改为复数形式*

- **/api/analytics/cache/invalidate**: 资源名称应使用复数形式: cache
  *建议: 将 cache 改为复数形式*

- **/api/analytics/cache/invalidate**: 资源名称应使用复数形式: invalidate
  *建议: 将 invalidate 改为复数形式*

- **/api/analytics/employment**: 资源名称应使用复数形式: employment
  *建议: 将 employment 改为复数形式*

- **/api/analytics/distribution**: 资源名称应使用复数形式: distribution
  *建议: 将 distribution 改为复数形式*

- **/api/analytics/sync**: 资源名称应使用复数形式: sync
  *建议: 将 sync 改为复数形式*

- **/api/analytics/sync/status**: 资源名称应使用复数形式: sync
  *建议: 将 sync 改为复数形式*

- **/api/analytics/performance**: 资源名称应使用复数形式: performance
  *建议: 将 performance 改为复数形式*

- **/api/analytics/cache/invalidate**: 资源名称应使用复数形式: cache
  *建议: 将 cache 改为复数形式*

- **/api/analytics/cache/invalidate**: 资源名称应使用复数形式: invalidate
  *建议: 将 invalidate 改为复数形式*

- **/api/analytics/employment**: 资源名称应使用复数形式: employment
  *建议: 将 employment 改为复数形式*

- **/api/cards/generate**: 资源名称应使用复数形式: generate
  *建议: 将 generate 改为复数形式*

- **/api/cards/download/<int:card_id>**: 资源名称应使用复数形式: download
  *建议: 将 download 改为复数形式*

- **/api/cards/download/<int:card_id>**: URL段应使用连字符而不是下划线: <int:card_id>
  *建议: 将 <int:card_id> 改为使用连字符*

- **/api/cards/user/<int:user_id>**: 资源名称应使用复数形式: user
  *建议: 将 user 改为复数形式*

- **/api/cards/user/<int:user_id>**: URL段应使用连字符而不是下划线: <int:user_id>
  *建议: 将 <int:user_id> 改为使用连字符*

- **/api/cards/generate**: 资源名称应使用复数形式: generate
  *建议: 将 generate 改为复数形式*

- **/api/cards/download/<int:card_id>**: 资源名称应使用复数形式: download
  *建议: 将 download 改为复数形式*

- **/api/cards/download/<int:card_id>**: URL段应使用连字符而不是下划线: <int:card_id>
  *建议: 将 <int:card_id> 改为使用连字符*

- **/api/cards/user/<int:user_id>**: 资源名称应使用复数形式: user
  *建议: 将 user 改为复数形式*

- **/api/cards/user/<int:user_id>**: URL段应使用连字符而不是下划线: <int:user_id>
  *建议: 将 <int:user_id> 改为使用连字符*

- **/api/analytics/dashboard**: 资源名称应使用复数形式: dashboard
  *建议: 将 dashboard 改为复数形式*

- **/api/analytics/questionnaire/statistics/<question_id>**: 资源名称应使用复数形式: questionnaire
  *建议: 将 questionnaire 改为复数形式*

- **/api/analytics/questionnaire/statistics/<question_id>**: URL段应使用连字符而不是下划线: <question_id>
  *建议: 将 <question_id> 改为使用连字符*

- **/api/analytics/real-data**: 资源名称应使用复数形式: real-data
  *建议: 将 real-data 改为复数形式*

- **/api/analytics/dashboard**: 资源名称应使用复数形式: dashboard
  *建议: 将 dashboard 改为复数形式*

- **/api/analytics/questionnaire/statistics/<question_id>**: 资源名称应使用复数形式: questionnaire
  *建议: 将 questionnaire 改为复数形式*

- **/api/analytics/questionnaire/statistics/<question_id>**: URL段应使用连字符而不是下划线: <question_id>
  *建议: 将 <question_id> 改为使用连字符*

- **/api/analytics/real-data**: 资源名称应使用复数形式: real-data
  *建议: 将 real-data 改为复数形式*

- **/api/reviewer/pending-reviews**: 资源名称应使用复数形式: reviewer
  *建议: 将 reviewer 改为复数形式*

- **/api/reviewer/submit-review**: 资源名称应使用复数形式: reviewer
  *建议: 将 reviewer 改为复数形式*

- **/api/reviewer/submit-review**: 资源名称应使用复数形式: submit-review
  *建议: 将 submit-review 改为复数形式*

- **/api/reviewer/stats**: 资源名称应使用复数形式: reviewer
  *建议: 将 reviewer 改为复数形式*

- **/api/reviewer/pending-reviews**: 资源名称应使用复数形式: reviewer
  *建议: 将 reviewer 改为复数形式*

- **/api/reviewer/submit-review**: 资源名称应使用复数形式: reviewer
  *建议: 将 reviewer 改为复数形式*

- **/api/reviewer/submit-review**: 资源名称应使用复数形式: submit-review
  *建议: 将 submit-review 改为复数形式*

- **/api/reviewer/stats**: 资源名称应使用复数形式: reviewer
  *建议: 将 reviewer 改为复数形式*

- **/api/stories/<int:story_id>**: URL段应使用连字符而不是下划线: <int:story_id>
  *建议: 将 <int:story_id> 改为使用连字符*

- **/api/stories/user/<int:user_id>**: 资源名称应使用复数形式: user
  *建议: 将 user 改为复数形式*

- **/api/stories/user/<int:user_id>**: URL段应使用连字符而不是下划线: <int:user_id>
  *建议: 将 <int:user_id> 改为使用连字符*

- **/api/stories/featured**: 资源名称应使用复数形式: featured
  *建议: 将 featured 改为复数形式*

- **/api/stories/<int:story_id>**: URL段应使用连字符而不是下划线: <int:story_id>
  *建议: 将 <int:story_id> 改为使用连字符*

- **/api/stories/user/<int:user_id>**: 资源名称应使用复数形式: user
  *建议: 将 user 改为复数形式*

- **/api/stories/user/<int:user_id>**: URL段应使用连字符而不是下划线: <int:user_id>
  *建议: 将 <int:user_id> 改为使用连字符*

- **/api/stories/featured**: 资源名称应使用复数形式: featured
  *建议: 将 featured 改为复数形式*

- **/api/test-data/stats**: 资源名称应使用复数形式: test-data
  *建议: 将 test-data 改为复数形式*

- **/api/test-data/generate**: 资源名称应使用复数形式: test-data
  *建议: 将 test-data 改为复数形式*

- **/api/test-data/generate**: 资源名称应使用复数形式: generate
  *建议: 将 generate 改为复数形式*

- **/api/test-data/clear**: 资源名称应使用复数形式: test-data
  *建议: 将 test-data 改为复数形式*

- **/api/test-data/clear**: 资源名称应使用复数形式: clear
  *建议: 将 clear 改为复数形式*

- **/api/test-data/preview**: 资源名称应使用复数形式: test-data
  *建议: 将 test-data 改为复数形式*

- **/api/test-data/preview**: 资源名称应使用复数形式: preview
  *建议: 将 preview 改为复数形式*

- **/api/test-data/validate**: 资源名称应使用复数形式: test-data
  *建议: 将 test-data 改为复数形式*

- **/api/test-data/validate**: 资源名称应使用复数形式: validate
  *建议: 将 validate 改为复数形式*

- **/api/test-data/templates**: 资源名称应使用复数形式: test-data
  *建议: 将 test-data 改为复数形式*

- **/api/test-data/health**: 资源名称应使用复数形式: test-data
  *建议: 将 test-data 改为复数形式*

- **/api/admin/data-generator/clear**: 资源名称应使用复数形式: data-generator
  *建议: 将 data-generator 改为复数形式*

- **/api/admin/data-generator/clear**: 资源名称应使用复数形式: clear
  *建议: 将 clear 改为复数形式*

- **/api/admin/data-generator/smart-voice**: 资源名称应使用复数形式: data-generator
  *建议: 将 data-generator 改为复数形式*

- **/api/admin/data-generator/smart-voice**: 资源名称应使用复数形式: smart-voice
  *建议: 将 smart-voice 改为复数形式*

- **/api/admin/data-generator/smart-story**: 资源名称应使用复数形式: data-generator
  *建议: 将 data-generator 改为复数形式*

- **/api/admin/data-generator/smart-story**: 资源名称应使用复数形式: smart-story
  *建议: 将 smart-story 改为复数形式*

- **/api/test-data/stats**: 资源名称应使用复数形式: test-data
  *建议: 将 test-data 改为复数形式*

- **/api/test-data/generate**: 资源名称应使用复数形式: test-data
  *建议: 将 test-data 改为复数形式*

- **/api/test-data/generate**: 资源名称应使用复数形式: generate
  *建议: 将 generate 改为复数形式*

- **/api/test-data/clear**: 资源名称应使用复数形式: test-data
  *建议: 将 test-data 改为复数形式*

- **/api/test-data/clear**: 资源名称应使用复数形式: clear
  *建议: 将 clear 改为复数形式*

- **/api/test-data/preview**: 资源名称应使用复数形式: test-data
  *建议: 将 test-data 改为复数形式*

- **/api/test-data/preview**: 资源名称应使用复数形式: preview
  *建议: 将 preview 改为复数形式*

- **/api/test-data/validate**: 资源名称应使用复数形式: test-data
  *建议: 将 test-data 改为复数形式*

- **/api/test-data/validate**: 资源名称应使用复数形式: validate
  *建议: 将 validate 改为复数形式*

- **/api/test-data/templates**: 资源名称应使用复数形式: test-data
  *建议: 将 test-data 改为复数形式*

- **/api/test-data/health**: 资源名称应使用复数形式: test-data
  *建议: 将 test-data 改为复数形式*

- **/api/admin/data-generator/clear**: 资源名称应使用复数形式: data-generator
  *建议: 将 data-generator 改为复数形式*

- **/api/admin/data-generator/clear**: 资源名称应使用复数形式: clear
  *建议: 将 clear 改为复数形式*

- **/api/admin/data-generator/smart-voice**: 资源名称应使用复数形式: data-generator
  *建议: 将 data-generator 改为复数形式*

- **/api/admin/data-generator/smart-voice**: 资源名称应使用复数形式: smart-voice
  *建议: 将 smart-voice 改为复数形式*

- **/api/admin/data-generator/smart-story**: 资源名称应使用复数形式: data-generator
  *建议: 将 data-generator 改为复数形式*

- **/api/admin/data-generator/smart-story**: 资源名称应使用复数形式: smart-story
  *建议: 将 smart-story 改为复数形式*

- **/api/uuid/auth/semi-anonymous**: 资源名称应使用复数形式: uuid
  *建议: 将 uuid 改为复数形式*

- **/api/uuid/auth/anonymous**: 资源名称应使用复数形式: uuid
  *建议: 将 uuid 改为复数形式*

- **/api/uuid/test-combinations**: 资源名称应使用复数形式: uuid
  *建议: 将 uuid 改为复数形式*

- **/api/uuid/session/<session_id>**: 资源名称应使用复数形式: uuid
  *建议: 将 uuid 改为复数形式*

- **/api/uuid/session/<session_id>**: 资源名称应使用复数形式: session
  *建议: 将 session 改为复数形式*

- **/api/uuid/session/<session_id>**: URL段应使用连字符而不是下划线: <session_id>
  *建议: 将 <session_id> 改为使用连字符*

- **/api/uuid/users/statistics**: 资源名称应使用复数形式: uuid
  *建议: 将 uuid 改为复数形式*

- **/api/uuid/auth/semi-anonymous**: 资源名称应使用复数形式: uuid
  *建议: 将 uuid 改为复数形式*

- **/api/uuid/auth/anonymous**: 资源名称应使用复数形式: uuid
  *建议: 将 uuid 改为复数形式*

- **/api/uuid/test-combinations**: 资源名称应使用复数形式: uuid
  *建议: 将 uuid 改为复数形式*

- **/api/uuid/session/<session_id>**: 资源名称应使用复数形式: uuid
  *建议: 将 uuid 改为复数形式*

- **/api/uuid/session/<session_id>**: 资源名称应使用复数形式: session
  *建议: 将 session 改为复数形式*

- **/api/uuid/session/<session_id>**: URL段应使用连字符而不是下划线: <session_id>
  *建议: 将 <session_id> 改为使用连字符*

- **/api/uuid/users/statistics**: 资源名称应使用复数形式: uuid
  *建议: 将 uuid 改为复数形式*

## 命名一致性问题 (1项)

- **inconsistent_naming**: API中使用了多种命名模式
  *建议: 统一使用kebab-case命名模式*

## 冗余和重复

### 重复定义 (120项)
- `/api/admin/dashboard/stats` - API路径重复定义4次
- `/api/admin/questionnaires` - API路径重复定义4次
- `/api/admin/users` - API路径重复定义4次
- `/api/admin/users/stats` - API路径重复定义3次
- `/api/admin/users/export` - API路径重复定义2次
- `/api/admin/reviewers` - API路径重复定义3次
- `/api/admin/content/categories` - API路径重复定义6次
- `/api/admin/content/tags` - API路径重复定义6次
- `/api/admin/content/tags/:id` - API路径重复定义2次
- `/api/admin/content/tags/recommend` - API路径重复定义2次
- `/api/admin/content/tags/stats` - API路径重复定义2次
- `/api/admin/content/tags/merge` - API路径重复定义2次
- `/api/admin/content/tags/cleanup` - API路径重复定义2次
- `/api/admin/content/:contentType/:contentId/tags` - API路径重复定义2次
- `/api/admin/api/endpoints` - API路径重复定义2次
- `/api/admin/audit-config` - API路径重复定义6次
- `/api/admin/ai-providers` - API路径重复定义3次
- `/api/admin/local-rules` - API路径重复定义3次
- `/api/admin/sensitive-words` - API路径重复定义2次
- `/api/admin/sensitive-words/:id` - API路径重复定义2次
- `/api/admin/ip-access-control/rules` - API路径重复定义2次
- `/api/admin/ip-access-control/rules/:ruleId` - API路径重复定义2次
- `/api/questionnaire/` - API路径重复定义2次
- `/api/questionnaire/:id` - API路径重复定义3次
- `/api/reviewer/pending-reviews` - API路径重复定义3次
- `/api/reviewer/submit-review` - API路径重复定义3次
- `/api/reviewer/stats` - API路径重复定义3次
- `/api/health` - API路径重复定义7次
- `/api/stories` - API路径重复定义10次
- `/api/questionnaire` - API路径重复定义4次
- `/api/analytics/basic-stats` - API路径重复定义3次
- `/api/analytics/distribution` - API路径重复定义3次
- `/api/heart-voices` - API路径重复定义5次
- `/api/errors/report` - API路径重复定义2次
- `/api/stories/` - API路径重复定义2次
- `/api/stories/featured` - API路径重复定义3次
- `/api/stories/:id` - API路径重复定义2次
- `/api/api-docs/swagger.json` - API路径重复定义2次
- `/api/api-docs` - API路径重复定义2次
- `/api/version` - API路径重复定义2次
- `/api/v1` - API路径重复定义2次
- `/api/v2` - API路径重复定义2次
- `/api/api` - API路径重复定义2次
- `/api/auth` - API路径重复定义3次
- `/api/uuid` - API路径重复定义3次
- `/api/universal-questionnaire` - API路径重复定义3次
- `/api/analytics` - API路径重复定义3次
- `/api/reviewer` - API路径重复定义3次
- `/api/violations` - API路径重复定义3次
- `/api/tiered-audit` - API路径重复定义2次
- `/api/admin` - API路径重复定义3次
- `/api/admin/data-generator` - API路径重复定义2次
- `/api/participation-stats` - API路径重复定义3次
- `/api/questionnaire-auth` - API路径重复定义3次
- `/api/user-content-management` - API路径重复定义2次
- `/api/review` - API路径重复定义2次
- `/api/security` - API路径重复定义2次
- `/api/auth/google` - API路径重复定义2次
- `/api/admin/google-whitelist` - API路径重复定义2次
- `/api/user/login-history` - API路径重复定义2次
- `/api/admin/ip-access-control` - API路径重复定义2次
- `/api/user/two-factor` - API路径重复定义2次
- `/api/admin/intelligent-security` - API路径重复定义2次
- `/api/images/auto-generate/stats` - API路径重复定义2次
- `/api/images/auto-generate/batch-generate` - API路径重复定义2次
- `/api/admin/database` - API路径重复定义2次
- `/api/admin/questionnaires/<int:questionnaire_id>` - API路径重复定义2次
- `/api/admin/audit-records` - API路径重复定义2次
- `/api/admin/ai-sources` - API路径重复定义4次
- `/api/admin/users/<user_id>/status` - API路径重复定义2次
- `/api/admin/reviewers/<reviewer_id>/activity` - API路径重复定义2次
- `/api/admin/database/status` - API路径重复定义2次
- `/api/admin/api/stats` - API路径重复定义2次
- `/api/admin/project/status` - API路径重复定义2次
- `/api/admin/project/control` - API路径重复定义2次
- `/api/admin/user-behavior/analysis` - API路径重复定义2次
- `/api/admin/user-behavior/cleanup` - API路径重复定义2次
- `/api/audit/process` - API路径重复定义2次
- `/api/audit/pending` - API路径重复定义2次
- `/api/audit/manual-review` - API路径重复定义2次
- `/api/audit/config` - API路径重复定义2次
- `/api/audit/level` - API路径重复定义2次
- `/api/audit/stats` - API路径重复定义2次
- `/api/audit/history` - API路径重复定义2次
- `/api/audit/test` - API路径重复定义2次
- `/api/heart-voices/<int:voice_id>` - API路径重复定义2次
- `/api/heart-voices/user/<int:user_id>` - API路径重复定义2次
- `/api/heart-voices/<int:voice_id>/like` - API路径重复定义2次
- `/api/analytics/cross-analysis` - API路径重复定义2次
- `/api/analytics/sync` - API路径重复定义2次
- `/api/analytics/sync/status` - API路径重复定义2次
- `/api/analytics/performance` - API路径重复定义2次
- `/api/analytics/cache/invalidate` - API路径重复定义2次
- `/api/analytics/health` - API路径重复定义2次
- `/api/analytics/employment` - API路径重复定义2次
- `/api/cards/generate` - API路径重复定义2次
- `/api/cards/download/<int:card_id>` - API路径重复定义2次
- `/api/cards/user/<int:user_id>` - API路径重复定义2次
- `/api/cards/styles` - API路径重复定义2次
- `/api/analytics/dashboard` - API路径重复定义2次
- `/api/analytics/questionnaire/statistics/<question_id>` - API路径重复定义2次
- `/api/analytics/real-data` - API路径重复定义2次
- `/health` - API路径重复定义4次
- `/api/stories/<int:story_id>` - API路径重复定义2次
- `/api/stories/user/<int:user_id>` - API路径重复定义2次
- `/api/test-data/stats` - API路径重复定义2次
- `/api/test-data/generate` - API路径重复定义2次
- `/api/test-data/clear` - API路径重复定义2次
- `/api/test-data/preview` - API路径重复定义2次
- `/api/test-data/validate` - API路径重复定义2次
- `/api/test-data/templates` - API路径重复定义2次
- `/api/test-data/health` - API路径重复定义2次
- `/api/admin/data-generator/clear` - API路径重复定义2次
- `/api/admin/data-generator/smart-voice` - API路径重复定义2次
- `/api/admin/data-generator/smart-story` - API路径重复定义2次
- `/api/uuid/auth/semi-anonymous` - API路径重复定义2次
- `/api/uuid/auth/anonymous` - API路径重复定义2次
- `/api/uuid/test-combinations` - API路径重复定义2次
- `/api/uuid/session/<session_id>` - API路径重复定义2次
- `/api/uuid/users/statistics` - API路径重复定义2次

### 相似API (172项)
- `/api/admin/users/stats` 与 `/api/admin/users/batch` 相似度: 81.8%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/users/:userId/status` 与 `/api/admin/users/<user_id>/status` 相似度: 87.9%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/users/:userId/status` 与 `/api/admin/users/<user_id>/status` 相似度: 87.9%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/users/batch` 与 `/api/admin/users/stats` 相似度: 81.8%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/users/batch` 与 `/api/admin/users/stats` 相似度: 81.8%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/content/tags` 与 `/api/admin/content/tags/:id` 相似度: 85.2%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/content/tags` 与 `/api/admin/content/tags/:id` 相似度: 85.2%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/content/tags` 与 `/api/admin/content/by-tags` 相似度: 88.5%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/content/tags` 与 `/api/admin/content/tags/:id` 相似度: 85.2%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/content/tags` 与 `/api/admin/content/tags/:id` 相似度: 85.2%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/content/tags` 与 `/api/admin/content/by-tags` 相似度: 88.5%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/content/tags/:id` 与 `/api/admin/content/tags/stats` 相似度: 82.8%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/content/tags/:id` 与 `/api/admin/content/tags/merge` 相似度: 82.8%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/content/tags/:id` 与 `/api/admin/content/tags/stats` 相似度: 82.8%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/content/tags/:id` 与 `/api/admin/content/tags/merge` 相似度: 82.8%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/content/tags/:id` 与 `/api/admin/content/tags` 相似度: 85.2%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/content/tags/:id` 与 `/api/admin/content/tags` 相似度: 85.2%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/content/tags/:id` 与 `/api/admin/content/tags` 相似度: 85.2%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/content/tags/:id` 与 `/api/admin/content/tags` 相似度: 85.2%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/content/tags/:id` 与 `/api/admin/content/tags/stats` 相似度: 82.8%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/content/tags/:id` 与 `/api/admin/content/tags/merge` 相似度: 82.8%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/content/tags/:id` 与 `/api/admin/content/tags/stats` 相似度: 82.8%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/content/tags/:id` 与 `/api/admin/content/tags/merge` 相似度: 82.8%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/content/tags/:id` 与 `/api/admin/content/tags` 相似度: 85.2%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/content/tags/:id` 与 `/api/admin/content/tags` 相似度: 85.2%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/content/tags/:id` 与 `/api/admin/content/tags` 相似度: 85.2%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/content/tags/:id` 与 `/api/admin/content/tags` 相似度: 85.2%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/content/tags/stats` 与 `/api/admin/content/tags/merge` 相似度: 82.8%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/content/tags/stats` 与 `/api/admin/content/tags/cleanup` 相似度: 80.6%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/content/tags/stats` 与 `/api/admin/content/tags/merge` 相似度: 82.8%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/content/tags/stats` 与 `/api/admin/content/tags/cleanup` 相似度: 80.6%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/content/tags/merge` 与 `/api/admin/content/tags/cleanup` 相似度: 80.6%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/content/tags/merge` 与 `/api/admin/content/tags/stats` 相似度: 82.8%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/content/tags/merge` 与 `/api/admin/content/tags/cleanup` 相似度: 80.6%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/content/tags/cleanup` 与 `/api/admin/content/tags/stats` 相似度: 80.6%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/content/tags/cleanup` 与 `/api/admin/content/tags/merge` 相似度: 80.6%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/content/by-tags` 与 `/api/admin/content/tags` 相似度: 88.5%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/content/by-tags` 与 `/api/admin/content/tags` 相似度: 88.5%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/content/by-tags` 与 `/api/admin/content/tags` 相似度: 88.5%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/content/by-tags` 与 `/api/admin/content/tags` 相似度: 88.5%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/content/tags/stats` 与 `/api/admin/content/tags/merge` 相似度: 82.8%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/content/tags/stats` 与 `/api/admin/content/tags/cleanup` 相似度: 80.6%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/content/tags/merge` 与 `/api/admin/content/tags/cleanup` 相似度: 80.6%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/database/tables` 与 `/api/admin/database-test` 相似度: 80.8%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/database/tables` 与 `/api/admin/database/status` 相似度: 84.6%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/database/tables` 与 `/api/admin/database/status` 相似度: 84.6%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/sensitive-words` 与 `/api/admin/sensitive-words/:id` 相似度: 86.7%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/sensitive-words` 与 `/api/admin/sensitive-words/:id` 相似度: 86.7%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/sensitive-words` 与 `/api/admin/sensitive-words/:id` 相似度: 86.7%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/sensitive-words` 与 `/api/admin/sensitive-words/:id` 相似度: 86.7%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/ip-access-control/rules` 与 `/api/admin/ip-access-control/rules/:ruleId` 相似度: 81.0%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/ip-access-control/rules` 与 `/api/admin/ip-access-control/rules/:ruleId` 相似度: 81.0%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/ip-access-control/rules` 与 `/api/admin/ip-access-control/stats` 相似度: 88.2%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/ip-access-control/rules` 与 `/api/admin/ip-access-control` 相似度: 82.4%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/ip-access-control/rules` 与 `/api/admin/ip-access-control` 相似度: 82.4%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/ip-access-control/rules` 与 `/api/admin/ip-access-control/rules/:ruleId` 相似度: 81.0%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/ip-access-control/rules` 与 `/api/admin/ip-access-control/rules/:ruleId` 相似度: 81.0%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/ip-access-control/rules` 与 `/api/admin/ip-access-control/stats` 相似度: 88.2%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/ip-access-control/rules` 与 `/api/admin/ip-access-control` 相似度: 82.4%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/ip-access-control/rules` 与 `/api/admin/ip-access-control` 相似度: 82.4%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/ip-access-control/stats` 与 `/api/admin/ip-access-control` 相似度: 82.4%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/ip-access-control/stats` 与 `/api/admin/ip-access-control` 相似度: 82.4%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/intelligent-security/anomalies` 与 `/api/admin/intelligent-security/threats` 相似度: 82.9%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/intelligent-security/anomalies` 与 `/api/admin/intelligent-security/responses` 相似度: 82.9%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/intelligent-security/anomalies` 与 `/api/admin/intelligent-security/stats` 相似度: 82.9%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/intelligent-security/threats` 与 `/api/admin/intelligent-security/responses` 相似度: 80.5%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/intelligent-security/threats` 与 `/api/admin/intelligent-security/stats` 相似度: 89.7%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/intelligent-security/responses` 与 `/api/admin/intelligent-security/stats` 相似度: 82.9%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/intelligent-security/stats` 与 `/api/admin/intelligent-security` 相似度: 83.8%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/intelligent-security/stats` 与 `/api/admin/intelligent-security` 相似度: 83.8%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/login-monitor/records` 与 `/api/admin/login-monitor/alerts` 相似度: 84.4%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/login-monitor/records` 与 `/api/admin/login-monitor/charts` 相似度: 84.4%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/login-monitor/alerts` 与 `/api/admin/login-monitor/charts` 相似度: 90.3%
  *考虑合并或重新设计这些相似的API*

- `/api/questionnaire/` 与 `/api/questionnaire/:id` 相似度: 86.4%
  *考虑合并或重新设计这些相似的API*

- `/api/questionnaire/` 与 `/api/questionnaire/:id` 相似度: 86.4%
  *考虑合并或重新设计这些相似的API*

- `/api/questionnaire/` 与 `/api/questionnaire` 相似度: 94.7%
  *考虑合并或重新设计这些相似的API*

- `/api/questionnaire/` 与 `/api/questionnaire/:id` 相似度: 86.4%
  *考虑合并或重新设计这些相似的API*

- `/api/questionnaire/` 与 `/api/questionnaire` 相似度: 94.7%
  *考虑合并或重新设计这些相似的API*

- `/api/questionnaire/` 与 `/api/questionnaire` 相似度: 94.7%
  *考虑合并或重新设计这些相似的API*

- `/api/questionnaire/` 与 `/api/questionnaire` 相似度: 94.7%
  *考虑合并或重新设计这些相似的API*

- `/api/questionnaire/` 与 `/api/questionnaire/:id` 相似度: 86.4%
  *考虑合并或重新设计这些相似的API*

- `/api/questionnaire/` 与 `/api/questionnaire/:id` 相似度: 86.4%
  *考虑合并或重新设计这些相似的API*

- `/api/questionnaire/` 与 `/api/questionnaire` 相似度: 94.7%
  *考虑合并或重新设计这些相似的API*

- `/api/questionnaire/` 与 `/api/questionnaire/:id` 相似度: 86.4%
  *考虑合并或重新设计这些相似的API*

- `/api/questionnaire/` 与 `/api/questionnaire` 相似度: 94.7%
  *考虑合并或重新设计这些相似的API*

- `/api/questionnaire/` 与 `/api/questionnaire` 相似度: 94.7%
  *考虑合并或重新设计这些相似的API*

- `/api/questionnaire/` 与 `/api/questionnaire` 相似度: 94.7%
  *考虑合并或重新设计这些相似的API*

- `/api/questionnaire/:id` 与 `/api/questionnaire` 相似度: 81.8%
  *考虑合并或重新设计这些相似的API*

- `/api/questionnaire/:id` 与 `/api/questionnaire` 相似度: 81.8%
  *考虑合并或重新设计这些相似的API*

- `/api/questionnaire/:id` 与 `/api/questionnaire` 相似度: 81.8%
  *考虑合并或重新设计这些相似的API*

- `/api/questionnaire/:id` 与 `/api/questionnaire` 相似度: 81.8%
  *考虑合并或重新设计这些相似的API*

- `/api/questionnaire/:id` 与 `/api/questionnaire` 相似度: 81.8%
  *考虑合并或重新设计这些相似的API*

- `/api/questionnaire/:id` 与 `/api/questionnaire` 相似度: 81.8%
  *考虑合并或重新设计这些相似的API*

- `/api/questionnaire/:id` 与 `/api/questionnaire` 相似度: 81.8%
  *考虑合并或重新设计这些相似的API*

- `/api/questionnaire/:id` 与 `/api/questionnaire` 相似度: 81.8%
  *考虑合并或重新设计这些相似的API*

- `/api/reviewer/pending-reviews` 与 `/api/simple-reviewer/pending-reviews` 相似度: 80.6%
  *考虑合并或重新设计这些相似的API*

- `/api/simple-auth/me` 与 `/api/simple-auth` 相似度: 84.2%
  *考虑合并或重新设计这些相似的API*

- `/api/simple-reviewer/pending-reviews` 与 `/api/reviewer/pending-reviews` 相似度: 80.6%
  *考虑合并或重新设计这些相似的API*

- `/api/simple-reviewer/pending-reviews` 与 `/api/reviewer/pending-reviews` 相似度: 80.6%
  *考虑合并或重新设计这些相似的API*

- `/api/stories` 与 `/api/stories/` 相似度: 92.3%
  *考虑合并或重新设计这些相似的API*

- `/api/stories` 与 `/api/stories/` 相似度: 92.3%
  *考虑合并或重新设计这些相似的API*

- `/api/questionnaire` 与 `/api/questionnaire/:id` 相似度: 81.8%
  *考虑合并或重新设计这些相似的API*

- `/api/questionnaire/:id` 与 `/api/questionnaire` 相似度: 81.8%
  *考虑合并或重新设计这些相似的API*

- `/api/questionnaire/:id` 与 `/api/questionnaire` 相似度: 81.8%
  *考虑合并或重新设计这些相似的API*

- `/api/questionnaire/:id` 与 `/api/questionnaire` 相似度: 81.8%
  *考虑合并或重新设计这些相似的API*

- `/api/universal-questionnaire/submit` 与 `/api/universal-questionnaire/count` 相似度: 85.7%
  *考虑合并或重新设计这些相似的API*

- `/api/universal-questionnaire/count` 与 `/api/universal-questionnaire` 相似度: 82.4%
  *考虑合并或重新设计这些相似的API*

- `/api/universal-questionnaire/count` 与 `/api/universal-questionnaire` 相似度: 82.4%
  *考虑合并或重新设计这些相似的API*

- `/api/universal-questionnaire/count` 与 `/api/universal-questionnaire` 相似度: 82.4%
  *考虑合并或重新设计这些相似的API*

- `/api/stories/` 与 `/api/stories/:id` 相似度: 81.3%
  *考虑合并或重新设计这些相似的API*

- `/api/stories/` 与 `/api/stories/:id` 相似度: 81.3%
  *考虑合并或重新设计这些相似的API*

- `/api/stories/` 与 `/api/stories` 相似度: 92.3%
  *考虑合并或重新设计这些相似的API*

- `/api/stories/` 与 `/api/stories` 相似度: 92.3%
  *考虑合并或重新设计这些相似的API*

- `/api/stories/` 与 `/api/stories` 相似度: 92.3%
  *考虑合并或重新设计这些相似的API*

- `/api/stories/` 与 `/api/stories` 相似度: 92.3%
  *考虑合并或重新设计这些相似的API*

- `/api/stories/` 与 `/api/stories` 相似度: 92.3%
  *考虑合并或重新设计这些相似的API*

- `/api/stories/` 与 `/api/stories` 相似度: 92.3%
  *考虑合并或重新设计这些相似的API*

- `/api/stories/` 与 `/api/stories` 相似度: 92.3%
  *考虑合并或重新设计这些相似的API*

- `/api/stories/` 与 `/api/stories` 相似度: 92.3%
  *考虑合并或重新设计这些相似的API*

- `/api/stories/` 与 `/api/stories` 相似度: 92.3%
  *考虑合并或重新设计这些相似的API*

- `/api/stories/:id` 与 `/api/stories/` 相似度: 81.3%
  *考虑合并或重新设计这些相似的API*

- `/api/stories/` 与 `/api/stories/:id` 相似度: 81.3%
  *考虑合并或重新设计这些相似的API*

- `/api/stories/` 与 `/api/stories` 相似度: 92.3%
  *考虑合并或重新设计这些相似的API*

- `/api/stories/` 与 `/api/stories` 相似度: 92.3%
  *考虑合并或重新设计这些相似的API*

- `/api/stories/` 与 `/api/stories` 相似度: 92.3%
  *考虑合并或重新设计这些相似的API*

- `/api/stories/` 与 `/api/stories` 相似度: 92.3%
  *考虑合并或重新设计这些相似的API*

- `/api/stories/` 与 `/api/stories` 相似度: 92.3%
  *考虑合并或重新设计这些相似的API*

- `/api/stories/` 与 `/api/stories` 相似度: 92.3%
  *考虑合并或重新设计这些相似的API*

- `/api/stories/` 与 `/api/stories` 相似度: 92.3%
  *考虑合并或重新设计这些相似的API*

- `/api/stories/` 与 `/api/stories` 相似度: 92.3%
  *考虑合并或重新设计这些相似的API*

- `/api/stories/` 与 `/api/stories` 相似度: 92.3%
  *考虑合并或重新设计这些相似的API*

- `/api/stories/:id/like` 与 `/api/stories/:id/dislike` 相似度: 87.5%
  *考虑合并或重新设计这些相似的API*

- `/api/v1` 与 `/api/v2` 相似度: 85.7%
  *考虑合并或重新设计这些相似的API*

- `/api/v1` 与 `/api/v2` 相似度: 85.7%
  *考虑合并或重新设计这些相似的API*

- `/api/v1` 与 `/api/v1/` 相似度: 87.5%
  *考虑合并或重新设计这些相似的API*

- `/api/v2` 与 `/api/v1` 相似度: 85.7%
  *考虑合并或重新设计这些相似的API*

- `/api/v2` 与 `/api/v2/` 相似度: 87.5%
  *考虑合并或重新设计这些相似的API*

- `/api/reviewer` 与 `/api/review` 相似度: 84.6%
  *考虑合并或重新设计这些相似的API*

- `/api/reviewer` 与 `/api/review` 相似度: 84.6%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/data-generator` 与 `/api/admin/data-generator/clear` 相似度: 80.6%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/data-generator` 与 `/api/admin/data-generator/clear` 相似度: 80.6%
  *考虑合并或重新设计这些相似的API*

- `/api/review` 与 `/api/reviewer` 相似度: 84.6%
  *考虑合并或重新设计这些相似的API*

- `/api/review` 与 `/api/reviewer` 相似度: 84.6%
  *考虑合并或重新设计这些相似的API*

- `/api/*` 与 `/api/` 相似度: 83.3%
  *考虑合并或重新设计这些相似的API*

- `/api/v1` 与 `/api/v2` 相似度: 85.7%
  *考虑合并或重新设计这些相似的API*

- `/api/v1` 与 `/api/v1/` 相似度: 87.5%
  *考虑合并或重新设计这些相似的API*

- `/api/v2` 与 `/api/v2/` 相似度: 87.5%
  *考虑合并或重新设计这些相似的API*

- `/api/v1/` 与 `/api/v2/` 相似度: 87.5%
  *考虑合并或重新设计这些相似的API*

- `/api/reviewer` 与 `/api/review` 相似度: 84.6%
  *考虑合并或重新设计这些相似的API*

- `/api/review` 与 `/api/reviewer` 相似度: 84.6%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/data-generator` 与 `/api/admin/data-generator/clear` 相似度: 80.6%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/data-generator` 与 `/api/admin/data-generator/clear` 相似度: 80.6%
  *考虑合并或重新设计这些相似的API*

- `/api/heart-voices/<int:voice_id>` 与 `/api/heart-voices/<int:voice_id>/like` 相似度: 86.5%
  *考虑合并或重新设计这些相似的API*

- `/api/heart-voices/<int:voice_id>` 与 `/api/heart-voices/<int:voice_id>/like` 相似度: 86.5%
  *考虑合并或重新设计这些相似的API*

- `/api/heart-voices/<int:voice_id>/like` 与 `/api/heart-voices/<int:voice_id>` 相似度: 86.5%
  *考虑合并或重新设计这些相似的API*

- `/api/heart-voices/<int:voice_id>` 与 `/api/heart-voices/<int:voice_id>/like` 相似度: 86.5%
  *考虑合并或重新设计这些相似的API*

- `/api/cards/user/<int:user_id>` 与 `/api/stories/user/<int:user_id>` 相似度: 83.9%
  *考虑合并或重新设计这些相似的API*

- `/api/cards/user/<int:user_id>` 与 `/api/stories/user/<int:user_id>` 相似度: 83.9%
  *考虑合并或重新设计这些相似的API*

- `/api/cards/user/<int:user_id>` 与 `/api/stories/user/<int:user_id>` 相似度: 83.9%
  *考虑合并或重新设计这些相似的API*

- `/api/cards/user/<int:user_id>` 与 `/api/stories/user/<int:user_id>` 相似度: 83.9%
  *考虑合并或重新设计这些相似的API*

- `/api/test-data/stats` 与 `/api/test-data/health` 相似度: 81.0%
  *考虑合并或重新设计这些相似的API*

- `/api/test-data/stats` 与 `/api/test-data/health` 相似度: 81.0%
  *考虑合并或重新设计这些相似的API*

- `/api/test-data/health` 与 `/api/test-data/stats` 相似度: 81.0%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/data-generator/smart-voice` 与 `/api/admin/data-generator/smart-story` 相似度: 86.5%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/data-generator/smart-voice` 与 `/api/admin/data-generator/smart-story` 相似度: 86.5%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/data-generator/smart-story` 与 `/api/admin/data-generator/smart-voice` 相似度: 86.5%
  *考虑合并或重新设计这些相似的API*

- `/api/test-data/stats` 与 `/api/test-data/health` 相似度: 81.0%
  *考虑合并或重新设计这些相似的API*

- `/api/admin/data-generator/smart-voice` 与 `/api/admin/data-generator/smart-story` 相似度: 86.5%
  *考虑合并或重新设计这些相似的API*

- `/api/uuid/auth/semi-anonymous` 与 `/api/uuid/auth/anonymous` 相似度: 82.8%
  *考虑合并或重新设计这些相似的API*

- `/api/uuid/auth/semi-anonymous` 与 `/api/uuid/auth/anonymous` 相似度: 82.8%
  *考虑合并或重新设计这些相似的API*

- `/api/uuid/auth/anonymous` 与 `/api/uuid/auth/semi-anonymous` 相似度: 82.8%
  *考虑合并或重新设计这些相似的API*

- `/api/uuid/auth/semi-anonymous` 与 `/api/uuid/auth/anonymous` 相似度: 82.8%
  *考虑合并或重新设计这些相似的API*

## 安全性问题 (181项)

- **/api/admin/dashboard/stats**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/questionnaires**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/users**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/debug/tables**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/users/stats**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/users/:userId/status**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/users/:userId/status**: 路径参数可能存在注入风险
  *建议: 确保对所有路径参数进行验证和清理*

- **/api/admin/users/:userId**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/users/:userId**: 路径参数可能存在注入风险
  *建议: 确保对所有路径参数进行验证和清理*

- **/api/admin/users/batch**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/users/export**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/users/manage**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/reviewers**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/content/categories**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/content/categories**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/content/tags**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/content/tags**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/content/tags/:id**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/content/tags/:id**: 路径参数可能存在注入风险
  *建议: 确保对所有路径参数进行验证和清理*

- **/api/admin/content/tags/:id**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/content/tags/:id**: 路径参数可能存在注入风险
  *建议: 确保对所有路径参数进行验证和清理*

- **/api/admin/content/tags/recommend**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/content/tags/stats**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/content/tags/merge**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/content/tags/cleanup**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/content/:contentType/:contentId/tags**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/content/:contentType/:contentId/tags**: 路径参数可能存在注入风险
  *建议: 确保对所有路径参数进行验证和清理*

- **/api/admin/content/:contentType/:contentId/tags**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/content/:contentType/:contentId/tags**: 路径参数可能存在注入风险
  *建议: 确保对所有路径参数进行验证和清理*

- **/api/admin/content/by-tags**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/content/tags/stats**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/content/tags/merge**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/content/tags/cleanup**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/content/tags/recommend**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/test-data/verify**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/api/endpoints**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/database/tables**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/audit-config**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/audit-config**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/ai-providers**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/local-rules**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/sensitive-words**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/sensitive-words**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/sensitive-words/:id**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/sensitive-words/:id**: 路径参数可能存在注入风险
  *建议: 确保对所有路径参数进行验证和清理*

- **/api/admin/sensitive-words/:id**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/sensitive-words/:id**: 路径参数可能存在注入风险
  *建议: 确保对所有路径参数进行验证和清理*

- **/api/admin/audit-test**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/ip-access-control/rules**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/ip-access-control/rules**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/ip-access-control/rules/:ruleId**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/ip-access-control/rules/:ruleId**: 路径参数可能存在注入风险
  *建议: 确保对所有路径参数进行验证和清理*

- **/api/admin/ip-access-control/rules/:ruleId**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/ip-access-control/rules/:ruleId**: 路径参数可能存在注入风险
  *建议: 确保对所有路径参数进行验证和清理*

- **/api/admin/ip-access-control/time-policies**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/ip-access-control/stats**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/intelligent-security/anomalies**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/intelligent-security/threats**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/intelligent-security/fingerprints**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/intelligent-security/responses**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/intelligent-security/stats**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/login-monitor/records**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/login-monitor/alerts**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/login-monitor/charts**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/users/download/${Date.now()}.${format}**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/api/endpoints**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/api/questionnaire/submit**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/api/reviewer/pending-reviews**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/api/analytics/basic-stats**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/users**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/questionnaire/:id**: 路径参数可能存在注入风险
  *建议: 确保对所有路径参数进行验证和清理*

- **/api/questionnaire/:id**: 路径参数可能存在注入风险
  *建议: 确保对所有路径参数进行验证和清理*

- **/api/admin/dashboard/stats**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/questionnaires**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/users/export**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/questionnaire/:id**: 路径参数可能存在注入风险
  *建议: 确保对所有路径参数进行验证和清理*

- **/api/stories/test-tags/:storyId**: 路径参数可能存在注入风险
  *建议: 确保对所有路径参数进行验证和清理*

- **/api/stories/:id**: 路径参数可能存在注入风险
  *建议: 确保对所有路径参数进行验证和清理*

- **/api/stories/:id/like**: 路径参数可能存在注入风险
  *建议: 确保对所有路径参数进行验证和清理*

- **/api/stories/:id**: 路径参数可能存在注入风险
  *建议: 确保对所有路径参数进行验证和清理*

- **/api/stories/:id/dislike**: 路径参数可能存在注入风险
  *建议: 确保对所有路径参数进行验证和清理*

- **/api/stories/:id/png/:theme?**: 路径参数可能存在注入风险
  *建议: 确保对所有路径参数进行验证和清理*

- **/api/stories/user/:userId**: 路径参数可能存在注入风险
  *建议: 确保对所有路径参数进行验证和清理*

- **/api/dimension/:dimensionId**: 路径参数可能存在注入风险
  *建议: 确保对所有路径参数进行验证和清理*

- **/api/question/:questionId**: 路径参数可能存在注入风险
  *建议: 确保对所有路径参数进行验证和清理*

- **/api/admin/data-generator**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/google-whitelist**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/ip-access-control**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/intelligent-security**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/database-test**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/database**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/google-whitelist**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/ip-access-control**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/intelligent-security**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/login-monitor**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/data-generator**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/database**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/dashboard/stats**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/questionnaires**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/questionnaires/<int:questionnaire_id>**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/questionnaires/<int:questionnaire_id>**: 路径参数可能存在注入风险
  *建议: 确保对所有路径参数进行验证和清理*

- **/api/admin/audit-records**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/audit-config**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/audit-config**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/ai-providers**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/ai-sources**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/ai-sources**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/local-rules**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/users**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/users/stats**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/users/<user_id>/status**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/users/<user_id>/status**: 路径参数可能存在注入风险
  *建议: 确保对所有路径参数进行验证和清理*

- **/api/admin/reviewers/<reviewer_id>/activity**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/reviewers/<reviewer_id>/activity**: 路径参数可能存在注入风险
  *建议: 确保对所有路径参数进行验证和清理*

- **/api/admin/reviewers**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/content/categories**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/content/tags**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/content/categories**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/content/tags**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/database/status**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/api/stats**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/project/status**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/project/control**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/user-behavior/analysis**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/user-behavior/cleanup**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/dashboard/stats**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/questionnaires**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/questionnaires/<int:questionnaire_id>**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/questionnaires/<int:questionnaire_id>**: 路径参数可能存在注入风险
  *建议: 确保对所有路径参数进行验证和清理*

- **/api/admin/audit-records**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/audit-config**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/audit-config**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/ai-providers**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/ai-sources**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/ai-sources**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/local-rules**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/users**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/users/stats**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/users/<user_id>/status**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/users/<user_id>/status**: 路径参数可能存在注入风险
  *建议: 确保对所有路径参数进行验证和清理*

- **/api/admin/reviewers/<reviewer_id>/activity**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/reviewers/<reviewer_id>/activity**: 路径参数可能存在注入风险
  *建议: 确保对所有路径参数进行验证和清理*

- **/api/admin/reviewers**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/content/categories**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/content/tags**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/content/categories**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/content/tags**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/database/status**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/api/stats**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/project/status**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/project/control**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/user-behavior/analysis**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/user-behavior/cleanup**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/heart-voices/<int:voice_id>**: 路径参数可能存在注入风险
  *建议: 确保对所有路径参数进行验证和清理*

- **/api/heart-voices/user/<int:user_id>**: 路径参数可能存在注入风险
  *建议: 确保对所有路径参数进行验证和清理*

- **/api/heart-voices/<int:voice_id>/like**: 路径参数可能存在注入风险
  *建议: 确保对所有路径参数进行验证和清理*

- **/api/heart-voices/<int:voice_id>**: 路径参数可能存在注入风险
  *建议: 确保对所有路径参数进行验证和清理*

- **/api/heart-voices/user/<int:user_id>**: 路径参数可能存在注入风险
  *建议: 确保对所有路径参数进行验证和清理*

- **/api/heart-voices/<int:voice_id>/like**: 路径参数可能存在注入风险
  *建议: 确保对所有路径参数进行验证和清理*

- **/api/cards/download/<int:card_id>**: 路径参数可能存在注入风险
  *建议: 确保对所有路径参数进行验证和清理*

- **/api/cards/user/<int:user_id>**: 路径参数可能存在注入风险
  *建议: 确保对所有路径参数进行验证和清理*

- **/api/cards/download/<int:card_id>**: 路径参数可能存在注入风险
  *建议: 确保对所有路径参数进行验证和清理*

- **/api/cards/user/<int:user_id>**: 路径参数可能存在注入风险
  *建议: 确保对所有路径参数进行验证和清理*

- **/api/analytics/questionnaire/statistics/<question_id>**: 路径参数可能存在注入风险
  *建议: 确保对所有路径参数进行验证和清理*

- **/api/analytics/questionnaire/statistics/<question_id>**: 路径参数可能存在注入风险
  *建议: 确保对所有路径参数进行验证和清理*

- **/api/stories/<int:story_id>**: 路径参数可能存在注入风险
  *建议: 确保对所有路径参数进行验证和清理*

- **/api/stories/user/<int:user_id>**: 路径参数可能存在注入风险
  *建议: 确保对所有路径参数进行验证和清理*

- **/api/stories/<int:story_id>**: 路径参数可能存在注入风险
  *建议: 确保对所有路径参数进行验证和清理*

- **/api/stories/user/<int:user_id>**: 路径参数可能存在注入风险
  *建议: 确保对所有路径参数进行验证和清理*

- **/api/test-data/clear**: 破坏性操作需要额外的安全措施
  *建议: 添加确认机制和审计日志*

- **/api/admin/data-generator/clear**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/data-generator/clear**: 破坏性操作需要额外的安全措施
  *建议: 添加确认机制和审计日志*

- **/api/admin/data-generator/smart-voice**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/data-generator/smart-story**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/test-data/clear**: 破坏性操作需要额外的安全措施
  *建议: 添加确认机制和审计日志*

- **/api/admin/data-generator/clear**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/data-generator/clear**: 破坏性操作需要额外的安全措施
  *建议: 添加确认机制和审计日志*

- **/api/admin/data-generator/smart-voice**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/admin/data-generator/smart-story**: 管理员API可能缺少认证检查
  *建议: 确保所有管理员API都有适当的认证和授权*

- **/api/uuid/session/<session_id>**: 路径参数可能存在注入风险
  *建议: 确保对所有路径参数进行验证和清理*

- **/api/uuid/session/<session_id>**: 路径参数可能存在注入风险
  *建议: 确保对所有路径参数进行验证和清理*

## 改进建议

1. **统一命名规范**: 建议所有API使用kebab-case命名
2. **减少重复定义**: 合并重复的API端点
3. **加强安全措施**: 为敏感操作添加额外的安全检查
4. **遵循RESTful原则**: 使用HTTP方法表示操作，URL只表示资源
