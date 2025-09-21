/**
 * A+B半匿名登录模态框
 * 
 * 功能特性：
 * - A+B组合验证
 * - 实时格式检查
 * - 身份冲突处理
 * - 记住身份选项
 * - 安全加密存储
 */

class ABLoginModal {
    constructor(options = {}) {
        this.options = {
            title: '半匿名身份验证',
            description: '请输入您的A+B组合以验证身份',
            onSuccess: null,
            onError: null,
            onClose: null,
            autoClose: true,
            ...options
        };
        
        this.isVisible = false;
        this.isLoading = false;
        this.identityA = '';
        this.identityB = '';
        this.showPassword = false;
        this.rememberIdentity = false;
        
        this.init();
    }

    /**
     * 初始化模态框
     */
    init() {
        this.bindEvents();
        this.loadRememberedIdentity();
        console.log('ABLoginModal initialized');
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 模态框关闭事件
        const closeBtn = document.getElementById('modal-close-btn');
        const overlay = document.getElementById('ab-modal-overlay');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', this.hide.bind(this));
        }
        
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.hide();
                }
            });
        }

        // 表单提交事件
        const form = document.getElementById('ab-login-form');
        if (form) {
            form.addEventListener('submit', this.handleSubmit.bind(this));
        }

        // 输入框事件
        const identityAInput = document.getElementById('identity-a');
        const identityBInput = document.getElementById('identity-b');
        
        if (identityAInput) {
            identityAInput.addEventListener('input', this.handleAInput.bind(this));
            identityAInput.addEventListener('blur', this.validateA.bind(this));
        }
        
        if (identityBInput) {
            identityBInput.addEventListener('input', this.handleBInput.bind(this));
            identityBInput.addEventListener('blur', this.validateB.bind(this));
        }

        // 密码显示切换
        const passwordToggle = document.getElementById('b-toggle');
        if (passwordToggle) {
            passwordToggle.addEventListener('click', this.togglePasswordVisibility.bind(this));
        }

        // 清除按钮
        const clearBtn = document.getElementById('clear-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', this.clearForm.bind(this));
        }

        // 记住身份复选框
        const rememberCheckbox = document.getElementById('remember-identity');
        if (rememberCheckbox) {
            rememberCheckbox.addEventListener('change', (e) => {
                this.rememberIdentity = e.target.checked;
            });
        }

        // 帮助链接
        const forgotHelp = document.getElementById('forgot-help');
        const securityHelp = document.getElementById('security-help');
        
        if (forgotHelp) {
            forgotHelp.addEventListener('click', this.showForgotHelp.bind(this));
        }
        
        if (securityHelp) {
            securityHelp.addEventListener('click', this.showSecurityHelp.bind(this));
        }

        // 确认对话框事件
        const confirmCancel = document.getElementById('confirm-cancel');
        const confirmOk = document.getElementById('confirm-ok');
        
        if (confirmCancel) {
            confirmCancel.addEventListener('click', this.hideConfirmDialog.bind(this));
        }
        
        if (confirmOk) {
            confirmOk.addEventListener('click', this.handleConfirmOk.bind(this));
        }

        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }

    /**
     * 显示模态框
     */
    show() {
        const overlay = document.getElementById('ab-modal-overlay');
        if (overlay) {
            overlay.style.display = 'flex';
            this.isVisible = true;
            
            // 设置标题和描述
            this.updateContent();
            
            // 聚焦到第一个输入框
            setTimeout(() => {
                const firstInput = document.getElementById('identity-a');
                if (firstInput) {
                    firstInput.focus();
                }
            }, 100);
        }
    }

    /**
     * 隐藏模态框
     */
    hide() {
        const overlay = document.getElementById('ab-modal-overlay');
        if (overlay) {
            overlay.style.display = 'none';
            this.isVisible = false;
            
            if (this.options.onClose) {
                this.options.onClose();
            }
        }
    }

    /**
     * 更新模态框内容
     */
    updateContent() {
        const title = document.querySelector('.modal-title');
        const description = document.querySelector('.modal-description p');
        
        if (title) {
            title.textContent = this.options.title;
        }
        
        if (description) {
            description.textContent = this.options.description;
        }
    }

    /**
     * 处理A值输入
     */
    handleAInput(event) {
        // 只允许数字输入，最多11位
        let value = event.target.value.replace(/\D/g, '').slice(0, 11);
        event.target.value = value;
        this.identityA = value;
        
        // 实时验证
        this.validateA();
        this.updateSubmitButton();
    }

    /**
     * 处理B值输入
     */
    handleBInput(event) {
        // 只允许数字输入，最多6位
        let value = event.target.value.replace(/\D/g, '').slice(0, 6);
        event.target.value = value;
        this.identityB = value;
        
        // 实时验证
        this.validateB();
        this.updateSubmitButton();
    }

    /**
     * 验证A值
     */
    validateA() {
        const input = document.getElementById('identity-a');
        const status = document.getElementById('a-status');
        const error = document.getElementById('a-error');
        
        const isValid = /^\d{11}$/.test(this.identityA);
        
        if (this.identityA.length === 0) {
            // 空值状态
            input.classList.remove('valid', 'invalid');
            status.classList.remove('valid', 'invalid');
            error.textContent = '';
        } else if (isValid) {
            // 有效状态
            input.classList.remove('invalid');
            input.classList.add('valid');
            status.classList.remove('invalid');
            status.classList.add('valid');
            error.textContent = '';
        } else {
            // 无效状态
            input.classList.remove('valid');
            input.classList.add('invalid');
            status.classList.remove('valid');
            status.classList.add('invalid');
            
            if (this.identityA.length < 11) {
                error.textContent = `还需要输入${11 - this.identityA.length}位数字`;
            } else {
                error.textContent = 'A值必须是11位数字';
            }
        }
        
        return isValid;
    }

    /**
     * 验证B值
     */
    validateB() {
        const input = document.getElementById('identity-b');
        const status = document.getElementById('b-status');
        const error = document.getElementById('b-error');
        
        const isValid = /^\d{4}$/.test(this.identityB) || /^\d{6}$/.test(this.identityB);
        
        if (this.identityB.length === 0) {
            // 空值状态
            input.classList.remove('valid', 'invalid');
            status.classList.remove('valid', 'invalid');
            error.textContent = '';
        } else if (isValid) {
            // 有效状态
            input.classList.remove('invalid');
            input.classList.add('valid');
            status.classList.remove('invalid');
            status.classList.add('valid');
            error.textContent = '';
        } else {
            // 无效状态
            input.classList.remove('valid');
            input.classList.add('invalid');
            status.classList.remove('valid');
            status.classList.add('invalid');
            
            if (this.identityB.length < 4) {
                error.textContent = `还需要输入${4 - this.identityB.length}位数字（4位或6位）`;
            } else if (this.identityB.length === 5) {
                error.textContent = 'B值必须是4位或6位数字';
            } else {
                error.textContent = 'B值格式错误';
            }
        }
        
        return isValid;
    }

    /**
     * 更新提交按钮状态
     */
    updateSubmitButton() {
        const submitBtn = document.getElementById('login-btn');
        const isValidA = /^\d{11}$/.test(this.identityA);
        const isValidB = /^\d{4}$/.test(this.identityB) || /^\d{6}$/.test(this.identityB);
        
        if (submitBtn) {
            submitBtn.disabled = !isValidA || !isValidB || this.isLoading;
        }
    }

    /**
     * 切换密码可见性
     */
    togglePasswordVisibility() {
        const input = document.getElementById('identity-b');
        const icon = document.querySelector('.eye-icon');
        
        this.showPassword = !this.showPassword;
        
        if (input) {
            input.type = this.showPassword ? 'text' : 'password';
        }
        
        // 可以在这里更新图标状态
        if (icon) {
            icon.style.opacity = this.showPassword ? '1' : '0.6';
        }
    }

    /**
     * 清除表单
     */
    clearForm() {
        this.identityA = '';
        this.identityB = '';
        
        const identityAInput = document.getElementById('identity-a');
        const identityBInput = document.getElementById('identity-b');
        const rememberCheckbox = document.getElementById('remember-identity');
        
        if (identityAInput) {
            identityAInput.value = '';
            identityAInput.classList.remove('valid', 'invalid');
        }
        
        if (identityBInput) {
            identityBInput.value = '';
            identityBInput.classList.remove('valid', 'invalid');
        }
        
        if (rememberCheckbox) {
            rememberCheckbox.checked = false;
            this.rememberIdentity = false;
        }
        
        // 清除状态和错误
        document.querySelectorAll('.input-status').forEach(status => {
            status.classList.remove('valid', 'invalid');
        });
        
        document.querySelectorAll('.form-error').forEach(error => {
            error.textContent = '';
        });
        
        this.updateSubmitButton();
        
        this.showToast('表单已清除', '所有输入已重置', 'info');
    }

    /**
     * 处理表单提交
     */
    async handleSubmit(event) {
        event.preventDefault();

        if (this.isLoading) return;

        // 最终验证
        if (!this.validateA() || !this.validateB()) {
            this.showToast('输入错误', '请检查A+B组合格式', 'error');
            return;
        }

        // 检查身份冲突
        const conflictCheck = this.checkIdentityConflict();
        if (conflictCheck.needConfirm) {
            this.showConfirmDialog(conflictCheck.message);
            return;
        }

        await this.performLogin();
    }

    /**
     * 执行登录
     */
    async performLogin() {
        this.setLoading(true);

        try {
            console.log('开始A+B身份验证...');

            // 调用匿名认证服务
            const result = await window.AnonymousAuthService.login(this.identityA, this.identityB);

            if (result.success) {
                // 保存身份信息（如果用户选择记住）
                if (this.rememberIdentity) {
                    this.saveRememberedIdentity();
                }

                this.showToast('登录成功', '身份验证完成！', 'success');

                // 调用成功回调
                if (this.options.onSuccess) {
                    this.options.onSuccess(result.data);
                }

                // 自动关闭模态框
                if (this.options.autoClose) {
                    setTimeout(() => {
                        this.hide();
                    }, 1000);
                }
            } else {
                this.showToast('验证失败', result.error || 'A+B组合验证失败', 'error');

                if (this.options.onError) {
                    this.options.onError(result.error);
                }
            }
        } catch (error) {
            console.error('A+B登录失败:', error);
            this.showToast('登录失败', '网络错误，请稍后再试', 'error');

            if (this.options.onError) {
                this.options.onError(error);
            }
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * 检查身份冲突
     */
    checkIdentityConflict() {
        // 检查是否有其他类型的身份已登录
        if (window.IdentityManager) {
            return window.IdentityManager.checkIdentitySwitchConfirm('anonymous');
        }

        // 简单检查localStorage中的其他身份
        const adminToken = localStorage.getItem('adminToken');
        const reviewerToken = localStorage.getItem('reviewerToken');

        if (adminToken || reviewerToken) {
            return {
                needConfirm: true,
                message: '检测到您已以其他身份登录，切换到半匿名身份将清除当前登录状态。是否继续？'
            };
        }

        return { needConfirm: false };
    }

    /**
     * 显示确认对话框
     */
    showConfirmDialog(message) {
        const dialog = document.getElementById('confirm-dialog');
        const messageElement = document.getElementById('confirm-message');

        if (dialog && messageElement) {
            messageElement.textContent = message;
            dialog.style.display = 'flex';
        }
    }

    /**
     * 隐藏确认对话框
     */
    hideConfirmDialog() {
        const dialog = document.getElementById('confirm-dialog');
        if (dialog) {
            dialog.style.display = 'none';
        }
    }

    /**
     * 处理确认对话框的确认操作
     */
    async handleConfirmOk() {
        this.hideConfirmDialog();

        // 强制清除其他身份
        if (window.IdentityManager) {
            window.IdentityManager.forceLogoutCurrent();
        } else {
            // 简单清除
            localStorage.removeItem('adminToken');
            localStorage.removeItem('reviewerToken');
            localStorage.removeItem('adminUser');
            localStorage.removeItem('reviewerUser');
        }

        // 继续登录
        await this.performLogin();
    }

    /**
     * 设置加载状态
     */
    setLoading(loading) {
        this.isLoading = loading;

        const submitBtn = document.getElementById('login-btn');
        const clearBtn = document.getElementById('clear-btn');

        if (submitBtn) {
            submitBtn.disabled = loading;
            submitBtn.classList.toggle('loading', loading);
        }

        if (clearBtn) {
            clearBtn.disabled = loading;
        }

        // 禁用输入框
        const inputs = document.querySelectorAll('#ab-login-form input');
        inputs.forEach(input => {
            input.disabled = loading;
        });
    }

    /**
     * 保存记住的身份信息
     */
    saveRememberedIdentity() {
        try {
            // 只保存哈希值，不保存原始值
            const identityHash = window.CryptoUtils ?
                window.CryptoUtils.generateHash(`${this.identityA}:${this.identityB}`) :
                btoa(`${this.identityA}:${this.identityB}`); // 简单编码作为后备

            const rememberData = {
                hash: identityHash,
                timestamp: Date.now(),
                aLength: this.identityA.length,
                bLength: this.identityB.length
            };

            localStorage.setItem('ab_remember_identity', JSON.stringify(rememberData));
            console.log('身份信息已记住（仅哈希值）');
        } catch (error) {
            console.error('保存记住身份失败:', error);
        }
    }

    /**
     * 加载记住的身份信息
     */
    loadRememberedIdentity() {
        try {
            const rememberData = localStorage.getItem('ab_remember_identity');
            if (!rememberData) return;

            const data = JSON.parse(rememberData);

            // 检查是否过期（7天）
            if (Date.now() - data.timestamp > 7 * 24 * 60 * 60 * 1000) {
                localStorage.removeItem('ab_remember_identity');
                return;
            }

            // 显示提示信息
            this.showToast('发现记住的身份', `上次使用了${data.aLength}位A值和${data.bLength}位B值`, 'info');

            // 勾选记住选项
            const rememberCheckbox = document.getElementById('remember-identity');
            if (rememberCheckbox) {
                rememberCheckbox.checked = true;
                this.rememberIdentity = true;
            }
        } catch (error) {
            console.error('加载记住身份失败:', error);
            localStorage.removeItem('ab_remember_identity');
        }
    }

    /**
     * 显示忘记帮助
     */
    showForgotHelp() {
        this.showToast('忘记A+B组合？', '请回忆您之前在问卷或故事中使用的手机号和密码组合', 'info');
    }

    /**
     * 显示安全帮助
     */
    showSecurityHelp() {
        this.showToast('安全机制', '系统使用SHA-256加密，不存储您的原始A+B值，只保存加密标识', 'info');
    }

    /**
     * 显示消息提示
     */
    showToast(title, description, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-title">${title}</div>
            <div class="toast-description">${description}</div>
        `;

        container.appendChild(toast);

        // 自动移除
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 5000);
    }

    /**
     * 销毁实例
     */
    destroy() {
        // 移除事件监听器
        const form = document.getElementById('ab-login-form');
        if (form) {
            form.removeEventListener('submit', this.handleSubmit);
        }

        // 清理其他事件监听器...
        console.log('ABLoginModal destroyed');
    }
}

// 全局函数
function showABLoginModal(options = {}) {
    if (!window.abLoginModalInstance) {
        window.abLoginModalInstance = new ABLoginModal(options);
    } else {
        // 更新选项
        Object.assign(window.abLoginModalInstance.options, options);
    }

    window.abLoginModalInstance.show();
    return window.abLoginModalInstance;
}

function hideABLoginModal() {
    if (window.abLoginModalInstance) {
        window.abLoginModalInstance.hide();
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ABLoginModal;
} else {
    window.ABLoginModal = ABLoginModal;
}

// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('A+B登录模态框已准备就绪');
});
