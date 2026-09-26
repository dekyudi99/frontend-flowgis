import React from 'react';
import { Card, CardContent } from "@/components/elements/Card";
import { Hospital, Tent, Droplet, Building2, Users } from 'lucide-react';

export default function FacilitySummaryCards({ facilities = [] }) {
  const hospitalCount = facilities.filter((f) => 
    (f.category || '').toLowerCase().includes('hospital') || 
    (f.category || '').toLowerCase().includes('rumah sakit')
  ).length;

  const evacuationCount = facilities.filter((f) => 
    (f.category || '').toLowerCase().includes('evacuation') || 
    (f.category || '').toLowerCase().includes('posko')
  ).length;

  const waterCount = facilities.filter((f) => 
    (f.category || '').toLowerCase().includes('water') || 
    (f.category || '').toLowerCase().includes('air')
  ).length;

  const totalCapacity = facilities.reduce((sum, f) => {
    const isShelterOrHospital = 
      (f.category || '').toLowerCase().includes('hospital') || 
      (f.category || '').toLowerCase().includes('rumah sakit') ||
      (f.category || '').toLowerCase().includes('evacuation') || 
      (f.category || '').toLowerCase().includes('posko');
    return isShelterOrHospital ? sum + (parseInt(f.capacity, 10) || 0) : sum;
  }, 0);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
      {/* Rumah Sakit */}
      <Card className="border-border/60 shadow-sm bg-white">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Rumah Sakit</p>
            <h4 className="text-2xl font-bold text-gray-800">{hospitalCount}</h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Hospital className="w-5 h-5" />
          </div>
        </CardContent>
      </Card>

      {/* Posko Evakuasi */}
      <Card className="border-border/60 shadow-sm bg-white">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Posko Evakuasi</p>
            <h4 className="text-2xl font-bold text-gray-800">{evacuationCount}</h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Tent className="w-5 h-5" />
          </div>
        </CardContent>
      </Card>

      {/* Stasiun Air & Pos Pantau */}
      <Card className="border-border/60 shadow-sm bg-white">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Stasiun Air / Lainnya</p>
            <h4 className="text-2xl font-bold text-gray-800">{waterCount}</h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Droplet className="w-5 h-5" />
          </div>
        </CardContent>
      </Card>

      {/* Total Daya Tampung / Kapasitas */}
      <Card className="border-border/60 shadow-sm bg-white">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Kapasitas</p>
            <h4 className="text-2xl font-bold text-teal-700">{totalCapacity.toLocaleString()}</h4>
            <p className="text-[10px] text-gray-400">Tempat tidur / Jiwa</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}