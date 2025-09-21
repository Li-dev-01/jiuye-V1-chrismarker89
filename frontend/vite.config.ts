import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // 构建优化
  build: {
    // 启用代码分割
    rollupOptions: {
      output: {
        // 手动分包
        manualChunks: {
          // 将 React 相关库打包到一个 chunk
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // 将 Ant Design 打包到一个 chunk
          'antd-vendor': ['antd', '@ant-design/icons'],
          // 将图表库打包到一个 chunk
          'charts-vendor': ['echarts', 'echarts-for-react'],
          // 将状态管理库打包到一个 chunk
          'store-vendor': ['zustand'],
          // 将工具库打包到一个 chunk
          'utils-vendor': ['axios']
        },
        // 为每个 chunk 生成独立的文件名
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },

    // 压缩配置
    minify: 'terser',
    terserOptions: {
      compress: {
        // 移除 console.log
        drop_console: true,
        // 移除 debugger
        drop_debugger: true,
        // 移除无用代码
        dead_code: true
      }
    },

    // 生成 source map
    sourcemap: false,

    // 设置 chunk 大小警告限制
    chunkSizeWarningLimit: 1000,

    // 启用 CSS 代码分割
    cssCodeSplit: true
  },

  // 开发服务器配置
  server: {
    port: 5173,
    open: true,
    cors: true
  },

  // 路径别名
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@pages': resolve(__dirname, 'src/pages'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@stores': resolve(__dirname, 'src/stores'),
      '@assets': resolve(__dirname, 'src/assets')
    }
  },

  // 优化依赖预构建
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'antd',
      '@ant-design/icons',
      'echarts',
      'echarts-for-react',
      'zustand',
      'axios'
    ]
  },

  // 环境变量
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
  }
})
