import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isSubmittingForgot, setIsSubmittingForgot] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/overview');
      return;
    }

    const checkSetup = async () => {
      try {
        const res = await api.get('/users/setup/status');
        if (!res.data.isSetupComplete) {
          navigate('/setup', { replace: true });
        }
      } catch {
        // If the check fails, stay on the login page
      }
    };

    checkSetup();
  }, [isAuthenticated, navigate]);

  // const handleSubmit = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setIsLoading(true);
  //   setTimeout(() => {
  //     login('mock_jwt', {
  //       id: '1',
  //       full_name: 'Admin User',
  //       email: email,
  //       role: 'ADMIN',
  //     });
  //     navigate('/');
  //   }, 1200);
  // };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError(null);

    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });

      login(response.data.access_token, response.data.user);

      navigate('/overview');
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { status?: number; data?: { message?: string | string[] } };
        message: string;
      };
      const errorMsg = axiosError.response?.data?.message || axiosError.message;
      setLoginError(
        Array.isArray(errorMsg) ? errorMsg.join(', ') : (errorMsg as string),
      );
      setPassword('');
      setEmail('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmittingForgot(true);
    setForgotMessage(null);
    setForgotError(null);

    try {
      await api.post('/auth/forgot-password', { email: forgotEmail });
      setForgotMessage(
        'If an account exists with this email, you will receive reset instructions shortly.',
      );
      setForgotEmail('');
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotMessage(null);
      }, 4000);
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { data?: { message?: string | string[] } };
      };
      setForgotError(
        (axiosError.response?.data?.message as string) ||
        'Failed to process request. Please try again.',
      );
    } finally {
      setIsSubmittingForgot(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#ff8000] rounded-full blur-[120px] opacity-20 animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#e49f37] rounded-full blur-[150px] opacity-20" />
      <div className="relative z-10 w-full max-w-[800px] md:h-[500px] flex flex-col md:flex-row bg-white/80 backdrop-blur-xl rounded-[1.5rem] shadow-[0_32px_64px_-16px_rgba(228,159,55,0.2)] border border-white m-4 overflow-hidden">
        <div className="w-full md:w-1/2 bg-[#ff8000] p-8 md:p-10 flex flex-col justify-start text-white relative">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                'radial-gradient(circle, #fff 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />

          <div className="relative z-10">
            <div className="bg-white p-2 rounded-xl inline-block shadow-xl mb-4">
              <img
                src="/hisp.png"
                alt="HISP Logo"
                className="w-9 h-9 rounded-full"
              />
            </div>
            <h1 className="text-2xl font-semibold leading-tight mb-3">
              Intelligence <br /> in Inventory.
            </h1>
            <p className="text-orange-50 font-medium opacity-90 max-w-xs">
              Managing HISP Rwanda's physical assets with precision and
              real-time data insights.
            </p>
          </div>
        </div>

        <div className="w-full md:w-1/2 p-8 md:p-10 bg-white/40 flex flex-col justify-center">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">
              HISP-AMS Login
            </h2>
            <p className="text-slate-500 text-xs font-medium mt-1">
              Access your secure workspace
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="group">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 group-focus-within:text-[#ff8000] transition-colors">
                  Work Email
                </label>
              </div>
              <div className="relative">
                <Mail
                  className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${loginError
                    ? 'text-red-400'
                    : 'text-slate-400 group-focus-within:text-[#ff8000]'
                    }`}
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (loginError) setLoginError(null);
                  }}
                  className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl shadow-sm outline-none focus:ring-4 transition-all font-medium text-slate-700 placeholder:text-slate-300 text-sm ${loginError
                    ? 'border-red-200 focus:ring-red-500/10 focus:border-red-400 bg-red-50/10'
                    : 'border-slate-100 focus:ring-[#ff8000]/10 focus:border-[#ff8000]'
                    }`}
                  placeholder="example@hisp.tech"
                />
              </div>
            </div>

            <div className="group">
              <div className="flex items-center mb-2">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 group-focus-within:text-[#ff8000] transition-colors">
                  Secure Password
                </label>
              </div>
              <div className="relative">
                <Lock
                  className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${loginError
                    ? 'text-red-400'
                    : 'text-slate-400 group-focus-within:text-[#ff8000]'
                    }`}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (loginError) setLoginError(null);
                  }}
                  className={`w-full pl-10 pr-12 py-2.5 bg-white border rounded-xl shadow-sm outline-none focus:ring-4 transition-all font-medium text-slate-700 placeholder:text-slate-300 text-sm ${loginError
                    ? 'border-red-200 focus:ring-red-500/10 focus:border-red-400 bg-red-50/10'
                    : 'border-slate-100 focus:ring-[#ff8000]/10 focus:border-[#ff8000]'
                    }`}
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-[#ff8000] transition-colors rounded-lg"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="flex justify-end mt-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(true);
                    setForgotMessage(null);
                    setForgotError(null);
                  }}
                  className="text-[10px] font-bold text-[#ff8000] hover:text-[#e49f37] transition-colors uppercase tracking-widest"
                >
                  Forgot Password?
                </button>
              </div>
              {loginError && (
                <p className="mt-2 text-[11px] font-bold text-red-500 flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-200">
                  <AlertCircle className="w-3 h-3" />
                  {loginError === 'Invalid email or password'
                    ? 'Authentication failed: Check your email and password.'
                    : loginError}
                </p>
              )}
            </div>

            <button
              disabled={isLoading}
              className="w-full bg-[#ff8000] hover:bg-[#e49f37] text-white font-bold py-3 rounded-xl shadow-[0_20px_40px_-12px_rgba(255,128,0,0.3)] transform active:scale-[0.97] transition-all flex items-center justify-center gap-2 mt-3 text-sm"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign into AMS</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
      <div className="absolute bottom-6 text-center w-full">
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em]">
          Health Information Systems Program — Rwanda
        </p>
      </div>

      {showForgotModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            onClick={() => !isSubmittingForgot && setShowForgotModal(false)}
          />
          <div className="relative w-full max-w-[480px] bg-white rounded-[2.5rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.2)] overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
            <div className="p-10">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-slate-800 tracking-tight mb-2">
                  Reset Password
                </h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-[320px]">
                  Enter your work email address and we'll send you a temporary
                  password.
                </p>
              </div>

              <form onSubmit={handleForgotSubmit} className="space-y-8">
                <div className="group">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-300 mb-3 ml-1">
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-[#ff8000] transition-colors" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="email@hisp.org.rw"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-[#ff8000]/5 focus:bg-white transition-all text-sm font-semibold text-slate-700 placeholder:text-slate-300"
                    />
                  </div>
                </div>

                {forgotMessage && (
                  <div className="p-3 bg-orange-50 border border-orange-100 rounded-xl flex items-start gap-2.5 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-[#ff8000] mt-0.5 shrink-0" />
                    <p className="text-[11px] font-semibold text-orange-700 leading-relaxed">
                      {forgotMessage}
                    </p>
                  </div>
                )}
                {forgotError && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2.5 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                    <p className="text-[11px] font-semibold text-rose-700 leading-relaxed">
                      {forgotError}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotModal(false);
                      setForgotMessage(null);
                      setForgotError(null);
                    }}
                    disabled={isSubmittingForgot}
                    className="px-8 py-3.5 text-slate-500 font-bold text-xs uppercase tracking-widest hover:text-slate-800 hover:bg-slate-50 rounded-2xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingForgot || !forgotEmail}
                    className="flex-1 max-w-[240px] bg-[#ff8000] hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-100 transform active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                  >
                    {isSubmittingForgot ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Send Reset Link
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
