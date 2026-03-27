import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      login('mock_jwt', {
        id: '1',
        first_name: 'Admin',
        last_name: 'User',
        email: email,
        role: 'ADMIN',
      });
      navigate('/');
    }, 1000);
  };

  return (
    <div className="min-h-screen w-full flex bg-white font-sans">
      {/* LEFT PANEL */}
      <div className="w-full lg:w-[40%] flex flex-col justify-center px-8 md:px-16 lg:px-24">
        <div className="mb-10 lg:hidden flex items-center gap-3">
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTDiC5rBaWuabdf-FTUqrwzSQ_jrQWw-o3U7g&s"
            alt="HISP Rwanda"
            className="w-12 h-12 rounded-full shadow-sm"
          />
          <h1 className="text-xl font-bold text-hisp-dark tracking-tight">
            HISP-AMS
          </h1>
        </div>

        <div className="max-w-md w-full">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
            Welcome back
          </h2>
          <p className="text-slate-500 mb-8 font-medium">
            Please enter your enterprise credentials to access the system.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-hisp-primary transition-colors" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@hisprwanda.org"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-hisp-primary/20 focus:border-hisp-primary transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-hisp-primary transition-colors" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-hisp-primary/20 focus:border-hisp-primary transition-all font-medium"
                />
              </div>
            </div>

            <button
              disabled={isLoading}
              className="w-full bg-hisp-dark hover:bg-hisp-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-hisp-dark/20 transform active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                'Verifying Identity...'
              ) : (
                <>
                  Login
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 flex items-center gap-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
            <ShieldCheck className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            <p className="text-xs text-emerald-800 font-medium">
              This system is protected by end-to-end encryption and HISP Rwanda
              security protocols.
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="hidden lg:flex lg:w-[60%] bg-hisp-dark relative overflow-hidden items-center justify-center">
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        />

        <div className="relative z-10 flex flex-col items-center text-center p-12">
          <div className="bg-white p-4 rounded-[2.5rem] shadow-2xl mb-8 transform hover:rotate-3 transition-transform duration-500">
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTDiC5rBaWuabdf-FTUqrwzSQ_jrQWw-o3U7g&s"
              alt="HISP Rwanda Official"
              className="w-40 h-40 rounded-full object-contain"
            />
          </div>
          <h1 className="text-white text-4xl font-black tracking-tight mb-4">
            HISP Rwanda
          </h1>
          <p className="text-blue-100/70 text-lg max-w-sm font-medium leading-relaxed">
            Strengthening public health systems through innovative asset
            tracking and data management.
          </p>
        </div>

        {/* Decorative Elements */}
        <div className="absolute bottom-10 right-10 flex items-center gap-2 text-white/30 text-[10px] font-bold tracking-[0.3em] uppercase">
          <span>Integrity</span>
          <div className="w-1 h-1 bg-white/30 rounded-full" />
          <span>Efficiency</span>
          <div className="w-1 h-1 bg-white/30 rounded-full" />
          <span>Security</span>
        </div>
      </div>
    </div>
  );
};
