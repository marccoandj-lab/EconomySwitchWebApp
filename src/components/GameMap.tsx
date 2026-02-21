import { useEffect, useRef, useState, useCallback } from 'react';
import { Level, GameMode } from '../data/gameData';
import { Player } from '../types/game';

interface GameMapProps {
  levels: Level[];
  currentLevel: number;
  currentPlayer: Player;
  mode: GameMode;
  balance: number;
  onRollDice: () => void;
  jailed: boolean;
  diceValue: number | null;
  isRolling: boolean;
  isMoving: boolean;
  animatingLevel: number;
  taxPool: number;
  isTaxpayer: boolean;
  taxExemptionTurns: number;
}

// Zigzag column positions
const COLS = [50, 18, 82, 50, 82, 18, 50, 18, 82, 50];

function getCol(idx: number): number {
  return COLS[idx % COLS.length];
}

// ── 3D Dice Component ──
function DiceRoller({ value, isRolling, onRoll, disabled, isFinance }: {
  value: number | null;
  isRolling: boolean;
  onRoll: () => void;
  disabled: boolean;
  isFinance: boolean;
}) {
  const diceFaces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
  const [displayFace, setDisplayFace] = useState(0);

  useEffect(() => {
    if (!isRolling) return;
    let frame = 0;
    const interval = setInterval(() => {
      setDisplayFace(Math.floor(Math.random() * 6));
      frame++;
      if (frame > 18) clearInterval(interval);
    }, 80);
    return () => clearInterval(interval);
  }, [isRolling]);

  const shownFace = isRolling ? displayFace : (value ? value - 1 : 0);

  return (
    <div className="flex items-center gap-3">
      {/* Dice display */}
      <div
        className={`
          relative flex items-center justify-center
          w-16 h-16 rounded-2xl border-2 border-white/30
          bg-white/10 backdrop-blur-sm
          transition-all duration-200
          ${isRolling ? 'animate-dice-spin' : ''}
          ${value && !isRolling ? 'scale-110' : ''}
        `}
        style={{
          boxShadow: isRolling
            ? '0 0 30px rgba(255,255,255,0.4), inset 0 0 15px rgba(255,255,255,0.1)'
            : value ? '0 0 20px rgba(255,255,255,0.2)' : 'none',
        }}
      >
        <span className="text-4xl select-none" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
          {diceFaces[shownFace]}
        </span>

        {disabled && !isRolling && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] rounded-2xl flex items-center justify-center animate-fade-in">
            <span className="text-3xl filter drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">🔒</span>
          </div>
        )}

        {value && !isRolling && (
          <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-yellow-400 text-black font-black text-xs flex items-center justify-center border border-yellow-300 shadow-lg">
            {value}
          </div>
        )}
      </div>

      {/* Roll button */}
      <button
        onClick={onRoll}
        disabled={disabled || isRolling}
        className={`
          flex-1 py-4 rounded-2xl font-black text-white text-lg transition-all active:scale-95
          ${disabled || isRolling
            ? 'bg-gray-600 cursor-not-allowed opacity-60'
            : isFinance
              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 shadow-lg shadow-blue-500/30'
              : 'bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-400 hover:to-teal-500 shadow-lg shadow-green-500/30'
          }
        `}
      >
        {isRolling ? '🎲 Rolling...' : disabled ? '🚔 In Jail' : '🎲 Roll Dice!'}
      </button>
    </div>
  );
}

