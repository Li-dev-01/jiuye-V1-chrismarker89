# API测试报告

## 测试概览

- **测试时间**: {{timestamp}}
- **测试环境**: {{environment}}
- **总测试数**: {{totalTests}}
- **通过数**: {{passedTests}}
- **失败数**: {{failedTests}}
- **成功率**: {{successRate}}%

## 测试结果

### 成功的测试

{{#each passedTests}}
- ✅ {{this.name}} - {{this.response.responseTime}}ms
{{/each}}

### 失败的测试

{{#each failedTests}}
- ❌ {{this.name}}
  - **错误**: {{this.error}}
  - **响应时间**: {{this.response.responseTime}}ms
  - **状态码**: {{this.response.code}}
{{/each}}

## 性能统计

- **平均响应时间**: {{averageResponseTime}}ms
- **最快响应**: {{minResponseTime}}ms
- **最慢响应**: {{maxResponseTime}}ms

## 建议

{{#if failedTests}}
### 需要修复的问题

{{#each failedTests}}
1. **{{this.name}}**: {{this.suggestion}}
{{/each}}
{{/if}}

### 性能优化建议

{{#if slowTests}}
{{#each slowTests}}
- **{{this.name}}**: 响应时间{{this.responseTime}}ms，建议优化
{{/each}}
{{/if}}
