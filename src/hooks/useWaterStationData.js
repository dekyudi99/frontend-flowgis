import { useState, useEffect } from 'react';
import * as mapService from '../api/mapService'; 

const getHistoricalDateRange = () => {
    const today = new Date();
    const endDate = today.toISOString().split('T')[0]; 
    const sixMonthsAgo = new Date(today); 
    sixMonthsAgo.setMonth(today.getMonth() - 6);
    
    const startDate = sixMonthsAgo.toISOString().split('T')[0];
    
    return { startDate, endDate };
};

const INITIAL_DATA_STATE = {
    waterLevelData: {},
    dischargeData: {},
    rainfallData: {},
    realtimeRainfallData: null, 
};

const INITIAL_LOADING_STATE = {
    isHistoricalLoading: false,
    isRealtimeLoading: false,
};

export function useWaterStationData(stationCode, isOpen) {
    const [data, setData] = useState(INITIAL_DATA_STATE);
    const [loading, setLoading] = useState(INITIAL_LOADING_STATE);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isOpen || !stationCode) {
            setData(INITIAL_DATA_STATE);
            setError(null);
            return; 
        }

        const { startDate, endDate } = getHistoricalDateRange();
        const fetchHistoricalData = async () => {
            setLoading(prev => ({ ...prev, isHistoricalLoading: true }));
            setError(null); 
            
            try {
                const response = await mapService.getWaterStationDetails(stationCode, startDate, endDate);
                
                const fetchedData = response.data; 

                setData(prev => ({
                    ...prev,
                    waterLevelData: fetchedData.waterLevelData || {},
                    dischargeData: fetchedData.dischargeData || {},
                    rainfallData: fetchedData.rainfallData || {},
                }));
            } catch (err) {
                console.error("Gagal mengambil data historis:", err);
                const errorMessage = err.response?.data?.message || "Gagal mengambil data historis. Silakan coba lagi.";
                setError(errorMessage); 
                setData(INITIAL_DATA_STATE); 
            } finally {
                setLoading(prev => ({ ...prev, isHistoricalLoading: false }));
            }
        };

        const fetchRealtimeData = async () => {
            setLoading(prev => ({ ...prev, isRealtimeLoading: true }));
            
            try {
                const response = await mapService.getRealtimeRainfallTelemetry(stationCode, 'C-60', true); 
                const responseData = response.data.data ? response.data.data : response.data;

                let latestRainfall = null;
                if (responseData && responseData.length > 0) {
                    const results = responseData[0].measurementResults;
                    if (results && results.length > 0) {
                        latestRainfall = {
                            value: results[0].value,
                            uom: results[0].uom,
                            time: results[0].measureTime
                        };
                    }
                }
                
                setData(prev => ({ ...prev, realtimeRainfallData: latestRainfall }));

            } catch (err) {
                console.warn("Gagal mengambil data real-time rainfall:", err);
            } finally {
                setLoading(prev => ({ ...prev, isRealtimeLoading: false }));
            }
        };
        
        fetchHistoricalData();
        fetchRealtimeData();

    }, [isOpen, stationCode]); 

    return { data, loading, error };
}