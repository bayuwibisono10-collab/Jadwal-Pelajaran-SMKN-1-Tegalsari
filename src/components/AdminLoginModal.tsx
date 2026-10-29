import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  ArrowRight, 
  AlertCircle, 
  User, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  X,
  GraduationCap
} from 'lucide-react';
import { StaffUser, StaffRole } from '../types/schedule';
import { DEFAULT_STAFF_USERS } from '../data/defaultData';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (userRole?: string) => void;
}

export type AdminRoleType = StaffRole;

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [selectedRole, setSelectedRole] = useState<AdminRoleType>('kurikulum');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRoleSelect = (role: AdminRoleType) => {
    setSelectedRole(role);
    setErrorMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    // Load registered staff accounts from localStorage
    let staffList: StaffUser[] = DEFAULT_STAFF_USERS;
    try {
      const saved = localStorage.getItem('smkn1_staff_users_v1');
      if (saved) staffList = JSON.parse(saved);
    } catch (err) {
      console.error(err);
    }

    // Match username and password with active staff accounts
    const matched = staffList.find(
      (s) => s.isActive && s.username.toLowerCase() === cleanUser && s.password === cleanPass
    );

    // Fallback emergency superadmin credentials
    const isMasterFallback = cleanUser === 'admin' && (cleanPass === 'admin123' || cleanPass === 'smkn1tegalsari');

    if (matched || isMasterFallback) {
      const activeRole = matched ? matched.role : selectedRole;
      const activeName = matched ? matched.name : (cleanUser || 'Admin');

      if (rememberMe) {
        localStorage.setItem('smkn1_admin_role', activeRole);
        localStorage.setItem('smkn1_admin_user', activeName);
      } else {
        sessionStorage.setItem('smkn1_admin_role', activeRole);
      }

      setErrorMsg(null);
      setPassword('');
      setUsername('');
      onLoginSuccess(activeRole);
    } else {
      setErrorMsg('Username atau password yang Anda masukkan salah. Silakan coba lagi.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs no-print animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-title"
      >
        {/* Top Header with Branding */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-green-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            title="Tutup Modal"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md p-2 flex items-center justify-center border border-white/20 shadow-inner shrink-0">
              <ShieldCheck className="w-7 h-7 text-emerald-300" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-100 text-[10px] font-bold border border-emerald-400/30 mb-1">
                <GraduationCap className="w-3 h-3 text-emerald-200" />
                <span>SMKN 1 TEGALSARI</span>
              </div>
              <h2 id="login-title" className="text-xl font-black tracking-tight text-white">
                Login Admin
              </h2>
              <p className="text-xs text-emerald-100/90 font-medium">
                Portal Pengelolaan Jadwal KBM & Data Sekolah
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-7 space-y-5">
          
          {/* Role Switcher */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Akses Petugas:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleRoleSelect('kurikulum')}
                className={`py-2 px-2.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                  selectedRole === 'kurikulum'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20 font-bold shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[11px] font-bold">Kurikulum</span>
                  {selectedRole === 'kurikulum' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
                <div className="text-[10px] text-slate-500 font-normal">Akses Penuh</div>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect('piket')}
                className={`py-2 px-2.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                  selectedRole === 'piket'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20 font-bold shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[11px] font-bold">Guru Piket</span>
                  {selectedRole === 'piket' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
                <div className="text-[10px] text-slate-500 font-normal">Pantau KBM</div>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect('operator')}
                className={`py-2 px-2.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                  selectedRole === 'operator'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20 font-bold shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[11px] font-bold">Operator</span>
                  {selectedRole === 'operator' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
                <div className="text-[10px] text-slate-500 font-normal">Data & Cetak</div>
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <p className="font-medium">{errorMsg}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 font-medium"
                  required
                  autoFocus
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 font-medium"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                  title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 hover:text-slate-900">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                />
                <span className="font-medium text-slate-600">Ingat sesi login</span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-700/20"
              >
                <span>Masuk</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

        </div>

        {/* Footer Note */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-400">
          Sistem Terproteksi • SMKN 1 Tegalsari
        </div>

      </div>
    </div>
  );
};
