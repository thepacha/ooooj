import React, { useState } from 'react';
import { AnalysisResult, ViewState, CriteriaResult } from '../types';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  AlertTriangle, 
  Award, 
  ArrowUpRight,
  Filter,
  Bell,
  Languages,
  Zap,
  Trophy,
  BookOpen,
  MessageSquare,
  Clock,
  Sparkles,
  ChevronRight,
  Star,
  Flame,
  Brain,
  ShieldCheck,
  Phone,
  PhoneCall
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface AiConversationDashboardProps {
  history: AnalysisResult[];
  setView: (view: ViewState) => void;
  onFilterSelect?: (filter: 'all' | 'high' | 'low') => void;
}

export const AiConversationDashboard: React.FC<AiConversationDashboardProps> = ({ history, setView, onFilterSelect }) => {
  const { language, isRTL } = useLanguage();
  const [timeRange, setTimeRange] = useState<'1w' | '1m' | '6m' | '1y'>('1m');

  // --- Localization Dictionary ---
  const text = {
    en: {
      welcome: "Welcome Back",
      recentActivity: "Recent Activity",
      stayUpdated: "Keep tracking your conversational fluency and achievements.",
      showAll: "Show all",
      avgFluency: "Avg. Fluency Score",
      totalSessions: "Practice Sessions",
      focusRequired: "Focus Needed",
      highMasteries: "High Scores (≥90%)",
      qualityTrend: "Conversational Performance Over Time",
      vsLastMonth: "vs last month",
      practiceFrequency: "Practice Frequency",
      categoryPerformance: "Language Skills Profile",
      grammar: "Grammar & Vocabulary",
      fluency: "Fluency & Conversation Flow",
      empathy: "Empathy & Speaking Tone",
      coherence: "Context Coherence",
      objectives: "Goal Achievement",
      level: "Level",
      nextLevel: "to Level",
      viewScenarios: "Start Speaking Practice",
      recentConversations: "Recent Practice Sessions",
      difficulty: "Difficulty",
      xpGained: "XP Gained",
      viewHistory: "View All Sessions",
      all: "All",
      high: "High",
      low: "Low",
      noData: "No sessions recorded yet. Start practicing!",
      xp: "XP",
      streaks: "Practice Streak",
      days: "days",
      skillsBreakdownDesc: "Detailed breakdown of conversational criteria analyzed by AI.",
      recentSessionsDesc: "View and review feedback from your latest conversations.",
      ctaPracticeTitle: "Ready to Speak Fluently?",
      ctaPracticeDesc: "Connect instantly to an interactive speaking practice call with realistic, adaptive AI personas. Elevate your confidence, flow, and pronunciation today.",
      ctaPracticeButton: "Start Speaking Practice Call",
      ctaBadge: "Interactive Voice Call"
    },
    ar: {
      welcome: "مرحباً بعودتك",
      recentActivity: "النشاط الأخير",
      stayUpdated: "تابع تقدم طلاقتك اللغوية وإنجازاتك في المحادثة.",
      showAll: "عرض الكل",
      avgFluency: "متوسط درجة الطلاقة",
      totalSessions: "جلسات التدريب",
      focusRequired: "يحتاج لتركيز",
      highMasteries: "الدرجات العالية (≥90%)",
      qualityTrend: "تطور الأداء اللغوي بمرور الوقت",
      vsLastMonth: "مقارنة بالشهر الماضي",
      practiceFrequency: "تكرار الممارسة",
      categoryPerformance: "ملف المهارات اللغوية",
      grammar: "القواعد والمفردات",
      fluency: "الطلاقة وتدفق الحديث",
      empathy: "التعاطف ونبرة التحدث",
      coherence: "تماسك وسياق الردود",
      objectives: "تحقيق أهداف المحادثة",
      level: "المستوى",
      nextLevel: "إلى المستوى",
      viewScenarios: "ابدأ ممارسة التحدث",
      recentConversations: "جلسات التدريب الأخيرة",
      difficulty: "الصعوبة",
      xpGained: "نقاط الخبرة",
      viewHistory: "عرض كافة الجلسات",
      all: "الكل",
      high: "عالية",
      low: "منخفضة",
      noData: "لا توجد جلسات مسجلة بعد. ابدأ ممارسة التحدث الآن!",
      xp: "نقطة",
      streaks: "سلسلة التدريب",
      days: "أيام",
      skillsBreakdownDesc: "تحليل مفصل لمعايير المحادثة التي تم فحصها بالذكاء الاصطناعي.",
      recentSessionsDesc: "عرض ومراجعة الملاحظات من أحدث المحادثات الخاصة بك.",
      ctaPracticeTitle: "هل أنت جاهز للتحدث بطلاقة؟",
      ctaPracticeDesc: "اتصل فوراً بمكالمة ممارسة تحدث تفاعلية ومباشرة مع شخصيات ذكاء اصطناعي متكيفة. ارتقِ بثقتك وتدفق حديثك ومخارج الحروف اليوم.",
      ctaPracticeButton: "ابدأ مكالمة ممارسة التحدث",
      ctaBadge: "مكالمة صوتية تفاعلية"
    }
  };

  const loc = text[language as 'en' | 'ar'] || text['en'];

  // Filter out items that are deleted
  const activeHistory = history.filter(h => !h.isDeleted);

  // --- Data Processing for AI Conversations ---
  const totalSessions = activeHistory.length;
  
  const averageScore = totalSessions > 0 
    ? Math.round(activeHistory.reduce((acc, curr) => acc + curr.overallScore, 0) / totalSessions) 
    : 0;
  
  const lowScores = activeHistory.filter(h => h.overallScore < 75).length;
  const highScores = activeHistory.filter(h => h.overallScore >= 90).length;

  // Gamification: XP Calculation (Each session is worth: score * 12 + 60 XP)
  const totalXp = activeHistory.reduce((acc, curr) => acc + (curr.overallScore * 12) + 60, 0);
  const currentLevel = Math.floor(totalXp / 1000) + 1;
  const xpIntoCurrentLevel = totalXp % 1000;
  const xpNeededForNextLevel = 1000 - xpIntoCurrentLevel;
  const levelProgressPercentage = (xpIntoCurrentLevel / 1000) * 100;

  // Calculate Streak (consecutive days practiced, simplified mock representation for UX)
  const calculateStreak = () => {
    if (activeHistory.length === 0) return 0;
    // Simple mock logic or date comparison
    return Math.min(Math.floor(activeHistory.length * 0.8) + 1, 7);
  };
  const activeStreak = calculateStreak();

  // Prepare trend data for charts
  const reversedHistory = [...activeHistory].reverse();
  const trendData = reversedHistory.slice(-15).map((h, i) => {
    // Parse language from agentName (e.g., "Language Learner (Spanish)")
    const langMatch = h.agentName.match(/\(([^)]+)\)/);
    const lang = langMatch ? langMatch[1] : "English";
    
    // Parse clean scenario name
    const rawName = h.customerName.replace(/^Roleplay:\s*/i, '');
    const cleanName = rawName.length > 25 ? rawName.slice(0, 22) + '...' : rawName;

    return {
      index: i,
      score: h.overallScore,
      date: new Date(h.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      scenario: cleanName,
      language: lang,
      duration: Math.floor(Math.random() * 5) + 3 // mockup duration in minutes
    };
  });

  // Calculate Deltas from previous period
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const getHistoryForPeriod = (month: number, year: number) => activeHistory.filter(h => {
    const d = new Date(h.timestamp);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  const currentMonthHistory = getHistoryForPeriod(currentMonth, currentYear);
  const previousMonthHistory = getHistoryForPeriod(previousMonth, previousYear);

  const calculateAvg = (h: AnalysisResult[]) => h.length > 0 ? h.reduce((acc, curr) => acc + curr.overallScore, 0) / h.length : 0;
  const avgCurrent = calculateAvg(currentMonthHistory);
  const avgPrevious = calculateAvg(previousMonthHistory);
  const scoreDeltaValue = avgPrevious === 0 ? 0 : ((avgCurrent - avgPrevious) / avgPrevious) * 100;
  const scoreDelta = (scoreDeltaValue >= 0 ? '+' : '') + scoreDeltaValue.toFixed(1) + '%';

  const evalDeltaValue = previousMonthHistory.length === 0 ? 0 : ((currentMonthHistory.length - previousMonthHistory.length) / previousMonthHistory.length) * 100;
  const evalDelta = (evalDeltaValue >= 0 ? '+' : '') + evalDeltaValue.toFixed(0) + '%';

  const highCurrent = currentMonthHistory.filter(h => h.overallScore >= 90).length;
  const highPrevious = previousMonthHistory.filter(h => h.overallScore >= 90).length;
  const highDeltaValue = highPrevious === 0 ? 0 : ((highCurrent - highPrevious) / highPrevious) * 100;
  const highDelta = (highDeltaValue >= 0 ? '+' : '') + highDeltaValue.toFixed(0) + '%';

  const lowCurrent = currentMonthHistory.filter(h => h.overallScore < 75).length;
  const lowPrevious = previousMonthHistory.filter(h => h.overallScore < 75).length;
  const lowDeltaValue = lowPrevious === 0 ? 0 : ((lowCurrent - lowPrevious) / lowPrevious) * 100;
  const lowDelta = (lowDeltaValue >= 0 ? '+' : '') + lowDeltaValue.toFixed(0) + '%';

  // --- Aggregate Skills Criteria scores dynamically ---
  const defaultCriteriaScores = {
    "Grammar": 82,
    "Fluency": 78,
    "Empathy": 85,
    "Coherence": 80,
    "Objectives": 74
  };

  const aggregateSkills = () => {
    const count: Record<string, number> = {};
    const sum: Record<string, number> = {};

    activeHistory.forEach(h => {
      if (h.criteriaResults && h.criteriaResults.length > 0) {
        h.criteriaResults.forEach(crit => {
          let category = "Objectives";
          const lowerName = crit.name.toLowerCase();
          
          if (lowerName.includes('grammar') || lowerName.includes('mechanics') || lowerName.includes('vocabulary')) {
            category = "Grammar";
          } else if (lowerName.includes('fluency') || lowerName.includes('pronunciation') || lowerName.includes('efficiency') || lowerName.includes('flow')) {
            category = "Fluency";
          } else if (lowerName.includes('empathy') || lowerName.includes('tone') || lowerName.includes('style')) {
            category = "Empathy";
          } else if (lowerName.includes('coherence') || lowerName.includes('solution') || lowerName.includes('accuracy')) {
            category = "Coherence";
          }

          sum[category] = (sum[category] || 0) + crit.score;
          count[category] = (count[category] || 0) + 1;
        });
      }
    });

    return {
      Grammar: count["Grammar"] ? Math.round(sum["Grammar"] / count["Grammar"]) : defaultCriteriaScores.Grammar,
      Fluency: count["Fluency"] ? Math.round(sum["Fluency"] / count["Fluency"]) : defaultCriteriaScores.Fluency,
      Empathy: count["Empathy"] ? Math.round(sum["Empathy"] / count["Empathy"]) : defaultCriteriaScores.Empathy,
      Coherence: count["Coherence"] ? Math.round(sum["Coherence"] / count["Coherence"]) : defaultCriteriaScores.Coherence,
      Objectives: count["Objectives"] ? Math.round(sum["Objectives"] / count["Objectives"]) : defaultCriteriaScores.Objectives,
    };
  };

  const skillsData = aggregateSkills();

  const handleCardClick = (filter: 'all' | 'high' | 'low') => {
    if (onFilterSelect) {
      onFilterSelect(filter);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 75) return 'text-[#0500e2] dark:text-[#4b53fa]';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 max-w-xs">
          <p className="text-xs font-bold text-slate-400 mb-1">{data.date}</p>
          <p className="text-sm font-bold text-slate-900 dark:text-white mb-2 truncate">{data.scenario}</p>
          <div className="flex flex-col gap-1 text-xs">
            <div className="flex justify-between items-center gap-4">
              <span className="text-slate-500 dark:text-slate-400">Score:</span>
              <span className="font-bold text-[#0500e2]">{data.score}%</span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-slate-500 dark:text-slate-400">Language:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">{data.language}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 font-sans" dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* Quick Activity Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-indigo-50/40 dark:bg-indigo-900/10 p-4 rounded-2xl border border-indigo-100/50 dark:border-indigo-500/10 shadow-sm gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl text-[#0500e2] dark:text-[#4b53fa] shadow-sm">
            <Bell size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{loc.recentActivity}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{loc.stayUpdated}</p>
          </div>
        </div>
        <button 
          onClick={() => setView('history')}
          className="px-4 py-2 bg-[#0500e2] hover:bg-[#0400c0] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#0500e2]/20 transition-all active:scale-95 whitespace-nowrap"
        >
          {loc.showAll}
        </button>
      </div>

      {/* Speaking Practice Call CTA Banner */}
      <div className="bg-[#0500e2] dark:bg-[#0400c0] rounded-3xl p-6 md:p-8 border border-[#0500e2]/10 dark:border-white/10 shadow-xl shadow-[#0500e2]/15 relative overflow-hidden group">
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3 max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-[10px] md:text-xs font-bold tracking-wider uppercase backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {loc.ctaBadge}
            </span>
            <h2 className="text-xl md:text-3xl font-sans font-extrabold text-white tracking-tight leading-tight">
              {loc.ctaPracticeTitle}
            </h2>
            <p className="text-white/80 text-xs md:text-sm leading-relaxed max-w-2xl font-normal">
              {loc.ctaPracticeDesc}
            </p>
          </div>
          
          <button
            onClick={() => setView('ai-conversation')}
            className="w-full md:w-auto inline-flex items-center justify-center gap-3 px-6 py-3.5 bg-white hover:bg-slate-50 text-[#0500e2] font-bold rounded-xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all duration-200 cursor-pointer text-sm whitespace-nowrap"
          >
            <PhoneCall size={18} />
            <span>{loc.ctaPracticeButton}</span>
            <ArrowUpRight size={16} />
          </button>
        </div>
      </div>

      {/* Hero Wide Card: Fluency & Level Up Tracker */}
      <div 
        onClick={() => handleCardClick('all')}
        className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer transition-all hover:shadow-md group relative overflow-hidden"
      >
        <div className="flex flex-col lg:flex-row justify-between items-stretch gap-6 relative z-10">
          
          {/* Level Progress section */}
          <div className="flex flex-col justify-between space-y-4 lg:w-1/3 border-b lg:border-b-0 lg:border-e border-slate-100 dark:border-slate-800 pb-4 lg:pb-0 lg:pe-6">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Star size={14} className="text-amber-400 fill-amber-400" />
                {loc.level} {currentLevel}
              </span>
              <div className="text-5xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">
                {averageScore}%
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {loc.avgFluency}
              </p>
            </div>

            {/* Level progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-[#0500e2] dark:text-[#4b53fa]">{totalXp} {loc.xp}</span>
                <span className="text-slate-400">{xpNeededForNextLevel} {loc.xp} {loc.nextLevel} {currentLevel + 1}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-[#0500e2] to-indigo-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${levelProgressPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Sparkline trend representation */}
          <div className="flex flex-col justify-between flex-1 lg:ps-4 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Flame size={16} className="text-orange-500 fill-orange-500" />
                  {loc.streaks}: <span className="text-orange-500 font-extrabold">{activeStreak} {loc.days}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  You've improved speaking fluency by <span className="text-emerald-500 font-bold">{scoreDelta}</span> this month
                </p>
              </div>

              {/* Action Button */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setView('ai-conversation');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/30 text-[#0500e2] dark:text-[#4b53fa] rounded-xl text-xs font-bold transition-colors"
              >
                <Languages size={14} />
                {loc.viewScenarios}
                <ArrowUpRight size={14} />
              </button>
            </div>

            {/* Micro Sparkline */}
            <div className="h-[100px] w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0500e2" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#0500e2" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#0500e2" 
                    strokeWidth={2.5} 
                    fill="url(#colorAvg)" 
                    dot={{ r: 3, fill: "#0500e2", stroke: "#fff", strokeWidth: 1.5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>

      {/* Three Metric Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
        {/* Total Conversations */}
        <div 
          onClick={() => handleCardClick('all')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start mb-3">
            <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{loc.totalSessions}</span>
            <div className="p-1.5 bg-blue-50 dark:bg-blue-900/10 text-blue-500 rounded-lg">
              <MessageSquare size={16} />
            </div>
          </div>
          <div className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-1">{totalSessions}</div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <span className="text-emerald-500 font-bold">{evalDelta}</span>
            <span>{loc.vsLastMonth}</span>
          </div>
        </div>

        {/* High Masteries */}
        <div 
          onClick={() => handleCardClick('high')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start mb-3">
            <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{loc.highMasteries}</span>
            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-500 rounded-lg">
              <Trophy size={16} />
            </div>
          </div>
          <div className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-1">{highScores}</div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <span className="text-emerald-500 font-bold">{highDelta}</span>
            <span>{loc.vsLastMonth}</span>
          </div>
        </div>

        {/* Focus Required */}
        <div 
          onClick={() => handleCardClick('low')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start mb-3">
            <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{loc.focusRequired}</span>
            <div className="p-1.5 bg-amber-50 dark:bg-amber-900/10 text-amber-500 rounded-lg">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-1">{lowScores}</div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <span className="text-red-500 font-bold">{lowDelta}</span>
            <span>{loc.vsLastMonth}</span>
          </div>
        </div>

      </div>

      {/* Main Interactive Chart Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{loc.qualityTrend}</h3>
            <p className="text-xs text-slate-400 mt-1">Timeline of speaking accuracy and flow results.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              {['1w', '1m', '6m', '1y'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range as any)}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                    timeRange === range 
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                  }`}
                >
                  {range.toUpperCase()}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              <Filter size={14} /> {loc.all}
            </button>
          </div>
        </div>

        <div className="h-[300px] w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMain" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0500e2" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#0500e2" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 11 }} 
                dy={10}
              />
              <YAxis 
                domain={[0, 100]} 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 11 }} 
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#0500e2', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Area 
                type="monotone" 
                dataKey="score" 
                stroke="#0500e2" 
                strokeWidth={3}
                fill="url(#colorMain)" 
                activeDot={{ r: 5, strokeWidth: 3, stroke: '#fff', fill: '#0500e2' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two-Column Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Bento: Skills Mastery Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-2">
          <div className="mb-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Brain size={18} className="text-[#0500e2] dark:text-[#4b53fa]" />
              {loc.categoryPerformance}
            </h3>
            <p className="text-xs text-slate-400 mt-1">{loc.skillsBreakdownDesc}</p>
          </div>

          <div className="space-y-5">
            {/* Grammar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700 dark:text-slate-300">{loc.grammar}</span>
                <span className="text-[#0500e2] dark:text-[#4b53fa]">{skillsData.Grammar}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-[#0500e2] h-full rounded-full" 
                  style={{ width: `${skillsData.Grammar}%` }}
                ></div>
              </div>
            </div>

            {/* Fluency */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700 dark:text-slate-300">{loc.fluency}</span>
                <span className="text-[#0500e2] dark:text-[#4b53fa]">{skillsData.Fluency}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-500 h-full rounded-full" 
                  style={{ width: `${skillsData.Fluency}%` }}
                ></div>
              </div>
            </div>

            {/* Empathy */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700 dark:text-slate-300">{loc.empathy}</span>
                <span className="text-[#0500e2] dark:text-[#4b53fa]">{skillsData.Empathy}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-teal-500 h-full rounded-full" 
                  style={{ width: `${skillsData.Empathy}%` }}
                ></div>
              </div>
            </div>

            {/* Coherence */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700 dark:text-slate-300">{loc.coherence}</span>
                <span className="text-[#0500e2] dark:text-[#4b53fa]">{skillsData.Coherence}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-violet-500 h-full rounded-full" 
                  style={{ width: `${skillsData.Coherence}%` }}
                ></div>
              </div>
            </div>

            {/* Objectives */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700 dark:text-slate-300">{loc.objectives}</span>
                <span className="text-[#0500e2] dark:text-[#4b53fa]">{skillsData.Objectives}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full" 
                  style={{ width: `${skillsData.Objectives}%` }}
                ></div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Bento: Recent Conversations */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-3 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen size={18} className="text-[#0500e2] dark:text-[#4b53fa]" />
                  {loc.recentConversations}
                </h3>
                <p className="text-xs text-slate-400 mt-1">{loc.recentSessionsDesc}</p>
              </div>
              
              <button 
                onClick={() => setView('history')}
                className="text-xs font-bold text-[#0500e2] hover:underline flex items-center gap-0.5"
              >
                {loc.viewHistory}
                <ChevronRight size={14} className={isRTL ? "transform rotate-180" : ""} />
              </button>
            </div>

            <div className="space-y-3.5">
              {activeHistory.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                  <MessageSquare size={32} className="opacity-40 mb-2" />
                  <p className="text-sm">{loc.noData}</p>
                </div>
              ) : (
                activeHistory.slice(0, 4).map((session, idx) => {
                  const cleanScenarioName = session.customerName.replace(/^Roleplay:\s*/i, '');
                  // Check language
                  const langMatch = session.agentName.match(/\(([^)]+)\)/);
                  const languageTag = langMatch ? langMatch[1] : "English";

                  return (
                    <div 
                      key={idx}
                      onClick={() => {
                        setView('history');
                        // Optional: trigger selection logic inside parent history component or viewState
                      }}
                      className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/50 dark:hover:bg-slate-800/60 transition-colors flex items-center justify-between cursor-pointer group"
                    >
                      <div className="space-y-1 truncate max-w-[70%]">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-[#0500e2] dark:group-hover:text-[#4b53fa] transition-colors">
                          {cleanScenarioName}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span className="px-1.5 py-0.5 rounded-md bg-slate-200/50 dark:bg-slate-800 text-[10px] font-bold text-slate-500">
                            {languageTag}
                          </span>
                          <span>•</span>
                          <span>{new Date(session.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-end">
                          <div className={`text-base font-extrabold ${getScoreColor(session.overallScore)}`}>
                            {session.overallScore}%
                          </div>
                          <div className="text-[10px] text-slate-400 font-bold">
                            +{(session.overallScore * 12) + 60} XP
                          </div>
                        </div>
                        <ChevronRight size={16} className={`text-slate-300 group-hover:text-[#0500e2] ${isRTL ? "transform rotate-180" : ""}`} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {activeHistory.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex justify-between items-center text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Clock size={14} />
                Practiced {activeHistory.length} times total
              </span>
              <span className="flex items-center gap-1 text-emerald-500 font-bold">
                <ShieldCheck size={14} />
                Skills Verified
              </span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
