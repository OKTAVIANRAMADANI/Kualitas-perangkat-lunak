"use client";

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MessageCircle, X, ChevronLeft, User, Send, StopCircle } from 'lucide-react';

export default function ChatWidget({ onClose, isAdmin = false, initialRoom = null }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatBottomRef = useRef(null);

  // Pelanggan
  const [hasName, setHasName] = useState(false);
  const [roomName, setRoomName] = useState('');


  // Admin
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(initialRoom);

  useEffect(() => {
    if (!isAdmin) {
      const savedName = localStorage.getItem('kopiGombeng_chatName');
      if (savedName) {
        setRoomName(savedName);
        setHasName(true);
      }
    }
  }, [isAdmin]);

  const saveNameAndStart = (e) => {
    e.preventDefault();
    if (!roomName.trim()) return;
    localStorage.setItem('kopiGombeng_chatName', roomName);
    setHasName(true);
  };

  const fetchContent = async () => {
    try {
      if (isAdmin && !activeRoom) {
        const res = await axios.get('http://localhost:5000/api/chats/rooms');
        setRooms(res.data);
      } else {
        const currentRoomId = isAdmin ? activeRoom : roomName;
        if (!currentRoomId) return;
        const res = await axios.get(`http://localhost:5000/api/chats?room=${currentRoomId}`);
        setMessages(res.data);
      }
    } catch (e) { }
  };

  useEffect(() => {
    fetchContent();
    const interval = setInterval(fetchContent, 3000);
    return () => clearInterval(interval);
  }, [isAdmin, activeRoom, roomName, hasName]);

  useEffect(() => {
    if (chatBottomRef.current && (activeRoom || hasName)) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeRoom, hasName]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const currentRoomId = isAdmin ? activeRoom : roomName;
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/chats', {
        room_id: currentRoomId,
        sender: isAdmin ? 'Admin Pabrik' : 'Pelanggan',
        message: input
      });
      setInput('');
      fetchContent();
    } catch (error) { }
    setLoading(false);
  };

  const renderAdminRoomList = () => (
    <div className="h-[390px] bg-white overflow-y-auto custom-scrollbar flex flex-col divide-y divide-gray-100">
      <div className="bg-gray-50 p-3 text-xs font-bold text-gray-500 uppercase tracking-widest sticky top-0 border-b border-gray-100 z-10 shadow-sm">Daftar Obrolan Masuk</div>
      {rooms.length === 0 ? (
        <div className="p-8 text-center text-gray-400 font-medium text-sm mt-10">Belum ada pelanggan yang menghubungi.</div>
      ) : (
        rooms.map((r, i) => (
          <div key={i} onClick={() => setActiveRoom(r.room_id)} className="p-4 hover:bg-slate-50 cursor-pointer transition-colors flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex justify-center items-center font-bold">
              <User size={18} />
            </div>
            <div className="flex-1 overflow-hidden">
              <h4 className="font-bold text-gray-800 text-sm truncate uppercase">{r.room_id}</h4>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Terakhir: {new Date(r.last_activity).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          </div>
        ))
      )}
    </div>
  );

  const renderGuestLogin = () => (
    <div className="h-[390px] bg-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-4"><User size={30} /></div>
      <h3 className="font-black text-lg text-gray-800 mb-2">Mulai Chat dengan Admin</h3>
      <p className="text-xs text-gray-500 mb-6 font-medium">Silakan masukkan nama Anda agar admin kami kopi dengan siapa mereka berbicara.</p>
      <form onSubmit={saveNameAndStart} className="w-full relative">
        <input required type="text" value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="Ketik nama Anda..." className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-5 py-3 text-sm font-bold focus:border-indigo-500 outline-none text-center" />
        <button type="submit" className="w-full mt-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-md active:scale-95">Mulai Obrolan</button>
      </form>
    </div>
  );

  const renderChatBox = () => (
    <>
      <div className="h-[340px] bg-[#f0f2f5] p-4 overflow-y-auto flex flex-col gap-4 text-[13px] font-medium custom-scrollbar">
        <div className="text-center text-[10px] text-gray-400 my-1 font-bold uppercase tracking-wider">Ruang: {isAdmin ? activeRoom : roomName}</div>

        {messages.map((msg, i) => {
          const isMe = (isAdmin && msg.sender === 'Admin Pabrik') || (!isAdmin && msg.sender === 'Pelanggan');
          return (
            <div key={i} className={`flex max-w-[85%] flex-col ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
              <span className="text-[10px] font-bold text-gray-400 mb-1 px-1">{isMe ? 'Anda' : msg.sender}</span>
              <div className={`px-4 py-3 shadow-sm ${isMe ? `text-white rounded-2xl rounded-br-sm ${isAdmin ? 'bg-gray-800' : 'bg-indigo-600'}` : 'bg-white text-gray-800 rounded-2xl rounded-bl-sm border border-gray-100'}`}>
                {msg.message}
                <p className={`text-[10px] mt-1.5 text-right font-semibold ${isMe ? 'text-white/60' : 'text-gray-400'}`}>
                  {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={chatBottomRef}></div>
      </div>

      <form onSubmit={handleSend} className="p-3.5 bg-white border-t border-gray-100 flex gap-2 items-center">
        <input disabled={loading} value={input} onChange={(e) => setInput(e.target.value)} type="text" placeholder="Tulis pesan..." className="flex-1 bg-gray-100 rounded-full px-5 py-3 text-sm outline-none focus:ring-2 ring-indigo-500/30 border-0 text-gray-800 font-medium" />
        <button disabled={loading || !input.trim()} type="submit" className={`text-white w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-md transition-transform active:scale-95 ${isAdmin ? 'bg-gray-800 hover:bg-black' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
          <Send size={18} fill="currentColor" className="ml-1" />
        </button>
      </form>
    </>
  );

  return (
    <div className="fixed bottom-24 right-6 w-[350px] bg-white rounded-[24px] shadow-2xl border border-gray-100 flex flex-col overflow-hidden z-40 animate-in slide-in-from-bottom-8 duration-300">
      <div className={`p-4 text-white flex justify-between items-center ${isAdmin ? 'bg-gray-900 border-b border-gray-800' : 'bg-gradient-to-r from-indigo-600 to-violet-600'}`}>
        <div className="flex items-center gap-3">
          {isAdmin && activeRoom && (
            <button onClick={() => setActiveRoom(null)} className="mr-1 p-1 hover:bg-white/20 rounded-full transition-colors"><ChevronLeft size={22} /></button>
          )}
          <div className="w-10 h-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center font-extrabold text-sm shadow-sm">
            {isAdmin ? 'AD' : 'CS'}
          </div>
          <div>
            <h3 className="font-bold text-sm leading-tight truncate max-w-[150px]">
              {isAdmin ? (activeRoom || 'Inbox Pabrik') : 'Layanan Pabrik'}
            </h3>
            <p className="text-[11px] text-white/80 flex items-center gap-1.5 mt-0.5"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Online</p>
          </div>
        </div>
        <button onClick={onClose} className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors self-start">
          <X size={20} strokeWidth={2.5} />
        </button>
      </div>

      {isAdmin ? (activeRoom ? renderChatBox() : renderAdminRoomList()) : (hasName ? renderChatBox() : renderGuestLogin())}

    </div>
  );
}
