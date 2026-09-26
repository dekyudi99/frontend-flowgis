import React from 'react';
import { Checkbox } from '../elements/checkbox';
import { Label } from '../elements/label';
import { useTranslation } from 'react-i18next';

const LayerItem = ({ id, value, label, onToggle, isChecked }) => {
    // const handleChange = async (e) => {
    //     const { value, checked } = e.target;
    //     const success = await onToggle(value, checked);
    //     if (!success) {
    //         e.target.checked = false; 
    //     }
    // };
    const handleCheckedChange = (checkedState) => {
        onToggle(value, checkedState);
    };
    return (
        <div className="flex items-center mb-3">
            {/* <input type="checkbox" id={id} value={value} onChange={handleChange} className="mr-3 h-4 w-4" />
            <label htmlFor={id} className="text-sm">{label}</label> */}
            <Checkbox 
                id={id}
                checked={isChecked || false} 
                onCheckedChange={handleCheckedChange} 
                className="mr-3" 
            />
            <Label htmlFor={id} className="text-sm">{label}</Label>
        </div>
    );
};

function ThematicLayers({ onToggle, visibleLayers }) {
    const { t } = useTranslation();
    return (
        <section>
            {/* <h4 className="text-md font-semibold mb-3">Thematic Layers</h4> */}
            <LayerItem id="rivers-layer" value="river_thailand" label={t('sidebar.layers.thematic.globalSurfaceWater')} onToggle={onToggle} isChecked={visibleLayers['river_thailand']} />
            <LayerItem id="urban-layer" value="urban_thailand" label={t('sidebar.layers.thematic.urbanAreas')} onToggle={onToggle} isChecked={visibleLayers['urban_thailand']} />
        </section>
    );
}

export default ThematicLayers;