import React, { useState } from 'react';
import { multiplayer } from '../services/MultiplayerManager';

interface StartScreenProps {
  onStart: (name: string, avatar: 'male' | 'female' | 'robot', isSingle: boolean) => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<'male' | 'female' | 'robot'>('male');
  const [mode, setMode] = useState<'initial' | 'create' | 'join' | 'single'>('initial');
  const [roomCode, setRoomCode] = useState('');

  const handleAction = () => {
    if (!name) return alert('Enter your name!');
    
    if (mode === 'single') {
      onStart(name, avatar, true);
    } else if (mode === 'create') {
      multiplayer.createRoom(name, avatar);
      onStart(name, avatar, false);
    } else if (mode === 'join') {
      if (!roomCode) return alert('Enter room code!');
      multiplayer.joinRoom(roomCode, name, avatar);
      onStart(name, avatar, false);
    }
  };

  if (mode === 'initial') {
    return (
      <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center p-6 text-center z-50 overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-green-500 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-sm w-full space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight text-white italic drop-shadow-2xl">
              <span className="text-blue-500">Economy</span>
              <span className="text-green-500">Switch</span>
            </h1>
            <p className="text-slate-400 text-sm font-medium uppercase tracking-widest">
              Financial & Eco Strategy
            </p>
          </div>

          <div className="grid gap-4">
            <button 
              onClick={() => setMode('single')}
              className="group relative p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all"
            >
              <div className="flex items-center gap-4 text-left">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  🚀
                </div>
                <div>
                  <h3 className="text-white font-bold">Singleplayer</h3>
                  <p className="text-slate-500 text-xs">Play alone and learn</p>
                </div>
              </div>
            </button>

            <button 
              onClick={() => setMode('create')}
              className="group relative p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all"
            >
              <div className="flex items-center gap-4 text-left">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  🏠
                </div>
                <div>
                  <h3 className="text-white font-bold">Create Room</h3>
                  <p className="text-slate-500 text-xs">Be the host and invite friends</p>
                </div>
              </div>
            </button>

            <button 
              onClick={() => setMode('join')}
              className="group relative p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all"
            >
              <div className="flex items-center gap-4 text-left">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  🔑
                </div>
                <div>
                  <h3 className="text-white font-bold">Join Session</h3>
                  <p className="text-slate-500 text-xs">Enter code to join friends</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center p-6 z-50 overflow-hidden">
      <div className="max-w-sm w-full space-y-8 bg-white/5 p-8 rounded-[32px] border border-white/10 backdrop-blur-xl">
        <button 
          onClick={() => setMode('initial')}
          className="text-slate-500 hover:text-white transition-colors text-sm flex items-center gap-2"
        >
          ← Go Back
        </button>

        <div className="space-y-6">
          <div className="space-y-4 text-center">
            <h2 className="text-2xl font-bold text-white capitalize">
              {mode.replace('_', ' ')} Mode
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-2 block">
                Player Name
              </label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name..."
                className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white placeholder:text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            {mode === 'join' && (
              <div>
                <label className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-2 block">
                  Room Code
                </label>
                <input 
                  type="text" 
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="CODE123"
                  className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white font-mono placeholder:text-slate-700 outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                />
              </div>
            )}

            <div>
              <label className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-2 block text-center">
                Select Avatar
              </label>
              <div className="flex justify-between gap-2">
                {(['male', 'female', 'robot'] as const).map((a) => (
                  <button
                    key={a}
                    onClick={() => setAvatar(a)}
                    className={`flex-1 p-3 rounded-xl border transition-all ${
                      avatar === a 
                        ? 'bg-blue-600/20 border-blue-500 scale-105' 
                        : 'bg-white/5 border-white/10 opacity-50'
                    }`}
                  >
                    <span className="text-3xl block mb-1">
                      {a === 'male' ? '👨' : a === 'female' ? '👩' : '🤖'}
                    </span>
                    <span className="text-[10px] text-white uppercase font-bold">
                      {a}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleAction}
            className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-900/20 hover:scale-105 active:scale-95 transition-all"
          >
            {mode === 'join' ? 'CONNECT' : 'START ADVENTURE'}
          </button>
        </div>
      </div>
    </div>
  );
};
