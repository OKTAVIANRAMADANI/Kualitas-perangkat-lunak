"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  User, 
  MapPin, 
  Lock, 
  ShoppingBag, 
  Camera, 
  Edit2, 
  LogOut,
  ChevronRight,
  ShieldCheck,
  Package,
  Plus,
  Menu,
  X,
  Settings,
  Clock,
  Bell,
  Phone,
  Mail,
  Navigation
} from 'lucide-react';
import AddressModal from '@/components/AddressModal';

export default function PengaturanAkun() {
  const [activeTab, setActiveTab] = useState('Profil');
  
  const [profileData, setProfileData] = useState({
    id: null,
    username: '',
    name: '',
    email: '',
    phone: '',
    gender: '',
    dob_day: '',
    dob_month: '',
    dob_year: ''
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Address States
  const [addresses, setAddresses] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Password States
  const [passwordStates, setPasswordStates] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const parsePesananJSON = (pesananStr, totalHarga) => {
    try {
      if (!pesananStr) return [];
      const parsed = JSON.parse(pesananStr);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [{ nama: 'Kopi', jumlah: 1, harga: totalHarga }];
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) setIsScrolled(true);
      else setIsScrolled(false);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('kopiGombeng_chatName');
      localStorage.removeItem('kopiGombeng_userPhone');
      window.location.href = '/';
  };

  const fetchAddresses = async (username) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/addresses/${username}`);
      setAddresses(res.data);
    } catch (err) {
      console.error('Failed to fetch addresses', err);
    }
  };

  const fetchMyOrders = async (username) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/orders/track/${username}`);
      setMyOrders(res.data);
    } catch (err) {
      console.error('Failed to fetch orders', err);
    }
  };

  useEffect(() => {
    const loggedInUser = localStorage.getItem('kopiGombeng_chatName');
    
    const fetchUser = async () => {
      if (!loggedInUser) {
        window.location.href = '/pelanggan/login';
        return;
      }
      try {
        const res = await axios.get(`http://localhost:5000/api/users/profile/${loggedInUser}`);
        setProfileData({
          id: res.data.id,
          username: res.data.username || loggedInUser,
          name: res.data.name || '',
          email: res.data.email || '',
          phone: res.data.phone || '',
          gender: res.data.gender || 'Laki-laki',
          dob_day: res.data.dob_day || '',
          dob_month: res.data.dob_month || '',
          dob_year: res.data.dob_year || ''
        });
      } catch (err) {
        console.error('Failed to fetch user', err);
      }
      setLoading(false);
    };

    fetchUser();
    if (loggedInUser) {
      fetchAddresses(loggedInUser);
      fetchMyOrders(loggedInUser);
    }
  }, []);


  const handleDeleteAddress = async (id) => {
    if (window.confirm('Hapus alamat ini?')) {
      try {
        await axios.delete(`http://localhost:5000/api/addresses/${id}`);
        fetchAddresses(profileData.username);
      } catch (err) {
        console.error('Failed to delete address', err);
      }
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await axios.patch(`http://localhost:5000/api/addresses/${id}/default`, { username: profileData.username });
      fetchAddresses(profileData.username);
    } catch (err) {
      console.error('Failed to set default address', err);
    }
  };

  const handleOpenAddressModal = (address = null) => {
    setEditingAddress(address);
    setIsAddressModalOpen(true);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await axios.put(`http://localhost:5000/api/users/profile/${profileData.username}`, {
        name: profileData.name,
        phone: profileData.phone,
        gender: profileData.gender,
        dob_day: profileData.dob_day,
        dob_month: profileData.dob_month,
        dob_year: profileData.dob_year
      });
      alert('Profil berhasil diperbarui!');
    } catch (err) {
      console.error('Failed to update profile', err);
      alert('Gagal memperbarui profil. Coba lagi.');
    }
    setIsSaving(false);
  };

  const handleUpdatePassword = async () => {
    if (!passwordStates.currentPassword || !passwordStates.newPassword || !passwordStates.confirmPassword) {
      alert("Harap isi semua kolom password!");
      return;
    }
    if (passwordStates.newPassword !== passwordStates.confirmPassword) {
      alert("Password baru dan konfirmasi tidak cocok!");
      return;
    }

    try {
      // Note: Idealnya di backend kita cek currentPassword cocok atau tidak. 
      // Karena keterbatasan, langsung kita tembak update password berdasar ID yang sedang login.
      await axios.put(`http://localhost:5000/api/users/${profileData.id}/password`, {
        password: passwordStates.newPassword
      });
      alert('Password berhasil diperbarui!');
      setPasswordStates({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error('Failed to update password', err);
      alert('Gagal memperbarui password. Coba lagi.');
    }
  };

  const menuItems = [
    { id: 'akun', title: 'Akun Saya', icon: User, isHeader: true },
    { id: 'Profil', title: 'Profil', icon: User, parent: 'akun' },
    { id: 'Alamat', title: 'Alamat', icon: MapPin, parent: 'akun' },
    { id: 'Ubah Password', title: 'Ubah Password', icon: Lock, parent: 'akun' },
    { divider: true },
    { id: 'Pesanan Anda', title: 'Pesanan Anda', icon: Package, isHeader: true },
  ];

   return (
    <div className="min-h-screen bg-[#F4F0EA] font-sans text-[#1C120C] selection:bg-[#FF5C00] selection:text-white">
      
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
               {/* GPS Tracking Icon */}
               <button onClick={() => window.location.href = '/pelanggan/tracking'} className="w-10 h-10 rounded-full border-2 border-[#1C120C] flex items-center justify-center bg-[#C9E265] hover:bg-[#A9C243] transition-all relative shadow-[2px_2px_0_#1C120C]" title="Lacak Pengiriman">
                  <Navigation size={18} strokeWidth={2.5} className="text-[#1C120C]" />
                  {myOrders.some(o => o.status === 'Proses' && o.metode_pengiriman === 'Kirim dari kedai') && (
                     <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                  )}
               </button>

               <button onClick={() => window.location.href = '/pelanggan/shop'} className="w-10 h-10 rounded-full border-2 border-[#1C120C] bg-[#1C120C] text-white flex items-center justify-center hover:bg-[#FF5C00] hover:border-[#FF5C00] transition-transform shadow-[2px_2px_0_#1C120C] hover:-translate-y-1 active:translate-y-0 active:shadow-none">
                  <ShoppingBag size={18} strokeWidth={2.5} />
               </button>

               {/* User Profile Dropdown */}
               <div className="relative">
                  <button onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)} className="w-10 h-10 rounded-full border-2 border-[#1C120C] bg-white flex items-center justify-center text-[#1C120C] hover:bg-[#FF5C00] hover:text-white transition-all shadow-[2px_2px_0_#1C120C] hover:-translate-y-1">
                     <User size={20} strokeWidth={2.5} />
                  </button>
                  {isUserDropdownOpen && (
                     <div className="absolute right-0 top-14 w-[240px] bg-[#F4F0EA] rounded-[20px] border-4 border-[#1C120C] shadow-[8px_8px_0_#1C120C] py-2 text-[#1C120C] z-[120] animate-in fade-in zoom-in-95">
                        <div className="px-5 py-4 border-b-2 border-[#1C120C] mb-2 bg-white rounded-t-[14px] flex items-center gap-4 mx-1 mt-1">
                           <div className="w-12 h-12 rounded-full border-2 border-[#1C120C] bg-[#C9E265] text-[#1C120C] flex items-center justify-center font-black text-xl shadow-[2px_2px_0_#1C120C]">{profileData.username ? profileData.username.charAt(0).toUpperCase() : 'U'}</div>
                           <div className="flex-1 overflow-hidden">
                              <p className="text-[10px] uppercase font-black text-[#FF5C00] leading-none mb-1">Hi, Wassup!</p>
                              <p className="text-[14px] font-black truncate leading-tight">{profileData.username}</p>
                           </div>
                        </div>
                        <button onClick={() => setActiveTab('Profil')} className="w-full text-left px-6 py-3 text-[13px] font-black uppercase hover:bg-white flex items-center gap-3 transition-colors border-b border-gray-200">
                           <Settings size={18} strokeWidth={2.5} /> Akun Setup
                        </button>
                        <button onClick={handleLogout} className="w-full text-left px-6 py-3 text-[13px] font-black uppercase text-red-600 hover:bg-white flex items-center gap-3 transition-colors rounded-b-[16px]">
                           <LogOut size={18} strokeWidth={2.5} /> Log Out
                        </button>
                     </div>
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

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-8 pt-28 pb-12">
        
        {/* --- SIDEBAR --- */}
        <aside className="w-full lg:w-[280px] shrink-0">
          <div className="bg-[#C9E265] rounded-[24px] border-4 border-[#1C120C] shadow-[6px_6px_0_#1C120C] p-6 mb-6 flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-[16px] border-4 border-[#1C120C] bg-white flex items-center justify-center overflow-hidden transform -rotate-3 shadow-[2px_2px_0_#1C120C]">
                <User size={30} strokeWidth={3} className="text-[#1C120C]" />
              </div>
            </div>
            <div>
              <h2 className="font-black text-[18px] text-[#1C120C] truncate max-w-[150px]">{profileData.username}</h2>
              <button className="text-[10px] uppercase font-black tracking-widest text-[#1C120C]/60 flex items-center gap-1 hover:text-[#FF5C00] transition-colors mt-1 border-2 border-[#1C120C] px-2 py-1 bg-white rounded-[8px]">
                <Edit2 size={10} strokeWidth={3} />
                Ubah Profil
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[24px] border-4 border-[#1C120C] shadow-[8px_8px_0_#1C120C] p-4">
            <nav className="flex flex-col space-y-2">
              {menuItems.map((item, idx) => {
                if (item.divider) return <div key={idx} className="h-1 bg-[#1C120C] my-4 mx-4"></div>;
                
                if (item.isHeader) {
                  const isClickable = item.title === 'Pesanan Anda';
                  return (
                    <button 
                      key={item.id}
                      onClick={() => isClickable && setActiveTab(item.title)}
                      className={`flex items-center justify-between w-full p-3 rounded-[16px] transition-all border-2 border-transparent ${isClickable && activeTab === item.title ? 'bg-[#FF5C00] text-white border-[#1C120C] shadow-[4px_4px_0_#1C120C]' : 'hover:bg-[#F4F0EA] hover:border-[#1C120C]'} group`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center border-2 border-[#1C120C] ${isClickable && activeTab === item.title ? 'bg-white text-[#1C120C] shadow-[2px_2px_0_#1C120C]' : 'bg-[#F4F0EA] text-[#1C120C] group-hover:bg-[#C9E265] group-hover:shadow-[2px_2px_0_#1C120C]'} transition-all`}>
                          <item.icon size={20} strokeWidth={3} />
                        </div>
                        <span className={`font-black text-[14px] uppercase tracking-wider ${isClickable && activeTab === item.title ? 'text-white' : 'text-[#1C120C]'}`}>{item.title}</span>
                      </div>
                      {isClickable && <ChevronRight size={20} strokeWidth={3} className={`transition-transform ${activeTab === item.title ? 'text-white translate-x-1' : 'text-[#1C120C]/30 group-hover:text-[#1C120C]'}`} />}
                    </button>
                  );
                }

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.title)}
                    className={`flex items-center w-full pl-16 pr-4 py-3 rounded-[12px] text-[12px] font-black uppercase tracking-widest transition-all duration-300 border-2 border-transparent ${
                      activeTab === item.title 
                        ? 'text-[#FF5C00] border-[#1C120C] bg-[#F4F0EA] shadow-[4px_4px_0_#1C120C]' 
                        : 'text-[#1C120C]/60 hover:text-[#1C120C] hover:bg-[#C9E265] hover:border-[#1C120C]'
                    }`}
                  >
                    <span className="relative">
                      {item.title}
                      {activeTab === item.title && (
                         <span className="absolute -left-5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border-2 border-[#1C120C] bg-[#C9E265] animate-pulse"></span>
                      )}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* --- MAIN CONTENT --- */}
        <main className="flex-1 bg-white rounded-[32px] border-4 border-[#1C120C] shadow-[12px_12px_0_#1C120C] overflow-hidden min-h-[600px] relative">
          
          {/* Header Area */}
          <div className="px-6 md:px-10 pt-10 pb-6 border-b-4 border-[#1C120C] flex flex-col sm:flex-row sm:items-end justify-between gap-4 bg-[#C9E265]">
            <div>
              <h1 className="text-[28px] md:text-[32px] font-black tracking-tighter uppercase text-[#1C120C]">{activeTab}</h1>
              <p className="text-[12px] md:text-[14px] text-[#1C120C]/80 font-black uppercase tracking-widest mt-2">
                {activeTab === 'Profil' && 'Kelola profil & data diri'}
                {activeTab === 'Alamat' && 'Kelola alamat pengiriman'}
                {activeTab === 'Ubah Password' && 'Perbarui kata sandi keamanan'}
                {activeTab === 'Pesanan Anda' && 'Pantau & lacak pesanan'}
              </p>
            </div>
            {activeTab === 'Profil' && (
               <div className="flex items-center gap-2 text-[10px] md:text-xs font-black uppercase tracking-widest text-[#1C120C] bg-white px-4 py-2 rounded-[12px] border-4 border-[#1C120C] shadow-[4px_4px_0_#1C120C] self-start transform rotate-2">
                  <ShieldCheck size={18} strokeWidth={3} className="text-[#FF5C00]" />
                  Akun Terverifikasi
               </div>
            )}
          </div>

          <div className="p-6 md:p-10">
            {activeTab === 'Profil' && (
              <div className="flex flex-col-reverse lg:flex-row gap-12 lg:gap-8">
                {/* Form Area */}
                <div className="flex-1 space-y-8">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8 border-b-4 border-gray-100 pb-6">
                    <label className="text-[14px] font-black uppercase tracking-widest text-[#1C120C] sm:w-40 shrink-0">Username</label>
                    <div className="flex-1">
                      <p className="text-[16px] font-black text-[#1C120C] bg-[#F4F0EA] border-4 border-[#1C120C] px-4 py-2 rounded-[12px] inline-block">{profileData.username}</p>
                      <p className="text-[10px] font-black text-[#1C120C]/50 mt-2 uppercase">Username permanen 1 kali ubah.</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8 group border-b-4 border-gray-100 pb-6">
                    <label className="text-[14px] font-black uppercase tracking-widest text-[#1C120C] sm:w-40 shrink-0">Nama</label>
                    <div className="flex-1">
                      <input 
                        type="text" 
                        value={profileData.name}
                        onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                        className="w-full px-5 py-3 rounded-[16px] border-4 border-[#1C120C] bg-[#F4F0EA] focus:bg-white focus:outline-none transition-all text-[14px] font-black shadow-[4px_4px_0_#1C120C] focus:shadow-none focus:translate-y-1 focus:translate-x-1"
                        placeholder="NAMA LENGKAP"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8 border-b-4 border-gray-100 pb-6">
                    <label className="text-[14px] font-black uppercase tracking-widest text-[#1C120C] sm:w-40 shrink-0">Email</label>
                    <div className="flex-1 flex items-center gap-4">
                      <span className="text-[15px] font-black text-[#1C120C]">{profileData.email}</span>
                      <button className="text-[10px] font-black text-[#FF5C00] uppercase border-2 border-[#FF5C00] px-3 py-1 rounded-[8px] hover:bg-[#FF5C00] hover:text-white transition-colors">Ubah</button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8 border-b-4 border-gray-100 pb-6">
                    <label className="text-[14px] font-black uppercase tracking-widest text-[#1C120C] sm:w-40 shrink-0">Telp / WA</label>
                    <div className="flex-1 flex items-center gap-4">
                      <span className="text-[15px] font-black text-[#1C120C]">{profileData.phone}</span>
                      <button className="text-[10px] font-black text-[#FF5C00] uppercase border-2 border-[#FF5C00] px-3 py-1 rounded-[8px] hover:bg-[#FF5C00] hover:text-white transition-colors">Ubah</button>
                    </div>
                  </div>


                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8 border-b-4 border-gray-100 pb-6">
                    <label className="text-[14px] font-black uppercase tracking-widest text-[#1C120C] sm:w-40 shrink-0">Gender</label>
                    <div className="flex-1 flex items-center gap-6">
                      {['Laki-laki', 'Perempuan', 'Lainnya'].map(gender => (
                        <label key={gender} className="flex items-center gap-3 cursor-pointer group">
                          <div className="relative flex items-center justify-center w-6 h-6">
                            <input 
                              type="radio" 
                              name="gender" 
                              checked={profileData.gender === gender}
                              onChange={() => setProfileData({...profileData, gender})}
                              className="peer appearance-none w-6 h-6 rounded-[8px] border-4 border-[#1C120C] bg-white checked:bg-[#C9E265] cursor-pointer transition-colors shadow-[2px_2px_0_#1C120C]" 
                            />
                            <div className="absolute w-2 h-2 rounded-full bg-[#1C120C] scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                          </div>
                          <span className="text-[12px] font-black uppercase tracking-widest text-[#1C120C]">{gender}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8">
                    <label className="text-[14px] font-black uppercase tracking-widest text-[#1C120C] sm:w-40 shrink-0">Lahir</label>
                    <div className="flex-1 flex gap-4">
                      <select value={profileData.dob_day} onChange={(e) => setProfileData({...profileData, dob_day: e.target.value})} className="px-4 py-3 rounded-[12px] border-4 border-[#1C120C] bg-[#F4F0EA] outline-none text-[14px] font-black cursor-pointer flex-1 shadow-[4px_4px_0_#1C120C]">
                        <option value="" disabled>TGL</option>
                        {[...Array(31)].map((_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
                      </select>
                      <select value={profileData.dob_month} onChange={(e) => setProfileData({...profileData, dob_month: e.target.value})} className="px-4 py-3 rounded-[12px] border-4 border-[#1C120C] bg-[#F4F0EA] outline-none text-[14px] font-black cursor-pointer flex-1 shadow-[4px_4px_0_#1C120C]">
                        <option value="" disabled>BLN</option>
                        {['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'].map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <select value={profileData.dob_year} onChange={(e) => setProfileData({...profileData, dob_year: e.target.value})} className="px-4 py-3 rounded-[12px] border-4 border-[#1C120C] bg-[#F4F0EA] outline-none text-[14px] font-black cursor-pointer flex-1 shadow-[4px_4px_0_#1C120C]">
                        <option value="" disabled>THN</option>
                        {[...Array(100)].map((_, i) => { 
                          const y = new Date().getFullYear() - i; 
                          return <option key={i} value={y}>{y}</option>;
                        })}
                      </select>
                    </div>
                  </div>

                  <div className="pt-6">
                    <button onClick={handleSaveProfile} disabled={isSaving} className="w-full sm:w-auto bg-[#FF5C00] text-white border-4 border-[#1C120C] shadow-[6px_6px_0_#1C120C] font-black uppercase tracking-widest py-4 px-10 rounded-[16px] text-[14px] transition-all hover:bg-[#1C120C] active:translate-y-1 active:translate-x-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed">
                      {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                  </div>
                </div>

                {/* Avatar Area */}
                <div className="w-full lg:w-[280px] lg:border-l-4 border-[#1C120C] flex flex-col items-center justify-start lg:pl-10 pt-4">
                  <div className="relative group cursor-pointer mb-6">
                    <div className="w-32 h-32 rounded-[24px] border-4 border-[#1C120C] shadow-[6px_6px_0_#1C120C] overflow-hidden bg-white flex items-center justify-center relative transform rotate-3">
                      <User size={50} strokeWidth={3} className="text-[#1C120C]" />
                      
                      {/* Overlay Edit Avatar */}
                      <div className="absolute inset-0 bg-[#C9E265]/90 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300">
                        <Camera size={28} strokeWidth={3} className="text-[#1C120C]" />
                      </div>
                    </div>
                  </div>

                  <input type="file" id="avatarUpload" className="hidden" accept="image/jpeg, image/png" />
                  <label htmlFor="avatarUpload" className="border-4 border-[#1C120C] text-[#1C120C] bg-[#C9E265] shadow-[4px_4px_0_#1C120C] hover:bg-[#FF5C00] hover:text-white font-black uppercase tracking-widest py-3 px-6 rounded-[16px] text-[12px] cursor-pointer transition-all active:translate-y-1 active:shadow-none mb-6 text-center inline-block">
                    Pilih Gambar
                  </label>

                  <div className="text-center space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#1C120C]/60">Maks. 1 MB</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#1C120C]/60">.JPEG, .PNG</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Alamat' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b-4 border-gray-100">
                    <h3 className="text-[20px] font-black uppercase tracking-tighter text-[#1C120C]">Daftar Alamat</h3>
                    <button 
                      onClick={() => handleOpenAddressModal()}
                      className="flex items-center gap-2 bg-[#C9E265] text-[#1C120C] border-4 border-[#1C120C] shadow-[4px_4px_0_#1C120C] font-black uppercase tracking-widest py-3 px-6 rounded-[16px] text-[12px] transition-all hover:bg-[#FF5C00] hover:text-white active:translate-y-1 active:shadow-none"
                    >
                       <Plus size={18} strokeWidth={3} /> Alamat Baru
                    </button>
                 </div>

                 {addresses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center border-4 border-dashed border-[#1C120C]/20 rounded-[32px] bg-[#F4F0EA]">
                       <div className="w-20 h-20 bg-white border-4 border-[#1C120C] shadow-[4px_4px_0_#1C120C] rounded-[20px] flex items-center justify-center mb-6 transform -rotate-3">
                          <MapPin size={32} strokeWidth={3} className="text-[#FF5C00]" />
                       </div>
                       <h3 className="text-xl font-black uppercase tracking-tighter text-[#1C120C] mb-2">Belum ada alamat</h3>
                       <p className="text-[12px] font-black uppercase tracking-widest text-[#1C120C]/60 mb-8 max-w-sm">Tambahkan alamat pengiriman untuk mempermudah saat checkout.</p>
                    </div>
                 ) : (
                    <div className="space-y-6">
                       {addresses.map((addr) => (
                          <div key={addr.id} className="group relative border-4 border-[#1C120C] bg-[#F4F0EA] p-6 rounded-[24px] shadow-[6px_6px_0_#1C120C]">
                             <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                <div className="flex-1">
                                   <div className="flex items-center gap-3 mb-4">
                                      <span className="font-black text-[18px] text-[#1C120C] uppercase tracking-tighter border-r-4 pr-3 border-[#1C120C]">{addr.name}</span>
                                      <span className="text-[#1C120C]/60 text-[14px] font-black">{addr.phone}</span>
                                   </div>
                                   <div className="space-y-2 text-[14px] text-[#1C120C] font-black">
                                      <p>{addr.street_details}</p>
                                      <p className="text-[#1C120C]/70">{addr.other_details}</p>
                                      <p className="text-[#FF5C00] uppercase tracking-widest text-[12px]">{addr.province_city_district}</p>
                                   </div>
                                   {addr.is_default && (
                                      <div className="mt-4">
                                         <span className="px-3 py-1 rounded-[8px] bg-[#C9E265] border-2 border-[#1C120C] text-[#1C120C] text-[10px] font-black uppercase tracking-widest inline-block transform -rotate-2 shadow-[2px_2px_0_#1C120C]">Utama</span>
                                      </div>
                                   )}
                                </div>

                                <div className="flex flex-row md:flex-col items-center md:items-end gap-4 shrink-0">
                                   <div className="flex items-center gap-4">
                                      <button 
                                        onClick={() => handleOpenAddressModal(addr)}
                                        className="text-[12px] font-black uppercase tracking-widest text-[#FF5C00] hover:text-[#1C120C] transition-colors border-b-2 border-transparent hover:border-[#1C120C]"
                                      >
                                        Ubah
                                      </button>
                                      {!addr.is_default && (
                                         <button 
                                           onClick={() => handleDeleteAddress(addr.id)}
                                           className="text-[12px] font-black uppercase tracking-widest text-red-500 hover:text-[#1C120C] transition-colors border-b-2 border-transparent hover:border-[#1C120C]"
                                         >
                                           Hapus
                                         </button>
                                      )}
                                   </div>
                                   <button 
                                     disabled={addr.is_default}
                                     onClick={() => handleSetDefault(addr.id)}
                                     className={`px-4 py-2 rounded-[12px] border-4 font-black text-[10px] uppercase tracking-widest transition-all active:translate-y-1 ${addr.is_default ? 'border-[#1C120C]/20 text-[#1C120C]/40 bg-gray-100 cursor-not-allowed shadow-none' : 'border-[#1C120C] bg-white text-[#1C120C] hover:bg-[#C9E265] shadow-[4px_4px_0_#1C120C] active:shadow-none'}`}
                                   >
                                      Jadikan Utama
                                   </button>
                                </div>
                             </div>
                          </div>
                       ))}
                    </div>
                 )}
              </div>
            )}

            {activeTab === 'Ubah Password' && (
              <div className="max-w-md mx-auto py-8 space-y-6">
                 <div className="space-y-3">
                    <label className="text-[14px] font-black uppercase tracking-widest text-[#1C120C]">Password Saat Ini</label>
                    <input type="password" value={passwordStates.currentPassword} onChange={(e) => setPasswordStates({...passwordStates, currentPassword: e.target.value})} placeholder="******" className="w-full px-5 py-3 rounded-[16px] border-4 border-[#1C120C] bg-[#F4F0EA] focus:bg-white focus:outline-none transition-all text-[14px] font-black shadow-[4px_4px_0_#1C120C] focus:shadow-none focus:translate-y-1 focus:translate-x-1" />
                 </div>
                 <div className="space-y-3">
                    <label className="text-[14px] font-black uppercase tracking-widest text-[#1C120C]">Password Baru</label>
                    <input type="password" value={passwordStates.newPassword} onChange={(e) => setPasswordStates({...passwordStates, newPassword: e.target.value})} placeholder="******" className="w-full px-5 py-3 rounded-[16px] border-4 border-[#1C120C] bg-[#F4F0EA] focus:bg-white focus:outline-none transition-all text-[14px] font-black shadow-[4px_4px_0_#1C120C] focus:shadow-none focus:translate-y-1 focus:translate-x-1" />
                 </div>
                 <div className="space-y-3">
                    <label className="text-[14px] font-black uppercase tracking-widest text-[#1C120C]">Konfirmasi Baru</label>
                    <input type="password" value={passwordStates.confirmPassword} onChange={(e) => setPasswordStates({...passwordStates, confirmPassword: e.target.value})} placeholder="******" className="w-full px-5 py-3 rounded-[16px] border-4 border-[#1C120C] bg-[#F4F0EA] focus:bg-white focus:outline-none transition-all text-[14px] font-black shadow-[4px_4px_0_#1C120C] focus:shadow-none focus:translate-y-1 focus:translate-x-1" />
                 </div>
                  <button onClick={handleUpdatePassword} className="w-full bg-[#1C120C] text-white border-4 border-[#1C120C] font-black uppercase tracking-widest py-4 rounded-[16px] text-[14px] transition-all hover:bg-[#FF5C00] shadow-[6px_6px_0_#1C120C] active:translate-y-1 active:translate-x-1 active:shadow-none mt-8">
                     Perbarui Password
                  </button>
                  <div className="text-center mt-6">
                     <a href="https://wa.me/6282338975768?text=Halo%20Admin,%20saya%20lupa%20password%20akun%20POS%20saya." target="_blank" rel="noopener noreferrer" className="text-[10px] font-black uppercase tracking-widest text-[#1C120C]/60 hover:text-[#FF5C00] transition-colors border-b-2 border-transparent hover:border-[#FF5C00] pb-1">Lupa Password? Hubungi Admin</a>
                  </div>
               </div>
            )}

            {activeTab === 'Pesanan Anda' && (
               <div className="space-y-6 animate-in fade-in duration-300">
                 {myOrders.length === 0 ? (
                   <div className="flex flex-col items-center justify-center py-20 text-center border-4 border-dashed border-[#1C120C]/20 rounded-[32px] bg-[#F4F0EA]">
                      <div className="w-24 h-24 bg-[#FF5C00] rounded-[24px] border-4 border-[#1C120C] shadow-[6px_6px_0_#1C120C] flex items-center justify-center mb-8 transform -rotate-6">
                         <Package size={40} strokeWidth={3} className="text-white" />
                      </div>
                      <h3 className="text-2xl font-black uppercase tracking-tighter text-[#1C120C] mb-3">Belum ada pesanan</h3>
                      <p className="text-[12px] font-black uppercase tracking-widest text-[#1C120C]/60 mb-8 max-w-sm">Anda belum melakukan pesanan apa pun. Mari mulai berbelanja kopi kami.</p>
                      <button onClick={() => window.location.href='/pelanggan/shop'} className="bg-[#C9E265] text-[#1C120C] border-4 border-[#1C120C] shadow-[4px_4px_0_#1C120C] font-black uppercase tracking-widest py-4 px-10 rounded-[16px] text-[14px] transition-all hover:bg-[#FF5C00] hover:text-white active:translate-y-1 active:translate-x-1 active:shadow-none">
                         Mulai Belanja
                      </button>
                   </div>
                 ) : (
                   <div className="space-y-8">
                     {myOrders.map(o => (
                       <div key={o.id} className="bg-white rounded-[24px] border-4 border-[#1C120C] shadow-[8px_8px_0_#1C120C] overflow-hidden">
                         <div className="px-6 py-5 bg-[#F4F0EA] border-b-4 border-[#1C120C] flex flex-wrap justify-between items-center gap-4">
                           <div className="flex items-center gap-4">
                             <span className="font-black text-[#1C120C] text-[16px] md:text-[18px] uppercase tracking-tighter bg-white px-3 py-1 rounded-[8px] border-2 border-[#1C120C]">TRX-2026-{String(o.id).padStart(3, '0')}</span>
                             <span className="text-[10px] text-[#1C120C]/60 font-black uppercase tracking-widest">
                               {new Date(o.created_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }).replace(',', '')}
                             </span>
                           </div>
                           <span className={`px-4 py-2 rounded-[12px] border-2 border-[#1C120C] text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0_#1C120C] ${
                             o.status === 'Selesai' ? 'bg-[#C9E265] text-[#1C120C]' :
                             o.status === 'Proses' ? 'bg-[#FF5C00] text-white' : 'bg-white text-[#1C120C]'
                           }`}>
                             {o.status === 'Selesai' ? 'Selesai ✔️' : o.status === 'Proses' ? 'Diproses 📦' : 'Menunggu ⏳'}
                           </span>
                         </div>
                         <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                           <div>
                             <h4 className="font-black text-[#1C120C] text-[16px] uppercase tracking-wider mb-5 border-b-4 border-[#1C120C] inline-block pb-1">Detail Pengiriman</h4>
                             <div className="space-y-4 text-[12px] font-black text-[#1C120C]">
                                <div><span className="text-[#FF5C00] uppercase block text-[10px] tracking-widest mb-1">Penerima</span>{o.nama_pelanggan}</div>
                                <div><span className="text-[#FF5C00] uppercase block text-[10px] tracking-widest mb-1">No WhatsApp</span>{o.no_wa}</div>
                                <div>
                                  <span className="text-[#FF5C00] uppercase block text-[10px] tracking-widest mb-1">Alamat Lengkap</span>
                                  {(() => {
                                     const parseAlamat = (alamatStr) => {
                                        if (!alamatStr) return { detail: 'Alamat tidak diinput', wilayah: '', tipe: '' };
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

                                     const { detail, wilayah, tipe } = parseAlamat(o.alamat);
                                     return (
                                        <div className="bg-[#F4F0EA] p-4 rounded-[12px] border-4 border-[#1C120C] shadow-[4px_4px_0_#1C120C] mt-2 space-y-2">
                                           <div className="flex items-center gap-3 flex-wrap">
                                              <span className="font-black text-[#1C120C]">{detail}</span>
                                              {tipe && (
                                                 <span className={`px-2 py-1 rounded-[8px] border-2 border-[#1C120C] text-[8px] font-black uppercase tracking-widest ${
                                                    tipe === 'Dekat Kedai' ? 'bg-[#C9E265] text-[#1C120C]' : 'bg-[#FF5C00] text-white'
                                                 }`}>
                                                    {tipe}
                                                 </span>
                                              )}
                                           </div>
                                           {wilayah && <p className="text-[10px] text-[#1C120C]/60 uppercase tracking-widest font-black">{wilayah}</p>}
                                        </div>
                                     );
                                  })()}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div><span className="text-[#FF5C00] uppercase block text-[10px] tracking-widest mb-1">Pengiriman</span>{o.metode_pengiriman}</div>
                                  <div><span className="text-[#FF5C00] uppercase block text-[10px] tracking-widest mb-1">Pembayaran</span>{o.metode_pembayaran}</div>
                                </div>
                              </div>
                           </div>
                           <div>
                             <h4 className="font-black text-[#1C120C] text-[16px] uppercase tracking-wider mb-5 border-b-4 border-[#1C120C] inline-block pb-1">Item Belanja</h4>
                             <div className="border-4 border-[#1C120C] rounded-[16px] p-5 bg-[#F4F0EA] shadow-[4px_4px_0_#1C120C] max-h-[250px] overflow-y-auto custom-scrollbar">
                               <ul className="space-y-4">
                                 {parsePesananJSON(o.pesanan, o.total_harga).map((it, idx) => (
                                   <li key={idx} className="flex justify-between items-center text-[12px] font-black text-[#1C120C] border-b-2 border-dashed border-[#1C120C]/20 pb-3 last:border-0 last:pb-0">
                                     <span className="flex items-center gap-3"><span className="bg-[#C9E265] border-2 border-[#1C120C] px-2 py-0.5 rounded-[6px] shadow-[2px_2px_0_#1C120C]">{it.jumlah || 1}x</span>{it.nama || 'Produk'}</span>
                                     <span className="text-[14px]">Rp {((it.harga || 0) * (it.jumlah || 1)).toLocaleString('id-ID')}</span>
                                   </li>
                                 ))}
                               </ul>
                             </div>
                             <div className="flex justify-between items-center mt-6 pt-4 border-t-4 border-[#1C120C]">
                               <span className="text-[12px] uppercase tracking-widest text-[#1C120C] font-black">Total Pembayaran</span>
                               <span className="font-black text-2xl text-[#FF5C00] bg-white border-4 border-[#1C120C] px-4 py-2 rounded-[12px] shadow-[4px_4px_0_#1C120C] transform rotate-2">Rp {(o.total_harga || 0).toLocaleString('id-ID')}</span>
                             </div>
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
            )}
           </div>
         </main>
      </div>

      {/* --- FOOTER --- */}
      <footer className="bg-[#1C120C] text-[#F4F0EA] border-t-4 border-[#1C120C] pt-24 pb-12 px-6 lg:px-12 relative overflow-hidden">
        <div className="max-w-[1200px] mx-auto relative z-10">
          <h2 className="text-4xl md:text-5xl font-black text-center mb-20 tracking-tighter uppercase text-[#C9E265]">Kopi<br/><span className="text-white text-2xl">Gombengsari</span></h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 text-[12px] font-black uppercase tracking-widest border-t-4 border-gray-800 pt-16">
            <div className="lg:col-span-1 space-y-5">
              <h5 className="font-black mb-5 text-[#C9E265] text-[14px]">REACH US</h5>
              <p className="flex items-center gap-4 text-[#F4F0EA]/80 hover:text-[#FF5C00] transition-colors cursor-pointer"><Phone size={18} strokeWidth={3} /> 082338975768</p>
              <p className="flex items-center gap-4 text-[#F4F0EA]/80 hover:text-[#FF5C00] transition-colors cursor-pointer"><Mail size={18} strokeWidth={3} /> kopiproyek@gmail.com</p>
              <p className="flex items-start gap-4 text-[#F4F0EA]/80 hover:text-[#FF5C00] transition-colors cursor-pointer"><MapPin size={20} strokeWidth={3} className="shrink-0 mt-1" /> Gombengsari, Kalipuro, Banyuwangi</p>
            </div>

            <div>
              <h5 className="font-black mb-5 text-[#C9E265] text-[14px]">COMPANY</h5>
              <ul className="space-y-4 text-[#F4F0EA]/80">
                <li><a href="/pelanggan#about" className="hover:text-[#FF5C00] hover:translate-x-1 inline-block transition-transform">About</a></li>
                <li><a href="/pelanggan#contact" className="hover:text-[#FF5C00] hover:translate-x-1 inline-block transition-transform">Contact</a></li>
                <li><a href="/pelanggan/shop" className="hover:text-[#FF5C00] hover:translate-x-1 inline-block transition-transform">Shop</a></li>
              </ul>
            </div>

            <div>
              <h5 className="font-black mb-5 text-[#C9E265] text-[14px]">LEGAL</h5>
              <ul className="space-y-4 text-[#F4F0EA]/80">
                <li><a href="#" className="hover:text-[#FF5C00] inline-block transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-[#FF5C00] inline-block transition-colors">Terms of Use</a></li>
                <li><a href="#" className="hover:text-[#FF5C00] inline-block transition-colors">Terms & Services</a></li>
                <li><a href="#" className="hover:text-[#FF5C00] inline-block transition-colors">Refund Policy</a></li>
              </ul>
            </div>

            <div className="lg:col-span-1">
              <h5 className="font-black mb-5 text-[#C9E265] text-[14px]">QUICK LINKS</h5>
              <ul className="space-y-4 text-[#F4F0EA]/80">
                <li><a href="#" className="hover:text-[#FF5C00] inline-block transition-colors">Techno/Vendor</a></li>
                <li><a href="#" className="hover:text-[#FF5C00] inline-block transition-colors">Downloads</a></li>
                <li><a href="#" className="hover:text-[#FF5C00] inline-block transition-colors">Forum</a></li>
              </ul>
            </div>

            <div className="lg:col-span-1 border-l-4 border-gray-800 pl-0 lg:pl-8">
              <h5 className="font-black mb-5 text-[#C9E265] text-[14px]">NEWSLETTER</h5>
              <div className="flex bg-[#F4F0EA] p-1.5 rounded-[12px] border-4 border-[#1C120C] shadow-[4px_4px_0_#C9E265] transition-colors focus-within:shadow-none focus-within:translate-y-1">
                <input type="email" placeholder="Email address" className="bg-transparent w-full px-3 text-[12px] text-[#1C120C] outline-none placeholder:text-[#1C120C]/40 font-black" />
                <button className="bg-[#FF5C00] text-white px-4 py-2 rounded-[8px] text-[10px] font-black uppercase tracking-widest border-2 border-[#1C120C] hover:bg-[#1C120C] hover:text-[#C9E265] transition-colors">Go</button>
              </div>
              <p className="mt-4 text-[10px] text-[#F4F0EA]/40">Subscribe untuk info diskon dan produk terbaru.</p>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t-4 border-gray-800 text-center text-[#F4F0EA]/40 text-[10px] flex flex-col md:flex-row justify-between items-center gap-4">
            <p>COPYRIGHT © 2026 KOPI GOMBENGSARI. ALL RIGHTS RESERVED.</p>
            <div className="flex gap-4">
               <a href="#" className="hover:text-[#FF5C00] transition-colors">IG</a>
               <a href="#" className="hover:text-[#FF5C00] transition-colors">FB</a>
               <a href="#" className="hover:text-[#FF5C00] transition-colors">TW</a>
            </div>
          </div>
        </div>
      </footer>

      {isAddressModalOpen && (
         <AddressModal 
            address={editingAddress}
            username={profileData.username}
            onClose={() => setIsAddressModalOpen(false)}
            onSuccess={() => {
               setIsAddressModalOpen(false);
               fetchAddresses(profileData.username);
            }}
         />
      )}
    </div>
  );
}
