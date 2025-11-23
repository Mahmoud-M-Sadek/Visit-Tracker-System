import React, { useEffect, useState } from 'react';
import { Agent, AgentStatus } from '../types';
import { getAgents, createAgent, deleteAgent } from '../services/mockBackend';
import { Plus, Search, UserPlus, CheckCircle, XCircle, Trash2, AlertTriangle } from 'lucide-react';

export const AgentsPage = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    company: '',
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
      const code = `AGT-${nextId}`;

      await createAgent({
        code,
        ...formData
      });
      
      setIsModalOpen(false);
      setFormData({ name: '', company: '', phone: '', password: '', status: AgentStatus.ACTIVE });
      loadAgents(); // Refresh
    } catch (error) {
      alert('فشل إنشاء المندوب');
    }
  };

  const handleDeleteAgent = async (id: string, name: string) => {
    if (window.confirm(`هل أنت متأكد من حذف المندوب "${name}"؟\n\nتنبيه: سيتم حذف جميع الزيارات والتقارير المرتبطة به نهائياً.`)) {
      try {
        await deleteAgent(id);
        loadAgents();
      } catch (error) {
        alert('حدث خطأ أثناء الحذف');
      }
    }
  };

  const filteredAgents = agents.filter(agent => 
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">إدارة المندوبين</h2>
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
            placeholder="بحث باسم المندوب أو الكود..."
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
                <th className="px-6 py-4 font-semibold">بيانات المندوب</th>
                <th className="px-6 py-4 font-semibold">الكود</th>
                <th className="px-6 py-4 font-semibold">الشركة</th>
                <th className="px-6 py-4 font-semibold">الحالة</th>
                <th className="px-6 py-4 font-semibold">تاريخ الانضمام</th>
                <th className="px-6 py-4 font-semibold">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                 <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">جاري تحميل البيانات...</td></tr>
              ) : filteredAgents.length === 0 ? (
                 <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">لا يوجد مندوبين.</td></tr>
              ) : (
                filteredAgents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{agent.name}</div>
                      <div className="text-sm text-slate-500">{agent.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-600" dir="ltr">{agent.code}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{agent.company}</td>
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
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(agent.createdAt).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleDeleteAgent(agent.id, agent.name)}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
                        title="حذف المندوب"
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-slate-800 mb-6">تسجيل مندوب جديد</h3>
            <form onSubmit={handleCreateAgent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الاسم الكامل</label>
                <input required type="text" className="w-full p-2 border rounded-lg" 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الشركة التابع لها</label>
                <input required type="text" className="w-full p-2 border rounded-lg" 
                  value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">رقم الهاتف / واتساب</label>
                <input required type="text" className="w-full p-2 border rounded-lg" 
                  value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">كلمة المرور</label>
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
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">إنشاء الحساب</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};