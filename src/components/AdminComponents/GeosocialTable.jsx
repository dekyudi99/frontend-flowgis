import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { Eye, Edit2, Palette, Trash2, Layers, CheckCircle, XCircle, Loader2, Search } from 'lucide-react';
import ConfirmModal from '@/components/popups/ConfirmModal';
import Pagination from '@/components/elements/Pagination';

export default function GeosocialTable({ 
  geosocialList = [], 
  isLoading = false,
  onDeleteLayer, 
  onSaveEdit, 
  onToggleStatus,
  onSelectLayerToView,
  onOpenStyleModal,
}) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteTarget, setConfirmDeleteTarget] = useState(null);

  // Filter pencarian layer spasial
  const filteredLayers = geosocialList.filter((item) => {
    const term = search.toLowerCase();
    const name = (item.name || item.display_name || '').toLowerCase();
    const key = (item.layer_name || item.layer_key || '').toLowerCase();
    const type = (item.type || '').toLowerCase();
    return name.includes(term) || key.includes(term) || type.includes(term);
  });

  const totalPages = Math.max(1, Math.ceil(filteredLayers.length / pageSize));

  // Reset ke halaman 1 jika filter pencarian berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Jaga agar halaman tidak melebihi total halaman (misal setelah hapus data)
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedLayers = filteredLayers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setEditName(item.name || item.display_name || '');
  };

  const handleSave = async (id) => {
    if (onSaveEdit) {
      await onSaveEdit(id, editName);
    }
    setEditingId(null);
  };

  const handleDeleteClick = (item) => {
    setConfirmDeleteTarget(item);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteTarget) return;
    const target = confirmDeleteTarget;
    setConfirmDeleteTarget(null);
    setDeletingId(target.id);
    try {
      if (onDeleteLayer) {
        await onDeleteLayer(target.id);
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card className="border-border/60 shadow-sm bg-white w-full">
      <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <CardTitle className="text-base font-bold text-gray-800 flex items-center gap-2">
            <Layers className="w-5 h-5 text-teal-600" /> Katalog Layer Spasial & Geosocial
          </CardTitle>
          <span className="text-xs text-gray-500 font-medium">
            Total: {filteredLayers.length} Layer Terdaftar {search ? `(dari pencarian)` : ''}
          </span>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama, tipe, atau key..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
            <span className="text-xs">Memuat daftar layer spasial...</span>
          </div>
        ) : filteredLayers.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-xs">
            {search ? 'Tidak ada layer yang sesuai dengan pencarian.' : 'Belum ada layer geosocial terdaftar. Silakan upload file spasial di atas.'}
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-y border-gray-200 text-gray-600 font-semibold">
                <th className="p-3">Nama Layer & Identifier</th>
                <th className="p-3">Tipe Format</th>
                <th className="p-3">Status Publik</th>
                <th className="p-3">Ukuran / Info</th>
                <th className="p-3">Tanggal Dibuat</th>
                <th className="p-3 text-center">Aksi Manajemen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {paginatedLayers.map((item) => {
                const displayName = item.display_name || item.name || 'Unnamed Layer';
                const layerKey = item.layer_name || item.layer_key || '-';
                const isActive = item.is_active !== undefined ? item.is_active : item.status === 'Active';
                const dateStr = item.date || (item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-');

                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-medium text-gray-900">
                      {editingId === item.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="px-2 py-1 text-xs border border-teal-500 rounded focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSave(item.id)}
                            className="text-[10px] bg-teal-600 hover:bg-teal-700 text-white px-2 py-1 rounded"
                          >
                            Simpan
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-[10px] bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <div>
                          <div className="font-semibold text-gray-800">{displayName}</div>
                          <div className="text-[10px] text-gray-400 font-mono">{layerKey}</div>
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        item.type?.toLowerCase() === 'vector' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-sky-50 text-sky-700 border-sky-200'
                      }`}>
                        {item.type || 'WMS'}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => onToggleStatus && onToggleStatus(item.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border transition ${
                          isActive
                            ? 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100'
                            : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                        }`}
                        title="Klik untuk mengubah status aktif"
                      >
                        {isActive ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-teal-600" /> Aktif
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-gray-400" /> Nonaktif
                          </>
                        )}
                      </button>
                    </td>
                    <td className="p-3 text-gray-500">{item.size || 'Auto PostGIS'}</td>
                    <td className="p-3 text-gray-500">{dateStr}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onSelectLayerToView && onSelectLayerToView(item)}
                          className="p-1.5 text-teal-600 hover:bg-teal-50 rounded"
                          title="Tampilkan di Peta"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          title="Ubah Nama Layer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onOpenStyleModal && onOpenStyleModal(item)}
                          className="p-1.5 text-purple-600 hover:bg-purple-50 rounded"
                          title="Atur / Edit Style Visual (SLD)"
                        >
                          <Palette className="w-4 h-4" />
                        </button>
                        <button
                          disabled={deletingId === item.id}
                          onClick={() => handleDeleteClick(item)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded disabled:opacity-40"
                          title="Hapus Layer"
                        >
                          {deletingId === item.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </CardContent>

      {/* Pagination Footer */}
      <Pagination
        currentPage={currentPage}
        totalItems={filteredLayers.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={[5, 10, 20]}
      />

      {/* Confirmation Modal untuk Hapus Layer */}
      <ConfirmModal
        isOpen={!!confirmDeleteTarget}
        onClose={() => setConfirmDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={!!deletingId}
        title="Hapus Layer Spasial?"
        message={`Apakah Anda yakin ingin menghapus layer "${confirmDeleteTarget?.name || confirmDeleteTarget?.display_name || 'ini'}" dari GeoServer dan database? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus Layer"
        cancelText="Batal"
      />
    </Card>
  );
}