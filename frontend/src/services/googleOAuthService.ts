/**
 * Google OAuth服务
 * 处理Google登录的客户端逻辑
 */

// Google OAuth配置
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-google-client-id.apps.googleusercontent.com';
const GOOGLE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/google/callback`;

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  verified_email: boolean;
}

export interface GoogleOAuthConfig {
  clientId: string;
  redirectUri: string;
  scope: string;
  responseType: string;
  includeGrantedScopes: boolean;
}

export class GoogleOAuthService {
  private config: GoogleOAuthConfig;
  private isInitialized = false;

  constructor() {
    this.config = {
      clientId: GOOGLE_CLIENT_ID,
      redirectUri: GOOGLE_REDIRECT_URI,
      scope: 'openid email profile',
      responseType: 'code',
      includeGrantedScopes: true
    };
  }

  /**
   * 初始化Google OAuth
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('Initializing Google OAuth with config:', {
        clientId: this.config.clientId,
        redirectUri: this.config.redirectUri
      });

      // 动态加载Google OAuth脚本
      await this.loadGoogleScript();

      // 初始化Google OAuth客户端
      await new Promise<void>((resolve, reject) => {
        (window as any).gapi.load('auth2', {
          callback: () => {
            console.log('Google auth2 library loaded');
            (window as any).gapi.auth2.init({
              client_id: this.config.clientId,
              scope: this.config.scope
            }).then(() => {
              this.isInitialized = true;
              console.log('Google OAuth initialized successfully');
              resolve();
            }).catch((error: any) => {
              console.error('Google auth2 init failed:', error);
              reject(error);
            });
          },
          onerror: (error: any) => {
            console.error('Failed to load auth2 library:', error);
            reject(error);
          }
        });
      });

    } catch (error) {
      console.error('Failed to initialize Google OAuth:', error);
      throw new Error('Google OAuth初始化失败');
    }
  }

  /**
   * 加载Google OAuth脚本
   */
  private loadGoogleScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      // 检查是否已经加载
      if ((window as any).gapi) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('Google API script loaded successfully');
        resolve();
      };
      script.onerror = (error) => {
        console.error('Failed to load Google API script:', error);
        reject(new Error('Failed to load Google API script'));
      };
      document.head.appendChild(script);
    });
  }

  /**
   * 执行Google登录
   */
  async signIn(): Promise<GoogleUser> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const authInstance = (window as any).gapi.auth2.getAuthInstance();
      const googleUser = await authInstance.signIn({
        scope: this.config.scope
      });

      const profile = googleUser.getBasicProfile();
      const authResponse = googleUser.getAuthResponse();

      // 获取用户信息
      const userData: GoogleUser = {
        id: profile.getId(),
        email: profile.getEmail(),
        name: profile.getName(),
        picture: profile.getImageUrl(),
        verified_email: true
      };

      console.log('Google sign-in successful:', userData);
      return userData;

    } catch (error) {
      console.error('Google sign-in failed:', error);
      throw new Error('Google登录失败');
    }
  }

  /**
   * 执行Google登出
   */
  async signOut(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      const authInstance = (window as any).gapi.auth2.getAuthInstance();
      await authInstance.signOut();
      console.log('Google sign-out successful');
    } catch (error) {
      console.error('Google sign-out failed:', error);
      throw new Error('Google登出失败');
    }
  }

  /**
   * 检查当前登录状态
   */
  async getCurrentUser(): Promise<GoogleUser | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const authInstance = (window as any).gapi.auth2.getAuthInstance();
      const isSignedIn = authInstance.isSignedIn.get();

      if (!isSignedIn) return null;

      const googleUser = authInstance.currentUser.get();
      const profile = googleUser.getBasicProfile();

      return {
        id: profile.getId(),
        email: profile.getEmail(),
        name: profile.getName(),
        picture: profile.getImageUrl(),
        verified_email: true
      };

    } catch (error) {
      console.error('Failed to get current Google user:', error);
      return null;
    }
  }

  /**
   * 生成Google OAuth授权URL（备用方案）
   */
  generateAuthUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scope,
      response_type: this.config.responseType,
      include_granted_scopes: this.config.includeGrantedScopes.toString(),
      state: state || Math.random().toString(36).substring(2)
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * 处理OAuth回调（备用方案）
   */
  async handleCallback(code: string): Promise<GoogleUser> {
    try {
      // 这里应该调用后端API来交换code获取token
      const response = await fetch('/api/auth/google/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code, redirectUri: this.config.redirectUri })
      });

      if (!response.ok) {
        throw new Error('Failed to exchange code for token');
      }

      const data = await response.json();
      return data.user;

    } catch (error) {
      console.error('OAuth callback failed:', error);
      throw new Error('OAuth回调处理失败');
    }
  }

  /**
   * 检查Google OAuth是否可用
   */
  isAvailable(): boolean {
    return !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== 'your-google-client-id.apps.googleusercontent.com');
  }
}

// 创建单例实例
export const googleOAuthService = new GoogleOAuthService();
