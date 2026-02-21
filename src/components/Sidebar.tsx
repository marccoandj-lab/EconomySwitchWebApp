import React from 'react';
import { Player } from '../types/game';
import { Level } from '../data/gameData';

interface SidebarProps {
  players: Player[];
  currentTurnIndex: number;
  myId: string;
  levels: Level[];
}

export const Sidebar: React.FC<SidebarProps> = ({ players, currentTurnIndex, myId, levels }) => {
  return (
    <div className="fixed right-0 top-0 h-screen w-64 bg-slate-900/90 backdrop-blur-md border-l border-white/10 p-4 z-40 hidden lg:block">
      <h3 className="text-white font-bold mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        LIVE PLAYERS
      </h3>

      <div className="space-y-4">
        {players.map((player, index) => {
          const isMe = player.id === myId;
          const isTurn = index === currentTurnIndex;

          return (
            <div
              key={player.id}
              className={`p-3 rounded-xl transition-all ${isTurn ? 'bg-blue-600/30 ring-2 ring-blue-500' : 'bg-white/5'
                }`}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <span className="text-2xl">
                    {player.avatar === 'male' ? '👨' : player.avatar === 'female' ? '👩' : '🤖'}
                  </span>
                  {isTurn && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium truncate">
                    {player.name} {isMe && '(You)'}
                  </div>
                  <div className="text-green-400 text-sm font-mono">
                    {player.capital.toLocaleString()} €
                  </div>
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between text-[10px] text-white/50">
                <div className="flex items-center gap-1">
                  <span>LVL {Math.floor(player.position / 5) + 1}</span>
                  {levels[player.position % levels.length] && (
                    <span className="opacity-80">
                      • {levels[player.position % levels.length].icon} {levels[player.position % levels.length].label}
                    </span>
                  )}
                </div>
                <span className={isTurn ? 'text-blue-400 animate-pulse' : ''}>
                  {isTurn ? 'PLAYING...' : 'WAITING'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-4 left-4 right-4 p-4 bg-white/5 rounded-xl border border-white/10 text-[10px] text-white/40 leading-relaxed italic">
        "EconomySwitch: Smart money management for a better world."
      </div>
    </div>
  );
};
