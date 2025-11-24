import React, { useEffect, useState } from 'react';
import { Agent, AgentStatus, Visit } from '../types';
import { getAgents, createAgent, deleteAgent, getVisits } from '../services/mockBackend';
import { Plus, Search, UserPlus, CheckCircle, XCircle, Trash2, Briefcase, FileText, Download, Calendar, Pill } from 'lucide-react';

export const AgentsPage = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Report Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [agentVisits, setAgentVisits] = useState<Visit[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    products: '',
    phone: '',
    password: '',
    status: AgentStatus.ACTIVE
  });

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    const data = await getAgents();
    setAgents(data);
    setLoading(false);
  };

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Auto-generate code
      const nextId = agents.length + 1001;
      const code = `REP-${nextId}`;

      await createAgent({
        code,
        ...formData
      });
      
      setIsModalOpen(false);
      setFormData({ name: '', company: '', products: '', phone: '', password: '', status: AgentStatus.ACTIVE });
      loadAgents(); // Refresh
    } catch (error) {
      alert('فشل إنشاء المندوب');
    }
  };

  const handleDeleteAgent = async (id: string, name: string) => {
    if (window.confirm(`هل أنت متأكد من حذف المندوب "${name}"؟\n\nتنبيه: سيتم حذف جميع زياراته وتقاريره السابقة نهائياً.`)) {
      try {
        await deleteAgent(id);
        loadAgents();
      } catch (error) {
        alert('حدث خطأ أثناء الحذف');
      }
    }
  };

  const handleShowReport = async (agent: Agent) => {
    // Fetch all visits and filter for this agent
    // In a real API, this would be an endpoint like /visits/by-agent/:id
    const allVisits = await getVisits();
    const specificVisits = allVisits.filter(v => v.agentId === agent.id);
    // Sort by date descending (newest first)
    specificVisits.sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());
    
    setSelectedAgent(agent);
    setAgentVisits(specificVisits);
    setIsReportModalOpen(true);
  };

  const handleExportAgentReport = () => {
    if (!selectedAgent) return;

    const headers = ['التاريخ', 'الوقت', 'تقرير الزيارة (الملاحظات)'];
    const rows = agentVisits.map(v => {
      const dateObj = new Date(v.visitDate);
      return [
        dateObj.toLocaleDateString('ar-EG'),
        dateObj.toLocaleTimeString('ar-EG'),
        `"${v.notes.replace(/"/g, '""')}"`
      ];
    });

    // Header info for the Excel file
    const fileHeader = [
      `تقرير المندوب: ${selectedAgent.name}`,
      `كود المندوب: ${selectedAgent.code}`,
      `الشركة: ${selectedAgent.company}`,
      `الأدوية المسؤول عنها: ${selectedAgent.products || 'غير محدد'}`,
      `رقم الهاتف: ${selectedAgent.phone}`,
      `تاريخ الاستخراج: ${new Date().toLocaleString('ar-EG')}`,
      '' // Empty line
    ].join('\n');

    const csvContent = "\uFEFF" + "data:text/csv;charset=utf-8," 
      + fileHeader + "\n"
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Report_${selectedAgent.code}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredAgents = agents.filter(agent => 
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (agent.products && agent.products.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">سجل المناديب</h2>
           <p className="text-slate-500 text-sm">إدارة مناديب الشركات، الأكواد، والأدوية</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          <UserPlus size={18} />
          إضافة مندوب جديد
        </button>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="بحث باسم المندوب، الكود، الشركة، أو اسم الدواء..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Agents Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 text-slate-600 text-sm uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">المندوب</th>
                <th className="px-6 py-4 font-semibold">الكود</th>
                <th className="px-6 py-4 font-semibold">الشركة والأدوية</th>
                <th className="px-6 py-4 font-semibold">الحالة</th>
                <th className="px-6 py-4 font-semibold">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                 <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">جاري تحميل البيانات...</td></tr>
              ) : filteredAgents.length === 0 ? (
                 <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">لا يوجد مناديب مسجلين.</td></tr>
              ) : (
                filteredAgents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{agent.name}</div>
                      <div className="text-sm text-slate-500 font-mono">{agent.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-blue-600 font-semibold" dir="ltr">{agent.code}</td>
                    <td className="px-6 py-4">
                       <div className="flex flex-col gap-1">
                         <div className="flex items-center gap-2 text-slate-800 font-medium">
                            <Briefcase size={14} className="text-slate-400" />
                            {agent.company}
                         </div>
                         {agent.products && (
                           <div className="flex items-start gap-2 text-xs text-slate-500">
                              <Pill size={12} className="text-purple-400 mt-0.5" />
                              <span className="truncate max-w-[200px]" title={agent.products}>{agent.products}</span>
                           </div>
                         )}
                       </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                        agent.status === AgentStatus.ACTIVE 
                          ? 'bg-green-50 text-green-700 border border-green-200' 
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {agent.status === AgentStatus.ACTIVE ? <CheckCircle size={12}/> : <XCircle size={12}/>}
                        {agent.status === AgentStatus.ACTIVE ? 'نشط' : 'غير نشط'}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      <button 
                        onClick={() => handleShowReport(agent)}
                        className="flex items-center gap-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                        title="عرض تقرير المندوب والزيارات"
                      >
                        <FileText size={16} />
                        تقرير
                      </button>
                      
                      <button 
                        onClick={() => handleDeleteAgent(agent.id, agent.name)}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        title="حذف المندوب وبياناته"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Agent Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-slate-800 mb-6">تسجيل مندوب جديد</h3>
            <form onSubmit={handleCreateAgent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">اسم المندوب</label>
                <input required type="text" className="w-full p-2 border rounded-lg" placeholder="مثال: د. محمد أحمد"
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">شركة الأدوية</label>
                <input required type="text" className="w-full p-2 border rounded-lg" placeholder="مثال: فايزر، سانوفي..."
                  value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الأدوية المسؤولة عنها (اختياري)</label>
                <input type="text" className="w-full p-2 border rounded-lg" placeholder="مثال: دواء 1، دواء 2..."
                  value={formData.products} onChange={e => setFormData({...formData, products: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">رقم الهاتف / واتساب</label>
                <input required type="text" className="w-full p-2 border rounded-lg" 
                  value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">كلمة المرور (للمندوب)</label>
                <input required type="password" className="w-full p-2 border rounded-lg" 
                  value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الحالة</label>
                <select className="w-full p-2 border rounded-lg"
                  value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as AgentStatus})}>
                  <option value={AgentStatus.ACTIVE}>نشط</option>
                  <option value={AgentStatus.INACTIVE}>غير نشط</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">إلغاء</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">إنشاء السجل</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Agent Report Modal */}
      {isReportModalOpen && selectedAgent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
             {/* Modal Header */}
             <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-slate-50 rounded-t-xl">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                     <FileText className="text-indigo-600"/> 
                     كشف حساب / تقرير المندوب
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
                      <div className="flex items-center gap-1"><span className="font-bold text-slate-800">الاسم:</span> {selectedAgent.name}</div>
                      <div className="flex items-center gap-1"><span className="font-bold text-slate-800">الشركة:</span> {selectedAgent.company}</div>
                      <div className="flex items-center gap-1"><span className="font-bold text-slate-800">الأدوية:</span> {selectedAgent.products || 'غير محدد'}</div>
                      <div className="flex items-center gap-1"><span className="font-bold text-slate-800">الهاتف:</span> {selectedAgent.phone}</div>
                      <div className="flex items-center gap-1"><span className="font-bold text-slate-800">الكود:</span> <span className="font-mono text-indigo-600">{selectedAgent.code}</span></div>
                  </div>
                </div>
                <button onClick={() => setIsReportModalOpen(false)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors">
                  <XCircle size={24} />
                </button>
             </div>

             {/* Modal Content */}
             <div className="p-6 flex-1 overflow-y-auto">
                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                   <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 flex items-center justify-between">
                      <div>
                        <div className="text-sm text-indigo-600 mb-1">إجمالي الزيارات المسجلة</div>
                        <div className="text-3xl font-bold text-indigo-800">{agentVisits.length}</div>
                      </div>
                      <Briefcase className="text-indigo-300 w-10 h-10" />
                   </div>
                   <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 flex items-center justify-between">
                      <div>
                        <div className="text-sm text-emerald-600 mb-1">آخر زيارة</div>
                        <div className="text-lg font-bold text-emerald-800">
                          {agentVisits.length > 0 ? new Date(agentVisits[0].visitDate).toLocaleDateString('ar-EG') : '-'}
                        </div>
                      </div>
                      <Calendar className="text-emerald-300 w-10 h-10" />
                   </div>
                </div>

                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <FileText size={18} /> سجل الزيارات التفصيلي
                </h4>
                
                {agentVisits.length === 0 ? (
                   <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-200 rounded-lg">
                      لا توجد زيارات مسجلة لهذا المندوب حتى الآن.
                   </div>
                ) : (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-right text-sm">
                         <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                            <tr>
                              <th className="px-4 py-3 font-semibold w-1/4">التاريخ والوقت</th>
                              <th className="px-4 py-3 font-semibold">تفاصيل التقرير / الملاحظات</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100">
                            {agentVisits.map(v => (
                               <tr key={v.id} className="hover:bg-slate-50">
                                  <td className="px-4 py-3 whitespace-nowrap text-slate-700 align-top">
                                     <div className="font-medium">{new Date(v.visitDate).toLocaleDateString('ar-EG')}</div>
                                     <div className="text-xs text-slate-500">{new Date(v.visitDate).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}</div>
                                  </td>
                                  <td className="px-4 py-3 text-slate-800 align-top leading-relaxed">
                                     {v.notes}
                                  </td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                  </div>
                )}
             </div>

             {/* Modal Footer */}
             <div className="p-4 border-t border-gray-100 bg-white rounded-b-xl flex justify-between items-center">
                 <button onClick={() => setIsReportModalOpen(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">
                   إغلاق
                 </button>
                 <button 
                  onClick={handleExportAgentReport} 
                  className={`flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg font-medium shadow-sm transition-colors ${agentVisits.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={agentVisits.length === 0}
                 >
                   <Download size={18} />
                   تصدير كشف حساب (Excel)
                 </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};