
import React from 'react';
import { Button } from '@/components/elements/Button'; 
import { useTranslation } from 'react-i18next';

function WaterStationPopup({ properties, coordinates }) {
    const { t } = useTranslation();
    const props = properties;
    const stationCode = props.stationCode; 
    
    // Get coordinates
    const longitude = coordinates[0].toFixed(5);
    const latitude = coordinates[1].toFixed(5);

    // const statusText = props.stationOperatingStatus === 1 ? 'Active' : 'Non Active';

    // Unique ID for the button, must be the same as the one used in MapDisplay
    const buttonId = `btn-details-${stationCode.replace('.', '-')}`;
    const stationName = props.stationName || t('waterStation.popup.defaultNA');
    const stationType = props.stationType || t('waterStation.popup.defaultNA');
    const ownerName = props.stationOwnerName || t('waterStation.popup.defaultNA');

    return (
        <div style={{ fontFamily: 'sans-serif', maxWidth: '250px', lineHeight: '1.6' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1em' }}>
                {props.stationName || 'N/A'}
            </h4>
            
            <div style={{ fontSize: '0.9em' }}>
                {/* <strong>Type:</strong> {props.stationType || 'N/A'}<br/> */}
                {/* <strong>Status:</strong> {statusText}<br/> */}
                {/* <strong>Station Owner Name:</strong> {props.stationOwnerName || 'N/A'}<br/> */}
                {/* <strong>Station Code:</strong> {stationCode}<br/> */}
                {/* <strong>Coordinate:</strong> {latitude}, {longitude} */}
                <strong>{t('waterStation.popup.type')}</strong> {stationType}<br/>
                <strong>{t('waterStation.popup.owner')}</strong> {ownerName}<br/>
                <strong>{t('waterStation.popup.code')}</strong> {stationCode}<br/>
                <strong>{t('waterStation.popup.coordinate')}</strong> {latitude}, {longitude}
            </div>

            <br/>
            
            <Button 
                id={buttonId}
                className="w-full bg-teal-600 text-white p-2 rounded hover:bg-teal-500 mt-2"
                variant="default" 
                size="sm"
            >
               {t('waterStation.popup.viewDetails')}
            </Button>
        </div>
    );
}

export default WaterStationPopup;