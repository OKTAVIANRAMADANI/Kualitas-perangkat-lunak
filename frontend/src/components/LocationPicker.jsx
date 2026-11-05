"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, ChevronRight, Search, Check } from 'lucide-react';

const API_BASE = 'https://www.emsifa.com/api-wilayah-indonesia/api';

export default function LocationPicker({ onClose, onSelect }) {
  const [step, setStep] = useState('provinsi'); // provinsi, kabupaten, kecamatan, kodepos
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  
  const [selection, setSelection] = useState({
    provinsi: null,
    kabupaten: null,
    kecamatan: null,
    kodepos: null
  });

  useEffect(() => {
    fetchData();
  }, [step]);

  const fetchData = async () => {
    setLoading(true);
    setSearch('');
    try {
      let url = '';
      if (step === 'provinsi') url = `${API_BASE}/provinces.json`;
      else if (step === 'kabupaten') url = `${API_BASE}/regencies/${selection.provinsi.id}.json`;
      else if (step === 'kecamatan') url = `${API_BASE}/districts/${selection.kabupaten.id}.json`;
      else if (step === 'kodepos') {
         // API emsifa tidak punya kodepos langsung, kita bisa mock atau biarkan user isi
         // Tapi untuk simulasi "Shopee", kita kasih list dummy kode pos atau biarkan selesai di kecamatan
         handleComplete();
         return;
      }

      const res = await axios.get(url);
      setData(res.data);
    } catch (err) {
      console.error('Error fetching region data', err);
    }
    setLoading(false);
  };

  const handleSelect = (item) => {
    const newSelection = { ...selection, [step]: item };
    setSelection(newSelection);

    if (step === 'provinsi') setStep('kabupaten');
    else if (step === 'kabupaten') setStep('kecamatan');
    else if (step === 'kecamatan') {
       // Selesai
       const finalStr = `${newSelection.provinsi.name}, ${newSelection.kabupaten.name}, ${item.name}`;
       onSelect(finalStr);
       onClose();
    }
  };

  const handleTabClick = (targetStep) => {
    if (targetStep === 'provinsi') setStep('provinsi');
    else if (targetStep === 'kabupaten' && selection.provinsi) setStep('kabupaten');
    else if (targetStep === 'kecamatan' && selection.kabupaten) setStep('kecamatan');
  };

  const filteredData = data.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-end sm:items-center z-[110] p-0 sm:p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all h-[80vh] flex flex-col slide-in-from-bottom duration-500">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-[17px] font-bold text-gray-900">Pilih Daerah</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Tabs (Shopee Style) */}
        <div className="flex border-b border-gray-100 bg-gray-50/50">
          {['provinsi', 'kabupaten', 'kecamatan'].map((s, i) => {
            const isActive = step === s;
            const isSelected = selection[s];
            return (
              <button 
                key={s}
                onClick={() => handleTabClick(s)}
                className={`flex-1 py-4 text-[13px] font-bold border-b-2 transition-all relative ${isActive ? 'text-[#EE4D2D] border-[#EE4D2D]' : 'text-gray-400 border-transparent'}`}
              >
                <span className="truncate block px-2">
                   {isSelected ? isSelected.name : s.charAt(0).toUpperCase() + s.slice(1)}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search Input */}
        <div className="p-4 bg-white border-b border-gray-50">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder={`Cari ${step}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl text-[14px] outline-none focus:ring-2 focus:ring-[#EE4D2D]/10 focus:bg-white border border-transparent focus:border-[#EE4D2D]/20 transition-all font-medium"
              />
           </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
               <div className="w-8 h-8 border-4 border-gray-100 border-t-[#EE4D2D] rounded-full animate-spin"></div>
               <p className="text-xs font-bold text-gray-400">Memuat data...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
               <p className="text-[14px] font-medium">Data tidak ditemukan</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredData.map((item) => (
                <button 
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors group"
                >
                  <span className={`text-[14px] font-medium ${selection[step]?.id === item.id ? 'text-[#EE4D2D] font-bold' : 'text-gray-700'}`}>
                    {item.name}
                  </span>
                  {selection[step]?.id === item.id ? (
                     <Check size={18} className="text-[#EE4D2D]" />
                  ) : (
                     <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-400 transition-colors" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 bg-gray-50 text-[11px] text-gray-400 font-medium text-center">
           Data Wilayah Indonesia • API Terverifikasi
        </div>
      </div>
    </div>
  );
}
