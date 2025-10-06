#!/bin/bash

echo "🔧 临时禁用2FA以便测试..."
echo ""

# 禁用 chrismarker89@gmail.com 的2FA
npx wrangler d1 execute college-employment-survey --remote --command "UPDATE email_whitelist SET two_factor_enabled = 0 WHERE email = 'chrismarker89@gmail.com';"

echo ""
echo "✅ 2FA已禁用！现在可以测试Google OAuth登录了"
echo ""
echo "📝 测试完成后，可以运行以下命令重新启用2FA："
echo "npx wrangler d1 execute college-employment-survey --remote --command \"UPDATE email_whitelist SET two_factor_enabled = 1 WHERE email = 'chrismarker89@gmail.com';\""

