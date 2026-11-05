"use client";

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { ShoppingCart, Plus, Minus, Trash2, Printer, Search, ArrowRight, UserCircle, Package, Pencil, RefreshCw } from 'lucide-react';
import Swal from 'sweetalert2';
import ProductModal from '../../components/ProductModal';

export default function KasirDashboard() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Checkout States
  const [customerName, setCustomerName] = useState('Pelanggan Offline');
  const [uangPelanggan, setUangPelanggan] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');

  // Tabs and Orders State
  const [activeTab, setActiveTab] = useState('pos'); // pos, online, history
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // Polling for new orders
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/orders');
      setOrders(res.data);
    } catch (error) {
      console.error("Gagal mengambil data pesanan:", error);
    }
  };

  const handleUpdateOrderStatus = async (id, newStatus) => {
    try {
      await axios.put(`http://localhost:5000/api/orders/${id}`, { status: newStatus });
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Status Diperbarui',
        showConfirmButton: false,
        timer: 1500
      });
      fetchOrders();
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal mengupdate status pesanan' });
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/products');
      // Fix: Ensure 'id' exists because backend returns '_id' instead of 'id'
      const formattedProducts = res.data.map(p => ({ ...p, id: p.id || p._id }));
      setProducts(formattedProducts);
    } catch (error) {
      console.error("Gagal mengambil data produk:", error);
    }
    setLoading(false);
  };

  const handleDeleteProduct = async (id, nama) => {
    Swal.fire({
      title: 'Hapus Barang?',
      html: `Apakah Anda yakin ingin menghapus <b>${nama}</b> secara permanen?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ea580c',
      cancelButtonText: 'Batal',
      confirmButtonText: 'Ya, Hapus!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`http://localhost:5000/api/products/${id}`);
          Swal.fire('Terhapus!', 'Barang telah dihapus.', 'success');
          fetchProducts();
        } catch (error) {
          Swal.fire('Gagal!', 'Terjadi kesalahan saat menghapus barang.', 'error');
        }
      }
    });
  };

  const filteredProducts = products.filter(p => p.nama.toLowerCase().includes(search.toLowerCase()));

  const addToCart = (product) => {
    if (product.jumlah_stok <= 0) {
      Swal.fire({ icon: 'error', title: 'Stok Habis', text: 'Produk ini sudah tidak tersedia.', timer: 1500 });
      return;
    }
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      if (existing.qty >= product.jumlah_stok) {
        Swal.fire({ icon: 'warning', title: 'Batas Stok', text: 'Melebihi stok yang ada.', timer: 1500 });
        return;
      }
      setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const updateQty = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        if (newQty > item.jumlah_stok) {
           Swal.fire({ icon: 'warning', title: 'Batas Stok', text: 'Melebihi stok.', timer: 1000 });
           return item;
        }
        return { ...item, qty: newQty };
      }
      return item;
    }).filter(item => item.qty > 0));
  };

  const removeCartItem = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const totalBelanja = useMemo(() => cart.reduce((acc, item) => acc + (item.harga * item.qty), 0), [cart]);
  const uangInput = parseInt(uangPelanggan.replace(/[^0-9]/g, '')) || 0;
  const kembalian = paymentMethod === 'QRIS' ? 0 : (uangInput - totalBelanja);
  const isCukup = paymentMethod === 'QRIS' ? true : uangInput >= totalBelanja;

  const handleFormatUang = (e) => {
    let val = e.target.value.replace(/[^0-9]/g, '');
    if (val) {
      val = parseInt(val).toLocaleString('id-ID');
    }
    setUangPelanggan(val);
  };

  const setUangPas = () => setUangPelanggan(totalBelanja.toLocaleString('id-ID'));

  const handleCheckout = async () => {
    if (cart.length === 0) return Swal.fire({ icon: 'warning', title: 'Keranjang Kosong!' });
    if (!isCukup) return Swal.fire({ icon: 'error', title: 'Uang Kurang!', text: 'Nominal uang pelanggan kurang dari total belanja.' });

    Swal.fire({
      title: 'Selesaikan Transaksi?',
      html: `Metode: <b>${paymentMethod}</b><br/>Total: <b>Rp ${totalBelanja.toLocaleString('id-ID')}</b>${paymentMethod === 'COD' ? `<br/>Kembalian: <b>Rp ${kembalian.toLocaleString('id-ID')}</b>` : ''}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ea580c',
      cancelButtonText: 'Batal',
      confirmButtonText: 'Ya, Bayar Sekarang'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const pesananFormat = cart.map(item => ({
            id: item.id,
            nama: item.nama,
            harga: item.harga,
            jumlah: item.qty
          }));

          const payload = {
            nama_pelanggan: customerName || 'Pelanggan Offline',
            no_wa: '080000000000', // Dummy untuk offline
            alamat: 'Pembelian di Kedai (Offline)',
            pesanan: pesananFormat,
            total_harga: totalBelanja,
            metode_pembayaran: paymentMethod === 'COD' ? 'Tunai' : 'QRIS',
            metode_pengiriman: 'Ambil Sendiri'
          };

          const res = await axios.post('http://localhost:5000/api/orders', payload);
          // Auto set status to selesai
          await axios.put(`http://localhost:5000/api/orders/${res.data.id}`, { status: 'Selesai' });

          Swal.fire({
            icon: 'success',
            title: 'Transaksi Berhasil!',
            html: paymentMethod === 'COD' ? `Kembalian pelanggan: <br/><b style="font-size:24px">Rp ${kembalian.toLocaleString('id-ID')}</b>` : 'Pembayaran QRIS Berhasil!',
            confirmButtonColor: '#ea580c'
          });

          // Reset Kasir
          setCart([]);
          setUangPelanggan('');
          setCustomerName('Pelanggan Offline');
          fetchProducts(); // Refresh stok
        } catch (error) {
          Swal.fire({ icon: 'error', title: 'Gagal', text: error.message });
        }
      }
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F4F0EA] flex items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-[#FF5C00] selection:text-white">
        <div className="w-full max-w-[400px] bg-[#C9E265] rounded-[32px] p-8 shadow-[12px_12px_0_#1C120C] relative z-10 border-4 border-[#1C120C]">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-[#FF5C00] border-4 border-[#1C120C] shadow-[4px_4px_0_#1C120C] rounded-full flex items-center justify-center mx-auto mb-4 transform rotate-6">
              <ShoppingCart size={40} className="text-white" strokeWidth={2.5} />
            </div>
            <h2 className="text-[32px] font-black text-[#1C120C] tracking-tighter uppercase leading-none">Kasir Login</h2>
            <p className="text-[#1C120C]/70 mt-2 text-[12px] font-black uppercase tracking-widest">Akses kasir khusus ngab</p>
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
                    if (password === 'kasir123') setIsAuthenticated(true);
                    else Swal.fire({ icon: 'error', title: 'Akses Ditolak', text: 'Password salah bang!' });
                  }
                }}
                className="w-full bg-white border-4 border-[#1C120C] text-[#1C120C] font-black rounded-2xl px-5 py-4 outline-none focus:shadow-[6px_6px_0_#1C120C] focus:-translate-y-1 transition-all text-sm uppercase placeholder:text-[#1C120C]/30"
              />
            </div>
            <button 
              onClick={() => {
                if (password === 'kasir123') setIsAuthenticated(true);
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
    <div className="min-h-screen bg-[#F4F0EA] flex font-sans selection:bg-[#FF5C00] selection:text-white">
      {/* Kasir Sidebar */}
      <aside className="w-[90px] bg-white border-r-4 border-[#1C120C] shadow-[4px_0_0_#1C120C] flex flex-col items-center py-6 z-20 shrink-0">
         <div className="bg-[#FF5C00] text-white p-3 rounded-[16px] mb-8 border-4 border-[#1C120C] shadow-[4px_4px_0_#1C120C] transform -rotate-3">
            <ShoppingCart size={24} strokeWidth={3}/>
         </div>
         <div className="flex flex-col gap-6 w-full items-center">
           <div className="flex flex-col items-center group cursor-pointer w-full" onClick={() => setActiveTab('pos')}>
             <button 
               className={`w-14 h-14 rounded-[20px] border-4 border-[#1C120C] flex flex-col items-center justify-center transition-all shadow-[4px_4px_0_#1C120C] group-hover:-translate-y-1 group-hover:shadow-[6px_6px_0_#1C120C] ${activeTab === 'pos' ? 'bg-[#FF5C00] text-white' : 'bg-white text-[#1C120C] hover:bg-[#C9E265]'}`} 
               title="Kasir"
             >
                <Plus size={24} strokeWidth={3}/>
             </button>
             <span className="text-[10px] font-black text-[#1C120C] mt-2 text-center leading-tight uppercase tracking-widest">Kasir<br/>Offline</span>
           </div>
           
           <div className="flex flex-col items-center group cursor-pointer w-full relative" onClick={() => setActiveTab('online')}>
             <button 
               className={`w-14 h-14 rounded-[20px] border-4 border-[#1C120C] flex flex-col items-center justify-center transition-all shadow-[4px_4px_0_#1C120C] group-hover:-translate-y-1 group-hover:shadow-[6px_6px_0_#1C120C] ${activeTab === 'online' ? 'bg-[#FF5C00] text-white' : 'bg-white text-[#1C120C] hover:bg-[#C9E265]'}`} 
               title="Pesanan Online"
             >
                <Package size={24} strokeWidth={3}/>
             </button>
             <span className="text-[10px] font-black text-[#1C120C] mt-2 text-center leading-tight uppercase tracking-widest">Pesanan<br/>Online</span>
           </div>

           <div className="flex flex-col items-center group cursor-pointer w-full" onClick={() => setActiveTab('history')}>
             <button 
               className={`w-14 h-14 rounded-[20px] border-4 border-[#1C120C] flex flex-col items-center justify-center transition-all shadow-[4px_4px_0_#1C120C] group-hover:-translate-y-1 group-hover:shadow-[6px_6px_0_#1C120C] ${activeTab === 'history' ? 'bg-[#FF5C00] text-white' : 'bg-white text-[#1C120C] hover:bg-[#C9E265]'}`} 
               title="Riwayat"
             >
                <RefreshCw size={24} strokeWidth={3}/>
             </button>
             <span className="text-[10px] font-black text-[#1C120C] mt-2 text-center leading-tight uppercase tracking-widest">Riwayat<br/>Transaksi</span>
           </div>
         </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Kasir Header */}
        <header className="bg-white px-8 py-5 border-b-4 border-[#1C120C] flex justify-between items-center z-10 sticky top-0 shadow-[0_4px_0_#1C120C]">
          <div className="flex items-center gap-3">
             <div>
                <h1 className="text-2xl font-black text-[#1C120C] tracking-tighter uppercase leading-none mb-1">Kasir / POS</h1>
                <p className="text-[10px] font-black text-[#1C120C]/60 uppercase tracking-widest">Gombengsari Coffee Squad</p>
             </div>
          </div>
          <div className="flex gap-4">
             {activeTab === 'pos' && (
               <button 
                 onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
                 className="bg-[#C9E265] text-[#1C120C] border-4 border-[#1C120C] px-4 py-2 rounded-full font-black text-[13px] uppercase tracking-widest flex items-center gap-2 hover:bg-[#FF5C00] hover:text-white transition-all shadow-[4px_4px_0_#1C120C] active:translate-y-1 active:shadow-none"
               >
                 <Plus size={18} strokeWidth={3} /> Tambah Barang
               </button>
             )}
             <div className="relative group">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1C120C]" size={20} strokeWidth={3} />
               <input type="text" placeholder="Cari kopi..." value={search} onChange={e=>setSearch(e.target.value)} className="bg-[#F4F0EA] border-4 border-[#1C120C] pl-12 pr-5 py-3 rounded-full text-[13px] font-black text-[#1C120C] uppercase placeholder:text-[#1C120C]/40 outline-none w-72 focus:shadow-[4px_4px_0_#1C120C] focus:-translate-y-1 transition-all" />
             </div>
          </div>
        </header>

        {/* Kasir Workspace */}
        {activeTab === 'pos' && (
        <div className="flex-1 flex overflow-hidden">
          
          {/* KIRI: PRODUCT GRID */}
          <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
            {loading ? (
               <div className="flex h-full items-center justify-center flex-col gap-4">
                 <RefreshCw size={48} className="animate-spin text-[#FF5C00]" strokeWidth={3} />
                 <p className="font-black text-[#1C120C] uppercase tracking-widest text-[14px]">Loading Menu...</p>
               </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                 {filteredProducts.map(p => {
                   const stokHabis = p.jumlah_stok <= 0;
                   return (
                     <div key={p.id} className="relative group animate-in fade-in zoom-in-95 duration-500">
                        <button 
                          onClick={() => addToCart(p)}
                          disabled={stokHabis}
                          className={`w-full h-full bg-white rounded-[32px] flex flex-col items-center text-center border-4 transition-all duration-300 overflow-hidden ${stokHabis ? 'opacity-50 grayscale border-[#1C120C]/30 cursor-not-allowed shadow-none' : 'border-[#1C120C] shadow-[8px_8px_0_#1C120C] hover:shadow-[12px_12px_0_#1C120C] hover:-translate-y-2 active:translate-y-0 active:shadow-none'}`}
                        >
                           {/* Gambar Produk - Full Width Top */}
                           <div className="w-full h-36 bg-[#F4F0EA] overflow-hidden border-b-4 border-[#1C120C] relative shrink-0 group-hover:h-36 transition-all duration-500">
                             {p.img ? (
                                <img src={p.img} alt={p.nama} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                             ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#F4F0EA] to-[#E8E0D0]">
                                  <Package className="text-[#1C120C]/15" size={52} strokeWidth={1} />
                                </div>
                             )}
                           </div>
                           {/* Info Produk */}
                           <div className="p-4 flex flex-col items-center w-full">
                             <div className="flex flex-wrap gap-1 justify-center mb-2">
                                {p.kategori && <span className="text-[9px] font-black px-2 py-1 bg-[#1C120C] text-white rounded-md uppercase tracking-wider">{p.kategori}</span>}
                                {p.satuan && <span className="text-[9px] font-black px-2 py-1 bg-white border-2 border-[#1C120C] text-[#1C120C] rounded-md uppercase tracking-wider">{p.satuan}</span>}
                             </div>
                             <h3 className="font-black text-[#1C120C] text-[14px] mb-1.5 leading-tight uppercase line-clamp-2">{p.nama}</h3>
                             <p className="text-[#FF5C00] font-black text-lg mb-3">Rp {p.harga.toLocaleString('id-ID')}</p>
                             <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border-2 border-[#1C120C] shadow-[2px_2px_0_#1C120C] ${stokHabis ? 'bg-red-500 text-white' : 'bg-[#C9E265] text-[#1C120C]'}`}>
                               Stok: {p.jumlah_stok}
                             </span>
                           </div>
                        </button>

                       {/* Edit & Delete Action Buttons (Hover) */}
                       <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none group-hover:pointer-events-auto">
                          <button onClick={(e) => { e.stopPropagation(); setEditingProduct(p); setIsModalOpen(true); }} className="w-10 h-10 bg-blue-400 hover:bg-blue-500 text-white rounded-full flex items-center justify-center border-4 border-[#1C120C] shadow-[4px_4px_0_#1C120C] active:translate-y-1 active:shadow-none transition-all" title="Edit Barang">
                             <Pencil size={16} strokeWidth={3}/>
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteProduct(p.id, p.nama); }} className="w-10 h-10 bg-[#FF5C00] hover:bg-red-600 text-white rounded-full flex items-center justify-center border-4 border-[#1C120C] shadow-[4px_4px_0_#1C120C] active:translate-y-1 active:shadow-none transition-all" title="Hapus Barang">
                             <Trash2 size={16} strokeWidth={3}/>
                          </button>
                       </div>
                     </div>
                   )
                 })}
              </div>
            )}
          </div>

          {/* KANAN: CART / STRUK */}
          <div className="w-[460px] min-w-[460px] bg-[#C9E265] border-l-4 border-[#1C120C] flex flex-col z-10 relative">
             <div className="p-6 border-b-4 border-[#1C120C] bg-white">
               <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1C120C]"><UserCircle size={20} strokeWidth={2.5} /></div>
                  <input 
                    type="text" 
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="Nama Pelanggan..." 
                    className="w-full bg-[#F4F0EA] border-4 border-[#1C120C] text-[#1C120C] font-black text-[13px] uppercase rounded-[20px] pl-12 pr-5 py-3 outline-none focus:shadow-[4px_4px_0_#1C120C] focus:-translate-y-1 transition-all placeholder:text-[#1C120C]/40"
                  />
               </div>
             </div>

             <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
               {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-[#1C120C]/40">
                     <ShoppingCart size={64} className="mb-4 transform -rotate-12" strokeWidth={2} />
                     <p className="font-black uppercase tracking-widest text-[14px]">Keranjang Kosong</p>
                  </div>
               ) : (
                 cart.map(item => (
                   <div key={item.id} className="bg-white border-4 border-[#1C120C] rounded-[24px] p-4 shadow-[4px_4px_0_#1C120C] flex items-center justify-between animate-in slide-in-from-right-4 duration-300">
                     <div className="flex-1 pr-2">
                        <h4 className="font-black text-[#1C120C] text-[13px] leading-tight mb-2 uppercase">{item.nama}</h4>
                        <p className="text-[#FF5C00] font-black text-sm">Rp {item.harga.toLocaleString('id-ID')}</p>
                     </div>
                     <div className="flex items-center gap-3">
                        <div className="flex items-center bg-[#F4F0EA] border-2 border-[#1C120C] rounded-full p-1 gap-2 shadow-[2px_2px_0_#1C120C]">
                          <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 bg-white border-2 border-[#1C120C] rounded-full flex items-center justify-center text-[#1C120C] hover:bg-[#FF5C00] hover:text-white font-black transition-colors"><Minus size={14} strokeWidth={3}/></button>
                          <span className="font-black text-[13px] w-5 text-center text-[#1C120C]">{item.qty}</span>
                          <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 bg-white border-2 border-[#1C120C] rounded-full flex items-center justify-center text-[#1C120C] hover:bg-[#C9E265] font-black transition-colors"><Plus size={14} strokeWidth={3}/></button>
                        </div>
                        <button onClick={() => removeCartItem(item.id)} className="w-9 h-9 bg-white border-2 border-[#1C120C] hover:bg-red-500 hover:text-white text-[#1C120C] flex items-center justify-center rounded-full shadow-[2px_2px_0_#1C120C] transition-colors"><Trash2 size={16} strokeWidth={2.5}/></button>
                     </div>
                   </div>
                 ))
               )}
             </div>

             <div className="bg-[#1C120C] text-[#F4F0EA] p-5 rounded-tl-[40px] border-t-4 border-l-4 border-[#1C120C] shadow-[-8px_-8px_0_#FF5C00]">
                <div className="flex justify-between items-center mb-6">
                   <span className="text-[#F4F0EA]/70 font-black uppercase tracking-widest text-[12px]">Total Belanja</span>
                   <span className="text-[28px] font-black text-[#C9E265]">Rp {totalBelanja.toLocaleString('id-ID')}</span>
                </div>

                {cart.length > 0 && (
                  <>
                    <div className="mb-4">
                       <label className="text-[11px] font-black text-[#F4F0EA]/70 uppercase tracking-widest mb-2 block">Metode Pembayaran</label>
                       <div className="grid grid-cols-2 gap-3">
                          <button onClick={() => setPaymentMethod('COD')} className={`py-3 rounded-[16px] border-4 flex items-center justify-center font-black text-[12px] uppercase tracking-widest transition-all ${paymentMethod === 'COD' ? 'border-[#C9E265] bg-[#C9E265] text-[#1C120C]' : 'border-[#F4F0EA]/20 bg-transparent text-[#F4F0EA]/50'}`}>Tunai/COD</button>
                          <button onClick={() => setPaymentMethod('QRIS')} className={`py-3 rounded-[16px] border-4 flex items-center justify-center font-black text-[12px] uppercase tracking-widest transition-all ${paymentMethod === 'QRIS' ? 'border-[#C9E265] bg-[#C9E265] text-[#1C120C]' : 'border-[#F4F0EA]/20 bg-transparent text-[#F4F0EA]/50'}`}>QRIS</button>
                       </div>
                    </div>

                    {paymentMethod === 'COD' && (
                       <div className="mb-4">
                        <label className="text-[11px] font-black text-[#F4F0EA]/70 uppercase tracking-widest mb-2 block">Uang Pelanggan (Rp)</label>
                        <div className="flex gap-2 items-stretch">
                          <input 
                            type="text" 
                            value={uangPelanggan}
                            onChange={handleFormatUang}
                            placeholder="0"
                            className="flex-1 min-w-0 bg-white border-4 border-[#1C120C] rounded-[16px] px-4 py-3 text-[#1C120C] font-black text-lg outline-none focus:shadow-[4px_4px_0_#FF5C00] transition-all placeholder:text-[#1C120C]/30"
                          />
                          <button onClick={setUangPas} className="shrink-0 bg-[#FF5C00] text-white border-4 border-[#1C120C] px-3 py-2 rounded-[16px] text-[10px] font-black uppercase tracking-wide shadow-[3px_3px_0_#1C120C] active:translate-y-1 active:shadow-none transition-all leading-tight text-center">UANG<br/>PAS</button>
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'COD' && uangInput > 0 && (
                        <div className="flex justify-between items-center mb-4 pb-3 border-b-2 border-[#F4F0EA]/20 border-dashed">
                         <span className="text-[#F4F0EA]/70 font-black uppercase tracking-widest text-[12px]">Kembalian</span>
                          <span className={`text-[20px] font-black ${isCukup ? 'text-[#FF5C00]' : 'text-red-400'}`}>
                           {isCukup ? `Rp ${kembalian.toLocaleString('id-ID')}` : 'Uang Kurang!'}
                         </span>
                       </div>
                    )}
                  </>
                )}

                <div className="flex gap-3 mt-4">
                   <button onClick={() => window.print()} disabled={cart.length === 0} className={`w-16 h-16 border-4 rounded-[20px] flex items-center justify-center transition-all ${cart.length === 0 ? 'bg-[#1C120C] border-[#F4F0EA]/20 text-[#F4F0EA]/40 cursor-not-allowed' : 'bg-white border-[#1C120C] text-[#1C120C] hover:bg-[#FF5C00] hover:text-white shadow-[4px_4px_0_#1C120C] active:translate-y-1 active:shadow-none'}`}><Printer size={24} strokeWidth={2.5}/></button>
                   <button onClick={handleCheckout} disabled={cart.length === 0} className={`flex-1 font-black text-[16px] uppercase tracking-widest rounded-[20px] flex items-center justify-center gap-2 border-4 transition-all shadow-[6px_6px_0_#F4F0EA] ${cart.length === 0 ? 'bg-gray-600 border-gray-700 text-gray-400 cursor-not-allowed shadow-none' : 'bg-white text-[#1C120C] border-[#1C120C] hover:bg-[#C9E265] active:translate-y-2 active:shadow-none'}`}>
                     BAYAR GAS! <ArrowRight size={24} strokeWidth={3}/>
                   </button>
                </div>
             </div>
          </div>
        </div>
        )}

        {/* ONLINE ORDERS TAB */}
        {activeTab === 'online' && (
          <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
            <h2 className="text-xl font-black text-[#1C120C] uppercase mb-6">Pesanan Online (Perlu Diproses)</h2>
            <div className="grid gap-4">
              {orders.filter(o => o.status === 'Pending' || o.status === 'Diproses').length === 0 ? (
                 <div className="bg-white border-4 border-[#1C120C] rounded-[24px] p-8 text-center shadow-[4px_4px_0_#1C120C]">
                    <p className="font-black text-[#1C120C]/60 uppercase tracking-widest">Tidak ada pesanan online saat ini</p>
                 </div>
              ) : (
                orders.filter(o => o.status === 'Pending' || o.status === 'Diproses').map(order => (
                  <div key={order.id} className="bg-white border-4 border-[#1C120C] rounded-[24px] p-6 shadow-[4px_4px_0_#1C120C] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="font-black text-[#1C120C] text-[16px] uppercase">{order.nama_pelanggan}</h3>
                      <p className="text-[12px] font-black text-[#1C120C]/60 uppercase tracking-widest mb-2">Metode: {order.metode_pengiriman} - {order.metode_pembayaran}</p>
                      <div className="bg-[#F4F0EA] border-2 border-[#1C120C] rounded-[12px] p-3 inline-block">
                        <p className="text-[12px] font-bold text-[#1C120C]">{typeof order.pesanan === 'string' ? order.pesanan : JSON.stringify(order.pesanan)}</p>
                      </div>
                      <p className="text-[#FF5C00] font-black text-lg mt-2">Rp {order.total_harga.toLocaleString('id-ID')}</p>
                    </div>
                    <div className="flex flex-col gap-2 min-w-[150px]">
                      <span className={`px-4 py-2 rounded-full border-2 border-[#1C120C] font-black text-center text-[11px] uppercase tracking-widest shadow-[2px_2px_0_#1C120C] ${order.status === 'Pending' ? 'bg-yellow-400' : 'bg-blue-400 text-white'}`}>
                        {order.status}
                      </span>
                      {order.status === 'Pending' && (
                        <button onClick={() => handleUpdateOrderStatus(order.id, 'Diproses')} className="px-4 py-2 bg-[#C9E265] border-2 border-[#1C120C] rounded-full font-black text-[11px] uppercase tracking-widest shadow-[2px_2px_0_#1C120C] hover:bg-[#FF5C00] hover:text-white transition-all">
                          Proses Pesanan
                        </button>
                      )}
                      {order.status === 'Diproses' && (
                        <button onClick={() => handleUpdateOrderStatus(order.id, 'Selesai')} className="px-4 py-2 bg-green-500 text-white border-2 border-[#1C120C] rounded-full font-black text-[11px] uppercase tracking-widest shadow-[2px_2px_0_#1C120C] hover:bg-green-600 transition-all">
                          Selesaikan
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TRANSACTION HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
            <h2 className="text-xl font-black text-[#1C120C] uppercase mb-6">Riwayat Transaksi (Selesai)</h2>
            <div className="grid gap-4">
              {orders.filter(o => o.status === 'Selesai').length === 0 ? (
                 <div className="bg-white border-4 border-[#1C120C] rounded-[24px] p-8 text-center shadow-[4px_4px_0_#1C120C]">
                    <p className="font-black text-[#1C120C]/60 uppercase tracking-widest">Belum ada transaksi selesai</p>
                 </div>
              ) : (
                orders.filter(o => o.status === 'Selesai').map(order => (
                  <div key={order.id} className="bg-white border-4 border-[#1C120C] rounded-[24px] p-6 shadow-[4px_4px_0_#1C120C] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="font-black text-[#1C120C] text-[16px] uppercase">{order.nama_pelanggan}</h3>
                      <p className="text-[12px] font-black text-[#1C120C]/60 uppercase tracking-widest mb-1">Tanggal: {new Date(order.created_at).toLocaleString('id-ID')}</p>
                      <p className="text-[12px] font-black text-[#1C120C]/60 uppercase tracking-widest mb-2">Metode: {order.metode_pengiriman} - {order.metode_pembayaran}</p>
                      <p className="text-[#FF5C00] font-black text-lg mt-2">Rp {order.total_harga.toLocaleString('id-ID')}</p>
                    </div>
                    <div>
                      <span className="px-4 py-2 bg-green-200 border-2 border-green-800 text-green-900 rounded-full font-black text-center text-[11px] uppercase tracking-widest shadow-[2px_2px_0_#1C120C]">
                        Selesai
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      
      {isModalOpen && (
        <ProductModal 
           isOpen={isModalOpen} 
           onClose={() => setIsModalOpen(false)} 
           product={editingProduct} 
           onSuccess={fetchProducts} 
           isApiConnected={true}
        />
      )}

      {/* Hidden Printable Receipt */}
      <div className="hidden print:block fixed inset-0 bg-white p-8 font-mono text-black text-sm z-[9999]">
         <div className="text-center mb-6 border-b-2 border-dashed border-black pb-4">
            <h2 className="font-bold text-2xl mb-1">KEDAI GOMBENGSARI</h2>
            <p className="text-xs">Jl. Lerek Gombengsari, Kalipuro</p>
            <p className="text-xs">Banyuwangi, Jawa Timur</p>
         </div>
         <div className="mb-6 text-xs">
            <p>Kasir     : Admin</p>
            <p>Pelanggan : {customerName || 'Offline'}</p>
            <p>Tanggal   : {new Date().toLocaleString('id-ID')}</p>
            <p>Metode    : {paymentMethod === 'COD' ? 'Tunai' : 'QRIS'}</p>
         </div>
         <table className="w-full mb-6 text-xs">
            <thead>
               <tr className="border-b-2 border-dashed border-black">
                  <th className="text-left pb-2">Item</th>
                  <th className="text-center pb-2">Qty</th>
                  <th className="text-right pb-2">Subtotal</th>
               </tr>
            </thead>
            <tbody>
               {cart.map(item => (
                 <tr key={item.id}>
                   <td className="py-2 pr-2">{item.nama}</td>
                   <td className="text-center py-2">{item.qty}</td>
                   <td className="text-right py-2">Rp {(item.harga * item.qty).toLocaleString('id-ID')}</td>
                 </tr>
               ))}
            </tbody>
         </table>
         <div className="border-t-2 border-dashed border-black pt-4 text-xs">
            <div className="flex justify-between mb-1">
               <span className="font-bold">Total</span>
               <span className="font-bold">Rp {totalBelanja.toLocaleString('id-ID')}</span>
            </div>
            {paymentMethod === 'COD' && (
              <>
                <div className="flex justify-between mb-1">
                   <span>Tunai</span>
                   <span>Rp {uangInput.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                   <span>Kembali</span>
                   <span>Rp {kembalian.toLocaleString('id-ID')}</span>
                </div>
              </>
            )}
         </div>
         <div className="text-center mt-8 text-xs">
            <p className="font-bold mb-1">TERIMA KASIH!</p>
            <p>Kopi Nikmat Harga Bersahabat</p>
         </div>
      </div>
    </div>
  );
}
