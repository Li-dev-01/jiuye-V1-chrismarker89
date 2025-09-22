#!/usr/bin/env node

/**
 * 批量更新API域名脚本
 * 将所有 chrismarker89.workers.dev 更新为 chrismarker89.workers.dev
 */

const fs = require('fs');
const path = require('path');

class ApiDomainUpdater {
  constructor() {
    this.oldDomain = 'chrismarker89.workers.dev';
    this.newDomain = 'chrismarker89.workers.dev';
    this.updatedFiles = [];
    this.skippedFiles = [];
    this.errors = [];
  }

  /**
   * 开始更新过程
   */
  async run() {
    console.log('🔄 开始批量更新API域名...');
    console.log(`📝 从 ${this.oldDomain} 更新到 ${this.newDomain}`);
    console.log('=' .repeat(60));

    try {
      // 扫描需要更新的文件
      const filesToUpdate = this.scanFiles();
      console.log(`🔍 发现 ${filesToUpdate.length} 个需要更新的文件`);

      // 更新文件
      for (const file of filesToUpdate) {
        await this.updateFile(file);
      }

      // 输出结果
      this.printResults();

    } catch (error) {
      console.error('❌ 更新过程中出现错误:', error);
      process.exit(1);
    }
  }

  /**
   * 扫描需要更新的文件
   */
  scanFiles() {
    const files = [];
    const excludeDirs = ['node_modules', '.git', 'dist', '.wrangler', 'build'];
    const includeExtensions = ['.ts', '.js', '.cjs', '.json', '.toml', '.md', '.sh', '.env'];

    const scanDirectory = (dir) => {
      if (!fs.existsSync(dir)) return;

      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          if (!excludeDirs.includes(item)) {
            scanDirectory(fullPath);
          }
        } else {
          const ext = path.extname(item);
          if (includeExtensions.includes(ext) || item.startsWith('.env')) {
            // 检查文件是否包含旧域名
            try {
              const content = fs.readFileSync(fullPath, 'utf8');
              if (content.includes(this.oldDomain)) {
                files.push(fullPath);
              }
            } catch (error) {
              console.warn(`⚠️  无法读取文件 ${fullPath}: ${error.message}`);
            }
          }
        }
      }
    };

    scanDirectory('.');
    return files;
  }

  /**
   * 更新单个文件
   */
  async updateFile(filePath) {
    try {
      console.log(`📝 更新文件: ${filePath}`);
      
      const content = fs.readFileSync(filePath, 'utf8');
      const originalContent = content;
      
      // 替换域名
      const updatedContent = content.replace(
        new RegExp(this.oldDomain, 'g'),
        this.newDomain
      );

      if (updatedContent !== originalContent) {
        // 备份原文件
        const backupPath = `${filePath}.backup-${Date.now()}`;
        fs.writeFileSync(backupPath, originalContent);
        
        // 写入更新后的内容
        fs.writeFileSync(filePath, updatedContent);
        
        const changeCount = (originalContent.match(new RegExp(this.oldDomain, 'g')) || []).length;
        
        this.updatedFiles.push({
          path: filePath,
          changes: changeCount,
          backup: backupPath
        });
        
        console.log(`  ✅ 更新成功，替换了 ${changeCount} 处`);
      } else {
        this.skippedFiles.push(filePath);
        console.log(`  ⏭️  跳过，无需更新`);
      }

    } catch (error) {
      this.errors.push({
        path: filePath,
        error: error.message
      });
      console.error(`  ❌ 更新失败: ${error.message}`);
    }
  }

  /**
   * 输出更新结果
   */
  printResults() {
    console.log('\n' + '=' .repeat(60));
    console.log('📊 更新结果统计');
    console.log('=' .repeat(60));

    console.log(`✅ 成功更新: ${this.updatedFiles.length} 个文件`);
    console.log(`⏭️  跳过文件: ${this.skippedFiles.length} 个文件`);
    console.log(`❌ 更新失败: ${this.errors.length} 个文件`);

    if (this.updatedFiles.length > 0) {
      console.log('\n📝 更新详情:');
      this.updatedFiles.forEach(file => {
        console.log(`  ${file.path} (${file.changes} 处更改)`);
      });
    }

    if (this.errors.length > 0) {
      console.log('\n❌ 错误详情:');
      this.errors.forEach(error => {
        console.log(`  ${error.path}: ${error.error}`);
      });
    }

    console.log('\n🎉 域名更新完成！');
    console.log('💡 提示: 备份文件已创建，如需回滚请手动恢复');
  }
}

// 运行更新器
const updater = new ApiDomainUpdater();
updater.run().catch(console.error);
