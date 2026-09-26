import React from 'react';
import { useTranslation } from 'react-i18next'; 

export default function MarkerPopup({ properties }) {
  const { t } = useTranslation(); 

  const name = properties.name || t('markerPopup.defaultName');
  const type = properties.type || t('markerPopup.defaultNA');
  const address = properties.address || t('markerPopup.defaultNA');
  const phone = properties.phone_number || t('markerPopup.defaultNA');
  const capacity = properties.capacity || t('markerPopup.defaultNA');

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 250, lineHeight: 1.5 }}>
      
      <h4 style={{ 
        margin: '0 0 8px 0', 
        fontSize: '1.1em', 
        color: '#333' 
      }}>
        {name}
      </h4>
      
      <div style={{ fontSize: '0.9em' }}>
        <strong style={{ color: '#555' }}>{t('markerPopup.type')}</strong> {type}
        <br />
        <strong style={{ color: '#555' }}>{t('markerPopup.address')}</strong> {address}
        <br />
        <strong style={{ color: '#555' }}>{t('markerPopup.phone')}</strong> {phone}
        <br />
        <strong style={{ color: '#555' }}>{t('markerPopup.capacity')}</strong> {capacity}
      </div>

    </div>
  );
}