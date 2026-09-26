import React, { createContext, useContext, useState, useEffect } from 'react';
import { projectService } from '../services/projectService';
import { isLoggedIn } from '../services/authService';

const AnalysisContext = createContext();

export const AnalysisProvider = ({ children }) => {
  const [activeProject, setActiveProject] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null); 
  const [loading, setLoading] = useState(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const [error, setError] = useState(null);
  // Flag: true hanya saat analisis baru selesai dijalankan (bukan load history)
  const [isNewAnalysis, setIsNewAnalysis] = useState(false);

  useEffect(() => {
    const handleAuthChange = () => {
      if (!isLoggedIn()) {
        setActiveProject(null);
        setAnalysisResult(null);
        setIsNewAnalysis(false);
        setError(null);
      }
    };
    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      if (activeProject?.id) {
        setIsFetchingHistory(true);
        setIsNewAnalysis(false); // Load dari history — bukan analisis baru
        try {
          const result = await projectService.getAnalysisResult(activeProject.id);
          if (result && result.data) {
            setAnalysisResult(result);
          } else {
            setAnalysisResult(null);
          }
        } catch (err) {
          setAnalysisResult(null);
        } finally {
          setIsFetchingHistory(false);
        }
      } else {
        setAnalysisResult(null);
        setIsNewAnalysis(false);
      }
    };

    fetchHistory();
  }, [activeProject?.id]);
  
  const abortControllerRef = React.useRef(null);

  const cancelAnalysis = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
  };

  const executeAnalysis = async (projectId, payload) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const runRes = await projectService.runAnalysis(projectId, payload, { signal: controller.signal });
      
      // Tandai sebagai analisis baru sebelum menyimpan hasilnya
      setIsNewAnalysis(true);

      // Langsung gunakan hasil runRes dari backend
      if (runRes?.data) {
        setAnalysisResult(runRes);
        return runRes;
      } else {
        // Fallback jika runRes tidak ada data
        try {
          const result = await projectService.getAnalysisResult(projectId);
          setAnalysisResult(result || runRes);
          return result || runRes;
        } catch (e) {
          setAnalysisResult(runRes);
          return runRes;
        }
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
        console.log("Analysis cancelled by user");
        return null;
      }
      console.error("Execute analysis error:", err);
      setError(err.response?.data?.message || 'Failed to execute analysis.');
      throw err;
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <AnalysisContext.Provider value={{
      activeProject,
      setActiveProject,
      analysisResult,
      isNewAnalysis,
      loading,
      isFetchingHistory,
      error,
      executeAnalysis,
      cancelAnalysis
    }}>
      {children}
    </AnalysisContext.Provider>
  );
};

export const useAnalysis = () => useContext(AnalysisContext);
