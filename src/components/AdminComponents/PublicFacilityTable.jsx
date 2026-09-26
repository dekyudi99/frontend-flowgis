import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/elements/Card";
import { Hospital, Droplet, Tent, Flame, Building2, Edit2, Trash2, Search, Phone, MapPin } from 'lucide-react';
import ConfirmModal from '@/components/popups/ConfirmModal';
import Pagination from '@/components/elements/Pagination';

const getCategoryBadge = (category) => {
  const cat = (category || '').toLowerCase();
  if (cat.includes('hospital') || cat.includes('rumah sakit')) {
    return {
      label: 'Rumah Sakit',
      icon: Hospital,
      className: 'bg-rose-50 text-rose-700 border-rose-200',
      iconColor: 'text-rose-600',
    };
  }
  if (cat.includes('evacuation') || cat.includes('posko')) {
    return {
      label: 'Posko Evakuasi',
      icon: Tent,
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      iconColor: 'text-emerald-600',
    };
  }
  if (cat.includes('water') || cat.includes('air')) {
    return {
      label: 'Stasiun Air',
      icon: Droplet,
      className: 'bg-blue-50 text-blue-700 border-blue-200',
      iconColor: 'text-blue-600',
    };
  }
  if (cat.includes('fire') || cat.includes('damkar')) {
    return {
      label: 'Pemadam Kebakaran',
      icon: Flame,
      className: 'bg-amber-50 text-amber-700 border-amber-200',
      iconColor: 'text-amber-600',
    };
  }
  return {
    label: category || 'Layanan Publik',
    icon: Building2,
    className: 'bg-slate-100 text-slate-700 border-slate-200',
    iconColor: 'text-slate-600',
  };
};

export default function PublicFacilityTable({ facilities = [], onDeleteFacility, onStartEdit }) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [confirmDeleteTarget, setConfirmDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!confirmDeleteTarget) return;
    const target = confirmDeleteTarget;
    setConfirmDeleteTarget(null);
    setIsDeleting(true);
    try {
      if (onDeleteFacility) {
        await onDeleteFacility(target.id);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredFacilities = facilities.filter((f) =>
    (f.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (f.category || '').toLowerCase().includes(search.toLowerCase()) ||
    (f.address || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredFacilities.length / pageSize));

  // Reset ke halaman 1 jika filter pencarian berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Jaga agar halaman tidak out of bounds
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedFacilities = filteredFacilities.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <Card className="border-border/60 shadow-sm bg-white w-full">
      <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <CardTitle className="text-base font-bold text-gray-800 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-teal-600" /> Daftar Fasilitas Publik
          </CardTitle>
          <CardDescription className="text-xs text-gray-500">
            Daftar infrastruktur pelayanan darurat, fasilitas kesehatan, dan pos penanganan publik.
          </CardDescription>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama atau alamat fasilitas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </CardHeader>

      <CardContent className="p-0 overflow-x-auto">
        {filteredFacilities.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-xs">
            Tidak ada data fasilitas publik ditemukan.
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-y border-gray-200 text-gray-600 font-semibold">
                <th className="p-3.5">Nama Fasilitas</th>
                <th className="p-3.5">Kategori</th>
                <th className="p-3.5">Alamat & Kontak</th>
                <th className="p-3.5">Kapasitas</th>
                <th className="p-3.5">Koordinat</th>
                <th className="p-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {paginatedFacilities.map((item) => {
                const badge = getCategoryBadge(item.category);
                const BadgeIcon = badge.icon;
                const latNum = parseFloat(item.lat);
                const lngNum = parseFloat(item.lng);

                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-medium text-gray-900">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${badge.className}`}>
                          <BadgeIcon className={`w-4 h-4 ${badge.iconColor}`} />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800">{item.name}</div>
                          <div className="text-[10px] text-gray-400 font-mono">
                            ID: {item.raw_id ? `#${item.raw_id}` : item.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${badge.className}`}>
                        <BadgeIcon className="w-3 h-3" />
                        {badge.label}
                      </span>
                    </td>

                    <td className="p-3.5 max-w-xs">
                      {item.address ? (
                        <div className="flex items-start gap-1 text-gray-700 line-clamp-2">
                          <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0 mt-0.5" />
                          <span className="text-[11px]">{item.address}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">-</span>
                      )}
                      {item.phone_number && (
                        <div className="flex items-center gap-1 text-gray-500 text-[10px] mt-0.5">
                          <Phone className="w-2.5 h-2.5 text-gray-400" />
                          <span>{item.phone_number}</span>
                        </div>
                      )}
                    </td>

                    <td className="p-3.5">
                      {item.capacity && (item.category === 'Hospital' || item.category === 'Evacuation Center') ? (
                        <span className="font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 text-[11px]">
                          {item.capacity.toLocaleString()} {item.category === 'Hospital' ? 'Beds' : 'Jiwa'}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic text-[11px]">-</span>
                      )}
                    </td>

                    <td className="p-3.5 font-mono text-[11px] text-gray-500 whitespace-nowrap">
                      {!isNaN(latNum) && !isNaN(lngNum) ? (
                        `${latNum.toFixed(4)}, ${lngNum.toFixed(4)}`
                      ) : (
                        '-'
                      )}
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onStartEdit(item)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                          title="Edit Fasilitas"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteTarget(item)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                          title="Hapus Fasilitas"
                        >
                          <Trash2 className="w-4 h-4" />
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
        totalItems={filteredFacilities.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={[5, 10, 20]}
      />

      {/* Confirmation Modal untuk Hapus Fasilitas */}
      <ConfirmModal
        isOpen={!!confirmDeleteTarget}
        onClose={() => setConfirmDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Hapus Fasilitas Publik?"
        message={`Apakah Anda yakin ingin menghapus fasilitas "${confirmDeleteTarget?.name || 'ini'}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus Fasilitas"
        cancelText="Batal"
      />
    </Card>
  );
}