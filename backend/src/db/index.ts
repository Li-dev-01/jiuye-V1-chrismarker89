import type { Env } from '../types/api';

// 内存数据库模拟（用于本地开发）
class MockDatabase {
  private data: Map<string, any[]> = new Map();

  constructor() {
    // 初始化表
    this.data.set('users', []);
    this.data.set('questionnaires', []);
    this.data.set('reviews', []);
    this.data.set('user_sessions', []);
    this.data.set('user_content_mappings', []);
    this.data.set('auth_logs', []);
    this.data.set('universal_questionnaire_responses', []);

    // Super Admin 需要的表
    this.data.set('system_config', []);
    this.data.set('admin_operation_logs', []);
    this.data.set('security_events', []);

    // Analytics 需要的表
    this.data.set('questionnaire_responses', []);

    this.data.set('valid_stories', []);

    // 预加载管理员用户数据
    this.data.set('universal_users', [
      {
        uuid: 'super-550e8400-e29b-41d4-a716-446655440000',
        userType: 'super_admin',
        username: 'superadmin',
        password_hash: '5cb96cf6e18e63ba9e269a78eada4fa6:847fa5475ea0d47bed0a390fcd50db859ce38911db93a71d9df8aca49860f23d',
        display_name: '超级管理员',
        role: 'super_admin',
        permissions: '["all_permissions"]',
        profile: '{"language": "zh-CN", "timezone": "Asia/Shanghai"}',
        metadata: '{"loginCount": 0}',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_active_at: new Date().toISOString()
      },
      {
        uuid: 'admin-550e8400-e29b-41d4-a716-446655440001',
        userType: 'admin',
        username: 'admin1',
        password_hash: '2a9ab0f0bd2732509d25255c9a128f88:be58c4a2145fc319e54ea23d4d88ce45b732799428313610f985db29fd5c7fa1',
        display_name: '管理员',
        role: 'admin',
        permissions: '["browse_content", "project_management", "create_reviewer", "manage_users", "view_all_content", "system_settings", "view_all_stats", "review_content", "approve_content", "reject_content"]',
        profile: '{"language": "zh-CN", "timezone": "Asia/Shanghai"}',
        metadata: '{"loginCount": 0}',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_active_at: new Date().toISOString()
      },
      {
        uuid: 'rev-550e8400-e29b-41d4-a716-446655440002',
        userType: 'reviewer',
        username: 'reviewerA',
        password_hash: '816c26f29f207cfa841c097bf7f5096b:bae1f10a51f99af727f1ef50b4ef2fa2558215df593c6fab8bfc50f8a8d18a85',
        display_name: '审核员A',
        role: 'reviewer',
        permissions: '["browse_content", "review_content", "approve_content", "reject_content", "view_review_stats", "manage_review_queue"]',
        profile: '{"language": "zh-CN", "timezone": "Asia/Shanghai"}',
        metadata: '{"loginCount": 0}',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_active_at: new Date().toISOString()
      }
    ]);
  }

  prepare(sql: string) {
    return {
      bind: (...params: any[]) => ({
        all: async () => {
          // 简单的 SQL 解析和执行
          const results = this.executeSQL(sql, params);
          return { results };
        },
        first: async () => {
          const results = this.executeSQL(sql, params);
          return results.length > 0 ? results[0] : null;
        },
        run: async () => {
          const results = this.executeSQL(sql, params);
          const lastRowId = results.length > 0 && results[0].id ? results[0].id : Math.floor(Math.random() * 1000000);
          return {
            success: true,
            meta: {
              changes: results.length,
              last_row_id: lastRowId
            }
          };
        }
      })
    };
  }

  batch(statements: any[]) {
    return Promise.resolve(statements.map(() => ({ success: true })));
  }

