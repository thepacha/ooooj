
import React from 'react';
import { LayoutDashboard, FileText, History, Settings, X, Sun, Moon, LogOut, PieChart, Users, GraduationCap, ShieldAlert, Globe, User as UserIcon } from 'lucide-react';
import { ViewState, User } from '../types';
import { RevuLogo } from './RevuLogo';
import { useLanguage } from '../contexts/LanguageContext';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onLogout: () => void;
  user: User | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isOpen, onClose, theme, toggleTheme, onLogout, user }) => {
  const { t, language, setLanguage, isRTL } = useLanguage();

  const navItems: { id: ViewState; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: <LayoutDashboard size={20} /> },
    { id: 'analyze', label: t('nav.analyze'), icon: <FileText size={20} /> },
    { id: 'training', label: t('nav.training'), icon: <GraduationCap size={20} /> },
    { id: 'history', label: t('nav.history'), icon: <History size={20} /> },
    { id: 'roster', label: t('nav.roster'), icon: <Users size={20} /> },
    { id: 'usage', label: t('nav.usage'), icon: <PieChart size={20} /> },
    { id: 'settings', label: t('nav.settings'), icon: <Settings size={20} /> },
    { id: 'account', label: t('nav.account'), icon: <UserIcon size={20} /> },
  ];

  const userInitials = user?.name 
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() 
    : 'JD';

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden no-print"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed top-0 start-0 h-screen w-64 
        bg-white dark:bg-slate-950 border-e border-slate-200 dark:border-slate-800
        text-slate-900 dark:text-white 
        shadow-xl lg:shadow-none z-30 
        transition-all duration-300 ease-in-out no-print
        flex flex-col
        ${isOpen ? 'translate-x-0' : (isRTL ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0')}
      `}>
        <div className="p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3 text-[#0500e2] dark:text-[#4b53fa]">
            <RevuLogo className="h-12 w-auto" />
          </div>
          {/* Close button for mobile */}
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-slate-900 dark:hover:text-white">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setView(item.id);
                onClose(); // Close sidebar on mobile when item selected
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                currentView === item.id
                  ? 'bg-[#0500e2] text-white shadow-lg shadow-[#0500e2]/30'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className={`${currentView === item.id ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}>
                {item.icon}
              </span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}

          {/* Admin Link - Restricted to Admin Role */}
          {user?.role === 'admin' && (
            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
               <button
                onClick={() => {
                  setView('admin');
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                  currentView === 'admin'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className={`${currentView === 'admin' ? '' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600'}`}>
                  <ShieldAlert size={20} />
                </span>
                <span className="font-medium">{t('nav.admin')}</span>
              </button>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0 space-y-2">
          
          {/* Language Toggle */}
          <button 
              onClick={toggleLanguage}
              className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm font-medium"
          >
              <span className="flex items-center gap-2">
                  <Globe size={16} />
                  {language === 'en' ? 'Arabic' : 'English'}
              </span>
              <span className="text-xs font-bold text-[#0500e2]">{language.toUpperCase()}</span>
          </button>

          {/* Theme Toggle */}
          <button 
              onClick={toggleTheme}
              className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm font-medium"
          >
              <span className="flex items-center gap-2">
                  {theme === 'light' ? <Sun size={16} /> : <Moon size={16} />}
                  {theme === 'light' ? t('nav.light_mode') : t('nav.dark_mode')}
              </span>
              <div className={`w-8 h-4 rounded-full relative transition-colors ${theme === 'light' ? 'bg-slate-300' : 'bg-[#0500e2]'}`}>
                  <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                      // RTL aware toggle logic or simple transform
                      theme === 'light' ? 'start-0.5' : 'translate-x-4 start-0.5 rtl:-translate-x-4'
                  }`}></div>
              </div>
          </button>

          <div className="flex items-center justify-between px-2 pt-2">
            <button 
                onClick={() => setView('account')}
                className="flex items-center gap-3 flex-1 text-left group"
            >
                <div className="w-8 h-8 rounded-full bg-[#0500e2] text-white flex items-center justify-center text-xs font-bold shadow-sm group-hover:scale-105 transition-transform overflow-hidden">
                    {user?.avatar_url ? (
                        <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        userInitials
                    )}
                </div>
                <div className="overflow-hidden">
                    <p className="text-sm font-medium truncate text-slate-900 dark:text-white group-hover:text-[#0500e2] dark:group-hover:text-[#4b53fa] transition-colors">
                        {user?.name || t('nav.guest')}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[100px]">
                        {user?.email || 'guest@example.com'}
                    </p>
                </div>
            </button>
            <button 
                onClick={onLogout}
                className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all"
                title={t('nav.logout')}
            >
                <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};