// API 响应工具函数

import type { ApiResponse } from '../types/api';

// 成功响应
export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    timestamp: Date.now()
  };
}

// 错误响应
export function errorResponse(error: string, statusCode?: number): Response {
  const response: ApiResponse = {
    success: false,
    error,
    timestamp: Date.now()
  };

  return new Response(JSON.stringify(response), {
    status: statusCode || 500,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

// 分页响应
export function paginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
  message?: string
): ApiResponse<{
  items: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}> {
  return {
    success: true,
    data: {
      items,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    },
    message,
    timestamp: Date.now()
  };
}

// JSON 响应
export function jsonResponse<T>(data: ApiResponse<T>, statusCode: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

// 验证请求参数
export function validateRequired(data: any, fields: string[]): string | null {
  for (const field of fields) {
    if (!data[field]) {
      return `Missing required field: ${field}`;
    }
  }
  return null;
}

// 解析分页参数
export function parsePaginationParams(url: URL): { page: number; pageSize: number } {
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('pageSize') || '20')));
  
  return { page, pageSize };
}

// 解析过滤参数
export function parseFilterParams(url: URL): {
  startDate?: string;
  endDate?: string;
  category?: string;
  status?: string;
  search?: string;
} {
  return {
    startDate: url.searchParams.get('startDate') || undefined,
    endDate: url.searchParams.get('endDate') || undefined,
    category: url.searchParams.get('category') || undefined,
    status: url.searchParams.get('status') || undefined,
    search: url.searchParams.get('search') || undefined
  };
}

// 错误处理中间件
export function handleError(error: any): Response {
  console.error('API Error:', error);

  if (error.name === 'ApiError') {
    return errorResponse(error.message, error.statusCode);
  }

  if (error.name === 'ValidationError') {
    return errorResponse(error.message, 400);
  }

  return errorResponse('Internal server error', 500);
}

// CORS 预检请求处理
export function handleCORS(): Response {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}
