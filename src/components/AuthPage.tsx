import React, { useState, useCallback } from 'react';
import { Mail, Lock, Building2, Eye, EyeOff } from 'lucide-react';
import { StaticPages } from './StaticPages';

interface AuthPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (data: {
    email: string;
    password: string;
    companyName: string;
    role: 'buyer' | 'seller';
  }) => Promise<void>;
  showToast: (msg: string) => void;
}

export function AuthPage({ onLogin, onRegister, showToast }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: '', password: '', agreed: false });
  const [registerForm, setRegisterForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    role: 'buyer' as 'buyer' | 'seller',
    agreed: false,
  });

  // 静态页面状态
  const [staticPage, setStaticPage] = useState<'privacy' | 'terms' | null>(null);

  const switchMode = useCallback((toLogin: boolean) => {
    setIsLogin(toLogin);
    setError('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!loginForm.agreed) {
      setError('请阅读并同意用户协议和隐私政策');
      setLoading(false);
      return;
    }

    try {
      await onLogin(loginForm.email, loginForm.password);
      showToast('登录成功！');
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!registerForm.agreed) {
      setError('请阅读并同意用户协议和隐私政策');
      setLoading(false);
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setError('两次输入的密码不一致');
      setLoading(false);
      return;
    }

    try {
      await onRegister({
        email: registerForm.email,
        password: registerForm.password,
        companyName: registerForm.companyName,
        role: registerForm.role,
      });
      showToast('注册成功！');
    } catch (err: any) {
      setError(err.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full bg-white/[0.06] border border-white/[0.1] rounded-xl pl-11 pr-10 py-3 text-white placeholder-white/30 outline-none transition-all duration-200 focus:border-exchange-accent/60 focus:bg-white/[0.08] focus:shadow-[0_0_0_3px_rgba(2,132,199,0.15)]';

  return (
    <div className="w-full">
      <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl shadow-2xl shadow-black/30 overflow-hidden">
        {/* Top accent line */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-exchange-accent/60 to-transparent" />

        {/* Tab Switcher */}
        <div className="relative flex p-1.5 m-4 mb-0 rounded-xl bg-white/[0.04] border border-white/[0.06]">
          <div
            className="absolute top-1.5 bottom-1.5 rounded-lg bg-exchange-accent/20 border border-exchange-accent/30 transition-all duration-300 ease-out"
            style={{
              width: 'calc(50% - 6px)',
              left: isLogin ? '6px' : 'calc(50% + 0px)',
            }}
          />
          <button
            type="button"
            onClick={() => switchMode(true)}
            className={`relative z-10 flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-200 ${
              isLogin ? 'text-exchange-accent' : 'text-white/40 hover:text-white/60'
            }`}
          >
            登录
          </button>
          <button
            type="button"
            onClick={() => switchMode(false)}
            className={`relative z-10 flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-200 ${
              !isLogin ? 'text-exchange-accent' : 'text-white/40 hover:text-white/60'
            }`}
          >
            注册
          </button>
        </div>

        {/* Form Area */}
        <div className="p-5 pt-4 relative overflow-hidden">
          {error && (
            <div className="mb-3 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl flex items-start gap-2">
              <span className="shrink-0 mt-0.5 w-4 h-4 rounded-full bg-red-500/20 flex items-center justify-center text-[10px] font-bold">!</span>
              {error}
            </div>
          )}

          <div className="relative">
            {/* Login Form */}
            {isLogin && (
              <form onSubmit={handleLogin} className="space-y-3 animate-in fade-in duration-200">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-2">
                    邮箱地址
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-white/25 group-focus-within:text-exchange-accent/70 transition-colors" />
                    <input
                      type="email"
                      required
                      placeholder="请输入邮箱"
                      className={inputCls}
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-2">
                    密码
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-white/25 group-focus-within:text-exchange-accent/70 transition-colors" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="请输入密码"
                      className={`${inputCls} !pr-11`}
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/70 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="login-agreed"
                    checked={loginForm.agreed}
                    onChange={(e) => setLoginForm({ ...loginForm, agreed: e.target.checked })}
                    className="mt-1 w-4 h-4 rounded border-gray-600 bg-transparent text-exchange-accent focus:ring-exchange-accent focus:ring-offset-0"
                  />
                  <label htmlFor="login-agreed" className="text-sm text-white/60">
                    我已阅读并同意
                    <button type="button" onClick={() => setStaticPage('terms')} className="text-exchange-accent hover:text-exchange-accent/80 mx-1">《用户协议》</button>
                    和
                    <button type="button" onClick={() => setStaticPage('privacy')} className="text-exchange-accent hover:text-exchange-accent/80 mx-1">《隐私政策》</button>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full py-3 mt-1 bg-exchange-accent text-white font-bold rounded-xl hover:bg-exchange-accent/90 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-exchange-accent/20 hover:shadow-exchange-accent/30 active:scale-[0.98]"
                >
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-exchange-accent to-exchange-blue opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative flex items-center gap-2">
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        登录中...
                      </>
                    ) : (
                      <>登录</>
                    )}
                  </span>
                </button>

                <div className="pt-1 text-center text-xs text-white/40">
                  测试账号: buyer@test.com / seller@test.com | 密码: Test1234
                </div>
              </form>
            )}

            {/* Register Form */}
            {!isLogin && (
              <form onSubmit={handleRegister} className="space-y-2.5 animate-in fade-in duration-200">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-2">
                    邮箱地址
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-white/25 group-focus-within:text-exchange-accent/70 transition-colors" />
                    <input
                      type="email"
                      required
                      placeholder="请输入企业邮箱"
                      className={inputCls}
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-2">
                    公司名称
                  </label>
                  <div className="relative group">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-white/25 group-focus-within:text-exchange-accent/70 transition-colors" />
                    <input
                      type="text"
                      required
                      placeholder="请输入公司全称"
                      className={inputCls}
                      value={registerForm.companyName}
                      onChange={(e) => setRegisterForm({ ...registerForm, companyName: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-2">
                    账户角色
                  </label>
                  <div className="flex gap-3">
                    <label
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border cursor-pointer transition-all duration-200 ${
                        registerForm.role === 'buyer'
                          ? 'border-exchange-accent/50 bg-exchange-accent/10 text-exchange-accent shadow-[0_0_12px_rgba(2,132,199,0.15)]'
                          : 'border-white/[0.08] bg-white/[0.03] text-white/40 hover:border-white/15 hover:text-white/60'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value="buyer"
                        checked={registerForm.role === 'buyer'}
                        onChange={() => setRegisterForm({ ...registerForm, role: 'buyer' })}
                        className="hidden"
                      />
                      <span className="text-sm font-medium">买家</span>
                    </label>
                    <label
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border cursor-pointer transition-all duration-200 ${
                        registerForm.role === 'seller'
                          ? 'border-exchange-accent/50 bg-exchange-accent/10 text-exchange-accent shadow-[0_0_12px_rgba(2,132,199,0.15)]'
                          : 'border-white/[0.08] bg-white/[0.03] text-white/40 hover:border-white/15 hover:text-white/60'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value="seller"
                        checked={registerForm.role === 'seller'}
                        onChange={() => setRegisterForm({ ...registerForm, role: 'seller' })}
                        className="hidden"
                      />
                      <span className="text-sm font-medium">卖家</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-2">
                    密码
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-white/25 group-focus-within:text-exchange-accent/70 transition-colors" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      placeholder="至少8位，含字母和数字"
                      className={`${inputCls} !pr-11`}
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/70 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-2">
                    确认密码
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-white/25 group-focus-within:text-exchange-accent/70 transition-colors" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="再次输入密码"
                      className={`${inputCls} !pr-11`}
                      value={registerForm.confirmPassword}
                      onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/70 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="agreed"
                    checked={registerForm.agreed}
                    onChange={(e) => setRegisterForm({ ...registerForm, agreed: e.target.checked })}
                    className="mt-1 w-4 h-4 rounded border-gray-600 bg-transparent text-exchange-accent focus:ring-exchange-accent focus:ring-offset-0"
                  />
                  <label htmlFor="agreed" className="text-sm text-white/60">
                    我已阅读并同意
                    <button type="button" onClick={() => setStaticPage('terms')} className="text-exchange-accent hover:text-exchange-accent/80 mx-1">《用户协议》</button>
                    和
                    <button type="button" onClick={() => setStaticPage('privacy')} className="text-exchange-accent hover:text-exchange-accent/80 mx-1">《隐私政策》</button>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full py-3 mt-1 bg-exchange-accent text-white font-bold rounded-xl hover:bg-exchange-accent/90 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-exchange-accent/20 hover:shadow-exchange-accent/30 active:scale-[0.98]"
                >
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-exchange-accent to-exchange-blue opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative flex items-center gap-2">
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        注册中...
                      </>
                    ) : (
                      <>立即注册</>
                    )}
                  </span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {staticPage && (
        <StaticPages page={staticPage} onClose={() => setStaticPage(null)} />
      )}
    </div>
  );
}
