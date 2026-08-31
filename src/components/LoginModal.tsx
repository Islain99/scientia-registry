import React, { useState } from 'react';
import { GraduationCap, Mail, Lock, User, LogIn, UserPlus, RefreshCw, AlertCircle } from 'lucide-react';
import { authService, UserPublic } from '../services/authService';

interface LoginModalProps {
  onSuccess: (user: UserPublic) => void;
}

type Mode = 'login' | 'register';

export const LoginModal: React.FC<LoginModalProps> = ({ onSuccess }) => {
  const [mode, setMode]         = useState<Mode>('login');
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [registered, setRegistered] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const user = await authService.login(email, password);
        onSuccess(user);
      } else {
        await authService.register(name, email, password);
        setRegistered(true);
        setMode('login');
        setName('');
        setPassword('');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/70 backdrop-blur-md">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">

        {/* Header */}
        <div className="bg-indigo-600 p-8 text-center">
          <GraduationCap size={40} className="mx-auto text-white mb-3" />
          <h1 className="text-2xl font-black text-white">Scientia Registry</h1>
          <p className="text-indigo-200 text-sm mt-1">Registre de connaissances scientifiques</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800 m-6 mb-0 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2
              ${mode === 'login' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <LogIn size={14} /> Connexion
          </button>
          <button
            onClick={() => { setMode('register'); setError(null); setRegistered(false); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2
              ${mode === 'register' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <UserPlus size={14} /> Créer un compte
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {registered && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 text-[12px] text-emerald-700 dark:text-emerald-300 font-medium">
              Compte créé avec succès ! Connectez-vous maintenant.
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-[12px] text-red-700 dark:text-red-300 font-medium flex items-start gap-2">
              <AlertCircle size={14} className="flex-shrink-0 mt-px" />
              {error}
            </div>
          )}

          {mode === 'register' && (
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                required
                type="text"
                placeholder="Nom complet"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          )}

          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              required
              type="email"
              placeholder="Adresse email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              required
              type="password"
              placeholder="Mot de passe"
              minLength={8}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-60 mt-2"
          >
            {loading
              ? <><RefreshCw size={16} className="animate-spin" /> Chargement...</>
              : mode === 'login'
                ? <><LogIn size={16} /> Se connecter</>
                : <><UserPlus size={16} /> Créer le compte</>
            }
          </button>
        </form>

        <p className="text-center text-[11px] text-slate-400 pb-6">
          Scientia Enterprise v2.0.1 — Accès sécurisé
        </p>
      </div>
    </div>
  );
};
