import CommonSearchBar from '@/components/elements/CommonSearchbar';
import DocumentList from '@/components/informations/DocumentList';
import MapPreview from '@/components/informations/MapPreview';
import PdfViewer from '@/components/informations/PdfViewer';
import Footer from '@/components/sections/Footer';
import Navbar from '@/components/sections/Navbar';
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

export const InfoPage = () => {
  const { t } = useTranslation();
  
  const [selectedDoc, setSelectedDoc] = useState(null);
  // State manajemen data API
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null); 
  // Fetch data dari Flask saat komponen pertama kali dimuat
  // useEffect(() => {
  //   const fetchDocuments = async () => {
  //     try {
  //       setIsLoading(true);
  //       setError(null);
        
  //       // Memanggil API melalui infoService
  //       const response = await getInfoDocuments();
  //       setDocuments(response.data);
  //     } catch (error) {
  //       console.error("Gagal mengambil dokumen:", error);
  //       setError(t('infoPage.fetchError', 'Gagal memuat dokumen. Silakan coba lagi nanti.'));
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };

  //   fetchDocuments();
  // }, [t]);
  
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      
      <main className="pt-24 pb-16 flex-grow container mx-auto px-6">
        {!selectedDoc && (
          <div className="mb-8">
            <CommonSearchBar />
          </div>
        )}

        {!selectedDoc && !isLoading && !error && (
           <MapPreview />
        )}

        {/* Conditional Rendering: Loading -> Error -> List -> Viewer */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20 text-teal-600 font-medium">
             {t('infoPage.loading', 'Loading document...')}
          </div>
        ) : error ? (
          <div className="flex justify-center items-center py-20 text-red-500 font-medium">
             {error}
          </div>
        ) : !selectedDoc ? (
          <DocumentList 
            documents={documents} 
            onSelectDoc={setSelectedDoc} 
          />
        ) : (
          <PdfViewer 
            document={selectedDoc} 
            onClose={() => setSelectedDoc(null)} 
          />
        )}
      </main>
      <Footer />
    </div>
  )
}