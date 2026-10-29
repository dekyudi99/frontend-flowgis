import { loginUser } from "@/services/authService"
import { Button } from "@/components/elements/Button"
import { Input } from "@/components/elements/input"
import { Label } from "@/components/elements/label"
import { useState, useEffect } from "react"
import { Trans, useTranslation } from "react-i18next"
import { Link, useLocation, useNavigate } from "react-router-dom"
import Loader from "../commons/Loader"
import NotificationContainer from "../commons/NotificationContainer"
import { Eye, EyeOff, ShieldCheck } from "lucide-react"
import useAuth from "@/hooks/useAuth"

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { signinRedirect } = useAuth();

  const [formData, setFormData] = useState({
    email: "", 
    password: ""
  });

  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [sessionMsg, setSessionMsg] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && window.sessionStorage) {
      const msg = sessionStorage.getItem("SESSION_TERMINATED_MSG");
      if (msg) {
        setSessionMsg(msg);
        sessionStorage.removeItem("SESSION_TERMINATED_MSG");
      }
    }
  }, []);

  const addNotification = (type, message) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, type, message }]);
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleSsoLogin = () => {
    const targetPath = location.state?.from || "/map";
    signinRedirect({ state: { returnTo: targetPath } }).catch((err) => {
      addNotification("error", err.message || "Gagal memulai SSO");
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await loginUser(formData);
      setLoading(false);

      // Wajib simpan token & user ke localStorage di sini
      const token = data.token || data.access_token;
      const user = data.user;

      if (token) localStorage.setItem("token", token);
      if (user) localStorage.setItem("user", JSON.stringify(user));

      addNotification("success", "Login successful! Redirecting to dashboard...");
      
      setTimeout(() => {
        const role = user?.role; 
        const fromPage = location.state?.from;

        // Cegah redirect kembali ke /login jika location.state berisi halaman login
        if (fromPage && fromPage !== '/login' && fromPage?.pathname !== '/login') {
          navigate(fromPage, { replace: true });
        } else {
          if (role === 'admin') {
            navigate("/admin", { replace: true });
          } else {
            navigate("/map", { replace: true });
          }
        }
      }, 1000);

    } catch (error) {
      console.error("Login failed:", error);
      setLoading(false);
    }
  };

  const [showPassword, setShowPassword] = useState(false);
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      {loading && <Loader message="Loading..." />}

      <NotificationContainer
        notifications={notifications} 
        onClose={removeNotification} 
      />
      
      {/* Login card */}
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-lg">
        
        {/* Header card */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img src="/flowgis-logo.png" alt={t('login.logoAlt')} className="w-16 h-16" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">{t('login.title')}</h2>
        </div>

        {sessionMsg && (
          <div className="p-3 text-sm text-amber-800 bg-amber-50 rounded-lg border border-amber-200 text-center">
            {sessionMsg}
          </div>
        )}

        {/* Tombol Login SSO Terpusat Keycloak */}
        <div className="space-y-4">
          <Button
            type="button"
            onClick={handleSsoLogin}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 flex items-center justify-center space-x-2 shadow-sm rounded-xl"
          >
            <ShieldCheck className="w-5 h-5 mr-1" />
            <span>Masuk dengan SSO Keycloak</span>
          </Button>

          {!authLocalEnabled && (
            <div className="pt-2 text-center">
              <a
                href={portalUrl}
                className="text-xs text-teal-600 hover:text-teal-700 hover:underline font-medium"
              >
                Kembali ke Portal SSO WefGIS
              </a>
            </div>
          )}

          {authLocalEnabled && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="px-3 bg-white text-gray-400 font-medium">atau masuk dengan akun lokal</span>
              </div>
            </div>
          )}
        </div>

        {/* Form Login (Hanya ditampilkan jika AUTH_LOCAL_ENABLED = true) */}
        {authLocalEnabled && (
          <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-gray-700">
                  {t('login.form.emailLabel')}
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="text"
                  required
                  className="mt-1 border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                  placeholder={t('login.form.emailPlaceholder')}
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-gray-700">
                  {t('login.form.passwordLabel')}
                </Label>
                <div className="relative w-full">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="mt-1 border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                    placeholder={t('login.form.passwordPlaceholder')}
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button" 
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 mt-1 text-gray-500 hover:text-teal-600 focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff size={20} /> 
                    ) : (
                      <Eye size={20} />    
                    )}
                  </button>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3">
              {t('login.form.submitButton')}
            </Button>

            <p className="text-center text-sm text-gray-600">
              {t('login.desc')}
              <Link to="/signup" className="font-semibold text-teal-600 hover:text-teal-700 hover:underline ml-1">
                {t('login.toRegister')}
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}