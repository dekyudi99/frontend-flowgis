import { useState, useEffect } from "react";
// Pastikan path ini sesuai dengan struktur folder Anda, misal: "@/components/ui/button"
import { Button } from "@/components/elements/Button"; 
import { useTranslation } from "react-i18next";

export default function WelcomeNotif() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeenSession = sessionStorage.getItem("hasSeenWelcomeModal");
    
    if (!hasSeenSession) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem("hasSeenWelcomeModal", "true");
  };

  const handleManualCheck = () => {
    // window.open("/manual-floowgis_v01.pdf", "_blank");
    window.open("/manual-flowgis_v02.pdf", "_blank"); 
    handleClose();
  };
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-500">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative slide-in-from-top-10 duration-500">
        
        {/* Header*/}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {/* Welcome to Floowgis */}
          {t('welcomeModal.title')}
        </h2>
        
        {/* Body Text */}
        <p className="text-gray-600 mb-6 leading-relaxed">
          {/* Want to start mapping? Check the manual here for complete instructions. */}
          {t('welcomeModal.description')}
        </p>
        
        {/* Footer*/}
        <div className="flex flex-col sm:flex-row gap-3 justify-end mt-4">
          
          {/*Button1*/}
          <Button 
            variant="ghost" 
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          >
            {/* Later */}
            {t('welcomeModal.laterBtn')}
          </Button>
          
          {/*Button2*/}
          <Button 
            onClick={handleManualCheck}
            className="w-full bg-teal-600 text-white hover:bg-teal-500 mt-2 sm:mt-0 sm:w-auto"
          >
            {/* Let's See */}
            {t('welcomeModal.manualBtn')}
          </Button>

        </div>
      </div>
    </div>
  );
}