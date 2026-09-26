import { loginUser } from "@/services/authService"
import { Button } from "@/components/elements/Button"
import { Input } from "@/components/elements/input"
import { Label } from "@/components/elements/label"
import { useState } from "react"
import { Trans, useTranslation } from "react-i18next"
import { Link, useLocation, useNavigate } from "react-router-dom"
import Loader from "../commons/Loader"
import NotificationContainer from "../commons/NotificationContainer"
import { Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: "", 
    password: ""
  });

  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const addNotification = (type, message) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, type, message }]);
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };
  // const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // setErrorMsg("");

    try {
      const data = await loginUser(formData);
      setLoading(false);

      addNotification("success", "Login successful! Redirecting to dashboard...");
      
      setTimeout(() => {
        const role = data.user.role; 
        const fromPage = location.state?.from;

        if (fromPage) {
          navigate(fromPage, { replace: true });
        } else {
          if (role === 'admin') {
            navigate("/admin");
          } else {
            navigate("/map");
          }
        }
      }, 1000);

    } catch (error) {
      console.error("Login failed:", error);
      setLoading(false);

      let msg = "The email and password are incorrect."; 

      if (error.response) {
        const status = error.response.status;
        const serverError = error.response.data?.error || "";

        if (status === 404 || serverError.toLowerCase().includes("user") || serverError.toLowerCase().includes("email")) {
          msg = "Email not found. Please double-check your email address..";
        } 
        else if (status === 401 || serverError.toLowerCase().includes("password")) {
          msg = "Incorrect password. Please try again.";
        }
        else if (serverError) {
          msg = serverError;
        }
      }

      addNotification("error", msg);
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
          {/* <p className="mt-2 text-gray-600">Log in to your account</p> */}
        </div>

        {/* Form Login */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>

          {/* {errorMsg && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded border border-red-200">
              {errorMsg}
            </div>
          )} */}

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
                value={formData.email} // Bind value
                onChange={handleChange}   // Bind change
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
                  value={formData.password} // Bind value
                  onChange={handleChange}   // Bind change
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

          {/* <div className="flex items-center justify-end">
            <Link to="/forgot-password" className="text-sm text-teal-600 hover:text-teal-700 hover:underline">
              {t('login.form.forgotPassword')}
            </Link>
          </div> */}

          <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3">
            {t('login.form.submitButton')}
          </Button>

          {/* <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">{t('login.form.orSeparator')}</span>
            </div>
          </div> */}

          {/* <Button
            type="button"
            variant="outline"
            className="w-full border-gray-300 hover:bg-teal-50 font-semibold py-3 bg-transparent"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {t('login.form.googleButton')}
          </Button> */}

          <p className="text-center text-sm text-gray-600">
            {/* <Trans i18nKey="login.form.registerPrompt"> */}
            {t('login.desc')}
              {/* Don't have an account yet?{" "} */}
              <Link to="/signup" className="font-semibold text-teal-600 hover:text-teal-700 hover:underline">
                {t('login.toRegister')}
                {/* Register now */}
              </Link>
            {/* </Trans> */}
          </p>
        </form>
      </div>
    </div>
  )
}