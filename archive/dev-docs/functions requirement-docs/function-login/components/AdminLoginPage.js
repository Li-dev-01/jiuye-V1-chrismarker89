/**
 * 管理员登录页面交互逻辑
 * 
 * 功能特性：
 * - 表单验证
 * - 一键登录
 * - 角色重定向
 * - 错误处理
 * - 状态管理
 */

class AdminLoginPage {
    constructor(options = {}) {
        this.options = {
            container: '#login-container',
            onSuccess: null,
            onError: null,
            redirectEnabled: true,
            ...options
        };
        
        this.isLoading = false;
        this.init();
    }

    /**
     * 初始化登录页面
     */
    init() {
        this.bindEvents();
        this.checkAuthState();
        console.log('AdminLoginPage initialized');
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 表单提交事件
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleFormSubmit.bind(this));
        }

        // 密码显示/隐藏切换
        const passwordToggle = document.getElementById('passwordToggle');
        if (passwordToggle) {
            passwordToggle.addEventListener('click', this.togglePasswordVisibility.bind(this));
        }

        // 一键登录按钮事件
        const quickLoginButtons = document.querySelectorAll('.quick-login-button');
        quickLoginButtons.forEach(button => {
            button.addEventListener('click', this.handleQuickLogin.bind(this));
        });

        // 输入框实时验证
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        
        if (usernameInput) {
            usernameInput.addEventListener('input', this.validateUsername.bind(this));
            usernameInput.addEventListener('blur', this.validateUsername.bind(this));
        }
        
        if (passwordInput) {
            passwordInput.addEventListener('input', this.validatePassword.bind(this));
            passwordInput.addEventListener('blur', this.validatePassword.bind(this));
        }
    }

    /**
     * 检查当前认证状态
     */
    checkAuthState() {
        const token = localStorage.getItem('adminToken');
        const userJson = localStorage.getItem('adminUser');
        
        if (token && userJson) {
            try {
                const user = JSON.parse(userJson);
                console.log('用户已登录:', user);
                
                // 检查登录是否过期（24小时）
                const loginTime = user.loginTime ? new Date(user.loginTime).getTime() : 0;
                const currentTime = new Date().getTime();
                const timeDiff = currentTime - loginTime;
                
                if (loginTime && timeDiff > 24 * 60 * 60 * 1000) {
                    console.log('登录已过期，清除状态');
                    this.clearAuthState();
                    return;
                }
                
                // 如果启用重定向，跳转到对应页面
                if (this.options.redirectEnabled) {
                    this.redirectToRoleDashboard(user.role);
                }
            } catch (error) {
                console.error('解析用户信息失败:', error);
                this.clearAuthState();
            }
        }
    }

    /**
     * 处理表单提交
     */
    async handleFormSubmit(event) {
        event.preventDefault();
        
        if (this.isLoading) return;
        
        const formData = new FormData(event.target);
        const username = formData.get('username').trim();
        const password = formData.get('password').trim();
        
        // 表单验证
        if (!this.validateForm(username, password)) {
            return;
        }
        
        await this.performLogin(username, password);
    }

    /**
     * 处理一键登录
     */
    async handleQuickLogin(event) {
        if (this.isLoading) return;
        
        const role = event.target.dataset.role;
        const account = this.getAccountByRole(role);
        
        if (!account) {
            this.showToast('错误', '未找到对应账号信息', 'error');
            return;
        }
        
        // 填充表单
        this.fillForm(account.username, account.password);
        
        // 显示提示
        this.showToast('账号已填充', `已填充${account.name}账号信息`, 'success');
        
        // 自动登录
        await this.performLogin(account.username, account.password);
    }

    /**
     * 执行登录
     */
    async performLogin(username, password) {
        this.setLoading(true);
        
        try {
            console.log(`尝试登录: ${username}`);
            
            // 调用认证服务
            const result = await window.AuthService.adminLogin(username, password);
            console.log('登录结果:', result);
            
            if (result.success) {
                // 保存认证信息
                this.saveAuthState(result.data);
                
                // 显示成功消息
                this.showToast('登录成功', `欢迎回来，${result.data.user?.name || '管理员'}！`, 'success');
                
                // 调用成功回调
                if (this.options.onSuccess) {
                    this.options.onSuccess(result.data.user);
                }
                
                // 重定向到对应页面
                if (this.options.redirectEnabled) {
                    setTimeout(() => {
                        this.redirectToRoleDashboard(result.data.user?.role || 'admin');
                    }, 1000);
                }
            } else {
                // 显示错误消息
                this.showToast('登录失败', result.error || '用户名或密码错误', 'error');
                
                // 调用错误回调
                if (this.options.onError) {
                    this.options.onError(result.error);
                }
            }
        } catch (error) {
            console.error('登录错误:', error);
            this.showToast('登录失败', '服务器错误，请稍后再试', 'error');
            
            if (this.options.onError) {
                this.options.onError(error);
            }
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * 表单验证
     */
    validateForm(username, password) {
        let isValid = true;
        
        // 验证用户名
        if (!username) {
            this.showFieldError('username', '用户名不能为空');
            isValid = false;
        } else {
            this.clearFieldError('username');
        }
        
        // 验证密码
        if (!password) {
            this.showFieldError('password', '密码不能为空');
            isValid = false;
        } else {
            this.clearFieldError('password');
        }
        
        return isValid;
    }

    /**
     * 验证用户名
     */
    validateUsername() {
        const username = document.getElementById('username').value.trim();
        if (username && username.length < 2) {
            this.showFieldError('username', '用户名至少需要2个字符');
            return false;
        } else {
            this.clearFieldError('username');
            return true;
        }
    }

    /**
     * 验证密码
     */
    validatePassword() {
        const password = document.getElementById('password').value.trim();
        if (password && password.length < 6) {
            this.showFieldError('password', '密码至少需要6个字符');
            return false;
        } else {
            this.clearFieldError('password');
            return true;
        }
    }

    /**
     * 显示字段错误
     */
    showFieldError(fieldName, message) {
        const errorElement = document.getElementById(`${fieldName}Error`);
        if (errorElement) {
            errorElement.textContent = message;
        }
    }

    /**
     * 清除字段错误
     */
    clearFieldError(fieldName) {
        const errorElement = document.getElementById(`${fieldName}Error`);
        if (errorElement) {
            errorElement.textContent = '';
        }
    }

    /**
     * 切换密码可见性
     */
    togglePasswordVisibility() {
        const passwordInput = document.getElementById('password');
        const isPassword = passwordInput.type === 'password';
        
        passwordInput.type = isPassword ? 'text' : 'password';
        
        // 更新图标（如果需要）
        const eyeIcon = document.querySelector('.eye-icon');
        if (eyeIcon) {
            // 可以在这里更新图标状态
        }
    }

    /**
     * 填充表单
     */
    fillForm(username, password) {
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        
        if (usernameInput) usernameInput.value = username;
        if (passwordInput) passwordInput.value = password;
        
        // 清除错误信息
        this.clearFieldError('username');
        this.clearFieldError('password');
    }

    /**
     * 设置加载状态
     */
    setLoading(loading) {
        this.isLoading = loading;
        
        const loginButton = document.getElementById('loginButton');
        const quickLoginButtons = document.querySelectorAll('.quick-login-button');
        
        if (loginButton) {
            loginButton.disabled = loading;
            loginButton.classList.toggle('loading', loading);
        }
        
        quickLoginButtons.forEach(button => {
            button.disabled = loading;
        });
    }

    /**
     * 保存认证状态
     */
    saveAuthState(authData) {
        localStorage.setItem('adminToken', authData.token);
        
        if (authData.user) {
            const userWithTimestamp = {
                ...authData.user,
                loginTime: new Date().toISOString()
            };
            localStorage.setItem('adminUser', JSON.stringify(userWithTimestamp));
        }
        
        console.log('认证状态已保存');
    }

    /**
     * 清除认证状态
     */
    clearAuthState() {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        sessionStorage.removeItem('redirectToRoleDashboard');
        console.log('认证状态已清除');
    }

    /**
     * 根据角色获取账号信息
     */
    getAccountByRole(role) {
        const accounts = {
            admin: {
                username: 'admin1',
                password: 'admin123',
                role: 'admin',
                name: '管理员',
                id: 'admin-001'
            },
            superadmin: {
                username: 'superadmin',
                password: 'admin123',
                role: 'superadmin',
                name: '超级管理员',
                id: 'superadmin-001'
            },
            reviewerA: {
                username: 'reviewerA',
                password: 'admin123',
                role: 'reviewer',
                name: '审核员A',
                id: 'reviewer-A',
                specialties: ['content', 'voice', 'all']
            },
            reviewerB: {
                username: 'reviewerB',
                password: 'admin123',
                role: 'reviewer',
                name: '审核员B',
                id: 'reviewer-B',
                specialties: ['voice', 'all']
            },
            reviewerC: {
                username: 'reviewerC',
                password: 'admin123',
                role: 'reviewer',
                name: '审核员C',
                id: 'reviewer-C',
                specialties: ['all']
            }
        };

        return accounts[role];
    }

    /**
     * 根据角色重定向到对应页面
     */
    redirectToRoleDashboard(role) {
        const redirectPaths = {
            admin: '/admin/dashboard',
            reviewer: '/reviewer/dashboard',
            superadmin: '/superadmin/dashboard'
        };

        const path = redirectPaths[role] || '/admin/dashboard';
        console.log(`重定向到: ${path}`);

        // 设置重定向标志
        if (role === 'superadmin') {
            sessionStorage.setItem('redirectToRoleDashboard', 'true');
        }

        // 使用window.location进行重定向
        window.location.href = path;
    }

    /**
     * 显示消息提示
     */
    showToast(title, description, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-title">${title}</div>
            <div class="toast-description">${description}</div>
        `;

        toastContainer.appendChild(toast);

        // 自动移除提示
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 5000);
    }

    /**
     * 获取所有预置账号
     */
    getPresetAccounts() {
        return [
            this.getAccountByRole('admin'),
            this.getAccountByRole('superadmin'),
            this.getAccountByRole('reviewerA'),
            this.getAccountByRole('reviewerB'),
            this.getAccountByRole('reviewerC')
        ];
    }

    /**
     * 设置自定义账号
     */
    setAccounts(accounts) {
        this.customAccounts = accounts;
    }

    /**
     * 销毁实例
     */
    destroy() {
        // 移除事件监听器
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.removeEventListener('submit', this.handleFormSubmit);
        }

        const passwordToggle = document.getElementById('passwordToggle');
        if (passwordToggle) {
            passwordToggle.removeEventListener('click', this.togglePasswordVisibility);
        }

        const quickLoginButtons = document.querySelectorAll('.quick-login-button');
        quickLoginButtons.forEach(button => {
            button.removeEventListener('click', this.handleQuickLogin);
        });

        console.log('AdminLoginPage destroyed');
    }
}

// 页面加载完成后自动初始化
document.addEventListener('DOMContentLoaded', function() {
    // 检查是否已经有实例
    if (!window.adminLoginPageInstance) {
        window.adminLoginPageInstance = new AdminLoginPage();
    }
});

// 导出类供外部使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminLoginPage;
} else {
    window.AdminLoginPage = AdminLoginPage;
}
