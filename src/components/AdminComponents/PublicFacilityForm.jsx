import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/elements/Card";
import { Button } from "@/components/elements/Button";
import { Plus, MapPin, Building2, Phone, Map, Users, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';

export default function PublicFacilityForm({ 
  onAddFacility, 
  onEditFacility,
  selectedLocation,
  isPickMode,
  setIsPickMode,
  editingFacility,
  setEditingFacility
}) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'Hospital',
    address: '',
    phone_number: '',
    capacity: '',
    lat: '',
    lng: '',
  });

  const { notify } = useNotification();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingFacility) {
      setFormData({
        name: editingFacility.name || '',
        category: editingFacility.category || 'Hospital',
        address: editingFacility.address || '',
        phone_number: editingFacility.phone_number || '',
        capacity: editingFacility.capacity || '',
        lat: editingFacility.lat || '',
        lng: editingFacility.lng || '',
      });
    }
  }, [editingFacility]);

  // Sinkronisasi koordinat saat admin mengklik titik di peta Leaflet
  useEffect(() => {
    if (selectedLocation) {
      setFormData((prev) => ({
        ...prev,
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
      }));
    }
  }, [selectedLocation]);

  const handleCancelEdit = () => {
    setEditingFacility(null);
    setFormData({
      name: '',
      category: 'Hospital',
      address: '',
      phone_number: '',
      capacity: '',
      lat: '',
      lng: '',
    });
    setIsPickMode(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.lat || !formData.lng) {
      notify.error('Silakan tentukan koordinat lokasi terlebih dahulu (bisa klik "Pilih Titik di Peta" atau masukkan manual)!');
      return;
    }

    setSaving(true);
    try {
      const supportsCapacity = formData.category === 'Hospital' || formData.category === 'Evacuation Center';
      const payload = {
        name: formData.name,
        category: formData.category,
        address: formData.address || null,
        phone_number: formData.phone_number || null,
        capacity: (supportsCapacity && formData.capacity) ? parseInt(formData.capacity, 10) : null,
        lat: parseFloat(formData.lat),
        lng: parseFloat(formData.lng),
      };

      if (editingFacility) {
        await onEditFacility(editingFacility.id, payload);
        handleCancelEdit();
      } else {
        await onAddFacility(payload);
        setFormData({
          name: '',
          category: 'Hospital',
          address: '',
          phone_number: '',
          capacity: '',
          lat: '',
          lng: '',
        });
        setIsPickMode(false);
      }
    } catch (err) {
      console.error('Error submitting facility form:', err);
      notify.error(err.response?.data?.message || err.message || 'Gagal menyimpan fasilitas publik');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-border/60 shadow-sm bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold text-gray-800 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-teal-600" />
          {editingFacility ? 'Edit Fasilitas Publik' : 'Tambah Fasilitas Publik Baru'}
        </CardTitle>
        <CardDescription className="text-xs text-gray-500">
          Kelola data fasilitas pelayanan publik (Rumah Sakit, Posko Evakuasi, Stasiun Air, dll.).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-1 gap-3">
            {/* Nama Fasilitas */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Nama Fasilitas Publik <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: RSUD Pratama Nakhon Pathom / Posko Evakuasi Bang Len"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            {/* Kategori Fasilitas */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Kategori Fasilitas <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => {
                  const newCat = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    category: newCat,
                    capacity: (newCat === 'Hospital' || newCat === 'Evacuation Center') ? prev.capacity : '',
                  }));
                }}
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                required
              >
                <option value="Hospital">Rumah Sakit (Hospital)</option>
                <option value="Evacuation Center">Posko Evakuasi / Pengungsian</option>
                <option value="Water Station">Stasiun Pemantauan Air (Non-CCTV)</option>
                <option value="Fire Station">Pos Pemadam Kebakaran</option>
                <option value="Public Service">Layanan Publik Lainnya</option>
              </select>
            </div>

            {/* Alamat Lengkap */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Alamat / Keterangan Lokasi
              </label>
              <input
                type="text"
                placeholder="Contoh: 196 Thetsaban Rd, Phra Pathom Chedi, Mueang Nakhon Pathom"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Kontak Telepon & Kapasitas (Hanya untuk Kategori yang Relevan seperti Rumah Sakit & Posko Evakuasi) */}
            {(() => {
              const isHospital = formData.category === 'Hospital';
              const isEvacuation = formData.category === 'Evacuation Center';
              const supportsCapacity = isHospital || isEvacuation;

              return (
                <div className={`grid gap-2.5 ${supportsCapacity ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-gray-400" /> Nomor Telepon / Kontak
                    </label>
                    <input
                      type="text"
                      placeholder="+66 34 254 150"
                      value={formData.phone_number}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  {supportsCapacity && (
                    <div className="animate-in fade-in duration-200">
                      <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-teal-600" /> 
                        {isHospital ? 'Kapasitas Tempat Tidur (Beds)' : 'Daya Tampung Evakuasi (Jiwa)'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder={isHospital ? "Contoh: 250 (tempat tidur)" : "Contoh: 500 (jiwa)"}
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Koordinat Geografis */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Latitude <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="13.8189"
                  value={formData.lat}
                  onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Longitude <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="100.0617"
                  value={formData.lng}
                  onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Tombol Pemilih Koordinat Peta */}
          <div className="pt-1 space-y-2">
            <Button
              type="button"
              variant={isPickMode ? 'default' : 'outline'}
              onClick={() => setIsPickMode(!isPickMode)}
              className={`text-xs font-semibold w-full justify-center gap-1.5 py-1.5 ${
                isPickMode 
                  ? 'bg-amber-600 hover:bg-amber-700 text-white animate-pulse' 
                  : 'text-teal-700 border-teal-300 hover:bg-teal-50'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              {isPickMode ? 'Klik lokasi di peta Leaflet di samping...' : 'Pilih Titik di Peta (Map Picker)'}
            </Button>
            
            {formData.lat && formData.lng && (
              <div className="text-center text-[11px] text-teal-800 font-mono bg-teal-50/80 py-1 rounded-md border border-teal-200">
                Koordinat: {Number(formData.lat).toFixed(4)}, {Number(formData.lng).toFixed(4)}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              {editingFacility && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                  className="flex-1 text-xs justify-center"
                >
                  Batal
                </Button>
              )}
              <Button 
                type="submit" 
                disabled={saving}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold justify-center"
              >
                {saving ? 'Menyimpan...' : editingFacility ? 'Simpan Perubahan' : 'Simpan Fasilitas Baru'}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}