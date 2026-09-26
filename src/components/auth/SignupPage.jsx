import { Label } from "../elements/label"
import { Input } from "../elements/input"
import { Button } from "../elements/Button" 
import { Link, useNavigate } from "react-router-dom"
import { Trans, useTranslation } from "react-i18next";
import { useState } from "react";
import { registerUser } from "@/services/authService";
import NotificationContainer from "../commons/NotificationContainer";
import Loader from "../commons/Loader";
import { Eye, EyeOff } from "lucide-react";

export default function SignupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullname: "",
    username: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const addNotification = (type, message) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, type, message }]);
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const validate = () => {
    let newErrors = {};

    if (!formData.fullname.trim()) {
      newErrors.fullname = "Full name is required";
    }
    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    }
    if (!formData.phone) {
      newErrors.phone = "Phone number is required";
    } else if (formData.phone.length < 10) {
      newErrors.phone = "Must be at least 10 digits";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirm password is required";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    let updatedValue = value;

    if (id === "phone") {
      updatedValue = value.replace(/[^0-9]/g, '');
      if (updatedValue.length > 20) return;
    }

    setFormData((prev) => ({ ...prev, [id]: updatedValue }));

    // Hapus pesan error kalau user mulai mengetik lagi
    if (errors[id]) {
      setErrors((prev) => ({ ...prev, [id]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...payload } = formData;
      
      await registerUser(payload);
      setLoading(false);
      addNotification("success", "Registration successful! Please login.");

      setTimeout(() => {
        navigate("/login");
      }, 1000);
      
    } catch (error) {
      console.error("Registration error:", error);
      const resData = error.response?.data;
      let message = "Registration failed. Please try again.";

      if (resData?.errors) {
        const fieldErrors = {};
        for (const [key, msgs] of Object.entries(resData.errors)) {
          fieldErrors[key] = Array.isArray(msgs) ? msgs[0] : msgs;
        }
        setErrors((prev) => ({ ...prev, ...fieldErrors }));

        const firstKey = Object.keys(resData.errors)[0];
        message = Array.isArray(resData.errors[firstKey]) ? resData.errors[firstKey][0] : resData.errors[firstKey];
      } else if (resData?.message) {
        message = resData.message;
      } else if (resData?.error) {
        message = resData.error;
      }

      addNotification("error", message);
      setLoading(false);
    }
  };

  const [showPassword, setShowPassword] = useState(false);
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      {loading && <Loader message="Creating your account..." />}

      <NotificationContainer
        notifications={notifications}
        onClose={removeNotification}
      />
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-lg">

        {/* Header card */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img src="/flowgis-logo.png" alt={t('signup.logoAlt')} className="w-16 h-16" />
          </div>
          <h2 className=" text-xl font-bold text-gray-900">{t('signup.title')}</h2>
        </div>

        {/* Form Pendaftaran */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="space-y-4">
            
            {/* Full Name */}
            <div>
              <Label htmlFor="fullname" className="text-gray-700">
                {t('signup.form.fullNameLabel')}
                <span className="text-red-500 ml-1">*</span>
                {errors.fullname && (
                  <span className="text-red-500 text-xs ml-2 font-normal">
                    {errors.fullname}
                  </span>
                )}
              </Label>
              <Input
                id="fullname"
                name="fullname"
                type="text"
                value={formData.fullname}
                className={`mt-1 border-gray-300 focus:border-teal-500 focus:ring-teal-500 ${errors.fullname ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder={t('signup.form.fullNamePlaceholder')}
                onChange={handleChange}
              />
            </div>

            {/* Username */}
            <div>
              <Label htmlFor="username" className="text-gray-700">
                {t('signup.form.UserNameLabel')}
                <span className="text-red-500 ml-1">*</span>
                {errors.username && (
                  <span className="text-red-500 text-xs ml-2 font-normal">
                    {errors.username}
                  </span>
                )}
              </Label>
              <Input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                className={`mt-1 border-gray-300 focus:border-teal-500 focus:ring-teal-500 ${errors.username ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder={t('signup.form.UserNameLabel')}
                onChange={handleChange}
              />
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone" className="text-gray-700">
                {t('signup.form.phoneLabel')}
                <span className="text-red-500 ml-1">*</span>
                {errors.phone && (
                  <span className="text-red-500 text-xs ml-2 font-normal">
                    {errors.phone}
                  </span>
                )}
              </Label>
              <Input
                id="phone"
                name="phone"
                type="text"
                value={formData.phone}
                className={`mt-1 border-gray-300 focus:border-teal-500 focus:ring-teal-500 ${errors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder={t('signup.form.phonePlaceholder')}
                onChange={handleChange}
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email" className="text-gray-700">
                {t('signup.form.emailLabel')}
                <span className="text-red-500 ml-1">*</span>
                {errors.email && (
                  <span className="text-red-500 text-xs ml-2 font-normal">
                    {errors.email}
                  </span>
                )}
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                className={`mt-1 border-gray-300 focus:border-teal-500 focus:ring-teal-500 ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder={t('signup.form.emailPlaceholder')}
                onChange={handleChange}
              />
            </div>

            {/* Password */}
            <div>
              <Label htmlFor="password" className="text-gray-700">
                {t('signup.form.passwordLabel')}
                <span className="text-red-500 ml-1">*</span>
                {errors.password && (
                  <span className="text-red-500 text-xs ml-2 font-normal">
                    {errors.password}
                  </span>
                )}
              </Label>
              <div className="relative w-full">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  className={`mt-1 border-gray-300 focus:border-teal-500 focus:ring-teal-500 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder={t('signup.form.passwordPlaceholder')}
                  onChange={handleChange}
                />
                <button
                  type="button" 
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 mt-1 text-gray-500 hover:text-teal-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <Label htmlFor="confirmPassword" className="text-gray-700">
                {t('signup.form.confirmPasswordLabel')}
                <span className="text-red-500 ml-1">*</span>
                {errors.confirmPassword && (
                  <span className="text-red-500 text-xs ml-2 font-normal">
                    {errors.confirmPassword}
                  </span>
                )}
              </Label>
              <div className="relative w-full">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  className={`mt-1 border-gray-300 focus:border-teal-500 focus:ring-teal-500 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden ${errors.confirmPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder={t('signup.form.confirmPasswordPlaceholder')}
                  onChange={handleChange}
                />
                <button
                  type="button" 
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 mt-1 text-gray-500 hover:text-teal-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

          </div>

          <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3">
            {t('signup.form.submitButton')}
          </Button>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-teal-600 hover:text-teal-700 hover:underline">
              Login here
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}