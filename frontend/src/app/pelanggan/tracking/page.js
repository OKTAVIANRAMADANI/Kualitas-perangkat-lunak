"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { 
   ShoppingBag, User, MapPin, Navigation, Bell, LogOut, Settings, Clock, 
   Menu, X, MessageCircle, Phone, CheckCircle2, Truck, ChevronRight,
   ArrowLeft
} from 'lucide-react';
import ChatWidget from '../../../components/ChatWidget';
import Swal from 'sweetalert2';

const API_ORDERS_URL = 'http://localhost:5000/api/orders';

// Koordinat Kedai Kopi Gombengsari
const GUDANG_COORDS = [-8.1540175, 114.3385565];

// Koordinat real tiap wilayah pengiriman di sekitar Kalipuro, Banyuwangi
// (Sesuai dengan pilihan dropdown kecamatan di halaman Shop)
const AREA_DESTINATIONS = {
   'gombengsari':    [-8.2050, 114.3730],   // Desa Gombengsari - sangat dekat kedai
   'kelir':          [-8.2100, 114.3580],   // Desa Kelir - dekat kedai
   'kalipuro':       [-8.1930, 114.3780],   // Kecamatan Kalipuro (pusat)
   'pesucen':        [-8.1850, 114.3650],   // Desa Pesucen - dekat kedai
   'klatak':         [-8.2200, 114.3900],   // Desa Klatak - agak jauh
   'bulusan':        [-8.2050, 114.4100],   // Desa Bulusan - agak jauh
   'ketapang':       [-8.2320, 114.3550],   // Ketapang - agak jauh
   'luar kalipuro':  [-8.2150, 114.4200],   // Luar wilayah Kalipuro
};

// Data kurir dummy
const KURIR_DATA = {
   nama: 'Budi Santoso',
   inisial: 'BS',
   kendaraan: 'Honda Beat',
   plat: 'B 4521 KRJ',
   phone: '0812-3456-7890'
};

// Generate interpolated waypoints between two coordinates
function generateWaypoints(start, end, steps = 8) {
   const waypoints = [];
   for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // Add slight curve/randomness for realistic road feel
      const jitterLat = (Math.random() - 0.5) * 0.001;
      const jitterLng = (Math.random() - 0.5) * 0.001;
      waypoints.push([
         start[0] + (end[0] - start[0]) * t + (i > 0 && i < steps ? jitterLat : 0),
         start[1] + (end[1] - start[1]) * t + (i > 0 && i < steps ? jitterLng : 0)
      ]);
   }
   return waypoints;
}

// Calculate distance between two coords in km (Haversine)
function haversineDistance(lat1, lon1, lat2, lon2) {
   const R = 6371;
   const dLat = (lat2 - lat1) * Math.PI / 180;
   const dLon = (lon2 - lon1) * Math.PI / 180;
   const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
             Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
             Math.sin(dLon/2) * Math.sin(dLon/2);
   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
   return R * c;
}

// Generate timeline checkpoints from waypoints
function generateTimeline(waypoints, startTime) {
   const checkpointNames = [
      'Paket diambil dari gudang',
      'Melewati Persimpangan Melati',
      'Melewati Jl. Raya Kalipuro',
      'Sedang di Jl. Anggrek',
      'Mendekati lokasi tujuan',
      'Melewati Jl. Mangga',
      'Hampir sampai',
      'Tiba di tujuan'
   ];
   
   const timeline = [];
   const totalDuration = 25; // minutes total journey
   
   for (let i = 0; i < Math.min(waypoints.length, checkpointNames.length); i++) {
      const minuteOffset = Math.round((i / (waypoints.length - 1)) * totalDuration);
      const time = new Date(startTime.getTime() + minuteOffset * 60000);
      timeline.push({
         label: checkpointNames[i] || `Checkpoint ${i + 1}`,
         time: time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
         coords: waypoints[i],
         passed: false
      });
   }
   return timeline;
}


