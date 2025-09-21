/**
 * Cloudflare Worker - 分级审核服务
 * 适配线上环境的分级审核系统
 */

// 分级审核配置
const AUDIT_LEVELS = {
  level1: {
    name: '一级审核 (宽松)',
    description: '正常运营期，注重用户体验',
    rule_strictness: 0.8,
    ai_threshold: 0.3,
    manual_review_ratio: 0.05,
    enabled_categories: ['POL', 'POR', 'VIO', 'PRI']
  },
  level2: {
    name: '二级审核 (标准)',
    description: '内容质量下降，平衡审核',
    rule_strictness: 1.0,
    ai_threshold: 0.5,
    manual_review_ratio: 0.15,
    enabled_categories: ['POL', 'POR', 'VIO', 'ADV', 'PRI', 'DIS']
  },
  level3: {
    name: '三级审核 (严格)',
    description: '恶意攻击期，严格把控',
    rule_strictness: 1.2,
    ai_threshold: 0.7,
    manual_review_ratio: 0.30,
    enabled_categories: ['POL', 'POR', 'VIO', 'ADV', 'PRI', 'DIS', 'OTH']
  }
};

// 审核规则库
const AUDIT_RULES = {
  POL: [
    { rule_id: 'POL-001', pattern: '习近平|李克强|中央政府|国家主席', severity: 'high' },
    { rule_id: 'POL-002', pattern: '反[政正]府|推翻制度|颠覆国家', severity: 'high' },
    { rule_id: 'POL-003', pattern: '台独|港独|疆独|藏独', severity: 'high' }
  ],
  POR: [
    { rule_id: 'POR-001', pattern: '性交|裸照|黄片|做爱|性爱', severity: 'high' },
    { rule_id: 'POR-002', pattern: '色情|淫秽|三级片|成人电影', severity: 'high' },
    { rule_id: 'POR-003', pattern: '约炮|一夜情|援交|包养', severity: 'medium' }
  ],
  VIO: [
    { rule_id: 'VIO-001', pattern: '杀人|血腥|爆炸|持刀|持枪', severity: 'medium' },
    { rule_id: 'VIO-002', pattern: '自杀|跳楼|割腕|上吊', severity: 'high' },
    { rule_id: 'VIO-003', pattern: '恐怖主义|炸弹|袭击|暴力', severity: 'high' }
  ],
  ADV: [
    { rule_id: 'ADV-001', pattern: '微信号|QQ号|VX|电话|手机', severity: 'medium' },
    { rule_id: 'ADV-002', pattern: '加我|联系我|私聊|扫码', severity: 'low' },
    { rule_id: 'ADV-003', pattern: '代购|刷单|兼职|赚钱', severity: 'medium' }
  ],
  PRI: [
    { rule_id: 'PRI-001', pattern: '\\d{18}|\\d{15}', severity: 'high' },
    { rule_id: 'PRI-002', pattern: '1[3-9]\\d{9}', severity: 'high' },
    { rule_id: 'PRI-003', pattern: '\\d{4}\\s?\\d{4}\\s?\\d{4}\\s?\\d{4}', severity: 'high' }
  ],
  DIS: [
    { rule_id: 'DIS-001', pattern: '垃圾|傻逼|废物|白痴|智障', severity: 'low' },
    { rule_id: 'DIS-002', pattern: '滚蛋|去死|操你|草你', severity: 'medium' },
    { rule_id: 'DIS-003', pattern: '歧视|仇恨|种族|性别', severity: 'medium' }
  ],
  OTH: [
    { rule_id: 'OTH-001', pattern: '测试|test|spam|垃圾信息', severity: 'low' },
    { rule_id: 'OTH-002', pattern: '刷屏|灌水|复制粘贴', severity: 'low' }
  ]
};

// 全局状态管理
let currentAuditLevel = 'level1';
let auditStats = {
  total_submissions: 0,
  violation_count: 0,
  spam_count: 0,
  manual_review_count: 0
};

/**
 * 文本预处理
 */
