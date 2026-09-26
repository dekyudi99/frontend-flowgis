import React, { useState, useEffect } from 'react';
import { Button } from '../elements/Button';
import { useTranslation } from 'react-i18next';
import { Checkbox } from '../elements/checkbox';
import { useAnalysis } from "@/context/AnalysisContext"; 

function FloodEventAnalysis({ onAnalyze, updateActiveLayers, activeLayers = {} }) {
    const { t } = useTranslation();
    const { analysisResult } = useAnalysis();

    const [startDate, setStartDate] = useState('2024-01-01');
    const [endDate, setEndDate] = useState('2024-12-31');
    const [isAnalyzed, setIsAnalyzed] = useState(false);

    useEffect(() => {
        const data = analysisResult?.data || analysisResult;
        if (data?.analysis_type === 'flood_event' && data?.parameters) {
            if (data.parameters.after_startDate) setStartDate(data.parameters.after_startDate);
            if (data.parameters.after_endDate) setEndDate(data.parameters.after_endDate);
            
            setIsAnalyzed(true); 
        }
    }, [analysisResult]);
    
    const handleAnalysis = async () => {
        if (updateActiveLayers) {
            updateActiveLayers('WaterBefore', false);
            updateActiveLayers('WaterAfter', false);
            updateActiveLayers('NewFloodedArea', false);
        }
        
        const payload = {
            analysis_type: "flood_event",
            after_startDate: startDate,
            after_endDate: endDate
        };
        
        await onAnalyze(payload);
        setIsAnalyzed(true);
    };

    return (
        <section>
            <label htmlFor="floodmap_start" className="text-xs">{t('sidebar.analysis.floodEvent.startDate')}</label>
            <input type="date" id="floodmap_start" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 border rounded mb-2"/>
            
            <label htmlFor="floodmap_end" className="text-xs">{t('sidebar.analysis.floodEvent.endDate')}</label>
            <input type="date" id="floodmap_end" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2 border rounded mb-2"/>
            
            <Button onClick={handleAnalysis} className="w-full bg-teal-600 text-white p-2 rounded hover:bg-teal-500 mt-2">
                {t('sidebar.analysis.floodEvent.button')}
            </Button>
            
            {isAnalyzed && (
                <div className="mt-4 pt-4 border-t">
                    <h5 className="font-semibold text-sm mb-2">{t('sidebar.analysis.floodEvent.layersTitle')}</h5>
                    <div className="flex items-center mb-2">
                        <Checkbox
                            id="flood-before-toggle"
                            checked={!!activeLayers['WaterBefore']}
                            onCheckedChange={() => updateActiveLayers('WaterBefore', !activeLayers['WaterBefore'])}
                            className="mr-2"
                        />
                        <label htmlFor="flood-before-toggle" className="text-xs">{t('sidebar.analysis.floodEvent.waterBefore')}</label>
                    </div>
                    <div className="flex items-center mb-2">
                        <Checkbox
                            id="flood-after-toggle"
                            checked={!!activeLayers['WaterAfter']}
                            onCheckedChange={() => updateActiveLayers('WaterAfter', !activeLayers['WaterAfter'])}
                            className="mr-2"
                        />
                        <label htmlFor="flood-after-toggle" className="text-xs">{t('sidebar.analysis.floodEvent.waterAfter')}</label>
                    </div>
                    <div className="flex items-center mb-2">
                        <Checkbox
                            id="flood-new-toggle"
                            checked={!!activeLayers['NewFloodedArea']}
                            onCheckedChange={() => updateActiveLayers('NewFloodedArea', !activeLayers['NewFloodedArea'])}
                            className="mr-2"
                        />
                        <label htmlFor="flood-new-toggle" className="text-xs">{t('sidebar.analysis.floodEvent.newFlooded')}</label>
                    </div>
                </div>
            )}
        </section>
    );
}
export default FloodEventAnalysis;