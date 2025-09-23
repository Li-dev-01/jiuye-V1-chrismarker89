/**
 * 错误边界组件导出
 */

export { ErrorBoundary, withErrorBoundary, useErrorHandler } from './ErrorBoundary';
export { errorHandler, handleApiError, handleNetworkError, handleValidationError } from '../../utils/errorHandler';
export type { ErrorReport, ApiError } from '../../utils/errorHandler';
