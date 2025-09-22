-- Migration: 015_add_admin_whitelist_entries
-- Description: 添加管理员邮箱到Google OAuth白名单
-- Created: 2025-09-22

-- 添加超级管理员: chrismarker89@gmail.com
INSERT OR IGNORE INTO google_oauth_whitelist (
    id, 
    email, 
    role, 
    display_name, 
    status, 
    created_at,
    updated_at,
    created_by, 
    notes
) VALUES (
    'admin_chrismarker89_super',
    'chrismarker89@gmail.com',
    'super_admin',
    'Chris Marker',
    'active',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    'system',
    '项目创建者和超级管理员'
);

-- 添加管理员: justpm2099@gmail.com
INSERT OR IGNORE INTO google_oauth_whitelist (
    id, 
    email, 
    role, 
    display_name, 
    status, 
    created_at,
    updated_at,
    created_by, 
    notes
) VALUES (
    'admin_justpm2099_admin',
    'justpm2099@gmail.com',
    'admin',
    'Just PM',
    'active',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    'system',
    '项目管理员'
);

-- 添加审核员: AIbook2099@gmail.com
INSERT OR IGNORE INTO google_oauth_whitelist (
    id, 
    email, 
    role, 
    display_name, 
    status, 
    created_at,
    updated_at,
    created_by, 
    notes
) VALUES (
    'admin_aibook2099_reviewer',
    'AIbook2099@gmail.com',
    'reviewer',
    'AI Book',
    'active',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    'system',
    '内容审核员'
);

-- 验证插入结果
-- SELECT email, role, display_name, status, created_at 
-- FROM google_oauth_whitelist 
-- WHERE email IN ('chrismarker89@gmail.com', 'justpm2099@gmail.com', 'AIbook2099@gmail.com')
-- ORDER BY role DESC;
