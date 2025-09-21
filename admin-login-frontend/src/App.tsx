
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { LoginPage } from './pages/LoginPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { useAuthStore } from './stores/authStore';
import './App.css';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <div className="App">
          <Routes>
            {/* 登录页面 */}
            <Route
              path="/login"
              element={
                isAuthenticated ? <Navigate to="/projects" replace /> : <LoginPage />
              }
            />

            {/* 项目管理页面 */}
            <Route
              path="/projects"
              element={
                isAuthenticated ? <ProjectsPage /> : <Navigate to="/login" replace />
              }
            />

            {/* 默认重定向 */}
            <Route
              path="/"
              element={<Navigate to="/login" replace />}
            />
          </Routes>
        </div>
      </Router>
    </ConfigProvider>
  );
}

export default App;
