import React from 'react';
import { Player } from '../types/game';
import { Level } from '../data/gameData';

interface MobilePlayerStatusProps {
    players: Player[];
    myId: string;
    levels: Level[];
}

export const MobilePlayerStatus: React.FC<MobilePlayerStatusProps> = ({ players, myId, levels }) => {
    const me = players.find(p => p.id === myId);
    if (!me) return null;

    const others = players.filter(p => p.id !== myId);

    return (
        <div className="fixed bottom-40 left-4 right-4 z-20 flex flex-col gap-2 lg:hidden pointer-events-none">
            {others.map(player => {
                const isAbove = player.position > me.position;
                const currentField = levels[player.position % levels.length];

                return (
                    <div
                        key={player.id}
                        className="bg-slate-900/80 backdrop-blur-md border border-white/10 p-2 rounded-xl flex items-center justify-between pointer-events-auto shadow-lg animate-fade-in"
                    >
                        <div className="flex items-center gap-3">
                            <img
                                src={`/assets/${player.avatar}.png`}
                                alt={player.name}
                                className="w-10 h-10 object-contain rounded-lg bg-white/5 p-1"
                            />
                            <div>
                                <div className="text-[10px] text-white/50 font-bold uppercase truncate max-w-[80px]">
                                    {player.name}
                                </div>
                                <div className="text-xs font-black text-white">
                                    {player.capital.toLocaleString()} €
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <div className="text-[8px] text-white/30 uppercase tracking-tighter">Current Field</div>
                                <div className="flex items-center gap-1 justify-end">
                                    <span className="text-xs">{currentField?.icon}</span>
                                    <span className="text-[10px] text-white font-medium truncate max-w-[60px]">
                                        {currentField?.label}
                                    </span>
                                </div>
                            </div>

                            <div className={`p-1.5 rounded-lg flex items-center justify-center ${isAbove ? 'bg-blue-500/20 text-blue-400' : 'bg-rose-500/20 text-rose-400'
                                }`}>
                                {isAbove ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                    </svg>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
