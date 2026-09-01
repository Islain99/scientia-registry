
import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from 'lucide-react';
import { SystemNotification } from '../types';

interface NotificationContextType {
  notify: (n: Omit<SystemNotification, 'id'>) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotification must be used within NotificationProvider");
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);

  const notify = useCallback((n: Omit<SystemNotification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { ...n, id }]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    }, n.duration || 5000);
  }, []);

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm w-full no-print">
        {notifications.map(n => (
          <div 
            key={n.id} 
            className={`
              p-4 rounded-2xl shadow-xl border flex gap-4 items-start animate-in slide-in-from-right-10 duration-300
              ${n.type === 'error' ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/50 dark:border-red-900' : 
                n.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/50 dark:border-amber-900' :
                n.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:border-emerald-900' :
                'bg-white border-slate-200 text-slate-800 dark:bg-slate-900 dark:border-slate-800'}
            `}
          >
            <div className="flex-shrink-0 mt-0.5">
              {n.type === 'error' && <AlertCircle size={20} className="text-red-600" />}
              {n.type === 'warning' && <AlertTriangle size={20} className="text-amber-600" />}
              {n.type === 'success' && <CheckCircle2 size={20} className="text-emerald-600" />}
              {n.type === 'info' && <Info size={20} className="text-indigo-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold tracking-tight">{n.title}</h4>
              <p className="text-xs opacity-80 leading-relaxed mt-0.5">{n.message}</p>
            </div>
            <button 
              onClick={() => setNotifications(prev => prev.filter(notif => notif.id !== n.id))}
              className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
