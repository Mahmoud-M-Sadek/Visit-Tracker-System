import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  MapPin, 
  LogOut, 
  Menu, 
  X,
  Briefcase
} from 'lucide-react';

export const Layout = ({ children }: { children?: React.ReactNode }) => {
  const { user, logoutUser, isAdmin } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'لوحة التحكم', path: '/', icon: LayoutDashboard, show: true },
    { label: 'المندوبين', path: '/agents', icon: Users, show: isAdmin },
    { label: 'الزيارات', path: '/visits', icon: MapPin, show: true },
  ];

  const handleLogout = () => {
    logoutUser();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar for Desktop (RTL: Fixed on Right) */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white min-h-screen fixed right-0 z-20">
        <div className="p-6 border-b border-slate-700 flex items-center gap-2">
          <Briefcase className="w-8 h-8 text-blue-400" />
          <span className="font-bold text-xl">نظام تتبع الزيارات</span>
        </div>

        <div className="flex-1 py-6 px-3 space-y-1">
          {navItems.filter(item => item.show).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
              <span className="font-bold text-lg">{user?.name.charAt(0)}</span>
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate capitalize">
                {user?.role === 'ADMIN' ? 'مدير النظام' : 'مندوب'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-red-600/20 hover:text-red-400 text-slate-300 py-2 rounded-lg transition-all text-sm"
          >
            <LogOut size={16} />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-slate-900 text-white z-30 px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-blue-400" />
          <span className="font-bold text-lg">VisitTracker</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-slate-900 z-20 pt-16 px-4 pb-6 flex flex-col">
           <div className="flex-1 space-y-2">
            {navItems.filter(item => item.show).map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-4 rounded-lg text-lg ${
                  location.pathname === item.path 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-300'
                }`}
              >
                <item.icon size={24} />
                <span>{item.label}</span>
              </Link>
            ))}
           </div>
           <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 bg-slate-800 text-red-400 py-4 rounded-lg mt-4"
          >
            <LogOut size={20} />
            تسجيل الخروج
          </button>
        </div>
      )}

      {/* Main Content (RTL: Margin Right) */}
      <main className="flex-1 md:mr-64 p-4 md:p-8 pt-20 md:pt-8 transition-all">
        {children}
      </main>
    </div>
  );
};