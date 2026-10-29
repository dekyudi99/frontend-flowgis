import { Button } from "@/components/elements/Button";
import { Menu, X, User, LogOut, ChevronDown } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef } from "react";
import ConfirmModal from "@/components/popups/ConfirmModal";
import useAuth from "@/hooks/useAuth";

export default function Navbar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user: authUser } = useAuth();
  
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
    if (authUser) {
      setUser(authUser);
      return;
    }

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

    loadUser();

    window.addEventListener("auth-change", loadUser);

    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("auth-change", loadUser);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [location.pathname, authUser]);

  const handleLogoutClick = () => {
    setIsProfileOpen(false);
    setIsLogoutModalOpen(true);
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (e) {
      console.error("Logout error:", e);
      window.location.href = "/";
    } finally {
      setIsLoggingOut(false);
      setIsLogoutModalOpen(false);
    }
  };

  const portalUrl = import.meta.env.VITE_PORTAL_URL || "http://localhost:5170";
  const authLocalEnabled = import.meta.env.VITE_AUTH_LOCAL_ENABLED === "true";
  const userInitial = (user?.name || user?.username || user?.email || "U").charAt(0).toUpperCase();
  const displayName = user?.name || user?.username || (user?.email ? user.email.split("@")[0] : "User");

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
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  aria-expanded={isProfileOpen}
                  aria-haspopup="true"
                  className="flex items-center gap-2 text-gray-700 font-medium hover:bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <div className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-sm">
                    {userInitial}
                  </div>
                  <span className="max-w-[130px] truncate text-sm font-semibold text-gray-800">{displayName}</span>
                  <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${isProfileOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Dropdown Menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl py-2 border border-gray-100 animate-in fade-in zoom-in duration-150 z-50">
                    <div className="px-4 py-3 border-b border-gray-100 mb-1">
                      <p className="text-sm font-bold text-gray-900 truncate">{displayName}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      {user.role && (
                        <span className="inline-block mt-1 text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 bg-teal-50 text-teal-700 rounded-md border border-teal-200">
                          {user.role}
                        </span>
                      )}
                    </div>

                    {/* Link ke Akun Portal SSO */}
                    <a
                      href={`${portalUrl}/profile`}
                      className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <User size={16} className="text-gray-500" />
                      <span>{t('Account') || "Account"}</span>
                    </a>
                    
                    <button
                      type="button"
                      onClick={handleLogoutClick}
                      className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
                    >
                      <LogOut size={16} />
                      <span>{t('Logout') || "Sign out"}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/sso/start">
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
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-sm">
                        {userInitial}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-bold text-gray-800 truncate">{displayName}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                  </div>
                  <a
                    href={`${portalUrl}/profile`}
                    className="w-full flex items-center justify-start gap-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50"
                  >
                    <User size={16} className="text-gray-500" />
                    <span>{t('Account') || "Account"}</span>
                  </a>
                  <Button 
                    onClick={handleLogoutClick} 
                    className="w-full bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 justify-start shadow-sm"
                  >
                    <LogOut size={16} className="mr-2" />
                    {t('Logout') || "Sign out"}
                  </Button>
                </div>
              ) : (
                // Mobile Login Button
                <Link to="/sso/start" onClick={toggleMenu}>
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
          title="Logout Confirmation"
          message="Are you sure you want to log out of this account??"
          confirmText="Yes, Log Out"
          cancelText="Cancel"
        />
      </div>
    </nav>
  );
}