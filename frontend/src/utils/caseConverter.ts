/**
 * 字段格式转换工具
 * 符合项目命名规范：前端负责在API封装层进行字段转换
 * snake_case ↔ camelCase
 */

/**
 * 将snake_case转换为camelCase
 */
export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * 将camelCase转换为snake_case
 */
export function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * 递归转换对象的所有键为camelCase
 */
export function camelizeKeys(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => camelizeKeys(item));
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    const camelized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const camelKey = toCamelCase(key);
        camelized[camelKey] = camelizeKeys(obj[key]);
      }
    }
    return camelized;
  }

  return obj;
}

/**
 * 递归转换对象的所有键为snake_case
 */
export function decamelizeKeys(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => decamelizeKeys(item));
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    const decamelized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const snakeKey = toSnakeCase(key);
        decamelized[snakeKey] = decamelizeKeys(obj[key]);
      }
    }
    return decamelized;
  }

  return obj;
}

/**
 * API响应数据转换器
 * 将API返回的snake_case数据转换为前端期望的camelCase
 */
export function transformApiResponse<T = any>(data: any): T {
  console.log('🔄 转换API响应数据:', data);
  const transformed = camelizeKeys(data);
  console.log('✅ 转换后的数据:', transformed);
  return transformed;
}

/**
 * API请求数据转换器
 * 将前端的camelCase数据转换为API期望的snake_case
 */
export function transformApiRequest(data: any): any {
  console.log('🔄 转换API请求数据:', data);
  const transformed = decamelizeKeys(data);
  console.log('✅ 转换后的数据:', transformed);
  return transformed;
}

/**
 * 问卷认证数据专用转换器
 * 处理问卷认证API返回的特殊格式
 */
export function transformQuestionnaireAuthResponse(response: any): any {
  if (!response || !response.data) {
    return response;
  }

  console.log('🔄 转换问卷认证响应:', response);

  const transformedData = {
    ...response,
    data: {
      user: response.data.user ? camelizeKeys(response.data.user) : null,
      session: response.data.session ? camelizeKeys(response.data.session) : null
    }
  };

  console.log('✅ 转换后的问卷认证数据:', transformedData);
  return transformedData;
}
