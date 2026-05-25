import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Mail,
  Lock,
  KeyRound,
  X,
  Eye,
  EyeOff,
  AlertCircle,
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmittingForgot(true);

    try {
      await api.post('/auth/forgot-password', { email: forgotEmail });
      alert(
        'If an account exists with this email, you will receive reset instructions shortly.',
      );
      setShowForgotModal(false);
      setForgotEmail('');
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { data?: { message?: string | string[] } };
      };
      alert(
        (axiosError.response?.data?.message as string) ||
          'Failed to process requirement. Please try again.',
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
                  className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                    loginError
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
                  className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl shadow-sm outline-none focus:ring-4 transition-all font-medium text-slate-700 placeholder:text-slate-300 text-sm ${
                    loginError
                      ? 'border-red-200 focus:ring-red-500/10 focus:border-red-400 bg-red-50/10'
                      : 'border-slate-100 focus:ring-[#ff8000]/10 focus:border-[#ff8000]'
                  }`}
                  placeholder="example@hisp.tech"
                />
              </div>
            </div>

            <div className="group">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 group-focus-within:text-[#ff8000] transition-colors">
                  Secure Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[10px] font-bold text-[#ff8000] hover:text-[#e49f37] transition-colors uppercase tracking-widest"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock
                  className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                    loginError
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
                  className={`w-full pl-10 pr-12 py-2.5 bg-white border rounded-xl shadow-sm outline-none focus:ring-4 transition-all font-medium text-slate-700 placeholder:text-slate-300 text-sm ${
                    loginError
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
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            onClick={() => !isSubmittingForgot && setShowForgotModal(false)}
          />
          <div className="relative w-full max-w-[440px] bg-white/95 backdrop-blur-2xl rounded-[2rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
            {/* Header with Icon */}
            <div className="bg-gradient-to-br from-[#ff8000] to-[#e49f37] p-8 text-white relative overflow-hidden">
              <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="bg-white/20 backdrop-blur-md p-4 rounded-2xl mb-4 border border-white/30 shadow-xl">
                  <KeyRound className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight">
                  Reset Password
                </h3>
                <p className="text-orange-50/80 text-sm font-medium mt-1">
                  Secure access recovery
                </p>
              </div>
              <button
                onClick={() => !isSubmittingForgot && setShowForgotModal(false)}
                className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-white/70" />
              </button>
            </div>

            <div className="p-8">
              <p className="text-slate-500 text-sm leading-relaxed mb-8 text-center px-4">
                Enter your work email address below. We'll send you a temporary
                password to regain access to your workspace.
              </p>

              <form onSubmit={handleForgotSubmit} className="space-y-6">
                <div className="group">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-focus-within:text-[#ff8000] transition-colors">
                      Work Email Address
                    </label>
                  </div>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center border-r border-slate-100">
                      <Mail className="w-4 h-4 text-slate-400 group-focus-within:text-[#ff8000] transition-colors" />
                    </div>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="example@hisp.tech"
                      className="w-full pl-14 pr-4 py-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-[#ff8000]/10 focus:border-[#ff8000] focus:bg-white transition-all text-sm font-semibold text-slate-700 placeholder:text-slate-300"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingForgot}
                    className="w-full bg-gradient-to-r from-[#ff8000] to-[#e49f37] text-white font-bold py-4 rounded-2xl shadow-[0_20px_40px_-10px_rgba(255,128,0,0.4)] hover:shadow-[0_25px_50px_-12px_rgba(255,128,0,0.5)] transform active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    {isSubmittingForgot ? (
                      <div className="w-5 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Request Recovery Code</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    disabled={isSubmittingForgot}
                    className="w-full py-4 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-600 transition-colors"
                  >
                    Back to login
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