function preprocessText(text) {
  if (!text) return '';
  
  // 全角半角转换
  text = text.replace(/（/g, '(').replace(/）/g, ')').replace(/，/g, ',');
  
  // 去除干扰字符
  text = text.replace(/[\s\-_\*\.\u200b\u200c\u200d]+/g, '');
  
  // 数字字母替换
  const replacements = {
    '0': 'o', '1': 'l', '3': 'e', '4': 'a', '5': 's',
    '6': 'g', '7': 't', '8': 'b', '9': 'g'
  };
  
  for (const [num, letter] of Object.entries(replacements)) {
    text = text.replace(new RegExp(num, 'g'), letter);
  }
  
  return text.toLowerCase();
}

/**
 * 规则匹配
 */
function matchRule(content, rule) {
  const violations = [];
  
  try {
    const regex = new RegExp(rule.pattern, 'gi');
    const matches = content.matchAll(regex);
    
    for (const match of matches) {
      violations.push({
        rule_id: rule.rule_id,
        category: rule.rule_id.split('-')[0],
        matched_text: match[0],
        severity: rule.severity,
        confidence: 0.8,
        position: match.index
      });
    }
  } catch (error) {
    console.error('正则表达式错误:', rule.pattern, error);
  }
  
  return violations;
}

/**
 * 应用级别规则
 */
function applyLevelRules(content, contentType, level) {
  const violations = [];
  const config = AUDIT_LEVELS[level];
  
  if (!config) return violations;
  
  for (const category of config.enabled_categories) {
    if (!AUDIT_RULES[category]) continue;
    
    for (const rule of AUDIT_RULES[category]) {
      const matches = matchRule(content, rule);
      violations.push(...matches);
    }
  }
  
  return violations;
}

/**
 * 计算风险分数
 */
function calculateRiskScore(violations, strictness = 1.0) {
  if (!violations.length) return 0.0;
  
  const severityWeights = { high: 1.0, medium: 0.6, low: 0.3 };
  let totalScore = 0.0;
  
  for (const violation of violations) {
    const weight = severityWeights[violation.severity] || 0.5;
    totalScore += weight * violation.confidence;
  }
  
  return Math.min(1.0, totalScore * strictness);
}

/**
 * 做出审核决策
 */
function makeDecision(riskScore, violations, level) {
  const config = AUDIT_LEVELS[level];
  
  // 高危违规直接拒绝
  const highSeverityViolations = violations.filter(v => v.severity === 'high');
  if (highSeverityViolations.length > 0) {
    return {
      passed: false,
      action: 'reject',
      requires_manual: false,
      confidence: 0.95,
      reason: 'high_severity_violation'
    };
  }
  
  // 根据风险分数和AI阈值决策
  if (riskScore >= config.ai_threshold) {
    return {
      passed: false,
      action: 'ai_review',
      requires_manual: false,
      confidence: 0.7,
      reason: 'ai_review_required'
    };
  }
  
  // 强制人工审核比例
  if (Math.random() < config.manual_review_ratio) {
    return {
      passed: false,
      action: 'manual_review',
      requires_manual: true,
      confidence: 0.5,
      reason: 'random_manual_review'
    };
  }
  
  // 通过
  return {
    passed: true,
    action: 'approve',
    requires_manual: false,
    confidence: 0.9,
    reason: 'auto_approved'
  };
}

/**
 * 检查内容
 */
function checkContent(content, contentType = 'story', userIP = null) {
  // 预处理内容
  const processedContent = preprocessText(content);
  
  // 应用当前级别的规则
  const violations = applyLevelRules(processedContent, contentType, currentAuditLevel);
  
  // 计算风险分数
  const config = AUDIT_LEVELS[currentAuditLevel];
  const riskScore = calculateRiskScore(violations, config.rule_strictness);
  
  // 做出决策
  const decision = makeDecision(riskScore, violations, currentAuditLevel);
  
  // 更新统计
  updateStats(decision, violations);
  
  return {
    passed: decision.passed,
    action: decision.action,
    requires_manual: decision.requires_manual,
    confidence: decision.confidence,
    reason: decision.reason,
    risk_score: riskScore,
    violations: violations,
    audit_level: currentAuditLevel
  };
}

/**
 * 更新统计
 */
function updateStats(decision, violations) {
  auditStats.total_submissions += 1;
  
  if (violations.length > 0) {
    auditStats.violation_count += 1;
  }
  
  if (decision.requires_manual) {
    auditStats.manual_review_count += 1;
  }
  
  // 检查是否为垃圾内容
  const spamCategories = ['ADV', 'OTH'];
  if (violations.some(v => spamCategories.includes(v.category))) {
    auditStats.spam_count += 1;
  }
  
  // 检查是否需要自动切换级别
  checkAutoLevelSwitch();
}

