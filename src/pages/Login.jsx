import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Login = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const formatPhoneNumber = (value) => {
    if (!value) return value;
    const phoneNumber = value.replace(/[^\d]/g, '');
    const phoneNumberLength = phoneNumber.length;
    if (phoneNumberLength <= 1) return '+7';
    if (phoneNumberLength <= 4) {
      return `+7 (${phoneNumber.slice(1, 4)}`;
    }
    if (phoneNumberLength <= 7) {
      return `+7 (${phoneNumber.slice(1, 4)}) ${phoneNumber.slice(4, 7)}`;
    }
    if (phoneNumberLength <= 9) {
      return `+7 (${phoneNumber.slice(1, 4)}) ${phoneNumber.slice(4, 7)}-${phoneNumber.slice(7, 9)}`;
    }
    return `+7 (${phoneNumber.slice(1, 4)}) ${phoneNumber.slice(4, 7)}-${phoneNumber.slice(7, 9)}-${phoneNumber.slice(9, 11)}`;
  };

  const handlePhoneChange = (e) => {
    const formattedPhoneNumber = formatPhoneNumber(e.target.value);
    setPhone(formattedPhoneNumber);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Remove formatting before sending to API
    const cleanPhone = phone.replace(/[^\d]/g, '');
    const success = await login(cleanPhone, password);

    if (success) {
      navigate('/dashboard');
    } else {
      setError('Не удалось войти. Проверьте номер телефона и пароль.');
    }
    setLoading(false);
  };

  // Helper to fill demo credentials
  const fillCredentials = (rolePhone) => {
    setPhone(formatPhoneNumber(rolePhone));
    setPassword('123456');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-blue-100/50 blur-3xl"></div>
        <div className="absolute -bottom-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-indigo-100/50 blur-3xl"></div>
      </div>

      <div className="w-full max-w-[420px] bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 sm:p-10 relative z-10 transition-all duration-300 hover:shadow-blue-900/5">

        {/* Header Section */}
        <div className="text-center mb-10">
          <img src="/logo.png" alt="Bauberg Logo" className="h-24 w-auto object-contain mx-auto" />
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="phone" className="block text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">
              Номер телефона
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <input
                id="phone"
                type="text"
                value={phone}
                onChange={handlePhoneChange}
                required
                className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 font-medium"
                placeholder="+7 (707) 000-00-00"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">
              Пароль
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 font-medium"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-sm flex items-start gap-3 shadow-sm">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span className="font-medium">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Вход...
              </span>
            ) : 'Войти в систему'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="text-center mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Быстрый вход (Demo)</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              ['Смет:77011111111', 'estimator'],
              ['Раб:77022222222', 'worker'],
              ['Прораб:77033333333', 'foreman'],
              ['PM:77044444444', 'pm'],
              ['Admin:77055555555', 'admin']
            ].map(([data, prefix]) => {
              const [label, phoneNum] = data.split(':');
              return (
                <button
                  key={prefix}
                  type="button"
                  onClick={() => fillCredentials(phoneNum)}
                  className="px-3 py-2 text-xs font-semibold bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 hover:text-blue-700 border border-transparent hover:border-blue-200 transition-all"
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Footer / Copyright */}
      <div className="absolute bottom-6 text-center w-full pointer-events-none">
        <p className="text-slate-400 text-xs font-medium">© 2026 Bauberg Construction</p>
      </div>
    </div>
  );
};

export default Login;
