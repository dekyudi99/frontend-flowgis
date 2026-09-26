import { useState } from "react"
import { ChevronDown, ChevronUp, X, Maximize2, Minimize2 } from "lucide-react"
import ThematicLayers from "../controls/ThematicLayers"
import AdminLayers from "../controls/AdminLayers"
import FacilitiesLayers from "../controls/FacilitiesLayers"
import { useTranslation } from "react-i18next"
import GeosocialLayers from "../controls/GeosocialLayers"
import UserAnalysisLayers from "../controls/UserAnalysisLayers"

export default function LayerPopup({ 
    isOpen, 
    onClose, 
    onThematicLayerToggle, 
    onAdminLayerToggle,
    onInfrastructureToggle,
    onWaterStationApiToggle,

    thematicStatus,
    adminStatus,
    facilitiesStatus,

    geosocialList,
    geosocialStatus,
    onGeosocialToggle,
    onGeosocialToggleAll,

    userAnalysisList = [],
    userAnalysisStatus = {},
    userGroupList = [],
    userGroupStatus = {},
    onUserAnalysisToggle,
    onUserAnalysisToggleAll,
    onUserGroupToggle,
    onZoomToUserLayer,
    onZoomToUserGroup,
    onRefreshUserLayers,
    onCreateUserGroup,
    onUpdateUserGroup,
    onDeleteUserGroup,
    onDeleteLayer,
    loadingUserLayers = false,
}) {

  const [expandedSections, setExpandedSections] = useState({
    thematic: false,
    administrative: false,
    facilities: false,
    geosocial: false,
    userAnalysis: true,
  })

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const [isWide, setIsWide] = useState(false);
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed top-20 right-16 z-50 bg-white rounded-2xl shadow-2xl flex flex-col max-h-[calc(100vh-6rem)] transition-all duration-300 animate-in fade-in slide-in-from-right ${
        isWide ? 'w-[520px] max-w-[92vw]' : 'w-80 sm:w-96'
      }`}
    >
      <div className="flex items-center justify-between px-5 py-3 shrink-0 border-b border-gray-100 bg-white rounded-t-2xl">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-gray-900">{t('layerPopup.title', 'Layers')}</h2>
          <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full font-medium border border-teal-100">
            {isWide ? 'Lebar' : 'Normal'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsWide(!isWide)}
            title={isWide ? "Perkecil menu layer" : "Perlebar menu layer"}
            className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
          >
            {isWide ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            title="Tutup"
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="overflow-y-auto p-6 pt-2 space-y-4">
        <div className="border-b border-gray-200 pb-4">
          <button onClick={() => toggleSection("geosocial")} className="w-full flex items-center justify-between py-2 hover:bg-gray-50 rounded-lg px-2">
            <h3 className="text-base font-semibold text-teal-600">{t('layerPopup.geosocial')}</h3>
            {expandedSections.geosocial ? <ChevronUp className="w-5 h-5 text-teal-600" /> : <ChevronDown className="w-5 h-5 text-teal-600" />}
          </button>
          {expandedSections.geosocial && (
            <GeosocialLayers 
              layerList={geosocialList}
              visibleLayers={geosocialStatus}
              onToggle={onGeosocialToggle}
              onToggleAll={onGeosocialToggleAll}
            />
          )}
        </div>

        {/* Thematic Layers Section */}
        {/* <div className="border-b border-gray-200 pb-4">
          <button onClick={() => toggleSection("thematic")} className="w-full flex items-center justify-between py-2 hover:bg-gray-50 rounded-lg px-2">
            <h3 className="text-base font-semibold text-teal-600">{t('layerPopup.thematic')}</h3>
            {expandedSections.thematic ? <ChevronUp className="w-5 h-5 text-teal-600" /> : <ChevronDown className="w-5 h-5 text-teal-600" />}
          </button>
          {expandedSections.thematic && (
            <ThematicLayers onToggle={onThematicLayerToggle} visibleLayers={thematicStatus} />
          )}
        </div> */}

        {/* Administrative Boundaries Section */}
        {/* <div className="border-b border-gray-200 pb-4">
          <button onClick={() => toggleSection("administrative")} className="w-full flex items-center justify-between py-2 hover:bg-gray-50 rounded-lg px-2">
            <h3 className="text-base font-semibold text-teal-600">{t('layerPopup.admin')}</h3>
            {expandedSections.administrative ? <ChevronUp className="w-5 h-5 text-teal-600" /> : <ChevronDown className="w-5 h-5 text-teal-600" />}
          </button>
          {expandedSections.administrative && (
            <AdminLayers onToggle={onAdminLayerToggle} activeLayer={adminStatus}/>
          )}
        </div> */}

        <div className="border-b border-gray-200 pb-4"> 
          <button onClick={() => toggleSection("facilities")} className="w-full flex items-center justify-between py-2 hover:bg-gray-50 rounded-lg px-2">
            <h3 className="text-base font-semibold text-teal-600">{t('layerPopup.facilities')}</h3>
            {expandedSections.facilities ? <ChevronUp className="w-5 h-5 text-teal-600" /> : <ChevronDown className="w-5 h-5 text-teal-600" />}
          </button>
          {expandedSections.facilities && (
            <FacilitiesLayers
              onInfrastructureToggle={onInfrastructureToggle}
              onWaterStationApiToggle={onWaterStationApiToggle}
              visibleLayers={facilitiesStatus}
            />
          )}
        </div>

        {/* User Analysis Layers Section */}
        <div> 
          <button onClick={() => toggleSection("userAnalysis")} className="w-full flex items-center justify-between py-2 hover:bg-gray-50 rounded-lg px-2">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-teal-600">{t('layerPopup.userAnalysis', 'Analysis Results')}</h3>
              {userAnalysisList.length > 0 && (
                <span className="px-1.5 py-0.2 bg-teal-100 text-teal-700 rounded-full text-xs font-bold">
                  {userAnalysisList.length}
                </span>
              )}
            </div>
            {expandedSections.userAnalysis ? <ChevronUp className="w-5 h-5 text-teal-600" /> : <ChevronDown className="w-5 h-5 text-teal-600" />}
          </button>
          {expandedSections.userAnalysis && (
            <UserAnalysisLayers
              layerList={userAnalysisList}
              groupList={userGroupList}
              visibleLayers={userAnalysisStatus}
              visibleGroups={userGroupStatus}
              onToggleLayer={onUserAnalysisToggle}
              onToggleAllLayers={onUserAnalysisToggleAll}
              onToggleGroup={onUserGroupToggle}
              onZoomToLayer={onZoomToUserLayer}
              onZoomToGroup={onZoomToUserGroup}
              onRefresh={onRefreshUserLayers}
              onCreateGroup={onCreateUserGroup}
              onUpdateGroup={onUpdateUserGroup}
              onDeleteGroup={onDeleteUserGroup}
              onDeleteLayer={onDeleteLayer}
              loading={loadingUserLayers}
            />

          )}
        </div>
      </div>

    </div>
  )
}