  private executeSQL(sql: string, params: any[] = []): any[] {
    // 非常简单的 SQL 模拟
    const sqlLower = sql.toLowerCase();

    // 处理 universal_users 表
    if (sqlLower.includes('universal_users')) {
      if (sqlLower.includes('select')) {
        const users = this.data.get('universal_users') || [];
        if (sqlLower.includes('where identity_hash')) {
          console.log('Searching for identity_hash:', params[0]);
          console.log('Existing users:', users.map(u => ({ uuid: u.uuid, identity_hash: u.identity_hash })));
          const foundUser = users.find(u => u.identity_hash === params[0]);
          console.log('Found user:', foundUser ? foundUser.uuid : 'none');
          return foundUser ? [foundUser] : [];
        }
        if (sqlLower.includes('where username')) {
          console.log('Searching for username:', params[0]);
          console.log('Existing users:', users.map(u => ({ uuid: u.uuid, username: u.username, user_type: u.userType })));
          const foundUser = users.find(u => u.username === params[0]);
          console.log('Found user:', foundUser ? foundUser.uuid : 'none');
          return foundUser ? [foundUser] : [];
        }
        return users;
      }
      if (sqlLower.includes('insert')) {
        const users = this.data.get('universal_users') || [];
        const newUser = {
          uuid: params[0],
          user_type: params[1],
          identity_hash: params[2],
          display_name: params[3],
          role: params[4],
          permissions: params[5],
          profile: params[6],
          metadata: params[7],
          status: params[8],
          created_at: params[9],
          updated_at: params[10],
          last_active_at: params[11]
        };
        users.push(newUser);
        this.data.set('universal_users', users);
        return [newUser];
      }
      if (sqlLower.includes('update')) {
        const users = this.data.get('universal_users') || [];
        const userIndex = users.findIndex(u => u.uuid === params[1]);
        if (userIndex >= 0) {
          users[userIndex].last_active_at = params[0];
          this.data.set('universal_users', users);
        }
        return [];
      }
    }

    // 处理 user_sessions 表
    if (sqlLower.includes('user_sessions')) {
      if (sqlLower.includes('insert')) {
        const sessions = this.data.get('user_sessions') || [];
        const newSession = {
          session_id: params[0],
          user_uuid: params[1],
          session_token: params[2],
          device_fingerprint: params[3],
          ip_address: params[4],
          user_agent: params[5],
          device_info: params[6],
          expires_at: params[7],
          is_active: params[8],
          created_at: params[9],
          updated_at: params[10]
        };
        sessions.push(newSession);
        this.data.set('user_sessions', sessions);
        return [newSession];
      }
    }

    // 处理 auth_logs 表
    if (sqlLower.includes('auth_logs')) {
      if (sqlLower.includes('insert')) {
        const logs = this.data.get('auth_logs') || [];
        const newLog = {
          id: Math.floor(Math.random() * 1000000),
          user_uuid: params[0],
          user_type: params[1],
          action: params[2],
          ip_address: params[3],
          user_agent: params[4],
          device_fingerprint: params[5],
          success: params[6],
          error_message: params[7],
          metadata: params[8],
          created_at: params[9]
        };
        logs.push(newLog);
        this.data.set('auth_logs', logs);
        return [newLog];
      }
    }

    // 处理 questionnaire_responses 表
    if (sqlLower.includes('questionnaire_responses')) {
      if (sqlLower.includes('insert')) {
        const questionnaires = this.data.get('questionnaires') || [];
        const newQuestionnaire = {
          id: Math.floor(Math.random() * 1000000),
          user_id: params[0],
          personal_info: params[1],
          education_info: params[2],
          employment_info: params[3],
          job_search_info: params[4],
          employment_status: params[5],
          status: params[6],
          created_at: params[7],
          updated_at: params[8]
        };
        questionnaires.push(newQuestionnaire);
        this.data.set('questionnaires', questionnaires);
        return [newQuestionnaire];
      }
      if (sqlLower.includes('select')) {
        return this.data.get('questionnaires') || [];
      }
    }

    // 处理 universal_questionnaire_responses 表
    if (sqlLower.includes('universal_questionnaire_responses')) {
      console.log('Processing universal_questionnaire_responses SQL:', sql);
      console.log('Params:', params);
      if (sqlLower.includes('insert')) {
        console.log('Inserting universal questionnaire response');
        const responses = this.data.get('universal_questionnaire_responses') || [];
        const newResponse = {
          id: Math.floor(Math.random() * 1000000),
          questionnaire_id: params[0],
          user_id: params[1],
          response_data: params[2],
          submitted_at: params[3],
          ip_address: params[4],
          user_agent: params[5],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        responses.push(newResponse);
        this.data.set('universal_questionnaire_responses', responses);
        console.log('Inserted response:', newResponse);
        return [newResponse];
      }
      if (sqlLower.includes('select')) {
        const responses = this.data.get('universal_questionnaire_responses') || [];
        // 简单的WHERE条件处理
        if (sqlLower.includes('where questionnaire_id')) {
          const questionnaireId = params[0];
          return responses.filter(r => r.questionnaire_id === questionnaireId);
        }
        return responses;
      }
    }

    // 原有的 users 表处理
    if (sqlLower.includes('users') && !sqlLower.includes('universal_users')) {
      if (sqlLower.includes('select')) {
        return this.data.get('users') || [];
      }
      if (sqlLower.includes('insert')) {
        const users = this.data.get('users') || [];
        const newUser = {
          id: Math.floor(Math.random() * 1000000).toString(),
          username: params[0] || 'test',
          email: params[1] || 'test@example.com',
          password_hash: params[2] || 'hash',
          role: params[3] || 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        users.push(newUser);
        this.data.set('users', users);
        return [newUser];
      }
    }

    // 处理 system_config 表
    if (sqlLower.includes('system_config')) {
      if (sqlLower.includes('select')) {
        const configs = this.data.get('system_config') || [];
        if (sqlLower.includes('where config_key in')) {
          // 简单处理 IN 查询
          const keys = ['project_enabled', 'maintenance_mode', 'emergency_shutdown'];
          return configs.filter(c => keys.includes(c.config_key));
        }
        return configs;
      }
      if (sqlLower.includes('insert or replace')) {
        const configs = this.data.get('system_config') || [];
        const newConfig = {
          config_key: params[0],
          config_value: params[1],
          updated_at: params[2],
          updated_by: params[3]
        };
        // 删除已存在的配置
        const filteredConfigs = configs.filter(c => c.config_key !== params[0]);
        filteredConfigs.push(newConfig);
        this.data.set('system_config', filteredConfigs);
        return [newConfig];
      }
    }

    // 处理 admin_operation_logs 表
    if (sqlLower.includes('admin_operation_logs')) {
      if (sqlLower.includes('select')) {
        const logs = this.data.get('admin_operation_logs') || [];
        if (sqlLower.includes('count(*)')) {
          return [{ total: logs.length }];
        }
        return logs;
      }
      if (sqlLower.includes('insert')) {
        const logs = this.data.get('admin_operation_logs') || [];
        const newLog = {
          id: Math.floor(Math.random() * 1000000),
          operator: params[0],
          operation: params[1],
          target: params[2],
          details: params[3],
          ip_address: params[4],
          created_at: params[5],
          user_agent: ''
        };
        logs.push(newLog);
        this.data.set('admin_operation_logs', logs);
        return [newLog];
      }
    }

    // 处理 security_events 表
    if (sqlLower.includes('security_events')) {
      if (sqlLower.includes('select')) {
        const events = this.data.get('security_events') || [];
        if (sqlLower.includes('count(*)')) {
          // 根据查询条件返回不同的计数
          if (sqlLower.includes('status = \'active\'')) {
            return [{ count: Math.floor(Math.random() * 10) }];
          }
          if (sqlLower.includes('event_type = \'login_failure\'')) {
            return [{ count: Math.floor(Math.random() * 5) }];
          }
          if (sqlLower.includes('event_type = \'ddos_detected\'')) {
            return [{ count: Math.floor(Math.random() * 3) }];
          }
          return [{ count: events.length }];
        }
        return events;
      }
      if (sqlLower.includes('insert')) {
        const events = this.data.get('security_events') || [];
        const newEvent = {
          id: Math.floor(Math.random() * 1000000),
          event_type: params[0],
          severity: params[1],
          source_ip: params[2],
          details: params[3],
          created_at: params[4],
          status: 'active'
        };
        events.push(newEvent);
        this.data.set('security_events', events);
        return [newEvent];
      }
    }

    return [];
  }
}

export class DatabaseService {
  private db: D1Database;

  constructor(db: D1Database) {
    if (!db) {
      throw new Error('D1Database is required. MockDatabase is no longer supported.');
    }
    this.db = db;
  }

  // 执行查询
  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    try {
      const result = await this.db.prepare(sql).bind(...params).all();
      return result.results as T[];
    } catch (error) {
      console.error('Database query error:', error);
      throw new Error('Database query failed');
    }
  }

  // 执行单个查询
  async queryFirst<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    try {
      const result = await this.db.prepare(sql).bind(...params).first();
      return result as T | null;
    } catch (error) {
      console.error('Database query error:', error);
      throw new Error('Database query failed');
    }
  }

