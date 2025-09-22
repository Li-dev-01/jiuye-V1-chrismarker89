/**
 * 添加管理员到Google OAuth白名单
 * 运行方式: node add-admin-whitelist.js
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库路径（开发环境）
const dbPath = path.join(__dirname, '../.wrangler/state/v3/d1/miniflare-D1DatabaseObject/25eee5bd-9aee-439a-8723-c73bf5f4f3d9.sqlite');

// 管理员列表
const admins = [
  {
    email: 'chrismarker89@gmail.com',
    role: 'super_admin',
    display_name: 'Chris Marker',
    notes: '项目创建者和超级管理员'
  },
  {
    email: 'justpm2099@gmail.com',
    role: 'admin',
    display_name: 'Just PM',
    notes: '项目管理员'
  },
  {
    email: 'AIbook2099@gmail.com',
    role: 'reviewer',
    display_name: 'AI Book',
    notes: '内容审核员'
  }
];

function generateUUID(prefix = 'whitelist') {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`;
}

function addAdminsToWhitelist() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('数据库连接失败:', err.message);
        reject(err);
        return;
      }
      console.log('✅ 数据库连接成功');
    });

    // 开始事务
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      let completed = 0;
      const total = admins.length;

      admins.forEach((admin, index) => {
        const id = generateUUID('admin');
        const now = new Date().toISOString();

        // 检查是否已存在
        db.get(
          'SELECT id FROM google_oauth_whitelist WHERE email = ?',
          [admin.email],
          (err, row) => {
            if (err) {
              console.error(`❌ 检查邮箱 ${admin.email} 失败:`, err.message);
              db.run('ROLLBACK');
              reject(err);
              return;
            }

            if (row) {
              console.log(`⚠️  邮箱 ${admin.email} 已在白名单中，跳过`);
              completed++;
              if (completed === total) {
                db.run('COMMIT', (err) => {
                  if (err) {
                    console.error('❌ 提交事务失败:', err.message);
                    reject(err);
                  } else {
                    console.log('✅ 白名单更新完成');
                    db.close();
                    resolve();
                  }
                });
              }
              return;
            }

            // 插入新记录
            db.run(`
              INSERT INTO google_oauth_whitelist (
                id, email, role, display_name, status, created_at, created_by, notes
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              id,
              admin.email,
              admin.role,
              admin.display_name,
              'active',
              now,
              'system',
              admin.notes
            ], function(err) {
              if (err) {
                console.error(`❌ 添加邮箱 ${admin.email} 失败:`, err.message);
                db.run('ROLLBACK');
                reject(err);
                return;
              }

              console.log(`✅ 成功添加 ${admin.email} (${admin.role})`);
              completed++;

              if (completed === total) {
                db.run('COMMIT', (err) => {
                  if (err) {
                    console.error('❌ 提交事务失败:', err.message);
                    reject(err);
                  } else {
                    console.log('✅ 所有管理员已添加到白名单');
                    db.close();
                    resolve();
                  }
                });
              }
            });
          }
        );
      });
    });
  });
}

// 执行脚本
async function main() {
  try {
    console.log('🚀 开始添加管理员到Google OAuth白名单...');
    console.log('📧 待添加的管理员:');
    admins.forEach(admin => {
      console.log(`   - ${admin.email} (${admin.role}): ${admin.display_name}`);
    });
    console.log('');

    await addAdminsToWhitelist();
    
    console.log('');
    console.log('🎉 管理员白名单配置完成！');
    console.log('');
    console.log('📝 下一步:');
    console.log('   1. 启动开发服务器测试Google OAuth登录');
    console.log('   2. 部署到生产环境');
    console.log('   3. 在生产环境中测试管理员登录');
    
  } catch (error) {
    console.error('❌ 脚本执行失败:', error.message);
    process.exit(1);
  }
}

// 检查是否直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = { addAdminsToWhitelist };
