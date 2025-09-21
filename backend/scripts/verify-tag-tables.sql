-- 验证标签管理表结构和数据
-- 执行此脚本来检查标签系统是否正确部署

-- 1. 检查表是否存在
.tables

-- 2. 查看content_tags表结构
.schema content_tags

-- 3. 查看content_tag_relations表结构  
.schema content_tag_relations

-- 4. 检查默认标签数据
SELECT 
    tag_key, tag_name, tag_type, content_type, is_active
FROM content_tags 
ORDER BY content_type, tag_type;

-- 5. 验证索引
.indices content_tags
.indices content_tag_relations

-- 6. 测试标签查询性能
EXPLAIN QUERY PLAN 
SELECT ct.*, COUNT(ctr.id) as usage_count
FROM content_tags ct
LEFT JOIN content_tag_relations ctr ON ct.id = ctr.tag_id
WHERE ct.content_type IN ('story', 'all')
GROUP BY ct.id;

-- 7. 检查约束
PRAGMA foreign_key_list(content_tag_relations);
PRAGMA index_list(content_tags);
