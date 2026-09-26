import React from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { ZoomIn, ZoomOut, Maximize, Download } from 'lucide-react';
// import { getPdfDocumentUrl } from '@/api/infoService';

const MapPreview = () => {
  // Nama file gambar yang sudah Anda konversi dan taruh di folder geosocial_map1
  const mapImageFilename = 'ผังภูมิสังคม.png'; 
  const imageUrl = getPdfDocumentUrl(mapImageFilename);
  
  const tiffFilename = 'ผังภูมิสังคม.tiff';
  const tiffDownloadUrl = getPdfDocumentUrl(tiffFilename);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Geosocial Map</h2>
          <p className="text-sm text-gray-500">Use the mouse wheel or pinch the screen to zoom in or out</p>
        </div>
        
        {/* Tombol Download TIFF Asli */}
        {/* <a 
          href={tiffDownloadUrl} 
          download 
          className="mt-3 sm:mt-0 flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md text-sm font-medium transition-colors"
        >
          <Download size={16} />
          Unduh TIFF Asli (168 MB)
        </a> */}
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-100 relative h-[900px]">
        <TransformWrapper
          initialScale={1}
          minScale={0.5}
          maxScale={8} // Batas maksimal zoom (8x lipat)
          centerOnInit={true}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              {/* Tombol Navigasi Zoom Mengambang (Floating Controls) */}
              <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 bg-white/90 p-2 rounded-lg shadow-md backdrop-blur-sm border border-gray-200">
                <button onClick={() => zoomIn()} className="p-2 hover:bg-gray-100 rounded-md text-gray-700" title="Zoom In">
                  <ZoomIn size={20} />
                </button>
                <div className="w-full h-px bg-gray-200"></div>
                <button onClick={() => zoomOut()} className="p-2 hover:bg-gray-100 rounded-md text-gray-700" title="Zoom Out">
                  <ZoomOut size={20} />
                </button>
                <div className="w-full h-px bg-gray-200"></div>
                <button onClick={() => resetTransform()} className="p-2 hover:bg-gray-100 rounded-md text-gray-700" title="Reset View">
                  <Maximize size={20} />
                </button>
              </div>

              {/* Area Gambar yang bisa di Zoom & Geser */}
              <TransformComponent wrapperClass="w-full h-full" contentClass="w-full h-full flex items-center justify-center">
                <img 
                  src={imageUrl} 
                  alt="Peta Preview" 
                  className="max-w-full max-h-full object-contain"
                  // Fallback jika gambar belum ada
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/800x500?text=Peta+Belum+Dikonversi+ke+JPG/PNG';
                  }}
                />
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      </div>
    </div>
  );
};

export default MapPreview;