import React, { useState, useEffect } from 'react';
import { Button } from '../elements/Button';
import { useTranslation } from 'react-i18next';
import { useAnalysis } from "@/context/AnalysisContext"; 

function RainfallAnalysis({ onAnalyze }) {
    const { t } = useTranslation();
    const { analysisResult } = useAnalysis();
    
    const [startYear, setStartYear] = useState(2024);
    const [endYear, setEndYear] = useState(2024);
    
    const [startDate, setStartDate] = useState("2024-01-01");
    const [endDate, setEndDate] = useState("2024-01-31");

    const [mode, setMode] = useState('monthly'); 

    useEffect(() => {
        const data = analysisResult?.data || analysisResult;
        if (data?.analysis_type === 'rainfall' && data?.parameters) {
            if (data.parameters.mode) setMode(data.parameters.mode);
            if (data.parameters.startYear) setStartYear(data.parameters.startYear);
            if (data.parameters.endYear) setEndYear(data.parameters.endYear);
            if (data.parameters.start_date) setStartDate(data.parameters.start_date);
            if (data.parameters.end_date) setEndDate(data.parameters.end_date);
        }
    }, [analysisResult]);
    
    const handleAnalysis = () => {
        if (mode === 'monthly') {
            onAnalyze({ 
                analysis_type: "rainfall",
                startYear, 
                endYear, 
                mode 
            });
        } else {
            onAnalyze({ 
                analysis_type: "rainfall",
                start_date: startDate,
                end_date: endDate,
                startDate: startDate, 
                endDate: endDate, 
                mode 
            });
        }
    };

    return (
        <section>
            <h4 className="text-md font-semibold mb-2">{t('sidebar.analysis.rainfall.title')}</h4>
            <div className="flex justify-between mb-4">
                <button 
                    onClick={() => setMode('monthly')} 
                    className={`p-1 flex-1 text-sm rounded ${mode === 'monthly' ? 'bg-teal-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                >
                    {t('sidebar.analysis.rainfall.mode.monthly')}
                </button>
                <button 
                    onClick={() => setMode('daily')} 
                    className={`p-1 flex-1 text-sm rounded ml-2 ${mode === 'daily' ? 'bg-teal-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                >
                    {t('sidebar.analysis.rainfall.mode.daily')}
                </button>
            </div>
            
            {/* Input for Annual/Monthly Mode */}
            {mode === 'monthly' && (
                <>
                    <label htmlFor="precip_start_year" className="text-xs">{t('sidebar.analysis.rainfall.startYear')}</label>
                    <input type="number" id="precip_start_year" value={startYear} onChange={e => setStartYear(e.target.value)} className="w-full p-2 border rounded mb-2"/>
                    <label htmlFor="precip_end_year" className="text-xs">{t('sidebar.analysis.rainfall.endYear')}</label>
                    <input type="number" id="precip_end_year" value={endYear} onChange={e => setEndYear(e.target.value)} className="w-full p-2 border rounded mb-2"/>
                </>
            )}

            {/* Input for Daily Mode */}
            {mode === 'daily' && (
                <>
                    <label htmlFor="precip_start_date" className="text-xs">{t('sidebar.analysis.rainfall.startDate')}</label>
                    <input type="date" id="precip_start_date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 border rounded mb-2"/>
                    <label htmlFor="precip_end_date" className="text-xs">{t('sidebar.analysis.rainfall.endDate')}</label>
                    <input type="date" id="precip_end_date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2 border rounded mb-2"/>
                </>
            )}

            <Button onClick={handleAnalysis} className="w-full bg-teal-600 text-white p-2 rounded hover:bg-teal-500 mt-2">
                {t('sidebar.analysis.rainfall.button')}
            </Button>
        </section>
    );
}

export default RainfallAnalysis;