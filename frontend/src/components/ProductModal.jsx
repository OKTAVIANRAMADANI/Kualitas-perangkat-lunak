"use client";

import React, { useState } from 'react';
import axios from 'axios';
import { Image as ImageIcon } from 'lucide-react';
import Swal from 'sweetalert2';

const API_URL = 'http://localhost:5000/api/products';

export default function ProductModal({ product, onClose, onSuccess, isApiConnected }) {
  const [formData, setFormData] = useState({
    nama: product ? product.nama : '',
    kode_barang: product?.kode_barang || `BRG-${Math.floor(100 + Math.random() * 900)}`,
    deskripsi: product ? product.deskripsi : '',
    kategori: product ? product.kategori : 'Biji Kopi Sangrai (Roasted)',
    satuan: product ? product.satuan : '',
    harga: product ? product.harga : '',
    jumlah_stok: product ? product.jumlah_stok : '',
    min_stok: product?.min_stok || 10,
    status_aktif: product?.status_aktif !== undefined ? product.status_aktif : true,
    img: product ? product.img : ''
  });

  const [imagePreview, setImagePreview] = useState(product?.img || '');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData(prev => ({ ...prev, img: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isApiConnected) {
          if (product && !String(product._id).startsWith('temp-')) {
            await axios.put(`${API_URL}/${product._id}`, formData);
          } else {
            await axios.post(API_URL, formData);
          }
      }
      await Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'Data barang berhasil disimpan.',
        timer: 1500,
        showConfirmButton: false
      });
      onSuccess(formData);
    } catch (error) {
      console.error("Error saving data:", error);
      Swal.fire({
        icon: 'error',
        title: 'Gagal!',
        text: 'Terjadi kesalahan saat menyimpan data.'
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/40 flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100">
        
        {/* Modal Header */}
        <div className="px-8 py-5 border-b border-gray-100 bg-white">
          <h2 className="text-[20px] font-bold text-black">{product ? 'Edit Barang' : 'Tambah Barang Baru'}</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="px-8 py-4 overflow-y-auto max-h-[80vh] custom-scrollbar">
          <p className="text-[13px] text-gray-800 font-semibold mb-6">Masukan detail barang baru</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-[12px] font-bold text-black mb-1.5">Nama barang baru<span className="text-red-500">*</span></label>
              <input type="text" required value={formData.nama} onChange={(e) => setFormData({...formData, nama: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:border-[#5A7CFF] focus:ring-1 focus:ring-[#5A7CFF] outline-none text-black" placeholder="Contoh : Barang A" />
            </div>

            <div>
              <label className="block text-[12px] font-bold text-black mb-1.5">Kode Barang<span className="text-red-500">*</span></label>
              <input type="text" required value={formData.kode_barang} onChange={(e) => setFormData({...formData, kode_barang: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:border-[#5A7CFF] focus:ring-1 focus:ring-[#5A7CFF] outline-none text-black bg-white" placeholder="Contoh : BRG-0001" />
            </div>

            <div>
              <label className="block text-[12px] font-bold text-black mb-1.5">Deskripsi(operasional)<span className="text-red-500">*</span></label>
              <textarea required rows={4} value={formData.deskripsi} onChange={(e) => setFormData({...formData, deskripsi: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:border-[#5A7CFF] focus:ring-1 focus:ring-[#5A7CFF] outline-none text-black resize-none" placeholder="Deskripsi kan singkat tentang barang." />
            </div>

            <div>
              <label className="block text-[12px] font-bold text-black mb-1.5">Gambar produk(operasional)<span className="text-red-500">*</span></label>
              <label className="border border-gray-300 rounded-md w-[120px] h-[100px] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors text-gray-400 relative overflow-hidden group">
                 {imagePreview ? (
                    <>
                       <img src={imagePreview} className="w-full h-full object-cover group-hover:opacity-60 transition-opacity" alt="Preview" />
                       <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <ImageIcon size={20} className="text-gray-900" />
                          <span className="text-[10px] font-bold text-gray-900 mt-1">Ubah Gambar</span>
                       </div>
                    </>
                 ) : (
                    <>
                       <ImageIcon size={28} strokeWidth={1.5} className="mb-2"/>
                       <span className="text-[10px] font-medium">Klik untuk upload</span>
                    </>
                 )}
                 <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-bold text-black mb-1.5">Kategori<span className="text-red-500">*</span></label>
                <select value={formData.kategori} onChange={(e) => setFormData({...formData, kategori: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-[13px] outline-none bg-white font-medium text-gray-700 cursor-pointer">
                  <option value="" disabled>Pilih Kategori</option>
                  <option value="Biji Kopi Sangrai (Roasted)">Biji Kopi Sangrai (Roasted)</option>
                  <option value="Kopi Bubuk (Ground)">Kopi Bubuk (Ground)</option>
                  <option value="Minuman Siap Saji">Minuman Siap Saji</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-bold text-black mb-1.5">Satuan<span className="text-red-500">*</span></label>
                <select value={formData.satuan} onChange={(e) => {
                  const newSatuan = e.target.value;
                  let newHarga = formData.harga;
                  if (newSatuan === 'Kemasan') newHarga = 20000;
                  else if (newSatuan === 'Sat set/Siap saji') newHarga = 15000;
                  else if (newSatuan === 'Coffee Bag (Biji Sangrai 1kg)') newHarga = 100000;
                  else if (newSatuan === 'Coffee Bag (Bubuk 1kg)') newHarga = 110000;
                  
                  setFormData({...formData, satuan: newSatuan, harga: newHarga});
                }} className="w-full border border-gray-300 rounded-md px-3 py-2 text-[13px] outline-none bg-white font-medium text-gray-700 cursor-pointer">
                  <option value="" disabled>Pilih Satuan</option>
                  <option value="Kemasan">Kemasan</option>
                  <option value="Sat set/Siap saji">Sat set/Siap saji</option>
                  <option value="Coffee Bag (Biji Sangrai 1kg)">Coffee Bag (Biji Sangrai 1kg)</option>
                  <option value="Coffee Bag (Bubuk 1kg)">Coffee Bag (Bubuk 1kg)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-black mb-1.5">Harga Jual(Rp)<span className="text-red-500">*</span></label>
              <input type="number" required min="0" value={formData.harga} onChange={(e) => setFormData({...formData, harga: Number(e.target.value)})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:border-[#5A7CFF] focus:ring-1 focus:ring-[#5A7CFF] outline-none text-black font-semibold" placeholder="Rp 0" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-bold text-black mb-1.5">Stok<span className="text-red-500">*</span></label>
                <input type="number" required min="0" value={formData.jumlah_stok} onChange={(e) => setFormData({...formData, jumlah_stok: Number(e.target.value)})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:border-[#5A7CFF] focus:ring-1 focus:ring-[#5A7CFF] outline-none text-black font-semibold" placeholder="Rp 0" />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-black mb-1.5">Minimum Stok<span className="text-red-500">*</span></label>
                <input type="number" required min="0" value={formData.min_stok} onChange={(e) => setFormData({...formData, min_stok: Number(e.target.value)})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:border-[#5A7CFF] focus:ring-1 focus:ring-[#5A7CFF] outline-none text-black font-semibold" placeholder="Rp 0" />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-black mb-2">Status Aktif</label>
              {/* Fake Toggle Switch */}
              <div 
                 onClick={() => setFormData({...formData, status_aktif: !formData.status_aktif})}
                 className={`w-10 h-5 flex items-center rounded-full p-1 cursor-pointer transition-colors ${formData.status_aktif ? 'bg-[#0B3B8B]' : 'bg-gray-300'}`}>
                 <div className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${formData.status_aktif ? 'translate-x-5' : ''}`}></div>
              </div>
            </div>

          </div>
          
          {/* Modal Footer Buttons */}
          <div className="mt-8 flex justify-between gap-4 pt-2 -mx-2">
            <button type="button" onClick={onClose} className="w-full py-2.5 bg-white border border-[#5A7CFF] text-[#5A7CFF] rounded-md font-bold text-[13px] transition-colors hover:bg-blue-50">
               Batal
            </button>
            <button type="submit" className="w-full py-2.5 bg-[#0B3B8B] hover:bg-blue-900 text-white rounded-md font-bold text-[13px] transition-all">
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
