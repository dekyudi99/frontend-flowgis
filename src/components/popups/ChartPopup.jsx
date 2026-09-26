import { X } from "lucide-react"
import { Button } from "@/components/elements/Button"
// import PrecipitationChart from "../charts/PrecipitationChart"
import { useTranslation } from "react-i18next";
// import PrecipitationChart from "./PrecipitationChart"

export default function ChartPopup({ isOpen, onClose, chartData, position }) { //terima props position
  const { t } = useTranslation();
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        // className="fixed inset-0 bg-black/20 z-40 transition-opacity" 
        // onClick={onClose} 
      />

      {/* Popup */}
      <div className="fixed bottom-16 right-2 z-50 w-full max-w-md px-2">
        <div className="bg-white rounded-2xl shadow-2xl p-4 animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between mb-0">
            <h4 className="text-sm font-semibold text-teal-600">{t('chartPopup.rainfallTitle')}</h4>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full hover:bg-gray-100">
              <X className="h-5 w-5 text-gray-500" />
            </Button>
          </div>

          {/* Chart Container */}
          <div className="h-36 w-full">
            {/* <PrecipitationChart chartData={chartData} /> */}
          </div>
        </div>
      </div>
    </>
  )
}
