"use client";

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ShoppingBag, User, Phone, MapPin, Mail, Search, Plus, Trash2, ShoppingCart, MessageCircle, CheckCircle2, Bell, LogOut, Settings, Clock, Menu, X, ArrowDown, Navigation } from 'lucide-react';
import ChatWidget from '../../../components/ChatWidget';
import Swal from 'sweetalert2';

const API_PRODUCTS_URL = 'http://localhost:5000/api/products';
const API_ORDERS_URL = 'http://localhost:5000/api/orders';
const BACKEND_URL = 'http://localhost:5000';

function useIntersectionObserver(options = {}) {
   const [isIntersecting, setIsIntersecting] = useState(false);
   const ref = useRef(null);

   useEffect(() => {
      const observer = new IntersectionObserver(([entry]) => {
         if (entry.isIntersecting) {
            setIsIntersecting(true);
            if (ref.current) observer.unobserve(ref.current);
         }
      }, { threshold: 0.1, ...options });

      if (ref.current) observer.observe(ref.current);
      return () => { if (ref.current) observer.unobserve(ref.current); };
   }, []);
   return [ref, isIntersecting];
}

const FadeIn = ({ children, delay = 0, direction = 'up' }) => {
   const [ref, isVisible] = useIntersectionObserver();
   let startClass = 'opacity-0 translate-y-12';
   if (direction === 'left') startClass = 'opacity-0 translate-x-12';
   if (direction === 'right') startClass = 'opacity-0 -translate-x-12';
   if (direction === 'scale') startClass = 'opacity-0 scale-90';

   return (
      <div
         ref={ref}
         className={`transition-all duration-[1000ms] ease-[cubic-bezier(0.25,0.8,0.25,1)] ${isVisible ? 'opacity-100 translate-x-0 translate-y-0 scale-100' : startClass}`}
         style={{ transitionDelay: `${delay}ms` }}
      >
         {children}
      </div>
   );
};

