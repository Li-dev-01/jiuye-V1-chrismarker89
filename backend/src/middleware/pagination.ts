/**
 * 分页中间件
 * 支持偏移分页和游标分页
 */

import type { Context, Next } from 'hono';
import type { Env } from '../types/api';

// 分页配置接口
interface PaginationConfig {
  defaultPage?: number; // 默认页码
  defaultPageSize?: number; // 默认页面大小
  maxPageSize?: number; // 最大页面大小
  pageSizeParam?: string; // 页面大小参数名
  pageParam?: string; // 页码参数名
  cursorParam?: string; // 游标参数名
  sortParam?: string; // 排序参数名
  orderParam?: string; // 排序方向参数名
  type?: 'offset' | 'cursor'; // 分页类型
}

// 分页结果接口
interface PaginationResult {
  data: any[];
  pagination: {
    page?: number;
    pageSize: number;
    total?: number;
    totalPages?: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor?: string;
    prevCursor?: string;
  };
}

// 排序配置
interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * 解析分页参数
 */
function parsePaginationParams(c: Context, config: PaginationConfig) {
  const {
    defaultPage = 1,
    defaultPageSize = 20,
    maxPageSize = 100,
    pageSizeParam = 'pageSize',
    pageParam = 'page',
    cursorParam = 'cursor',
    sortParam = 'sort',
    orderParam = 'order',
    type = 'offset'
  } = config;

  // 解析页面大小
  let pageSize = parseInt(c.req.query(pageSizeParam) || defaultPageSize.toString());
  pageSize = Math.min(Math.max(1, pageSize), maxPageSize);

  // 解析页码（偏移分页）
  let page = parseInt(c.req.query(pageParam) || defaultPage.toString());
  page = Math.max(1, page);

  // 解析游标（游标分页）
  const cursor = c.req.query(cursorParam);

  // 解析排序
  const sortField = c.req.query(sortParam);
  const sortOrder = c.req.query(orderParam) as 'asc' | 'desc' || 'asc';

  const sort: SortConfig | null = sortField ? {
    field: sortField,
    direction: sortOrder
  } : null;

  return {
    page,
    pageSize,
    cursor,
    sort,
    type,
    offset: (page - 1) * pageSize
  };
}

/**
 * 生成游标
 */
function generateCursor(item: any, sortField: string): string {
  const value = item[sortField];
  const id = item.id || item._id;
  
  // 使用Base64编码游标
  const cursorData = {
    value,
    id,
    timestamp: Date.now()
  };
  
  return Buffer.from(JSON.stringify(cursorData)).toString('base64');
}

/**
 * 解析游标
 */
function parseCursor(cursor: string): any {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf8');
    return JSON.parse(decoded);
  } catch (error) {
    return null;
  }
}

/**
 * 构建分页响应
 */
function buildPaginationResponse(
  data: any[],
  params: any,
  total?: number
): PaginationResult {
  const { page, pageSize, type, sort } = params;

  if (type === 'cursor') {
    // 游标分页响应
    const hasNext = data.length === pageSize + 1; // 多查询一条判断是否有下一页
    const hasPrev = !!params.cursor;

    if (hasNext) {
      data.pop(); // 移除多查询的那一条
    }

    let nextCursor: string | undefined;
    let prevCursor: string | undefined;

    if (hasNext && data.length > 0 && sort) {
      nextCursor = generateCursor(data[data.length - 1], sort.field);
    }

    if (hasPrev && data.length > 0 && sort) {
      prevCursor = generateCursor(data[0], sort.field);
    }

    return {
      data,
      pagination: {
        pageSize,
        hasNext,
        hasPrev,
        nextCursor,
        prevCursor
      }
    };
  } else {
    // 偏移分页响应
    const totalPages = total ? Math.ceil(total / pageSize) : undefined;
    const hasNext = total ? page < totalPages! : data.length === pageSize;
    const hasPrev = page > 1;

    return {
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNext,
        hasPrev
      }
    };
  }
}

/**
 * 分页中间件
 */
export function pagination(config: PaginationConfig = {}) {
  return async (c: Context, next: Next) => {
    // 只处理GET请求
    if (c.req.method !== 'GET') {
      await next();
      return;
    }

    const params = parsePaginationParams(c, config);
    
    // 将分页参数添加到上下文
    c.set('pagination', params);

    await next();
  };
}

/**
 * 应用分页到数据
 */
