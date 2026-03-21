import React, { useState, useEffect, useRef } from 'react';
import { Bell, Search, User as UserIcon, Settings, LogOut, Check, CheckCircle2, AlertCircle, FileText, Crown, Menu, TrendingUp, Info } from 'lucide-react';
import { User } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { RevuLogo } from './RevuLogo';
import { useNotifications, Notification } from '../hooks/useNotifications';

interface TopHeaderProps {
  user: User | null;
  onLogout: () => void;
  setView: (view: any) => void;
  onMenuClick: () => void;
  notifications: Notification[];
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ user, onLogout, setView, onMenuClick, notifications, markAsRead, markAllAsRead }) => {
  const { t } = useLanguage();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;
  const recentNotifications = notifications.slice(0, 5);

  const userInitials = user?.name 
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() 
    : 'JD';

  const orgName = user?.orgName || user?.company || 'Acme Corp';
  const planName = 'Pro Plan'; // Mock plan name

  return (
    <header className="h-14 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/40 dark:border-slate-700/50 shadow-lg flex items-center justify-between px-4 lg:px-6 shrink-0 sticky top-4 z-30 mx-4 lg:mx-8 mb-6 rounded-2xl transition-all duration-300">
      {/* Left side: Org Name & Mobile Menu */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors"
        >
          <Menu size={24} />
        </button>
        
        <div className="lg:hidden flex items-center gap-2 text-[#0500e2] dark:text-[#4b53fa]">
          <RevuLogo className="h-8 w-auto" />
        </div>

        <div className="hidden lg:flex items-center gap-2">
          <div className="w-8 h-8 bg-[#0500e2] text-white rounded-lg flex items-center justify-center font-bold text-sm">
            {orgName.substring(0, 1).toUpperCase()}
          </div>
          <span className="font-semibold text-slate-900 dark:text-white">{orgName}</span>
        </div>
      </div>

      {/* Right side: Notifications & Profile */}
      <div className="flex items-center gap-4 ms-auto">
        {/* Notification Bell */}
        <div className="relative" ref={notificationsRef}>
          <button 
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="relative p-2 text-slate-500 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-950"></span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="fixed top-[80px] left-4 right-4 sm:absolute sm:top-auto sm:-right-4 sm:left-auto sm:mt-4 sm:w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 max-w-[400px] mx-auto sm:mx-0">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 dark:text-white">Notifications</h3>
                <button 
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                  className="text-xs text-[#0500e2] hover:text-[#0400c0] dark:text-[#4b53fa] font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                >
                  <Check size={14} /> Mark all read
                </button>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {recentNotifications.length > 0 ? (
                  recentNotifications.map(notification => (
                    <div 
                      key={notification.id} 
                      className={`p-4 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex gap-3 ${!notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                    >
                      <div className="shrink-0 mt-1">
                        {notification.type === 'assignment' && <FileText size={18} className="text-blue-500" />}
                        {notification.type === 'feedback' && <CheckCircle2 size={18} className="text-emerald-500" />}
                        {notification.type === 'alert' && <AlertCircle size={18} className="text-red-500" />}
                        {notification.type === 'performance' && <TrendingUp size={18} className="text-purple-500" />}
                        {notification.type === 'system' && <Info size={18} className="text-slate-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <p className={`text-sm font-medium truncate ${!notification.read ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                            {notification.title}
                          </p>
                          <span className="text-xs text-slate-400 whitespace-nowrap ml-2">{notification.time}</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                          {notification.message}
                        </p>
                      </div>
                      {!notification.read && (
                        <button 
                          onClick={() => markAsRead(notification.id)}
                          className="shrink-0 text-slate-400 hover:text-[#0500e2] self-center p-1"
                          title="Mark as read"
                        >
                          <div className="w-2 h-2 rounded-full bg-[#0500e2]"></div>
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                    <Bell size={24} className="mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No notifications</p>
                  </div>
                )}
              </div>
              <div className="p-3 border-t border-slate-100 dark:border-slate-800 text-center bg-slate-50/50 dark:bg-slate-800/20">
                <button 
                  onClick={() => {
                    setShowNotifications(false);
                    setView('notifications');
                  }}
                  className="text-sm text-[#0500e2] hover:text-[#0400c0] dark:text-[#4b53fa] font-medium"
                >
                  Show all
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={profileMenuRef}>
          <button 
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0500e2]"
          >
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-medium text-sm">
                {userInitials}
              </div>
            )}
          </button>

          {showProfileMenu && (
            <div className="fixed top-[80px] left-4 right-4 sm:absolute sm:top-auto sm:right-0 sm:left-auto sm:mt-4 sm:w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 max-w-[400px] mx-auto sm:mx-0">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                <p className="font-semibold text-slate-900 dark:text-white truncate">{user?.name || 'Guest User'}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{user?.email || 'guest@example.com'}</p>
                
                <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gradient-to-r from-amber-100 to-amber-50 dark:from-amber-900/40 dark:to-amber-900/20 border border-amber-200 dark:border-amber-800/50">
                  <Crown size={14} className="text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">{planName}</span>
                </div>
              </div>
              
              <div className="p-2">
                <button 
                  onClick={() => {
                    setView('account');
                    setShowProfileMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <UserIcon size={16} />
                  {t('nav.account')}
                </button>
                <button 
                  onClick={() => {
                    setView('settings');
                    setShowProfileMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Settings size={16} />
                  {t('nav.settings')}
                </button>
              </div>
              
              <div className="p-2 border-t border-slate-100 dark:border-slate-800">
                <button 
                  onClick={() => {
                    onLogout();
                    setShowProfileMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut size={16} />
                  {t('nav.logout')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