  // 执行插入/更新/删除
  async execute(sql: string, params: any[] = []): Promise<D1Result> {
    try {
      console.log('Executing SQL:', sql);
      console.log('With params:', params);
      const result = await this.db.prepare(sql).bind(...params).run();
      console.log('SQL execution result:', result);
      return result;
    } catch (error) {
      console.error('Database execute error:', error);
      console.error('Failed SQL:', sql);
      console.error('Failed params:', params);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      throw new Error(`Database operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 批量执行
  async batch(statements: { sql: string; params?: any[] }[]): Promise<D1Result[]> {
    try {
      const prepared = statements.map(stmt => 
        this.db.prepare(stmt.sql).bind(...(stmt.params || []))
      );
      const results = await this.db.batch(prepared);
      return results;
    } catch (error) {
      console.error('Database batch error:', error);
      throw new Error('Database batch operation failed');
    }
  }

  // 事务处理
  async transaction<T>(callback: (db: DatabaseService) => Promise<T>): Promise<T> {
    // D1 目前不支持显式事务，这里提供一个接口以备将来使用
    return await callback(this);
  }

  // 分页查询
  async paginate<T = any>(
    sql: string, 
    params: any[] = [], 
    page: number = 1, 
    pageSize: number = 10
  ): Promise<{
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    // 获取总数
    const countSql = `SELECT COUNT(*) as count FROM (${sql})`;
    const countResult = await this.queryFirst<{ count: number }>(countSql, params);
    const total = countResult?.count || 0;

    // 获取分页数据
    const offset = (page - 1) * pageSize;
    const paginatedSql = `${sql} LIMIT ? OFFSET ?`;
    const items = await this.query<T>(paginatedSql, [...params, pageSize, offset]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}

// 创建数据库服务实例
export function createDatabaseService(env: Env): DatabaseService {
  if (!env?.DB) {
    throw new Error('D1Database is required. Please ensure DB binding is configured in wrangler.toml');
  }
  return new DatabaseService(env.DB);
}
