"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import { User, Mail, Lock, ArrowRight, ShieldCheck, CheckCircle2, ChevronRight, LogIn, Phone, MessageSquare, KeyRound, Smartphone } from 'lucide-react';

export default function PelangganAuthPage() {
  const router = useRouter();
  
  // Registration State
  const [registerStep, setRegisterStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [otpMethod, setOtpMethod] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Toggling between sign in / sign up
  const [isLoginMode, setIsLoginMode] = useState(false);

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
      localStorage.removeItem('kopiGombeng_userPhone'); 
      router.push('/pelanggan');
    } catch (err) {
      setErrorMsg("Gagal terhubung dengan Gmail");
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!username || !email || !password) {
       setErrorMsg("Harap isi semua kolom!");
       return;
    }
    
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await axios.post('http://localhost:5000/api/users/register', {
        username, email, password, phone
      });
      localStorage.setItem('kopiGombeng_chatName', res.data.username);
      localStorage.setItem('kopiGombeng_userPhone', phone);
      router.push('/pelanggan');
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setErrorMsg(err.response.data.error);
      } else {
        setErrorMsg("Terjadi kesalahan sistem!");
      }
    }
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
       setErrorMsg("Harap isi email dan password!");
       return;
    }
    
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await axios.post('http://localhost:5000/api/users/login', {
        email: loginEmail, password: loginPassword
      });
      localStorage.setItem('kopiGombeng_chatName', res.data.username);
      router.push('/pelanggan');
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setErrorMsg(err.response.data.error);
      } else {
        setErrorMsg("Email atau Password tidak sesuai!");
      }
    }
    setLoading(false);
  };

  return (
    <GoogleOAuthProvider clientId="GANTI_DENGAN_CLIENT_ID_GOOGLE_ANDA">
      <div className="min-h-screen bg-[#FDF8F3] flex items-center justify-center p-6 relative overflow-hidden font-sans">
        
        {/* Dekorasi Latar Belakang */}
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-orange-300 rounded-full blur-[120px] opacity-20 pointer-events-none"></div>
      <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-yellow-300 rounded-full blur-[120px] opacity-20 pointer-events-none"></div>

      {/* Main Container */}
      <div className="w-full max-w-[1000px] min-h-[650px] bg-white rounded-[32px] md:rounded-[40px] shadow-[0_20px_60px_-15px_rgba(234,88,12,0.15)] flex flex-col md:flex-row overflow-hidden relative z-10 border border-white/60">
        
        {/* LEFT PANEL: IMAGE BANNER */}
        <div className={`w-full md:w-5/12 relative hidden md:flex flex-col justify-end p-10 overflow-hidden transform transition-transform duration-700`}>
          <div className="absolute inset-0 bg-orange-600">
             <img 
               src="https://images.unsplash.com/photo-1546069901-d5bfd2cbfb1f?q=80&w=600&auto=format&fit=crop" 
               alt="Background Kopi" 
               className="w-full h-full object-cover mix-blend-multiply opacity-60"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-orange-900 via-orange-800/40 to-transparent"></div>
          </div>
          
          <div className="relative z-10">
            <div className="bg-white/20 backdrop-blur-md w-12 h-12 rounded-2xl flex items-center justify-center mb-6 border border-white/30 text-white shadow-xl">
               <ShieldCheck size={28} />
            </div>
            <h1 className="text-4xl font-black text-white leading-tight mb-4 tracking-tight drop-shadow-md">
              {isLoginMode ? 'Akses Dashboard Anda.' : 'Pesan Kopi Kualitas Terbaik.'}
            </h1>
            <p className="text-orange-100/90 font-medium text-sm leading-relaxed mb-8">
              {isLoginMode 
                ? 'Silakan masuk menggunakan akun yang sudah Anda daftarkan untuk mulai memesan kopi segar langsung dari kedai.' 
                : 'Bergabung bersama ribuan pelanggan lainnya. Nikmati kopi segar, kenyal, dan alami setiap hari.'}
            </p>
            
            {/* Indikator Trust/Fitur */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-white/90 text-sm font-semibold">
                <CheckCircle2 size={18} className="text-amber-300" /> Kopi 100% Kedelai Alami
              </div>
              <div className="flex items-center gap-3 text-white/90 text-sm font-semibold">
                <CheckCircle2 size={18} className="text-amber-300" /> Pengiriman Fast Track Kedai
              </div>
            </div>
          </div>
        </div>


        {/* RIGHT PANEL: FORM (WHITE BG) */}
        <div className="w-full md:w-7/12 bg-white flex items-center justify-center p-8 md:p-14 relative h-full min-h-[650px] shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.05)] z-20">
          
          {/* Back to Home Button Float */}
          <button onClick={() => router.push('/')} className="absolute top-6 right-8 text-xs font-bold text-gray-400 hover:text-orange-600 transition-colors uppercase tracking-widest">
            KEMBALI KE BERANDA
          </button>

          {/* Wrapper that handles the fade-in of forms */}
          <div className="w-full max-w-[380px] relative">
            
            {/* ----- REGISTER FORM ----- */}
            <div className={`transition-all duration-500 absolute top-1/2 -translate-y-1/2 w-full ${isLoginMode ? 'opacity-0 translate-x-[20%] pointer-events-none' : 'opacity-100 translate-x-0'}`}>
              <div className="mb-8 text-center md:text-left">
                <div className="inline-block bg-orange-100 text-orange-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4 border border-orange-200/50 shadow-sm">Pendaftaran Baru</div>
                <h2 className="text-[32px] font-black text-gray-800 tracking-tight leading-tight">Mulai Buat Akun</h2>
                <p className="text-gray-500 mt-2 text-sm font-medium">Buat akun untuk akses penuh layanan kedai kami.</p>
              </div>
              
              {errorMsg && !isLoginMode && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold mb-6 border border-red-100 shadow-sm animate-in slide-in-from-top-2">{errorMsg}</div>}

              {registerStep === 1 && (
                <form onSubmit={handleNextStep} className="space-y-4 animate-in fade-in zoom-in-95">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Nomor HP Aktif</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-600 transition-colors"><Phone size={18} /></div>
                      <input 
                        type="tel" 
                        placeholder="Contoh: 08123456789" 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-slate-50 border border-gray-200 text-gray-800 font-semibold rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all text-sm shadow-sm"
                      />
                    </div>
                  </div>
                  <button type="submit" className="w-full mt-4 bg-orange-600 text-white font-black text-base px-6 py-4 rounded-2xl hover:bg-orange-700 active:scale-[0.98] transition-all shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 group">
                    LANJUTKAN <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  
                  <div className="relative flex py-5 items-center">
                      <div className="flex-grow border-t border-gray-200"></div>
                      <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-bold uppercase tracking-widest">Atau</span>
                      <div className="flex-grow border-t border-gray-200"></div>
                  </div>
                  
                  <div className="w-full flex justify-center mt-4">
                    <GoogleLogin
                       onSuccess={handleGoogleSuccess}
                       onError={() => {
                         setErrorMsg("Gagal login dengan Gmail");
                       }}
                       text="signup_with"
                       shape="pill"
                       width="300"
                    />
                  </div>
                </form>
              )}

              {registerStep === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                  <p className="text-sm font-bold text-gray-600 mb-4 text-center">Pilih metode verifikasi untuk <span className="text-orange-600">{phone}</span></p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setOtpMethod('WA')} className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${otpMethod === 'WA' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                       <MessageSquare size={24} className={otpMethod === 'WA' ? 'text-green-600' : 'text-gray-400'} />
                       <span className="font-bold text-sm">WhatsApp</span>
                    </button>
                    <button onClick={() => setOtpMethod('SMS')} className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${otpMethod === 'SMS' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                       <Smartphone size={24} className={otpMethod === 'SMS' ? 'text-blue-600' : 'text-gray-400'} />
                       <span className="font-bold text-sm">SMS</span>
                    </button>
                  </div>

                  <div className="flex gap-2 mt-6">
                    <button onClick={() => setRegisterStep(1)} className="w-1/3 bg-gray-100 text-gray-600 font-bold py-4 rounded-2xl hover:bg-gray-200 transition-all text-sm">KEMBALI</button>
                    <button onClick={handleNextStep} className="w-2/3 bg-orange-600 text-white font-black py-4 rounded-2xl hover:bg-orange-700 active:scale-[0.98] transition-all shadow-lg shadow-orange-600/30">KIRIM OTP</button>
                  </div>
                </div>
              )}

              {registerStep === 3 && (
                <form onSubmit={handleNextStep} className="space-y-4 animate-in fade-in zoom-in-95">
                  <p className="text-sm font-bold text-gray-600 mb-4 text-center">Masukkan kode OTP yang dikirim via <span className="text-orange-600">{otpMethod}</span></p>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Kode OTP</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-600 transition-colors"><KeyRound size={18} /></div>
                      <input 
                        type="text" 
                        maxLength="6"
                        placeholder="Contoh: 123456" 
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        className="w-full bg-slate-50 border border-gray-200 text-gray-800 font-semibold rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all text-sm shadow-sm text-center tracking-[0.5em]"
                      />
                    </div>
                  </div>
                  <button type="submit" className="w-full mt-4 bg-orange-600 text-white font-black text-base px-6 py-4 rounded-2xl hover:bg-orange-700 active:scale-[0.98] transition-all shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 group">
                    VERIFIKASI
                  </button>
                </form>
              )}

              {registerStep === 4 && (
                <form onSubmit={handleRegister} className="space-y-4 animate-in fade-in slide-in-from-right-4">
                  <p className="text-sm font-bold text-green-600 mb-4 text-center bg-green-50 p-2 rounded-lg border border-green-200">Nomor berhasil diverifikasi! Lengkapi profil Anda.</p>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Username / Nama</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-600 transition-colors"><User size={18} /></div>
                      <input 
                        type="text" 
                        placeholder="Masukkan nama..." 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-slate-50 border border-gray-200 text-gray-800 font-semibold rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all text-sm shadow-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Alamat Email</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-600 transition-colors"><Mail size={18} /></div>
                      <input 
                        type="email" 
                        placeholder="contoh@gmail.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-gray-200 text-gray-800 font-semibold rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all text-sm shadow-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Password Rahasia</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-600 transition-colors"><Lock size={18} /></div>
                      <input 
                        type="password" 
                        placeholder="Buat password aman" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-gray-200 text-gray-800 font-semibold rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all text-sm shadow-sm"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full mt-4 bg-orange-600 text-white font-black text-base px-6 py-4 rounded-2xl hover:bg-orange-700 active:scale-[0.98] transition-all shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 group"
                  >
                    {loading ? 'MEMPROSES...' : 'SELESAI & DAFTAR'} {!loading && <CheckCircle2 size={20} />}
                  </button>
                </form>
              )}

              <div className="mt-8 text-center bg-orange-50/50 p-4 rounded-2xl border border-orange-100">
                 <p className="text-sm font-medium text-gray-600">
                    Sudah memiliki akun? <button onClick={() => { setIsLoginMode(true); setRegisterStep(1); }} className="text-orange-600 font-black hover:underline underline-offset-4 ml-1">Masuk di sini</button>
                 </p>
              </div>
            </div>


            {/* ----- LOGIN FORM ----- */}
            <div className={`transition-all duration-500 absolute top-1/2 -translate-y-1/2 w-full ${!isLoginMode ? 'opacity-0 translate-x-[-20%] pointer-events-none' : 'opacity-100 translate-x-0'}`}>
              <div className="mb-10 text-center md:text-left">
                <div className="inline-block bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4 border border-emerald-200/50 shadow-sm">Selamat Datang Kembali</div>
                <h2 className="text-[32px] font-black text-gray-800 tracking-tight leading-tight">Masuk Akun</h2>
                <p className="text-gray-500 mt-2 text-sm font-medium">Lanjutkan pesanan Anda hari ini dengan persediaan kopi terbaru.</p>
              </div>
              
              {errorMsg && isLoginMode && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold mb-6 border border-red-100 shadow-sm animate-in slide-in-from-top-2">{errorMsg}</div>}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Alamat Email</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-600 transition-colors"><Mail size={18} /></div>
                    <input 
                      type="email" 
                      placeholder="contoh@gmail.com" 
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 text-gray-800 font-semibold rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all text-sm shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-2">
                     <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 block">Password</label>
                     <button type="button" onClick={() => window.open('https://wa.me/6282338975768?text=Halo%20Admin,%20saya%20lupa%20password%20akun%20POS%20saya.', '_blank')} className="text-xs font-bold text-orange-600 hover:text-orange-700">Lupa Password?</button>
                  </div>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-600 transition-colors"><Lock size={18} /></div>
                    <input 
                      type="password" 
                      placeholder="Masukkan password" 
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 text-gray-800 font-semibold rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all text-sm shadow-sm"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full mt-6 bg-gray-900 text-white font-black text-base px-6 py-4 rounded-2xl hover:bg-black active:scale-[0.98] transition-all shadow-xl shadow-gray-900/20 flex items-center justify-center gap-2"
                >
                  {loading ? 'MEMPROSES...' : 'MASUK SEKARANG'}
                </button>
              </form>

              <div className="mt-8 text-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
                 <p className="text-sm font-medium text-gray-600">
                    Belum punya akun? <button onClick={() => setIsLoginMode(false)} className="text-orange-600 font-black hover:underline underline-offset-4 ml-1">Daftar sekarang</button>
                 </p>
              </div>
            </div>

          </div>
        </div>

        </div>
      </div>
    </GoogleOAuthProvider>
  );
}
