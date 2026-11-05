"use client";

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ShoppingBag, User, Phone, MapPin, MessageCircle, Mail, Settings, Clock, LogOut, Menu, X, Navigation, Bell } from 'lucide-react';
import ChatWidget from '../../components/ChatWidget';
import Swal from 'sweetalert2';

const API_PRODUCTS_URL = 'http://localhost:5000/api/products';

// Custom Hook untuk deteksi Scroll Animation
function useIntersectionObserver(options = {}) {
   const [isIntersecting, setIsIntersecting] = useState(false);
   const ref = useRef(null);

   useEffect(() => {
      const observer = new IntersectionObserver(([entry]) => {
         if (entry.isIntersecting) {
            setIsIntersecting(true);
            if (ref.current) observer.unobserve(ref.current); // Animate only once
         }
      }, { threshold: 0.15, ...options });

      if (ref.current) {
         observer.observe(ref.current);
      }
      return () => {
         if (ref.current) observer.unobserve(ref.current);
      };
   }, []);

   return [ref, isIntersecting];
}

// Komponen Wrapper untuk efek Fade & Slide In
const FadeIn = ({ children, delay = 0, direction = 'up' }) => {
   const [ref, isVisible] = useIntersectionObserver();

   let startClass = 'opacity-0 translate-y-12';
   if (direction === 'left') startClass = 'opacity-0 translate-x-12';
   if (direction === 'right') startClass = 'opacity-0 -translate-x-12';
   if (direction === 'scale') startClass = 'opacity-0 scale-90';

   return (
      <div
         ref={ref}
         className={`transition-all duration-[1200ms] ease-[cubic-bezier(0.25,0.8,0.25,1)] ${isVisible ? 'opacity-100 translate-x-0 translate-y-0 scale-100' : startClass}`}
         style={{ transitionDelay: `${delay}ms` }}
      >
         {children}
      </div>
   )
};

