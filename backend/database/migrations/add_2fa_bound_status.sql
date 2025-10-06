-- ============================================
-- 添加 2FA 绑定状态字段
-- 添加日期：2025-10-06
-- 用途：区分"已绑定"和"已启用"两种状态
-- ============================================

-- 添加 two_factor_bound 字段（是否已绑定）
ALTER TABLE email_whitelist ADD COLUMN two_factor_bound INTEGER DEFAULT 0;

-- 将现有已启用2FA的记录标记为已绑定
UPDATE email_whitelist SET two_factor_bound = 1 WHERE two_factor_enabled = 1;

