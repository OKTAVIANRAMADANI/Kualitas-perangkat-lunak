"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Swal from 'sweetalert2';
import { 
  Package, Plus, Edit2, Trash2, MessageCircle, ShoppingBag, 
  CheckCircle, Truck, Info, Settings, LayoutDashboard, 
  History, Wallet, Bell, Clock, LogOut, ChevronLeft, ChevronRight, Calendar, 
  Printer, ShoppingCart, DollarSign, Receipt, CreditCard, Moon, Sun, Phone, Search, Eye,
  MapPin
} from 'lucide-react';
import ProductModal from '../../components/ProductModal';
import ExpenseModal from '../../components/ExpenseModal';
import ChatWidget from '../../components/ChatWidget';

const API_URL = 'http://localhost:5000/api/products';
const API_ORDERS_URL = 'http://localhost:5000/api/orders';
const API_EXPENSES_URL = 'http://localhost:5000/api/expenses';
const API_USERS_URL = 'http://localhost:5000/api/users';
const BACKEND_URL = 'http://localhost:5000';
export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'stok', 'transaksi', 'pengeluaran', 'cashflow', 'riwayat_login', 'pelanggan'
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleLogout = () => {
    Swal.fire({
      title: 'Keluar?',
      text: 'Apakah Anda yakin ingin keluar dari dashboard admin?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Keluar',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        router.push('/');
      }
    });
  };
  
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const isDark = localStorage.getItem('admin_theme') === 'dark';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('admin-dark');
    } else {
      document.documentElement.classList.remove('admin-dark');
    }
    return () => {
      document.documentElement.classList.remove('admin-dark');
    };
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    localStorage.setItem('admin_theme', nextDark ? 'dark' : 'light');
    if (nextDark) {
      document.documentElement.classList.add('admin-dark');
    } else {
      document.documentElement.classList.remove('admin-dark');
    }
  };

  // States Kopi
  const [products, setProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // States Pesanan
  const [orders, setOrders] = useState([]);
  const [searchOrderQuery, setSearchOrderQuery] = useState('');
  const [viewingOrder, setViewingOrder] = useState(null);

  // States Pengeluaran
  const [expenses, setExpenses] = useState([]);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [searchExpenseQuery, setSearchExpenseQuery] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('Semua kategori');

  // New States
  const [loginHistory, setLoginHistory] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Chart States
  const [chartTab, setChartTab] = useState('pendapatan'); // 'pendapatan', 'pengeluaran', 'perbandingan'

  // General States
  const [isApiConnected, setIsApiConnected] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [directedRoom, setDirectedRoom] = useState(null);
  const [hasUnreadChat, setHasUnreadChat] = useState(false);
  const [lastChatCount, setLastChatCount] = useState(0);

  // Time state (based on mockup)
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
     const timer = setInterval(() => {
        const now = new Date();
        setCurrentTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} : ${now.getSeconds().toString().padStart(2, '0')} WIB`);
     }, 1000);
     return () => clearInterval(timer);
  }, []);

  // Polling Chat Notifikasi
  useEffect(() => {
     const checkChats = async () => {
        try {
           const res = await axios.get('http://localhost:5000/api/chats');
           const currentCount = res.data.length;
           if (!isChatOpen && currentCount > lastChatCount && lastChatCount !== 0) {
              setHasUnreadChat(true);
              
              const lastMessage = res.data[res.data.length - 1];
              if (lastMessage && lastMessage.sender !== 'Admin Kedai') {
                 // Play a premium notification chime (Web Audio API)
                 try {
                    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                    const playTone = (freq, startTime, duration) => {
                       const osc = audioCtx.createOscillator();
                       const gainNode = audioCtx.createGain();
                       osc.type = 'sine';
                       osc.frequency.setValueAtTime(freq, startTime);
                       gainNode.gain.setValueAtTime(0.15, startTime);
                       gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
                       osc.connect(gainNode);
                       gainNode.connect(audioCtx.destination);
                       osc.start(startTime);
                       osc.stop(startTime + duration);
                    };
                    playTone(783.99, audioCtx.currentTime, 0.15); // G5
                    playTone(1046.50, audioCtx.currentTime + 0.12, 0.3); // C6
                 } catch (e) {}

                 // Show Premium SweetAlert2 Toast
                 const Toast = Swal.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 5000,
                    timerProgressBar: true,
                    didOpen: (toast) => {
                       toast.addEventListener('mouseenter', Swal.stopTimer)
                       toast.addEventListener('mouseleave', Swal.resumeTimer)
                    }
                 });
                 Toast.fire({
                    icon: 'info',
                    title: `Chat dari ${lastMessage.room_id || 'Pelanggan'}`,
                    text: lastMessage.message || 'Mengirim pesan baru...'
                 });
              }
           }
           if (isChatOpen) {
              setHasUnreadChat(false);
           }
           setLastChatCount(currentCount);
        } catch (e) {}
     };
     checkChats();
     const interval = setInterval(checkChats, 3000);
     return () => clearInterval(interval);
  }, [isChatOpen, lastChatCount]);

  const fetchSemuaData = async () => {
    try {
      const resProd = await axios.get(API_URL);
      setProducts(resProd.data);
      
      const resOrder = await axios.get(API_ORDERS_URL);
      setOrders(resOrder.data);

      const resExpense = await axios.get(API_EXPENSES_URL);
      setExpenses(resExpense.data);
      
      const resHistory = await axios.get(API_USERS_URL + '/history');
      setLoginHistory(resHistory.data);

      const resUsers = await axios.get(API_USERS_URL);
      setCustomers(resUsers.data);

      setIsApiConnected(true);
    } catch (error) {
      console.warn("Backend API belum menyala.");
      setIsApiConnected(false);
      // Fallback
      setProducts([{ _id: 'temp-1', nama: 'Kopi Putih', kategori: 'Mentah', deskripsi: 'Kopi putih segar', harga: 5000, jumlah_stok: 120 }]);
      setOrders([{ id: 'mock-1', nama_pelanggan: 'Pelanggan Simulasi', no_wa: '0812345678', pesanan: '[{"nama":"Kopi Putih","jumlah":5,"harga":5000}]', total_harga: 25000, metode_pembayaran: 'COD', metode_pengiriman: 'Diantar Kedai', status: 'Pending', created_at: new Date() }]);
      setExpenses([
        { id: 1, tanggal: '2025-12-22T12:00:00', kategori: 'Listrik', deskripsi: 'Bayar listrik bulan desember', nominal: 850000, pengguna: 'Owner' },
      ]);
      setLoginHistory([
         { id: 1, username: 'Pelanggan Simulasi', action: 'LOGIN', created_at: new Date() }
      ]);
      setCustomers([
         { id: 1, username: 'Pelanggan Simulasi', email: 'simulasi@gmail.com', phone: '0812345678', created_at: new Date() }
      ]);
    }
  };

  useEffect(() => {
    fetchSemuaData();
    
    // Auto-update dashboard & pesanan data every 7 seconds
    const intervalId = setInterval(() => {
       fetchSemuaData();
    }, 7000);
    
    return () => clearInterval(intervalId);
  }, []);

  const handleDeleteProduct = async (id) => {
    const result = await Swal.fire({
      title: 'Hapus stok?',
      text: "Data yang dihapus tidak dapat dikembalikan!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal'
    });
    if(result.isConfirmed) {
      try {
        if (isApiConnected && !String(id).startsWith('temp-')) {
          await axios.delete(`${API_URL}/${id}`);
        }
        setProducts(products.filter(p => p._id !== id));
        Swal.fire('Terhapus!', 'Stok kopi berhasil dihapus.', 'success');
      } catch (error) {
        console.error("Gagal menghapus", error);
        Swal.fire('Gagal!', 'Terjadi kesalahan saat menghapus.', 'error');
      }
    }
  };

  const handleOpenModal = (product = null) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleUpdateOrderStatus = async (id, newStatus) => {
    try {
      if (isApiConnected) {
        await axios.put(`${API_ORDERS_URL}/${id}`, { status: newStatus });
      }
      setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Status Pesanan Diperbarui',
        showConfirmButton: false,
        timer: 1500
      });
    } catch (error) {
      console.error("Gagal update status", error);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Gagal update status',
        showConfirmButton: false,
        timer: 1500
      });
    }
  };

  const handleVerifyPayment = async (id) => {
    const result = await Swal.fire({
      title: 'Verifikasi Pembayaran?',
      text: "Pastikan dana sudah masuk ke rekening/e-wallet Anda sebelum memverifikasi pesanan ini.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10B981',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, Dana Masuk (Proses)',
      cancelButtonText: 'Batal'
    });
    if(result.isConfirmed) {
      handleUpdateOrderStatus(id, 'Proses');
    }
  };

  const handleDeleteOrder = async (id) => {
    const result = await Swal.fire({
      title: 'Tolak/Hapus pesanan?',
      text: "Pesanan ini akan dihapus dari riwayat!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal'
    });
    if(result.isConfirmed) {
      try {
        if (isApiConnected) {
          await axios.delete(`${API_ORDERS_URL}/${id}`);
        }
        setOrders(orders.filter(o => o.id !== id));
        Swal.fire('Terhapus!', 'Pesanan berhasil dihapus.', 'success');
      } catch (error) {
        console.error("Gagal menghapus pesanan", error);
        Swal.fire('Gagal!', 'Terjadi kesalahan saat menghapus.', 'error');
      }
    }
  };

  const handleDeleteExpense = async (id) => {
    const result = await Swal.fire({
      title: 'Hapus pengeluaran?',
      text: "Catatan pengeluaran ini akan dihapus!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal'
    });
    if(result.isConfirmed) {
      try {
        if (isApiConnected) {
          await axios.delete(`${API_EXPENSES_URL}/${id}`);
        }
        setExpenses(expenses.filter(e => e.id !== id));
        Swal.fire('Terhapus!', 'Catatan pengeluaran berhasil dihapus.', 'success');
      } catch (error) {
        console.error("Gagal menghapus pengeluaran", error);
        Swal.fire('Gagal!', 'Terjadi kesalahan saat menghapus.', 'error');
      }
    }
  };

  const handleOpenExpenseModal = (expense = null) => {
    setEditingExpense(expense);
    setIsExpenseModalOpen(true);
  };

  const parsePesananJSON = (str, totalHarga) => {
    if (Array.isArray(str)) return str;
    if (typeof str === 'object' && str !== null) return [str];
    if (!str) return [];
    
    let firstParsed = str;
    try {
      if (typeof str === 'string') {
        let parsed = JSON.parse(str);
        if (typeof parsed === 'string') {
          firstParsed = parsed;
        } else if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      firstParsed = str;
    }

    try {
      let finalParsed = JSON.parse(firstParsed);
      return Array.isArray(finalParsed) ? finalParsed : [];
    } catch (e) {
      // Fallback for truncated/malformed JSON strings (due to TEXT column limit)
      try {
        const items = [];
        const cleanStr = firstParsed.replace(/\\"/g, '"'); // Normalize quotes
        const objectTokens = cleanStr.split(/\{/);
        for (let token of objectTokens) {
          const namaMatch = token.match(/"nama"\s*:\s*"([^"]+)"/);
          if (namaMatch) {
            const jumlahMatch = token.match(/"jumlah"\s*:\s*([0-9]+)/);
            const hargaMatch = token.match(/"harga"\s*:\s*([0-9]+)/);
            const satuanMatch = token.match(/"satuan"\s*:\s*"([^"]+)"/);
            
            items.push({
              nama: namaMatch[1],
              jumlah: jumlahMatch ? parseInt(jumlahMatch[1], 10) : 1,
              harga: hargaMatch ? parseInt(hargaMatch[1], 10) : 0,
              satuan: satuanMatch ? satuanMatch[1] : ''
            });
          }
        }
        
        // Smart quantity estimation for single-item truncated orders
        if (items.length === 1 && totalHarga && items[0].harga > 0) {
          const estimatedQty = Math.round(totalHarga / items[0].harga);
          if (estimatedQty > 0) {
            items[0].jumlah = estimatedQty;
          }
        }
        return items;
      } catch (err) {
        return [];
      }
    }
  };

  /* ---- DYNAMIC STATISTICS CALCULATOR ---- */
  const pesananPending = orders.filter(o => o.status === 'Pending').length;
  const completedOrders = orders.filter(o => o.status === 'Selesai');
  
  const validTotalTransaksi = completedOrders.length;
  const validTotalPendapatan = completedOrders.reduce((acc, curr) => acc + curr.total_harga, 0);
  
  // Gunakan data pengeluaran asli jika tersedia
  const validTotalPengeluaran = expenses.reduce((acc, curr) => acc + curr.nominal, 0); 
  const validLabaKotor = validTotalPendapatan - validTotalPengeluaran;

  // Menyiapkan Data Metode Pembayaran (Grafik Donat)
  const pieCounts = completedOrders.reduce((acc, curr) => {
     let method = curr.metode_pembayaran || 'Tunai';
     if (method === 'COD') method = 'Tunai'; // Mapping COD ke Tunai
     acc[method] = (acc[method] || 0) + 1;
     return acc;
  }, {});
  
  const pieTotal = validTotalTransaksi || 1; // cegah bagi nol
  const pctTunai = ((pieCounts['Tunai'] || 0) / pieTotal) * 100;
  const pctQRIS = ((pieCounts['QRIS'] || 0) / pieTotal) * 100;
  const pctDebit = ((pieCounts['Debit'] || pieCounts['Transfer'] || 0) / pieTotal) * 100;

  // Filter Search
  const filteredOrders = orders.filter(o => 
     o.nama_pelanggan.toLowerCase().includes(searchOrderQuery.toLowerCase()) || 
     o.id.toString().includes(searchOrderQuery)
  );

  // Ambil semua kategori unik dari data pengeluaran untuk filter
  const uniqueCategories = ['Semua kategori', ...new Set(expenses.map(e => e.kategori))];

  // Menyiapkan Data Harian 6 Hari Terakhir untuk Line & Bar Chart
  const dailyData = Array.from({length: 6}).map((_, i) => {
     const d = new Date();
     d.setDate(d.getDate() - (5 - i));
     const dateString = d.toLocaleDateString('en-CA'); // 'YYYY-MM-DD' standar
     
     const thatDayOrders = completedOrders.filter(o => {
        const oDate = new Date(o.created_at);
        return oDate.toLocaleDateString('en-CA') === dateString;
     });
     const sum = thatDayOrders.reduce((a, b) => a + b.total_harga, 0);
     
     const thatDayExpenses = expenses.filter(e => {
        const eDate = new Date(e.tanggal);
        return eDate.toLocaleDateString('en-CA') === dateString;
     });
     const sumExp = thatDayExpenses.reduce((a, b) => a + b.nominal, 0);

     return {
        label: d.toLocaleDateString('id-ID', { day:'numeric', month:'short'}), // Misal: 10 Nov
        fullDate: d.toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric'}),
        value: sum,
        pengeluaran: sumExp
     };
  });

  const maxChartValue = Math.max(...dailyData.map(d => d.value), 500000); // Bumper 500k agar grafik tidak terlalu ceper
  
  // Helper generate exact path SVG line
  // W=1000, H=200 max.
  const stepX = 1000 / 5;
  
  // Pendapatan Points
  const pointsInc = dailyData.map((d, i) => {
     const x = i * stepX;
     const y = 200 - ((d.value / maxChartValue) * 180); 
     return `${x},${y}`;
  });

  // Pengeluaran Points
  const pointsExp = dailyData.map((d, i) => {
     const x = i * stepX;
     const y = 200 - ((d.pengeluaran / maxChartValue) * 180);
     return `${x},${y}`;
  });

  const getLinePath = (pts) => {
     if (pts.length === 0) return "";
     return `M ${pts[0]} ` + pts.slice(1).map((p, i) => {
        const prevArr = pts[i].split(',');
        const currArr = p.split(',');
        const cp1x = parseInt(prevArr[0]) + (stepX / 2);
        const cp2x = parseInt(currArr[0]) - (stepX / 2);
        return `C ${cp1x},${prevArr[1]} ${cp2x},${currArr[1]} ${currArr[0]},${currArr[1]}`;
     }).join(' ');
  };

  const linePathInc = getLinePath(pointsInc);
  const linePathExp = getLinePath(pointsExp);

  return (
    <div className={`min-h-screen flex font-sans transition-all duration-300 selection:bg-[#FF5C00] selection:text-white ${darkMode ? 'bg-[#1C120C] text-[#F4F0EA]' : 'bg-[#F4F0EA] text-[#1C120C]'}`}>
      
      {/* --- SIDEBAR --- */}
      <aside className={`bg-white flex flex-col justify-between border-r-4 border-[#1C120C] shadow-[4px_0_0_#1C120C] fixed h-full z-20 transition-all duration-300 ${
         isSidebarCollapsed ? 'w-[90px]' : 'w-[280px]'
      }`}>
         
         <div>
            {/* Logo Section */}
            <div className={`h-[100px] flex items-center border-b-4 border-[#1C120C] mb-6 transition-all duration-300 relative ${
               isSidebarCollapsed ? 'px-4 justify-center' : 'px-6 justify-between'
            }`}>
               <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-[45px] h-[45px] rounded-full bg-[#FF5C00] flex items-center justify-center border-4 border-[#1C120C] shadow-[4px_4px_0_#1C120C] shrink-0 transform -rotate-3">
                     <ShoppingCart size={22} className="text-white" fill="white" strokeWidth={2} />
                  </div>
                  {!isSidebarCollapsed && (
                     <div className="leading-tight animate-in fade-in duration-300">
                        <h2 className="text-[#1C120C] font-black text-[18px] uppercase tracking-tighter">Pos System</h2>
                        <p className="text-[#FF5C00] text-[10px] font-black uppercase tracking-widest">Admin</p>
                     </div>
                  )}
               </div>
               <button 
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
                  className={`bg-[#C9E265] text-[#1C120C] rounded-full p-2 border-2 border-[#1C120C] hover:bg-[#FF5C00] hover:text-white transition-all shadow-[2px_2px_0_#1C120C] shrink-0 active:translate-y-1 active:shadow-none ${
                     isSidebarCollapsed ? 'absolute left-[62px] top-[30px] z-30 w-8 h-8 flex items-center justify-center' : ''
                  }`}
                  title={isSidebarCollapsed ? "Buka Sidebar" : "Tutup Sidebar"}
               >
                  {isSidebarCollapsed ? <ChevronRight size={18} strokeWidth={3} /> : <ChevronLeft size={18} strokeWidth={3} />}
               </button>
            </div>

            {/* Menu Links */}
            <div className="px-5 space-y-3">
               <button 
                  onClick={() => setActiveTab('dashboard')} 
                  className={`w-full flex items-center rounded-[16px] font-black uppercase tracking-wider transition-all text-[12px] border-2 border-transparent ${
                     isSidebarCollapsed ? 'px-0 justify-center h-12' : 'px-4 py-3 gap-3'
                  } ${activeTab === 'dashboard' ? 'bg-[#FF5C00] text-white border-[#1C120C] shadow-[4px_4px_0_#1C120C]' : 'text-[#1C120C] hover:bg-[#F4F0EA] hover:border-[#1C120C]'}`}
               >
                  <LayoutDashboard size={20} strokeWidth={3} className="shrink-0" />
                  {!isSidebarCollapsed && <span className="animate-in fade-in duration-300 mt-0.5">Laporan</span>}
               </button>
               <button 
                  onClick={() => setActiveTab('stok')} 
                  className={`w-full flex items-center rounded-[16px] font-black uppercase tracking-wider transition-all text-[12px] border-2 border-transparent ${
                     isSidebarCollapsed ? 'px-0 justify-center h-12' : 'px-4 py-3 gap-3'
                  } ${activeTab === 'stok' ? 'bg-[#C9E265] text-[#1C120C] border-[#1C120C] shadow-[4px_4px_0_#1C120C]' : 'text-[#1C120C] hover:bg-[#F4F0EA] hover:border-[#1C120C]'}`}
               >
                  <Package size={20} strokeWidth={3} className="shrink-0" />
                  {!isSidebarCollapsed && <span className="animate-in fade-in duration-300 mt-0.5">Barang & Stok</span>}
               </button>
               <button 
                  onClick={() => setActiveTab('transaksi')} 
                  className={`w-full flex items-center rounded-[16px] font-black uppercase tracking-wider transition-all text-[12px] border-2 border-transparent relative ${
                     isSidebarCollapsed ? 'px-0 justify-center h-12' : 'px-4 py-3 gap-3'
                  } ${activeTab === 'transaksi' ? 'bg-[#FF5C00] text-white border-[#1C120C] shadow-[4px_4px_0_#1C120C]' : 'text-[#1C120C] hover:bg-[#F4F0EA] hover:border-[#1C120C]'}`}
               >
                  <History size={20} strokeWidth={3} className="shrink-0" />
                  {!isSidebarCollapsed && <span className="animate-in fade-in duration-300 mt-0.5">Riwayat Transaksi</span>}
                  {pesananPending > 0 && (
                     <span className={`text-[10px] flex items-center justify-center rounded-full font-black border-2 border-[#1C120C] ${
                        isSidebarCollapsed ? 'absolute top-0 right-0 w-5 h-5' : 'w-6 h-6 ml-auto'
                     } ${activeTab === 'transaksi' ? 'bg-white text-[#FF5C00]' : 'bg-[#C9E265] text-[#1C120C]'}`}>
                        {pesananPending}
                     </span>
                  )}
               </button>
               <button 
                  onClick={() => setActiveTab('pengeluaran')} 
                  className={`w-full flex items-center rounded-[16px] font-black uppercase tracking-wider transition-all text-[12px] border-2 border-transparent ${
                     isSidebarCollapsed ? 'px-0 justify-center h-12' : 'px-4 py-3 gap-3'
                  } ${activeTab === 'pengeluaran' ? 'bg-[#C9E265] text-[#1C120C] border-[#1C120C] shadow-[4px_4px_0_#1C120C]' : 'text-[#1C120C] hover:bg-[#F4F0EA] hover:border-[#1C120C]'}`}
               >
                  <Wallet size={20} strokeWidth={3} className="shrink-0" />
                  {!isSidebarCollapsed && <span className="animate-in fade-in duration-300 mt-0.5">Pengeluaran</span>}
               </button>
               <button 
                  onClick={() => setActiveTab('cashflow')} 
                  className={`w-full flex items-center rounded-[16px] font-black uppercase tracking-wider transition-all text-[12px] border-2 border-transparent ${
                     isSidebarCollapsed ? 'px-0 justify-center h-12' : 'px-4 py-3 gap-3'
                  } ${activeTab === 'cashflow' ? 'bg-[#FF5C00] text-white border-[#1C120C] shadow-[4px_4px_0_#1C120C]' : 'text-[#1C120C] hover:bg-[#F4F0EA] hover:border-[#1C120C]'}`}
               >
                  <DollarSign size={20} strokeWidth={3} className="shrink-0" />
                  {!isSidebarCollapsed && <span className="animate-in fade-in duration-300 mt-0.5">Arus Kas</span>}
               </button>
               <button 
                  onClick={() => setActiveTab('pelanggan')} 
                  className={`w-full flex items-center rounded-[16px] font-black uppercase tracking-wider transition-all text-[12px] border-2 border-transparent ${
                     isSidebarCollapsed ? 'px-0 justify-center h-12' : 'px-4 py-3 gap-3'
                  } ${activeTab === 'pelanggan' ? 'bg-[#C9E265] text-[#1C120C] border-[#1C120C] shadow-[4px_4px_0_#1C120C]' : 'text-[#1C120C] hover:bg-[#F4F0EA] hover:border-[#1C120C]'}`}
               >
                  <Settings size={20} strokeWidth={3} className="shrink-0" />
                  {!isSidebarCollapsed && <span className="animate-in fade-in duration-300 mt-0.5">Pelanggan</span>}
               </button>
               <button 
                  onClick={() => setActiveTab('riwayat_login')} 
                  className={`w-full flex items-center rounded-[16px] font-black uppercase tracking-wider transition-all text-[12px] border-2 border-transparent ${
                     isSidebarCollapsed ? 'px-0 justify-center h-12' : 'px-4 py-3 gap-3'
                  } ${activeTab === 'riwayat_login' ? 'bg-[#FF5C00] text-white border-[#1C120C] shadow-[4px_4px_0_#1C120C]' : 'text-[#1C120C] hover:bg-[#F4F0EA] hover:border-[#1C120C]'}`}
               >
                  <History size={20} strokeWidth={3} className="shrink-0" />
                  {!isSidebarCollapsed && <span className="animate-in fade-in duration-300 mt-0.5">Riwayat Login</span>}
               </button>
            </div>
         </div>

         {/* Bottom Action Area */}
         <div className={`border-t-4 border-[#1C120C] p-6 flex flex-col transition-all duration-300 bg-[#F4F0EA] ${
            isSidebarCollapsed ? 'px-2 items-center gap-4' : 'gap-6'
         }`}>
            <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center w-full' : 'justify-between'}`}>
               {!isSidebarCollapsed && (
                  <div className="flex items-center gap-3 text-sm font-bold text-gray-800 animate-in fade-in duration-300">
                     {darkMode ? <Moon size={18} /> : <Sun size={18} />} Mode Tampilan
                  </div>
               )}
               <button 
                  onClick={toggleDarkMode}
                  className={`rounded-lg flex items-center justify-center transition-all ${
                     isSidebarCollapsed ? 'w-10 h-10' : 'w-8 h-8'
                  } ${
                     darkMode ? 'bg-gray-800 text-[#8B5A2B] hover:bg-gray-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  title={darkMode ? "Aktifkan Mode Terang" : "Aktifkan Mode Gelap"}
               >
                  {darkMode ? <Sun size={16} strokeWidth={3} /> : <Moon size={16} strokeWidth={3} />}
               </button>
            </div>
            <button 
               onClick={handleLogout}
               className={`flex items-center text-sm font-bold text-red-500 hover:text-red-700 transition-colors ${
                  isSidebarCollapsed ? 'justify-center w-10 h-10 rounded-lg hover:bg-red-50 font-bold' : 'gap-3'
               }`}
               title="Keluar"
            >
               <LogOut size={18} strokeWidth={2.5} className="rotate-180 shrink-0" />
               {!isSidebarCollapsed && <span className="animate-in fade-in duration-300">Keluar</span>}
            </button>
         </div>

      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className={`w-full p-8 pt-4 min-h-screen transition-all duration-300 ${
         isSidebarCollapsed ? 'ml-[80px]' : 'ml-[280px]'
      }`}>
         
         {/* Top Header Row (Based strictly on mockup) */}
         <div className="flex justify-between items-end mb-6">
            <div>
               <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
                  {activeTab === 'dashboard' ? 'Laporan' : 
                   activeTab === 'stok' ? 'Barang & Stok' : 
                   activeTab === 'transaksi' ? 'Riwayat Tranksaksi' : 
                   activeTab === 'pengeluaran' ? 'Pengeluaran' : 
                   activeTab === 'cashflow' ? 'Arus Kas (Cashflow)' : 
                   activeTab === 'pelanggan' ? 'Manajemen Pelanggan' : 'Riwayat Login Pelanggan'}
               </h1>
               <p className="text-gray-500 text-sm font-medium mt-1">Analisa keuangan dan performa kedai.</p>
            </div>

            <div className="flex items-center gap-5">
               <div onClick={() => { setIsChatOpen(true); setDirectedRoom(null); setHasUnreadChat(false); }} className={`w-12 h-12 rounded-xl flex items-center justify-center text-[#5A7CFF] shadow-sm relative cursor-pointer transition-all ${hasUnreadChat ? 'bg-red-100 animate-bounce' : 'bg-gray-200 hover:bg-gray-300'}`}>
                  <Bell size={24} fill="currentColor" strokeWidth={1} />
                  {hasUnreadChat && <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>}
               </div>

               <div className="bg-gray-200 px-6 py-2 rounded-xl flex items-center justify-center text-gray-700 text-sm font-bold h-12">
                  <span className="text-black font-semibold mr-1">Waktu</span> <br/>
                  <span className="text-[12px]">{currentTime || "Loading..."}</span>
               </div>

               <div className="bg-gray-200 px-4 py-2 rounded-xl flex items-center gap-3 h-12 cursor-pointer shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-[#5A7CFF] shadow-inner"></div>
                  <div className="text-xs">
                     <p className="font-bold text-gray-800 mb-0.5 leading-none">Danzz</p>
                     <p className="text-gray-500 font-semibold leading-none">Admin</p>
                  </div>
               </div>
            </div>
         </div>

         {/* WHITE CONTENT WRAPPER */}
         <div className="bg-white w-full rounded-[20px] shadow-sm p-8 min-h-[80vh] border border-gray-100">
            
            {/* === RENDER: DASHBOARD (MOCKUP VIEW) === */}
            {activeTab === 'dashboard' && (
               <div className="animate-in fade-in duration-500">
                  
                  {/* Dashboard Top Controls */}
                  <div className="flex justify-between items-center mb-8">
                     <button className="flex items-center gap-2 border-2 border-gray-300 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors text-gray-700">
                        <Calendar size={18} strokeWidth={2.5}/> Filter periode
                     </button>
                     <button className="flex items-center gap-2 border border-[#5A7CFF] text-[#5A7CFF] px-5 py-2.5 rounded-xl font-bold text-sm bg-blue-50/50 hover:bg-blue-100 transition-colors">
                        <Printer size={18} /> Cetak Laporan
                     </button>
                  </div>

                  {/* 4 Summary Cards - Transaksi, Pendapatan, Pengeluaran, Penghasilan */}
                  <div className="grid grid-cols-4 gap-6 mb-10">
                     <div className="border-4 border-[#1C120C] rounded-[24px] p-6 flex flex-col gap-4 bg-[#C9E265] transition-all hover:-translate-y-2 shadow-[8px_8px_0_#1C120C]">
                        <div className="w-14 h-14 rounded-full bg-white border-4 border-[#1C120C] flex items-center justify-center text-[#1C120C] shadow-[4px_4px_0_#1C120C]">
                           <ShoppingCart size={24} strokeWidth={3} />
                        </div>
                        <div>
                           <p className="text-[12px] font-black text-[#1C120C] uppercase tracking-widest mb-1">Total Transaksi</p>
                           <p className="text-3xl font-black text-[#1C120C]">{validTotalTransaksi}</p>
                        </div>
                     </div>

                     <div className="border-4 border-[#1C120C] rounded-[24px] p-6 flex flex-col gap-4 bg-[#FF5C00] transition-all hover:-translate-y-2 shadow-[8px_8px_0_#1C120C]">
                        <div className="w-14 h-14 rounded-full bg-white border-4 border-[#1C120C] flex items-center justify-center text-[#1C120C] shadow-[4px_4px_0_#1C120C]">
                           <DollarSign size={24} strokeWidth={3} />
                        </div>
                        <div>
                           <p className="text-[12px] font-black text-white uppercase tracking-widest mb-1">Total Pendapatan</p>
                           <p className="text-2xl font-black text-white">Rp {(validTotalPendapatan).toLocaleString('id-ID')}</p>
                        </div>
                     </div>

                     <div className="border-4 border-[#1C120C] rounded-[24px] p-6 flex flex-col gap-4 bg-white transition-all hover:-translate-y-2 shadow-[8px_8px_0_#1C120C]">
                        <div className="w-14 h-14 rounded-full bg-[#1C120C] border-4 border-[#1C120C] flex items-center justify-center text-white shadow-[4px_4px_0_#FF5C00]">
                           <Receipt size={24} strokeWidth={3} />
                        </div>
                        <div>
                           <p className="text-[12px] font-black text-[#1C120C] uppercase tracking-widest mb-1">Total Pengeluaran</p>
                           <p className="text-2xl font-black text-[#1C120C]">Rp {(validTotalPengeluaran).toLocaleString('id-ID')}</p>
                        </div>
                     </div>

                     <div className={`border-4 rounded-[24px] p-6 flex flex-col gap-4 transition-all hover:-translate-y-2 shadow-[8px_8px_0_#1C120C] ${validLabaKotor >= 0 ? 'bg-[#F4F0EA] border-[#1C120C]' : 'bg-red-100 border-red-500'}`}>
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center border-4 shadow-[4px_4px_0_#1C120C] ${validLabaKotor >= 0 ? 'bg-green-400 border-[#1C120C] text-[#1C120C]' : 'bg-red-500 border-red-800 text-white'}`}>
                           <Wallet size={24} strokeWidth={3} />
                        </div>
                        <div>
                           <p className={`text-[12px] font-black uppercase tracking-widest mb-1 ${validLabaKotor >= 0 ? 'text-[#1C120C]' : 'text-red-700'}`}>Total Penghasilan</p>
                           <p className={`text-2xl font-black ${validLabaKotor >= 0 ? 'text-[#1C120C]' : 'text-red-700'}`}>Rp {(validLabaKotor).toLocaleString('id-ID')}</p>
                        </div>
                     </div>
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex gap-2 mb-6">
                     <button 
                        onClick={() => setChartTab('pendapatan')}
                        className={`px-5 py-2 rounded-lg font-bold text-sm shadow-md transition-all ${chartTab === 'pendapatan' ? 'bg-[#5A7CFF] text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                     >
                        Pendapatan
                     </button>
                     <button 
                        onClick={() => setChartTab('pengeluaran')}
                        className={`px-5 py-2 rounded-lg font-bold text-sm shadow-md transition-all ${chartTab === 'pengeluaran' ? 'bg-red-500 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                     >
                        Pengeluaran
                     </button>
                     <button 
                        onClick={() => setChartTab('perbandingan')}
                        className={`px-5 py-2 rounded-lg font-bold text-sm shadow-md transition-all ${chartTab === 'perbandingan' ? 'bg-purple-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                     >
                        Perbandingan
                     </button>
                  </div>

                  {/* Top Chart Area (Line Chart) */}
                  <div className="border border-gray-200 rounded-xl p-6 mb-6">
                     <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-gray-800 text-sm">
                           {chartTab === 'pendapatan' ? 'Pendapatan Harian' : chartTab === 'pengeluaran' ? 'Pengeluaran Harian' : 'Perbandingan Pendapatan vs Pengeluaran'}
                        </h3>
                        <div className="flex items-center gap-4">
                           {chartTab === 'perbandingan' && (
                              <div className="flex items-center gap-3 text-[10px] font-bold">
                                 <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#5A7CFF]"></div> Pendapatan</div>
                                 <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500"></div> Pengeluaran</div>
                              </div>
                           )}
                           <p className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">Update Realtime (Hari Ini)</p>
                        </div>
                     </div>
                     
                     <div className="w-full h-[250px] relative mt-4">
                        {/* Grid lines */}
                        <div className="absolute inset-0 flex flex-col justify-between">
                           {[maxChartValue, maxChartValue*0.75, maxChartValue*0.5, maxChartValue*0.25, 0].map((val, i) => (
                              <div key={i} className="flex items-center text-[10px] text-gray-300 font-medium">
                                 <div className="w-16 shrink-0">Rp {(val/1000).toLocaleString('id-ID')}k</div>
                                 <div className="w-full h-px border-t border-dashed border-gray-200"></div>
                              </div>
                           ))}
                        </div>
                        {/* Dynamic Line Path */}
                        <svg className="absolute inset-0 w-full h-full pl-16 pt-[2px]" preserveAspectRatio="none" viewBox="0 0 1000 250">
                           {/* Income Line */}
                           {(chartTab === 'pendapatan' || chartTab === 'perbandingan') && (
                              <path d={linePathInc} fill="none" stroke="#5A7CFF" strokeWidth="2.5" className="animate-[dash_2s_ease-out]" />
                           )}
                           
                           {/* Expense Line */}
                           {(chartTab === 'pengeluaran' || chartTab === 'perbandingan') && (
                              <path d={linePathExp} fill="none" stroke="#EF4444" strokeWidth="2.5" className="animate-[dash_2s_ease-out]" />
                           )}
                           
                           {/* Data Pointers - Income */}
                           {(chartTab === 'pendapatan' || chartTab === 'perbandingan') && pointsInc.map((p, i) => {
                              const arr = p.split(',');
                              const isToday = i === dailyData.length - 1;
                              return (
                                 <g key={`inc-${i}`}>
                                    <circle cx={arr[0]} cy={arr[1]} r="4" fill={isToday ? "#0C2052" : "white"} stroke="#5A7CFF" strokeWidth="2" className="cursor-pointer hover:r-6 hover:fill-[#0C2052] transition-all" />
                                 </g>
                              );
                           })}

                           {/* Data Pointers - Expense */}
                           {(chartTab === 'pengeluaran' || chartTab === 'perbandingan') && pointsExp.map((p, i) => {
                              const arr = p.split(',');
                              const isToday = i === dailyData.length - 1;
                              return (
                                 <g key={`exp-${i}`}>
                                    <circle cx={arr[0]} cy={arr[1]} r="4" fill={isToday ? "#991B1B" : "white"} stroke="#EF4444" strokeWidth="2" className="cursor-pointer hover:r-6 hover:fill-[#991B1B] transition-all" />
                                 </g>
                              );
                           })}
                        </svg>

                        {/* Beautiful Dynamic Tooltip */}
                        <div className="absolute right-[0] top-[0] bg-[#0B1E43] text-white px-4 py-2 rounded mt-2 shadow-lg z-10 w-max text-xs after:content-[''] after:absolute after:bottom-0 after:translate-y-full after:left-1/2 after:-translate-x-1/2 after:border-[6px] after:border-transparent after:border-t-[#0B1E43]">
                           <p className="font-bold mb-1">{dailyData[dailyData.length - 1].fullDate}</p>
                           <div className="space-y-1">
                              {(chartTab === 'pendapatan' || chartTab === 'perbandingan') && (
                                 <div className="flex items-center gap-1.5"><div className="w-1 h-3 bg-[#5A7CFF]"></div> Pendapatan: Rp. {dailyData[dailyData.length - 1].value.toLocaleString('id-ID')}</div>
                              )}
                              {(chartTab === 'pengeluaran' || chartTab === 'perbandingan') && (
                                 <div className="flex items-center gap-1.5"><div className="w-1 h-3 bg-red-500"></div> Pengeluaran: Rp. {dailyData[dailyData.length - 1].pengeluaran.toLocaleString('id-ID')}</div>
                              )}
                           </div>
                        </div>

                        {/* X-axis labels */}
                        <div className="absolute bottom-[-20px] left-16 right-0 flex justify-between text-[10px] text-gray-400 font-bold px-1 items-center">
                           {dailyData.map((d, i) => <span key={i}>{d.label}</span>)}
                        </div>
                     </div>
                  </div>

                  {/* Bottom Panels Layout */}
                  <div className="grid grid-cols-5 gap-6">
                     
                     {/* Panel Kiri: Donut Chart Dynamic */}
                     <div className="col-span-2 border border-gray-200 rounded-xl p-6">
                        <h3 className="font-bold text-gray-800 text-sm mb-6">Metode Pembayaran (Aktif)</h3>
                        <div className="flex items-center gap-6 justify-center lg:justify-between py-2">
                           
                           {/* Tailwind CSS Conic Gradient Donut Dynamic */}
                           <div className="w-[130px] h-[130px] shrink-0 rounded-full flex items-center justify-center shadow-inner" 
                                style={{ background: `conic-gradient(#10B981 0% ${pctTunai}%, #F59E0B ${pctTunai}% ${pctTunai+pctQRIS}%, #0EA5E9 ${pctTunai+pctQRIS}% 100%)` }}>
                              <div className="w-[70px] h-[70px] bg-white rounded-full"></div>
                           </div>

                           <ul className="space-y-4 pr-1">
                              <li className="flex items-center justify-between text-xs font-bold gap-6"><div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#10B981]"></span> Tunai/COD</div> <span>{pieCounts['Tunai'] || 0} ({(pctTunai).toFixed(1)}%)</span></li>
                              <li className="flex items-center justify-between text-xs font-bold gap-6"><div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#F59E0B]"></span> QRIS</div> <span>{pieCounts['QRIS'] || 0} ({(pctQRIS).toFixed(1)}%)</span></li>
                              <li className="flex items-center justify-between text-xs font-bold gap-6"><div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#0EA5E9]"></span> Transfer</div> <span>{pieCounts['Debit'] || pieCounts['Transfer'] || 0} ({(pctDebit).toFixed(1)}%)</span></li>
                           </ul>
                        </div>
                     </div>

                     {/* Panel Kanan: Bar Chart Dynamic */}
                     <div className="col-span-3 border border-gray-200 rounded-xl p-6">
                        <h3 className="font-bold text-gray-800 text-sm mb-6">Pendapatan vs Pengeluaran Sepekan</h3>
                        <div className="w-full h-[150px] relative mt-2">
                           {/* Grid lines */}
                           <div className="absolute inset-0 flex flex-col justify-between">
                              {[maxChartValue, maxChartValue*0.75, maxChartValue*0.5, maxChartValue*0.25, 0].map((val, i) => (
                                 <div key={i} className="flex items-center text-[8px] text-gray-400 font-bold">
                                    <div className="w-10 shrink-0">{val === 0 ? '0' : `${(val/1000).toFixed(0)}k`}</div>
                                    <div className="w-full h-px border-t border-dashed border-gray-200"></div>
                                 </div>
                              ))}
                           </div>
                           
                           {/* CSS Flex Bar Chart DYNAMIC */}
                           <div className="absolute inset-0 pl-10 pr-2 flex justify-between items-end">
                              {dailyData.map((d, i) => {
                                 let pHeight = Math.max((d.value / maxChartValue) * 100, 2); // min 2%
                                 let kHeight = Math.max((d.pengeluaran / maxChartValue) * 100, 2);
                                 return (
                                    <div key={i} className="flex gap-1 items-end h-full">
                                       <div className="w-5 md:w-8 bg-[#16A34A] rounded-t-sm hover:opacity-80 transition-opacity cursor-pointer group relative" style={{height: `${pHeight}%`}}>
                                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-black text-white text-[8px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 pointer-events-none">Rp {(d.value/1000).toLocaleString('id-ID')}k</div>
                                       </div>
                                       <div className="w-5 md:w-8 bg-[#DC2626] rounded-t-sm hover:opacity-80 transition-opacity cursor-pointer group relative" style={{height: `${kHeight}%`}}>
                                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-black text-white text-[8px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 pointer-events-none">Rp {(d.pengeluaran/1000).toLocaleString('id-ID')}k</div>
                                       </div>
                                    </div>
                                 );
                              })}
                           </div>

                           <div className="absolute bottom-[-20px] left-10 right-2 flex justify-between text-[9px] text-gray-500 font-bold">
                              {dailyData.map((d, i) => <span key={i} className="text-center">{d.label.split(' ')[0]} {d.label.split(' ')[1]}</span>)}
                           </div>
                        </div>
                     </div>
                  </div>

               </div>
            )}

            {/* === RENDER: STOK KOPI === */}
            {activeTab === 'stok' && (
               <div className="animate-in fade-in duration-300">
                  
                  {/* Top Action Buttons */}
                  <div className="flex justify-end items-center gap-3 mb-6">
                     <button className="flex items-center gap-2 border border-[#5A7CFF] text-[#5A7CFF] px-5 py-2.5 rounded-lg font-bold text-[13px] bg-white hover:bg-blue-50 transition-colors">
                        <Printer size={16} /> Ekspor PDF
                     </button>
                     <button onClick={() => handleOpenModal()} className="bg-[#5A7CFF] text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-bold text-[13px] shadow hover:bg-blue-600 transition-colors">
                        <Plus size={18} strokeWidth={2.5} /> Tambah Barang
                     </button>
                  </div>

                  {/* Alert Warning */}
                  <div className={`text-[13px] font-bold px-4 py-3 rounded-lg flex items-center gap-2 mb-6 shadow-sm border ${
                     darkMode ? 'bg-amber-950/40 border-amber-900/50 text-[#fbbf24]' : 'bg-[#FFFCE8] border-[#FBE597] text-[#B08600]'
                  }`}>
                     <Package size={16} /> 1 barang memiliki stok di bawah
                  </div>

                  {/* Filter & Search Controls */}
                  <div className="flex flex-col md:flex-row gap-4 mb-4">
                     <div className="relative shrink-0">
                        <select className="appearance-none border border-gray-200 rounded-lg px-4 py-2.5 pr-10 text-[13px] text-gray-700 outline-none w-full md:w-36 bg-white font-medium cursor-pointer">
                           <option>Semua kategori</option>
                           <option>Kopi Mentah</option>
                        </select>
                        <ChevronLeft size={16} className="absolute right-3 top-1/2 -translate-y-1/2 -rotate-90 text-gray-400 pointer-events-none"/>
                     </div>

                     <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                           <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </div>
                        <input type="text" className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-[13px] outline-none text-gray-700 placeholder-gray-400 font-medium bg-[#FCFCFD]" placeholder="Cari nama atau kode barang..." />
                     </div>
                  </div>

                  {/* Table Layout Exact Match */}
                  <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white mb-4">
                     <table className="w-full text-left min-w-[800px]">
                        <thead>
                           <tr className="border-b border-gray-200 bg-white">
                              <th className="p-4 text-[12px] font-black text-black">Kode Barang</th>
                              <th className="p-4 text-[12px] font-black text-black">Nama Barang</th>
                              <th className="p-4 text-[12px] font-black text-black">Satuan</th>
                              <th className="p-4 text-[12px] font-black text-black">Harga Jual</th>
                              <th className="p-4 text-[12px] font-black text-black">Stok</th>
                              <th className="p-4 text-[12px] font-black text-black">Min. Stok</th>
                              <th className="p-4 text-[12px] font-black text-black">Status</th>
                              <th className="p-4 text-[12px] font-black text-black text-center">Aksi</th>
                           </tr>
                        </thead>
                        <tbody className="text-[12px]">
                           {products.length === 0 ? (
                              <tr><td colSpan="8" className="p-10 text-center text-gray-400 font-medium">Data barang kosong.</td></tr>
                           ) : (
                              products.map((item, index) => (
                                 <tr key={item._id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                                    <td className="p-4 text-gray-600 font-medium">{item.kode_barang || `BRG-00${index + 1}`}</td>
                                    <td className="p-4 text-gray-600 font-medium">{item.nama}</td>
                                    <td className="p-4 text-gray-600 font-medium">{item.satuan || 'Bungkus'}</td>
                                    <td className="p-4 text-gray-600 font-medium">Rp.{(item.harga).toLocaleString('id-ID')}</td>
                                    <td className="p-4 text-gray-600 font-medium">{item.jumlah_stok}</td>
                                    <td className="p-4 text-gray-600 font-medium">{item.min_stok || 10}</td>
                                    <td className="p-4">
                                       <span className="bg-[#5A7CFF] border border-[#3e64f4] text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-sm">
                                          {(item.status_aktif !== false) ? 'Aktif' : 'Non-Aktif'}
                                       </span>
                                    </td>
                                    <td className="p-4 flex justify-center gap-4">
                                       <button onClick={() => handleOpenModal(item)} className="text-[#5A7CFF] hover:text-blue-800 transition-colors" title="Edit">
                                          <Edit2 size={16} strokeWidth={2}/>
                                       </button>
                                       <button onClick={() => handleDeleteProduct(item._id)} className="text-red-500 hover:text-red-700 transition-colors" title="Hapus">
                                          <Trash2 size={16} strokeWidth={2}/>
                                       </button>
                                    </td>
                                 </tr>
                              ))
                           )}
                        </tbody>
                     </table>
                  </div>

                  {/* Table Footer */}
                  <div className="border border-gray-200 rounded-lg bg-white px-4 py-3 flex items-center text-[11px] text-gray-500 font-medium">
                     Menampilkan 1 - {products.length} dari {products.length} data
                  </div>
               </div>
            )}

            {/* === RENDER: PESANAN MASUK === */}
            {activeTab === 'transaksi' && (
               <div className="animate-in fade-in duration-300">
                  
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                     <div className="border border-gray-200 rounded-xl p-5 flex items-center gap-5 bg-white shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-full bg-[#fae8ff] flex items-center justify-center text-[#c026d3]">
                           <ShoppingCart size={22} fill="currentColor" strokeWidth={1} />
                        </div>
                        <div>
                           <p className="text-[12px] font-bold text-[#c026d3] uppercase tracking-wide">Total transaksi</p>
                           <p className="text-2xl font-black text-[#c026d3]">{orders.length}</p>
                        </div>
                     </div>
                     <div className="border border-gray-200 rounded-xl p-5 flex items-center gap-5 bg-white shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-full bg-[#e0f2fe] flex items-center justify-center text-[#0284c7]">
                           <DollarSign size={22} strokeWidth={2.5} />
                        </div>
                        <div>
                           <p className="text-[12px] font-bold text-[#0284c7] uppercase tracking-wide">Total penjualan</p>
                           <p className="text-xl font-black text-[#0284c7]">Rp {orders.reduce((acc, curr) => acc + curr.total_harga, 0).toLocaleString('id-ID')}</p>
                        </div>
                     </div>
                     <div className="border border-gray-200 rounded-xl p-5 flex items-center gap-5 bg-white shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-full bg-[#dcfce7] flex items-center justify-center text-[#16a34a]">
                           <Wallet size={22} fill="currentColor" strokeWidth={1} />
                        </div>
                        <div>
                           <p className="text-[12px] font-bold text-[#16a34a] uppercase tracking-wide">Laba kotor</p>
                           <p className="text-xl font-black text-[#16a34a]">Rp {(orders.reduce((acc, curr) => acc + curr.total_harga, 0) * 0.4).toLocaleString('id-ID')}</p>
                        </div>
                     </div>
                  </div>

                  {/* Toolbars */}
                  <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                     <button className="flex items-center gap-2 border border-gray-200 bg-white shadow-sm px-4 py-2.5 rounded-lg font-bold text-[13px] text-gray-700 hover:bg-gray-50 transition-colors">
                        <Calendar size={18} className="text-gray-500" strokeWidth={2}/> Filter periode
                     </button>
                     <div className="relative w-full md:w-[350px]">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                           type="text" 
                           value={searchOrderQuery}
                           onChange={(e) => setSearchOrderQuery(e.target.value)}
                           placeholder="Cari nama atau resi transaksi..." 
                           className="w-full pl-10 pr-4 py-2.5 border border-gray-200 shadow-sm rounded-lg text-[13px] outline-none font-medium text-gray-700 focus:border-[#5A7CFF]" 
                        />
                     </div>
                  </div>

                  {/* Table Layout Data Transaksi */}
                  <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white shadow-sm mb-4">
                     <table className="w-full text-left min-w-[1050px]">
                        <thead>
                           <tr className="border-b border-gray-200 bg-white">
                              <th className="p-4 py-5 text-[12px] font-black text-black">No. Transaksi</th>
                              <th className="p-4 py-5 text-[12px] font-black text-black">Tanggal/Jam</th>
                              <th className="p-4 py-5 text-[12px] font-black text-black">Pelanggan</th>
                              <th className="p-4 py-5 text-[12px] font-black text-black text-center">Total Item</th>
                              <th className="p-4 py-5 text-[12px] font-black text-black">Total Pembayaran</th>
                              <th className="p-4 py-5 text-[12px] font-black text-black">Metode Bayar</th>
                              <th className="p-4 py-5 text-[12px] font-black text-black">Status</th>
                              <th className="p-4 py-5 text-[12px] font-black text-black text-center">Aksi</th>
                           </tr>
                        </thead>
                        <tbody className="text-[12px]">
                           {filteredOrders.length === 0 ? (
                              <tr><td colSpan="8" className="p-10 text-center text-gray-400 font-medium tracking-wide">Belum ada riwayat transaksi.</td></tr>
                           ) : (
                              filteredOrders.map(order => (
                                 <tr key={order.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/80 transition-colors">
                                    <td className="p-4 text-gray-600 font-bold uppercase tracking-wide">TRX-2026-{String(order.id).padStart(3, '0')}</td>
                                    <td className="p-4 text-gray-600 font-medium">
                                       {new Date(order.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }).replace(',', '')}
                                    </td>
                                    <td className="p-4 text-gray-800 font-bold">{order.nama_pelanggan}</td>
                                    <td className="p-4 text-center font-bold text-gray-800 tracking-wider">
                                       {parsePesananJSON(order.pesanan, order.total_harga).reduce((a, c) => a + (c.jumlah || 1), 0)}
                                    </td>
                                    <td className="p-4 text-gray-600 font-medium tracking-wide">Rp {(order.total_harga || 0).toLocaleString('id-ID')}</td>
                                    <td className="p-4 text-gray-600 font-medium">{order.metode_pembayaran || "Tunai"}</td>
                                    <td className="p-4">
                                       {['QRIS', 'Transfer', 'Online'].includes(order.metode_pembayaran) && order.status === 'Pending' ? (
                                          <button 
                                             onClick={() => handleVerifyPayment(order.id)}
                                             className="text-[11px] font-bold px-4 py-1.5 rounded-full bg-yellow-400 text-yellow-900 border border-yellow-500 hover:bg-yellow-500 hover:text-white transition-colors shadow-sm flex items-center gap-1"
                                          >
                                             <CheckCircle size={14} /> Verifikasi
                                          </button>
                                       ) : (
                                          <select 
                                             value={order.status || 'Pending'}
                                             onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                             className={`text-[11px] font-bold px-3 py-1.5 rounded-full outline-none cursor-pointer border shadow-sm ${
                                                   order.status === 'Selesai' ? 'bg-[#5A7CFF] text-white border-[#5A7CFF]' : 
                                                   order.status === 'Pending' ? 
                                                      (darkMode ? 'bg-amber-950/45 text-[#fbbf24] border-amber-900/50' : 'bg-[#FFF2CC] text-[#B08600] border-[#FBE597]') : 
                                                      (darkMode ? 'bg-blue-950/45 text-blue-400 border-blue-900/50' : 'bg-blue-100 text-blue-600 border-blue-200')
                                             }`}
                                          >
                                             <option value="Pending">Menunggu</option>
                                             <option value="Proses">Diproses</option>
                                             <option value="Selesai">Lunas</option>
                                          </select>
                                       )}
                                    </td>
                                    <td className="p-4 flex justify-center items-center gap-3">
                                       <button onClick={() => setViewingOrder(order)} className="text-[#5A7CFF] hover:bg-blue-50 p-1.5 rounded transition-colors" title="Lihat">
                                          <Eye size={18} strokeWidth={2.5} />
                                       </button>
                                       <button onClick={() => { setIsChatOpen(true); setDirectedRoom(order.nama_pelanggan); }} className="text-[#10B981] hover:bg-green-50 p-1.5 rounded transition-colors" title="Chat">
                                          <MessageCircle size={18} strokeWidth={2.5}/>
                                       </button>
                                       <button onClick={() => handleDeleteOrder(order.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors" title="Hapus">
                                          <Trash2 size={18} strokeWidth={2.5}/>
                                       </button>
                                    </td>
                                 </tr>
                              ))
                           )}
                        </tbody>
                     </table>
                  </div>

                  {/* Pagination/Status Footer */}
                  <div className="text-[12px] text-gray-500 font-medium px-2 py-1">
                     Menampilkan 1 - {filteredOrders.length} dari {orders.length} data
                  </div>
               </div>
            )}
            
            {/* === RENDER: PENGELUARAN === */}
            {activeTab === 'pengeluaran' && (
               <div className="animate-in fade-in duration-300">
                  
                  {/* Top Action Buttons */}
                  <div className="flex justify-end items-center gap-3 mb-6">
                     <button className="flex items-center gap-2 border border-[#5A7CFF] text-[#5A7CFF] px-5 py-2.5 rounded-lg font-bold text-[13px] bg-white hover:bg-blue-50 transition-colors">
                        <Printer size={16} /> Cetak Pengeluaran
                     </button>
                     <button onClick={() => handleOpenExpenseModal()} className="bg-[#1A4594] text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-bold text-[13px] shadow hover:bg-blue-900 transition-colors">
                        <Plus size={18} strokeWidth={2.5} /> Tambah Pengeluaran
                     </button>
                  </div>

                  {/* Summary Card Pengeluaran */}
                  <div className={`border rounded-xl p-6 mb-6 flex justify-between items-center relative overflow-hidden transition-all duration-300 ${
                     darkMode ? 'bg-red-950/40 border-red-900/50' : 'bg-[#FFF5F5] border-[#FFDADA]'
                  }`}>
                     <div>
                        <p className={`text-[12px] font-bold uppercase mb-1 ${darkMode ? 'text-red-400' : 'text-red-500'}`}>Total pengeluaran</p>
                        <p className={`text-3xl font-black ${darkMode ? 'text-red-400' : 'text-red-600'}`}>Rp {validTotalPengeluaran.toLocaleString('id-ID')}</p>
                     </div>
                     <div className="text-right">
                        <p className={`text-sm font-bold px-3 py-1 rounded-full border ${
                           darkMode ? 'text-red-400 bg-red-950/20 border-red-900/30' : 'text-red-500 bg-white/50 border-red-100'
                        }`}>{expenses.length} Pengeluaran tercatat</p>
                     </div>
                     {/* Decorative background circle */}
                     <div className="absolute -right-10 -top-10 w-32 h-32 bg-red-100/30 rounded-full blur-2xl"></div>
                  </div>

                  {/* Filter & Search Controls */}
                  <div className="flex flex-col md:flex-row gap-4 mb-6">
                     <div className="relative shrink-0">
                        <select 
                           value={expenseCategoryFilter}
                           onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                           className="appearance-none border border-gray-200 rounded-lg px-4 py-2.5 pr-10 text-[13px] text-gray-700 outline-none w-full md:w-44 bg-white font-medium cursor-pointer focus:border-[#5A7CFF]"
                        >
                           {uniqueCategories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                           ))}
                        </select>
                        <ChevronLeft size={16} className="absolute right-3 top-1/2 -translate-y-1/2 -rotate-90 text-gray-400 pointer-events-none"/>
                     </div>

                     <div className="relative shrink-0">
                        <button className="flex items-center gap-2 border border-gray-200 bg-white px-4 py-2.5 rounded-lg font-medium text-[13px] text-gray-600 hover:bg-gray-50 transition-colors w-full md:w-auto">
                           <Calendar size={16} className="text-gray-400" /> Filter periode
                        </button>
                     </div>

                     <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                           <Search size={16} className="text-gray-400" />
                        </div>
                        <input 
                           type="text" 
                           value={searchExpenseQuery}
                           onChange={(e) => setSearchExpenseQuery(e.target.value)}
                           className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-lg text-[13px] outline-none text-gray-700 placeholder-gray-400 font-medium bg-[#FCFCFD] focus:border-[#5A7CFF]" 
                           placeholder="Cari deskripsi pengeluaran..." 
                        />
                     </div>
                  </div>

                  {/* Table Layout Pengeluaran */}
                  <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white shadow-sm mb-4">
                     <table className="w-full text-left min-w-[900px]">
                        <thead>
                           <tr className="border-b border-gray-200 bg-gray-50/50">
                              <th className="p-4 py-5 text-[12px] font-black text-gray-700 uppercase tracking-wider">Tanggal</th>
                              <th className="p-4 py-5 text-[12px] font-black text-gray-700 uppercase tracking-wider">Kategori pengeluaran</th>
                              <th className="p-4 py-5 text-[12px] font-black text-gray-700 uppercase tracking-wider">Deskripsi</th>
                              <th className="p-4 py-5 text-[12px] font-black text-gray-700 uppercase tracking-wider text-right">Nominal</th>
                              <th className="p-4 py-5 text-[12px] font-black text-gray-700 uppercase tracking-wider">Pengguna</th>
                              <th className="p-4 py-5 text-[12px] font-black text-gray-700 uppercase tracking-wider text-center">Aksi</th>
                           </tr>
                        </thead>
                        <tbody className="text-[13px]">
                           {expenses.length === 0 ? (
                              <tr><td colSpan="6" className="p-12 text-center text-gray-400 font-medium">Belum ada data pengeluaran.</td></tr>
                           ) : (
                              expenses
                                 .filter(e => expenseCategoryFilter === 'Semua kategori' || e.kategori === expenseCategoryFilter)
                                 .filter(e => e.deskripsi.toLowerCase().includes(searchExpenseQuery.toLowerCase()))
                                 .map((exp) => (
                                 <tr key={exp.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                                    <td className="p-4 text-gray-600 font-medium">
                                       {new Date(exp.tanggal).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }).replace(',', '')}
                                    </td>
                                    <td className="p-4">
                                       <span className={`px-4 py-1.5 rounded-full text-[11px] font-bold text-white shadow-sm
                                          ${exp.kategori === 'Listrik' ? 'bg-[#C2782F]' : 
                                            exp.kategori === 'Gaji' ? 'bg-[#28A745]' : 
                                            exp.kategori === 'Perlengkapan' ? 'bg-[#A316C9]' : 
                                            exp.kategori === 'Sewa' ? 'bg-[#1D61F2]' : 'bg-[#6C757D]'}`}>
                                          {exp.kategori}
                                       </span>
                                    </td>
                                    <td className="p-4 text-gray-700 font-medium max-w-[250px] truncate">{exp.deskripsi}</td>
                                    <td className="p-4 text-right font-bold text-red-500">Rp {exp.nominal.toLocaleString('id-ID')}</td>
                                    <td className="p-4 text-gray-600 font-bold">{exp.pengguna}</td>
                                    <td className="p-4 flex justify-center gap-4">
                                       <button onClick={() => handleOpenExpenseModal(exp)} className="text-[#5A7CFF] hover:bg-blue-50 p-1.5 rounded transition-all" title="Edit">
                                          <Edit2 size={16} strokeWidth={2.5}/>
                                       </button>
                                       <button onClick={() => handleDeleteExpense(exp.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded transition-all" title="Hapus">
                                          <Trash2 size={16} strokeWidth={2.5}/>
                                       </button>
                                    </td>
                                 </tr>
                              ))
                           )}
                        </tbody>
                     </table>
                  </div>

                  {/* Table Footer */}
                  <div className="flex justify-between items-center px-2 py-1">
                     <p className="text-[12px] text-gray-400 font-bold tracking-tight">Menampilkan 1 - {expenses.length} dari {expenses.length} data</p>
                  </div>
               </div>
            )}

            {/* === RENDER: ARUS KAS (CASHFLOW) === */}
            {activeTab === 'cashflow' && (
               <div className="animate-in fade-in duration-300">
                  <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white shadow-sm mb-4">
                     <table className="w-full text-left min-w-[900px]">
                        <thead>
                           <tr className="border-b border-gray-200 bg-gray-50/50">
                              <th className="p-4 py-5 text-[12px] font-black text-gray-700 uppercase tracking-wider">Tanggal</th>
                              <th className="p-4 py-5 text-[12px] font-black text-gray-700 uppercase tracking-wider">Tipe</th>
                              <th className="p-4 py-5 text-[12px] font-black text-gray-700 uppercase tracking-wider">Deskripsi</th>
                              <th className="p-4 py-5 text-[12px] font-black text-gray-700 uppercase tracking-wider text-right">Uang Masuk</th>
                              <th className="p-4 py-5 text-[12px] font-black text-gray-700 uppercase tracking-wider text-right">Uang Keluar</th>
                              <th className="p-4 py-5 text-[12px] font-black text-gray-700 uppercase tracking-wider text-right">Saldo</th>
                           </tr>
                        </thead>
                        <tbody className="text-[13px]">
                           {(() => {
                              const cashflowItems = [
                                 ...completedOrders.map(o => ({ date: new Date(o.created_at), type: 'Masuk', desc: `Pesanan TRX-2026-${String(o.id).padStart(3, '0')} (${o.nama_pelanggan})`, amount: o.total_harga })),
                                 ...expenses.map(e => ({ date: new Date(e.tanggal), type: 'Keluar', desc: e.deskripsi, amount: e.nominal }))
                              ].sort((a, b) => a.date - b.date);

                              if (cashflowItems.length === 0) return <tr><td colSpan="6" className="p-10 text-center text-gray-400 font-medium">Belum ada data arus kas.</td></tr>;

                              let balance = 0;
                              return cashflowItems.map((item, idx) => {
                                 if (item.type === 'Masuk') balance += item.amount;
                                 else balance -= item.amount;
                                 return (
                                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                       <td className="p-4 text-gray-600 font-medium">{item.date.toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }).replace(',', '')}</td>
                                       <td className="p-4">
                                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold shadow-sm ${
                                             item.type === 'Masuk' ? 
                                                (darkMode ? 'bg-green-950/40 text-green-400' : 'bg-green-100 text-green-700') : 
                                                (darkMode ? 'bg-red-950/40 text-red-400' : 'bg-red-100 text-red-700')
                                          }`}>{item.type}</span>
                                       </td>
                                       <td className="p-4 text-gray-700 font-medium">{item.desc}</td>
                                       <td className="p-4 text-right font-bold text-green-600">{item.type === 'Masuk' ? `Rp ${item.amount.toLocaleString('id-ID')}` : '-'}</td>
                                       <td className="p-4 text-right font-bold text-red-500">{item.type === 'Keluar' ? `Rp ${item.amount.toLocaleString('id-ID')}` : '-'}</td>
                                       <td className="p-4 text-right font-black text-gray-800">Rp {balance.toLocaleString('id-ID')}</td>
                                    </tr>
                                 );
                              });
                           })()}
                        </tbody>
                     </table>
                  </div>
               </div>
            )}

            {/* === RENDER: RIWAYAT LOGIN === */}
            {activeTab === 'riwayat_login' && (
               <div className="animate-in fade-in duration-300">
                  <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white shadow-sm mb-4">
                     <table className="w-full text-left min-w-[700px]">
                        <thead>
                           <tr className="border-b border-gray-200 bg-gray-50/50">
                              <th className="p-4 py-5 text-[12px] font-black text-gray-700 uppercase tracking-wider">Waktu</th>
                              <th className="p-4 py-5 text-[12px] font-black text-gray-700 uppercase tracking-wider">Pengguna</th>
                              <th className="p-4 py-5 text-[12px] font-black text-gray-700 uppercase tracking-wider">Aktivitas</th>
                           </tr>
                        </thead>
                        <tbody className="text-[13px]">
                           {loginHistory.length === 0 ? (
                              <tr><td colSpan="3" className="p-10 text-center text-gray-400 font-medium">Belum ada data riwayat login.</td></tr>
                           ) : (
                              loginHistory.map((log) => (
                                 <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                    <td className="p-4 text-gray-600 font-medium">{new Date(log.created_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'medium' })}</td>
                                    <td className="p-4 text-gray-800 font-bold">{log.username}</td>
                                    <td className="p-4">
                                       <span className={`px-3 py-1 rounded-full text-[10px] font-bold shadow-sm ${
                                          log.action === 'LOGIN' ? 
                                             (darkMode ? 'bg-blue-950/40 text-blue-400' : 'bg-blue-100 text-blue-700') : 
                                              (darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-700')
                                       }`}>{log.action === 'LOGIN' ? 'Masuk' : 'Keluar'}</span>
                                    </td>
                                 </tr>
                              ))
                           )}
                        </tbody>
                     </table>
                  </div>
               </div>
            )}

            {/* === RENDER: PELANGGAN === */}
            {activeTab === 'pelanggan' && (
               <div className="animate-in fade-in duration-300">
                  <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white shadow-sm mb-4">
                     <table className="w-full text-left min-w-[700px]">
                        <thead>
                           <tr className="border-b border-gray-200 bg-gray-50/50">
                              <th className="p-4 py-5 text-[12px] font-black text-gray-700 uppercase tracking-wider">Nama/Username</th>
                              <th className="p-4 py-5 text-[12px] font-black text-gray-700 uppercase tracking-wider">Email</th>
                              <th className="p-4 py-5 text-[12px] font-black text-gray-700 uppercase tracking-wider">No HP</th>
                              <th className="p-4 py-5 text-[12px] font-black text-gray-700 uppercase tracking-wider text-center">Aksi</th>
                           </tr>
                        </thead>
                        <tbody className="text-[13px]">
                           {customers.length === 0 ? (
                              <tr><td colSpan="4" className="p-10 text-center text-gray-400 font-medium">Belum ada pelanggan terdaftar.</td></tr>
                           ) : (
                              customers.map((c) => (
                                 <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                    <td className="p-4 text-gray-800 font-bold">{c.username}</td>
                                    <td className="p-4 text-gray-600 font-medium">{c.email}</td>
                                    <td className="p-4 text-gray-600 font-medium">{c.phone || '-'}</td>
                                    <td className="p-4 flex justify-center">
                                       <button 
                                          onClick={async () => {
                                             const { value: newPassword } = await Swal.fire({
                                                title: 'Reset Password',
                                                input: 'text',
                                                inputLabel: `Masukkan sandi baru untuk ${c.username}`,
                                                inputPlaceholder: 'Misal: sandi123',
                                                showCancelButton: true,
                                                inputValidator: (value) => {
                                                   if (!value) return 'Sandi tidak boleh kosong!'
                                                }
                                             });
                                             if (newPassword) {
                                                try {
                                                   await axios.put(`${API_USERS_URL}/${c.id}/password`, { password: newPassword });
                                                   Swal.fire('Berhasil!', `Sandi untuk ${c.username} telah direset menjadi: ${newPassword}`, 'success');
                                                } catch (err) {
                                                   Swal.fire('Gagal', 'Terjadi kesalahan saat mereset sandi', 'error');
                                                }
                                             }
                                          }}
                                          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all border ${
                                              darkMode ? 'bg-amber-950/45 text-[#fbbf24] border-amber-900/50 hover:bg-amber-900/60' : 'bg-[#FBE597] text-[#B08600] border-transparent hover:bg-[#F9D95B]'
                                           }`}
                                       >
                                          <Settings size={16} /> Reset Sandi
                                       </button>
                                    </td>
                                 </tr>
                              ))
                           )}
                        </tbody>
                     </table>
                  </div>
               </div>
            )}

         </div>
      </main>

      {/* Render Modal Component Kopi */}
      {isChatOpen && <div className="fixed bottom-10 right-10 z-50 animate-in zoom-in-95 shadow-2xl rounded-2xl overflow-hidden"><ChatWidget onClose={() => setIsChatOpen(false)} isAdmin={true} initialRoom={directedRoom} /></div>}
      
      {/* Modal Detail Order untuk Table View */}
      {viewingOrder && (
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-[500px] overflow-hidden flex flex-col">
               <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <h3 className="font-black text-gray-900 text-lg">Detail Transaksi TRX-2026-{String(viewingOrder.id).padStart(3, '0')}</h3>
                  <button onClick={() => setViewingOrder(null)} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
               </div>
               <div className="p-6">
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4 bg-blue-50/50 p-4 rounded-xl border border-gray-100">
                     <div><p className="text-gray-500 text-[10px] font-bold uppercase mb-0.5">Pelanggan</p><p className="font-bold text-gray-800">{viewingOrder.nama_pelanggan}</p></div>
                     <div><p className="text-gray-500 text-[10px] font-bold uppercase mb-0.5">Kontak WhatsApp</p><p className="font-bold text-gray-800">{viewingOrder.no_wa}</p></div>
                     <div><p className="text-gray-500 text-[10px] font-bold uppercase mb-0.5">Metode Bayar</p><p className="font-bold text-[#1967D2]">{viewingOrder.metode_pembayaran || 'Tunai'}</p></div>
                     <div><p className="text-gray-500 text-[10px] font-bold uppercase mb-0.5">Pengiriman</p><p className="font-bold text-[#D21919]">{viewingOrder.metode_pengiriman || 'Ambil Sendiri'}</p></div>
                  </div>

                  {(() => {
                     const parseAlamat = (alamatStr) => {
                        if (!alamatStr) return { detail: 'Alamat tidak diinput (Format Lama)', wilayah: '', tipe: '' };
                        const match = alamatStr.match(/^(.*?)\s*\((.*?)\)$/s);
                        if (match) {
                           const detail = match[1].trim();
                           const wilayah = match[2].trim();
                           let tipe = 'Wilayah Lain';
                           if (wilayah.toLowerCase().includes('dekat kedai')) {
                              tipe = 'Dekat Kedai';
                           } else if (wilayah.toLowerCase().includes('luar area')) {
                              tipe = 'Luar Area Kedai';
                           }
                           return { detail, wilayah, tipe };
                        }
                        return { detail: alamatStr.trim(), wilayah: '', tipe: '' };
                     };

                     const { detail, wilayah, tipe } = parseAlamat(viewingOrder.alamat);

                     return (
                        <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-200/80 mb-6 flex gap-3 shadow-sm hover:border-gray-300 transition-all duration-300">
                           <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500 shrink-0 border border-red-100 shadow-sm mt-0.5">
                              <MapPin size={18} className="animate-bounce" />
                           </div>
                           <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1.5 gap-2">
                                 <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Alamat Pengiriman / Patokan</p>
                                 {tipe && (
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border shrink-0 ${
                                       tipe === 'Dekat Kedai' 
                                          ? 'bg-green-50 text-green-700 border-green-200' 
                                          : 'bg-orange-50 text-orange-700 border-orange-200'
                                    }`}>
                                       {tipe}
                                    </span>
                                 )}
                              </div>
                              <p className="text-[13px] font-black text-gray-800 leading-snug break-words">{detail}</p>
                              {wilayah && (
                                 <p className="text-[11px] font-bold text-gray-500 mt-1 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0"></span>
                                    {wilayah}
                                 </p>
                              )}
                           </div>
                        </div>
                     );
                  })()}
                  
                  <h4 className="font-black text-gray-800 mb-3 text-sm">Daftar Belanja</h4>
                  <div className="border border-gray-100 rounded-lg p-3 max-h-[160px] overflow-y-auto mb-4">
                     <ul className="text-[13px] space-y-2">
                        {parsePesananJSON(viewingOrder.pesanan, viewingOrder.total_harga).map((it, idx) => {
                           const namaBarang = it.nama || it.nama_barang || 'Produk';
                           const jumlahBarang = it.jumlah || 1;
                           const hargaBarang = it.harga || it.harga_jual || 0;
                           const satuanBarang = it.satuan || '';
                           return (
                              <li key={idx} className="flex justify-between items-center text-gray-700 border-b border-dashed border-gray-100 pb-2 last:border-0 last:pb-0">
                                 <div>
                                    <span className="font-black text-[#5A7CFF] mr-2">{jumlahBarang}x</span>
                                    <span className="font-semibold">{namaBarang}</span>
                                    {satuanBarang && <span className="text-xs text-gray-400 ml-1">({satuanBarang})</span>}
                                 </div>
                                 <span className="font-black text-gray-900">Rp {(hargaBarang * jumlahBarang).toLocaleString('id-ID')}</span>
                              </li>
                           );
                        })}
                     </ul>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-200 pt-4 mt-2">
                     <span className="font-bold text-gray-400">Total Pembayaran Tertagih</span>
                     <span className="font-black text-2xl text-green-500">Rp {(viewingOrder.total_harga || 0).toLocaleString('id-ID')}</span>
                  </div>
                  {viewingOrder.bukti_pembayaran && (
                     <div className="mt-4 border-t border-gray-100 pt-4">
                        <h4 className="font-black text-gray-800 mb-3 text-sm">Bukti Pembayaran</h4>
                        <a 
                           href={viewingOrder.bukti_pembayaran.startsWith('/uploads') ? `${BACKEND_URL}${viewingOrder.bukti_pembayaran}` : viewingOrder.bukti_pembayaran} 
                           target="_blank" 
                           rel="noopener noreferrer"
                        >
                           <img 
                              src={viewingOrder.bukti_pembayaran.startsWith('/uploads') ? `${BACKEND_URL}${viewingOrder.bukti_pembayaran}` : viewingOrder.bukti_pembayaran} 
                              alt="Bukti Pembayaran" 
                              className="w-full max-h-[300px] object-contain bg-gray-100 rounded-lg border border-gray-200 hover:opacity-90 transition-opacity"
                              onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
                           />
                           <div style={{display:'none'}} className="w-full h-24 bg-gray-100 rounded-lg border border-gray-200 items-center justify-center text-gray-400 text-sm font-medium">
                              Gambar tidak dapat dimuat
                           </div>
                        </a>
                     </div>
                  )}
               </div>
               <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                  <button onClick={() => setViewingOrder(null)} className="w-full bg-[#5A7CFF] hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition-colors">Tutup Detail</button>
               </div>
            </div>
         </div>
      )}

      {isModalOpen && (
        <ProductModal 
          product={editingProduct} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={(newData) => { 
            fetchSemuaData(); 
            setIsModalOpen(false); 
          }} 
          isApiConnected={isApiConnected}
        />
      )}

      {isExpenseModalOpen && (
        <ExpenseModal 
          expense={editingExpense} 
          onClose={() => setIsExpenseModalOpen(false)} 
          onSuccess={(newData) => { 
            fetchSemuaData(); 
            setIsExpenseModalOpen(false); 
          }} 
          isApiConnected={isApiConnected}
        />
      )}
    </div>
  );
}
