import CommonSearchBar from '@/components/elements/CommonSearchbar';
// import DocumentList from '@/components/informations/DocumentList';
// import MapPreview from '@/components/informations/MapPreview';
// import PdfViewer from '@/components/informations/PdfViewer';
import Footer from '@/components/sections/Footer';
import Navbar from '@/components/sections/Navbar';
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom';

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
      
      <main className="pt-24 pb-16 flex-grow container mx-auto px-6 flex flex-col items-center justify-center text-center">
        <div className="w-44 h-44 sm:w-52 sm:h-52 mb-6 flex items-center justify-center">
          <svg
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full drop-shadow-sm"
          >
            <circle cx="100" cy="100" r="85" className="fill-teal-50/60" />
          
            <g transform="translate(100, 42) scale(1.6)" className="text-teal-500 stroke-teal-500 fill-none">
              <path
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
              />
            </g>

            <g className="text-teal-300 fill-current opacity-70">
              <circle cx="65" cy="65" r="14" />
            </g>

            <rect x="45" y="85" width="110" height="75" rx="8" className="fill-white stroke-slate-700" strokeWidth="4" />
            
            <path d="M45 93c0-4.4 3.6-8 8-8h94c4.4 0 8 3.6 8 8v12H45V93z" className="fill-slate-700" />
            <circle cx="57" cy="95" r="2.5" className="fill-red-400" />
            <circle cx="65" cy="95" r="2.5" className="fill-amber-400" />
            <circle cx="73" cy="95" r="2.5" className="fill-emerald-400" />

            <path d="M90 160h20v12H90z" className="fill-slate-600" />
            <path d="M80 172h40v4H80z" className="fill-slate-700" />

            <rect x="57" y="113" width="45" height="6" rx="3" className="fill-slate-200" />
            <rect x="57" y="125" width="30" height="6" rx="3" className="fill-slate-200" />
            <rect x="57" y="137" width="55" height="6" rx="3" className="fill-teal-100" />

            <circle cx="125" cy="130" r="14" className="fill-white stroke-teal-600" strokeWidth="4" />
            <path d="M135 140l10 10" className="stroke-teal-600" strokeWidth="4" strokeLinecap="round" />
          </svg>
        </div>

        {/* Tulisan */}
        <p className="text-gray-400 font-medium mb-3">
          {t('infoPage.empty', 'There’s nothing here yet')}
        </p>

        {/* Text Link */}
        <Link
          to="/"
          className="text-teal-600 hover:text-teal-700 font-medium text-sm hover:underline transition-colors"
        >
          {t('common.backToHome', 'Back to Home')}
        </Link>

        {/* {!selectedDoc && (
          <div className="mb-8">
            <CommonSearchBar />
          </div>
        )} */}

        {/* {!selectedDoc && !isLoading && !error && (
           <MapPreview />
        )} */}

        {/* Conditional Rendering: Loading -> Error -> List -> Viewer */}
        {/* {isLoading ? (
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
        )} */}
      </main>
      <Footer />
    </div>
  )
}