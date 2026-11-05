"use client";

import React, { useState } from 'react';
import axios from 'axios';
import { Upload, X } from 'lucide-react';
import Swal from 'sweetalert2';

const API_URL = 'http://localhost:5000/api/expenses';

export default function ExpenseModal({ expense, onClose, onSuccess, isApiConnected }) {
  const [formData, setFormData] = useState({
    tanggal: expense ? new Date(expense.tanggal).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
    kategori: expense ? expense.kategori : '',
    deskripsi: expense ? expense.deskripsi : '',
    nominal: expense ? expense.nominal : '',
    pengguna: expense ? expense.pengguna : 'Owner',
    lampiran: expense ? expense.lampiran : ''
  });

  const [attachmentPreview, setAttachmentPreview] = useState(expense?.lampiran || '');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachmentPreview(reader.result);
        setFormData(prev => ({ ...prev, lampiran: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isApiConnected) {
          if (expense && expense.id) {
            await axios.put(`${API_URL}/${expense.id}`, formData);
          } else {
            await axios.post(API_URL, formData);
          }
      }
      await Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'Data pengeluaran berhasil disimpan.',
        timer: 1500,
        showConfirmButton: false
      });
      onSuccess(formData);
    } catch (error) {
      console.error("Error saving expense:", error);
      Swal.fire({
        icon: 'error',
        title: 'Gagal!',
        text: 'Terjadi kesalahan saat menyimpan pengeluaran.'
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
          <h2 className="text-[18px] font-bold text-gray-900">{expense ? 'Edit Pengeluaran' : 'Tambah Pengeluaran Baru'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[85vh] custom-scrollbar">
          <p className="text-[13px] text-gray-500 -mt-2">Catat pengeluaran operasional toko</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Tanggal <span className="text-red-500">*</span></label>
              <input 
                type="datetime-local" 
                required 
                value={formData.tanggal} 
                onChange={(e) => setFormData({...formData, tanggal: e.target.value})} 
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-[14px] focus:border-[#5A7CFF] focus:ring-2 focus:ring-[#5A7CFF]/20 outline-none text-gray-800 transition-all bg-gray-50/30" 
              />
            </div>

            <div>
              <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Kategori <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                required 
                value={formData.kategori} 
                onChange={(e) => setFormData({...formData, kategori: e.target.value})} 
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-[14px] focus:border-[#5A7CFF] focus:ring-2 focus:ring-[#5A7CFF]/20 outline-none text-gray-800 transition-all bg-gray-50/30" 
                placeholder="Contoh: Listrik, Gaji, dll"
              />
            </div>

            <div>
              <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Deskripsi (opsional)</label>
              <textarea 
                rows={3} 
                value={formData.deskripsi} 
                onChange={(e) => setFormData({...formData, deskripsi: e.target.value})} 
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-[14px] focus:border-[#5A7CFF] focus:ring-2 focus:ring-[#5A7CFF]/20 outline-none text-gray-800 resize-none transition-all bg-gray-50/30" 
                placeholder="Deskripsi singkat barang (opsional)" 
              />
            </div>

            <div>
              <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Nominal pengeluaran (Rp) <span className="text-red-500">*</span></label>
              <div className="relative">
                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">Rp</span>
                 <input 
                   type="number" 
                   required 
                   min="0" 
                   value={formData.nominal} 
                   onChange={(e) => setFormData({...formData, nominal: Number(e.target.value)})} 
                   className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-2.5 text-[14px] focus:border-[#5A7CFF] focus:ring-2 focus:ring-[#5A7CFF]/20 outline-none text-gray-800 font-bold transition-all bg-gray-50/30" 
                   placeholder="0" 
                 />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Lampiran (opsional)</label>
              <label className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-[#5A7CFF] transition-all text-gray-400 relative group min-h-[100px]">
                 {attachmentPreview ? (
                    <div className="w-full h-full flex flex-col items-center">
                       {attachmentPreview.startsWith('data:image') ? (
                         <img src={attachmentPreview} className="max-h-[80px] rounded-lg object-contain mb-2" alt="Lampiran" />
                       ) : (
                         <div className="flex items-center gap-2 text-[#5A7CFF] mb-2">
                            <Upload size={20} />
                            <span className="text-xs font-bold">File Terlampir</span>
                         </div>
                       )}
                       <span className="text-[10px] font-bold text-[#5A7CFF]">Klik untuk ubah</span>
                    </div>
                 ) : (
                    <>
                       <div className="bg-gray-100 p-3 rounded-full mb-2 group-hover:bg-blue-50 group-hover:text-[#5A7CFF] transition-all">
                          <Upload size={20} strokeWidth={2.5}/>
                       </div>
                       <div className="text-center">
                          <p className="text-[12px] font-bold text-gray-700">Klik untuk upload</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">Format: JPG, PNG, atau PDF. Maks 2MB</p>
                       </div>
                    </>
                 )}
                 <input type="file" className="hidden" onChange={handleFileChange} />
              </label>
            </div>
          </div>
          
          {/* Modal Footer Buttons */}
          <div className="mt-8 flex gap-3 pt-4 border-t border-gray-50">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-[14px] transition-all hover:bg-gray-50 active:scale-95"
            >
               Batal
            </button>
            <button 
              type="submit" 
              className="flex-1 py-3 bg-[#1A4594] hover:bg-[#123675] text-white rounded-xl font-bold text-[14px] transition-all shadow-lg shadow-blue-900/20 active:scale-95"
            >
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
