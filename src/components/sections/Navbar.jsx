import { Button } from "@/components/elements/Button";
import { Menu, X, User, LogOut, ChevronDown } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
// import LanguageSwitcher from "../commons/LanguageSwitcher";
import { useState, useEffect, useRef } from "react";
import { logoutUser } from "@/services/authService"; 
import ConfirmModal from "@/components/popups/ConfirmModal";

export default function Navbar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  
  // State UI
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef(null);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  //Check Login Status when Component is Loaded
  useEffect(() => {
    const loadUser = () => {
      const storedUser = localStorage.getItem("user_data");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    loadUser(); // Jalankan saat komponen dimuat

    // Dengarkan sinyal login/logout
    window.addEventListener("auth-change", loadUser);

    // Close dropdown saat klik di luar
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("auth-change", loadUser);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [location.pathname]);

  const handleLogoutClick = () => {
    setIsProfileOpen(false);
    setIsLogoutModalOpen(true);
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("token");
    localStorage.removeItem("user_data"); 

    try {
      await logoutUser(); 
    } catch (e) {
      console.error("Logout error:", e);
    }
    
    setUser(null); 
    setIsMenuOpen(false);
    setIsLogoutModalOpen(false);
    setIsLoggingOut(false);

    window.location.href = "/";
  };

  return (
    <nav className="relative z-[1000] bg-white shadow-md border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-6 py-2">
        <div className="flex items-center justify-between">
          
          {/* Logo/Brand */}
          <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-teal-600">
            <img src="/flowgis-logo.png" alt="Company Logo" className="w-14 h-14" />
            <span>FlowGIS</span> 
          </Link>

          {/* Navigation Links (Desktop) */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              className="relative text-teal-600 font-medium transition-all duration-300 hover:text-blue-600 hover:scale-110 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-blue-600 after:transition-all after:duration-300 hover:after:w-full"
            >
              {t('nav.home')}
            </Link>
            <Link
              to="/map"
              className="relative text-teal-600 font-medium transition-all duration-300 hover:text-blue-600 hover:scale-110 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-blue-600 after:transition-all after:duration-300 hover:after:w-full"
            >
              {t('common.map')}
            </Link>
            <Link
              to="/information"
              className="relative text-teal-600 font-medium transition-all duration-300 hover:text-blue-600 hover:scale-110 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-blue-600 after:transition-all after:duration-300 hover:after:w-full"
            >
              {t('nav.information')}
            </Link>
          </div>

          {/* Action Buttons (Desktop) */}
          <div className="hidden md:flex items-center gap-4">
            {/* <LanguageSwitcher /> */}

            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 text-teal-600 font-medium hover:bg-gray-50 px-3 py-2 rounded-lg transition-all"
                >
                  <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-teal-700">
                    <User size={18} />
                  </div>
                  <span className="max-w-[100px] truncate">{user.username || user.email}</span>
                  <ChevronDown size={16} className={`transition-transform duration-200 ${isProfileOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Dropdown Menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 border border-gray-100 animate-in fade-in zoom-in duration-150">
                    <div className="px-4 py-2 border-b border-gray-100 mb-1">
                      <p className="text-xs text-gray-500 uppercase tracking-wider">
                        {/* Signed in as */}
                        {t('nav.info')}
                      </p>
                      <p className="text-sm font-bold text-teal-700 truncate">{user.email}</p>
                    </div>
                    
                    <button
                      onClick={handleLogoutClick}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={16} />
                      {t('Logout') || "Logout"}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login">
                <Button className="bg-teal-600 text-white hover:bg-teal-700 font-semibold transition-all hover:scale-105 shadow-md hover:shadow-lg">
                  {t('nav.login')}
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button onClick={toggleMenu} className="text-teal-600 hover:text-teal-800 transition-colors">
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden bg-white mt-2 pb-4 rounded-lg shadow-inner border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
            
            <Link
              to="/"
              onClick={toggleMenu}
              className="block py-3 px-4 text-teal-600 font-medium hover:bg-gray-50 rounded-md border-b border-gray-50"
            >
              {t('nav.home')}
            </Link>
            
            <Link
              to="/map"
              onClick={toggleMenu}
              className="block py-3 px-4 text-teal-600 font-medium hover:bg-gray-50 rounded-md border-b border-gray-50"
            >
              {t('common.map')}
            </Link>
            
            <Link
              to="/information"
              onClick={toggleMenu}
              className="block py-3 px-4 text-teal-600 font-medium hover:bg-gray-50 rounded-md border-b border-gray-50"
            >
              {t('nav.information')}
            </Link>
            
            {/* Mobile Actions */}
            <div className="flex flex-col gap-3 pt-4 px-4">
              {/* <div className="flex justify-between items-center mb-2">
                <span className="text-gray-500 text-sm">
                  
                  {t('nav.language')}
                </span>
                <LanguageSwitcher />
              </div> */}

              {user ? (
                // Mobile Profile View
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-3 mb-4">
                     <div className="w-10 h-10 bg-teal-600 text-white rounded-full flex items-center justify-center shadow-sm">
                        <User size={20} />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-bold text-gray-800 truncate">{user.username}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                  </div>
                  <Button 
                    onClick={handleLogoutClick} 
                    className="w-full bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 justify-start shadow-sm"
                  >
                    <LogOut size={16} className="mr-2" />
                    {t('nav.logout')}
                    {/* Logout */}
                  </Button>
                </div>
              ) : (
                // Mobile Login Button
                <Link to="/login" onClick={toggleMenu}>
                    <Button className="w-full bg-teal-600 text-white hover:bg-teal-700 font-semibold shadow-md">
                      {t('nav.login')}
                    </Button>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Confirmation Modal untuk Logout */}
        <ConfirmModal
          isOpen={isLogoutModalOpen}
          onClose={() => setIsLogoutModalOpen(false)}
          onConfirm={handleConfirmLogout}
          isLoading={isLoggingOut}
          type="logout"
          title="Konfirmasi Logout"
          message="Apakah Anda yakin ingin keluar dari akun ini?"
          confirmText="Ya, Logout"
          cancelText="Batal"
        />
      </div>
    </nav>
  );
}