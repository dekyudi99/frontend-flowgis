import React from 'react';
import { Checkbox } from '../elements/checkbox';
import { Label } from '../elements/label';
import { useTranslation } from 'react-i18next'; 

export default function FacilitiesLayers({ 
  onInfrastructureToggle, 
  onWaterStationApiToggle, 
  visibleLayers = {}
}) {

  const { t } = useTranslation(); 

  return (
    <section> 
      {/* Checkbox untuk Hospital */}
      <div className="flex items-center mb-3">
        <Checkbox
          id="hospital-layer-toggle"
          className="mr-3"
          checked={visibleLayers['hospital'] || false }
          onCheckedChange={(isChecked) => 
            onInfrastructureToggle('hospital', isChecked)
          }
        />
        <Label 
          htmlFor="hospital-layer-toggle" 
          className="text-sm font-medium text-gray-700 select-none"
        >
          {t('sidebar.layers.facilities.hospitals')}  
        </Label>
      </div>

      {/* Checkbox Water Station */}
      <div className="flex items-center mb-3">
        <Checkbox
          id="water_station_static-layer-toggle"
          className="mr-3"
          checked={visibleLayers['water_station'] || false }
          onCheckedChange={(isChecked) => 
            onWaterStationApiToggle(isChecked)
          }
        />
        <Label 
          htmlFor="water_station_static-layer-toggle" 
          className="text-sm font-medium text-gray-700 select-none"
        >
          {t('sidebar.layers.facilities.waterStation')}  
        </Label>
      </div>
    </section>
  );
}