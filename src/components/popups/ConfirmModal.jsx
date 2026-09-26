import React from 'react';
import { createPortal } from 'react-dom';
import { LogOut } from 'lucide-react';

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  isLoading,
  confirmText = 'Yes, Delete',
  cancelText = 'Cancel',
  type = 'danger',
  icon: CustomIcon = null,
}) {
  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 transform transition-all relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Icon Peringatan / Logout */}
        {CustomIcon ? (
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-500 flex items-center justify-center mx-auto mb-4">
            <CustomIcon className="w-6 h-6" />
          </div>
        ) : type === 'logout' ? (
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
            <LogOut className="w-6 h-6 ml-0.5" />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-500 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
        )}

        {/* Konten Teks */}
        <h3 className="text-lg font-bold text-gray-800 text-center mb-2">
          {title || 'Hapus Data?'}
        </h3>
        <p className="text-sm text-gray-500 text-center mb-6">
          {message || 'Tindakan ini tidak dapat dibatalkan. Data akan dihapus secara permanen.'}
        </p>

        {/* Tombol Aksi */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-2.5 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-colors shadow-lg shadow-red-200 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? 'Menghapus...' : confirmText}
          </button>
        </div>

      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}