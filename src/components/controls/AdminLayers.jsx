import React, { useState } from 'react';
import { Checkbox } from '../elements/checkbox';
import { Label } from '../elements/label';
import { useTranslation } from 'react-i18next';

function AdminLayers({ onToggle, activeLayer }) {
    // const [activeLayer, setActiveLayer] = useState(null);
    const { t } = useTranslation();

    const handleLayerToggle = async (layerValue, isChecked) => {
        await onToggle(layerValue, isChecked);
    }

    return (
        <section>
            {/* <h4 className="text-md font-semibold mb-3">Administrative Boundaries</h4> */}
            
            <div className="flex items-center mb-3">
                <Checkbox 
                    id="province-layer" 
                    checked={activeLayer === 'province'} 
                    onCheckedChange={(isChecked) => handleLayerToggle('province', isChecked)}
                    className="mr-3" 
                />
                <Label htmlFor="province-layer" className="text-sm">{t('sidebar.layers.admin.provinces')}</Label>
            </div>
            
            <div className="flex items-center mb-3">
                <Checkbox 
                    id="district-layer" 
                    checked={activeLayer === 'district'} 
                    onCheckedChange={(isChecked) => handleLayerToggle('district', isChecked)}
                    className="mr-3" 
                />
                <Label htmlFor="district-layer" className="text-sm">{t('sidebar.layers.admin.districts')}</Label>
            </div>
        </section>
    );
}

export default AdminLayers;