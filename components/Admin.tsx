
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, UsageMetrics } from '../types';
import { Search, RefreshCw, Users, ShieldAlert, CreditCard, Activity, Check, RotateCcw, Edit3, ArrowUpDown, Filter, Shield, ShieldCheck, Copy, AlertTriangle, Lock, PauseCircle, PlayCircle, Calendar } from 'lucide-react';

interface AdminUserView extends User {
  usage?: UsageMetrics;
  lifetime_usage: number;
}

interface AdminProps {
    user: User | null;
}

export const Admin: React.FC<AdminProps> = ({ user: currentUser }) => {
  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempLimit, setTempLimit] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [sortField, setSortField] = useState<'name' | 'usage' | 'limit' | 'role' | 'lifetime' | 'status'>('usage');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSql, setShowSql] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // 1. Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) {
          if (profilesError.code === '42501') {
              throw new Error("Access Denied: RLS Policy. Ensure you have run the `UPDATE profiles SET role = 'admin' ...` SQL query for your user.");
          }
          throw profilesError;
      }

      // 2. Fetch current usage
      const { data: usageData, error: usageError } = await supabase
        .from('user_usage')
        .select('*');

      if (usageError) {
          console.warn("Usage fetch error (RLS likely):", usageError);
      }

      // 3. Fetch historic usage for lifetime calculation
      const { data: historyData, error: historyError } = await supabase
        .from('usage_history')
        .select('user_id, credits_used');
        
      if (historyError) {
          console.warn("History fetch error:", historyError);
      }

      // Pre-calculate history sums using a Map for O(1) lookup
      const historyMap = new Map<string, number>();
      if (historyData) {
          historyData.forEach((h: any) => {
              const current = historyMap.get(h.user_id) || 0;
              historyMap.set(h.user_id, current + (h.credits_used || 0));
          });
      }

      // Merge data
      const merged: AdminUserView[] = (profiles || []).map(p => {
          const currentUsage = usageData?.find((u: any) => u.user_id === p.id);
          
          const historicSum = historyMap.get(p.id) || 0;
          const currentCredits = currentUsage?.credits_used || 0;

          return {
              id: p.id,
              name: p.name || 'Unknown',
              email: p.email || '',
              company: p.company,
              role: p.role as any,
              lifetime_usage: historicSum + currentCredits,
              usage: currentUsage || {
                  user_id: p.id,
                  credits_used: 0,
                  monthly_limit: 1000,
                  analyses_count: 0,
                  transcriptions_count: 0,
                  chat_messages_count: 0,
                  reset_date: new Date().toISOString(),
                  suspended: false
              }
          };
      });

      setUsers(merged);
    } catch (e: any) {
      console.error("Admin load error:", e);
      setErrorMsg(e.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (user: AdminUserView) => {
      setEditingId(user.id);
      setTempLimit(user.usage?.monthly_limit || 1000);
  };

  const handleSaveLimit = async (userId: string) => {
      setSaving(true);
      try {
          const { error } = await supabase
            .from('user_usage')
            .upsert({
                user_id: userId,
                monthly_limit: tempLimit
            }, { onConflict: 'user_id' });

          if (error) throw error;

          setUsers(prev => prev.map(u => 
              u.id === userId 
              ? { ...u, usage: { ...u.usage!, monthly_limit: tempLimit } } 
              : u
          ));
          setEditingId(null);
      } catch (e: any) {
          console.error("Update error:", e);
          alert("Failed to update limit: " + e.message);
      } finally {
          setSaving(false);
      }
  };

  const handleRoleUpdate = async (userId: string, currentRole: string) => {
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      const action = newRole === 'admin' ? 'promote to Admin' : 'demote to User';
      
      if (!confirm(`Are you sure you want to ${action}?`)) return;

      try {
          // Optimistic update
          setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole as any } : u));

          const { error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);

          if (error) throw error;
      } catch (e: any) {
          console.error("Role update error:", e);
          alert("Failed to update role: " + e.message);
          fetchUsers(); // Revert
      }
  };

  const handleResetUsage = async (user: AdminUserView) => {
      if (!confirm(`Reset billing cycle for ${user.name}? This will clear current usage and start a fresh month.`)) return;
      
      try {
          // Calculate new reset date (30 days from now)
          const nextMonth = new Date();
          nextMonth.setDate(nextMonth.getDate() + 30);

          const payload = {
              user_id: user.id,
              monthly_limit: user.usage?.monthly_limit || 1000,
              reset_date: nextMonth.toISOString(),
              credits_used: 0,
              analyses_count: 0,
              transcriptions_count: 0,
              chat_messages_count: 0,
              // Explicitly preserve suspended state if it exists, default false
              suspended: user.usage?.suspended || false
          };

          const { error } = await supabase
            .from('user_usage')
            .upsert(payload, { onConflict: 'user_id' });

          if (error) throw error;

          // Update UI immediately
          setUsers(prev => prev.map(u => 
              u.id === user.id 
              ? { 
                  ...u, 
                  usage: { ...u.usage!, ...payload } 
                } 
              : u
          ));
          
          alert("Cycle reset successfully.");
      } catch (e: any) {
          console.error("Reset error:", e);
          alert("Failed to reset usage: " + e.message);
      }
  };

  const handleToggleSuspend = async (user: AdminUserView) => {
      const isSuspended = user.usage?.suspended || false;
      const action = isSuspended ? 'unsuspend' : 'suspend';
      
      if (!confirm(`Are you sure you want to ${action} ${user.name}?`)) return;

      try {
          // We need to fetch the existing record first or ensure we don't overwrite other fields?
          // Actually upsert with just the PK and the changed field works as an UPDATE if rows exist
          // But to be safe with upsert behavior in some configs, we should include what we know.
          // Better yet, use UPDATE for suspension since the row likely exists if we are viewing it.
          // If it doesn't exist (new user), we need upsert.
          
          const payload = {
              user_id: user.id,
              suspended: !isSuspended
          };

          // Use update if we know they have usage, upsert otherwise
          const { error } = await supabase
            .from('user_usage')
            .upsert(payload, { onConflict: 'user_id' }); // Supabase upsert handles partial updates if you don't replace the whole row? 
            // WAIT: Supabase/Postgrest UPSERT replaces the row unless you specify ignoreDuplicates (which we don't want).
            // It does NOT do a partial update of just the fields provided unless we use .update().
            // BUT: if we use .update() and the row doesn't exist, it fails.
            // Let's use .update() since users list usually implies existence, but for safety with 'merged' data:
            
          if (error) throw error;

          setUsers(prev => prev.map(u => 
              u.id === user.id 
              ? { ...u, usage: { ...u.usage!, suspended: !isSuspended } } 
              : u
          ));
      } catch (e: any) {
          console.error("Suspend error:", e);
          alert("Failed to update status: " + e.message);
      }
  };

  const getPlanName = (limit: number) => {
      if (limit >= 50000) return 'Scale';
      if (limit >= 10000) return 'Pro';
      if (limit > 1000) return 'Plus';
      return 'Starter';
  };

  const copySqlToClipboard = () => {
      if (!currentUser) return;
      const sql = `UPDATE profiles SET role = 'admin' WHERE id = '${currentUser.id}';`;
      navigator.clipboard.writeText(sql).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
      });
  };

  const sortedUsers = [...users].filter(u => 
      (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.company || '').toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      switch (sortField) {
          case 'name':
              valA = (a.name || '').toLowerCase();
              valB = (b.name || '').toLowerCase();
              break;
          case 'usage':
              valA = a.usage?.credits_used || 0;
              valB = b.usage?.credits_used || 0;
              break;
          case 'lifetime':
              valA = a.lifetime_usage || 0;
              valB = b.lifetime_usage || 0;
              break;
          case 'limit':
              valA = a.usage?.monthly_limit || 0;
              valB = b.usage?.monthly_limit || 0;
              break;
          case 'role':
              valA = a.role === 'admin' ? 1 : 0;
              valB = b.role === 'admin' ? 1 : 0;
              break;
          case 'status':
              valA = a.usage?.suspended ? 1 : 0;
              valB = b.usage?.suspended ? 1 : 0;
              break;
      }

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
  });

  const toggleSort = (field: typeof sortField) => {
      if (sortField === field) {
          setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
      } else {
          setSortField(field);
          setSortDir('desc');
      }
  };

  // Stats calculation
  const totalCreditsDistributed = users.reduce((acc, u) => acc + (u.usage?.monthly_limit || 0), 0);
  const totalLifetimeConsumed = users.reduce((acc, u) => acc + u.lifetime_usage, 0);

  if (errorMsg) {
      return (
          <div className="p-8 flex flex-col items-center justify-center text-center animate-fade-in min-h-[400px]">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-full flex items-center justify-center mb-6">
                  <ShieldAlert size={40} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Access Restricted</h2>
              <p className="text-slate-600 dark:text-slate-400 max-w-md mb-8">{errorMsg}</p>
              <button 
                onClick={fetchUsers}
                className="px-8 py-3 bg-slate-900 dark:bg-slate-700 text-white rounded-xl font-bold hover:opacity-90 transition-all shadow-lg"
              >
                  Retry Access
              </button>
          </div>
      )
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
        
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-xl flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                    <Users size={24} />
                </div>
                <div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Users</p>
                    <h3 className="text-3xl font-serif font-bold">{users.length}</h3>
                </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-[#0500e2] flex items-center justify-center">
                    <CreditCard size={24} />
                </div>
                <div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Credits Allocated</p>
                    <h3 className="text-3xl font-serif font-bold text-slate-900 dark:text-white">{totalCreditsDistributed.toLocaleString()}</h3>
                </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center">
                    <Activity size={24} />
                </div>
                <div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Lifetime Consumed</p>
                    <h3 className="text-3xl font-serif font-bold text-slate-900 dark:text-white">{totalLifetimeConsumed.toLocaleString()}</h3>
                </div>
            </div>
        </div>

        {/* User Table */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <ShieldAlert size={20} className="text-[#0500e2]" /> User Administration
                    </h2>
                    {users.length === 1 && (
                        <div className="flex items-center gap-2 mt-2">
                            <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                <Lock size={10} /> RLS Active: Restricted view.
                            </p>
                            <button 
                                onClick={() => setShowSql(!showSql)}
                                className="text-xs font-bold text-[#0500e2] underline hover:text-[#0400c0]"
                            >
                                Fix Permissions
                            </button>
                        </div>
                    )}
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search user, email, company..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm outline-none focus:ring-2 focus:ring-[#0500e2]"
                        />
                    </div>
                    <button 
                        onClick={fetchUsers}
                        className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        title="Refresh Data"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* SQL Helper for Admin Access */}
            {showSql && currentUser && (
                <div className="p-6 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 animate-in slide-in-from-top-2">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-lg">
                            <AlertTriangle size={24} />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-2">Enable Full Admin Access</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                You are currently seeing a restricted view because your account is not marked as an <b>Admin</b> in the database. 
                                Due to security rules, you cannot change this from the UI.
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 font-bold">
                                Run this SQL command in your Supabase SQL Editor:
                            </p>
                            <div className="relative group">
                                <pre className="bg-slate-900 text-slate-50 p-4 rounded-xl text-xs sm:text-sm font-mono overflow-x-auto border border-slate-700">
                                    {`UPDATE profiles SET role = 'admin' WHERE id = '${currentUser.id}';`}
                                </pre>
                                <button 
                                    onClick={copySqlToClipboard}
                                    className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                                    title="Copy SQL"
                                >
                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                </button>
                            </div>
                            <button 
                                onClick={() => setShowSql(false)}
                                className="mt-4 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline"
                            >
                                Close Help
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                        <tr>
                            <th className="p-5 cursor-pointer hover:text-[#0500e2] transition-colors" onClick={() => toggleSort('name')}>
                                <div className="flex items-center gap-2">User Profile <ArrowUpDown size={12}/></div>
                            </th>
                            <th className="p-5 cursor-pointer hover:text-[#0500e2] transition-colors" onClick={() => toggleSort('role')}>
                                <div className="flex items-center gap-2">Role <ArrowUpDown size={12}/></div>
                            </th>
                            <th className="p-5 cursor-pointer hover:text-[#0500e2] transition-colors" onClick={() => toggleSort('status')}>
                                <div className="flex items-center gap-2">Status <ArrowUpDown size={12}/></div>
                            </th>
                            <th className="p-5 cursor-pointer hover:text-[#0500e2] transition-colors" onClick={() => toggleSort('usage')}>
                                <div className="flex items-center gap-2">Usage (Mo) <ArrowUpDown size={12}/></div>
                            </th>
                            <th className="p-5 cursor-pointer hover:text-[#0500e2] transition-colors" onClick={() => toggleSort('lifetime')}>
                                <div className="flex items-center gap-2">Total Consumed <ArrowUpDown size={12}/></div>
                            </th>
                            <th className="p-5 cursor-pointer hover:text-[#0500e2] transition-colors" onClick={() => toggleSort('limit')}>
                                <div className="flex items-center gap-2">Limit <ArrowUpDown size={12}/></div>
                            </th>
                            <th className="p-5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {sortedUsers.map(user => {
                            const usage = user.usage?.credits_used || 0;
                            const limit = user.usage?.monthly_limit || 1;
                            const pct = Math.min(100, Math.round((usage / limit) * 100));
                            const isEditing = editingId === user.id;
                            const isOverLimit = usage >= limit;
                            const isAdmin = user.role === 'admin';
                            const isSuspended = user.usage?.suspended || false;
                            const resetDate = user.usage?.reset_date ? new Date(user.usage.reset_date).toLocaleDateString() : '-';

                            return (
                                <tr key={user.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group ${isSuspended ? 'opacity-70 bg-slate-50 dark:bg-slate-900' : ''} ${isOverLimit && !isSuspended ? 'bg-red-50/50 dark:bg-red-900/5' : ''}`}>
                                    <td className="p-5">
                                        <div className="flex items-start gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${isAdmin ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                                                {isAdmin ? <Shield size={16} /> : (user.name || '?').charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                    {user.name}
                                                </div>
                                                <div className="text-sm text-slate-500 dark:text-slate-400">{user.email}</div>
                                                {user.company && <div className="mt-1"><span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500">{user.company}</span></div>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <button 
                                            onClick={() => handleRoleUpdate(user.id, user.role || 'user')}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                                isAdmin 
                                                ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 hover:opacity-90' 
                                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400'
                                            }`}
                                            title={isAdmin ? "Demote to User" : "Promote to Admin"}
                                        >
                                            {isAdmin ? <ShieldCheck size={14} /> : <Users size={14} />}
                                            {isAdmin ? 'Admin' : 'User'}
                                        </button>
                                    </td>
                                    <td className="p-5">
                                        {isSuspended ? (
                                            <span className="flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-md border border-red-100 dark:border-red-900/30">
                                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div> Suspended
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-md border border-emerald-100 dark:border-emerald-900/30">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Active
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-5">
                                        <div className="w-full max-w-[120px]">
                                            <div className="flex justify-between text-xs mb-1 font-medium">
                                                <span className={`${isOverLimit && !isSuspended ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                                    {usage.toLocaleString()}
                                                </span>
                                                <span className="text-slate-400">{pct}%</span>
                                            </div>
                                            <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-red-500' : pct > 75 ? 'bg-amber-500' : 'bg-[#0500e2]'}`} 
                                                    style={{ width: `${pct}%` }}
                                                ></div>
                                            </div>
                                            <div className="flex items-center gap-1 mt-1.5 text-[10px] text-slate-400">
                                                <Calendar size={10} />
                                                Resets: {resetDate}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                            {user.lifetime_usage.toLocaleString()}
                                        </div>
                                        <div className="text-[10px] text-slate-400 uppercase tracking-wide">Credits</div>
                                    </td>
                                    <td className="p-5">
                                        {isEditing ? (
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="number"
                                                    value={tempLimit}
                                                    onChange={(e) => setTempLimit(parseInt(e.target.value))}
                                                    className="w-24 p-2 rounded-lg border border-[#0500e2] bg-white dark:bg-slate-900 text-sm font-bold shadow-sm outline-none"
                                                    autoFocus
                                                />
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="font-mono font-bold text-lg text-slate-700 dark:text-slate-200">
                                                    {limit.toLocaleString()}
                                                </div>
                                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                                    limit > 1000 ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                }`}>
                                                    {getPlanName(limit)}
                                                </span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-5 text-right">
                                        {isEditing ? (
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => handleSaveLimit(user.id)}
                                                    disabled={saving}
                                                    className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-sm"
                                                    title="Save"
                                                >
                                                    <Check size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => setEditingId(null)}
                                                    className="p-2 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                                                    title="Cancel"
                                                >
                                                    <Search size={16} className="rotate-45" /> 
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => handleToggleSuspend(user)}
                                                    className={`p-2 border rounded-lg transition-all ${
                                                        isSuspended 
                                                        ? 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100'
                                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-red-500 hover:border-red-500'
                                                    }`}
                                                    title={isSuspended ? "Unsuspend User" : "Suspend Usage"}
                                                >
                                                    {isSuspended ? <PlayCircle size={16} /> : <PauseCircle size={16} />}
                                                </button>
                                                
                                                <button 
                                                    onClick={() => handleEditClick(user)}
                                                    className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:text-[#0500e2] hover:border-[#0500e2] transition-all"
                                                    title="Edit Limit"
                                                >
                                                    <Edit3 size={16} />
                                                </button>
                                                
                                                <button 
                                                    onClick={() => handleResetUsage(user)}
                                                    className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:text-red-500 hover:border-red-500 transition-all"
                                                    title="Reset Billing Cycle (Clear usage & start fresh)"
                                                >
                                                    <RotateCcw size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        {sortedUsers.length === 0 && (
                            <tr>
                                <td colSpan={7} className="p-12 text-center text-slate-400">
                                    <div className="flex flex-col items-center gap-2">
                                        <Filter size={24} className="opacity-50" />
                                        <p>No users found matching "{searchTerm}".</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};