export default function ShoppingPage() {
   const [products, setProducts] = useState([]);
   const [cart, setCart] = useState([]);
   const [isChatOpen, setIsChatOpen] = useState(false);
   const [hasUnreadChat, setHasUnreadChat] = useState(false);

   const [searchQuery, setSearchQuery] = useState('');
   const [activeCategory, setActiveCategory] = useState('Semua Produk');
   const [customerName, setCustomerName] = useState(''); // Nama Pemesan
   const [customerPhone, setCustomerPhone] = useState(''); // WhatsApp Pelanggan
   const [address, setAddress] = useState(''); // Alamat Lengkap
   const [kecamatan, setKecamatan] = useState('Kalipuro'); // Wilayah Pengiriman
   const [isLocating, setIsLocating] = useState(false);
   const [loading, setLoading] = useState(false);
   const [isSuccess, setIsSuccess] = useState(false);
   const [savedAddresses, setSavedAddresses] = useState([]);

   // Navbar Modals & Interactions states
   const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
   const [isNotifOpen, setIsNotifOpen] = useState(false);
   const [hasUnreadNotif, setHasUnreadNotif] = useState(false);
   const [myOrders, setMyOrders] = useState([]);
   
   // Tracking orders for notifications
   const previousOrdersRef = useRef([]);

   // Payment Modal States
   const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
   const [paymentMethod, setPaymentMethod] = useState('COD');
   const [deliveryMethod, setDeliveryMethod] = useState('Kirim dari kedai');
   const [amountPaid, setAmountPaid] = useState('');
   const [deliveryError, setDeliveryError] = useState('');
   const [buktiPembayaran, setBuktiPembayaran] = useState('');
   const [buktiFile, setBuktiFile] = useState(null);
   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
   const cartRef = useRef(null);

   const fetchProducts = async () => {
      try {
         const res = await axios.get(API_PRODUCTS_URL);
         setProducts(res.data);
      } catch (error) {
         // Dummy data if API fails
         setProducts([
            { _id: '1', nama: 'Kopi Arabika Gombengsari (250g)', kategori: 'Kopi Biji/Bubuk', harga: 45000, jumlah_stok: 100, sku: 'BRG-051', img: 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?w=600&auto=format&fit=crop' },
            { _id: '2', nama: 'Kopi Robusta Gombengsari (250g)', kategori: 'Kopi Biji/Bubuk', harga: 35000, jumlah_stok: 150, sku: 'BRG-052', img: 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=600&auto=format&fit=crop' },
            { _id: '3', nama: 'Kopi Luwak Liar Gombengsari (100g)', kategori: 'Kopi Premium', harga: 150000, jumlah_stok: 30, sku: 'BRG-053', img: 'https://images.unsplash.com/photo-1611162458324-aae1eb4129a4?w=600&auto=format&fit=crop' },
            { _id: '4', nama: 'Espresso Blend Gombengsari (500g)', kategori: 'Kopi Biji/Bubuk', harga: 75000, jumlah_stok: 80, sku: 'BRG-054', img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop' },
            { _id: '5', nama: 'Kopi Susu Gula Aren (Botol 1L)', kategori: 'Minuman Siap Saji', harga: 65000, jumlah_stok: 50, sku: 'BRG-058', img: 'https://images.unsplash.com/photo-1579888944111-c917bfd3ebbe?w=600&auto=format&fit=crop' },
            { _id: '6', nama: 'Cold Brew Gombengsari (Botol 250ml)', kategori: 'Minuman Siap Saji', harga: 25000, jumlah_stok: 40, sku: 'BRG-062', img: 'https://images.unsplash.com/photo-1461023058943-0708e5bc3a2d?w=600&auto=format&fit=crop' },
         ]);
      }
   };

   useEffect(() => {
      fetchProducts();
      
      // Auto-refresh data setiap 5 detik agar stok/barang baru langsung muncul
      const interval = setInterval(() => {
         fetchProducts();
      }, 5000);

      // Ambil nama pelanggan yang login (jika ada) dari localStorage:
      const loggedInUser = localStorage.getItem('kopiGombeng_chatName');
      if (loggedInUser) {
         setCustomerName(loggedInUser);
         axios.get(`http://localhost:5000/api/addresses/${loggedInUser}`)
            .then(res => setSavedAddresses(res.data))
            .catch(err => console.error("Gagal load alamat", err));
      }
      
      // Ambil nomor HP jika ada
      const loggedInPhone = localStorage.getItem('kopiGombeng_userPhone');
      if (loggedInPhone) {
         setCustomerPhone(loggedInPhone);
      }

      return () => clearInterval(interval);
   }, []);

   // Real-time Order Tracking Polling
   useEffect(() => {
      let intervalId;
      if (customerName) {
         const fetchMyOrders = async () => {
            try {
               const res = await axios.get(`http://localhost:5000/api/orders/track/${customerName}`);
               const newOrders = res.data;
               
               if (previousOrdersRef.current.length > 0) {
                  let statusChanged = false;
                  newOrders.forEach(no => {
                     const oldOrder = previousOrdersRef.current.find(o => o.id === no.id);
                     if (oldOrder && oldOrder.status !== no.status) {
                        statusChanged = true;
                        
                        let title, text, icon;
                        if (no.status === 'Diproses' || no.status === 'Dikirim') {
                           title = 'Pesanan Diproses! 📦';
                           text = `Pesanan TRX-2026-${String(no.id).padStart(3, '0')} sedang ${no.status === 'Dikirim' ? 'diantar kurir' : 'disiapkan oleh kedai'}.`;
                           icon = 'info';
                        } else if (no.status === 'Selesai') {
                           title = 'Pesanan Lunas & Selesai! ✔️';
                           text = `Pesanan TRX-2026-${String(no.id).padStart(3, '0')} telah berhasil diselesaikan. Terima kasih!`;
                           icon = 'success';
                        } else {
                           title = 'Menunggu Konfirmasi ⏳';
                           text = `Pesanan TRX-2026-${String(no.id).padStart(3, '0')} sedang menunggu antrean.`;
                           icon = 'warning';
                        }

                        Swal.fire({
                           title: title,
                           text: text,
                           icon: icon,
                           confirmButtonColor: '#2A4A8E',
                           confirmButtonText: 'Tutup'
                        });
                     }
                  });
                  if (statusChanged) {
                     setHasUnreadNotif(true);
                  }
               }
               
               previousOrdersRef.current = newOrders;
               setMyOrders(newOrders);
            } catch (e) {}
         };
         fetchMyOrders();
         intervalId = setInterval(fetchMyOrders, 5000);
      }
      return () => clearInterval(intervalId);
   }, [customerName]);

   // Custom Polling Check for Unread Replies from Admin in Chat
   useEffect(() => {
      let tr;
      if (customerName) {
         const checkMyChats = async () => {
            try {
               const res = await axios.get(`http://localhost:5000/api/chats?room=${customerName}`);
               const msgs = res.data;
               if (msgs.length > 0 && msgs[msgs.length - 1].sender === 'Admin Kedai' && !isChatOpen) {
                  setHasUnreadChat(true);
               }
            } catch (e) {}
         };
         tr = setInterval(checkMyChats, 3000);
      }
      return () => clearInterval(tr);
   }, [customerName, isChatOpen]);

   const handleLogout = async () => {
      try {
         if (customerName) {
            await axios.post('http://localhost:5000/api/users/logout', { username: customerName });
         }
      } catch (err) {}
      localStorage.removeItem('kopiGombeng_chatName');
      localStorage.removeItem('kopiGombeng_userPhone');
      window.location.href = '/';
   };

   const handleAddToCart = (product) => {
      setCart(prev => {
         const existing = prev.find(item => item._id === product._id);
         if (existing) {
            if (existing.jumlah >= product.jumlah_stok) return prev;
            return prev.map(item => item._id === product._id ? { ...item, jumlah: item.jumlah + 1 } : item);
         }
         return [...prev, { ...product, jumlah: 1 }];
      });
   };

   const handleRemoveFromCart = (productId) => {
      setCart(prev => {
         const existing = prev.find(item => item._id === productId);
         if (!existing) return prev;
         if (existing.jumlah === 1) return prev.filter(item => item._id !== productId);
         return prev.map(item => item._id === productId ? { ...item, jumlah: item.jumlah - 1 } : item);
      });
   };

   const clearCart = () => setCart([]);

   const CART_TOTAL = cart.reduce((acc, curr) => acc + (curr.harga * curr.jumlah), 0);

   const hasPremiumItem = cart.some(item => 
      String(item.satuan).toLowerCase().includes('ember') || 
      String(item.kategori).toLowerCase().includes('paket') ||
      String(item.nama).toLowerCase().includes('paket')
   );

   const dynamicCategories = ['Semua Produk', ...new Set(products.map(p => p.kategori).filter(Boolean))];

   // Custom Filtering mimicking the categories
   const filteredProducts = products.filter(p => {
      const matchesSearch = p.nama.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'Semua Produk' ||
         (p.kategori && p.kategori.includes(activeCategory)) ||
         p.nama.includes(activeCategory);
      return matchesSearch && matchesCategory;
   });

   // Removed Auto Location feature

   const handleCheckout = async () => {
      setLoading(true);

      try {
         const simplifiedCart = cart.map(item => {
            const { img, ...rest } = item;
            return rest;
         });
         const isFarArea = ['Klatak', 'Bulusan', 'Ketapang', 'Luar Kalipuro'].includes(kecamatan);
         const formattedAddress = isFarArea 
            ? `${address} (Luar Area Kedai - ${kecamatan})` 
            : `${address} (Dekat Kedai - Desa/Kel. ${kecamatan}, Kec. Kalipuro)`;

         // Upload bukti pembayaran file terlebih dahulu jika ada
         let buktiUrl = '';
         if (buktiFile && paymentMethod !== 'COD') {
            const formData = new FormData();
            formData.append('bukti', buktiFile);
            try {
               const uploadRes = await axios.post(`${BACKEND_URL}/api/orders/upload-bukti`, formData, {
                  headers: { 'Content-Type': 'multipart/form-data' }
               });
               buktiUrl = uploadRes.data.url; // e.g. /uploads/bukti-xxx.jpg
            } catch (uploadErr) {
               console.error('Upload gagal:', uploadErr);
               // Fallback ke base64 jika upload gagal
               buktiUrl = buktiPembayaran;
            }
         }

         const orderPayload = {
            nama_pelanggan: customerName, 
            no_wa: customerPhone,
            alamat: formattedAddress,
            pesanan: JSON.stringify(simplifiedCart),
            total_harga: CART_TOTAL,
            metode_pembayaran: paymentMethod,
            metode_pengiriman: deliveryMethod,
            bukti_pembayaran: buktiUrl || null
         };
         await axios.post(API_ORDERS_URL, orderPayload);

         // Notifikasi ke WA admin (Redirect pelanggan untuk mengirim pesan ke Admin)
         const waAdmin = "6282338975768"; // Ganti dengan nomor WA admin
         const waText = `Halo Admin, ada pesanan baru!\n\nNama: ${customerName}\nNo WA: ${customerPhone}\nAlamat: ${formattedAddress}\nMetode Pengiriman: ${deliveryMethod}\nTotal: Rp ${CART_TOTAL.toLocaleString('id-ID')}\n\nMohon segera diproses ya!`;
         window.open(`https://wa.me/${waAdmin}?text=${encodeURIComponent(waText)}`, '_blank');

         setIsSuccess(true);
         setIsPaymentModalOpen(false);
         setCart([]);
         setAddress('');
         setCustomerName('');
         setCustomerPhone('');
         setBuktiPembayaran('');
         setBuktiFile(null);
      } catch (error) {
         console.error("Gagal koneksi, simulasi jalan", error);
         setIsSuccess(true);
         setIsPaymentModalOpen(false);
         setCart([]);
      }
      setLoading(false);
   };

   if (isSuccess) {
      return (
         <div className="min-h-screen bg-[#F4F0EA] flex items-center justify-center p-6 selection:bg-[#FF5C00] selection:text-white">
            <div className="bg-[#C9E265] border-4 border-[#1C120C] p-12 rounded-[40px] shadow-[12px_16px_0_#1C120C] max-w-lg w-full text-center space-y-8 relative overflow-hidden group">
               {/* Decorative stickers */}
               <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#FF5C00] rounded-full border-4 border-[#1C120C] shadow-[4px_4px_0_#1C120C] flex items-center justify-center transform rotate-12 group-hover:rotate-[360deg] transition-transform duration-[2s]">
                  <span className="text-white font-black text-xs uppercase tracking-widest text-center leading-none">ORDER<br/>DONE</span>
               </div>
               
               <div className="flex justify-center relative z-10">
                  <div className="w-24 h-24 bg-white border-4 border-[#1C120C] rounded-full flex items-center justify-center shadow-[4px_4px_0_#1C120C]">
                     <CheckCircle2 size={48} className="text-[#1C120C]" strokeWidth={3} />
                  </div>
               </div>
               
               <div className="relative z-10">
                  <h2 className="text-[32px] md:text-[40px] font-black text-[#1C120C] uppercase tracking-tighter leading-none mb-4 drop-shadow-sm">
                     Pembayaran<br/>Berhasil!
                  </h2>
                  <p className="text-[#1C120C]/80 font-bold text-lg mb-2">Pesanan kopi Anda sedang disiapkan oleh tim. 🔥</p>
                  <p className="text-[#1C120C]/60 font-black text-xs uppercase tracking-widest">Pantau terus notifikasi lo!</p>
               </div>
               
               <button onClick={() => setIsSuccess(false)} className="bg-[#1C120C] text-[#F4F0EA] w-full py-5 rounded-full font-black uppercase tracking-widest text-[14px] shadow-[6px_8px_0_#1C120C] hover:bg-[#FF5C00] hover:text-white transition-colors active:translate-y-2 active:shadow-none border-2 border-[#1C120C] relative z-10">
                  Kembali Belanja
               </button>
            </div>
         </div>
      );
   }

   return (
      <div className="min-h-screen bg-[#F4F0EA] font-sans text-[#1C120C] overflow-x-hidden selection:bg-[#FF5C00] selection:text-white pb-10">
         
         {/* Styles Injeksi untuk Animasi Gen-Z */}
         <style dangerouslySetInnerHTML={{
            __html: `
        .neo-shadow { box-shadow: 4px 6px 0px #1C120C; }
        .neo-shadow:hover { box-shadow: 6px 8px 0px #1C120C; transform: translateY(-2px); }
        .neo-shadow:active { box-shadow: 0px 0px 0px #1C120C; transform: translateY(4px) translateX(2px); }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1C120C; border-radius: 10px; }
      `}} />

         {/* --- FLOATING NAVBAR (Gen-Z Style) --- */}
         <div className="sticky top-4 md:top-6 left-0 right-0 z-[100] flex justify-center px-4 transition-transform duration-500 mb-8 md:mb-12">
            <header className="w-full max-w-[1100px] rounded-full border-[3px] border-[#1C120C] transition-all duration-500 bg-[#F4F0EA]/90 backdrop-blur-xl neo-shadow py-2 md:py-3 flex items-center justify-between px-5 md:px-8">
               <div className="flex items-center gap-3">
                  <button
                     onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                     className="md:hidden text-[#1C120C] hover:text-[#FF5C00] transition-colors bg-white rounded-full p-1 border-2 border-[#1C120C]"
                  >
                     {isMobileMenuOpen ? <X size={24} strokeWidth={3} /> : <Menu size={24} strokeWidth={3} />}
                  </button>
                  <h1 onClick={() => window.location.href = '/'} className="text-xl md:text-2xl font-black tracking-tighter hover:scale-105 transition-transform cursor-pointer flex items-center gap-2 uppercase">
                     <span className="bg-[#FF5C00] text-white px-3 py-1 rounded-full text-sm md:text-lg border-2 border-[#1C120C]">GOMBENG</span> 
                     <span className="hidden sm:inline">COFFEE</span>
                  </h1>
               </div>

               <nav className="hidden md:flex items-center gap-8 text-[14px] font-black uppercase tracking-widest text-[#1C120C]">
                  <a href="/" className="hover:text-[#FF5C00] hover:-translate-y-1 transition-all">Vibes</a>
                  <a href="/pelanggan/shop" className="text-[#FF5C00] border-b-4 border-[#FF5C00] pb-1">Menu & Order</a>
                  <a href="/#about" className="hover:text-[#FF5C00] hover:-translate-y-1 transition-all">Story</a>
                  <a href="/pelanggan/tracking" className="hover:text-[#FF5C00] hover:-translate-y-1 transition-all flex items-center gap-1">Lacak</a>
               </nav>

               <div className="flex items-center gap-3 md:gap-5">

                  {/* Notification Bell */}
                  {customerName && (
                     <div className="relative text-[#1C120C] cursor-pointer group" onClick={() => { setIsNotifOpen(!isNotifOpen); setHasUnreadNotif(false); }}>
                        <div className="w-10 h-10 rounded-full border-2 border-[#1C120C] flex items-center justify-center bg-white hover:bg-[#FF5C00] hover:text-white transition-colors relative shadow-[2px_2px_0_#1C120C]">
                           <Bell size={20} strokeWidth={2.5} />
                           {hasUnreadNotif && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full animate-bounce border-2 border-white" />}
                        </div>

                        {isNotifOpen && (
                           <div className="absolute right-0 top-14 w-[300px] bg-[#F4F0EA] rounded-[24px] border-4 border-[#1C120C] p-5 shadow-[8px_8px_0_#1C120C] transform origin-top-right transition-all text-[#1C120C] z-[120]">
                              <h4 className="font-black text-[15px] uppercase border-b-2 border-[#1C120C] pb-3 mb-3">Pemberitahuan</h4>
                              {myOrders.length === 0 ? (
                                 <p className="text-[12px] font-bold text-gray-500 text-center py-6">Belum ada orderan ngab.</p>
                              ) : (
                                 <div className="space-y-3 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
                                    {myOrders.slice(0, 10).map(o => (
                                       <div key={o.id} className="bg-white p-3 rounded-xl border-2 border-[#1C120C] shadow-[3px_3px_0_#1C120C] relative">
                                          <p className="text-[10px] font-black uppercase text-gray-500 mb-2 flex justify-between">
                                             TRX-2026-{String(o.id).padStart(3, '0')} 
                                             <span className="text-[#1C120C] bg-[#C9E265] px-2 py-0.5 rounded-full border border-[#1C120C]">Rp {(o.total_harga || 0).toLocaleString('id-ID')}</span>
                                          </p>
                                          <p className="text-[13px] font-black leading-tight mb-1">
                                             <span className={o.status === 'Selesai' ? 'text-green-600' : (o.status === 'Diproses' || o.status === 'Dikirim') ? 'text-blue-600' : 'text-[#FF5C00]'}>
                                                {(o.status==='Diproses'||o.status==='Dikirim') ? 'ON PROCESS ' + (o.status==='Dikirim'?'🛵':'☕') : o.status === 'Selesai' ? 'DONE & ENJOY ✔️' : 'WAITING ⏳'}
                                             </span>
                                          </p>
                                          <p className="text-[11px] font-bold text-gray-600 truncate">Via: {o.metode_pengiriman}</p>
                                       </div>
                                    ))}
                                 </div>
                              )}
                           </div>
                        )}
                     </div>
                  )}

                  {/* GPS Tracking Icon */}
                  {customerName && (
                     <button onClick={() => window.location.href = '/pelanggan/tracking'} className="hidden md:flex w-10 h-10 rounded-full border-2 border-[#1C120C] items-center justify-center bg-[#C9E265] hover:bg-[#A9C243] transition-all relative shadow-[2px_2px_0_#1C120C]" title="Lacak Pengiriman">
                        <Navigation size={18} strokeWidth={2.5} className="text-[#1C120C]" />
                        {myOrders.some(o => (o.status === 'Diproses' || o.status === 'Dikirim') && o.metode_pengiriman === 'Kirim dari kedai') && (
                           <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                        )}
                     </button>
                  )}

                  {/* Mobile Quick Cart */}
                  <div 
                     onClick={() => cartRef.current?.scrollIntoView({ behavior: 'smooth' })}
                     className="md:hidden relative w-10 h-10 rounded-full border-2 border-[#1C120C] bg-[#1C120C] text-white flex items-center justify-center hover:bg-[#FF5C00] hover:border-[#FF5C00] transition-transform shadow-[2px_2px_0_#1C120C]"
                  >
                     <ShoppingCart size={18} strokeWidth={2.5} />
                     {cart.length > 0 && <span className="absolute -top-2 -right-2 bg-[#C9E265] text-[#1C120C] text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#1C120C]">{cart.length}</span>}
                  </div>

                  {/* User Profile Dropdown */}
                  <div className="relative">
                     {customerName ? (
                        <>
                           <button onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)} className="w-10 h-10 rounded-full border-2 border-[#1C120C] bg-white flex items-center justify-center text-[#1C120C] hover:bg-[#FF5C00] hover:text-white transition-all shadow-[2px_2px_0_#1C120C] hover:-translate-y-1">
                              <User size={20} strokeWidth={2.5} />
                           </button>
                           {isUserDropdownOpen && (
                              <div className="absolute right-0 top-14 w-[240px] bg-[#F4F0EA] rounded-[20px] border-4 border-[#1C120C] shadow-[8px_8px_0_#1C120C] py-2 text-[#1C120C] z-[120] animate-in fade-in zoom-in-95">
                                 <div className="px-5 py-4 border-b-2 border-[#1C120C] mb-2 bg-white rounded-t-[14px] flex items-center gap-4 mx-1 mt-1">
                                    <div className="w-12 h-12 rounded-full border-2 border-[#1C120C] bg-[#C9E265] text-[#1C120C] flex items-center justify-center font-black text-xl shadow-[2px_2px_0_#1C120C]">{customerName.charAt(0).toUpperCase()}</div>
                                    <div className="flex-1 overflow-hidden">
                                       <p className="text-[10px] uppercase font-black text-[#FF5C00] leading-none mb-1">Hi, Wassup!</p>
                                       <p className="text-[14px] font-black truncate leading-tight">{customerName}</p>
                                    </div>
                                 </div>
                                 <button onClick={() => window.location.href = '/pelanggan/akun'} className="w-full text-left px-6 py-3 text-[13px] font-black uppercase hover:bg-white flex items-center gap-3 transition-colors border-b border-gray-200">
                                    <Settings size={18} strokeWidth={2.5} /> Akun Setup
                                 </button>
                                 <button onClick={handleLogout} className="w-full text-left px-6 py-3 text-[13px] font-black uppercase text-red-600 hover:bg-white flex items-center gap-3 transition-colors rounded-b-[16px]">
                                    <LogOut size={18} strokeWidth={2.5} /> Log Out
                                 </button>
                              </div>
                           )}
                        </>
                     ) : (
                        <a href="/pelanggan/login" className="px-6 py-2.5 rounded-full border-2 border-[#1C120C] font-black text-[13px] uppercase tracking-widest hover:bg-[#1C120C] hover:text-white transition-all neo-shadow bg-white">
                           Login
                        </a>
                     )}
                  </div>
               </div>
            </header>
         </div>

         {/* Mobile Menu Dropdown */}
         {isMobileMenuOpen && (
            <div className="md:hidden fixed top-[80px] left-4 right-4 bg-[#F4F0EA] border-4 border-[#1C120C] rounded-[24px] shadow-[8px_8px_0_#1C120C] z-[90] animate-in slide-in-from-top duration-300">
               <nav className="flex flex-col p-6 gap-2 text-lg font-black uppercase text-[#1C120C]">
                  <a href="/pelanggan" onClick={() => setIsMobileMenuOpen(false)} className="hover:bg-[#FF5C00] hover:text-white transition-colors p-4 rounded-xl border-2 border-transparent hover:border-[#1C120C]">Vibes</a>
                  <a href="/pelanggan/shop" onClick={() => setIsMobileMenuOpen(false)} className="bg-[#FF5C00] text-white p-4 rounded-xl border-2 border-[#1C120C]">Menu</a>
                  <a href="/pelanggan#about" onClick={() => setIsMobileMenuOpen(false)} className="hover:bg-[#FF5C00] hover:text-white transition-colors p-4 rounded-xl border-2 border-transparent hover:border-[#1C120C]">Story</a>
                  <a href="/pelanggan#contact" onClick={() => setIsMobileMenuOpen(false)} className="hover:bg-[#FF5C00] hover:text-white transition-colors p-4 rounded-xl border-2 border-transparent hover:border-[#1C120C]">Holla</a>
               </nav>
            </div>
         )}

         {/* --- MAIN LAYOUT --- */}
         <div className="max-w-[1300px] mx-auto px-6 lg:px-12 py-6">
            
            <FadeIn direction="up">
               <div className="mb-12">
                  <h2 className="text-[40px] md:text-[50px] font-black tracking-tighter uppercase text-[#1C120C] inline-block border-b-8 border-[#FF5C00] pb-2">Menu Kita.</h2>
                  <p className="text-[#1C120C]/60 text-sm font-black tracking-[0.2em] uppercase mt-4">Pick your poison.</p>
               </div>
            </FadeIn>

            <div className="flex flex-col lg:flex-row gap-10">

               {/* KIRI - PRODUCT BROWSER */}
               <div className="w-full lg:w-[68%]">
                  
                  {/* Search Bar (Neo-brutalist) */}
                  <div className="bg-white rounded-[20px] border-4 border-[#1C120C] flex items-center px-5 py-4 shadow-[6px_6px_0_#1C120C] mb-10 transition-transform focus-within:-translate-y-1 focus-within:shadow-[8px_8px_0_#1C120C]">
                     <Search size={24} className="text-[#1C120C] mr-4" strokeWidth={3} />
                     <input
                        type="text"
                        placeholder="Cari menu favorit lo..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full text-lg outline-none font-black text-[#1C120C] placeholder:text-[#1C120C]/30 bg-transparent uppercase"
                     />
                  </div>

                  {/* Filter Chips */}
                  <div className="flex flex-wrap gap-4 mb-12">
                     {dynamicCategories.map((cat) => (
                        <button
                           key={cat}
                           onClick={() => setActiveCategory(cat)}
                           className={`px-6 py-3 rounded-full border-4 text-[13px] font-black uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-[#FF5C00] border-[#1C120C] text-white shadow-[4px_4px_0_#1C120C] transform -translate-y-1' : 'bg-white border-[#1C120C] text-[#1C120C] shadow-[4px_4px_0_#1C120C] hover:bg-[#C9E265] hover:-translate-y-1 hover:shadow-[6px_6px_0_#1C120C]'}`}
                        >
                           {cat}
                        </button>
                     ))}
                  </div>

                  {/* Product Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 pb-20">
                     {filteredProducts.map((p, idx) => (
                        <FadeIn key={idx} delay={idx * 100} direction="up">
                           <div className="bg-white rounded-[32px] overflow-hidden shadow-[8px_8px_0_#1C120C] border-4 border-[#1C120C] flex flex-col group hover:-translate-y-2 hover:shadow-[12px_12px_0_#1C120C] transition-all duration-300">
                              <div className="h-56 bg-gray-100 relative overflow-hidden border-b-4 border-[#1C120C]">
                                 <img
                                    src={p.img || "https://images.unsplash.com/photo-1546069901-d5bfd2cbfb1f?w=600&auto=format&fit=crop"}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                                    alt={p.nama}
                                 />
                                 {/* SKU Badge */}
                                 <div className="absolute top-4 right-4 bg-[#C9E265] text-[#1C120C] font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border-2 border-[#1C120C] shadow-[2px_2px_0_#1C120C] transform rotate-3">
                                    {p.sku || `BRG-05${idx + 1}`}
                                 </div>
                              </div>
                              <div className="p-6 flex-1 flex flex-col relative bg-[#F4F0EA]">
                                 <h3 className="font-black text-xl text-[#1C120C] leading-tight mb-2 uppercase">{p.nama}</h3>
                                 {p.deskripsi && <p className="text-[13px] text-[#1C120C]/70 font-bold mb-4 line-clamp-2">{p.deskripsi}</p>}

                                 <div className="mt-auto flex items-end justify-between pt-4 border-t-2 border-[#1C120C]/20">
                                    <div>
                                       <p className="text-[#FF5C00] font-black text-xl drop-shadow-sm">Rp {p.harga.toLocaleString('id-ID')}</p>
                                       <p className="text-[#1C120C]/50 text-[11px] mt-1 font-black uppercase tracking-widest">Stok: {p.jumlah_stok}</p>
                                    </div>
                                    <button
                                       onClick={() => handleAddToCart(p)}
                                       className="w-12 h-12 bg-[#C9E265] hover:bg-[#FF5C00] hover:text-white text-[#1C120C] flex items-center justify-center rounded-2xl border-4 border-[#1C120C] shadow-[4px_4px_0_#1C120C] transition-all active:translate-y-1 active:shadow-none"
                                    >
                                       <Plus size={24} strokeWidth={3} />
                                    </button>
                                 </div>
                              </div>
                           </div>
                        </FadeIn>
                     ))}
                     {filteredProducts.length === 0 && (
                        <div className="col-span-full text-center py-20">
                           <div className="inline-block bg-white border-4 border-[#1C120C] rounded-[24px] px-8 py-6 shadow-[8px_8px_0_#1C120C] transform -rotate-2">
                              <p className="text-xl font-black uppercase text-[#1C120C]">Waduh, menu nggak ketemu! 🥺</p>
                           </div>
                        </div>
                     )}
                  </div>
               </div>

               {/* KANAN - CART SUMMARY SIDEBAR (Bento Style) */}
               <div ref={cartRef} className="w-full lg:w-[32%] relative">
                  <div className="bg-[#C9E265] rounded-[32px] border-4 border-[#1C120C] p-6 sm:p-8 sticky top-[120px] shadow-[12px_12px_0_#1C120C]">
                     <h3 className="text-2xl font-black mb-6 text-[#1C120C] tracking-tighter uppercase border-b-4 border-[#1C120C] pb-4">Cart Lo.</h3>

                     {/* Cart Box */}
                     <div className="bg-white border-4 border-[#1C120C] rounded-[20px] shadow-[4px_4px_0_#1C120C] w-full min-h-[160px] max-h-[300px] overflow-y-auto mb-8 p-4 flex flex-col custom-scrollbar">
                        {cart.length === 0 ? (
                           <div className="flex-1 flex flex-col items-center justify-center text-[#1C120C]/40 gap-3 py-6">
                              <ShoppingCart size={48} strokeWidth={2} className="opacity-50" />
                              <span className="text-[12px] font-black uppercase tracking-widest text-center">Keranjang masih kosong<br/>Gas order bre!</span>
                           </div>
                        ) : (
                           <div className="space-y-4">
                              {cart.map(c => (
                                 <div key={c._id} className="flex justify-between items-start text-sm border-b-2 border-[#1C120C]/10 pb-3">
                                    <div className="flex-1">
                                       <p className="font-black text-[#1C120C] text-[14px] uppercase leading-tight mb-2">{c.nama}</p>
                                       <div className="flex items-center gap-2">
                                          <button onClick={() => handleRemoveFromCart(c._id)} className="w-6 h-6 bg-[#F4F0EA] border-2 border-[#1C120C] hover:bg-[#FF5C00] hover:text-white rounded-lg flex items-center justify-center font-black transition-colors">-</button>
                                          <span className="text-[13px] font-black text-[#1C120C] w-4 text-center">{c.jumlah}</span>
                                          <button onClick={() => handleAddToCart(c)} className="w-6 h-6 bg-[#F4F0EA] border-2 border-[#1C120C] hover:bg-[#C9E265] rounded-lg flex items-center justify-center font-black transition-colors">+</button>
                                       </div>
                                    </div>
                                    <div className="text-right">
                                       <p className="font-black text-[#1C120C] text-[14px]">{(c.harga * c.jumlah).toLocaleString('id-ID')}</p>
                                       <p className="text-[#1C120C]/50 text-[10px] font-bold mt-1">@ {c.harga.toLocaleString('id-ID')}</p>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        )}
                     </div>

                     {/* Summary Totals */}
                     <div className="bg-white border-4 border-[#1C120C] rounded-[20px] shadow-[4px_4px_0_#1C120C] p-5 mb-8">
                        <div className="flex justify-between items-center text-[13px] font-bold text-[#1C120C] mb-3 pb-3 border-b-2 border-[#1C120C]/10 dashed">
                           <span className="uppercase">Sub Total</span>
                           <span>Rp {CART_TOTAL.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between items-center">
                           <span className="text-[14px] font-black text-[#1C120C] uppercase tracking-wide">Total</span>
                           <span className="text-xl font-black text-[#FF5C00]">Rp {CART_TOTAL.toLocaleString('id-ID')}</span>
                        </div>
                     </div>

                     {/* Contact & Identitas Input */}
                     <div className="mb-6 space-y-4">
                        <div className="flex bg-[#F4F0EA] rounded-[16px] border-4 border-[#1C120C] shadow-[4px_4px_0_#1C120C] items-center px-4 py-3">
                           <div className="text-[#FF5C00] mr-3"><User size={20} strokeWidth={2.5} /></div>
                           <div>
                              <p className="text-[10px] font-black text-[#1C120C]/50 uppercase tracking-widest">Pemesan</p>
                              <p className="text-[14px] font-black text-[#1C120C] uppercase">{customerName || 'Tamu'}</p>
                           </div>
                        </div>
                        <div className="flex bg-white rounded-[16px] border-4 border-[#1C120C] focus-within:shadow-[4px_4px_0_#1C120C] focus-within:-translate-y-1 transition-all">
                           <div className="pl-4 py-3.5 text-[#1C120C] flex items-center"><Phone size={18} strokeWidth={2.5} /></div>
                           <input 
                              type="text" 
                              value={customerPhone} 
                              onChange={(e) => setCustomerPhone(e.target.value)} 
                              placeholder="NO. WHATSAPP (WAJIB)" 
                              className="w-full bg-transparent px-3 py-3.5 text-[13px] outline-none font-black placeholder:text-[#1C120C]/40 text-[#1C120C] uppercase" 
                           />
                        </div>
                     </div>

                     {/* Address Input */}
                     <div className="mb-8">
                        <p className="text-[12px] font-black text-[#1C120C] uppercase tracking-widest mb-3 flex items-center gap-2">
                           <MapPin size={16} strokeWidth={3} /> Destinasi
                        </p>
                         
                         {/* FITUR DAFTAR ALAMAT TERSIMPAN */}
                         <div className="mb-4">
                            {savedAddresses.length > 0 ? (
                               <>
                                  <p className="text-[10px] font-black text-[#1C120C]/50 uppercase tracking-widest mb-2">📋 Pilih dari alamat tersimpan</p>
                                  <select
                                     onChange={(e) => {
                                        if (!e.target.value) return;
                                        const addr = savedAddresses.find(a => a.id === parseInt(e.target.value));
                                        if (addr) {
                                        setAddress(`${addr.street_details}${addr.other_details ? `, ${addr.other_details}` : ''}`);
                                        const provCityDist = (addr.province_city_district || '').toLowerCase();
                                        if (provCityDist.includes('gombengsari')) setKecamatan('Gombengsari');
                                        else if (provCityDist.includes('kelir')) setKecamatan('Kelir');
                                        else if (provCityDist.includes('kalipuro')) setKecamatan('Kalipuro');
                                        else if (provCityDist.includes('pesucen')) setKecamatan('Pesucen');
                                        else if (provCityDist.includes('klatak')) setKecamatan('Klatak');
                                        else if (provCityDist.includes('bulusan')) setKecamatan('Bulusan');
                                        else if (provCityDist.includes('ketapang')) setKecamatan('Ketapang');
                                        else setKecamatan('Luar Kalipuro');
                                        }
                                     }}
                                  className="w-full bg-[#C9E265] px-4 py-3.5 text-[13px] outline-none font-black text-[#1C120C] uppercase border-4 border-[#1C120C] rounded-[16px] focus:shadow-[4px_4px_0_#1C120C] focus:-translate-y-1 transition-all appearance-none cursor-pointer shadow-[4px_4px_0_#1C120C]"
                                  style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%231C120C%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px top 50%', backgroundSize: '12px auto' }}
                               >
                                  <option value="">-- PILIH ALAMAT TERSIMPAN --</option>
                                  {savedAddresses.map(addr => (
                                     <option key={addr.id} value={addr.id}>
                                        {addr.name} - {addr.street_details} ({addr.province_city_district})
                                     </option>
                                  ))}
                               </select>
                               </>
                            ) : (
                               <div className="flex items-center justify-between bg-white border-4 border-dashed border-[#1C120C]/30 rounded-[16px] px-4 py-3 gap-3">
                                  <div>
                                     <p className="text-[10px] font-black text-[#1C120C]/50 uppercase tracking-widest">📋 Alamat Tersimpan</p>
                                     <p className="text-[11px] font-bold text-[#1C120C]/40 mt-0.5">
                                        {customerName ? 'Belum ada alamat. Tambah di halaman akun!' : 'Login untuk pilih alamat tersimpan'}
                                     </p>
                                  </div>
                                  <a
                                     href="/pelanggan/akun"
                                     className="flex-shrink-0 text-[10px] font-black uppercase tracking-widest bg-[#C9E265] border-2 border-[#1C120C] px-3 py-2 rounded-full hover:bg-[#FF5C00] hover:text-white transition-colors shadow-[2px_2px_0_#1C120C]"
                                  >
                                     {customerName ? '+ Tambah' : 'Login'}
                                  </a>
                               </div>
                            )}
                         </div>

                        <div className="mb-4">
                           <select 
                              value={kecamatan} 
                              onChange={(e) => setKecamatan(e.target.value)} 
                              className="w-full bg-white px-4 py-3.5 text-[13px] outline-none font-black text-[#1C120C] uppercase border-4 border-[#1C120C] rounded-[16px] focus:shadow-[4px_4px_0_#1C120C] focus:-translate-y-1 transition-all appearance-none cursor-pointer"
                              style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%231C120C%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px top 50%', backgroundSize: '12px auto' }}
                           >
                              <option value="Gombengsari">Gombengsari (Dekat Kedai)</option>
                              <option value="Kelir">Kelir (Dekat Kedai)</option>
                              <option value="Kalipuro">Kalipuro (Dekat Kedai)</option>
                              <option value="Pesucen">Pesucen (Dekat Kedai)</option>
                              <option value="Klatak">Klatak (Jauh - Wajib Paket)</option>
                              <option value="Bulusan">Bulusan (Jauh - Wajib Paket)</option>
                              <option value="Ketapang">Ketapang (Jauh - Wajib Paket)</option>
                              <option value="Luar Kalipuro">Luar Wilayah (Wajib Paket)</option>
                           </select>
                        </div>
                        <div className="relative">
                           <textarea
                              value={address}
                              onChange={(e) => setAddress(e.target.value)}
                              rows={3}
                              placeholder="ALAMAT LENGKAP / PATOKAN..."
                              className="w-full px-4 py-4 rounded-[16px] text-[13px] leading-relaxed font-black border-4 border-[#1C120C] focus:shadow-[4px_4px_0_#1C120C] focus:-translate-y-1 outline-none placeholder:text-[#1C120C]/40 resize-none transition-all bg-white text-[#1C120C] uppercase"
                           />
                        </div>
                     </div>

                     {/* Action Buttons */}
                     <div className="space-y-4 pt-2">
                        <button
                           onClick={() => {
                              if (cart.length === 0) return alert("Keranjang Kosong!");
                              if (!customerName.trim() || !customerPhone.trim() || !address.trim()) return alert("Lengkapi data diri dan alamat dulu bos!");
                              
                              const isFarArea = ['Klatak', 'Bulusan', 'Ketapang', 'Luar Kalipuro'].includes(kecamatan);
                              const isUnderMinimum = !hasPremiumItem ? CART_TOTAL < 60000 : CART_TOTAL < 25000;
                              if ((isFarArea && !hasPremiumItem) || isUnderMinimum) {
                                 setDeliveryMethod('Ambil di kedai');
                              } else {
                                 setDeliveryMethod('Kirim dari kedai');
                              }

                              setAmountPaid(CART_TOTAL);
                              setDeliveryError('');
                              setIsPaymentModalOpen(true);
                           }}
                           disabled={cart.length === 0}
                           className="w-full bg-[#1C120C] hover:bg-[#FF5C00] disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-full font-black text-[15px] uppercase tracking-widest shadow-[6px_6px_0_#1C120C] transition-all active:translate-y-2 active:shadow-none border-2 border-[#1C120C]"
                        >
                           Bayar Sekarang
                        </button>

                        <button
                           onClick={clearCart}
                           disabled={cart.length === 0}
                           className="w-full bg-[#F4F0EA] hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-[#1C120C] py-4 rounded-full font-black text-[13px] uppercase tracking-widest shadow-[4px_4px_0_#1C120C] transition-all active:translate-y-1 active:shadow-none flex items-center justify-center gap-2 border-2 border-[#1C120C]"
                        >
                           <Trash2 size={18} strokeWidth={3} /> Clear Cart
                        </button>
                     </div>

                  </div>

                  {/* Live Chat Floating on Desktop */}
                  <button
                     onClick={() => { setIsChatOpen(!isChatOpen); setHasUnreadChat(false); }}
                     className="hidden lg:flex fixed bottom-10 right-10 bg-[#FF5C00] text-white p-5 rounded-[24px] border-4 border-[#1C120C] shadow-[8px_8px_0_#1C120C] hover:-translate-y-2 hover:shadow-[12px_12px_0_#1C120C] active:translate-y-1 active:shadow-none transition-all duration-200 z-[90] items-center justify-center group overflow-hidden">
                     <MessageCircle size={32} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
                     {hasUnreadChat && <span className="absolute -top-3 -right-3 bg-[#C9E265] text-[#1C120C] text-[12px] font-black w-8 h-8 flex items-center justify-center rounded-full border-4 border-[#1C120C] animate-bounce">!</span>}
                  </button>
               </div>

            </div>
         </div>

         {/* Mobile Floating Cart Summary Button */}
         {cart.length > 0 && (
            <div className="lg:hidden fixed bottom-24 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] z-[80] animate-in slide-in-from-bottom-5 duration-300">
               <button 
                  onClick={() => cartRef.current?.scrollIntoView({ behavior: 'smooth' })}
                  className="w-full bg-[#C9E265] text-[#1C120C] py-4 rounded-[24px] shadow-[6px_6px_0_#1C120C] flex items-center justify-between px-6 border-4 border-[#1C120C] active:translate-y-1 active:shadow-none transition-all"
               >
                  <div className="flex items-center gap-3">
                     <ShoppingCart size={24} strokeWidth={3} />
                     <span className="text-[15px] font-black uppercase tracking-widest">{cart.length} Item</span>
                  </div>
                  <div className="flex items-center gap-3">
                     <span className="text-[16px] font-black">Rp {CART_TOTAL.toLocaleString('id-ID')}</span>
                     <ArrowDown size={20} strokeWidth={3} className="animate-bounce" />
                  </div>
               </button>
            </div>
         )}
         
         {/* Live chat mobile */}
         <button
            onClick={() => { setIsChatOpen(!isChatOpen); setHasUnreadChat(false); }}
            className="lg:hidden fixed bottom-6 right-6 bg-[#FF5C00] text-white p-4 rounded-[20px] border-4 border-[#1C120C] shadow-[4px_4px_0_#1C120C] z-[90] flex items-center justify-center">
            <MessageCircle size={28} strokeWidth={2.5} />
            {hasUnreadChat && <span className="absolute -top-2 -right-2 bg-[#C9E265] text-[#1C120C] text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-[#1C120C] animate-bounce">!</span>}
         </button>

         {/* --- PAYMENT MODAL (Neo-Brutalist) --- */}
         {isPaymentModalOpen && (
            <div className="fixed inset-0 bg-[#1C120C]/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200">
               <div className="bg-[#F4F0EA] rounded-[32px] border-4 border-[#1C120C] shadow-[16px_16px_0_#1C120C] w-full max-w-[550px] overflow-hidden flex flex-col transform transition-transform">
                  
                  {/* Header */}
                  <div className="bg-[#C9E265] px-8 py-6 border-b-4 border-[#1C120C] flex justify-between items-center">
                     <div>
                        <h2 className="text-2xl font-black text-[#1C120C] uppercase tracking-tight">Checkout.</h2>
                        <p className="text-[11px] font-black text-[#1C120C]/70 uppercase tracking-widest mt-1">Pilih metode & gas bayar</p>
                     </div>
                     <button onClick={() => { setIsPaymentModalOpen(false); setDeliveryError(''); }} className="w-10 h-10 flex items-center justify-center rounded-full bg-white border-4 border-[#1C120C] text-[#1C120C] hover:bg-[#FF5C00] hover:text-white font-black text-xl transition-colors shadow-[4px_4px_0_#1C120C] hover:-translate-y-1 hover:shadow-[6px_6px_0_#1C120C] active:translate-y-0 active:shadow-none">×</button>
                  </div>

                  {/* Body Component */}
                  <div className="p-8 space-y-8 bg-white">
                     
                     {/* Total Block */}
                     <div className="bg-[#1C120C] rounded-[24px] px-6 py-5 flex justify-between items-center shadow-[6px_6px_0_#FF5C00] border-4 border-[#1C120C] transform -rotate-1 hover:rotate-0 transition-transform">
                        <span className="text-[13px] font-black text-white uppercase tracking-widest">Total Bill:</span>
                        <span className="text-2xl font-black text-[#C9E265]">Rp {CART_TOTAL.toLocaleString('id-ID')}</span>
                     </div>

                     {/* Payment Method */}
                     <div>
                        <p className="text-[13px] font-black text-[#1C120C] uppercase tracking-widest mb-3">Cara Bayar</p>
                        <div className="grid grid-cols-2 gap-4">
                           {['COD', 'QRIS'].map(m => (
                              <button 
                                 key={m} 
                                 onClick={() => setPaymentMethod(m)}
                                 className={`py-3 rounded-[16px] border-4 flex items-center justify-center gap-2 font-black text-[14px] uppercase tracking-widest transition-all ${paymentMethod === m ? 'border-[#1C120C] bg-[#C9E265] text-[#1C120C] shadow-[4px_4px_0_#1C120C] transform -translate-y-1' : 'border-[#1C120C]/20 bg-[#F4F0EA] text-[#1C120C]/50 hover:border-[#1C120C] hover:text-[#1C120C]'}`}>
                                 {m}
                              </button>
                           ))}
                        </div>
                     </div>

                     {/* Delivery Method */}
                     <div>
                        <p className="text-[13px] font-black text-[#1C120C] uppercase tracking-widest mb-3">Opsi Pengiriman</p>
                        <div className="grid grid-cols-2 gap-4 mb-3">
                           {['Kirim dari kedai', 'Ambil di kedai'].map(d => {
                              const isFarArea = ['Klatak', 'Bulusan', 'Ketapang', 'Luar Kalipuro'].includes(kecamatan);
                              const isUnderMinimum = !hasPremiumItem ? CART_TOTAL < 60000 : CART_TOTAL < 25000;
                              const isDisabled = d === 'Kirim dari kedai' && ((isFarArea && !hasPremiumItem) || isUnderMinimum);
                              return (
                              <button 
                                 key={d} 
                                 onClick={() => {
                                    if (isDisabled) {
                                       if (isUnderMinimum) {
                                          if (!hasPremiumItem) {
                                             setDeliveryError("Beli kopi bungkusan minimal Rp 60rb buat dapat kurir kedai!");
                                          } else {
                                             setDeliveryError("Min. belanja Rp 25k buat delivery!");
                                          }
                                       } else {
                                          setDeliveryError("Kejauhan bos, harus beli Paket/Timba!");
                                       }
                                       return;
                                    }
                                    setDeliveryError('');
                                    setDeliveryMethod(d);
                                 }}
                                 className={`py-3 px-2 rounded-[16px] border-4 flex items-center justify-center gap-2 font-black text-[12px] text-center uppercase tracking-wider transition-all 
                                    ${deliveryMethod === d ? 'border-[#1C120C] bg-[#FF5C00] text-white shadow-[4px_4px_0_#1C120C] transform -translate-y-1' : 'border-[#1C120C]/20 bg-[#F4F0EA] text-[#1C120C]/50'}
                                    ${isDisabled ? 'opacity-40 cursor-not-allowed grayscale' : 'hover:border-[#1C120C] hover:text-[#1C120C]'}
                                 `}>
                                 {d === 'Kirim dari kedai' && <Navigation size={16} strokeWidth={3} />}
                                 {d === 'Ambil di kedai' && <MapPin size={16} strokeWidth={3} />}
                                 {d}
                              </button>
                           )})}
                        </div>
                        {deliveryError && (
                           <div className="bg-[#1C120C] text-white p-3 rounded-[12px] border-2 border-[#1C120C] shadow-[4px_4px_0_#FF5C00] animate-in slide-in-from-top-2">
                              <p className="text-[11px] font-black uppercase tracking-widest">⚠️ {deliveryError}</p>
                           </div>
                        )}
                     </div>

                     {/* Amount Paid Component */}
                     {paymentMethod === 'COD' && (
                        <div>
                           <p className="text-[13px] font-black text-[#1C120C] uppercase tracking-widest mb-3">Uang Pas / Kembalian?</p>
                           <div className="relative group">
                              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#1C120C] font-black text-lg">Rp</span>
                              <input 
                                 type="number" 
                                 value={amountPaid}
                                 onChange={(e) => setAmountPaid(e.target.value)}
                                 className="w-full bg-[#F4F0EA] border-4 border-[#1C120C] rounded-[20px] pl-16 py-4 text-lg font-black text-[#1C120C] outline-none focus:shadow-[6px_6px_0_#1C120C] focus:-translate-y-1 transition-all"
                                 placeholder="0"
                              />
                           </div>
                           <div className="flex gap-3 mt-4">
                              <button onClick={() => setAmountPaid(CART_TOTAL)} className="text-[11px] font-black uppercase tracking-widest text-[#1C120C] bg-white border-2 border-[#1C120C] px-5 py-2.5 rounded-full hover:bg-[#C9E265] shadow-[2px_2px_0_#1C120C] active:translate-y-1 active:shadow-none transition-all">
                                 Uang Pas
                              </button>
                              <button onClick={() => setAmountPaid(CART_TOTAL + 20000)} className="text-[11px] font-black uppercase tracking-widest text-[#1C120C] bg-white border-2 border-[#1C120C] px-5 py-2.5 rounded-full hover:bg-[#C9E265] shadow-[2px_2px_0_#1C120C] active:translate-y-1 active:shadow-none transition-all">
                                 + 20 Ribu
                              </button>
                           </div>
                        </div>
                     )}
                     
                     {paymentMethod !== 'COD' && (
                        <div className="bg-[#C9E265] border-4 border-[#1C120C] rounded-[20px] p-6 text-center shadow-[6px_6px_0_#1C120C] transform rotate-1">
                           <p className="text-[14px] font-black text-[#1C120C] uppercase tracking-widest mb-2">Upload Bukti Transfer / Scan QRIS</p>
                           <p className="text-[12px] text-[#1C120C]/80 font-bold mb-4">Silakan upload bukti transfer agar pesanan bisa langsung diproses.</p>
                           
                           <label className="flex flex-col items-center justify-center w-full h-32 border-4 border-dashed border-[#1C120C] rounded-xl cursor-pointer bg-white hover:bg-[#F4F0EA] transition-colors relative overflow-hidden group">
                              {buktiPembayaran ? (
                                 <img src={buktiPembayaran} alt="Bukti" className="absolute inset-0 w-full h-full object-contain p-2" />
                              ) : (
                                 <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <svg className="w-8 h-8 text-[#1C120C] mb-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                                    <p className="text-[11px] font-black text-[#1C120C] uppercase tracking-widest">Klik untuk upload foto</p>
                                 </div>
                              )}
                              <input 
                                 type="file" 
                                 className="hidden" 
                                 accept="image/*"
                                 onChange={(e) => {
                                    const file = e.target.files[0];
                                    if(file) {
                                       setBuktiFile(file);
                                       const reader = new FileReader();
                                       reader.onloadend = () => {
                                          setBuktiPembayaran(reader.result);
                                       };
                                       reader.readAsDataURL(file);
                                    }
                                 }}
                              />
                           </label>
                           {buktiFile && <p className="text-[10px] font-bold mt-2 truncate text-[#1C120C]">{buktiFile.name}</p>}
                        </div>
                     )}

                  </div>

                  {/* Actions / Footer Modal */}
                  <div className="px-8 py-6 border-t-4 border-[#1C120C] bg-[#F4F0EA] flex flex-col sm:flex-row items-center justify-between gap-4">
                     <button className="flex items-center justify-center gap-2 bg-white text-[#1C120C] hover:bg-[#C9E265] border-2 border-[#1C120C] px-6 py-3 rounded-full font-black text-[12px] uppercase tracking-widest shadow-[4px_4px_0_#1C120C] transition-all active:translate-y-1 active:shadow-none w-full sm:w-auto">
                        <MessageCircle size={16} strokeWidth={3} /> Chat Admin
                     </button>
                     <button 
                        onClick={handleCheckout}
                        disabled={loading || (paymentMethod === 'COD' && Number(amountPaid) < CART_TOTAL) || (paymentMethod !== 'COD' && !buktiPembayaran)}
                        className="bg-[#1C120C] hover:bg-[#FF5C00] disabled:opacity-50 text-white font-black w-full sm:w-[200px] py-4 rounded-full shadow-[6px_6px_0_#1C120C] transition-all active:translate-y-2 active:shadow-none text-[15px] uppercase tracking-widest border-2 border-[#1C120C]">
                        {loading ? 'Sabar...' : 'Gas Bayar!'}
                     </button>
                  </div>
               </div>
            </div>
         )}
         
         {isChatOpen && (
            <div className="fixed bottom-24 right-6 md:bottom-32 md:right-10 z-[100] w-[calc(100%-48px)] md:w-auto animate-in slide-in-from-bottom-5 duration-300">
               <ChatWidget onClose={() => setIsChatOpen(false)} />
            </div>
         )}

         {/* --- FOOTER (Bold Aesthetic) --- */}
         <footer className="bg-[#1C120C] text-[#F4F0EA] pt-24 pb-12 px-6 lg:px-12 border-t-8 border-[#FF5C00] relative overflow-hidden mt-20">
            <div className="max-w-[1200px] mx-auto relative z-10">
               <h2 className="text-[60px] md:text-[100px] font-black text-center mb-16 uppercase tracking-tighter text-[#F4F0EA] opacity-90 leading-none" style={{ WebkitTextStroke: '2px #F4F0EA', color: 'transparent' }}>
                  GOMBENG.
               </h2>

               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 text-sm border-t-2 border-[#F4F0EA]/20 pt-12">
                  <div className="space-y-5">
                     <h5 className="font-black mb-6 text-[#C9E265] text-[16px] uppercase tracking-widest">Connect</h5>
                     <p className="flex items-center gap-4 font-bold text-[14px] hover:text-[#FF5C00] transition-colors cursor-pointer"><Phone size={18} /> 082338975768</p>
                     <p className="flex items-center gap-4 font-bold text-[14px] hover:text-[#FF5C00] transition-colors cursor-pointer"><Mail size={18} /> kopiproyek@gmail.com</p>
                  </div>

                  <div>
                     <h5 className="font-black mb-6 text-[#C9E265] text-[16px] uppercase tracking-widest">Explore</h5>
                     <ul className="space-y-4 font-bold text-[14px]">
                        <li><a href="/pelanggan" className="hover:text-[#FF5C00] hover:translate-x-2 inline-block transition-transform">Vibes</a></li>
                        <li><a href="/pelanggan#about" className="hover:text-[#FF5C00] hover:translate-x-2 inline-block transition-transform">Story</a></li>
                        <li><a href="/pelanggan/shop" className="hover:text-[#FF5C00] hover:translate-x-2 inline-block transition-transform">Menu</a></li>
                     </ul>
                  </div>

                  <div>
                     <h5 className="font-black mb-6 text-[#C9E265] text-[16px] uppercase tracking-widest">Boring Stuff</h5>
                     <ul className="space-y-4 font-bold text-[14px]">
                        <li><a href="#" className="hover:text-[#FF5C00] inline-block transition-colors">Privacy Policy</a></li>
                        <li><a href="#" className="hover:text-[#FF5C00] inline-block transition-colors">Terms of Use</a></li>
                     </ul>
                  </div>

                  <div className="relative">
                     <h5 className="font-black mb-6 text-[#C9E265] text-[16px] uppercase tracking-widest">Stay Updated</h5>
                     <div className="flex bg-white rounded-full border-2 border-white focus-within:border-[#C9E265] transition-colors p-1 shadow-[4px_4px_0_#C9E265]">
                        <input type="email" placeholder="Ur email..." className="bg-transparent w-full px-4 font-bold text-[#1C120C] outline-none placeholder:text-gray-400" />
                        <button className="bg-[#FF5C00] text-white px-6 py-3 rounded-full font-black uppercase tracking-widest hover:bg-[#1C120C] transition-colors text-[12px]">Join</button>
                     </div>
                  </div>
               </div>
               
               <div className="mt-16 text-center font-bold text-[12px] uppercase tracking-widest text-[#F4F0EA]/50">
                  © 2026 Gombengsari Coffee. All rights reserved. Built with ☕
               </div>
            </div>
         </footer>
      </div>
   );
}
