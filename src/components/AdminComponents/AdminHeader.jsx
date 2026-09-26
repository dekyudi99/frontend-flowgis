import React, { useState } from 'react';
import { User, Menu, LogOut } from 'lucide-react';
import { logoutUser } from '@/services/authService';
import ConfirmModal from '@/components/popups/ConfirmModal';

export default function AdminHeader({ onToggleSidebar }) {
  const user = JSON.parse(localStorage.getItem('user_data') || '{}');
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleConfirmLogout = () => {
    setIsLoggingOut(true);
    localStorage.removeItem('user_data');
    localStorage.removeItem('token');
    localStorage.removeItem('auth_token');
    logoutUser();
    window.location.href = '/';
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20 shrink-0">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        {/* Mobile Hamburger Menu Button */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg focus:outline-none transition shrink-0"
          aria-label="Buka menu navigasi"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand Logo & Title - Hanya tampil di mode mobile (di mode desktop logo sudah ada di sidebar) */}
        <div className="flex lg:hidden items-center gap-2.5 shrink-0">
          <img src="/flowgis-logo.png" alt="FlowGIS Logo" className="w-8 h-8 rounded-lg object-contain" />
          <span className="font-bold text-sm text-gray-800 hidden xs:inline">FlowGIS Admin</span>
        </div>
      </div>

      {/* User Profile & Logout Action */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 font-bold flex items-center justify-center text-sm border border-teal-200 shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div className="text-left hidden md:block">
            <p className="text-xs font-semibold text-gray-800 leading-tight truncate max-w-[140px]">
              {user.username || user.name || 'Admin User'}
            </p>
            <p className="text-[10px] text-gray-500 leading-tight truncate max-w-[140px]">
              {user.email || 'admin@flowgis.com'}
            </p>
          </div>
        </div>

        <div className="h-6 w-[1px] bg-gray-200 my-auto" />

        {/* Tombol Logout */}
        <button
          type="button"
          onClick={() => setIsLogoutModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
          title="Logout dari akun"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>

      {/* Confirmation Modal untuk Logout */}
      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
        isLoading={isLoggingOut}
        type="logout"
        title="Konfirmasi Logout"
        message="Apakah Anda yakin ingin keluar dari sesi akun Admin FlowGIS?"
        confirmText="Ya, Logout"
        cancelText="Batal"
      />
    </header>
  );
}