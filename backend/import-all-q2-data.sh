#!/bin/bash

# 批量导入问卷2测试数据
# 总共8个文件，每个文件125条记录

echo "🚀 开始批量导入问卷2测试数据..."
echo ""

for i in {2..8}; do
  echo "📊 导入第 $i 部分（125条记录）..."
  npx wrangler d1 execute college-employment-survey --remote --file=generated-data-v2/import_q2_test_data_part${i}.sql --yes
  
  if [ $? -eq 0 ]; then
    echo "✅ 第 $i 部分导入成功"
  else
    echo "❌ 第 $i 部分导入失败"
    exit 1
  fi
  
  echo ""
  sleep 2
done

echo "🎉 所有数据导入完成！"
echo ""
echo "📊 验证数据..."
npx wrangler d1 execute college-employment-survey --remote --command="SELECT COUNT(*) as total FROM universal_questionnaire_responses WHERE questionnaire_id = 'questionnaire-v2-2024';"

