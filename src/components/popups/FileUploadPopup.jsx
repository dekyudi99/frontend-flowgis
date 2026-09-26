"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { X, Upload, Lock } from "lucide-react" 
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom"; 
import { isLoggedIn } from "@/services/authService";
import { Button } from "../elements/Button";

export default function FileUploadPopup({ isOpen, onClose, onFileSubmit }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFile, setUploadedFile] = useState(null)
  
  // State for login status
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);

  // Check login every time the popup is opened
  useEffect(() => {
    const checkStatus = () => {
      setIsUserLoggedIn(isLoggedIn());
    };

    if (isOpen) {
      checkStatus();
    }

    window.addEventListener("auth-change", checkStatus);
    return () => {
      window.removeEventListener("auth-change", checkStatus);
    };
  }, [isOpen]);

  const handleDragOver = (e) => {
    // Prevent dragging if not logged in
    if (!isUserLoggedIn) return;
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    // Prevent drop if not logged in
    if (!isUserLoggedIn) return;
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const selected = files[0];
      if (selected.name.toLowerCase().endsWith('.shp')) {
        alert('Format ESRI Shapefile (.shp) membutuhkan file pendamping (.shx, .dbf, .prj). Mohon satukan/kompres seluruh berkas tersebut ke dalam format .zip sebelum diunggah.');
        return;
      }
      setUploadedFile(selected)
    }
  }

  const handleFileInput = (e) => {
    const files = e.target.files
    if (files.length > 0) {
      const selected = files[0];
      if (selected.name.toLowerCase().endsWith('.shp')) {
        alert('Format ESRI Shapefile (.shp) membutuhkan file pendamping (.shx, .dbf, .prj). Mohon satukan/kompres seluruh berkas tersebut ke dalam format .zip sebelum diunggah.');
        return;
      }
      setUploadedFile(selected)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (uploadedFile) {
      const fileToSubmit = uploadedFile;
      setUploadedFile(null);
      onClose(); // Langsung tutup popup formulir upload
      onFileSubmit(fileToSubmit);
    }
  };

  const handleClose = () => {
    setUploadedFile(null) 
    onClose()
  }

  // Redirect Function to Login
  const handleLoginRedirect = () => {
    navigate('/login', { state: { from: location.pathname } });
  };

  if (!isOpen) return null

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 relative animate-in fade-in zoom-in duration-300">
        
        {/* Tombol Close */}
        <button onClick={handleClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-20">
          <X className="h-5 w-5" />
        </button>

        <h3 className="text-xl font-semibold text-teal-600 mb-6">{t('fileUploadPopup.mainTitle')}</h3>

        <div className="relative">
            {!isUserLoggedIn && (
              <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center text-center p-6 border-gray-300">
                <div className="bg-teal-100 p-4 rounded-full mb-4">
                  <Lock className="h-8 w-8 text-teal-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {t('fileUploadPopup.req')}
                  {/* Login Required */}
                </h3>
                <p className="text-sm text-gray-600 mb-6 max-w-xs">
                  {t('fileUploadPopup.desc')}
                  {/* To upload files and perform analysis, you need to sign in to your account first. */}
                </p>
                <Button 
                  onClick={handleLoginRedirect}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-8"
                >
                  {t('fileUploadPopup.login')}
                  {/* Login */}
                </Button>
                {/* <p className="mt-4 text-xs text-gray-500">
                  Don't have an account? <span onClick={() => navigate('/signup')} className="text-teal-600 cursor-pointer font-semibold hover:underline">Sign up</span>
                </p> */}
              </div>
            )}

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                  isDragging ? "border-teal-500 bg-teal-50" : "border-gray-300 hover:border-teal-400 hover:bg-gray-50"
            }`}
            >
            <Upload className={`h-12 w-12 mx-auto mb-4 ${isDragging ? "text-teal-500" : "text-gray-400"}`} />
            <p className="text-gray-700 font-medium mb-2">{t('fileUploadPopup.dragTitle')}</p>
            <p className="text-sm text-gray-500 mb-4">{t('fileUploadPopup.formats')}</p>

            {!uploadedFile && (
                <label className="inline-block">
                <input 
                    type="file" 
                    onChange={handleFileInput} 
                    accept=".geojson,.kml,.zip,.json" 
                    className="hidden" 
                    disabled={!isUserLoggedIn} 
                />
                <span className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors cursor-pointer font-medium">
                    <Upload className="h-4 w-4" />
                    {t('fileUploadPopup.selectFile')}
                </span>
                </label>
            )}

            {uploadedFile && (
                <div className="mt-4 text-left">
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg">
                    <p className="text-sm text-teal-700 font-medium">{t('fileUploadPopup.selectedFile', { fileName: uploadedFile.name })}</p>
                </div>
                <button
                    onClick={handleSubmit}
                    className="mt-6 w-full px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors cursor-pointer font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                >
                    {t('fileUploadPopup.submit')}
                </button>
                </div>
            )}
            </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}