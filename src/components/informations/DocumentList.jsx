import React from 'react';
import { FileText } from 'lucide-react';
import { Button } from '../elements/Button';

const DocumentList = ({ documents, onSelectDoc }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        Information & Documents
      </h2>
      
      {/* <div className="flex flex-col gap-4">
        {documents.map((doc) => (
          <div key={doc.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-teal-500 transition-colors">
            
            <div className="flex items-center gap-4 mb-4 md:mb-0">
              <div className="p-3 bg-red-50 text-red-500 rounded-lg">
                <FileText size={28} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">{doc.title}</h3>
                <p className="text-sm text-gray-500">PDF • {doc.size} • {doc.date}</p>
              </div>
            </div>

            <Button
                onClick={() => onSelectDoc(doc)}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-md font-medium transition-colors"
            >
                <FileText size={18} />
              Read the Document
            </Button>
          </div>
        ))}
      </div> */}
      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <Inbox size={48} className="mb-4 text-gray-300" />
          <p className="text-lg font-medium text-gray-600">No documents available yet</p>
          <p className="text-sm">Information and files will appear here once they are added.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {documents.map((doc) => (
            <div key={doc.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-teal-500 transition-colors">
              
              <div className="flex items-center gap-4 mb-4 md:mb-0">
                <div className="p-3 bg-red-50 text-red-500 rounded-lg">
                  <FileText size={28} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{doc.title}</h3>
                  <p className="text-sm text-gray-500">PDF • {doc.size} • {doc.date}</p>
                </div>
              </div>

              <Button
                  onClick={() => onSelectDoc(doc)}
                  className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-md font-medium transition-colors"
              >
                  <FileText size={18} />
                Read the Document
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentList;