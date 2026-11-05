"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, MapPin, Phone, CheckCircle, Navigation, Truck, RefreshCw, Clock } from 'lucide-react';
import Swal from 'sweetalert2';

export default function KurirDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/orders');
      const deliveryOrders = res.data.filter(o => 
        ['Kirim dari kedai', 'Kirim ke Rumah'].includes(o.metode_pengiriman) && 
        ['Pending', 'Diproses', 'Dikirim'].includes(o.status)
      );
      setOrders(deliveryOrders);
    } catch (error) {
      console.error("Gagal mengambil data pesanan:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000); 
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (id, newStatus) => {
    try {
      await axios.put(`http://localhost:5000/api/orders/${id}`, { status: newStatus });
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `Status diperbarui: ${newStatus}`,
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
      });
      fetchOrders();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: 'Tidak dapat memperbarui status pesanan.',
      });
    }
  };

  const handleAcceptOrder = (id) => {
    Swal.fire({
      title: 'Terima & Proses?',
      text: "Anda akan mengambil pesanan ini dan menyiapkannya?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#9ca3af',
      confirmButtonText: 'Ya, Terima!',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) updateStatus(id, 'Diproses');
    });
  };

  const handleStartDelivery = (id) => {
    Swal.fire({
      title: 'Mulai Pengiriman?',
      text: "Anda yakin akan mengantar pesanan ini sekarang?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ea580c',
      cancelButtonColor: '#9ca3af',
      confirmButtonText: 'Ya, Antar!',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) updateStatus(id, 'Dikirim');
    });
  };

  const handleFinishDelivery = (id) => {
    Swal.fire({
      title: 'Pesanan Selesai?',
      text: "Pastikan barang sudah diterima oleh pelanggan dengan baik.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#9ca3af',
      confirmButtonText: 'Selesaikan Pesanan',
      cancelButtonText: 'Belum'
    }).then((result) => {
      if (result.isConfirmed) updateStatus(id, 'Selesai');
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F4F0EA] flex items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-[#FF5C00] selection:text-white">
        <div className="w-full max-w-[400px] bg-[#C9E265] rounded-[32px] p-8 shadow-[12px_12px_0_#1C120C] relative z-10 border-4 border-[#1C120C]">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-[#FF5C00] border-4 border-[#1C120C] shadow-[4px_4px_0_#1C120C] rounded-full flex items-center justify-center mx-auto mb-4 transform -rotate-6">
              <Truck size={40} className="text-white" strokeWidth={2.5} />
            </div>
            <h2 className="text-[32px] font-black text-[#1C120C] tracking-tighter uppercase leading-none">Kurir Login</h2>
            <p className="text-[#1C120C]/70 mt-2 text-[12px] font-black uppercase tracking-widest">Akses kurir khusus ngab</p>
          </div>
          <div className="space-y-5">
            <div>
              <label className="text-[12px] font-black text-[#1C120C] uppercase tracking-widest ml-1 mb-2 block">Password Lo</label>
              <input 
                type="password" 
                placeholder="PASSWORD..." 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (password === 'kurir123') setIsAuthenticated(true);
                    else Swal.fire({ icon: 'error', title: 'Akses Ditolak', text: 'Password salah bang!' });
                  }
                }}
                className="w-full bg-white border-4 border-[#1C120C] text-[#1C120C] font-black rounded-2xl px-5 py-4 outline-none focus:shadow-[6px_6px_0_#1C120C] focus:-translate-y-1 transition-all text-sm uppercase placeholder:text-[#1C120C]/30"
              />
            </div>
            <button 
              onClick={() => {
                if (password === 'kurir123') setIsAuthenticated(true);
                else Swal.fire({ icon: 'error', title: 'Akses Ditolak', text: 'Password salah bang!' });
              }}
              className="w-full bg-[#1C120C] text-[#F4F0EA] font-black text-[15px] uppercase tracking-widest px-6 py-4 rounded-full hover:bg-[#FF5C00] hover:text-white active:translate-y-2 active:shadow-none transition-all shadow-[6px_6px_0_#1C120C] border-2 border-[#1C120C] mt-2"
            >
              Gas Masuk!
            </button>
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full bg-white text-[#1C120C] font-black text-[13px] uppercase tracking-widest px-6 py-3.5 rounded-full hover:bg-[#F4F0EA] active:translate-y-1 active:shadow-none transition-all border-2 border-[#1C120C] shadow-[4px_4px_0_#1C120C]"
            >
              Balik
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F0EA] flex justify-center font-sans selection:bg-[#FF5C00] selection:text-white">
      {/* Mobile Wrapper - Brutalist Look */}
      <div className="w-full max-w-md bg-[#F4F0EA] min-h-screen relative overflow-x-hidden flex flex-col border-x-4 border-transparent sm:border-[#1C120C]">
        
        {/* Header (App Bar) */}
        <div className="bg-[#FF5C00] border-b-4 border-[#1C120C] text-[#F4F0EA] px-6 py-5 sticky top-0 z-20 shadow-[0_8px_0_#1C120C] rounded-b-[24px] mx-[-4px] sm:mx-0">
          <div className="flex justify-between items-center mb-1">
            <h1 className="font-black text-2xl flex items-center gap-3 tracking-tighter uppercase">
               <div className="w-10 h-10 bg-[#C9E265] border-2 border-[#1C120C] shadow-[2px_2px_0_#1C120C] rounded-full flex items-center justify-center text-[#1C120C] transform -rotate-12">
                  <Truck size={20} strokeWidth={3} />
               </div>
               Kurir App
            </h1>
            <button onClick={fetchOrders} className="w-10 h-10 bg-white border-2 border-[#1C120C] shadow-[2px_2px_0_#1C120C] text-[#1C120C] flex items-center justify-center rounded-full transition-transform active:translate-y-1 active:shadow-none hover:bg-[#C9E265]">
               <RefreshCw size={18} strokeWidth={3} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
          <p className="text-white text-[10px] font-black ml-[52px] uppercase tracking-widest opacity-90">Gombengsari Coffee Squad</p>
        </div>

        {/* Status Tracker */}
        <div className="mx-5 mt-10 bg-[#C9E265] px-6 py-5 rounded-[24px] border-4 border-[#1C120C] shadow-[8px_8px_0_#1C120C] flex justify-between items-center transform rotate-1">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white border-2 border-[#1C120C] flex items-center justify-center text-[#1C120C] shadow-[2px_2px_0_#1C120C]">
                 <Package size={20} strokeWidth={3} />
              </div>
              <span className="text-[13px] font-black text-[#1C120C] uppercase tracking-widest">Total Antaran</span>
           </div>
           <span className="bg-[#1C120C] text-[#C9E265] font-black text-lg px-4 py-1.5 rounded-full border-2 border-white shadow-[2px_2px_0_#1C120C]">{orders.length}</span>
        </div>

        {/* Order List */}
        <div className="flex-1 overflow-y-auto p-5 mt-4 space-y-6 pb-24 bg-transparent custom-scrollbar">
          {loading && orders.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-64 text-[#1C120C] animate-pulse">
               <RefreshCw size={40} className="animate-spin mb-4 text-[#FF5C00]" strokeWidth={3} />
               <p className="text-[14px] font-black uppercase tracking-widest">Sync data bang...</p>
             </div>
          ) : orders.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-64 text-[#1C120C]/50 animate-in fade-in duration-700">
               <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 border-4 border-[#1C120C] shadow-[4px_4px_0_#1C120C] transform -rotate-6">
                 <CheckCircle size={40} className="text-[#C9E265]" strokeWidth={3} />
               </div>
               <p className="text-[18px] font-black text-[#1C120C] uppercase tracking-widest text-center">Kerjaan Beres!</p>
               <p className="text-[12px] font-bold mt-2 text-[#1C120C]/70">Waktunya ngopi bre ☕</p>
             </div>
          ) : (
            orders.map((order, index) => {
               let parsedItems = [];
               try { parsedItems = JSON.parse(order.pesanan); } catch(e) {}
               
               const isSending = order.status === 'Dikirim';
               const isPending = order.status === 'Pending';
               
               return (
                 <div 
                   key={order.id} 
                   className={`bg-white rounded-[32px] border-4 border-[#1C120C] shadow-[8px_8px_0_#1C120C] relative overflow-hidden group transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[12px_12px_0_#1C120C]`}
                   style={{ animationDelay: `${index * 100}ms` }}
                 >
                   {/* Top Accent Line */}
                   <div className={`h-3 w-full border-b-4 border-[#1C120C] ${isSending ? 'bg-[#FF5C00]' : isPending ? 'bg-[#C9E265]' : 'bg-blue-400'}`}></div>

                   {/* Card Header */}
                   <div className="px-6 pt-5 pb-4 flex justify-between items-center border-b-4 border-[#1C120C]/10 dashed">
                     <div className="flex items-center gap-2 text-[#1C120C]">
                        <Clock size={16} strokeWidth={3} />
                        <span className="text-[12px] font-black uppercase tracking-widest">#{order.id.toString().padStart(4, '0')}</span>
                     </div>
                     <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider border-2 border-[#1C120C] shadow-[2px_2px_0_#1C120C]
                        ${isSending ? 'bg-[#FF5C00] text-white' : 
                          isPending ? 'bg-[#C9E265] text-[#1C120C]' : 
                          'bg-blue-400 text-white'}`}>
                       {isPending ? 'WAITING' : order.status}
                     </span>
                   </div>

                   {/* Card Body */}
                   <div className="p-6 space-y-5">
                     <div>
                       <h3 className="font-black text-[#1C120C] text-2xl mb-2 tracking-tighter uppercase leading-none">{order.nama_pelanggan}</h3>
                       <div className="flex items-start gap-3 bg-[#F4F0EA] p-4 rounded-[16px] border-4 border-[#1C120C] shadow-[4px_4px_0_#1C120C] mt-4 transform -rotate-1">
                         <MapPin size={20} className="text-[#FF5C00] shrink-0 mt-0.5" strokeWidth={3} /> 
                         <span className="text-[13px] font-black text-[#1C120C] leading-tight uppercase">{order.alamat}</span>
                       </div>
                     </div>

                     <div className="bg-white border-4 border-[#1C120C] p-5 rounded-[20px] shadow-[4px_4px_0_#1C120C]">
                       <p className="text-[11px] font-black text-[#1C120C]/60 mb-4 uppercase tracking-widest flex items-center gap-2">
                          <Package size={14} strokeWidth={3} /> Orderan:
                       </p>
                       <ul className="space-y-3">
                         {parsedItems.map((item, idx) => (
                           <li key={idx} className="flex justify-between items-start pb-3 border-b-2 border-[#1C120C]/10 last:border-0 last:pb-0">
                             <span className="font-black text-[#1C120C] text-[14px] uppercase leading-tight pr-2">
                               <span className="text-[#FF5C00] bg-[#FF5C00]/10 px-1 rounded mr-1">{item.jumlah}x</span> 
                               {item.nama || item.nama_produk}
                             </span>
                             <span className="font-black text-[#1C120C]/60 text-[12px] whitespace-nowrap">Rp {(item.harga * item.jumlah).toLocaleString('id-ID')}</span>
                           </li>
                         ))}
                       </ul>
                       <div className="mt-5 pt-4 border-t-4 border-[#1C120C] flex justify-between items-end">
                         <div>
                            <p className="text-[10px] text-[#1C120C]/60 font-black uppercase tracking-widest mb-2">Tipe Bayar</p>
                            <span className={`text-[11px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider border-2 border-[#1C120C] ${order.metode_pembayaran === 'COD' ? 'bg-[#FF5C00] text-white' : 'bg-[#C9E265] text-[#1C120C]'}`}>
                              {order.metode_pembayaran === 'COD' ? 'Tagih COD' : order.metode_pembayaran}
                            </span>
                         </div>
                         <div className="text-right">
                            <p className="text-[10px] text-[#1C120C]/60 font-black uppercase tracking-widest mb-1">Total</p>
                            <span className="text-[#1C120C] font-black text-xl leading-none block">Rp {Number(order.total_harga).toLocaleString('id-ID')}</span>
                         </div>
                       </div>
                     </div>
                     
                     {/* Action Buttons */}
                     <div className="flex gap-3 pt-2">
                        <button onClick={() => {
                           let waNum = order.no_wa || "";
                           if (waNum.startsWith("0")) waNum = "62" + waNum.substring(1);
                           else if (waNum.startsWith("+")) waNum = waNum.substring(1);
                           const text = `Halo ${order.nama_pelanggan}, pesanan Gombengsari Coffee lo udah OTW nih. Ditunggu ya ngab! 🔥`;
                           window.open(`https://wa.me/${waNum}?text=${encodeURIComponent(text)}`, '_blank');
                        }} className="flex-1 bg-[#C9E265] text-[#1C120C] py-4 rounded-[16px] flex items-center justify-center gap-2 font-black text-[12px] uppercase tracking-widest border-2 border-[#1C120C] shadow-[4px_4px_0_#1C120C] active:translate-y-1 active:shadow-none hover:bg-[#FF5C00] hover:text-white transition-all">
                          <Phone size={18} strokeWidth={3} /> Chat
                        </button>
                        <button onClick={() => {
                           let cleanAddress = order.alamat ? order.alamat.replace(/\(.*?\)/g, '').trim() : '';
                           if (!cleanAddress.toLowerCase().includes('banyuwangi')) {
                              cleanAddress += ', Banyuwangi';
                           }
                           window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(cleanAddress)}`, '_blank');
                        }} className="flex-1 bg-white text-[#1C120C] py-4 rounded-[16px] flex items-center justify-center gap-2 font-black text-[12px] uppercase tracking-widest border-2 border-[#1C120C] shadow-[4px_4px_0_#1C120C] active:translate-y-1 active:shadow-none hover:bg-[#1C120C] hover:text-white transition-all">
                          <Navigation size={18} strokeWidth={3} /> Maps
                        </button>
                     </div>

                     {/* Status Action */}
                     <div className="pt-2">
                        {isSending ? (
                           <button onClick={() => handleFinishDelivery(order.id)} className="w-full bg-[#1C120C] text-[#C9E265] font-black py-5 rounded-[20px] flex items-center justify-center gap-3 active:translate-y-2 active:shadow-none shadow-[6px_6px_0_#C9E265] border-2 border-[#1C120C] transition-all text-[14px] uppercase tracking-widest hover:bg-[#FF5C00] hover:text-white hover:shadow-[6px_6px_0_#1C120C]">
                             <CheckCircle size={20} strokeWidth={3} /> Order Selesai!
                           </button>
                        ) : isPending ? (
                           <button onClick={() => handleAcceptOrder(order.id)} className="w-full bg-[#C9E265] text-[#1C120C] font-black py-5 rounded-[20px] flex items-center justify-center gap-3 active:translate-y-2 active:shadow-none shadow-[6px_6px_0_#1C120C] border-2 border-[#1C120C] transition-all text-[14px] uppercase tracking-widest hover:bg-[#FF5C00] hover:text-white">
                             <CheckCircle size={20} strokeWidth={3} /> Gas Proses!
                           </button>
                        ) : (
                           <button onClick={() => handleStartDelivery(order.id)} className="w-full bg-[#FF5C00] text-white font-black py-5 rounded-[20px] flex items-center justify-center gap-3 active:translate-y-2 active:shadow-none shadow-[6px_6px_0_#1C120C] border-2 border-[#1C120C] transition-all text-[14px] uppercase tracking-widest hover:bg-[#1C120C]">
                             <Truck size={20} strokeWidth={3} /> Mulai Antar!
                           </button>
                        )}
                     </div>
                   </div>
                 </div>
               )
            })
          )}
        </div>

      </div>
    </div>
  );
}
