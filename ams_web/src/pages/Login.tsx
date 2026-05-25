import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Mail, Lock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isSubmittingForgot, setIsSubmittingForgot] = useState(false);
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
      console.error('Login Error Details:', {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        message: errorMsg,
      });
      alert(
        `Login Failed: ${Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg}`,
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
    } catch (error: any) {
      alert(
        error.response?.data?.message ||
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
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#ff8000] transition-colors" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-100 rounded-xl shadow-sm outline-none focus:ring-4 focus:ring-[#ff8000]/10 focus:border-[#ff8000] transition-all font-medium text-slate-700 placeholder:text-slate-300 text-sm"
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
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#ff8000] transition-colors" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-100 rounded-xl shadow-sm outline-none focus:ring-4 focus:ring-[#ff8000]/10 focus:border-[#ff8000] transition-all font-medium text-slate-700 placeholder:text-slate-300 text-sm"
                  placeholder="••••••••••••"
                />
              </div>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => !isSubmittingForgot && setShowForgotModal(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8">
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                Reset Password
              </h3>
              <p className="text-slate-500 text-sm mb-6">
                Enter your work email address and we'll send you a temporary
                password.
              </p>

              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div className="group">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="email@hisp.org.rw"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-[#ff8000]/10 focus:border-[#ff8000] transition-all text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    disabled={isSubmittingForgot}
                    className="flex-1 px-4 py-3 border border-slate-100 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingForgot}
                    className="flex-3 px-8 py-3 bg-[#ff8000] text-white rounded-xl font-bold text-sm hover:bg-[#e49f37] shadow-lg shadow-orange-200 transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmittingForgot ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      'Send Reset Link'
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
