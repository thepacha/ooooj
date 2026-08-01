
import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { User as UserIcon, Building2, Globe, Save, Lock, Eye, EyeOff, Loader2, CheckCircle, Shield, Camera, Upload, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';

interface AccountProps {
  user: User | null;
  onUpdateUser: (user: User) => void;
  onViewPricing: () => void;
}

export const Account: React.FC<AccountProps> = ({ user, onUpdateUser, onViewPricing }) => {
  const { t } = useLanguage();
  
  // Profile State
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [website, setWebsite] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Refactored to object to explicitly track type
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password State
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setCompany(user.company || '');
      setWebsite(user.website || '');
      setAvatarUrl(user.avatar_url || null);
    }
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0 || !user) return;
      
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      setIsUploading(true);
      setProfileMessage(null);

      try {
          // 1. Upload to Storage
          const { error: uploadError } = await supabase.storage
              .from('avatars')
              .upload(filePath, file, { upsert: true });

          if (uploadError) throw uploadError;

          // 2. Get Public URL
          const { data: { publicUrl } } = supabase.storage
              .from('avatars')
              .getPublicUrl(filePath);

          // 3. Update Profile Database
          const { error: updateError } = await supabase
              .from('profiles')
              .update({ avatar_url: publicUrl })
              .eq('id', user.id);

          if (updateError) throw updateError;

          // 4. Update Local State & Parent
          setAvatarUrl(publicUrl);
          onUpdateUser({ ...user, avatar_url: publicUrl });
          setProfileMessage({ type: 'success', text: 'Avatar updated successfully' });
          setTimeout(() => setProfileMessage(null), 3000);

      } catch (error: any) {
          console.error("Upload error:", error);
          setProfileMessage({ type: 'error', text: `Error uploading avatar: ${error.message}` });
      } finally {
          setIsUploading(false);
      }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsProfileSaving(true);
    setProfileMessage(null);

    try {
        // We update the DB first
        const { error } = await supabase
            .from('profiles')
            .update({ name, company, website })
            .eq('id', user.id);

        if (error) throw error;

        // Then update local
        const updatedUser = { ...user, name, company, website, avatar_url: avatarUrl || undefined };
        onUpdateUser(updatedUser);
        
        setProfileMessage({ type: 'success', text: 'Profile updated successfully' });
        setTimeout(() => setProfileMessage(null), 3000);
    } catch (err: any) {
        setProfileMessage({ type: 'error', text: `Failed to update: ${err.message}` });
    } finally {
        setIsProfileSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (password !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: "Passwords do not match" });
      return;
    }

    if (password.length < 6) {
      setPasswordMessage({ type: 'error', text: "Password must be at least 6 characters" });
      return;
    }

    setIsPasswordSaving(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;
      
      setPasswordMessage({ type: 'success', text: "Password updated successfully" });
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMessage({ type: 'error', text: err.message || "Failed to update password" });
    } finally {
      setIsPasswordSaving(false);
    }
  };

  if (!user) return null;

  const userInitials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-fade-in">
        
        {/* Header */}
        <div className="mb-8">
            <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <UserIcon className="text-[#0500e2]" size={28} />
                {t('account.title')}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-base">
                {t('account.subtitle')}
            </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Forms */}
            <div className="lg:col-span-2 space-y-8">
                
                {/* Profile Card */}
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-8">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        {t('account.personal')}
                    </h3>
                    
                    {/* Avatar Section */}
                    <div className="flex items-center gap-6 mb-8">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-100 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-3xl font-bold text-slate-400 shadow-sm">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    userInitials
                                )}
                            </div>
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="text-white" size={24} />
                            </div>
                            {isUploading && (
                                <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 rounded-full flex items-center justify-center">
                                    <Loader2 className="animate-spin text-[#0500e2]" size={24} />
                                </div>
                            )}
                        </div>
                        <div>
                            <button 
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="text-sm font-bold text-[#0500e2] hover:underline flex items-center gap-2 mb-1"
                            >
                                <Upload size={16} /> {t('account.avatar_upload')}
                            </button>
                            <p className="text-xs text-slate-500">JPG, PNG or GIF. Max 5MB.</p>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*"
                                onChange={handleAvatarUpload}
                            />
                        </div>
                    </div>

                    <form onSubmit={handleUpdateProfile} className="space-y-5">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t('account.name')}</label>
                            <input 
                                type="text" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-[#0500e2] outline-none transition-all"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t('account.company')}</label>
                                <div className="relative">
                                    <Building2 size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input 
                                        type="text" 
                                        value={company}
                                        onChange={(e) => setCompany(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-[#0500e2] outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t('account.website')}</label>
                                <div className="relative">
                                    <Globe size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input 
                                        type="text" 
                                        value={website}
                                        onChange={(e) => setWebsite(e.target.value)}
                                        placeholder="acme.com"
                                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-[#0500e2] outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t('account.email')}</label>
                            <input 
                                type="text" 
                                value={user.email}
                                disabled
                                className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 cursor-not-allowed"
                            />
                        </div>

                        <div className="pt-2 flex items-center justify-between">
                            <button 
                                type="submit"
                                disabled={isProfileSaving}
                                className="px-6 py-3 bg-[#0500e2] text-white rounded-xl font-bold hover:bg-[#0400c0] transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20"
                            >
                                {isProfileSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                {t('account.update_profile')}
                            </button>
                            {profileMessage && (
                                <div className={`text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-left-2 ${profileMessage.type === 'error' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                    {profileMessage.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />} 
                                    {profileMessage.text}
                                </div>
                            )}
                        </div>
                    </form>
                </div>

                {/* Security Card */}
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-8">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <Lock className="text-slate-400" size={20} />
                        {t('account.security')}
                    </h3>

                    <form onSubmit={handleUpdatePassword} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t('account.new_password')}</label>
                                <div className="relative">
                                    <input 
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-[#0500e2] outline-none transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t('account.confirm_password')}</label>
                                <input 
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-[#0500e2] outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="pt-2 flex items-center justify-between">
                            <button 
                                type="submit"
                                disabled={isPasswordSaving || !password}
                                className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                {isPasswordSaving ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
                                {t('account.update_password')}
                            </button>
                            {passwordMessage && (
                                <div className={`text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-left-2 ${passwordMessage.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {passwordMessage.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
                                    {passwordMessage.text}
                                </div>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            {/* Right Column: Plan Info */}
            <div className="lg:col-span-1 space-y-8">
                <div className="bg-[#0500e2] rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl shadow-blue-900/20">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4"></div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                <Shield size={24} />
                            </div>
                            <h3 className="text-xl font-serif font-bold">{t('account.plan')}</h3>
                        </div>
                        
                        <p className="text-blue-100 mb-8 leading-relaxed">
                            {t('account.plan_desc')}
                        </p>

                        <button 
                            onClick={onViewPricing}
                            className="w-full py-3 bg-white text-[#0500e2] rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-lg"
                        >
                            {t('account.upgrade')}
                        </button>
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-800 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                        Need help with your account?
                    </p>
                    <a href="mailto:support@revuqai.com" className="text-[#0500e2] font-bold hover:underline">
                        Contact Support
                    </a>
                </div>
            </div>
        </div>
    </div>
  );
};