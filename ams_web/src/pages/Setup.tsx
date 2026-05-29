import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Mail, Lock, User, Phone, Loader2, Shield } from 'lucide-react';
import { api } from '../lib/api';

export const Setup = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Admin and Finance Director');
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const res = await api.get('/users/setup/status');
        if (res.data.isSetupComplete) {
          navigate('/login', { replace: true });
        }
      } catch (err) {
        console.error('Setup status check failed:', err);
      } finally {
        setIsChecking(false);
      }
    };

    checkSetupStatus();
  }, [navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (password.length !== 6) {
      alert('Password must be exactly 6 characters.');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/users/setup/initialize', {
        full_name: fullName,
        email,
        phone_number: phone,
        password,
        role,
        department_id: '00000000-0000-0000-0000-000000000000',
      });

      navigate('/login', { replace: true });
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { status?: number; data?: { message?: string | string[] } };
        message: string;
      };
      const errorMsg = axiosError.response?.data?.message || axiosError.message;
      alert(
        `Setup Failed: ${Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-[#ff8000] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#ff8000] rounded-full blur-[120px] opacity-20 animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#e49f37] rounded-full blur-[150px] opacity-20" />

      <div className="relative z-10 w-full max-w-[860px] flex flex-col md:flex-row bg-white/80 backdrop-blur-xl rounded-[1.5rem] shadow-[0_32px_64px_-16px_rgba(228,159,55,0.2)] border border-white m-4 overflow-hidden">
        <div className="w-full md:w-5/12 bg-[#ff8000] p-8 md:p-10 flex flex-col justify-between text-white relative">
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
              Welcome to <br /> HISP-AMS.
            </h1>
            <p className="text-orange-50 font-medium opacity-90 max-w-xs text-sm">
              This is your first time here. Create a System Admin account to
              initialize the Asset Management platform.
            </p>
          </div>

          <div className="relative z-10 mt-8">
            <div className="flex items-start gap-3 bg-white/10 border border-white/20 rounded-xl p-4">
              <div className="w-2 h-2 rounded-full bg-white mt-1.5 flex-shrink-0" />
              <p className="text-white/80 text-xs leading-relaxed">
                This setup page is only accessible once. After the admin account
                is created, this page will be locked and you will be redirected
                to login.
              </p>
            </div>
          </div>
        </div>

        <div className="w-full md:w-7/12 p-8 md:p-10 bg-white/40 flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">
              Initialize System Admin
            </h2>
            <p className="text-slate-500 text-xs font-medium mt-1">
              This account will have full administrative access
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="group">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 group-focus-within:text-[#ff8000] transition-colors mb-2 block">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#ff8000] transition-colors" />
                <input
                  id="setup-full-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-100 rounded-xl shadow-sm outline-none focus:ring-4 focus:ring-[#ff8000]/10 focus:border-[#ff8000] transition-all font-medium text-slate-700 placeholder:text-slate-300 text-sm"
                  placeholder="e.g. Jean-Pierre Habimana"
                />
              </div>
            </div>

            <div className="group">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 group-focus-within:text-[#ff8000] transition-colors mb-2 block">
                Work Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#ff8000] transition-colors" />
                <input
                  id="setup-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-100 rounded-xl shadow-sm outline-none focus:ring-4 focus:ring-[#ff8000]/10 focus:border-[#ff8000] transition-all font-medium text-slate-700 placeholder:text-slate-300 text-sm"
                  placeholder="admin@hisp.tech"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="group flex-1">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 group-focus-within:text-[#ff8000] transition-colors mb-2 block">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#ff8000] transition-colors" />
                  <input
                    id="setup-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-100 rounded-xl shadow-sm outline-none focus:ring-4 focus:ring-[#ff8000]/10 focus:border-[#ff8000] transition-all font-medium text-slate-700 placeholder:text-slate-300 text-sm"
                    placeholder="+250 788 000 000"
                  />
                </div>
              </div>

              <div className="group flex-1">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 group-focus-within:text-[#ff8000] transition-colors mb-2 flex items-center gap-1">
                  Password
                  <span className="normal-case font-normal text-slate-300">
                    (6 chars)
                  </span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#ff8000] transition-colors" />
                  <input
                    id="setup-password"
                    type="password"
                    required
                    minLength={6}
                    maxLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-100 rounded-xl shadow-sm outline-none focus:ring-4 focus:ring-[#ff8000]/10 focus:border-[#ff8000] transition-all font-medium text-slate-700 placeholder:text-slate-300 text-sm"
                    placeholder="••••••"
                  />
                </div>
              </div>
            </div>

            <div className="group">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 group-focus-within:text-[#ff8000] transition-colors mb-2 block">
                Assign System Role
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  'Admin and Finance Director',
                  'Finance Officer',
                ].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`px-4 py-3 rounded-xl border text-[11px] font-bold transition-all flex items-center gap-3 text-left ${role === r
                        ? 'bg-orange-50 border-[#ff8000] text-[#ff8000] shadow-sm'
                        : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                      }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <Shield className={`w-3.5 h-3.5 ${role === r ? 'text-[#ff8000]' : 'text-slate-300'}`} />
                    </div>
                    <span>{r}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              id="setup-submit"
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#ff8000] hover:bg-[#e49f37] text-white font-bold py-3 rounded-xl shadow-[0_20px_40px_-12px_rgba(255,128,0,0.3)] transform active:scale-[0.97] transition-all flex items-center justify-center gap-2 mt-1 text-sm"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Admin Account</span>
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
    </div>
  );
};
