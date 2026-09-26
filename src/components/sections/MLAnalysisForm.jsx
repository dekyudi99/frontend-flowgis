// import React, { useCallback, useState } from 'react';
// import { Label } from '../elements/label';
// import { Input } from '../elements/input';
// import { Button } from '../elements/Button';
// import { useTranslation } from 'react-i18next';
// import * as mapService from '../../api/mapService';

// const ML_FACTOR_IDS = [
//   'flow_accumulation',
//   'soil_type',
//   'ndvi',
//   'ndwi',
//   'lulc',
//   'ndbi',
//   'elevation',
//   'twi',
//   'precipitation',
//   'slope',
// ];

// export default function MLAnalysisForm({ onClose, onPredictMLSuccess }) {
//     const { t } = useTranslation();
//     const [factorFiles, setFactorFiles] = useState({}); 
//     const [isLoading, setIsLoading] = useState(false);
//     const [error, setError] = useState(null);

//     const isReadyToSubmit = ML_FACTOR_IDS.every(factor => factorFiles[factor.id]);

//     const handleFileChange = (e, factorId) => {
//         setFactorFiles(prev => ({
//             ...prev,
//             [factorId]: e.target.files[0]
//         }));
//     };

//     const handleSubmit = useCallback(async (e) => {
//         e.preventDefault();
//         setIsLoading(true);
//         setError(null);

//         // 1. Create a FormData object to send files to the API
//         const formData = new FormData();
//         Object.keys(factorFiles).forEach(key => {
//             formData.append(key, factorFiles[key]); 
//         });

//         try {
//             // 2. Call new api
//             const response = await mapService.predictMLAnalysis(formData);

//             // 3. Handle Success
//             console.log("ML prediction successful:", response.data);
//             onPredictMLSuccess(response.data); 

//         } catch (err) {
//             // 4. Handle Error 
//             console.error("Failed to execute ML prediction:", err);
//             setError(`Failed: ${err.response?.data?.error || err.message}`);
//         } finally {
//             setIsLoading(false);
//         }
//     }, [factorFiles, onClose, onPredictMLSuccess]);

//     return (
//         <>
//             <p className="text-sm mb-3 text-gray-600">
//                 {/* Upload 10 GeoTIFF raster files in the order below. The input order is very important! */}
//                 {t('mlAnalysis.instruction')}
//             </p>
//             <form onSubmit={handleSubmit} className="max-h-[450px] overflow-y-auto pr-3">
                
//                 {ML_FACTOR_IDS.map((id) => (
//                     <div key={id} className="mb-3 pb-2 border-b border-dotted border-gray-300">
//                         <Label htmlFor={`file-${id}`} className="text-xs font-semibold block mb-1">
//                             {/* {factor.label}: */}
//                             {t(`mlAnalysis.factors.${id}`)}:
//                             {factorFiles[id] && (
//                                 <span className="text-green-600 ml-2 font-medium">
//                                     ({factorFiles[factor.id].name})
//                                 </span>
//                             )}
//                         </Label>
//                         <Input 
//                             id={`file-${id}`}
//                             type="file" 
//                             accept=".tif,.tiff" 
//                             onChange={(e) => handleFileChange(e, factor.id)} 
//                             required
//                             className="text-xs"
//                         />
//                     </div>
//                 ))}

//                 {error && <p className="text-sm text-red-500 mt-3">{error}</p>}

//                 <Button 
//                     type="submit" 
//                     disabled={isLoading || !isReadyToSubmit} 
//                     className="w-full mt-4 justify-center bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400"
//                 >
//                     {/* {isLoading ? 'Processing and Predicting...': 'Run ML Prediction'} */}
//                     {isLoading ? t('mlAnalysis.buttons.processing') : t('mlAnalysis.buttons.submit')}
//                     {!isLoading && (
//                         <span className='ml-2 font-bold'>({Object.keys(factorFiles).length}/10)</span>
//                     )}
//                 </Button>
//             </form>
//         </>
//     );
// }