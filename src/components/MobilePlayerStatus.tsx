import React from 'react';
import { Player } from '../types/game';
import { Level } from '../data/gameData';

interface MobilePlayerStatusProps {
    players: Player[];
    currentTurnIndex: number;
    levels: Level[];
}

export const MobilePlayerStatus: React.FC<MobilePlayerStatusProps> = ({ players, currentTurnIndex, levels }) => {
    const activePlayer = players[currentTurnIndex];
    if (!activePlayer) return null;

    const currentField = levels[activePlayer.position % levels.length];

    return (
        <div className="fixed bottom-[180px] left-4 right-4 z-[45] flex flex-col gap-2 lg:hidden pointer-events-none">
            <div className="bg-slate-900/90 backdrop-blur-xl border-2 border-blue-500/50 p-2.5 rounded-[1.5rem] flex items-center justify-between pointer-events-auto shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-fade-in ring-4 ring-blue-500/10">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <img
                            src={`/assets/${activePlayer.avatar}.png`}
                            alt={activePlayer.name}
                            className="w-11 h-11 object-contain rounded-xl bg-white/10 p-1.5"
                        />
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                        </span>
                    </div>
                    <div>
                        <div className="text-[10px] text-blue-400 font-black uppercase tracking-widest">
                            CURRENT TURN
                        </div>
                        <div className="text-sm font-bold text-white truncate max-w-[100px]">
                            {activePlayer.name}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <div className="text-[9px] text-green-400 font-bold uppercase tracking-tighter">Balance</div>
                        <div className="text-xs font-black text-white font-mono">
                            {activePlayer.capital.toLocaleString()} €
                        </div>
                    </div>

                    <div className="h-8 w-[1px] bg-white/10" />

                    <div className="text-right pr-2">
                        <div className="text-[9px] text-white/30 uppercase font-bold pr-1">Position</div>
                        <div className="flex items-center gap-1.5 justify-end">
                            <span className="text-sm">{currentField?.icon}</span>
                            <span className="text-[10px] text-white font-black truncate max-w-[60px] uppercase">
                                {currentField?.label}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
