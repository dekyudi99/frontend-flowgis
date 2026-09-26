import { Button } from "../elements/Button";
import { useTranslation } from 'react-i18next';  

function AoiControls({ aoiDisplayText, onClearAoi }) {
    const { t } = useTranslation();  

    return (
        <section>
            <h4 className="text-xs font-semibold mb-2">
                {t('sidebar.aoi.title')} 
            </h4>
            <p className="text-xs text-gray-600 mb-2">
                {t('sidebar.aoi.description')} 
            </p>
            
            <label htmlFor="coords-display" className="text-xs">
                {t('sidebar.aoi.coordinatesLabel')} 
            </label>
            <textarea
                id="coords-display"
                rows="4"
                readOnly 
                value={aoiDisplayText}
                placeholder={t('sidebar.aoi.placeholder')} 
                className="w-full p-2 border rounded bg-gray-100 text-xs font-mono"
            />
            <Button onClick={onClearAoi} className="w-full bg-teal-600 text-white p-2 rounded hover:bg-teal-500 mt-2">
                {t('sidebar.aoi.clearButton')}
            </Button>
        </section>
    );
}
export default AoiControls;