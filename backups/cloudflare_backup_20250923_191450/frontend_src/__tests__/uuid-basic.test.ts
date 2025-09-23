/**
 * UUID系统基础测试
 */

import { describe, it, expect } from 'vitest';
import { 
  validateAValue, 
  validateBValue, 
  validateABCombination
} from '../utils/crypto';
import { 
  UserType, 
  Permission, 
  ROLE_PERMISSIONS,
  generateUUID,
  parseUUIDInfo
} from '../types/uuid-system';

describe('UUID基础功能测试', () => {
  describe('UUID生成', () => {
    it('应该生成正确格式的匿名用户UUID', () => {
      const uuid = generateUUID(UserType.ANONYMOUS);
      expect(uuid).toMatch(/^anon-\d{8}-/);
      expect(uuid).toContain('-');
    });

    it('应该生成正确格式的半匿名用户UUID', () => {
      const uuid = generateUUID(UserType.SEMI_ANONYMOUS);
      expect(uuid).toMatch(/^semi-\d{8}-/);
    });

    it('应该生成正确格式的管理员UUID', () => {
      const uuid = generateUUID(UserType.ADMIN);
      expect(uuid).toMatch(/^admin-/);
    });
  });

  describe('UUID解析', () => {
    it('应该正确解析匿名用户UUID', () => {
      const uuid = generateUUID(UserType.ANONYMOUS);
      const info = parseUUIDInfo(uuid);
      expect(info.userType).toBe(UserType.ANONYMOUS);
      expect(info.date).toMatch(/^\d{8}$/);
    });

    it('应该正确解析管理员UUID', () => {
      const uuid = generateUUID(UserType.ADMIN);
      const info = parseUUIDInfo(uuid);
      expect(info.userType).toBe(UserType.ADMIN);
    });
  });

  describe('A+B验证', () => {
    it('应该验证正确的A值', () => {
      expect(validateAValue('13812345678')).toBe(true);
      expect(validateAValue('12345678901')).toBe(true);
    });

    it('应该拒绝错误的A值', () => {
      expect(validateAValue('1381234567')).toBe(false); // 10位
      expect(validateAValue('138123456789')).toBe(false); // 12位
      expect(validateAValue('1381234567a')).toBe(false); // 包含字母
    });

    it('应该验证正确的B值', () => {
      expect(validateBValue('1234')).toBe(true);
      expect(validateBValue('123456')).toBe(true);
    });

    it('应该拒绝错误的B值', () => {
      expect(validateBValue('123')).toBe(false); // 3位
      expect(validateBValue('12345')).toBe(false); // 5位
      expect(validateBValue('123a')).toBe(false); // 包含字母
    });

    it('应该验证A+B组合', () => {
      const result1 = validateABCombination('13812345678', '1234');
      expect(result1.valid).toBe(true);
      expect(result1.errors).toHaveLength(0);

      const result2 = validateABCombination('invalid', 'invalid');
      expect(result2.valid).toBe(false);
      expect(result2.errors.length).toBeGreaterThan(0);
    });
  });

  describe('权限系统', () => {
    it('应该正确定义匿名用户权限', () => {
      const permissions = ROLE_PERMISSIONS[UserType.ANONYMOUS];
      expect(permissions).toContain(Permission.BROWSE_CONTENT);
      expect(permissions).toContain(Permission.SUBMIT_QUESTIONNAIRE);
      expect(permissions).not.toContain(Permission.DOWNLOAD_CONTENT);
    });

    it('应该正确定义半匿名用户权限', () => {
      const permissions = ROLE_PERMISSIONS[UserType.SEMI_ANONYMOUS];
      expect(permissions).toContain(Permission.BROWSE_CONTENT);
      expect(permissions).toContain(Permission.DOWNLOAD_CONTENT);
      expect(permissions).toContain(Permission.MANAGE_OWN_CONTENT);
    });

    it('应该正确定义管理员权限', () => {
      const permissions = ROLE_PERMISSIONS[UserType.ADMIN];
      expect(permissions).toContain(Permission.MANAGE_USERS);
      expect(permissions).toContain(Permission.VIEW_ALL_CONTENT);
    });

    it('应该正确定义超级管理员权限', () => {
      const permissions = ROLE_PERMISSIONS[UserType.SUPER_ADMIN];
      expect(permissions).toContain(Permission.ALL_PERMISSIONS);
    });
  });

  describe('错误处理', () => {
    it('应该处理无效的UUID格式', () => {
      expect(() => parseUUIDInfo('invalid-uuid')).toThrow();
      expect(() => parseUUIDInfo('')).toThrow();
      expect(() => parseUUIDInfo('unknown-prefix-uuid')).toThrow();
    });
  });

  describe('边界条件', () => {
    it('应该处理极端日期', () => {
      const pastDate = new Date('1970-01-01');
      const futureDate = new Date('2099-12-31');
      
      expect(() => generateUUID(UserType.ANONYMOUS, pastDate)).not.toThrow();
      expect(() => generateUUID(UserType.ANONYMOUS, futureDate)).not.toThrow();
    });

    it('应该生成唯一的UUID', () => {
      const uuids = new Set();
      for (let i = 0; i < 100; i++) {
        uuids.add(generateUUID(UserType.ANONYMOUS));
      }
      expect(uuids.size).toBe(100);
    });
  });
});

describe('性能测试', () => {
  it('UUID生成应该足够快', () => {
    const start = performance.now();
    
    for (let i = 0; i < 1000; i++) {
      generateUUID(UserType.ANONYMOUS);
    }
    
    const end = performance.now();
    const duration = end - start;
    
    // 1000个UUID生成应该在100ms内完成
    expect(duration).toBeLessThan(100);
  });

  it('应该处理大量并发UUID生成', () => {
    const promises = Array.from({ length: 100 }, () => 
      Promise.resolve(generateUUID(UserType.ANONYMOUS))
    );
    
    return Promise.all(promises).then(uuids => {
      const uniqueUuids = new Set(uuids);
      expect(uniqueUuids.size).toBe(uuids.length);
    });
  });
});