export function applyPagination(
  data: any[],
  params: any,
  total?: number
): PaginationResult {
  return buildPaginationResponse(data, params, total);
}

/**
 * 数据库查询助手（偏移分页）
 */
export function getOffsetPaginationQuery(params: any) {
  const { offset, pageSize, sort } = params;
  
  let query = `LIMIT ${pageSize} OFFSET ${offset}`;
  
  if (sort) {
    query = `ORDER BY ${sort.field} ${sort.direction.toUpperCase()} ${query}`;
  }
  
  return query;
}

/**
 * 数据库查询助手（游标分页）
 */
export function getCursorPaginationQuery(params: any) {
  const { pageSize, cursor, sort } = params;
  
  if (!sort) {
    throw new Error('游标分页需要指定排序字段');
  }

  let query = `ORDER BY ${sort.field} ${sort.direction.toUpperCase()} LIMIT ${pageSize + 1}`;
  
  if (cursor) {
    const cursorData = parseCursor(cursor);
    if (cursorData) {
      const operator = sort.direction === 'asc' ? '>' : '<';
      query = `WHERE ${sort.field} ${operator} '${cursorData.value}' ${query}`;
    }
  }
  
  return query;
}

/**
 * 预定义的分页配置
 */
export const paginationConfigs = {
  // 默认分页 - 20条/页
  default: {
    defaultPageSize: 20,
    maxPageSize: 100,
    type: 'offset' as const
  },
  
  // 小分页 - 10条/页
  small: {
    defaultPageSize: 10,
    maxPageSize: 50,
    type: 'offset' as const
  },
  
  // 大分页 - 50条/页
  large: {
    defaultPageSize: 50,
    maxPageSize: 200,
    type: 'offset' as const
  },
  
  // 游标分页 - 适合大数据集
  cursor: {
    defaultPageSize: 20,
    maxPageSize: 100,
    type: 'cursor' as const,
    sortParam: 'sort',
    orderParam: 'order'
  },
  
  // 管理员分页 - 更大的页面
  admin: {
    defaultPageSize: 50,
    maxPageSize: 500,
    type: 'offset' as const
  }
};

/**
 * 分页工具函数
 */
export const PaginationUtils = {
  // 验证分页参数
  validateParams(params: any): boolean {
    const { page, pageSize } = params;
    return page > 0 && pageSize > 0 && pageSize <= 500;
  },

  // 计算总页数
  calculateTotalPages(total: number, pageSize: number): number {
    return Math.ceil(total / pageSize);
  },

  // 生成分页链接
  generateLinks(baseUrl: string, params: any, total?: number) {
    const { page, pageSize } = params;
    const totalPages = total ? this.calculateTotalPages(total, pageSize) : null;
    
    const links: any = {};
    
    // 当前页
    links.self = `${baseUrl}?page=${page}&pageSize=${pageSize}`;
    
    // 第一页
    links.first = `${baseUrl}?page=1&pageSize=${pageSize}`;
    
    // 上一页
    if (page > 1) {
      links.prev = `${baseUrl}?page=${page - 1}&pageSize=${pageSize}`;
    }
    
    // 下一页
    if (!totalPages || page < totalPages) {
      links.next = `${baseUrl}?page=${page + 1}&pageSize=${pageSize}`;
    }
    
    // 最后一页
    if (totalPages) {
      links.last = `${baseUrl}?page=${totalPages}&pageSize=${pageSize}`;
    }
    
    return links;
  },

  // 获取分页元数据
  getMetadata(params: any, total?: number) {
    const { page, pageSize } = params;
    const totalPages = total ? this.calculateTotalPages(total, pageSize) : null;
    
    return {
      currentPage: page,
      pageSize,
      total,
      totalPages,
      hasNext: !totalPages || page < totalPages,
      hasPrev: page > 1,
      startIndex: (page - 1) * pageSize + 1,
      endIndex: Math.min(page * pageSize, total || page * pageSize)
    };
  }
};

/**
 * 分页响应包装器
 */
export function paginatedResponse(
  c: Context,
  data: any[],
  total?: number,
  meta?: any
): Response {
  const params = c.get('pagination');
  const result = applyPagination(data, params, total);
  
  // 添加额外的元数据
  if (meta) {
    result.pagination = { ...result.pagination, ...meta };
  }
  
  // 添加分页链接
  const baseUrl = new URL(c.req.url).pathname;
  const links = PaginationUtils.generateLinks(baseUrl, params, total);
  
  return c.json({
    success: true,
    ...result,
    links
  });
}
