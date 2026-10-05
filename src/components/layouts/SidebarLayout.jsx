import { useEffect, useState } from "react"
import AoiControls from "../controls/AoiControls"
import { ChevronDown, ChevronUp, PenSquare, MapPin, Trash2, ZoomIn, ZoomOut, Circle, Loader2, Download, Save, Check, FolderOpen, Plus, Upload, Lock, LogIn } from "lucide-react"
import FloodRiskAnalysis from "../controls/FloodRiskAnalysis"
import FloodEventAnalysis from "../controls/FloodEventAnalysis"
import RainfallAnalysis from "../controls/RainfallAnalysis"
import { useTranslation } from "react-i18next"
import { useNavigate, useLocation } from "react-router-dom"
import { isLoggedIn } from "@/services/authService"
import { projectService } from "@/services/projectService"
import { aoiService } from "@/services/aoiService"
import { useAnalysis } from "@/context/AnalysisContext"
import { useNotification } from "@/context/NotificationContext"
import { Layers } from "lucide-react"
import ConfirmModal from "../popups/ConfirmModal"

const MOBILE_BREAKPOINT = 768;

export default function SidebarLayout({
  aoiDisplayText,
  onClearAoi,
  onDrawCircle,
  onDrawPolygon,
  onInsertPoint,
  onDelete,
  onZoomIn,
  onZoomOut,
  onUploadFile,
  onFloodRiskAnalysis,
  onFloodEventAnalysis,
  onRainfallAnalysis,
  onLayerToggle, 
  onOpenMLModal,
  activeLayers = {},
  selectedComponentLayers = {},
  userAnalysisLayers = [],
  onToggleUserLayer,
  onToggleComponentLayer,
  onProjectCreated,
  onSaveProject,
  onDownloadProject,
  onSaveAnalysis,
  isSavingAnalysis = false,
  isAnalysisSaved = false,
  hasAnalysisToSave = false,
  onSelectSavedAoi,
  selectedAoi = null,
  onParametersChange = null
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { activeProject, setActiveProject } = useAnalysis(); 
  const { notify } = useNotification();

  const getInitialIsOpen = () => {
    if (typeof window !== 'undefined' && window.innerWidth <= MOBILE_BREAKPOINT) {
      return false; 
    }
    return true;
  }

  const [isOpen, setIsOpen] = useState(getInitialIsOpen);
  
  const [currentStep, setCurrentStep] = useState(activeProject ? 2 : 0); 
  
  const [projects, setProjects] = useState([]);
  const [isFetchingProjects, setIsFetchingProjects] = useState(true);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [loading, setLoading] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [savedAois, setSavedAois] = useState([]);
  const [selectedAoiId, setSelectedAoiId] = useState('');
  const [isLoadingAois, setIsLoadingAois] = useState(false);

  const [expandedSections, setExpandedSections] = useState({ 
    floodRisk: true,
    floodEvent: false,
    rainfall: false
  });

  const fetchProjects = async () => {
    if (!isLoggedIn()) {
      setProjects([]);
      setActiveProject(null);
      setIsFetchingProjects(false);
      return;
    }

    try {
      setIsFetchingProjects(true);
      const res = await projectService.getProjects(); 
      const projectList = Array.isArray(res) ? res : (res?.data || []);
      setProjects(projectList);
      
      setCurrentStep((prevStep) => {
        if (activeProject || prevStep === 2) return 2;
        return projectList.length > 0 ? 0 : 1;
      });

    } catch (error) {
      console.error("Failed to load project list:", error);
      if (error.response?.status === 401) {
        setProjects([]);
        setActiveProject(null);
      } else {
        setCurrentStep((prev) => (prev === 2 ? 2 : 1)); 
      }
    } finally {
      setIsFetchingProjects(false);
    }
  };

  useEffect(() => {
    fetchProjects();

    const handleAuthChange = () => {
      if (!isLoggedIn()) {
        setProjects([]);
        setActiveProject(null);
        setSavedAois([]);
        setSelectedAoiId('');
      } else {
        fetchProjects();
      }
    };

    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, [activeProject]);


  useEffect(() => {
    const fetchAois = async () => {
      if (currentStep === 2) {
        try {
          setIsLoadingAois(true);
          // Mengambil semua AOI milik akun user
          const res = await aoiService.getUserAois(); 
          const aoiList = Array.isArray(res) ? res : (res?.data || []);
          setSavedAois(aoiList);
        } catch (error) {
          console.error("Failed to load AOIs:", error);
        } finally {
          setIsLoadingAois(false);
        }
      }
    };

    fetchAois();
  }, [currentStep, activeProject]);

  const handleDropdownAoiChange = (e) => {
    const aoiId = e.target.value;
    setSelectedAoiId(aoiId);

    if (!aoiId) {
      if (onClearAoi) onClearAoi();
      return;
    }

    const selectedAoi = savedAois.find((a) => a.id.toString() === aoiId.toString());
    if (selectedAoi && onSelectSavedAoi) {
      onSelectSavedAoi(selectedAoi);
    }
  };

  const handleSaveProjectForm = async () => {
    if (projectTitle.trim() === '') {
      notify.error('Silakan masukkan judul proyek terlebih dahulu!');
      return;
    }

    if (!isLoggedIn()) {
      notify.error('Silakan login terlebih dahulu untuk membuat atau mengedit proyek.');
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    try {
      setLoading(true);
      const projectData = { name: projectTitle, description: projectDescription };
      let savedProject;

      if (editingProjectId) {
        const res = await projectService.updateProject(editingProjectId, projectData);
        savedProject = res?.data || res;
        setProjects(prev => prev.map(p => p.id === editingProjectId ? savedProject : p));
        notify.success(`Proyek "${savedProject.name || projectTitle}" berhasil diperbarui!`);
      } else {
        const res = await projectService.createProject(projectData);
        savedProject = res?.data || res;
        setProjects(prev => [savedProject, ...prev]);
        if (onProjectCreated) onProjectCreated(savedProject);
        notify.success(`Proyek "${savedProject.name || projectTitle}" berhasil dibuat!`);
      }

      setActiveProject(savedProject);
      
      setProjectTitle('');
      setProjectDescription('');
      setEditingProjectId(null);
      setCurrentStep(2);
    } catch (error) {
      console.error("Failed to save project:", error);
      notify.error(error.response?.data?.message || 'Gagal menyimpan proyek.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProject = (project) => {
    setActiveProject(project);
    setCurrentStep(2);
  };

  const handleEditClick = (project) => {
    setProjectTitle(project.name);
    setProjectDescription(project.description || '');
    setEditingProjectId(project.id);
    setCurrentStep(1);
  };

  const handleDeleteClick = (project) => {
    setProjectToDelete(project);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;

    const deletedName = projectToDelete.name;

    try {
      setIsDeleting(true);
      await projectService.deleteProject(projectToDelete.id);
      setProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
      
      if (activeProject?.id === projectToDelete.id) {
        setActiveProject(null);
        setCurrentStep(0);
      }
      notify.success(`Proyek "${deletedName}" berhasil dihapus!`);
    } catch (error) {
      console.error("Failed to delete project:", error);
      notify.error(error.response?.data?.message || 'Gagal menghapus proyek.');
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setProjectToDelete(null);
    }
  };

  const handleNewProjectClick = () => {
    if (!isLoggedIn()) {
      notify.error('Silakan login terlebih dahulu untuk membuat proyek baru.');
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    setProjectTitle('');
    setProjectDescription('');
    setEditingProjectId(null);
    setCurrentStep(1);
  };

  useEffect(() => {
    const handleResize = () => {
        if (window.innerWidth > MOBILE_BREAKPOINT) {
            setIsOpen(true); 
        }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const toggleSection = (section) => {
     setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const toolbarButtonClass = "p-3 hover:bg-teal-50 rounded-lg text-gray-700 hover:text-teal-600 transition-colors duration-200";

  return (
    <>
      <div
        className={`fixed left-4 top-20 bottom-4 bg-white rounded-2xl shadow-xl transition-all duration-300 ease-in-out z-[400] w-[280px] sm:w-[320px] flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-[calc(100%+1rem)]"
        }`}
      >
        <div className="h-full overflow-y-auto rounded-2xl p-6 flex flex-col space-y-4">
          <div className="border-b border-gray-200 pb-4 shrink-0">
            <h1 className="text-xl font-bold text-teal-600">{t('sidebar.mainTitle', 'GIS Mapping Tools')}</h1>
          </div>

          {isFetchingProjects && (
             <div className="flex flex-col items-center justify-center py-10 space-y-2">
                <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
                <p className="text-sm text-gray-500">Loading projects data...</p>
             </div>
          )}

          {!isFetchingProjects && !isLoggedIn() && (
            <div className="flex flex-col items-center justify-center text-center p-4 my-auto space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shadow-sm">
                <Lock className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-gray-800 text-base">Login Diperlukan</h3>
                <p className="text-xs text-gray-500 leading-relaxed max-w-xs">
                  Anda harus login untuk membuat proyek analisis, mengelola AOI, dan mengakses riwayat proyek spasial.
                </p>
              </div>
              <div className="w-full space-y-2 pt-2">
                <button
                  onClick={() => navigate('/login', { state: { from: location.pathname } })}
                  className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" /> Masuk ke Akun
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  className="w-full py-2 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-medium rounded-xl border border-gray-200 transition-colors cursor-pointer"
                >
                  Belum punya akun? Daftar
                </button>
              </div>
            </div>
          )}

          {!isFetchingProjects && isLoggedIn() && currentStep === 0 && (
            <div className="flex flex-col space-y-4 mt-2">
              <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <FolderOpen className="w-4 h-4" /> Saved Projects
              </p>
              
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {projects.map((proj) => (
                  <div 
                    key={proj.id} 
                    onClick={() => handleSelectProject(proj)}
                    className="relative flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-teal-500 hover:bg-teal-50 transition-all group cursor-pointer"
                  >
                    <div className="flex flex-col pr-24 overflow-hidden w-full">
                      <span className="font-semibold text-teal-800 text-sm truncate w-full">{proj.name}</span>
                      {proj.description && (
                        <span className="text-xs text-gray-500 truncate w-full mt-0.5">{proj.description}</span>
                      )}
                    </div>
                    
                    <div 
                      className="absolute right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-teal-50/90 backdrop-blur-sm p-1 rounded-md"
                      onClick={(e) => e.stopPropagation()} 
                    >
                      <button onClick={() => onDownloadProject(proj.id)} title="Download Results" className="p-1.5 text-gray-500 hover:text-teal-600 rounded hover:bg-teal-100 transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleEditClick(proj)} title="Edit Project" className="p-1.5 text-gray-500 hover:text-blue-600 rounded hover:bg-blue-100 transition-colors">
                        <PenSquare className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(proj)} 
                        title="Delete Project" 
                        className="p-1.5 text-gray-500 hover:text-red-600 rounded hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-gray-100">
                <button 
                  onClick={handleNewProjectClick} 
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-white border-2 border-teal-600 text-teal-700 font-medium rounded-lg hover:bg-teal-50 transition-colors w-full"
                >
                  <Plus className="w-4 h-4" /> Create New Project
                </button>
              </div>
            </div>
          )}

          {!isFetchingProjects && isLoggedIn() && currentStep === 1 && (
            <div className="flex flex-col space-y-4 mt-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {editingProjectId ? 'Update your project details.' : 'Start your new analysis project.'}
                </p>
              </div>
              
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Project Title <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="Example: Flood Analysis 2026..."
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  disabled={loading}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Description <span className="text-gray-400 font-normal">(Optional)</span></label>
                <textarea 
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Write the analysis objectives or project details here..."
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none h-24"
                  disabled={loading}
                />
              </div>

              <div className="flex gap-2 mt-2">
                {projects.length > 0 && (
                  <button 
                    onClick={() => setCurrentStep(0)} 
                    disabled={loading}
                    className="px-4 py-2 border border-gray-300 text-gray-600 font-medium rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button 
                  onClick={handleSaveProjectForm} 
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors disabled:bg-teal-300"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? 'Saving...' : (editingProjectId ? 'Save Changes' : 'Start Project')}
                </button>
              </div>
            </div>
          )}

          {!isFetchingProjects && isLoggedIn() && currentStep === 2 && (
            <div className="flex flex-col h-full">
              <div className="flex flex-col space-y-5 flex-grow">
                {/* Tombol Kembali ke daftar project */}
                <button
                  onClick={() => {
                    setActiveProject(null);
                    setCurrentStep(0);
                  }}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-teal-700 transition-colors group w-fit -mt-1"
                  title="Kembali ke daftar proyek"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                  <span className="font-medium">Back</span>
                </button>

                <div className="bg-teal-50 text-teal-800 px-3 py-2 rounded-md text-sm font-medium flex justify-between items-center border border-teal-100 shadow-sm">
                  <span className="truncate pr-2 flex-1" title={activeProject?.name}>
                    Project: <strong>{activeProject?.name}</strong>
                  </span>
                  
                  <div className="flex items-center shrink-0 border-l border-teal-200 pl-2 ml-1">
                    <button onClick={onSaveProject} title="Save Map/Status" className="p-1 text-teal-600 hover:text-teal-900 transition-colors">
                      <Save className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                
                <div>
                  <p className="text-sm font-bold text-gray-700 mb-1">1. Define Area (AOI)</p>
                  <p className="text-xs text-gray-500 mb-2 leading-relaxed">Choose saved AOI, use the floating drawing tools on the map or upload a file via the buttons below.</p>
                  
                  <div className="mb-3">
                    <label className="text-xs font-semibold text-gray-600 flex items-center gap-1.5 mb-1">
                      <Layers className="w-3.5 h-3.5 text-teal-600" /> Use Saved AOI
                    </label>
                    <select
                      value={selectedAoiId}
                      onChange={handleDropdownAoiChange}
                      disabled={isLoadingAois || savedAois.length === 0}
                      className="w-full p-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white disabled:bg-gray-100"
                    >
                      <option value="">
                        {isLoadingAois 
                          ? "Loading saved AOIs..." 
                          : savedAois.length === 0 
                            ? "No saved AOIs" 
                            : "Choose from saved AOIS"}
                      </option>
                      {savedAois.map((aoi) => (
                        <option key={aoi.id} value={aoi.id}>
                          {aoi.name} ({aoi.area_ha ? `${parseFloat(aoi.area_ha).toFixed(2)} Ha` : 'N/A'})
                        </option>
                      ))}
                    </select>
                  </div>
                    
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 shadow-sm">
                    <AoiControls aoiDisplayText={aoiDisplayText} onClearAoi={onClearAoi} />
                  </div>
                </div>

                <div className="pb-4">
                  <p className="text-sm font-bold text-gray-700 mb-2">2. Select & Run Analysis</p>
                  <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm flex flex-col space-y-1">
                    
                    <div>
                        <button onClick={() => toggleSection("floodRisk")} className="w-full flex items-center justify-between py-3 px-4 hover:bg-gray-50 bg-gray-50/50 transition-colors border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-teal-700">{t('sidebar.sections.floodRisk', 'Flood Risk Analysis')}</h3>
                        {expandedSections.floodRisk ? <ChevronUp className="w-5 h-5 text-teal-600" /> : <ChevronDown className="w-5 h-5 text-teal-600" />}
                        </button>
                        {expandedSections.floodRisk && (
                        <div className="p-4 bg-white">
                            <FloodRiskAnalysis
                            onAnalyze={(payload) => onFloodRiskAnalysis(activeProject?.id, payload)}
                            onToggleLayer={onLayerToggle}
                            activeLayers={activeLayers}
                            selectedComponentLayers={selectedComponentLayers}
                            userAnalysisLayers={userAnalysisLayers}
                            onToggleUserLayer={onToggleUserLayer}
                            onToggleComponentLayer={onToggleComponentLayer}
                            selectedAoi={selectedAoi}
                            onParametersChange={onParametersChange}
                            />
                        </div>
                        )}
                    </div>

                    <div>
                        <button onClick={() => toggleSection("floodEvent")} className="w-full flex items-center justify-between py-3 px-4 hover:bg-gray-50 bg-gray-50/50 transition-colors border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-teal-700">{t('sidebar.sections.floodEvent', 'Flood Event Analysis')}</h3>
                        {expandedSections.floodEvent ? <ChevronUp className="w-5 h-5 text-teal-600" /> : <ChevronDown className="w-5 h-5 text-teal-600" />}
                        </button>
                        {expandedSections.floodEvent && (
                        <div className="p-4 bg-white">
                            <FloodEventAnalysis
                            onAnalyze={(payload) => onFloodEventAnalysis(activeProject?.id, payload)}
                            updateActiveLayers={onLayerToggle}
                            activeLayers={activeLayers}
                            />
                        </div>
                        )}
                    </div>

                    <div>
                        <button onClick={() => toggleSection("rainfall")} className="w-full flex items-center justify-between py-3 px-4 hover:bg-gray-50 bg-gray-50/50 transition-colors">
                        <h3 className="text-sm font-semibold text-teal-700">{t('sidebar.sections.rainfall', 'Rainfall Analysis')}</h3>
                        {expandedSections.rainfall ? <ChevronUp className="w-5 h-5 text-teal-600" /> : <ChevronDown className="w-5 h-5 text-teal-600" />}
                        </button>
                        {expandedSections.rainfall && (
                        <div className="p-4 bg-white">
                            <RainfallAnalysis
                            onAnalyze={(payload) => onRainfallAnalysis(activeProject?.id, payload)}
                            />
                        </div>
                        )}
                    </div>

                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 shrink-0 pb-2">
                {/* Tombol Simpan Hasil Analisis (Pengganti Tombol Download) */}
                <button 
                  onClick={onSaveAnalysis}
                  disabled={!hasAnalysisToSave || isSavingAnalysis || isAnalysisSaved}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 font-medium rounded-lg transition-all shadow-sm ${
                    isAnalysisSaved 
                      ? "bg-emerald-50 border-2 border-emerald-600 text-emerald-700 cursor-default"
                      : !hasAnalysisToSave
                        ? "bg-gray-100 border-2 border-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-teal-600 hover:bg-teal-700 text-white hover:shadow-md cursor-pointer"
                  }`}
                  title={!hasAnalysisToSave ? "Jalankan analisis terlebih dahulu untuk menyimpan" : (isAnalysisSaved ? "Hasil analisis sudah tersimpan ke proyek" : "Simpan hasil analisis ke proyek")}
                >
                  {isSavingAnalysis ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Menyimpan ke Proyek...
                    </>
                  ) : isAnalysisSaved ? (
                    <>
                      <Check className="w-5 h-5 text-emerald-600" /> Hasil Tersimpan di Proyek
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" /> Simpan Hasil Analisis
                    </>
                  )}
                </button>
                <button 
                  onClick={() => {
                    setActiveProject(null);
                    setCurrentStep(0);
                  }} 
                  className="w-full text-center mt-3 text-xs text-gray-500 hover:text-teal-600 underline"
                >
                  Back to Project List
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Toolbar */}
      <div className={`fixed top-1/2 -translate-y-1/2 z-[401] flex flex-col items-center gap-4 transition-all duration-300 ${isOpen ? "left-56 md:left-[380px]" : "left-4"}`}>
        <button onClick={() => setIsOpen(!isOpen)} className="bg-white border border-gray-200 text-teal-600 p-2.5 rounded-full shadow-lg hover:bg-gray-50 focus:outline-none">
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-300 ${isOpen ? "rotate-0" : "rotate-180"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        {(!isOpen || currentStep === 2) && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg flex flex-col items-center p-0.5 mt-2">
            <button onClick={onDrawPolygon} className={toolbarButtonClass} title={t('mapTools.drawPolygon')}><PenSquare className="w-5 h-5" /></button>
            <button onClick={onInsertPoint} className={toolbarButtonClass} title={t('mapTools.insertPoint')}><MapPin className="w-5 h-5" /></button>
            <button onClick={onDrawCircle} className={toolbarButtonClass} title={t('mapTools.drawCircle')}><Circle className="w-5 h-5" /></button>  
            <button onClick={onUploadFile} className={toolbarButtonClass} title={t('mapTools.uploadFile', 'Upload File')}><Upload className="w-5 h-5" /></button>
            <button onClick={onDelete} className={`${toolbarButtonClass} text-red-500 hover:text-red-700 hover:bg-red-50`} title={t('mapTools.delete')}><Trash2 className="w-5 h-5" /></button>
            <div className="w-10/12 h-px bg-gray-200 my-1"></div>
            <button onClick={onZoomIn} className={toolbarButtonClass} title={t('mapTools.zoomIn')}><ZoomIn className="w-5 h-5" /></button>
            <button onClick={onZoomOut} className={toolbarButtonClass} title={t('mapTools.zoomOut')}><ZoomOut className="w-5 h-5" /></button>
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Delete Project?"
        message={`Are you sure you want to delete "${projectToDelete?.name}"? All associated data will be permanently removed.`}
      />
    </>
  )
}