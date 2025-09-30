#!/bin/bash

# 初始化管理员白名单数据库
# 用于创建admin_whitelist表和相关表

echo "🚀 开始初始化管理员白名单数据库..."

# 数据库名称
DB_NAME="college-employment-survey"

# 执行SQL文件
echo "📝 执行数据库Schema..."
npx wrangler d1 execute $DB_NAME --remote --file=./database/admin-account-management-schema.sql

if [ $? -eq 0 ]; then
  echo "✅ 数据库初始化成功！"
  echo ""
  echo "📊 验证数据库表..."
  
  # 验证表是否创建成功
  npx wrangler d1 execute $DB_NAME --remote --command="SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'admin%'"
  
  echo ""
  echo "👥 查看初始超级管理员..."
  npx wrangler d1 execute $DB_NAME --remote --command="SELECT email, role, is_active FROM admin_whitelist WHERE role='super_admin'"
  
  echo ""
  echo "🎉 初始化完成！"
  echo ""
  echo "📋 超级管理员白名单："
  echo "  - chrismarker89@gmail.com"
  echo "  - aibook2099@gmail.com"
  echo "  - justpm2099@gmail.com"
  echo ""
  echo "🔐 下一步："
  echo "  1. 访问 /login-unified 使用统一登录页面"
  echo "  2. 使用Google账号登录（白名单邮箱）"
  echo "  3. 或使用账号密码登录（如果已设置）"
  echo "  4. 超级管理员可访问 /admin/account-management 管理账户"
else
  echo "❌ 数据库初始化失败！"
  exit 1
fi

