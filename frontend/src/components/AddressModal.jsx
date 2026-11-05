"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import dynamic from 'next/dynamic';
import { X, MapPin, ChevronRight, Bell, Info } from 'lucide-react';
import LocationPicker from './LocationPicker';

const MapComponent = dynamic(() => import('./MapComponent'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center text-gray-400 text-xs font-bold">Memuat Peta...</div>
});

const API_URL = 'http://localhost:5000/api/addresses';

export default function AddressModal({ address, username, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    username: username,
    name: address ? address.name : '',
    phone: address ? address.phone : '',
    province_city_district: address ? address.province_city_district : '',
    street_details: address ? address.street_details : '',
    other_details: address ? address.other_details : '',
    label: address ? address.label : 'Rumah',
    is_default: address ? address.is_default : false,
    lat: address ? address.lat : -8.2191, // Default Banyuwangi
    lng: address ? address.lng : 114.3691
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isSearchingStreet, setIsSearchingStreet] = useState(false);
  const [streetSuggestions, setStreetSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleStreetSearch = async (query) => {
    setFormData({...formData, street_details: query});
    if (query.length < 3) {
      setStreetSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearchingStreet(true);
    try {
      // Menggunakan Photon API dengan pencarian yang lebih luas
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6`; 
      const res = await axios.get(url);

      const features = res.data.features
        .filter(f => f.properties.country === 'Indonesia' || f.properties.state)
        .map(f => {
          const p = f.properties;
          
          // Nama utama (Gedung/Jalan)
          const main = p.name || p.street || 'Lokasi Tanpa Nama';
          
          // Detail daerah (Kecamatan, Kota, Provinsi)
          const state = p.state || '';
          const city = p.city || p.county || p.town || '';
          const district = p.district || p.suburb || '';
          
          // Format label Indonesia
          const formattedCity = city.toLowerCase().includes('kab') || city.toLowerCase().includes('kota') ? city : `KAB. ${city}`;
          
          return {
            id: Math.random(),
            main: main,
            sub: [p.street, district, city].filter(item => item && item !== main).join(', '),
            state: state.toUpperCase(),
            city: formattedCity.toUpperCase(),
            district: district.toUpperCase(),
            lat: f.geometry.coordinates[1],
            lng: f.geometry.coordinates[0]
          };
        });
      setStreetSuggestions(features);
      setShowSuggestions(true);
    } catch (err) {
      console.error("Error fetching suggestions", err);
    } finally {
      setIsSearchingStreet(false);
    }
  };

  const handleSelectSuggestion = (s) => {
    // Gabungkan data daerah sesuai format yang diinginkan (PROVINSI, KOTA, KECAMATAN)
    const regionText = [s.state, s.city, s.district].filter(Boolean).join(', ');
    
    setFormData({
      ...formData,
      street_details: s.main,
      other_details: s.sub,
      province_city_district: regionText,
      lat: s.lat,
      lng: s.lng
    });
    setStreetSuggestions([]);
    setShowSuggestions(false);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Browser Anda tidak mendukung geolokasi.");
      return;
    }

    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      setFormData(prev => ({ ...prev, lat: latitude, lng: longitude }));
      try {
        // Menggunakan OpenStreetMap Nominatim (Gratis & Tanpa API Key)
        const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
        const data = response.data;
        
        if (data && data.address) {
          const addr = data.address;
          const province = addr.state || addr.region || '';
          const city = addr.city || addr.town || addr.city_district || '';
          const district = addr.suburb || addr.municipality || '';
          const postcode = addr.postcode || '';
          
          setFormData(prev => ({
            ...prev,
            province_city_district: `${province}, ${city}, ${district}, ${postcode}`,
            street_details: data.display_name.split(',').slice(0, 3).join(', ')
          }));
          alert("Lokasi berhasil dideteksi otomatis!");
        }
      } catch (error) {
        console.error("Error reverse geocoding:", error);
        alert("Gagal mendeteksi detail alamat. Silakan isi manual.");
      }
      setIsDetecting(false);
    }, (error) => {
      console.error("Geolocation error:", error);
      alert("Gagal mendapatkan lokasi. Pastikan izin lokasi aktif.");
      setIsDetecting(false);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (address && address.id) {
        await axios.put(`${API_URL}/${address.id}`, formData);
      } else {
        await axios.post(API_URL, formData);
      }
      onSuccess();
    } catch (error) {
      console.error("Error saving address:", error);
      alert("Terjadi kesalahan saat menyimpan alamat.");
    }
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
          <h2 className="text-[18px] font-bold text-gray-900">{address ? 'Ubah Alamat' : 'Alamat Baru'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[85vh] custom-scrollbar">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Nama Lengkap</label>
              <input 
                type="text" 
                required 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-[14px] focus:border-[#8B5A2B] focus:ring-2 focus:ring-[#8B5A2B]/20 outline-none text-gray-800 transition-all bg-gray-50/30" 
                placeholder="Masukkan nama lengkap"
              />
            </div>
            <div>
              <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Nomor Telepon</label>
              <input 
                type="text" 
                required 
                value={formData.phone} 
                onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-[14px] focus:border-[#8B5A2B] focus:ring-2 focus:ring-[#8B5A2B]/20 outline-none text-gray-800 transition-all bg-gray-50/30" 
                placeholder="Masukkan nomor telepon"
              />
            </div>
          </div>

          <div className="relative">
            <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Provinsi, Kota, Kecamatan, Kode Pos</label>
            <div 
              onClick={() => setIsPickerOpen(true)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-[14px] outline-none text-gray-800 transition-all bg-gray-50/30 cursor-pointer hover:border-[#8B5A2B] flex justify-between items-center"
            >
               <span className={formData.province_city_district ? 'text-gray-800 font-medium' : 'text-gray-400'}>
                  {formData.province_city_district || 'Pilih Provinsi, Kota, Kecamatan'}
               </span>
               <ChevronRight size={18} className="text-gray-400" />
            </div>
          </div>

          <div className="relative">
            <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Nama Jalan, Gedung, No. Rumah</label>
            <textarea 
              rows={2} 
              required 
              value={formData.street_details} 
              onChange={(e) => handleStreetSearch(e.target.value)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onFocus={() => formData.street_details.length >= 3 && setShowSuggestions(true)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-[14px] focus:border-[#8B5A2B] focus:ring-2 focus:ring-[#8B5A2B]/20 outline-none text-gray-800 resize-none transition-all bg-gray-50/30" 
              placeholder="Masukkan detail nama jalan, nomor rumah, dsb" 
            />

            {/* Street Suggestions Dropdown */}
            {(showSuggestions || isSearchingStreet) && (
               <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-[120] overflow-hidden max-h-[300px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                  {isSearchingStreet && (
                     <div className="px-5 py-4 flex items-center gap-3 text-gray-400">
                        <div className="w-4 h-4 border-2 border-gray-200 border-t-[#EE4D2D] rounded-full animate-spin"></div>
                        <p className="text-[13px] font-medium">Mencari alamat...</p>
                     </div>
                  )}
                  
                  {!isSearchingStreet && streetSuggestions.length > 0 && streetSuggestions.map((s) => (
                     <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSelectSuggestion(s)}
                        className="w-full text-left px-5 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 group"
                     >
                        <p className="text-[14px] font-bold text-gray-800 group-hover:text-[#EE4D2D] leading-tight transition-colors">
                           {s.main}
                        </p>
                        {s.sub && (
                           <p className="text-[12px] text-gray-500 mt-1 line-clamp-1">
                              {s.sub}
                           </p>
                        )}
                     </button>
                  ))}

                  {!isSearchingStreet && showSuggestions && streetSuggestions.length === 0 && (
                     <div className="px-5 py-4 text-center text-gray-400 text-[13px] font-medium">
                        Alamat tidak ditemukan. Silakan ketik manual.
                     </div>
                  )}
               </div>
            )}
          </div>

          <div>
            <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Detail Lainnya (Cth: Blok / Unit No., Patokan)</label>
            <input 
              type="text" 
              value={formData.other_details} 
              onChange={(e) => setFormData({...formData, other_details: e.target.value})} 
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-[14px] focus:border-[#8B5A2B] focus:ring-2 focus:ring-[#8B5A2B]/20 outline-none text-gray-800 transition-all bg-gray-50/30" 
              placeholder="Contoh: Dekat Indomaret, Pagar Hijau"
            />
          </div>

          {/* Map Section with Shopee Style Alert */}
          <div className="space-y-3">
             <div className="bg-[#FFF8E1] border border-[#FFE082] rounded-xl p-4 flex gap-3">
                <div className="w-8 h-8 bg-[#FFD54F] rounded-full flex items-center justify-center shrink-0">
                   <Info size={18} className="text-white" />
                </div>
                <div>
                   <h4 className="text-[14px] font-bold text-[#FF8F00]">Tetapkan pin yang tepat</h4>
                   <p className="text-[12px] text-[#A67C00] mt-0.5 leading-relaxed">
                      Kami akan mengantarkan ke lokasi peta. Mohon periksa apakah sudah benar, jika belum klik peta untuk menyesuaikan.
                   </p>
                </div>
             </div>

             <div className="w-full h-[200px] relative rounded-xl overflow-hidden border border-gray-200">
                <MapComponent 
                   lat={formData.lat} 
                   lng={formData.lng} 
                   onChange={(lat, lng) => setFormData(prev => ({ ...prev, lat, lng }))} 
                />
             </div>

             <button 
               type="button"
               onClick={handleGetCurrentLocation}
               disabled={isDetecting}
               className="w-full py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-bold text-gray-600 hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
             >
                <MapPin size={16} className="text-[#EE4D2D]" />
                {isDetecting ? 'Mendeteksi...' : 'Gunakan Lokasi Saat Ini'}
             </button>
          </div>

          {/* Tandai Sebagai Area */}
          <div>
            <label className="block text-[13px] font-bold text-gray-700 mb-2.5">Tandai Sebagai:</label>
            <div className="flex gap-3">
              {['Rumah', 'Kantor'].map(label => (
                <button 
                  key={label}
                  type="button"
                  onClick={() => setFormData({...formData, label})}
                  className={`px-6 py-2 rounded-lg text-[13px] font-bold border transition-all ${formData.label === label ? 'border-[#8B5A2B] bg-[#8B5A2B]/10 text-black shadow-sm' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Set Default Toggle */}
          <div className="flex items-center gap-3 pt-2">
            <input 
               type="checkbox" 
               id="is_default"
               checked={formData.is_default}
               onChange={(e) => setFormData({...formData, is_default: e.target.checked})}
               className="w-4 h-4 accent-[#8B5A2B]"
            />
            <label htmlFor="is_default" className="text-[13px] font-medium text-gray-600 cursor-pointer select-none">Atur sebagai alamat utama</label>
          </div>

          {/* Modal Footer Buttons */}
          <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-50">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-[14px] transition-all hover:bg-gray-50 active:scale-95"
            >
               Nanti Saja
            </button>
            <button 
              type="submit" 
              disabled={isSaving}
              className="px-10 py-2.5 bg-[#EE4D2D] hover:bg-[#d74426] text-white rounded-xl font-bold text-[14px] transition-all shadow-lg shadow-red-900/10 active:scale-95 disabled:opacity-50"
            >
              {isSaving ? 'Menyimpan...' : 'OK'}
            </button>
          </div>
        </form>
      </div>

      {isPickerOpen && (
         <LocationPicker 
            onClose={() => setIsPickerOpen(false)}
            onSelect={(val) => setFormData({...formData, province_city_district: val})}
         />
      )}
    </div>
  );
}
