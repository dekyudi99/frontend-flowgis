import React from 'react';
import { Checkbox } from '../elements/checkbox';
import { Label } from '../elements/label';
import { useTranslation } from 'react-i18next'; 

const GeosocialLayers = ({ layerList, visibleLayers, onToggle, onToggleAll }) => {
    const { t } = useTranslation();

    if (!layerList || layerList.length === 0) {
        return (
            <div className="text-xs text-gray-400 italic px-2 py-1">
                Loading layers...
            </div>
        );
    }
    
    const isAllChecked = layerList.length > 0 && layerList.every((layer) => visibleLayers[layer.id]);

    return (
        <section className="px-1 max-h-64 overflow-y-auto pr-2 custom-scrollbar"> 
            <div className="flex items-center mb-3 pb-2 border-b border-gray-200">
                <Checkbox 
                    id="geo-all"
                    checked={isAllChecked}
                    onCheckedChange={(checked) => onToggleAll && onToggleAll(checked)}
                    className="mr-3"
                />
                <Label 
                    htmlFor="geo-all" 
                    className="text-sm font-bold cursor-pointer select-none text-teal-700"
                >
                    {t('geoLayers.selectAll', 'Select All Layers')} 
                </Label>
            </div>

            <div className="ml-2 flex flex-col gap-2">
                {layerList.map((layer) => {
                    const isChecked = !!visibleLayers[layer.id];
                    const labelText = layer.display_name || layer.name || layer.layer_name;
                    const isWms = layer.type === 'wms' || (layer.url && (layer.url.includes('/wms') || layer.url.includes('/geoserver/'))) || (layer.layer_name && (layer.layer_name.includes(':') || layer.layer_name.startsWith('ws_')));

                    return (
                        <div key={layer.id} className="flex items-center justify-between hover:bg-gray-50 p-1.5 rounded-lg transition-colors">
                            <div className="flex items-center min-w-0 flex-1 mr-2">
                                <Checkbox 
                                    id={`geo-${layer.id}`} 
                                    checked={isChecked}
                                    onCheckedChange={(checked) => onToggle(layer.id, checked)}
                                    className="mr-2.5 shrink-0" 
                                />
                                <Label 
                                    htmlFor={`geo-${layer.id}`} 
                                    className="text-xs cursor-pointer select-none text-gray-700 truncate font-medium"
                                    title={labelText}
                                >
                                    {labelText}
                                </Label>
                            </div>
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 uppercase ${
                                isWms 
                                    ? 'bg-blue-50 text-blue-600 border border-blue-200/60' 
                                    : 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
                            }`}>
                                {isWms ? 'WMS' : 'Points'}
                            </span>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default GeosocialLayers;