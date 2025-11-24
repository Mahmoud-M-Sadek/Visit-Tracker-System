import React, { useEffect, useState } from 'react';
import { Agent, Visit } from '../types';
import { getVisits, createVisit, deleteVisit, getAgents } from '../services/mockBackend';
import { useAuth } from '../context/AuthContext';
import { MapPin, Camera, Download, Plus, Calendar, Search, FileText, Trash2, User, Phone, Briefcase } from 'lucide-react';

export const VisitsPage = () => {
  const { user, isAdmin } = useAuth();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    agentId: '',
    visitDate: new Date().toISOString().slice(0, 16), // datetime-local format
    notes: '',
    photoUrl: '',
    lat: 0,
    lng: 0
  });
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [visitsData, agentsData] = await Promise.all([getVisits(), getAgents()]);
    setVisits(visitsData);
    setAgents(agentsData);
    setLoading(false);
  };

  const handleDeleteVisit = async (id: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذا التقرير نهائياً؟")) {
      try {
        await deleteVisit(id);
        setVisits(prev => prev.filter(v => v.id !== id));
      } catch (e) {
        alert("فشل حذف الزيارة");
      }
    }
  };

  const handleExportCSV = () => {
    // CSV Header in Arabic
    const headers = ['التاريخ', 'اسم المندوب', 'شركة الأدوية', 'رقم الهاتف', 'تقرير الزيارة (الملاحظات)', 'الموقع'];
    const rows = visits.map(v => [
      new Date(v.visitDate).toLocaleString('ar-EG'),
      v.agentName,
      v.agentCompany,
      v.agentPhone,
      `"${v.notes.replace(/"/g, '""')}"`, // Escape quotes
      v.location ? `${v.location.lat},${v.location.lng}` : 'N/A'
    ]);

    // Add BOM for Excel Arabic support
    const csvContent = "\uFEFF" + "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "visits_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("المتصفح لا يدعم تحديد الموقع");
      return;
    }
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }));
        setIsGettingLocation(false);
      },
      (error) => {
        alert("تعذر الوصول إلى موقعك");
        setIsGettingLocation(false);
      }
    );
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Find selected agent details
    const selectedAgent = agents.find(a => a.id === formData.agentId);
    if (!selectedAgent) {
      alert("الرجاء اختيار المندوب");
      return;
    }

    try {
      await createVisit({
        agentId: selectedAgent.id,
        agentName: selectedAgent.name,
        agentCompany: selectedAgent.company,
        agentPhone: selectedAgent.phone,
        visitDate: new Date(formData.visitDate).toISOString(),
        notes: formData.notes,
        photoUrl: formData.photoUrl,
        location: formData.lat ? { lat: formData.lat, lng: formData.lng } : undefined
      });
      setIsModalOpen(false);
      // Reset form
      setFormData({
        agentId: '',
        visitDate: new Date().toISOString().slice(0, 16),
        notes: '',
        photoUrl: '',
        lat: 0,
        lng: 0
      });
      loadData();
    } catch (err) {
      alert("فشل حفظ الزيارة");
    }
  };

  const filteredVisits = visits.filter(v => {
    const matchText = 
      v.agentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      v.agentCompany.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.agentPhone.includes(searchTerm);
    
    const matchDate = dateFilter ? v.visitDate.startsWith(dateFilter) : true;
    
    return matchText && matchDate;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">سجل الزيارات والتقارير</h2>
           <p className="text-slate-500 text-sm">تسجيل زيارات المناديب وكتابة التقارير</p>
        </div>
        <div className="flex gap-2">
            <button 
              onClick={handleExportCSV}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium shadow-sm"
            >
              <Download size={16} /> تقرير Excel
            </button>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium shadow-sm"
          >
            <Plus size={16} /> تسجيل زيارة واردة
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
         <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="بحث باسم المندوب، الشركة، أو الهاتف..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-9 pl-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
         </div>
         <div className="relative">
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
             <input 
              type="date" 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full pr-9 pl-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-600"
            />
         </div>
         {/* Reset Filter Button could go here */}
      </div>

      {/* Visits List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="text-center py-12 text-slate-500">جاري تحميل التقارير...</div>
        ) : filteredVisits.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
            <FileText className="mx-auto text-slate-300 mb-2" size={48} />
            <p className="text-slate-500">لا توجد سجلات مطابقة.</p>
          </div>
        ) : (
          filteredVisits.map((visit) => (
            <div key={visit.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative group">
               {/* Delete Button */}
               <button 
                 onClick={() => handleDeleteVisit(visit.id)}
                 className="absolute top-4 left-4 text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
                 title="حذف التقرير"
               >
                 <Trash2 size={18} />
               </button>

              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1">
                  {/* Header: Agent Info */}
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <User size={20} className="text-blue-500" />
                      {visit.agentName}
                    </h3>
                    <span className="text-xs text-slate-400 mx-1">•</span>
                    <span className="text-sm text-slate-600 flex items-center gap-1">
                       <Briefcase size={14} />
                       {visit.agentCompany}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                     <span className="flex items-center gap-1">
                        <Phone size={14} /> {visit.agentPhone}
                     </span>
                     <span className="flex items-center gap-1">
                        <Calendar size={14} /> {new Date(visit.visitDate).toLocaleString('ar-EG')}
                     </span>
                     {visit.location && <MapPin size={14} className="text-red-500" title="تم تسجيل الموقع" />}
                  </div>

                  {/* Body: Report/Notes */}
                  <div className="bg-amber-50 p-4 rounded-lg text-slate-800 text-sm border border-amber-100">
                    <div className="font-semibold mb-1 text-amber-800">تقرير الزيارة:</div>
                    {visit.notes}
                  </div>
                </div>
                
                {/* Image */}
                {visit.photoUrl && (
                  <div className="w-full md:w-40 h-40 flex-shrink-0">
                    <img src={visit.photoUrl} alt="Visit Document" className="w-full h-full object-cover rounded-lg border border-slate-200" />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

       {/* Add Visit Modal */}
       {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in duration-200 my-8">
            <h3 className="text-xl font-bold text-slate-800 mb-6">تسجيل زيارة واردة</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">اختر المندوب</label>
                <select 
                  required 
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.agentId}
                  onChange={e => setFormData({...formData, agentId: e.target.value})}
                >
                  <option value="">-- اختر المندوب --</option>
                  {agents.map(agent => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} - {agent.company} ({agent.code})
                    </option>
                  ))}
                </select>
                <div className="mt-1 text-xs text-slate-500">
                  غير موجود؟ <a href="/#/agents" className="text-blue-600 hover:underline">أضف مندوب جديد أولاً</a>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">تاريخ ووقت الزيارة</label>
                <input required type="datetime-local" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={formData.visitDate} onChange={e => setFormData({...formData, visitDate: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الموقع الجغرافي (اختياري)</label>
                <div className="flex gap-2">
                   <div className="flex-1 p-2 bg-slate-50 border rounded-lg text-sm text-slate-500 truncate text-left" dir="ltr">
                      {formData.lat ? `${formData.lat.toFixed(6)}, ${formData.lng.toFixed(6)}` : 'لم يتم التحديد'}
                   </div>
                   <button type="button" onClick={handleGetLocation} className="px-3 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700 text-sm">
                      {isGettingLocation ? 'جاري التحديد...' : 'تحديد الموقع'}
                   </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">صورة / كارت المندوب (اختياري)</label>
                <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-slate-50 transition-colors relative">
                   <input type="file" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                   <div className="flex flex-col items-center justify-center text-slate-400 gap-1">
                      <Camera size={24} />
                      <span className="text-xs">{formData.photoUrl ? 'تم تحديد الصورة' : 'اضغط لرفع صورة'}</span>
                   </div>
                </div>
                {formData.photoUrl && <img src={formData.photoUrl} alt="Preview" className="mt-2 h-20 w-20 object-cover rounded-md border" />}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">تقرير الزيارة (الملاحظات)</label>
                <textarea required rows={4} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" 
                  placeholder="اكتب تفاصيل الزيارة، العرض المقدم، أو أي ملاحظات أخرى..."
                  value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium">إلغاء</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">حفظ التقرير</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};