export default function LandingPagePelanggan() {
   const [products, setProducts] = useState([]);
   const [isChatOpen, setIsChatOpen] = useState(false);
   const [isScrolled, setIsScrolled] = useState(false);

   const [hasUnreadChat, setHasUnreadChat] = useState(false);
   const [lastChatCount, setLastChatCount] = useState(0);

   const [customerName, setCustomerName] = useState('');
   const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

   // Notification and order status polling states
   const [myOrders, setMyOrders] = useState([]);
   const [isNotifOpen, setIsNotifOpen] = useState(false);
   const [hasUnreadNotif, setHasUnreadNotif] = useState(false);
   const previousOrdersRef = useRef([]);

   // Polling orders to show notifications on status changes
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
                        if (no.status === 'Proses') {
                           title = 'Pesanan Diproses! 📦';
                           text = `Pesanan TRX-2026-${String(no.id).padStart(3, '0')} sedang disiapkan oleh kedai.`;
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
            } catch (e) { }
         };
         fetchMyOrders();
         intervalId = setInterval(fetchMyOrders, 5000);
      }
      return () => clearInterval(intervalId);
   }, [customerName]);

   const fetchProducts = async () => {
      try {
         const res = await axios.get(API_PRODUCTS_URL);
         setProducts(res.data.filter(p => p.jumlah_stok > 0));
      } catch (error) {
         setProducts([{ _id: 'temp-1', jumlah_stok: 15 }, { _id: 'temp-2', jumlah_stok: 30 }]);
      }
   };

   // Efek Navbar transparan -> black saat di-scroll
   useEffect(() => {
      const handleScroll = () => {
         if (window.scrollY > 50) setIsScrolled(true);
         else setIsScrolled(false);
      };
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
   }, []);

   useEffect(() => {
      fetchProducts();
      const loggedInUser = localStorage.getItem('kopiGombeng_chatName');
      if (loggedInUser) setCustomerName(loggedInUser);
   }, []);

   const handleLogout = () => {
      localStorage.removeItem('kopiGombeng_chatName');
      localStorage.removeItem('kopiGombeng_userPhone');
      window.location.href = '/';
   };

   useEffect(() => {
      const checkChats = async () => {
         try {
            const savedName = localStorage.getItem('kopiGombeng_chatName');
            if (!savedName) return;
            const res = await axios.get(`http://localhost:5000/api/chats?room=${savedName}`);
            const currentCount = res.data.length;
            if (!isChatOpen && currentCount > lastChatCount && lastChatCount !== 0) setHasUnreadChat(true);
            if (isChatOpen) setHasUnreadChat(false);
            setLastChatCount(currentCount);
         } catch (e) { }
      };
      checkChats();
      const interval = setInterval(checkChats, 3000);
      return () => clearInterval(interval);
   }, [isChatOpen, lastChatCount]);


   const totalStockAmount = products.reduce((acc, curr) => acc + curr.jumlah_stok, 0);

   return (
      <div className="min-h-screen bg-[#F4F0EA] font-sans text-[#1C120C] overflow-x-hidden selection:bg-[#FF5C00] selection:text-white pb-10">

         {/* Styles Injeksi untuk Animasi Gen-Z */}
         <style dangerouslySetInnerHTML={{
            __html: `
        @keyframes floatY {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(2deg); }
        }
        .animate-float {
          animation: floatY 5s ease-in-out infinite;
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.9); opacity: 0.8; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        .animate-ring {
          animation: pulse-ring 2.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        }
        .marquee {
          white-space: nowrap;
          overflow: hidden;
          display: inline-block;
          animation: marquee 20s linear infinite;
        }
        @keyframes marquee {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .neo-shadow {
          box-shadow: 4px 6px 0px #1C120C;
        }
        .neo-shadow:hover {
          box-shadow: 6px 8px 0px #1C120C;
          transform: translateY(-2px);
        }
        .neo-shadow:active {
          box-shadow: 0px 0px 0px #1C120C;
          transform: translateY(4px) translateX(2px);
        }
      `}} />

         {/* --- FLOATING NAVBAR (Gen-Z Style) --- */}
         <div className="fixed top-4 md:top-6 left-0 right-0 z-[100] flex justify-center px-4 transition-transform duration-500">
            <header className={`w-full max-w-[1100px] rounded-full border-[3px] border-[#1C120C] transition-all duration-500 ${isScrolled ? 'bg-[#F4F0EA]/90 backdrop-blur-xl neo-shadow py-2 md:py-3' : 'bg-[#F4F0EA] neo-shadow py-3 md:py-4'} flex items-center justify-between px-5 md:px-8`}>
               <div className="flex items-center gap-3">
                  <button
                     onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                     className="md:hidden text-[#1C120C] hover:text-[#FF5C00] transition-colors bg-white rounded-full p-1 border-2 border-[#1C120C]"
                  >
                     {isMobileMenuOpen ? <X size={24} strokeWidth={3} /> : <Menu size={24} strokeWidth={3} />}
                  </button>
                  <h1 onClick={() => window.location.href = '/pelanggan'} className="text-xl md:text-2xl font-black tracking-tighter hover:scale-105 transition-transform cursor-pointer flex items-center gap-2 uppercase">
                     <span className="bg-[#FF5C00] text-white px-3 py-1 rounded-full text-sm md:text-lg border-2 border-[#1C120C]">GOMBENG</span> 
                     <span className="hidden sm:inline">COFFEE</span>
                  </h1>
               </div>

               <nav className="hidden md:flex items-center gap-8 text-[14px] font-black uppercase tracking-widest text-[#1C120C]">
                  <a href="#home" className="hover:text-[#FF5C00] hover:-translate-y-1 transition-all">Vibes</a>
                  <a href="#shop" className="hover:text-[#FF5C00] hover:-translate-y-1 transition-all">Menu</a>
                  <a href="#about" className="hover:text-[#FF5C00] hover:-translate-y-1 transition-all">Story</a>
                  <a href="#contact" className="hover:text-[#FF5C00] hover:-translate-y-1 transition-all">Holla</a>
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
                                             <span className={o.status === 'Selesai' ? 'text-green-600' : o.status === 'Proses' ? 'text-blue-600' : 'text-[#FF5C00]'}>
                                                {o.status === 'Proses' ? 'ON PROCESS ☕' : o.status === 'Selesai' ? 'DONE & ENJOY ✔️' : 'WAITING ⏳'}
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
                     <button onClick={() => window.location.href = '/pelanggan/tracking'} className="w-10 h-10 rounded-full border-2 border-[#1C120C] flex items-center justify-center bg-[#C9E265] hover:bg-[#A9C243] transition-all relative shadow-[2px_2px_0_#1C120C]" title="Lacak Pengiriman">
                        <Navigation size={18} strokeWidth={2.5} className="text-[#1C120C]" />
                        {myOrders.some(o => o.status === 'Proses' && o.metode_pengiriman === 'Kirim dari kedai') && (
                           <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                        )}
                     </button>
                  )}

                  <button onClick={() => window.location.href = '/pelanggan/shop'} className="w-10 h-10 rounded-full border-2 border-[#1C120C] bg-[#1C120C] text-white flex items-center justify-center hover:bg-[#FF5C00] hover:border-[#FF5C00] transition-transform shadow-[2px_2px_0_#1C120C] hover:-translate-y-1 active:translate-y-0 active:shadow-none">
                     <ShoppingBag size={18} strokeWidth={2.5} />
                  </button>

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
                  <a href="#home" onClick={() => setIsMobileMenuOpen(false)} className="hover:bg-[#FF5C00] hover:text-white transition-colors p-4 rounded-xl border-2 border-transparent hover:border-[#1C120C]">Vibes</a>
                  <a href="#shop" onClick={() => setIsMobileMenuOpen(false)} className="hover:bg-[#FF5C00] hover:text-white transition-colors p-4 rounded-xl border-2 border-transparent hover:border-[#1C120C]">Menu</a>
                  <a href="#about" onClick={() => setIsMobileMenuOpen(false)} className="hover:bg-[#FF5C00] hover:text-white transition-colors p-4 rounded-xl border-2 border-transparent hover:border-[#1C120C]">Story</a>
                  <a href="#contact" onClick={() => setIsMobileMenuOpen(false)} className="hover:bg-[#FF5C00] hover:text-white transition-colors p-4 rounded-xl border-2 border-transparent hover:border-[#1C120C]">Holla</a>
               </nav>
            </div>
         )}

         {/* --- HERO SECTION (Bold Gen-Z Vibe) --- */}
         <section id="home" className="pt-32 pb-20 lg:pt-48 lg:pb-32 min-h-[95vh] flex items-center relative overflow-hidden">
            {/* Playful Background Elements */}
            <div className="absolute top-20 right-10 w-[200px] h-[200px] md:w-[400px] md:h-[400px] bg-[#FF5C00] rounded-full mix-blend-multiply filter blur-[80px] opacity-20 animate-pulse z-0"></div>
            <div className="absolute bottom-10 left-10 w-[250px] h-[250px] md:w-[400px] md:h-[400px] bg-[#C9E265] rounded-full mix-blend-multiply filter blur-[100px] opacity-30 z-0"></div>

            <div className="max-w-[1300px] mx-auto px-6 lg:px-12 w-full flex flex-col-reverse lg:flex-row items-center justify-between gap-12 lg:gap-8 relative z-10">

               {/* Teks Hero */}
               <div className="w-full lg:w-[55%] text-center lg:text-left relative z-20">
                  <FadeIn direction="right" delay={100}>
                     <div className="inline-block px-5 py-2 rounded-full border-2 border-[#1C120C] font-black text-xs uppercase tracking-widest bg-[#C9E265] text-[#1C120C] neo-shadow mb-8 transform -rotate-2">
                        🔥 100% LOKAL, 100% HYPE
                     </div>
                     <h2 className="text-[50px] sm:text-[60px] md:text-[80px] lg:text-[90px] font-black leading-[0.95] tracking-tighter mb-6 uppercase text-[#1C120C] drop-shadow-sm">
                        BUKAN KOPI<br/>
                        <span className="text-transparent font-serif italic lowercase relative" style={{ WebkitTextStroke: '2.5px #1C120C' }}>
                           biasa.
                           {/* Highlight behind text */}
                           <span className="absolute bottom-1 left-0 w-full h-[30%] bg-[#FF5C00]/30 -z-10 rounded-sm transform -rotate-1"></span>
                        </span>
                     </h2>
                  </FadeIn>

                  <FadeIn direction="right" delay={300}>
                     <p className="text-[16px] md:text-[20px] text-[#1C120C]/80 font-bold mb-10 max-w-[500px] mx-auto lg:mx-0 leading-relaxed border-l-4 border-[#FF5C00] pl-4">
                        Dari Banyuwangi untuk Generasi Kini. Nikmati sensasi kopi Gombengsari yang bold, fresh, dan pastinya hits different.
                     </p>
                  </FadeIn>

                  <FadeIn direction="up" delay={500}>
                     <div className="flex flex-wrap items-center justify-center lg:justify-start gap-5">
                        <button
                           onClick={() => window.location.href = '/pelanggan/shop'}
                           className="inline-flex items-center gap-4 bg-[#1C120C] text-[#F4F0EA] px-8 py-4 md:py-5 rounded-full font-black text-[15px] uppercase transition-all duration-200 neo-shadow group border-2 border-[#1C120C] hover:bg-[#FF5C00] hover:text-white"
                        >
                           <span>GRAB YOURS NOW</span>
                           <div className="bg-[#F4F0EA] rounded-full w-8 h-8 flex items-center justify-center group-hover:rotate-45 transition-transform duration-300 border-2 border-[#1C120C]">
                              <span className="text-[#1C120C] font-black leading-none text-lg">↗</span>
                           </div>
                        </button>
                     </div>
                  </FadeIn>
               </div>

               {/* Gambar Hero (Gen-Z Style) */}
               <div className="w-full lg:w-[45%] flex justify-center items-center relative mt-10 lg:mt-0">
                  <FadeIn direction="left" delay={300}>
                     <div className="relative w-[280px] md:w-[380px] lg:w-[450px] aspect-[4/5] rounded-[40px] border-4 border-[#1C120C] shadow-[12px_16px_0_#1C120C] overflow-hidden group bg-white animate-float rotate-3 hover:rotate-0 transition-transform duration-500">
                        <img
                           src="https://images.unsplash.com/photo-1611162458324-aae1eb4129a4?q=80&w=800&auto=format&fit=crop"
                           alt="Kopi Aesthetic"
                           className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        {/* Sticker Overlays */}
                        <div className="absolute top-8 -right-4 bg-[#C9E265] text-[#1C120C] font-black text-sm px-6 py-2 rounded-full border-2 border-[#1C120C] transform rotate-[15deg] shadow-[4px_4px_0_#1C120C]">
                           FRESH ROAST!
                        </div>
                        <div className="absolute bottom-10 -left-6 bg-[#FF5C00] text-white font-black text-sm px-6 py-2 rounded-full border-2 border-[#1C120C] transform -rotate-[10deg] shadow-[4px_4px_0_#1C120C]">
                           100% ARABICA
                        </div>
                     </div>
                  </FadeIn>
               </div>
            </div>
         </section>

         {/* --- MARQUEE SEPARATOR --- */}
         <div className="w-full bg-[#1C120C] text-[#C9E265] py-4 border-y-4 border-[#1C120C] -rotate-1 scale-105 overflow-hidden flex z-20 shadow-xl my-10">
            <div className="marquee font-black uppercase text-2xl md:text-3xl tracking-widest">
               <span>• BOLD VIBES ONLY • 100% GOMBENGSARI • ROASTED WITH PASSION • CAFFEINE FIX • BOLD VIBES ONLY • 100% GOMBENGSARI • ROASTED WITH PASSION • CAFFEINE FIX • BOLD VIBES ONLY • 100% GOMBENGSARI • ROASTED WITH PASSION • CAFFEINE FIX • </span>
            </div>
         </div>

         {/* --- ABOUT (BENTO BOX) SECTION --- */}
         <section id="about" className="py-24 lg:py-32 bg-[#F4F0EA] relative overflow-hidden">
            <div className="max-w-[1200px] mx-auto px-6 lg:px-12">

               <FadeIn direction="up">
                  <div className="mb-16 relative">
                     <h3 className="text-[40px] md:text-[60px] font-black mb-2 tracking-tighter uppercase text-[#1C120C] inline-block border-b-8 border-[#FF5C00] pb-2">Our Story.</h3>
                     <p className="text-[#1C120C]/60 text-sm font-black tracking-[0.2em] uppercase mt-4">Kopi Lokal, Vibe Global.</p>
                  </div>
               </FadeIn>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                  {/* Big Image Card */}
                  <div className="md:col-span-2 aspect-video md:aspect-auto md:h-[400px] bg-white rounded-[32px] border-4 border-[#1C120C] shadow-[8px_8px_0_#1C120C] overflow-hidden relative group">
                     <img
                        src="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=800&auto=format&fit=crop"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 grayscale-[20%]"
                        alt="Kopi Vibes"
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-[#1C120C]/80 to-transparent"></div>
                     <h4 className="absolute bottom-8 left-8 text-white text-3xl md:text-4xl font-black uppercase">Roots in<br/>Banyuwangi</h4>
                  </div>

                  {/* Text Card */}
                  <div className="bg-[#C9E265] rounded-[32px] border-4 border-[#1C120C] shadow-[8px_8px_0_#1C120C] p-8 md:p-10 flex flex-col justify-center">
                     <p className="text-[#1C120C] font-bold text-lg md:text-xl leading-relaxed">
                        Berawal dari Gombengsari, kami menyajikan kopi otentik yang pas banget buat nemenin hustle harian lo. No cap, just good beans. ☕✨
                     </p>
                  </div>
               </div>

            </div>
         </section>

         {/* --- SHOP (INFO STOK) SECTION --- */}
         <section id="shop" className="py-24 lg:py-32 bg-[#FF5C00] border-y-4 border-[#1C120C] relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#1C120C 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>

            <div className="max-w-[1200px] mx-auto px-6 lg:px-12 flex flex-col items-center text-center relative z-10">

               <FadeIn direction="up">
                  <div className="mb-16">
                     <h3 className="text-[50px] md:text-[70px] font-black text-white tracking-tighter uppercase drop-shadow-[4px_4px_0_#1C120C]">Ready Stock.</h3>
                  </div>
               </FadeIn>

               <FadeIn direction="scale" delay={200}>
                  <div className="relative group mb-16">
                     {/* Outer Animated Ripple */}
                     <div className="absolute inset-0 border-[6px] border-[#1C120C] rounded-[48px] animate-ring z-0"></div>

                     {/* Main Card Counter */}
                     <div className="w-64 h-64 md:w-80 md:h-80 rounded-[48px] border-8 border-[#1C120C] bg-[#F4F0EA] shadow-[16px_16px_0_#1C120C] flex flex-col items-center justify-center relative z-10 transition-transform duration-300 group-hover:-translate-y-2 group-hover:shadow-[20px_20px_0_#1C120C] cursor-default rotate-2">
                        <span className="text-xl font-black text-[#1C120C] uppercase tracking-widest mb-2 bg-[#C9E265] px-4 py-1 rounded-full border-2 border-[#1C120C]">Items Left</span>
                        <span className="text-[100px] md:text-[130px] font-black text-[#1C120C] leading-none drop-shadow-sm">
                           {totalStockAmount > 0 ? totalStockAmount : '0'}
                        </span>
                     </div>
                  </div>
               </FadeIn>

               <FadeIn direction="up" delay={400}>
                  <button
                     onClick={() => window.location.href = '/pelanggan/shop'}
                     className="bg-[#1C120C] text-white px-12 py-5 rounded-full font-black text-lg uppercase tracking-widest hover:bg-white hover:text-[#1C120C] transition-all shadow-[6px_8px_0_#1C120C] active:translate-y-2 active:shadow-none border-4 border-[#1C120C]"
                  >
                     BUY NOW OR CRY LATER
                  </button>
               </FadeIn>

            </div>
         </section>

         {/* --- CONTACT US SECTION --- */}
         <section id="contact" className="py-24 lg:py-32 bg-[#F4F0EA] relative">
            <div className="max-w-[1200px] mx-auto px-6 lg:px-12">

               <FadeIn direction="up">
                  <div className="mb-16">
                     <h3 className="text-[40px] md:text-[60px] font-black tracking-tighter uppercase text-[#1C120C] inline-block border-b-8 border-[#C9E265] pb-2">Holla at Us.</h3>
                     <p className="text-[#1C120C]/60 text-sm font-black tracking-[0.2em] uppercase mt-4">Drop a message, don't be shy!</p>
                  </div>
               </FadeIn>

               <FadeIn direction="scale" delay={200}>
                  <div className="bg-white rounded-[40px] border-4 border-[#1C120C] shadow-[12px_16px_0_#1C120C] flex flex-col lg:flex-row overflow-hidden min-h-[550px] relative z-10">

                     {/* Left Bold Panel */}
                     <div className="w-full lg:w-[40%] bg-[#C9E265] text-[#1C120C] p-10 lg:p-14 flex flex-col justify-between border-b-4 lg:border-b-0 lg:border-r-4 border-[#1C120C] relative overflow-hidden">
                        
                        <div className="relative z-10">
                           <h4 className="text-[32px] font-black mb-10 uppercase">Hit Our Line</h4>

                           <div className="space-y-8">
                              <div className="flex items-center gap-5 hover:translate-x-2 transition-transform bg-white p-4 rounded-[20px] border-2 border-[#1C120C] shadow-[4px_4px_0_#1C120C]">
                                 <Phone size={24} className="text-[#1C120C]" strokeWidth={2.5} />
                                 <span className="text-[16px] font-black">082338975768</span>
                              </div>
                              <div className="flex items-center gap-5 hover:translate-x-2 transition-transform bg-white p-4 rounded-[20px] border-2 border-[#1C120C] shadow-[4px_4px_0_#1C120C]">
                                 <Mail size={24} className="text-[#1C120C]" strokeWidth={2.5} />
                                 <span className="text-[16px] font-black">kopiproyek@gmail.com</span>
                              </div>
                              <div className="flex items-start gap-5 hover:translate-x-2 transition-transform bg-white p-4 rounded-[20px] border-2 border-[#1C120C] shadow-[4px_4px_0_#1C120C]">
                                 <MapPin size={28} className="text-[#1C120C] shrink-0" strokeWidth={2.5} />
                                 <span className="text-[16px] font-black uppercase leading-tight">Kedai Kopi Gombengsari,<br />Banyuwangi</span>
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* Right Form Panel */}
                     <div className="w-full lg:w-[60%] p-10 lg:p-16 bg-white relative flex justify-center items-center">
                        <form onSubmit={(e) => { e.preventDefault(); setIsChatOpen(true); }} className="w-full flex flex-col space-y-8">

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="relative">
                                 <input type="text" className="w-full bg-[#F4F0EA] border-2 border-[#1C120C] rounded-[16px] px-5 py-4 outline-none focus:bg-white focus:shadow-[4px_4px_0_#1C120C] text-[15px] font-bold transition-all placeholder-[#1C120C]/40" placeholder="First Name" />
                              </div>
                              <div className="relative">
                                 <input type="text" className="w-full bg-[#F4F0EA] border-2 border-[#1C120C] rounded-[16px] px-5 py-4 outline-none focus:bg-white focus:shadow-[4px_4px_0_#1C120C] text-[15px] font-bold transition-all placeholder-[#1C120C]/40" placeholder="Last Name" />
                              </div>
                              <div className="relative md:col-span-2">
                                 <input type="email" className="w-full bg-[#F4F0EA] border-2 border-[#1C120C] rounded-[16px] px-5 py-4 outline-none focus:bg-white focus:shadow-[4px_4px_0_#1C120C] text-[15px] font-bold transition-all placeholder-[#1C120C]/40" placeholder="Email Address" />
                              </div>
                           </div>

                           <div className="relative">
                              <textarea rows="4" className="w-full bg-[#F4F0EA] border-2 border-[#1C120C] rounded-[16px] px-5 py-4 outline-none focus:bg-white focus:shadow-[4px_4px_0_#1C120C] text-[15px] font-bold transition-all placeholder-[#1C120C]/40 resize-none" placeholder="What's on your mind?"></textarea>
                           </div>

                           <div className="flex justify-end pt-4">
                              <button type="submit" className="bg-[#FF5C00] text-white border-2 border-[#1C120C] px-10 py-4 rounded-full font-black text-[16px] transition-all shadow-[4px_6px_0_#1C120C] hover:-translate-y-1 hover:shadow-[6px_8px_0_#1C120C] active:translate-y-1 active:shadow-[0px_0px_0_#1C120C] w-full sm:w-auto uppercase">
                                 Send It! 🚀
                              </button>
                           </div>
                        </form>
                     </div>
                  </div>
               </FadeIn>
            </div>
         </section>

         {/* --- LIVE CHAT WIDGET (Gen-Z Bubble) --- */}
         <button
            onClick={() => { setIsChatOpen(!isChatOpen); setHasUnreadChat(false); }}
            className="fixed bottom-6 right-6 md:bottom-10 md:right-10 bg-[#C9E265] text-[#1C120C] p-4 md:p-5 rounded-[24px] border-4 border-[#1C120C] shadow-[6px_6px_0_#1C120C] hover:-translate-y-2 hover:shadow-[8px_8px_0_#1C120C] active:translate-y-1 active:shadow-[0px_0px_0_#1C120C] transition-all duration-200 z-[90] flex items-center justify-center group overflow-hidden">
            <MessageCircle size={32} className="relative z-10 group-hover:scale-110 transition-transform duration-300" strokeWidth={2.5} />
            {hasUnreadChat && (
               <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[12px] font-black w-8 h-8 flex items-center justify-center rounded-full border-4 border-[#1C120C] animate-bounce z-20">
                  !
               </span>
            )}
         </button>

         {isChatOpen && (
            <div className="fixed bottom-24 right-6 md:bottom-32 md:right-10 z-[100] w-[calc(100%-48px)] md:w-auto animate-in slide-in-from-bottom-5 duration-300">
               <ChatWidget onClose={() => setIsChatOpen(false)} />
            </div>
         )}

         {/* --- FOOTER (Bold Aesthetic) --- */}
         <footer className="bg-[#1C120C] text-[#F4F0EA] pt-24 pb-12 px-6 lg:px-12 border-t-8 border-[#FF5C00] relative overflow-hidden">
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
                        <li><a href="#home" className="hover:text-[#FF5C00] hover:translate-x-2 inline-block transition-transform">Vibes</a></li>
                        <li><a href="#about" className="hover:text-[#FF5C00] hover:translate-x-2 inline-block transition-transform">Story</a></li>
                        <li><a href="#shop" className="hover:text-[#FF5C00] hover:translate-x-2 inline-block transition-transform">Menu</a></li>
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
