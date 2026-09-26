import React from 'react';
import { 
  LayoutDashboard, 
  Layers, 
  Building2,  
  Video,
  Users,
  ChevronRight,
  X
} from 'lucide-react';

export default function AdminSidebar({ 
  activeMenu, 
  setActiveMenu,
  isMobileOpen = false,
  onCloseMobile
}) {
  const handleMenuClick = (menu) => {
    setActiveMenu(menu);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[9998] lg:hidden transition-opacity duration-300"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container: Drawer on mobile, static on desktop */}
      <aside 
        className={`
          fixed top-0 bottom-0 left-0 z-[9999] w-72 max-w-[85vw] bg-[#1e293b] text-slate-300 flex flex-col border-r border-slate-800 text-sm shadow-2xl transition-transform duration-300 ease-in-out
          lg:static lg:w-64 lg:min-h-screen lg:shadow-none lg:translate-x-0 lg:flex-shrink-0
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand Header with FlowGIS Logo */}
        <div className="h-16 flex items-center justify-between px-5 bg-[#0f172a] border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <img src="/flowgis-logo.png" alt="FlowGIS Logo" className="w-9 h-9 rounded-lg object-contain shrink-0" />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base text-white tracking-wide leading-none">FlowGIS</span>
                <span className="px-1.5 py-0.5 text-[9px] font-bold bg-teal-500/20 text-teal-400 rounded-md border border-teal-500/30 uppercase tracking-wider">
                  Admin
                </span>
              </div>
              <span className="text-[10px] text-slate-400 truncate mt-0.5">Spatial & Telemetry</span>
            </div>
          </div>

          {/* Close Button on Mobile Drawer */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            title="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">Main Navigation</p>
            <ul className="space-y-1.5">
              {/* Dashboard Link */}
              <li>
                <button
                  onClick={() => handleMenuClick('dashboard')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium transition-colors ${
                    activeMenu === 'dashboard' ? 'bg-teal-600/20 text-teal-400 font-semibold' : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </li>

              {/* Menu Geosocial Map */}
              <li>
                <button
                  onClick={() => handleMenuClick('geosocial')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium transition-colors ${
                    activeMenu === 'geosocial' ? 'bg-teal-600/20 text-teal-400 font-semibold' : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Layers className="w-4 h-4" />
                    <span>Geosocial Map</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </li>

              {/* Menu Fasilitas Publik */}
              <li>
                <button
                  onClick={() => handleMenuClick('facilities')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium transition-colors ${
                    activeMenu === 'facilities' ? 'bg-teal-600/20 text-teal-400 font-semibold' : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="w-4 h-4" />
                    <span>Public Facilities</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </li>

              {/* Menu CCTV Stations */}
              <li>
                <button
                  onClick={() => handleMenuClick('cctv')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium transition-colors ${
                    activeMenu === 'cctv' ? 'bg-teal-600/20 text-teal-400 font-semibold' : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Video className="w-4 h-4" />
                    <span>CCTV Stations</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </li>

              {/* Menu User Management */}
              <li>
                <button
                  onClick={() => handleMenuClick('users')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium transition-colors ${
                    activeMenu === 'users' ? 'bg-teal-600/20 text-teal-400 font-semibold' : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4" />
                    <span>User Management</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </li>
            </ul>
          </div>
        </div>
      </aside>
    </>
  );
}