export default function TrackingPage() {
    const [customerName, setCustomerName] = useState('');
    const [myOrders, setMyOrders] = useState([]);
    const [activeOrder, setActiveOrder] = useState(null);
    const [showRouteDetail, setShowRouteDetail] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [hasUnreadChat, setHasUnreadChat] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    // Notification states and polling
    const [allOrders, setAllOrders] = useState([]);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [hasUnreadNotif, setHasUnreadNotif] = useState(false);
    const previousOrdersRef = useRef([]);

    useEffect(() => {
       let intervalId;
       if (customerName) {
          const fetchAllOrders = async () => {
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
                setAllOrders(newOrders);
             } catch (e) {}
          };
          fetchAllOrders();
          intervalId = setInterval(fetchAllOrders, 5000);
       }
       return () => clearInterval(intervalId);
    }, [customerName]);

   // Courier simulation state
   const [courierPosition, setCourierPosition] = useState(null);
   const [courierStep, setCourierStep] = useState(0);
   const [waypoints, setWaypoints] = useState([]);
   const [timeline, setTimeline] = useState([]);
   const [simulationStartTime] = useState(new Date());

   // Map refs
   const mapRef = useRef(null);
   const mapInstanceRef = useRef(null);
   const detailMapRef = useRef(null);
   const detailMapInstanceRef = useRef(null);
   const courierMarkerRef = useRef(null);
   const detailCourierMarkerRef = useRef(null);
   const intervalRef = useRef(null);

   useEffect(() => {
      const loggedInUser = localStorage.getItem('kopiGombeng_chatName');
      if (loggedInUser) setCustomerName(loggedInUser);
   }, []);

   // Efek Navbar transparan -> black saat di-scroll
   useEffect(() => {
      const handleScroll = () => {
         if (window.scrollY > 50) setIsScrolled(true);
         else setIsScrolled(false);
      };
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
   }, []);

   // Fetch orders that are "Proses" and "Kirim dari kedai"
   useEffect(() => {
      if (!customerName) return;
      const fetchOrders = async () => {
         try {
            const res = await axios.get(`${API_ORDERS_URL}/track/${customerName}`);
            const deliveryOrders = res.data.filter(
               o => o.metode_pengiriman === 'Kirim dari kedai' && (o.status === 'Diproses' || o.status === 'Dikirim')
            );
            setMyOrders(deliveryOrders);
            if (deliveryOrders.length > 0 && !activeOrder) {
               setActiveOrder(deliveryOrders[0]);
            }
         } catch (e) {
            // Dummy fallback for demo
            const dummyOrder = {
               id: 88214,
               nama_pelanggan: customerName,
               total_harga: 145000,
               metode_pembayaran: 'QRIS',
               metode_pengiriman: 'Kirim dari kedai',
               alamat: 'Jl. Melati No. 12, Kalipuro (Dekat Kedai - Desa/Kel. Kalipuro, Kec. Kalipuro)',
               status: 'Proses',
               created_at: new Date().toISOString()
            };
            setMyOrders([dummyOrder]);
            if (!activeOrder) setActiveOrder(dummyOrder);
         }
      };
      fetchOrders();
      const iv = setInterval(fetchOrders, 8000);
      return () => clearInterval(iv);
   }, [customerName]);

   // Determine destination from order address — matches the kecamatan from Shop checkout
   const destination = useMemo(() => {
      if (!activeOrder) return AREA_DESTINATIONS['kalipuro']; // default fallback
      const addr = (activeOrder.alamat || '').toLowerCase();
      
      // Format 1: "... (Dekat Kedai - Desa/Kel. Kalipuro, Kec. Kalipuro)"
      // Format 2: "... (Luar Area Kedai - Luar Kalipuro)"
      // Format 3: "... (Luar Area Kedai - Klatak)"
      
      // Try matching each known area name in the address string
      // Check longer names first to avoid partial matches (e.g. "Luar Kalipuro" before "Kalipuro")
      const areaKeys = Object.keys(AREA_DESTINATIONS).sort((a, b) => b.length - a.length);
      
      for (const areaName of areaKeys) {
         if (addr.includes(areaName)) {
            return AREA_DESTINATIONS[areaName];
         }
      }
      
      // Fallback: Kalipuro center
      return AREA_DESTINATIONS['kalipuro'];
   }, [activeOrder]);

   // Generate waypoints when destination changes
   useEffect(() => {
      if (!destination) return;
      const wps = generateWaypoints(GUDANG_COORDS, destination, 7);
      setWaypoints(wps);
      setCourierStep(0);
      setCourierPosition(wps[0]);
      setTimeline(generateTimeline(wps, simulationStartTime));
   }, [destination]);

   // Simulate courier movement
   useEffect(() => {
      if (waypoints.length === 0) return;
      
      if (intervalRef.current) clearInterval(intervalRef.current);
      
      intervalRef.current = setInterval(() => {
         setCourierStep(prev => {
            const next = prev + 1;
            if (next >= waypoints.length) {
               clearInterval(intervalRef.current);
               return prev;
            }
            setCourierPosition(waypoints[next]);
            
            // Update timeline passed status
            setTimeline(tl => tl.map((item, idx) => ({
               ...item,
               passed: idx <= next
            })));
            
            return next;
         });
      }, 4000); // Move every 4 seconds
      
      return () => {
         if (intervalRef.current) clearInterval(intervalRef.current);
      };
   }, [waypoints]);

   // Initialize and update Leaflet main map
   useEffect(() => {
      if (typeof window === 'undefined' || !mapRef.current || waypoints.length === 0) return;

      const initMap = async () => {
         const L = (await import('leaflet')).default;

         if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
         }

         const map = L.map(mapRef.current, {
            zoomControl: false,
            attributionControl: false
         }).setView(
            [(GUDANG_COORDS[0] + destination[0]) / 2, (GUDANG_COORDS[1] + destination[1]) / 2],
            14
         );

         L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
         }).addTo(map);

         // Gudang marker (green)
         const gudangIcon = L.divIcon({
            html: `<div style="width:18px;height:18px;background:#10b981;border-radius:50%;border:3px solid #ffffff;box-shadow:0 2px 8px rgba(16,185,129,0.5)"></div>`,
            className: '',
            iconSize: [18, 18],
            iconAnchor: [9, 9]
         });
         L.marker(GUDANG_COORDS, { icon: gudangIcon }).addTo(map)
            .bindTooltip('Kedai Kopi Gombengsari', { permanent: true, direction: 'bottom', className: 'leaflet-tooltip-light' });

         // Destination marker (orange/red)
         const destIcon = L.divIcon({
            html: `<div style="width:18px;height:18px;background:#ef4444;border-radius:50%;border:3px solid #ffffff;box-shadow:0 2px 8px rgba(239,68,68,0.5)"></div>`,
            className: '',
            iconSize: [18, 18],
            iconAnchor: [9, 9]
         });
         L.marker(destination, { icon: destIcon }).addTo(map)
            .bindTooltip('Tujuanmu', { permanent: true, direction: 'top', className: 'leaflet-tooltip-light' });

         // Route polyline (blue)
         L.polyline(waypoints, {
            color: '#3b82f6',
            weight: 4,
            dashArray: '10, 8',
            opacity: 0.85
         }).addTo(map);

         // Courier marker
         const courierIcon = L.divIcon({
            html: `<div style="width:32px;height:32px;background:#8B5A2B;border-radius:50%;border:3px solid #000000;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 12px rgba(255,223,67,0.5)">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="#000" stroke="#000" stroke-width="1"><path d="M13 17h8l-4-8H9l-4 8h8zm0 0v-4m-6 4l-3 3m12-3l3 3"/></svg>
            </div>`,
            className: '',
            iconSize: [32, 32],
            iconAnchor: [16, 16]
         });
         courierMarkerRef.current = L.marker(courierPosition || GUDANG_COORDS, { icon: courierIcon }).addTo(map);

         // Fit bounds
         map.fitBounds([GUDANG_COORDS, destination], { padding: [50, 50] });

         mapInstanceRef.current = map;
      };

      initMap();

      return () => {
         if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
         }
      };
   }, [waypoints, destination]);

   // Update courier marker position on main map
   useEffect(() => {
      if (courierMarkerRef.current && courierPosition) {
         courierMarkerRef.current.setLatLng(courierPosition);
      }
   }, [courierPosition]);

   // Initialize detail map
   useEffect(() => {
      if (!showRouteDetail || typeof window === 'undefined' || !detailMapRef.current || waypoints.length === 0) return;

      const initDetailMap = async () => {
         const L = (await import('leaflet')).default;

         if (detailMapInstanceRef.current) {
            detailMapInstanceRef.current.remove();
            detailMapInstanceRef.current = null;
         }

         const map = L.map(detailMapRef.current, {
            zoomControl: false,
            attributionControl: false
         }).setView(
            [(GUDANG_COORDS[0] + destination[0]) / 2, (GUDANG_COORDS[1] + destination[1]) / 2],
            14
         );

         L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
         }).addTo(map);

         // Gudang marker
         const gudangIcon = L.divIcon({
            html: `<div style="width:16px;height:16px;background:#10b981;border-radius:50%;border:3px solid #ffffff;box-shadow:0 2px 6px rgba(16,185,129,0.4)"></div>`,
            className: '',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
         });
         L.marker(GUDANG_COORDS, { icon: gudangIcon }).addTo(map)
            .bindTooltip('Kedai Kopi Gombengsari', { permanent: true, direction: 'bottom', className: 'leaflet-tooltip-light' });

         // Destination marker
         const destIcon = L.divIcon({
            html: `<div style="width:16px;height:16px;background:#ef4444;border-radius:50%;border:3px solid #ffffff;box-shadow:0 2px 6px rgba(239,68,68,0.4)"></div>`,
            className: '',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
         });
         L.marker(destination, { icon: destIcon }).addTo(map)
            .bindTooltip('Tujuanmu', { permanent: true, direction: 'top', className: 'leaflet-tooltip-light' });

         // Checkpoint markers
         waypoints.forEach((wp, i) => {
            if (i === 0 || i === waypoints.length - 1) return;
            const cpIcon = L.divIcon({
               html: `<div style="width:10px;height:10px;background:${i <= courierStep ? '#3b82f6' : '#d1d5db'};border-radius:50%;border:2px solid #ffffff;box-shadow:0 1px 4px rgba(0,0,0,0.2);"></div>`,
               className: '',
               iconSize: [10, 10],
               iconAnchor: [5, 5]
            });
            L.marker(wp, { icon: cpIcon }).addTo(map);
         });

         // Route polyline
         L.polyline(waypoints, {
            color: '#3b82f6',
            weight: 4,
            dashArray: '10, 8',
            opacity: 0.85
         }).addTo(map);

         // Courier marker
         const courierIcon = L.divIcon({
            html: `<div style="width:30px;height:30px;background:#8B5A2B;border-radius:50%;border:3px solid #000000;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(255,223,67,0.5)">
               <svg width="14" height="14" viewBox="0 0 24 24" fill="#000" stroke="#000" stroke-width="1"><path d="M13 17h8l-4-8H9l-4 8h8zm0 0v-4m-6 4l-3 3m12-3l3 3"/></svg>
            </div>`,
            className: '',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
         });
         detailCourierMarkerRef.current = L.marker(courierPosition || GUDANG_COORDS, { icon: courierIcon }).addTo(map);

         map.fitBounds([GUDANG_COORDS, destination], { padding: [40, 40] });
         detailMapInstanceRef.current = map;
      };

      // Small delay for DOM rendering
      setTimeout(() => {
         initDetailMap().then(() => {
            setTimeout(() => {
               if (detailMapInstanceRef.current) {
                  detailMapInstanceRef.current.invalidateSize();
               }
            }, 500);
         });
      }, 100);

      return () => {
         if (detailMapInstanceRef.current) {
            detailMapInstanceRef.current.remove();
            detailMapInstanceRef.current = null;
         }
      };
   }, [showRouteDetail, waypoints, destination, courierStep]);

   // Update detail map courier marker
   useEffect(() => {
      if (detailCourierMarkerRef.current && courierPosition) {
         detailCourierMarkerRef.current.setLatLng(courierPosition);
      }
   }, [courierPosition]);


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

   // Consistent Navbar Renderer matching Landing Page
   const renderHeader = () => {
      return (
         <>
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
                  <a href="/pelanggan#home" className="hover:text-[#FF5C00] hover:-translate-y-1 transition-all">Vibes</a>
                  <a href="/pelanggan/shop" className="hover:text-[#FF5C00] hover:-translate-y-1 transition-all">Menu</a>
                  <a href="/pelanggan#about" className="hover:text-[#FF5C00] hover:-translate-y-1 transition-all">Story</a>
                  <a href="/pelanggan#contact" className="hover:text-[#FF5C00] hover:-translate-y-1 transition-all">Holla</a>
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
                              {allOrders.length === 0 ? (
                                 <p className="text-[12px] font-bold text-gray-500 text-center py-6">Belum ada orderan ngab.</p>
                              ) : (
                                 <div className="space-y-3 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
                                    {allOrders.slice(0, 10).map(o => (
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

                  {/* GPS Tracking Icon (Active State) */}
                  {customerName && (
                     <button onClick={() => window.location.href = '/pelanggan/tracking'} className="w-10 h-10 rounded-full border-2 border-[#1C120C] flex items-center justify-center bg-[#FF5C00] text-white hover:bg-[#1C120C] hover:text-[#C9E265] transition-all relative shadow-[2px_2px_0_#1C120C]" title="Lacak Pengiriman">
                        <Navigation size={18} strokeWidth={2.5} className="text-current" />
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
                        <a href="/pelanggan/login" className="px-6 py-2.5 rounded-full border-2 border-[#1C120C] font-black text-[13px] uppercase tracking-widest hover:bg-[#1C120C] hover:text-white transition-all shadow-[2px_2px_0_#1C120C] bg-white">
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
                  <a href="/pelanggan#home" onClick={() => setIsMobileMenuOpen(false)} className="hover:bg-[#FF5C00] hover:text-white transition-colors p-4 rounded-xl border-2 border-transparent hover:border-[#1C120C]">Vibes</a>
                  <a href="/pelanggan/shop" onClick={() => setIsMobileMenuOpen(false)} className="hover:bg-[#FF5C00] hover:text-white transition-colors p-4 rounded-xl border-2 border-transparent hover:border-[#1C120C]">Menu</a>
                  <a href="/pelanggan#about" onClick={() => setIsMobileMenuOpen(false)} className="hover:bg-[#FF5C00] hover:text-white transition-colors p-4 rounded-xl border-2 border-transparent hover:border-[#1C120C]">Story</a>
                  <a href="/pelanggan#contact" onClick={() => setIsMobileMenuOpen(false)} className="hover:bg-[#FF5C00] hover:text-white transition-colors p-4 rounded-xl border-2 border-transparent hover:border-[#1C120C]">Holla</a>
               </nav>
            </div>
         )}
         </>
      );
   };

   // Calculated values
   const totalDistance = useMemo(() => {
      if (!destination) return 0;
      return haversineDistance(GUDANG_COORDS[0], GUDANG_COORDS[1], destination[0], destination[1]);
   }, [destination]);

   const remainingDistance = useMemo(() => {
      if (!courierPosition || !destination) return totalDistance;
      return haversineDistance(courierPosition[0], courierPosition[1], destination[0], destination[1]);
   }, [courierPosition, destination, totalDistance]);

   const estimatedMinutes = useMemo(() => {
      // Assume ~25km/h average speed
      return Math.max(1, Math.round((remainingDistance / 25) * 60));
   }, [remainingDistance]);

   const orderCode = activeOrder ? `TRX-${String(activeOrder.id).padStart(5, '0')}` : 'TRX-00000';

   // No active orders view
   if (customerName && myOrders.length === 0) {
      return (
         <div className="min-h-screen bg-[#F4F0EA] font-sans text-[#1C120C]">
            {/* Navbar */}
            {renderHeader()}

            <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">
               <div className="w-24 h-24 rounded-[24px] bg-[#C9E265] border-4 border-[#1C120C] flex items-center justify-center mb-8 shadow-[6px_6px_0_#1C120C] transform -rotate-3">
                  <Navigation size={40} strokeWidth={3} className="text-[#1C120C]" />
               </div>
               <h2 className="text-3xl font-black text-[#1C120C] mb-3 uppercase tracking-tighter">Tidak Ada Pengiriman</h2>
               <p className="text-[#1C120C]/70 font-black text-[14px] text-center max-w-md mb-8">Belum ada pesanan dengan status pengiriman yang sedang berlangsung. Ayo jajan dulu!</p>
               <button 
                  onClick={() => window.location.href = '/pelanggan/shop'} 
                  className="bg-[#FF5C00] text-white px-8 py-4 rounded-[16px] font-black text-sm uppercase tracking-widest border-4 border-[#1C120C] shadow-[4px_4px_0_#1C120C] active:translate-y-1 active:shadow-none transition-all hover:bg-[#C9E265] hover:text-[#1C120C]"
               >
                  Pesan Sekarang
               </button>
            </div>
         </div>
      );
   }

   return (
      <div className="min-h-screen bg-[#F4F0EA] font-sans text-[#1C120C] selection:bg-[#FF5C00] selection:text-white">

         {/* Leaflet Tooltip Custom CSS */}
         <style dangerouslySetInnerHTML={{ __html: `
            .leaflet-tooltip-light {
               background: #ffffff !important;
               border: 1px solid #e5e7eb !important;
               color: #1f2937 !important;
               font-size: 11px !important;
               font-weight: 700 !important;
               padding: 4px 10px !important;
               border-radius: 8px !important;
               box-shadow: 0 4px 12px rgba(0,0,0,0.12) !important;
            }
            .leaflet-tooltip-light::before {
               border-top-color: #ffffff !important;
               border-bottom-color: #ffffff !important;
            }
            @keyframes slideInUp {
               from { opacity: 0; transform: translateY(30px); }
               to { opacity: 1; transform: translateY(0); }
            }
            .animate-slide-up {
               animation: slideInUp 0.6s ease-out forwards;
            }
            .animate-slide-up-delay {
               animation: slideInUp 0.6s ease-out 0.2s forwards;
               opacity: 0;
            }
            .animate-slide-up-delay2 {
               animation: slideInUp 0.6s ease-out 0.4s forwards;
               opacity: 0;
            }
         `}} />

         <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossOrigin="" />

         {/* --- NAVBAR --- */}
         {renderHeader()}

         {/* --- MAIN CONTENT --- */}
         <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12 py-8 space-y-8">

            {/* Back Button */}
            <button 
               onClick={() => window.location.href = '/pelanggan/shop'} 
               className="flex items-center gap-2 text-[#1C120C] font-black uppercase tracking-widest text-[12px] hover:text-[#FF5C00] transition-colors group mb-4"
            >
               <ArrowLeft size={16} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" />
               Kembali ke Shop
            </button>

            {/* ========== SECTION 1: PEMBAYARAN BERHASIL ========== */}
            <div className="bg-[#C9E265] rounded-[32px] border-4 border-[#1C120C] p-8 md:p-12 text-center shadow-[12px_12px_0_#1C120C] animate-slide-up">
               {/* Success Icon */}
               <div className="w-20 h-20 rounded-[24px] bg-white border-4 border-[#1C120C] shadow-[4px_4px_0_#1C120C] flex items-center justify-center mx-auto mb-6 transform rotate-3">
                  <CheckCircle2 size={40} strokeWidth={3} className="text-[#1C120C]" />
               </div>

               <h2 className="text-3xl md:text-4xl font-black text-[#1C120C] mb-2 uppercase tracking-tighter">Pembayaran berhasil</h2>
               <p className="text-[#1C120C]/80 font-black text-[12px] uppercase tracking-widest mb-8">Pesananmu sedang disiapkan untuk dikirim 🚀</p>

               {/* Info Pills */}
               <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <div className="bg-white border-4 border-[#1C120C] shadow-[4px_4px_0_#1C120C] rounded-[16px] px-6 py-4 min-w-[180px]">
                     <p className="text-[10px] text-[#1C120C]/60 font-black uppercase tracking-widest mb-1">Total bayar</p>
                     <p className="text-xl font-black text-[#1C120C]">Rp {(activeOrder?.total_harga || 0).toLocaleString('id-ID')}</p>
                  </div>
                  <div className="bg-white border-4 border-[#1C120C] shadow-[4px_4px_0_#1C120C] rounded-[16px] px-6 py-4 min-w-[140px]">
                     <p className="text-[10px] text-[#1C120C]/60 font-black uppercase tracking-widest mb-1">Metode</p>
                     <p className="text-xl font-black text-[#1C120C]">{activeOrder?.metode_pembayaran || 'QRIS'}</p>
                  </div>
                  <div className="bg-white border-4 border-[#1C120C] shadow-[4px_4px_0_#1C120C] rounded-[16px] px-6 py-4 min-w-[180px]">
                     <p className="text-[10px] text-[#1C120C]/60 font-black uppercase tracking-widest mb-1">No. pesanan</p>
                     <p className="text-xl font-black text-[#1C120C]">{orderCode}</p>
                  </div>
               </div>
            </div>

            {/* ========== SECTION 2: LACAK KURIR ========== */}
            <div className="bg-white rounded-[32px] border-4 border-[#1C120C] overflow-hidden shadow-[12px_12px_0_#1C120C] animate-slide-up-delay">
               <div className="flex flex-col lg:flex-row">
                  
                  {/* Left: Map */}
                  <div className="w-full lg:w-[58%] relative">
                     <div className="px-6 pt-5 pb-3 bg-[#FF5C00] border-b-4 border-[#1C120C]">
                        <h3 className="text-[16px] font-black text-white uppercase tracking-wider">Lacak kurir 📍</h3>
                     </div>
                     <div ref={mapRef} className="w-full h-[300px] md:h-[420px] bg-gray-100" />
                  </div>

                  {/* Right: Courier Info */}
                  <div className="w-full lg:w-[42%] p-6 lg:p-8 flex flex-col justify-between border-t-4 lg:border-t-0 lg:border-l-4 border-[#1C120C] bg-white">
                     <div>
                        <h3 className="text-[14px] font-black text-[#1C120C] uppercase tracking-wider mb-5">Kurir kamu</h3>
                        
                        {/* Courier Profile */}
                        <div className="flex items-center gap-4 mb-8">
                           <div className="w-14 h-14 rounded-[16px] bg-[#C9E265] border-4 border-[#1C120C] shadow-[2px_2px_0_#1C120C] text-[#1C120C] flex items-center justify-center font-black text-[16px] shrink-0 transform -rotate-3">
                              {KURIR_DATA.inisial}
                           </div>
                           <div className="flex-1">
                              <p className="font-black text-[#1C120C] text-[18px] mb-1">{KURIR_DATA.nama}</p>
                              <p className="text-[#1C120C]/60 text-[12px] font-black uppercase tracking-widest">{KURIR_DATA.kendaraan} • {KURIR_DATA.plat}</p>
                           </div>
                           <button onClick={() => {
                              let waNum = KURIR_DATA.phone.replace(/[^0-9+]/g, '');
                              if (waNum.startsWith("0")) waNum = "62" + waNum.substring(1);
                              else if (waNum.startsWith("+")) waNum = waNum.substring(1);
                              const text = `Halo kurir, saya pelanggan untuk pesanan ${orderCode}. Posisi dimana ya?`;
                              window.open(`https://wa.me/${waNum}?text=${encodeURIComponent(text)}`, '_blank');
                           }} className="w-12 h-12 rounded-[16px] border-4 border-[#1C120C] bg-white flex items-center justify-center text-[#1C120C] hover:bg-[#C9E265] active:translate-y-1 active:shadow-none transition-all shadow-[4px_4px_0_#1C120C]">
                              <Phone size={20} strokeWidth={3} />
                           </button>
                        </div>

                        {/* Estimation Card */}
                        <div className="bg-[#F4F0EA] rounded-[24px] border-4 border-[#1C120C] shadow-[4px_4px_0_#1C120C] p-6 mb-8 transform rotate-1">
                           <div className="flex items-center justify-between">
                              <div>
                                 <p className="text-[10px] text-[#FF5C00] font-black uppercase tracking-widest mb-1">Estimasi tiba</p>
                                 <p className="text-3xl font-black text-[#1C120C]">{estimatedMinutes} <span className="text-[12px] font-black text-[#1C120C]/60 uppercase tracking-widest">mnt</span></p>
                              </div>
                              <div className="text-right">
                                 <p className="text-[10px] text-[#FF5C00] font-black uppercase tracking-widest mb-1">Jarak</p>
                                 <p className="text-3xl font-black text-[#1C120C]">{remainingDistance.toFixed(1)} <span className="text-[12px] font-black text-[#1C120C]/60 uppercase tracking-widest">km</span></p>
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* Route Detail Button */}
                     <button 
                        onClick={() => setShowRouteDetail(!showRouteDetail)}
                        className="w-full border-4 border-[#1C120C] bg-white hover:bg-[#FF5C00] text-[#1C120C] hover:text-white py-4 rounded-[20px] font-black uppercase tracking-widest text-[12px] transition-all flex items-center justify-center gap-3 shadow-[4px_4px_0_#1C120C] active:translate-y-1 active:shadow-none"
                     >
                        {showRouteDetail ? 'Sembunyikan rute' : 'Lihat rute lengkap'}
                        <ChevronRight size={18} strokeWidth={3} className={`transition-transform ${showRouteDetail ? 'rotate-90' : ''}`} />
                     </button>
                  </div>
               </div>
            </div>

            {/* ========== SECTION 3: RUTE DETAIL (Expandable) ========== */}
            {showRouteDetail && (
               <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.06)] animate-slide-up-delay2">
                  <div className="flex flex-col lg:flex-row">
                     
                     {/* Left: Detail Map */}
                     <div className="w-full lg:w-[55%] relative">
                        <div className="px-6 pt-5 pb-3">
                           <h3 className="text-[15px] font-bold text-gray-800">Rute pengiriman {orderCode}</h3>
                        </div>
                        <div ref={detailMapRef} className="w-full h-[300px] md:h-[400px] bg-gray-100 border-t border-gray-100" />
                     </div>

                     {/* Right: Timeline */}
                     <div className="w-full lg:w-[45%] p-6 lg:p-8 border-t lg:border-t-0 lg:border-l border-gray-200 flex flex-col justify-between">
                        <div>
                           <h3 className="text-[15px] font-bold text-gray-800 mb-6">Riwayat perjalanan</h3>
                           
                           {/* Timeline Steps */}
                           <div className="space-y-0 relative">
                              {timeline.map((item, idx) => {
                                 const isActive = idx === courierStep;
                                 const isPassed = item.passed;
                                 const isLast = idx === timeline.length - 1;
                                 
                                 return (
                                    <div key={idx} className="flex items-start gap-4 relative pb-6">
                                       {/* Dot + Line */}
                                       <div className="flex flex-col items-center shrink-0">
                                          <div 
                                             className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                                                isActive 
                                                   ? 'bg-[#10b981] border-[#10b981] shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                                                   : isPassed
                                                      ? 'bg-[#10b981] border-[#059669]'
                                                      : 'bg-gray-300 border-gray-300'
                                             }`}
                                          />
                                          {!isLast && (
                                             <div className={`w-0.5 h-8 mt-1 ${isPassed ? 'bg-[#10b981]/30' : 'bg-gray-200'}`} />
                                          )}
                                       </div>
                                       
                                       {/* Label */}
                                       <div className="-mt-0.5">
                                          <p className={`font-bold text-[14px] leading-tight ${isActive ? 'text-gray-900' : isPassed ? 'text-gray-700' : 'text-gray-400'}`}>
                                             {item.label}
                                          </p>
                                          <p className={`text-[12px] font-medium mt-0.5 ${isActive ? 'text-[#10b981] font-bold' : 'text-gray-400'}`}>
                                             {isActive ? 'Posisi sekarang' : isPassed ? item.time : `Perkiraan ${item.time}`}
                                          </p>
                                       </div>
                                    </div>
                                 );
                              })}
                           </div>
                        </div>

                        {/* Bottom Stats */}
                        <div className="bg-[#FFFCE8] rounded-xl border border-[#8B5A2B]/30 p-5 mt-4">
                           <div className="flex items-center justify-between">
                              <div>
                                 <p className="text-[11px] text-[#B08600] font-bold">Sisa jarak</p>
                                 <p className="text-xl font-black text-gray-900">{remainingDistance.toFixed(1)} km</p>
                              </div>
                              <div className="text-right">
                                 <p className="text-[11px] text-[#B08600] font-bold">Estimasi tiba</p>
                                 <p className="text-xl font-black text-[#10b981]">{estimatedMinutes} menit</p>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {/* Order Selector (if multiple active orders) */}
            {myOrders.length > 1 && (
               <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
                  <h3 className="text-[13px] font-bold text-gray-500 mb-4">Pesanan Aktif Lainnya</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                     {myOrders.map(order => (
                        <button 
                           key={order.id}
                           onClick={() => { setActiveOrder(order); setShowRouteDetail(false); }}
                           className={`p-4 rounded-xl border-2 transition-all text-left ${
                              activeOrder?.id === order.id 
                                 ? 'border-[#8B5A2B] bg-[#FFFCE8]' 
                                 : 'border-gray-200 hover:border-gray-300 bg-white'
                           }`}
                        >
                           <p className="text-[12px] font-black text-gray-500">TRX-{String(order.id).padStart(5, '0')}</p>
                           <p className="text-[14px] font-bold text-gray-900 mt-1">Rp {(order.total_harga || 0).toLocaleString('id-ID')}</p>
                           <p className="text-[11px] text-gray-500 mt-1 truncate">{order.alamat}</p>
                        </button>
                     ))}
                  </div>
               </div>
            )}

         </div>

         {/* Floating Chat Widget */}
         <button
            onClick={() => { setIsChatOpen(!isChatOpen); setHasUnreadChat(false); }}
            className={`fixed bottom-6 right-6 md:bottom-10 md:right-10 text-white p-4 lg:p-5 rounded-full shadow-[0_15px_40px_rgba(74,222,128,0.4)] transition-transform active:scale-95 z-[90] flex items-center justify-center ${hasUnreadChat ? 'bg-red-500 hover:bg-red-600 animate-bounce' : 'bg-[#4ade80] hover:bg-green-500 hover:scale-110'}`}
         >
            <MessageCircle size={28} className="md:w-8 md:h-8" />
         </button>

         {isChatOpen && (
            <div className="fixed bottom-24 right-6 md:bottom-32 md:right-10 z-[100] w-[calc(100%-48px)] md:w-auto">
               <ChatWidget onClose={() => setIsChatOpen(false)} />
            </div>
         )}
      </div>
   );
}
