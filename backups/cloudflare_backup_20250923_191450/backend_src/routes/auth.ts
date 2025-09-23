import { Hono } from 'hono';
import type { Env, LoginRequest, CreateUserRequest, User, AuthContext } from '../types/api';
import { createDatabaseService } from '../db';
import { createJWTService } from '../utils/jwt';
import { PasswordService } from '../utils/password';
import { authMiddleware } from '../middleware/auth';

export function createAuthRoutes() {
  const auth = new Hono<{ Bindings: Env; Variables: AuthContext }>();

  /**
   * @swagger
   * /api/auth/register:
   *   post:
   *     tags: [Auth]
   *     summary: 用户注册
   *     description: 创建新的用户账户
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               username:
   *                 type: string
   *                 description: 用户名
   *                 example: testuser
   *               email:
   *                 type: string
   *                 format: email
   *                 description: 邮箱地址
   *                 example: test@example.com
   *               password:
   *                 type: string
   *                 description: 密码（至少8位，包含字母和数字）
   *                 example: password123
   *               role:
   *                 type: string
   *                 enum: [user, admin, reviewer]
   *                 description: 用户角色
   *                 default: user
   *             required: [username, email, password]
   *     responses:
   *       201:
   *         description: 注册成功
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/User'
   *       400:
   *         description: 请求参数错误
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       409:
   *         description: 用户名或邮箱已存在
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  // 用户注册
  auth.post('/register', async (c) => {
    try {
      const body = await c.req.json() as CreateUserRequest;
      const { username, email, password, role = 'user' } = body;

      // 验证输入
      if (!username || !email || !password) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: '用户名、邮箱和密码不能为空'
        }, 400);
      }

      // 验证密码强度
      const passwordValidation = PasswordService.validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: `密码强度不足: ${passwordValidation.errors.join(', ')}`
        }, 400);
      }

      const db = createDatabaseService(c.env as Env);

      // 检查用户名是否已存在
      const existingUser = await db.queryFirst<User>(
        'SELECT id FROM users WHERE username = ? OR email = ?',
        [username, email]
      );

      if (existingUser) {
        return c.json({
          success: false,
          error: 'Conflict',
          message: '用户名或邮箱已存在'
        }, 409);
      }

      // 哈希密码
      const passwordHash = await PasswordService.hashPassword(password);

      // 创建用户
      const result = await db.execute(
        'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [username, email, passwordHash, role]
      );

      if (!result.success) {
        throw new Error('Failed to create user');
      }

      // 获取创建的用户信息
      const newUser = await db.queryFirst<User>(
        'SELECT id, username, email, role, created_at, updated_at FROM users WHERE username = ?',
        [username]
      );

      if (!newUser) {
        throw new Error('Failed to retrieve created user');
      }

      // 生成JWT token
      const jwtService = createJWTService(c.env.JWT_SECRET);
      const token = await jwtService.generateToken({
        userId: String(newUser.id),
        username: newUser.username,
        role: newUser.role
      });

      return c.json({
        success: true,
        data: {
          user: newUser,
          token
        },
        message: '注册成功'
      }, 201);

    } catch (error: any) {
      console.error('Registration error:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '注册失败，请稍后重试'
      }, 500);
    }
  });

  // 用户登录
  auth.post('/login', async (c) => {
    try {
      const body = await c.req.json() as LoginRequest;
      const { username, password } = body;

      // 验证输入
      if (!username || !password) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: '用户名和密码不能为空'
        }, 400);
      }

      const db = createDatabaseService(c.env as Env);

      // 查找用户
      const user = await db.queryFirst<User>(
        'SELECT * FROM users WHERE username = ? OR email = ?',
        [username, username]
      );

      if (!user) {
        return c.json({
          success: false,
          error: 'Authentication Failed',
          message: '用户名或密码错误'
        }, 401);
      }

      // 验证密码
      const isPasswordValid = await PasswordService.verifyPassword(password, user.password_hash);
      if (!isPasswordValid) {
        return c.json({
          success: false,
          error: 'Authentication Failed',
          message: '用户名或密码错误'
        }, 401);
      }

      // 生成JWT token
      const jwtService = createJWTService(c.env.JWT_SECRET);
      const token = await jwtService.generateToken({
        userId: String(user.id),
        username: user.username,
        role: user.role
      });

      // 返回用户信息（不包含密码）
      const { password_hash, ...userWithoutPassword } = user;

      return c.json({
        success: true,
        data: {
          user: userWithoutPassword,
          token
        },
        message: '登录成功'
      });

    } catch (error: any) {
      console.error('Login error:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '登录失败，请稍后重试'
      }, 500);
    }
  });

  // 用户登出
  auth.post('/logout', authMiddleware, async (c) => {
    // JWT是无状态的，客户端删除token即可
    // 这里可以记录登出日志
    const user = c.get('user');
    
    // TODO: 记录系统日志
    if (user) {
      console.log(`User ${user.username} logged out`);
    }

    return c.json({
      success: true,
      data: null,
      message: '登出成功'
    });
  });

  // 获取用户信息
  auth.get('/profile', authMiddleware, async (c) => {
    const user = c.get('user');
    
    return c.json({
      success: true,
      data: user,
      message: '获取用户信息成功'
    });
  });

  // 更新用户信息
  auth.put('/profile', authMiddleware, async (c) => {
    try {
      const user = c.get('user');
      const body = await c.req.json();
      const { email } = body;

      // 只允许更新邮箱
      if (!email) {
        return c.json({
          success: false,
          error: 'Validation Error',
          message: '邮箱不能为空'
        }, 400);
      }

      const db = createDatabaseService(c.env as Env);

      // 检查邮箱是否已被其他用户使用
      const existingUser = await db.queryFirst<User>(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, user?.id]
      );

      if (existingUser) {
        return c.json({
          success: false,
          error: 'Conflict',
          message: '邮箱已被其他用户使用'
        }, 409);
      }

      // 更新用户信息
      await db.execute(
        'UPDATE users SET email = ? WHERE id = ?',
        [email, user?.id]
      );

      // 获取更新后的用户信息
      const updatedUser = await db.queryFirst<User>(
        'SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = ?',
        [user?.id]
      );

      return c.json({
        success: true,
        data: updatedUser,
        message: '用户信息更新成功'
      });

    } catch (error: any) {
      console.error('Profile update error:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '更新失败，请稍后重试'
      }, 500);
    }
  });

  // 生成管理员token（临时端点，用于测试）
  auth.post('/admin/generate-token', async (c) => {
    try {
      const { username, password } = await c.req.json();

      // 简单验证（生产环境应该使用更安全的验证）
      if (username === 'admin' && password === 'admin123') {
        const token = `mgmt_token_SUPER_ADMIN_${Date.now()}`;

        return c.json({
          success: true,
          data: {
            token,
            userType: 'SUPER_ADMIN',
            username: 'admin',
            expiresIn: '24h'
          },
          message: '管理员token生成成功'
        });
      } else {
        return c.json({
          success: false,
          error: 'Invalid credentials',
          message: '用户名或密码错误'
        }, 401);
      }
    } catch (error) {
      console.error('Generate admin token error:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error',
        message: '生成token失败'
      }, 500);
    }
  });

  return auth;
}
