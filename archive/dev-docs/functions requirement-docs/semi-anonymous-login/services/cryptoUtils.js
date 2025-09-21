/**
 * 加密工具服务
 * 
 * 提供A+B组合的安全加密和哈希功能
 */

class CryptoUtils {
    constructor() {
        this.salt = 'college_employment_survey_2024';
        this.algorithm = 'SHA-256';
    }

    /**
     * 生成哈希值
     * @param {string} value - 要哈希的值
     * @returns {Promise<string>} 哈希值
     */
    async generateHash(value) {
        try {
            // 优先使用Web Crypto API
            if (window.crypto && window.crypto.subtle) {
                return await this.generateWebCryptoHash(value);
            } else {
                // 降级到简单哈希
                return this.generateSimpleHash(value);
            }
        } catch (error) {
            console.warn('哈希生成失败，使用简单哈希:', error);
            return this.generateSimpleHash(value);
        }
    }

    /**
     * 使用Web Crypto API生成哈希
     * @param {string} value - 要哈希的值
     * @returns {Promise<string>} 哈希值
     */
    async generateWebCryptoHash(value) {
        const saltedValue = `${value}:${this.salt}`;
        const encoder = new TextEncoder();
        const data = encoder.encode(saltedValue);
        
        const hashBuffer = await crypto.subtle.digest(this.algorithm, data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        return hashHex;
    }

    /**
     * 生成简单哈希（降级方案）
     * @param {string} value - 要哈希的值
     * @returns {string} 哈希值
     */
    generateSimpleHash(value) {
        const saltedValue = `${value}:${this.salt}`;
        let hash = 0;
        
        for (let i = 0; i < saltedValue.length; i++) {
            const char = saltedValue.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 转换为32位整数
        }
        
        return Math.abs(hash).toString(16).padStart(8, '0');
    }

    /**
     * 生成A+B组合的身份哈希
     * @param {string} identityA - A值
     * @param {string} identityB - B值
     * @returns {Promise<string>} 身份哈希
     */
    async generateIdentityHash(identityA, identityB) {
        const combined = `${identityA}:${identityB}`;
        return await this.generateHash(combined);
    }

    /**
     * 生成UUID（基于A+B组合）
     * @param {string} identityA - A值
     * @param {string} identityB - B值
     * @returns {Promise<string>} UUID
     */
    async generateUUID(identityA, identityB) {
        const identityHash = await this.generateIdentityHash(identityA, identityB);
        const timestamp = Date.now().toString(16);
        const random = Math.random().toString(16).substring(2, 10);
        
        // 格式化为UUID格式
        const uuidStr = `${identityHash.substring(0, 8)}-${timestamp.substring(0, 4)}-${timestamp.substring(4, 8)}-${random.substring(0, 4)}-${identityHash.substring(8, 16)}${random.substring(4, 8)}`;
        
        return uuidStr;
    }

    /**
     * 验证A+B组合的哈希
     * @param {string} identityA - A值
     * @param {string} identityB - B值
     * @param {string} expectedHash - 期望的哈希值
     * @returns {Promise<boolean>} 是否匹配
     */
    async verifyIdentityHash(identityA, identityB, expectedHash) {
        const actualHash = await this.generateIdentityHash(identityA, identityB);
        return actualHash === expectedHash;
    }

    /**
     * 生成安全的随机字符串
     * @param {number} length - 字符串长度
     * @returns {string} 随机字符串
     */
    generateRandomString(length = 16) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        
        if (window.crypto && window.crypto.getRandomValues) {
            // 使用加密安全的随机数
            const array = new Uint8Array(length);
            window.crypto.getRandomValues(array);
            
            for (let i = 0; i < length; i++) {
                result += chars[array[i] % chars.length];
            }
        } else {
            // 降级到Math.random
            for (let i = 0; i < length; i++) {
                result += chars[Math.floor(Math.random() * chars.length)];
            }
        }
        
        return result;
    }

    /**
     * 加密敏感数据（用于本地存储）
     * @param {string} data - 要加密的数据
     * @param {string} key - 加密密钥
     * @returns {string} 加密后的数据
     */
    encryptData(data, key = this.salt) {
        try {
            // 简单的XOR加密（仅用于演示，生产环境应使用更强的加密）
            let encrypted = '';
            for (let i = 0; i < data.length; i++) {
                const dataChar = data.charCodeAt(i);
                const keyChar = key.charCodeAt(i % key.length);
                encrypted += String.fromCharCode(dataChar ^ keyChar);
            }
            
            // Base64编码
            return btoa(encrypted);
        } catch (error) {
            console.error('数据加密失败:', error);
            return btoa(data); // 降级到简单编码
        }
    }

