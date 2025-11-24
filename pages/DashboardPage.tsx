import React, { useEffect, useState } from 'react';
import { DashboardStats } from '../types';
import { getStats, getVisits } from '../services/mockBackend';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Users, MapPin, Calendar, Activity, TrendingUp } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
    <div>
      <p className="text-sm text-slate-500 font-medium mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
    </div>
    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
  </div>
);

export const DashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Gemini Insight State
  const [insight, setInsight] = useState<string>("");
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const data = await getStats();
      const visits = await getVisits();
      setStats(data);

      // Prepare chart data (Visits per day - last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
      }).reverse();

      const chart = last7Days.map(date => ({
        date: date.split('-').slice(1).join('/'), // MM/DD
        visits: visits.filter(v => v.visitDate.startsWith(date)).length
      }));
      
      setChartData(chart);
      setLoading(false);
    };

    loadData();
  }, []);

  const generateAIInsight = async () => {
    // This is where we integrate Gemini
    if (!process.env.API_KEY) {
      setInsight("مفتاح API غير موجود. تحليل تجريبي: زادت زيارات المناديب بنسبة 15% هذا الأسبوع. شركة فايزر هي الأكثر نشاطاً.");
      return;
    }

    setAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const visits = await getVisits();
      // Simulating a summary prompt asking for Arabic response
      const prompt = `أنت مساعد ذكي لمدير عيادة/صيدلية. قم بتحليل ملاحظات زيارات مناديب الشركات التالية وقدم ملخص استراتيجي قصير (جملة واحدة) حول أهم العروض أو المنتجات المعروضة: ${JSON.stringify(visits.slice(0, 5).map(v => v.notes))}`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      setInsight(response.text || "لم يتم إنشاء أي تحليل.");
    } catch (e) {
      console.error(e);
      setInsight("خطأ في إنشاء التحليل. يرجى التحقق من الإعدادات.");
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">جاري تحميل لوحة التحكم...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">نظرة عامة</h2>
        <button 
          onClick={generateAIInsight}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
        >
          <Activity size={16} />
          {analyzing ? 'جاري تحليل العروض...' : 'تحليل الزيارات بالذكاء الاصطناعي'}
        </button>
      </div>

      {insight && (
        <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg text-purple-800 text-sm flex gap-3 animate-fade-in">
           <div className="mt-1"><TrendingUp size={16}/></div>
           <div>
             <span className="font-bold">تحليل الذكاء الاصطناعي: </span>
             {insight}
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="إجمالي الزيارات الواردة" value={stats?.totalVisits} icon={MapPin} color="bg-blue-500" />
        <StatCard title="زيارات اليوم" value={stats?.visitsToday} icon={Calendar} color="bg-green-500" />
        <StatCard title="المناديب المسجلين" value={stats?.totalAgents} icon={Users} color="bg-indigo-500" />
        <StatCard title="مناديب نشطين" value={stats?.activeAgents} icon={Activity} color="bg-orange-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">نشاط الزيارات (آخر 7 أيام)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} allowDecimals={false} orientation="right" />
                <Tooltip 
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', textAlign: 'right'}}
                />
                <Bar dataKey="visits" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">معدل الاستقبال</h3>
           <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} orientation="right" />
                <Tooltip contentStyle={{textAlign: 'right'}}/>
                <Line type="monotone" dataKey="visits" stroke="#8b5cf6" strokeWidth={3} dot={{r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff'}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};