export function GameMap({ levels, currentLevel, currentPlayer, mode, balance, onRollDice, jailed, diceValue, isRolling, isMoving, animatingLevel, taxPool, isTaxpayer, taxExemptionTurns }: GameMapProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const fieldRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [avatarPos, setAvatarPos] = useState<{ x: number; y: number } | null>(null);

  const isFinance = mode === 'finance';
  const bgClass = isFinance
    ? 'from-slate-900 via-blue-950 to-indigo-950 bg-finance-pattern'
    : 'from-slate-900 via-green-950 to-teal-950 bg-eco-pattern';

  const formatBalance = (b: number) => {
    if (b >= 1000000) return `${(b / 1000000).toFixed(2)}M €`;
    if (b >= 1000) return `${(b / 1000).toFixed(1)}K €`;
    return `${b.toLocaleString('en')} €`;
  };

  // The level to show avatar on
  const avatarLevel = isMoving ? animatingLevel : currentLevel;

  // Calculate avatar position relative to mapContainer
  const recalcAvatarPos = useCallback((level: number) => {
    const el = fieldRefs.current[level];
    const container = mapContainerRef.current;
    if (!el || !container) return;
    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    setAvatarPos({
      x: elRect.left - containerRect.left + elRect.width / 2,
      y: elRect.top - containerRect.top,
    });
  }, []);

  // Recalc avatar pos when avatarLevel changes
  useEffect(() => {
    // Small timeout to let DOM update
    const t = setTimeout(() => recalcAvatarPos(avatarLevel), 20);
    return () => clearTimeout(t);
  }, [avatarLevel, recalcAvatarPos]);

  // Resize listener
  useEffect(() => {
    const handleResize = () => recalcAvatarPos(avatarLevel);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [avatarLevel, recalcAvatarPos]);

  // Initial position
  useEffect(() => {
    const t = setTimeout(() => recalcAvatarPos(currentLevel), 400);
    return () => clearTimeout(t);
  }, []);

  // Scroll logic
  const scrollToField = useCallback((level: number) => {
    const el = fieldRefs.current[level];
    if (el && scrollRef.current) {
      const containerRect = scrollRef.current.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const scrollTop = scrollRef.current.scrollTop;
      const targetScrollTop = scrollTop + elRect.top - containerRect.top - containerRect.height / 2 + elRect.height / 2;
      scrollRef.current.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    scrollToField(avatarLevel);
  }, [avatarLevel, scrollToField]);

  // Initial scroll
  useEffect(() => {
    setTimeout(() => scrollToField(currentLevel), 300);
  }, []);

  const totalLevels = levels.length;

  return (
    <div className={`h-screen bg-gradient-to-b ${bgClass} flex flex-col transition-colors duration-500`}>
      {/* ── HEADER ── */}
      <div
        className={`flex-shrink-0 z-30 ${isFinance ? 'bg-blue-950/95' : 'bg-green-950/95'
          } backdrop-blur-md border-b border-white/10 px-4 py-2.5`}
      >
        <div className="max-w-sm mx-auto flex items-center justify-between">
          <div>
            <p className="text-white/50 text-[10px] uppercase tracking-wider">Capital</p>
            <p className="text-xl font-black text-white">{formatBalance(balance)}</p>
          </div>
          <div className="text-center">
            <div
              className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${isFinance
                  ? 'bg-blue-500/30 text-blue-300 border border-blue-400/30'
                  : 'bg-green-500/30 text-green-300 border border-green-400/30'
                }`}
            >
              {isFinance ? '💼 Finance' : '🌱 Sustainability'}
            </div>
            {jailed && (
              <div className="text-[10px] text-rose-400 font-semibold mt-0.5">🚔 In Jail</div>
            )}
            {taxExemptionTurns > 0 && (
              <div className="text-[9px] text-amber-400 font-bold mt-0.5 flex items-center justify-center gap-1">
                🛡️ Exempt: {taxExemptionTurns}
              </div>
            )}
          </div>
          <div className="text-right">
            <p className="text-white/50 text-[10px] uppercase tracking-wider">Level</p>
            <p className="text-xl font-black text-white">{currentLevel + 1}</p>
          </div>
        </div>

        {/* Tax Pool Status Line */}
        <div className="max-w-sm mx-auto mt-2 flex justify-between items-center bg-white/5 rounded-lg px-2 py-1 border border-white/10">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${isTaxpayer ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-gray-500'}`} />
            <span className="text-[9px] text-white/60 font-medium uppercase tracking-wider">Taxpayer Status</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-pink-300 font-bold uppercase tracking-widest">Public Fund:</span>
            <span className="text-[11px] text-white font-black">{taxPool.toLocaleString('en')} €</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="max-w-sm mx-auto mt-1.5">
          <div className="flex justify-between text-[9px] text-white/40 mb-0.5">
            <span>0 €</span>
            <span>{((balance / 1000000) * 100).toFixed(1)}%</span>
            <span>1M €</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-700 ${isFinance
                  ? 'bg-gradient-to-r from-blue-400 to-indigo-400'
                  : 'bg-gradient-to-r from-green-400 to-teal-400'
                }`}
              style={{ width: `${Math.min((balance / 1000000) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── MAP SCROLL AREA ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden pb-48 pt-4"
        style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >
        <div ref={mapContainerRef} className="max-w-xs mx-auto px-2 relative">
          {/* INFO badge at top */}
          <div className="text-center mb-4">
            <div className="inline-block bg-yellow-500/20 border border-yellow-400/30 rounded-xl px-4 py-2 shadow-lg shadow-yellow-400/10">
              <p className="text-yellow-400 font-black text-sm">💰 Goal: 1,000,000 €</p>
              <p className="text-white/60 text-[10px] mt-1">The map expands until you reach a million!</p>
            </div>
          </div>

          {/* ── PLAYER AVATAR (absolute within map container, smooth transitions) ── */}
          {avatarPos && (
            <div
              className="absolute z-20 pointer-events-none"
              style={{
                left: avatarPos.x,
                top: avatarPos.y - 56,
                transform: 'translateX(-50%)',
                transition: isMoving
                  ? 'left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), top 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                  : 'left 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), top 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                willChange: 'left, top',
              }}
            >
              {/* Drop shadow under avatar */}
              <div
                className="absolute left-1/2 -translate-x-1/2"
                style={{
                  bottom: -4,
                  width: 26,
                  height: 7,
                  borderRadius: '50%',
                  background: 'radial-gradient(ellipse, rgba(0,0,0,0.55) 0%, transparent 70%)',
                }}
              />

              {/* Circular emoji avatar */}
              <div
                className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500 border-2 border-white shadow-xl flex items-center justify-center animate-player-float relative"
                style={{
                  filter: isFinance
                    ? 'drop-shadow(0 0 18px rgba(59,130,246,0.9))'
                    : 'drop-shadow(0 0 18px rgba(16,185,129,0.9))',
                }}
              >
                <span className="text-3xl" aria-label="Player" role="img">
                  {currentPlayer.avatar === 'male' ? '👨' : currentPlayer.avatar === 'female' ? '👩' : '🤖'}
                </span>
                <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-bold tracking-wide text-white/90 drop-shadow-md whitespace-nowrap bg-black/40 px-2 py-0.5 rounded-full">
                  {currentPlayer.name.toUpperCase()}
                </span>
              </div>
            </div>
          )}

          {/* Fields rendered top = goal, bottom = start */}
          <div className="relative">
            {[...levels].reverse().map((level, revIdx) => {
              const actualIdx = totalLevels - 1 - revIdx;
              const isCurrent = actualIdx === avatarLevel;
              const isCompleted = actualIdx < currentLevel;
              const colPct = getCol(actualIdx);

              let ml = '22%';
              let mr = '22%';
              if (colPct <= 20) { ml = '2%'; mr = '42%'; }
              else if (colPct >= 80) { ml = '42%'; mr = '2%'; }

              return (
                <div key={level.id} className="relative">
                  {/* Connector dots */}
                  {revIdx > 0 && (
                    <ConnectorDots
                      isCompleted={isCompleted || actualIdx < currentLevel}
                      isFinance={isFinance}
                      isStartGap={actualIdx === 0}
                    />
                  )}

                  {/* Field bubble */}
                  <div style={{ marginLeft: ml, marginRight: mr }} className="relative mb-0.5">
                    <div
                      ref={(el) => { fieldRefs.current[actualIdx] = el; }}
                      className={`
                        relative flex flex-col items-center justify-center
                        rounded-xl border-2 select-none
                        transition-all duration-300
                        ${level.bgColor} ${level.borderColor}
                        ${isCurrent
                          ? 'scale-105 ring-[3px] ring-white/50 shadow-xl'
                          : isCompleted
                            ? 'opacity-60 scale-[0.92]'
                            : 'opacity-85'
                        }
                      `}
                      style={{
                        width: level.type === 'tax_large' ? '115%' : '100%',
                        paddingTop: level.type === 'tax_large' ? '18px' : '12px',
                        paddingBottom: level.type === 'tax_large' ? '12px' : '8px',
                        boxShadow: isCurrent
                          ? '0 0 20px 4px rgba(255,255,255,0.15), 0 6px 24px rgba(0,0,0,0.4)'
                          : undefined,
                      }}
                    >
                      {/* Completed overlay */}
                      {isCompleted && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/25">
                          <span className="text-lg text-white/70">✓</span>
                        </div>
                      )}

                      {/* Field content */}
                      <span className="text-xl drop-shadow-md">{level.icon}</span>
                      <span className={`text-[10px] font-bold ${level.color} text-center leading-tight px-1 mt-0.5`}>
                        {level.label}
                      </span>
                      <span className="text-white/40 text-[9px] mt-0.5">{actualIdx + 1}</span>

                      {/* Pulse ring on current */}
                      {isCurrent && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span
                            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isFinance ? 'bg-blue-300' : 'bg-green-300'
                              }`}
                          />
                          <span
                            className={`relative inline-flex rounded-full h-3 w-3 border-2 border-white ${isFinance ? 'bg-blue-400' : 'bg-green-400'
                              }`}
                          />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* START badge */}
            <div className="text-center mt-3 mb-4">
              <div className="inline-block bg-violet-500/20 border border-violet-400/30 rounded-full px-4 py-1.5">
                <p className="text-violet-400 text-xs font-semibold">🚀 Start</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM PANEL with Dice ── */}
      <div className="flex-shrink-0 z-30 p-3 pb-8 sm:pb-4">
        <div
          className={`max-w-sm mx-auto ${isFinance ? 'bg-blue-950/95' : 'bg-green-950/95'
            } rounded-2xl border border-white/10 p-3 backdrop-blur-md shadow-2xl relative overflow-hidden`}
        >
          {jailed && (
            <div className="absolute inset-0 pointer-events-none bg-rose-500/5 animate-pulse" />
          )}

          {/* Info row */}
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-white/40 text-[10px]">Field: {levels[currentLevel]?.icon} {levels[currentLevel]?.label}</span>
            {diceValue && !isRolling && !isMoving && (
              <span className="text-yellow-400 text-[10px] font-bold">Rolled: {diceValue}</span>
            )}
          </div>

          {/* Dice roller */}
          <DiceRoller
            value={diceValue}
            isRolling={isRolling}
            onRoll={onRollDice}
            disabled={jailed || isMoving}
            isFinance={isFinance}
          />
        </div>
      </div>
    </div>
  );
}

// ── Connector dots ──
function ConnectorDots({ isCompleted, isFinance, isStartGap }: { isCompleted: boolean; isFinance: boolean, isStartGap?: boolean }) {
  const dotColor = isCompleted
    ? isFinance ? 'bg-blue-400/70' : 'bg-green-400/70'
    : 'bg-white/15';

  const dotCount = isStartGap ? 6 : 3;

  return (
    <div className={`flex flex-col justify-center items-center gap-1 ${isStartGap ? 'py-4' : 'py-1'}`}>
      {Array.from({ length: dotCount }).map((_, i) => (
        <div
          key={i}
          className={`rounded-full ${dotColor}`}
          style={{ width: 3, height: 3 }}
        />
      ))}
    </div>
  );
}