/**
 * 检查自动级别切换
 */
function checkAutoLevelSwitch() {
  const violationRate = auditStats.violation_count / Math.max(auditStats.total_submissions, 1);
  
  // 升级条件
  if (currentAuditLevel === 'level1') {
    if (violationRate > 0.15 || auditStats.spam_count > 50 || auditStats.manual_review_count > 100) {
      currentAuditLevel = 'level2';
      console.log('自动切换到level2:', auditStats);
    }
  } else if (currentAuditLevel === 'level2') {
    if (violationRate > 0.25 || auditStats.spam_count > 100) {
      currentAuditLevel = 'level3';
      console.log('自动切换到level3:', auditStats);
    }
  }
  
  // 降级条件（简化版）
  if (violationRate < 0.05 && auditStats.total_submissions > 100) {
    if (currentAuditLevel === 'level3') {
      currentAuditLevel = 'level2';
      console.log('自动降级到level2:', auditStats);
    } else if (currentAuditLevel === 'level2') {
      currentAuditLevel = 'level1';
      console.log('自动降级到level1:', auditStats);
    }
  }
}

/**
 * 处理CORS
 */
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  };
}

/**
 * 主处理函数
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // 处理CORS预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders()
      });
    }
    
    try {
      // 路由处理
      if (path === '/api/audit/level') {
        if (request.method === 'GET') {
          // 获取当前审核级别
          const config = AUDIT_LEVELS[currentAuditLevel];
          return new Response(JSON.stringify({
            success: true,
            data: {
              current_level: currentAuditLevel,
              config: {
                config_name: config.name,
                description: config.description,
                rule_strictness: config.rule_strictness,
                ai_threshold: config.ai_threshold,
                manual_review_ratio: config.manual_review_ratio,
                enabled_categories: config.enabled_categories
              },
              auto_switch: true
            },
            message: '获取审核级别成功'
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders() }
          });
        } else if (request.method === 'POST') {
          // 切换审核级别
          const data = await request.json();
          const newLevel = data.level;
          
          if (!AUDIT_LEVELS[newLevel]) {
            return new Response(JSON.stringify({
              success: false,
              error: 'Invalid level',
              message: '无效的审核级别'
            }), {
              status: 400,
              headers: { 'Content-Type': 'application/json', ...corsHeaders() }
            });
          }
          
          const oldLevel = currentAuditLevel;
          currentAuditLevel = newLevel;
          
          return new Response(JSON.stringify({
            success: true,
            data: {
              old_level: oldLevel,
              new_level: newLevel,
              config: AUDIT_LEVELS[newLevel]
            },
            message: `审核级别已切换到${newLevel}`
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders() }
          });
        }
      } else if (path === '/api/audit/test' && request.method === 'POST') {
        // 测试审核
        const data = await request.json();
        const content = data.content || '';
        const contentType = data.content_type || 'story';
        
        if (!content) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Content required',
            message: '内容不能为空'
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders() }
          });
        }
        
        const result = checkContent(content, contentType);
        
        return new Response(JSON.stringify({
          success: true,
          data: result,
          message: '审核测试完成'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() }
        });
      } else if (path === '/api/audit/stats' && request.method === 'GET') {
        // 获取统计信息
        const violationRate = auditStats.violation_count / Math.max(auditStats.total_submissions, 1);
        
        return new Response(JSON.stringify({
          success: true,
          data: {
            current_level: currentAuditLevel,
            current_hour_stats: {
              total_submissions: auditStats.total_submissions,
              violation_count: auditStats.violation_count,
              violation_rate: Math.round(violationRate * 1000) / 10, // 转换为百分比
              spam_count: auditStats.spam_count,
              manual_review_count: auditStats.manual_review_count,
              unique_ips: 0 // 简化实现
            },
            level_configs: AUDIT_LEVELS
          },
          message: '获取审核统计成功'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() }
        });
      } else {
        // 404
        return new Response(JSON.stringify({
          success: false,
          error: 'Not Found',
          message: '接口不存在'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() }
        });
      }
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Internal Server Error',
        message: '服务器内部错误'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() }
      });
    }
  }
};
