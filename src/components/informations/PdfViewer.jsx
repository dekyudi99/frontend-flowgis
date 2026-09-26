import React from 'react';
import { ArrowLeft, Download } from 'lucide-react';
// import { getPdfDocumentUrl } from '@/api/infoService';

const PdfViewer = ({ document, onClose }) => {
  if (!document) return null; 
  const pdfUrl = getPdfDocumentUrl(document.filename);

  return (
    <div className="h-[80vh] flex flex-col animate-in fade-in duration-300">
      {/* Header Viewer */}
      <div className="flex items-center justify-between bg-white p-4 rounded-t-xl border border-gray-200 border-b-0 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
            title="Kembali ke daftar"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="font-semibold text-gray-800 text-lg">{document.title}</h2>
            <p className="text-xs text-gray-500">Preview Dokumen</p>
          </div>
        </div>
        
        <a
            href={pdfUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="..."
        >
          {/* <Download size={18} />
          <span className="hidden sm:inline">Unduh</span> */}
        </a>
      </div>

      {/* Area PDF iframe */}
      <div className="flex-grow bg-gray-200 rounded-b-xl overflow-hidden border border-gray-200 shadow-inner">
        <iframe
            src={`${pdfUrl}#toolbar=0&navpanes=0`}
            className="w-full h-full"
            title={document.title}
        />
      </div>
    </div>
  );
};

export default PdfViewer;