    /**
     * 解密敏感数据
     * @param {string} encryptedData - 加密的数据
     * @param {string} key - 解密密钥
     * @returns {string} 解密后的数据
     */
    decryptData(encryptedData, key = this.salt) {
        try {
            // Base64解码
            const encrypted = atob(encryptedData);
            
            // XOR解密
            let decrypted = '';
            for (let i = 0; i < encrypted.length; i++) {
                const encryptedChar = encrypted.charCodeAt(i);
                const keyChar = key.charCodeAt(i % key.length);
                decrypted += String.fromCharCode(encryptedChar ^ keyChar);
            }
            
            return decrypted;
        } catch (error) {
            console.error('数据解密失败:', error);
            return atob(encryptedData); // 降级到简单解码
        }
    }

    /**
     * 生成指纹（用于设备识别）
     * @returns {Promise<string>} 设备指纹
     */
    async generateFingerprint() {
        const components = [
            navigator.userAgent,
            navigator.language,
            screen.width + 'x' + screen.height,
            screen.colorDepth,
            new Date().getTimezoneOffset(),
            navigator.platform,
            navigator.cookieEnabled,
            typeof(window.localStorage),
            typeof(window.sessionStorage)
        ];
        
        const fingerprintString = components.join('|');
        return await this.generateHash(fingerprintString);
    }

    /**
     * 验证数据完整性
     * @param {string} data - 原始数据
     * @param {string} hash - 数据哈希
     * @returns {Promise<boolean>} 数据是否完整
     */
    async verifyDataIntegrity(data, hash) {
        const calculatedHash = await this.generateHash(data);
        return calculatedHash === hash;
    }

    /**
     * 生成时间戳签名
     * @param {string} data - 要签名的数据
     * @param {number} timestamp - 时间戳
     * @returns {Promise<string>} 签名
     */
    async generateTimestampSignature(data, timestamp = Date.now()) {
        const signatureData = `${data}:${timestamp}:${this.salt}`;
        return await this.generateHash(signatureData);
    }

    /**
     * 验证时间戳签名
     * @param {string} data - 原始数据
     * @param {number} timestamp - 时间戳
     * @param {string} signature - 签名
     * @param {number} maxAge - 最大有效期（毫秒）
     * @returns {Promise<boolean>} 签名是否有效
     */
    async verifyTimestampSignature(data, timestamp, signature, maxAge = 24 * 60 * 60 * 1000) {
        // 检查时间戳是否过期
        if (Date.now() - timestamp > maxAge) {
            return false;
        }
        
        // 验证签名
        const expectedSignature = await this.generateTimestampSignature(data, timestamp);
        return expectedSignature === signature;
    }

    /**
     * 安全比较两个字符串（防止时序攻击）
     * @param {string} a - 字符串A
     * @param {string} b - 字符串B
     * @returns {boolean} 是否相等
     */
    secureCompare(a, b) {
        if (a.length !== b.length) {
            return false;
        }
        
        let result = 0;
        for (let i = 0; i < a.length; i++) {
            result |= a.charCodeAt(i) ^ b.charCodeAt(i);
        }
        
        return result === 0;
    }

    /**
     * 获取加密信息
     * @returns {Object} 加密信息
     */
    getCryptoInfo() {
        return {
            algorithm: this.algorithm,
            saltLength: this.salt.length,
            webCryptoSupported: !!(window.crypto && window.crypto.subtle),
            secureRandomSupported: !!(window.crypto && window.crypto.getRandomValues)
        };
    }

    /**
     * 测试加密功能
     * @returns {Promise<Object>} 测试结果
     */
    async testCrypto() {
        const testData = 'test_data_123';
        const testA = '13812345678';
        const testB = '1234';
        
        try {
            const results = {
                hash: await this.generateHash(testData),
                identityHash: await this.generateIdentityHash(testA, testB),
                uuid: await this.generateUUID(testA, testB),
                randomString: this.generateRandomString(16),
                fingerprint: await this.generateFingerprint(),
                encrypted: this.encryptData(testData),
                timestamp: Date.now()
            };
            
            // 验证解密
            const decrypted = this.decryptData(results.encrypted);
            results.decryptionTest = decrypted === testData;
            
            // 验证哈希一致性
            const hashVerify = await this.generateHash(testData);
            results.hashConsistency = results.hash === hashVerify;
            
            return {
                success: true,
                results
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// 创建全局实例
const cryptoUtils = new CryptoUtils();

// 导出服务
if (typeof module !== 'undefined' && module.exports) {
    module.exports = cryptoUtils;
} else {
    window.CryptoUtils = cryptoUtils;
}

// 调试功能
if (typeof window !== 'undefined') {
    window.debugCrypto = {
        testCrypto: () => cryptoUtils.testCrypto(),
        getCryptoInfo: () => cryptoUtils.getCryptoInfo(),
        
        // 测试A+B哈希
        testABHash: async (a, b) => {
            const hash = await cryptoUtils.generateIdentityHash(a, b);
            console.log(`A+B哈希 (${a}/${b}):`, hash);
            return hash;
        },
        
        // 测试UUID生成
        testUUID: async (a, b) => {
            const uuid = await cryptoUtils.generateUUID(a, b);
            console.log(`UUID (${a}/${b}):`, uuid);
            return uuid;
        }
    };
}
