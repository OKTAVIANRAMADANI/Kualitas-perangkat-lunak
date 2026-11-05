"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import { 
  User, Mail, Lock, ArrowRight, ShieldCheck, CheckCircle2, ChevronRight, 
  LogIn, Phone, MessageSquare, KeyRound, Smartphone, ShoppingBag, ShoppingCart, 
  Search, Plus, Minus, Trash2, X, Menu, Star, Coffee, Sparkles, AlertCircle, LogOut, Navigation, Bell, MessageCircle 
} from 'lucide-react';
import Swal from 'sweetalert2';

const API_PRODUCTS_URL = 'http://localhost:5000/api/products';
const API_ORDERS_URL = 'http://localhost:5000/api/orders';

// High quality coffee fallback pictures
const DEFAULT_COFFEE_IMAGES = [
  "https://images.unsplash.com/photo-1559525839-b184a4d698c7?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1587734195503-904fca47e0e9?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1611162458324-aae1eb4129a4?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1579888944111-c917bfd3ebbe?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1461023058943-0708e5bc3a2d?q=80&w=800&auto=format&fit=crop"
];

// Intersection Observer Hook for scroll animations
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

export default function GenZLandingPage() {
  const router = useRouter();

  // User State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  
  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('login'); // 'login', 'register', 'admin'
  const [registerStep, setRegisterStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [otpMethod, setOtpMethod] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [staffRole, setStaffRole] = useState('admin'); // 'admin', 'kasir', 'kurir'
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Products State
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua Produk');
  const [selectedProductDetail, setSelectedProductDetail] = useState(null);

  // Cart & Order State
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [address, setAddress] = useState('');
  const [kecamatan, setKecamatan] = useState('Gombengsari');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [deliveryMethod, setDeliveryMethod] = useState('Kirim dari kedai');
  const [isOrderingLoading, setIsOrderingLoading] = useState(false);

  // Navbar & UI state
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const cartSectionRef = useRef(null);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(API_PRODUCTS_URL);
      if (res.data && res.data.length > 0) {
        setProducts(res.data);
      } else {
        setProducts(getFallbackProducts());
      }
    } catch (error) {
      setProducts(getFallbackProducts());
    }
  };

  const getFallbackProducts = () => [
    { _id: '1', nama: 'Kopi Arabika Gombengsari (250g)', kategori: 'Kopi Biji/Bubuk', harga: 45000, jumlah_stok: 50, sku: 'GBG-001', deskripsi: 'Aroma bunga melati dengan keasaman segar khas pegunungan Banyuwangi.', img: DEFAULT_COFFEE_IMAGES[0] },
    { _id: '2', nama: 'Kopi Robusta Special (250g)', kategori: 'Kopi Biji/Bubuk', harga: 35000, jumlah_stok: 80, sku: 'GBG-002', deskripsi: 'Aroma dark chocolate & nutty, body tebal pas buat mood booster.', img: DEFAULT_COFFEE_IMAGES[1] },
    { _id: '3', nama: 'Kopi Luwak Liar (100g)', kategori: 'Kopi Premium', harga: 150000, jumlah_stok: 20, sku: 'GBG-003', deskripsi: 'Sensasi kopi paling eksklusif dan paling halus khas lereng Gombengsari.', img: DEFAULT_COFFEE_IMAGES[2] },
    { _id: '4', nama: 'Espresso Blend House (500g)', kategori: 'Kopi Biji/Bubuk', harga: 75000, jumlah_stok: 40, sku: 'GBG-004', deskripsi: 'Blend Arabika & Robusta pilihan untuk crema emas yang kental.', img: DEFAULT_COFFEE_IMAGES[3] },
    { _id: '5', nama: 'Kopi Susu Aren (Botol 1L)', kategori: 'Minuman Siap Saji', harga: 65000, jumlah_stok: 30, sku: 'GBG-005', deskripsi: 'Kombinasi espresso mantap, susu creamy, dan gula aren asli Banyuwangi.', img: DEFAULT_COFFEE_IMAGES[4] },
    { _id: '6', nama: 'Cold Brew Signature (250ml)', kategori: 'Minuman Siap Saji', harga: 25000, jumlah_stok: 25, sku: 'GBG-006', deskripsi: 'Kopi ekstraksi dingin 18 jam. Smooth, refreshing, no bitterness.', img: DEFAULT_COFFEE_IMAGES[5] },
  ];

  useEffect(() => {
    fetchProducts();
    const interval = setInterval(fetchProducts, 8000);

    const loggedUser = localStorage.getItem('kopiGombeng_chatName');
    if (loggedUser) setCustomerName(loggedUser);

    const loggedPhone = localStorage.getItem('kopiGombeng_userPhone');
    if (loggedPhone) setCustomerPhone(loggedPhone);

    const handleScroll = () => {
      if (window.scrollY > 50) setIsScrolled(true);
      else setIsScrolled(false);
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      clearInterval(interval);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // MANDATORY LOGIN CHECK BEFORE ORDERING
  const checkLoginBeforeOrder = (actionCallback) => {
    const activeUser = localStorage.getItem('kopiGombeng_chatName');
    if (!activeUser) {
      Swal.fire({
        title: '🔒 WAJIB LOGIN DULU NGAB!',
        text: 'Untuk melakukan pemesanan kopi Gombengsari, Anda harus memiliki akun atau login terlebih dahulu.',
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#FF5C00',
        cancelButtonColor: '#1C120C',
        confirmButtonText: '⚡ MASUK / DAFTAR AKUN',
        cancelButtonText: 'LIHAT MENU DULU',
        background: '#F4F0EA',
        customClass: {
          popup: 'rounded-[32px] border-4 border-[#1C120C] shadow-[8px_8px_0_#1C120C]',
          confirmButton: 'font-black rounded-full px-6 py-3 border-2 border-[#1C120C]',
          cancelButton: 'font-black rounded-full px-6 py-3 border-2 border-[#1C120C] text-white'
        }
      }).then((result) => {
        if (result.isConfirmed) {
          setViewMode('login');
          setErrorMsg('');
          setIsAuthModalOpen(true);
        }
      });
      return false;
    }
    if (actionCallback) {
      actionCallback();
    } else {
      router.push('/pelanggan/shop');
    }
    return true;
  };

  const handleAddToCart = (product) => {
    checkLoginBeforeOrder(() => {
      router.push('/pelanggan/shop');
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

  const CART_TOTAL = cart.reduce((acc, curr) => acc + (curr.harga * curr.jumlah), 0);
  const totalStockAmount = products.reduce((acc, curr) => acc + (Number(curr.jumlah_stok) || 0), 0);

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!checkLoginBeforeOrder()) return;

    if (cart.length === 0) {
      Swal.fire('Keranjang Kosong', 'Pilih menu favorit lo dulu ngab.', 'warning');
      return;
    }
    if (!customerPhone) {
      Swal.fire('No WA Wajib', 'Masukkan nomor WhatsApp aktif untuk pengiriman.', 'warning');
      return;
    }

    setIsOrderingLoading(true);
    try {
      const simplifiedCart = cart.map(item => ({
        _id: item._id,
        nama: item.nama,
        harga: item.harga,
        jumlah: item.jumlah
      }));

      const formattedAddress = `${address || 'Ambil / Kirim'} (Wilayah: ${kecamatan})`;

      const orderPayload = {
        nama_pelanggan: customerName,
        no_wa: customerPhone,
        alamat: formattedAddress,
        pesanan: JSON.stringify(simplifiedCart),
        total_harga: CART_TOTAL,
        metode_pembayaran: paymentMethod,
        metode_pengiriman: deliveryMethod
      };

      await axios.post(API_ORDERS_URL, orderPayload);

      // Notifikasi WA Admin
      const waAdmin = "6282338975768";
      const waText = `Halo Admin Gombengsari Coffee!\nAda pesanan baru niih:\n\nNama: ${customerName}\nNo WA: ${customerPhone}\nAlamat: ${formattedAddress}\nTotal: Rp ${CART_TOTAL.toLocaleString('id-ID')}\n\nMohon segera diproses ya!`;
      window.open(`https://wa.me/${waAdmin}?text=${encodeURIComponent(waText)}`, '_blank');

      Swal.fire({
        icon: 'success',
        title: 'ORDER SUCCESS! 🎉',
        text: 'Pesanan kopi lo udah dikirim ke kedai. Pantau pengiriman ya ngab!',
        confirmButtonColor: '#FF5C00',
        customClass: {
          popup: 'rounded-[32px] border-4 border-[#1C120C] bg-[#F4F0EA]',
          confirmButton: 'font-black rounded-full px-6 py-3 border-2 border-[#1C120C]'
        }
      });

      setCart([]);
      setIsCartOpen(false);
    } catch (err) {
      Swal.fire('Error', 'Gagal kirim order. Cek server backend API.', 'error');
    }
    setIsOrderingLoading(false);
  };

  // Auth Handlers
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return setErrorMsg("Harap isi email dan password!");
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await axios.post('http://localhost:5000/api/users/login', {
        email: loginEmail, password: loginPassword
      });
      localStorage.setItem('kopiGombeng_chatName', res.data.username);
      setCustomerName(res.data.username);
      setIsAuthModalOpen(false);
      Swal.fire({ 
        toast: true, 
        position: 'top-end', 
        icon: 'success', 
        title: `Wassup, ${res.data.username}! 🔥 Membuka halaman pemesanan...`, 
        showConfirmButton: false, 
        timer: 2000 
      });
      setTimeout(() => {
        router.push('/pelanggan/shop');
      }, 800);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Email atau Password tidak sesuai!");
    }
    setLoading(false);
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    if (registerStep === 1) {
      if (!phone) return setErrorMsg("Harap isi nomor HP!");
      setErrorMsg('');
      setRegisterStep(2);
    } else if (registerStep === 2) {
      if (!otpMethod) return setErrorMsg("Pilih metode verifikasi!");
      setErrorMsg('');
      setRegisterStep(3);
    } else if (registerStep === 3) {
      if (!otpCode || otpCode.length < 4) return setErrorMsg("Masukkan kode OTP yang valid!");
      setErrorMsg('');
      setRegisterStep(4);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!username || !email || !password) return setErrorMsg("Harap isi semua kolom!");
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await axios.post('http://localhost:5000/api/users/register', {
        username, email, password, phone
      });
      localStorage.setItem('kopiGombeng_chatName', res.data.username);
      localStorage.setItem('kopiGombeng_userPhone', phone);
      setCustomerName(res.data.username);
      setCustomerPhone(phone);
      setIsAuthModalOpen(false);
      Swal.fire({ 
        icon: 'success', 
        title: 'AKUN CREATED! 🚀', 
        text: `Selamat bergabung ${res.data.username}, sekarang membuka halaman pemesanan!`, 
        confirmButtonColor: '#FF5C00' 
      });
      setTimeout(() => {
        router.push('/pelanggan/shop');
      }, 800);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Terjadi kesalahan sistem!");
    }
    setLoading(false);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      const googleUser = {
        username: decoded.name,
        email: decoded.email,
        password: 'google_auth_dummy',
        phone: ''
      };
      try {
        await axios.post('http://localhost:5000/api/users/register', googleUser);
      } catch (e) {}
      localStorage.setItem('kopiGombeng_chatName', googleUser.username);
      setCustomerName(googleUser.username);
      setIsAuthModalOpen(false);
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: `Connected via Gmail: ${googleUser.username}`, showConfirmButton: false, timer: 2000 });
      setTimeout(() => {
        router.push('/pelanggan/shop');
      }, 800);
    } catch (err) {
      setErrorMsg("Gagal terhubung dengan Gmail");
    }
    setLoading(false);
  };

  const handleStaffLogin = (e) => {
    e.preventDefault();
    const credentials = { admin: 'admin123', kasir: 'kasir123', kurir: 'kurir123' };
    const routes = { admin: '/admin', kasir: '/kasir', kurir: '/kurir' };
    if (adminPassword === credentials[staffRole]) {
      router.push(routes[staffRole]);
    } else {
      const hints = { admin: 'admin123', kasir: 'kasir123', kurir: 'kurir123' };
      setErrorMsg(`Password ${staffRole} salah! (Hint: ${hints[staffRole]})`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('kopiGombeng_chatName');
    localStorage.removeItem('kopiGombeng_userPhone');
    setCustomerName('');
    setCustomerPhone('');
    setIsUserDropdownOpen(false);
    Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'Berhasil keluar', showConfirmButton: false, timer: 1500 });
    setTimeout(() => {
      window.location.href = '/';
    }, 500);
  };

  // Categories & Filtering
  const dynamicCategories = ['Semua Produk', ...new Set(products.map(p => p.kategori).filter(Boolean))];
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.nama.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'Semua Produk' || p.kategori === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <GoogleOAuthProvider clientId="GANTI_DENGAN_CLIENT_ID_GOOGLE_ANDA">
      <div className="min-h-screen bg-[#F4F0EA] font-sans text-[#1C120C] overflow-x-hidden selection:bg-[#FF5C00] selection:text-white pb-10">

        {/* Styles Injection for Gen-Z Animations & Neo Shadows */}
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
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1C120C; border-radius: 10px; }
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
              <h1 onClick={() => window.location.href = '/'} className="text-xl md:text-2xl font-black tracking-tighter hover:scale-105 transition-transform cursor-pointer flex items-center gap-2 uppercase">
                <span className="bg-[#FF5C00] text-white px-3 py-1 rounded-full text-sm md:text-lg border-2 border-[#1C120C]">GOMBENG</span> 
                <span className="hidden sm:inline">COFFEE</span>
              </h1>
            </div>

            <nav className="hidden md:flex items-center gap-8 text-[14px] font-black uppercase tracking-widest text-[#1C120C]">
              <a href="#home" className="hover:text-[#FF5C00] hover:-translate-y-1 transition-all">Vibes</a>
              <a href="#menu" className="hover:text-[#FF5C00] hover:-translate-y-1 transition-all flex items-center gap-1.5">
                <Coffee size={16} strokeWidth={2.5}/> Menu
              </a>
              <a href="#about" className="hover:text-[#FF5C00] hover:-translate-y-1 transition-all">Story</a>
              <a href="/pelanggan/tracking" className="hover:text-[#FF5C00] hover:-translate-y-1 transition-all flex items-center gap-1">
                <Navigation size={16} strokeWidth={2.5}/> Lacak
              </a>
            </nav>

            <div className="flex items-center gap-3 md:gap-5">

              {/* Cart Drawer Trigger */}
              <button 
                onClick={() => {
                  if (checkLoginBeforeOrder()) setIsCartOpen(true);
                }} 
                className="w-10 h-10 rounded-full border-2 border-[#1C120C] bg-[#1C120C] text-white flex items-center justify-center hover:bg-[#FF5C00] hover:border-[#FF5C00] transition-transform shadow-[2px_2px_0_#1C120C] hover:-translate-y-1 relative"
              >
                <ShoppingBag size={18} strokeWidth={2.5} />
                {cart.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#C9E265] text-[#1C120C] text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#1C120C] animate-bounce">
                    {cart.reduce((a, b) => a + b.jumlah, 0)}
                  </span>
                )}
              </button>

              {/* User Account / Login Button */}
              <div className="relative">
                {customerName ? (
                  <>
                    <button 
                      onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)} 
                      className="w-10 h-10 rounded-full border-2 border-[#1C120C] bg-white flex items-center justify-center text-[#1C120C] hover:bg-[#FF5C00] hover:text-white transition-all shadow-[2px_2px_0_#1C120C] hover:-translate-y-1 font-black"
                    >
                      {customerName.charAt(0).toUpperCase()}
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
                          <User size={18} strokeWidth={2.5} /> Akun Setup
                        </button>
                        <button onClick={() => window.location.href = '/pelanggan/tracking'} className="w-full text-left px-6 py-3 text-[13px] font-black uppercase hover:bg-white flex items-center gap-3 transition-colors border-b border-gray-200">
                          <Navigation size={18} strokeWidth={2.5} /> Status Pesanan
                        </button>
                        <button onClick={handleLogout} className="w-full text-left px-6 py-3 text-[13px] font-black uppercase text-red-600 hover:bg-white flex items-center gap-3 transition-colors rounded-b-[16px]">
                          <LogOut size={18} strokeWidth={2.5} /> Log Out
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <button 
                    onClick={() => { setViewMode('login'); setErrorMsg(''); setIsAuthModalOpen(true); }}
                    className="px-6 py-2.5 rounded-full border-2 border-[#1C120C] font-black text-[13px] uppercase tracking-widest hover:bg-[#1C120C] hover:text-white transition-all neo-shadow bg-white flex items-center gap-2"
                  >
                    <LogIn size={16} strokeWidth={3}/> Login
                  </button>
                )}
              </div>

            </div>
          </header>
        </div>

        {/* Mobile Dropdown Nav */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed top-[80px] left-4 right-4 bg-[#F4F0EA] border-4 border-[#1C120C] rounded-[24px] shadow-[8px_8px_0_#1C120C] z-[90] animate-in slide-in-from-top duration-300">
            <nav className="flex flex-col p-6 gap-2 text-lg font-black uppercase text-[#1C120C]">
              <a href="#home" onClick={() => setIsMobileMenuOpen(false)} className="hover:bg-[#FF5C00] hover:text-white transition-colors p-4 rounded-xl border-2 border-transparent hover:border-[#1C120C]">Vibes</a>
              <a href="#menu" onClick={() => setIsMobileMenuOpen(false)} className="hover:bg-[#FF5C00] hover:text-white transition-colors p-4 rounded-xl border-2 border-transparent hover:border-[#1C120C]">Menu Produk</a>
              <a href="#about" onClick={() => setIsMobileMenuOpen(false)} className="hover:bg-[#FF5C00] hover:text-white transition-colors p-4 rounded-xl border-2 border-transparent hover:border-[#1C120C]">Story</a>
              <a href="/pelanggan/tracking" onClick={() => setIsMobileMenuOpen(false)} className="hover:bg-[#FF5C00] hover:text-white transition-colors p-4 rounded-xl border-2 border-transparent hover:border-[#1C120C]">Status Pesanan</a>
            </nav>
          </div>
        )}


        {/* --- HERO SECTION (Bold Gen-Z Vibe) --- */}
        <section id="home" className="pt-32 pb-20 lg:pt-48 lg:pb-32 min-h-[95vh] flex items-center relative overflow-hidden">
          
          <div className="absolute top-20 right-10 w-[200px] h-[200px] md:w-[400px] md:h-[400px] bg-[#FF5C00] rounded-full mix-blend-multiply filter blur-[80px] opacity-20 animate-pulse z-0"></div>
          <div className="absolute bottom-10 left-10 w-[250px] h-[250px] md:w-[400px] md:h-[400px] bg-[#C9E265] rounded-full mix-blend-multiply filter blur-[100px] opacity-30 z-0"></div>

          <div className="max-w-[1300px] mx-auto px-6 lg:px-12 w-full flex flex-col-reverse lg:flex-row items-center justify-between gap-12 lg:gap-8 relative z-10">

            {/* Hero Left Content */}
            <div className="w-full lg:w-[55%] text-center lg:text-left relative z-20">
              <FadeIn direction="right" delay={100}>
                <div className="inline-block px-5 py-2 rounded-full border-2 border-[#1C120C] font-black text-xs uppercase tracking-widest bg-[#C9E265] text-[#1C120C] neo-shadow mb-8 transform -rotate-2">
                  🔥 100% LOKAL, 100% HYPE
                </div>
                <h2 className="text-[50px] sm:text-[60px] md:text-[80px] lg:text-[90px] font-black leading-[0.95] tracking-tighter mb-6 uppercase text-[#1C120C] drop-shadow-sm">
                  BUKAN KOPI<br/>
                  <span className="text-transparent font-serif italic lowercase relative" style={{ WebkitTextStroke: '2.5px #1C120C' }}>
                    biasa.
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
                    onClick={() => checkLoginBeforeOrder(() => router.push('/pelanggan/shop'))}
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

            {/* Hero Right Image (Gen-Z Sticker Cards) */}
            <div className="w-full lg:w-[45%] flex justify-center items-center relative mt-10 lg:mt-0">
              <FadeIn direction="left" delay={300}>
                <div className="relative w-[280px] md:w-[380px] lg:w-[450px] aspect-[4/5] rounded-[40px] border-4 border-[#1C120C] shadow-[12px_16px_0_#1C120C] overflow-hidden group bg-white animate-float rotate-3 hover:rotate-0 transition-transform duration-500">
                  <img
                    src="https://images.unsplash.com/photo-1611162458324-aae1eb4129a4?q=80&w=800&auto=format&fit=crop"
                    alt="Kopi Aesthetic"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
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
            <span>• BOLD VIBES ONLY • 100% GOMBENGSARI • ROASTED WITH PASSION • CAFFEINE FIX • BOLD VIBES ONLY • 100% GOMBENGSARI • ROASTED WITH PASSION • CAFFEINE FIX • </span>
          </div>
        </div>


        {/* --- MENU CATALOG (GEN-Z STYLED PRODUCTS) --- */}
        <section id="menu" className="py-24 lg:py-32 bg-[#F4F0EA] relative z-10">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-12">
            
            <FadeIn direction="up">
              <div className="mb-14">
                <h2 className="text-[45px] md:text-[65px] font-black tracking-tighter uppercase text-[#1C120C] inline-block border-b-8 border-[#FF5C00] pb-2">
                  Menu Kopi.
                </h2>
                <p className="text-[#1C120C]/70 text-sm font-black tracking-[0.2em] uppercase mt-4">
                  Pick your poison ngab. Wajib login sebelum pesan!
                </p>
              </div>
            </FadeIn>

            {/* Search & Category Chips */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
              
              {/* Search Box */}
              <div className="bg-white rounded-[20px] border-4 border-[#1C120C] flex items-center px-5 py-3.5 shadow-[6px_6px_0_#1C120C] w-full md:w-96 transition-transform focus-within:-translate-y-1 focus-within:shadow-[8px_8px_0_#1C120C]">
                <Search size={22} className="text-[#1C120C] mr-3" strokeWidth={3} />
                <input
                  type="text"
                  placeholder="Cari kopi favorit lo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-base outline-none font-black text-[#1C120C] placeholder:text-[#1C120C]/30 bg-transparent uppercase"
                />
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap gap-3 w-full md:w-auto">
                {dynamicCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-5 py-2.5 rounded-full border-4 text-[12px] font-black uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-[#FF5C00] border-[#1C120C] text-white shadow-[4px_4px_0_#1C120C] transform -translate-y-1' : 'bg-white border-[#1C120C] text-[#1C120C] shadow-[4px_4px_0_#1C120C] hover:bg-[#C9E265] hover:-translate-y-1'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.map((p, idx) => (
                <FadeIn key={p._id || idx} delay={idx * 80} direction="up">
                  <div className="bg-white rounded-[32px] overflow-hidden shadow-[8px_8px_0_#1C120C] border-4 border-[#1C120C] flex flex-col group hover:-translate-y-2 hover:shadow-[12px_12px_0_#1C120C] transition-all duration-300 h-full">
                    
                    {/* Product Image */}
                    <div className="h-60 bg-gray-100 relative overflow-hidden border-b-4 border-[#1C120C]">
                      <img
                        src={p.img || DEFAULT_COFFEE_IMAGES[idx % DEFAULT_COFFEE_IMAGES.length]}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                        alt={p.nama}
                      />
                      {/* SKU Sticker */}
                      <div className="absolute top-4 right-4 bg-[#C9E265] text-[#1C120C] font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border-2 border-[#1C120C] shadow-[2px_2px_0_#1C120C] transform rotate-3">
                        {p.sku || `GBG-0${idx + 1}`}
                      </div>
                      <div className="absolute top-4 left-4 bg-white text-[#1C120C] font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border-2 border-[#1C120C] shadow-[2px_2px_0_#1C120C]">
                        {p.kategori || 'Gombengsari'}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-6 flex-1 flex flex-col justify-between bg-[#F4F0EA]">
                      <div>
                        <h3 className="font-black text-xl text-[#1C120C] leading-tight mb-2 uppercase">{p.nama}</h3>
                        <p className="text-[13px] text-[#1C120C]/70 font-bold mb-4 line-clamp-2">{p.deskripsi || 'Nikmati sensasi biji kopi murni khas Gombengsari Banyuwangi.'}</p>
                      </div>

                      <div className="mt-auto flex items-end justify-between pt-4 border-t-2 border-[#1C120C]/20">
                        <div>
                          <p className="text-[#FF5C00] font-black text-xl drop-shadow-sm">Rp {Number(p.harga || 0).toLocaleString('id-ID')}</p>
                          <p className="text-[#1C120C]/50 text-[11px] mt-1 font-black uppercase tracking-widest">Stok: {p.jumlah_stok}</p>
                        </div>
                        <button
                          onClick={() => handleAddToCart(p)}
                          className="w-12 h-12 bg-[#C9E265] hover:bg-[#FF5C00] hover:text-white text-[#1C120C] flex items-center justify-center rounded-2xl border-4 border-[#1C120C] shadow-[4px_4px_0_#1C120C] transition-all active:translate-y-1 active:shadow-none"
                          title="Tambah ke Keranjang"
                        >
                          <Plus size={24} strokeWidth={3} />
                        </button>
                      </div>
                    </div>

                  </div>
                </FadeIn>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-20">
                <div className="inline-block bg-white border-4 border-[#1C120C] rounded-[24px] px-8 py-6 shadow-[8px_8px_0_#1C120C] transform -rotate-2">
                  <p className="text-xl font-black uppercase text-[#1C120C]">Waduh, menu nggak ketemu! 🥺</p>
                </div>
              </div>
            )}

          </div>
        </section>


        {/* --- STOCK BANNER COUNTER --- */}
        <section className="py-20 bg-[#FF5C00] border-y-4 border-[#1C120C] relative overflow-hidden">
          <div className="max-w-[1200px] mx-auto px-6 text-center relative z-10 flex flex-col items-center">
            
            <FadeIn direction="up">
              <h3 className="text-[40px] md:text-[60px] font-black text-white tracking-tighter uppercase drop-shadow-[4px_4px_0_#1C120C] mb-8">
                Ready Stock Hari Ini.
              </h3>
            </FadeIn>

            <FadeIn direction="scale" delay={200}>
              <div className="relative group mb-10">
                <div className="w-56 h-56 md:w-72 md:h-72 rounded-[48px] border-8 border-[#1C120C] bg-[#F4F0EA] shadow-[12px_12px_0_#1C120C] flex flex-col items-center justify-center relative z-10 rotate-2">
                  <span className="text-sm font-black text-[#1C120C] uppercase tracking-widest mb-2 bg-[#C9E265] px-4 py-1 rounded-full border-2 border-[#1C120C]">Porsi Tersedia</span>
                  <span className="text-[80px] md:text-[110px] font-black text-[#1C120C] leading-none">
                    {totalStockAmount}
                  </span>
                </div>
              </div>
            </FadeIn>

            <button
              onClick={() => {
                if (checkLoginBeforeOrder()) setIsCartOpen(true);
              }}
              className="bg-[#1C120C] text-white px-10 py-4 rounded-full font-black text-base uppercase tracking-widest hover:bg-white hover:text-[#1C120C] transition-all shadow-[6px_8px_0_#1C120C] active:translate-y-2 active:shadow-none border-4 border-[#1C120C]"
            >
              ORDER SEKARANG
            </button>
          </div>
        </section>


        {/* --- BENTO BOX ABOUT SECTION --- */}
        <section id="about" className="py-24 bg-[#F4F0EA] relative">
          <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
            
            <FadeIn direction="up">
              <div className="mb-16">
                <h3 className="text-[40px] md:text-[60px] font-black mb-2 tracking-tighter uppercase text-[#1C120C] inline-block border-b-8 border-[#FF5C00] pb-2">Our Story.</h3>
                <p className="text-[#1C120C]/60 text-sm font-black tracking-[0.2em] uppercase mt-4">Kopi Lokal, Vibe Global.</p>
              </div>
            </FadeIn>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              <div className="md:col-span-2 aspect-video md:aspect-auto md:h-[380px] bg-white rounded-[32px] border-4 border-[#1C120C] shadow-[8px_8px_0_#1C120C] overflow-hidden relative group">
                <img
                  src="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=800&auto=format&fit=crop"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  alt="Kopi Vibes"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1C120C]/80 to-transparent"></div>
                <h4 className="absolute bottom-8 left-8 text-white text-3xl md:text-4xl font-black uppercase">Roots in<br/>Banyuwangi</h4>
              </div>

              <div className="bg-[#C9E265] rounded-[32px] border-4 border-[#1C120C] shadow-[8px_8px_0_#1C120C] p-8 flex flex-col justify-center">
                <p className="text-[#1C120C] font-bold text-lg md:text-xl leading-relaxed">
                  Berawal dari Gombengsari, kami menyajikan kopi otentik yang pas banget buat nemenin hustle harian lo. No cap, just good beans. ☕✨
                </p>
              </div>
            </div>

          </div>
        </section>


        {/* --- GEN-Z AUTH MODAL (LOGIN / REGISTER / ADMIN) --- */}
        {isAuthModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-[#F4F0EA] border-4 border-[#1C120C] rounded-[36px] shadow-[12px_16px_0_#1C120C] w-full max-w-[460px] p-6 md:p-8 relative animate-in zoom-in-95 duration-300 text-[#1C120C]">
              
              <button
                onClick={() => setIsAuthModalOpen(false)}
                className="absolute top-5 right-5 w-10 h-10 bg-white border-2 border-[#1C120C] rounded-full flex items-center justify-center font-black hover:bg-[#FF5C00] hover:text-white transition-colors shadow-[2px_2px_0_#1C120C]"
              >
                <X size={20} strokeWidth={3} />
              </button>

              {/* Tab Switchers */}
              <div className="flex bg-white border-3 border-[#1C120C] p-1 rounded-2xl mb-6 shadow-[4px_4px_0_#1C120C]">
                <button
                  onClick={() => { setViewMode('login'); setErrorMsg(''); }}
                  className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${viewMode === 'login' ? 'bg-[#FF5C00] text-white border-2 border-[#1C120C]' : 'text-[#1C120C]'}`}
                >
                  MASUK
                </button>
                <button
                  onClick={() => { setViewMode('register'); setErrorMsg(''); setRegisterStep(1); }}
                  className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${viewMode === 'register' ? 'bg-[#FF5C00] text-white border-2 border-[#1C120C]' : 'text-[#1C120C]'}`}
                >
                  DAFTAR
                </button>
              </div>

              {errorMsg && (
                <div className="bg-red-100 text-red-700 p-3 rounded-xl border-2 border-[#1C120C] text-xs font-black mb-4 flex items-center gap-2 shadow-[2px_2px_0_#1C120C]">
                  <Lock size={16}/> {errorMsg}
                </div>
              )}

              {/* LOGIN FORM */}
              {viewMode === 'login' && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest block mb-2">Email</label>
                    <input
                      type="email"
                      placeholder="contoh@gmail.com"
                      value={loginEmail}
                      onChange={(e) => { setLoginEmail(e.target.value); setErrorMsg(''); }}
                      className="w-full bg-white border-3 border-[#1C120C] rounded-2xl px-4 py-3.5 text-sm font-bold outline-none focus:shadow-[4px_4px_0_#1C120C] transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest block mb-2">Password</label>
                    <input
                      type="password"
                      placeholder="Password akun lo"
                      value={loginPassword}
                      onChange={(e) => { setLoginPassword(e.target.value); setErrorMsg(''); }}
                      className="w-full bg-white border-3 border-[#1C120C] rounded-2xl px-4 py-3.5 text-sm font-bold outline-none focus:shadow-[4px_4px_0_#1C120C] transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-4 bg-[#1C120C] text-white font-black text-sm py-4 rounded-2xl border-2 border-[#1C120C] shadow-[4px_4px_0_#FF5C00] hover:bg-[#FF5C00] transition-colors"
                  >
                    {loading ? 'MEMPROSES...' : 'MASUK SEKARANG'}
                  </button>

                  <div className="relative flex py-3 items-center">
                    <div className="flex-grow border-t-2 border-[#1C120C]"></div>
                    <span className="flex-shrink-0 mx-3 text-[#1C120C] text-[10px] font-black uppercase">Atau Gmail</span>
                    <div className="flex-grow border-t-2 border-[#1C120C]"></div>
                  </div>

                  <div className="w-full flex justify-center">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() => setErrorMsg("Gagal login Gmail")}
                      shape="pill"
                      width="300"
                    />
                  </div>
                </form>
              )}

              {/* REGISTER FORM */}
              {viewMode === 'register' && (
                <div>
                  {registerStep === 1 && (
                    <form onSubmit={handleNextStep} className="space-y-4">
                      <div>
                        <label className="text-xs font-black uppercase tracking-widest block mb-2">Nomor HP</label>
                        <input
                          type="tel"
                          placeholder="08123456789"
                          value={phone}
                          onChange={(e) => { setPhone(e.target.value); setErrorMsg(''); }}
                          className="w-full bg-white border-3 border-[#1C120C] rounded-2xl px-4 py-3.5 text-sm font-bold outline-none focus:shadow-[4px_4px_0_#1C120C]"
                        />
                      </div>
                      <button type="submit" className="w-full bg-[#1C120C] text-white font-black text-sm py-4 rounded-2xl border-2 border-[#1C120C] shadow-[4px_4px_0_#C9E265] hover:bg-[#FF5C00] transition-colors">
                        LANJUT METODE OTP
                      </button>
                    </form>
                  )}

                  {registerStep === 2 && (
                    <div className="space-y-4 text-center">
                      <p className="text-xs font-black">Metode Verifikasi OTP untuk <span className="text-[#FF5C00]">{phone}</span></p>
                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => setOtpMethod('WA')} className={`p-4 rounded-2xl border-3 border-[#1C120C] flex flex-col items-center gap-2 ${otpMethod === 'WA' ? 'bg-[#00A884] text-white' : 'bg-white text-[#1C120C]'}`}>
                          <MessageSquare size={24}/> WhatsApp
                        </button>
                        <button onClick={() => setOtpMethod('SMS')} className={`p-4 rounded-2xl border-3 border-[#1C120C] flex flex-col items-center gap-2 ${otpMethod === 'SMS' ? 'bg-[#FF5C00] text-white' : 'bg-white text-[#1C120C]'}`}>
                          <Smartphone size={24}/> SMS
                        </button>
                      </div>
                      <button onClick={handleNextStep} className="w-full bg-[#1C120C] text-white font-black text-sm py-4 rounded-2xl border-2 border-[#1C120C]">
                        KIRIM OTP
                      </button>
                    </div>
                  )}

                  {registerStep === 3 && (
                    <form onSubmit={handleNextStep} className="space-y-4">
                      <p className="text-xs font-black text-center">Masukkan kode OTP 6 Digit</p>
                      <input
                        type="text"
                        maxLength="6"
                        placeholder="123456"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        className="w-full bg-white border-3 border-[#1C120C] rounded-2xl py-3.5 text-center font-black tracking-[0.5em] outline-none"
                      />
                      <button type="submit" className="w-full bg-[#1C120C] text-white font-black text-sm py-4 rounded-2xl border-2 border-[#1C120C]">
                        VERIFIKASI
                      </button>
                    </form>
                  )}

                  {registerStep === 4 && (
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div>
                        <label className="text-xs font-black uppercase block mb-1">Nama</label>
                        <input type="text" placeholder="Nama lo" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-white border-3 border-[#1C120C] rounded-2xl px-4 py-3 text-sm font-bold"/>
                      </div>
                      <div>
                        <label className="text-xs font-black uppercase block mb-1">Email</label>
                        <input type="email" placeholder="contoh@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white border-3 border-[#1C120C] rounded-2xl px-4 py-3 text-sm font-bold"/>
                      </div>
                      <div>
                        <label className="text-xs font-black uppercase block mb-1">Password</label>
                        <input type="password" placeholder="Password akun" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-white border-3 border-[#1C120C] rounded-2xl px-4 py-3 text-sm font-bold"/>
                      </div>
                      <button type="submit" disabled={loading} className="w-full bg-[#FF5C00] text-white font-black text-sm py-4 rounded-2xl border-2 border-[#1C120C]">
                        {loading ? 'MEMPROSES...' : 'DAFTAR SEKARANG'}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* STAFF LOGIN */}
              {viewMode === 'admin' && (
                <form onSubmit={handleStaffLogin} className="space-y-4">
                  {/* Role Selector */}
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest block mb-3">Pilih Role Staf</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => { setStaffRole('admin'); setAdminPassword(''); setErrorMsg(''); }}
                        className={`py-3 px-2 rounded-2xl border-3 border-[#1C120C] flex flex-col items-center gap-1.5 transition-all text-center shadow-[3px_3px_0_#1C120C] active:translate-y-1 active:shadow-none ${
                          staffRole === 'admin' ? 'bg-[#1C120C] text-white' : 'bg-white text-[#1C120C] hover:bg-[#F4F0EA]'
                        }`}
                      >
                        <span className="text-xl">🛡️</span>
                        <span className="text-[10px] font-black uppercase tracking-widest leading-none">Admin</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setStaffRole('kasir'); setAdminPassword(''); setErrorMsg(''); }}
                        className={`py-3 px-2 rounded-2xl border-3 border-[#1C120C] flex flex-col items-center gap-1.5 transition-all text-center shadow-[3px_3px_0_#1C120C] active:translate-y-1 active:shadow-none ${
                          staffRole === 'kasir' ? 'bg-[#C9E265] text-[#1C120C] border-[#1C120C]' : 'bg-white text-[#1C120C] hover:bg-[#F4F0EA]'
                        }`}
                      >
                        <span className="text-xl">🧾</span>
                        <span className="text-[10px] font-black uppercase tracking-widest leading-none">Kasir</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setStaffRole('kurir'); setAdminPassword(''); setErrorMsg(''); }}
                        className={`py-3 px-2 rounded-2xl border-3 border-[#1C120C] flex flex-col items-center gap-1.5 transition-all text-center shadow-[3px_3px_0_#1C120C] active:translate-y-1 active:shadow-none ${
                          staffRole === 'kurir' ? 'bg-[#FF5C00] text-white border-[#1C120C]' : 'bg-white text-[#1C120C] hover:bg-[#F4F0EA]'
                        }`}
                      >
                        <span className="text-xl">🛵</span>
                        <span className="text-[10px] font-black uppercase tracking-widest leading-none">Kurir</span>
                      </button>
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest block mb-2">
                      Password {staffRole.charAt(0).toUpperCase() + staffRole.slice(1)}
                    </label>
                    <input
                      type="password"
                      placeholder={`Password ${staffRole}...`}
                      value={adminPassword}
                      onChange={(e) => { setAdminPassword(e.target.value); setErrorMsg(''); }}
                      className={`w-full bg-white border-3 rounded-2xl px-4 py-3.5 text-sm font-bold outline-none transition-all focus:shadow-[4px_4px_0_#1C120C] ${
                        staffRole === 'admin' ? 'border-[#1C120C] focus:border-[#1C120C]' :
                        staffRole === 'kasir' ? 'border-[#C9E265] focus:border-[#1C120C]' :
                        'border-[#FF5C00] focus:border-[#1C120C]'
                      }`}
                    />
                    <p className="text-[10px] text-gray-400 mt-1.5 font-bold">
                      Hint: {staffRole}123
                    </p>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className={`w-full font-black text-sm py-4 rounded-2xl border-2 border-[#1C120C] transition-all shadow-[4px_4px_0_#1C120C] active:translate-y-1 active:shadow-none ${
                      staffRole === 'admin' ? 'bg-[#1C120C] text-white hover:bg-[#FF5C00]' :
                      staffRole === 'kasir' ? 'bg-[#C9E265] text-[#1C120C] hover:bg-[#1C120C] hover:text-white' :
                      'bg-[#FF5C00] text-white hover:bg-[#1C120C]'
                    }`}
                  >
                    MASUK SEBAGAI {staffRole.toUpperCase()}
                  </button>
                </form>
              )}

              {/* Bottom Switcher */}
              <div className="mt-6 pt-4 border-t-2 border-[#1C120C] flex justify-between items-center text-[11px] font-black uppercase tracking-wider">
                <span>© Gombengsari</span>
                {viewMode !== 'admin' ? (
                  <button onClick={() => { setViewMode('admin'); setStaffRole('admin'); setAdminPassword(''); setErrorMsg(''); }} className="text-[#FF5C00] hover:underline flex items-center gap-1">
                    Akses Staf →
                  </button>
                ) : (
                  <button onClick={() => { setViewMode('login'); setErrorMsg(''); }} className="text-[#FF5C00] hover:underline">
                    Akses Pelanggan →
                  </button>
                )}
              </div>

            </div>
          </div>
        )}


        {/* --- CART DRAWER (GEN-Z NEO-BRUTALIST) --- */}
        {isCartOpen && (
          <div className="fixed inset-0 z-[120] flex justify-end bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-[#F4F0EA] border-l-4 border-[#1C120C] w-full max-w-[480px] h-full shadow-2xl flex flex-col relative animate-in slide-in-from-right duration-300 text-[#1C120C]">
              
              <div className="p-6 bg-[#C9E265] border-b-4 border-[#1C120C] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShoppingBag size={24} strokeWidth={2.5}/>
                  <h3 className="font-black text-xl uppercase tracking-tight">Cart Lo ({cart.length})</h3>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="w-9 h-9 rounded-full border-2 border-[#1C120C] bg-white flex items-center justify-center font-black">
                  <X size={20} strokeWidth={3}/>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {cart.length === 0 ? (
                  <div className="text-center py-20 text-[#1C120C]/40">
                    <ShoppingCart size={54} strokeWidth={2} className="mx-auto mb-3 opacity-40"/>
                    <p className="font-black text-sm uppercase">Keranjang lo masih kosong ngab</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item._id} className="flex items-center justify-between p-4 bg-white rounded-2xl border-3 border-[#1C120C] shadow-[4px_4px_0_#1C120C]">
                      <div className="flex-1 pr-3">
                        <h4 className="font-black text-sm uppercase leading-tight">{item.nama}</h4>
                        <p className="text-xs font-black text-[#FF5C00] mt-1">
                          Rp {Number(item.harga).toLocaleString('id-ID')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 bg-[#F4F0EA] p-1 rounded-xl border-2 border-[#1C120C]">
                        <button onClick={() => handleRemoveFromCart(item._id)} className="w-7 h-7 bg-white border border-[#1C120C] rounded-lg font-black flex items-center justify-center text-sm">-</button>
                        <span className="font-black text-xs w-5 text-center">{item.jumlah}</span>
                        <button onClick={() => handleAddToCart(item)} className="w-7 h-7 bg-white border border-[#1C120C] rounded-lg font-black flex items-center justify-center text-sm">+</button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 bg-white border-t-4 border-[#1C120C] space-y-4">
                  <div>
                    <label className="text-[11px] font-black uppercase block mb-1">WhatsApp Pengiriman</label>
                    <input
                      type="text"
                      placeholder="08123456789"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-[#F4F0EA] border-2 border-[#1C120C] rounded-xl px-4 py-2.5 text-xs font-black outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-black uppercase block mb-1">Alamat Lengkap</label>
                    <textarea
                      rows={2}
                      placeholder="Jalan, RT/RW, Patokan..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-[#F4F0EA] border-2 border-[#1C120C] rounded-xl p-3 text-xs font-black outline-none"
                    />
                  </div>

                  <div className="pt-2 border-t-2 border-[#1C120C] flex justify-between items-center font-black">
                    <span className="uppercase text-xs">Total Pembayaran</span>
                    <span className="text-xl text-[#FF5C00]">Rp {CART_TOTAL.toLocaleString('id-ID')}</span>
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={isOrderingLoading}
                    className="w-full bg-[#FF5C00] text-white py-4 rounded-full font-black text-sm uppercase tracking-widest border-3 border-[#1C120C] shadow-[4px_4px_0_#1C120C] hover:bg-[#1C120C] transition-colors"
                  >
                    {isOrderingLoading ? 'MEMPROSES...' : 'GAS KIRIM ORDER 🚀'}
                  </button>
                </div>
              )}

            </div>
          </div>
        )}


        {/* --- QUICK PRODUCT DETAIL MODAL --- */}
        {selectedProductDetail && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#F4F0EA] border-4 border-[#1C120C] max-w-lg w-full rounded-[36px] overflow-hidden shadow-[12px_16px_0_#1C120C] relative animate-in zoom-in-95 text-[#1C120C]">
              <button
                onClick={() => setSelectedProductDetail(null)}
                className="absolute top-4 right-4 bg-white border-2 border-[#1C120C] p-2 rounded-full font-black hover:bg-[#FF5C00] hover:text-white transition-colors z-10 shadow-[2px_2px_0_#1C120C]"
              >
                <X size={18} strokeWidth={3}/>
              </button>

              <div className="h-64 relative bg-stone-100 border-b-4 border-[#1C120C]">
                <img
                  src={selectedProductDetail.img || DEFAULT_COFFEE_IMAGES[0]}
                  alt={selectedProductDetail.nama}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-8">
                <span className="bg-[#C9E265] text-[#1C120C] border-2 border-[#1C120C] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                  {selectedProductDetail.kategori || 'Gombengsari'}
                </span>
                <h3 className="text-2xl font-black mt-3 mb-2 uppercase">{selectedProductDetail.nama}</h3>
                <p className="text-[#1C120C]/70 text-sm font-bold leading-relaxed mb-6">
                  {selectedProductDetail.deskripsi || 'Nikmati keaslian rasa kopi pilihan Banyuwangi.'}
                </p>

                <div className="flex items-center justify-between pt-4 border-t-2 border-[#1C120C]">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest block text-stone-500">Harga</span>
                    <span className="text-2xl font-black text-[#FF5C00]">
                      Rp {Number(selectedProductDetail.harga || 0).toLocaleString('id-ID')}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      handleAddToCart(selectedProductDetail);
                      setSelectedProductDetail(null);
                    }}
                    className="bg-[#1C120C] text-white border-2 border-[#1C120C] px-6 py-3.5 rounded-full font-black text-xs uppercase tracking-wider hover:bg-[#FF5C00] transition-colors shadow-[4px_4px_0_#1C120C] flex items-center gap-2"
                  >
                    <Plus size={18} strokeWidth={3}/> Pesan
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* --- FOOTER (Bold Gen-Z Aesthetic) --- */}
        <footer className="bg-[#1C120C] text-[#F4F0EA] pt-24 pb-12 px-6 lg:px-12 border-t-8 border-[#FF5C00] relative overflow-hidden mt-20">
          <div className="max-w-[1200px] mx-auto relative z-10">
            <h2 className="text-[60px] md:text-[100px] font-black text-center mb-12 uppercase tracking-tighter text-[#F4F0EA] leading-none" style={{ WebkitTextStroke: '2px #F4F0EA', color: 'transparent' }}>
              GOMBENG.
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 text-sm border-t-2 border-[#F4F0EA]/20 pt-12">
              <div>
                <h5 className="font-black mb-4 text-[#C9E265] text-[16px] uppercase tracking-widest">Gombengsari Coffee</h5>
                <p className="font-bold text-stone-400 text-xs leading-relaxed">
                  Official platform pemesanan Kopi Gombengsari Banyuwangi. Bold, fresh, & authentic.
                </p>
              </div>

              <div>
                <h5 className="font-black mb-4 text-[#C9E265] text-[16px] uppercase tracking-widest">Explore</h5>
                <ul className="space-y-3 font-bold text-xs">
                  <li><a href="#home" className="hover:text-[#FF5C00] transition-colors">Beranda (Vibes)</a></li>
                  <li><a href="#menu" className="hover:text-[#FF5C00] transition-colors">Menu Produk</a></li>
                  <li><a href="#about" className="hover:text-[#FF5C00] transition-colors">Story Kami</a></li>
                  <li><a href="/pelanggan/tracking" className="hover:text-[#FF5C00] transition-colors">Status Pesanan</a></li>
                </ul>
              </div>

              <div>
                <h5 className="font-black mb-4 text-[#C9E265] text-[16px] uppercase tracking-widest">Petugas Portal</h5>
                <ul className="space-y-3 font-bold text-xs">
                  <li><a href="/kasir" className="hover:text-[#FF5C00] transition-colors">Portal Kasir (POS)</a></li>
                  <li><a href="/kurir" className="hover:text-[#FF5C00] transition-colors">Portal Kurir App</a></li>
                  <li>
                    <button onClick={() => { setViewMode('admin'); setErrorMsg(''); setIsAuthModalOpen(true); }} className="hover:text-[#FF5C00] transition-colors text-left uppercase">
                      Dashboard Admin
                    </button>
                  </li>
                </ul>
              </div>

              <div>
                <h5 className="font-black mb-4 text-[#C9E265] text-[16px] uppercase tracking-widest">Contact</h5>
                <p className="font-bold text-xs text-stone-300 mb-2">Desa Gombengsari, Kalipuro, Banyuwangi</p>
                <p className="font-bold text-xs text-stone-300">WA: 082338975768</p>
              </div>
            </div>

            <div className="mt-16 text-center font-black text-[12px] uppercase tracking-widest text-[#F4F0EA]/50">
              © 2026 Gombengsari Coffee. All rights reserved. Built with ☕
            </div>
          </div>
        </footer>

      </div>
    </GoogleOAuthProvider>
  );
}
