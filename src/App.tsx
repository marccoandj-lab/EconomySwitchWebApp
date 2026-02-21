import React, { useState, useEffect, useRef } from 'react';
import { GameMap } from './components/GameMap';
import GameModal from './components/GameModalContainer';
import { StartScreen } from './components/StartScreen';
import { Sidebar } from './components/Sidebar';
import { MobilePlayerStatus } from './components/MobilePlayerStatus';
import { generateLevels } from './data/levelGenerator';
import { Level, GameMode } from './data/gameData';
import { multiplayer, GameState as MPState } from './services/MultiplayerManager';

const WINNING_BALANCE = 1000000;

export const App: React.FC = () => {
  const [gameState, setGameState] = useState<'start' | 'lobby' | 'playing' | 'victory'>('start');
  const [isSinglePlayer, setIsSinglePlayer] = useState(true);
  const [mpState, setMpState] = useState<MPState | null>(null);

  // Singleplayer states
  const [levels, setLevels] = useState<Level[]>([]);
  const [balance, setBalance] = useState(50000);
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [mode, setMode] = useState<GameMode>('finance');

  // Local UI states
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [lastDiceRoll, setLastDiceRoll] = useState<number | null>(null);
  const [showExpiry, setShowExpiry] = useState(false);

  // Taxation track
  const myExemption = isSinglePlayer ? 0 : (mpState?.players.find(p => p.id === multiplayer.getMyId())?.taxExemptTurns || 0);
  const prevExemption = useRef(myExemption);

  useEffect(() => {
    if (prevExemption.current > 0 && myExemption === 0) {
      setShowExpiry(true);
      setTimeout(() => setShowExpiry(false), 5000);
    }
    prevExemption.current = myExemption;
  }, [myExemption]);

  useEffect(() => {
    multiplayer.init((state) => {
      setMpState(state);
      if (state.levels && state.levels.length > 0) {
        setLevels(state.levels);
      }
      if (state.status === 'playing' && gameState !== 'playing') {
        setGameState('playing');
      }
    });
  }, [gameState]);

  const handleStart = (_name: string, _avatar: 'male' | 'female' | 'robot', isSingle: boolean) => {
    setIsSinglePlayer(isSingle);
    if (isSingle) {
      setLevels(generateLevels(100, 'finance'));
      setGameState('playing');
    } else {
      setGameState('lobby');
    }
  };

  const handleRollDice = () => {
    if (isMoving || isRolling) return;

    // Block if ANY player is interacting with a modal
    const anyoneInteracting = mpState?.players.some(p => p.isInteracting);
    if (!isSinglePlayer && anyoneInteracting) return;

    if (!isSinglePlayer && mpState) {
      const myId = multiplayer.getMyId();
      const myIndex = mpState.players.findIndex(p => p.id === myId);
      if (myIndex !== mpState.currentTurnIndex) return;
    }

    setIsRolling(true);
    setTimeout(() => {
      const roll = Math.floor(Math.random() * 6) + 1;
      setLastDiceRoll(roll);
      setIsRolling(false);
      animateMovement(roll);
    }, 1600);
  };

  const animateMovement = async (steps: number) => {
    setIsMoving(true);
    let currentPos = currentLevelIndex;

    for (let i = 0; i < steps; i++) {
      currentPos++;
      setCurrentLevelIndex(currentPos);

      // Level generation only by HOST to ensure sync
      if (currentPos >= levels.length - 10) {
        const isHost = isSinglePlayer || mpState?.players.find(p => p.id === multiplayer.getMyId())?.isHost;
        if (isHost) {
          const newLevels = generateLevels(50, mode, levels[levels.length - 1].id + 1);
          const updatedLevels = [...levels, ...newLevels];
          setLevels(updatedLevels);
          if (!isSinglePlayer) {
            multiplayer.sendAction({ type: 'UPDATE_LEVELS', levels: updatedLevels });
          }
        }
      }

      await new Promise(resolve => setTimeout(resolve, 350));
    }

    setIsMoving(false);

    if (!isSinglePlayer) {
      multiplayer.sendAction({ type: 'ACTION_DICE_ROLL', steps });
    }

    const landingField = levels[currentPos].type;
    setActiveModal(landingField);
    if (!isSinglePlayer) {
      multiplayer.sendAction({ type: 'ACTION_INTERACTION_START' });
    }
  };

  const myProfile = isSinglePlayer ? null : mpState?.players.find(p => p.id === multiplayer.getMyId());
  const currentBalance = isSinglePlayer ? balance : (myProfile?.capital || 0);

  useEffect(() => {
    if (currentBalance >= WINNING_BALANCE) {
      setGameState('victory');
    }
  }, [currentBalance]);

  if (gameState === 'start') {
    return <StartScreen onStart={handleStart} />;
  }

  if (gameState === 'lobby' && mpState) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center p-6 z-50">
        <div className="max-w-md w-full bg-white/5 p-8 rounded-[32px] border border-white/10 backdrop-blur-xl space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-white tracking-tight">Game Lobby</h2>
            <p className="text-blue-400 font-mono tracking-wider text-lg">CODE: <span className="text-white font-black">{mpState.roomId}</span></p>
            <p className="text-slate-500 text-xs">Share this code with your friends!</p>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2">
              Connected Friends ({mpState.players.length}/6)
            </p>
            <div className="space-y-2">
              {mpState.players.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 animate-fade-in">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">
                      {p.avatar === 'male' ? '👨' : p.avatar === 'female' ? '👩' : '🤖'}
                    </span>
                    <span className="text-white font-medium">{p.name} {p.id === multiplayer.getMyId() && '(You)'}</span>
                  </div>
                  {p.isHost && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full font-bold uppercase tracking-tighter">Host</span>}
                </div>
              ))}
              {mpState.players.length < 2 && (
                <div className="p-4 border border-dashed border-white/10 rounded-2xl text-center">
                  <p className="text-slate-600 text-sm italic">Waiting for friends to join...</p>
                </div>
              )}
            </div>
          </div>

          {mpState.players.find(p => p.id === multiplayer.getMyId())?.isHost && (
            <button
              disabled={mpState.players.length < 2}
              onClick={() => multiplayer.startGame()}
              className={`w-full py-4 rounded-2xl font-bold transition-all shadow-xl ${mpState.players.length < 2
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50'
                : 'bg-gradient-to-r from-blue-600 to-green-600 text-white hover:scale-105 active:scale-95 shadow-blue-900/40'
                }`}
            >
              START GAME
            </button>
          )}
        </div>
      </div>
    );
  }

  const gameMode = isSinglePlayer ? mode : (mpState?.mode || 'finance');

  return (
    <div className={`fixed inset-0 overflow-hidden transition-colors duration-1000 ${gameMode === 'finance' ? 'bg-slate-900 bg-finance-pattern' : 'bg-emerald-950 bg-eco-pattern'
      }`}>
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 p-4 z-30 flex justify-between items-start pointer-events-none">
        <div className="bg-slate-900/80 backdrop-blur-md p-3 rounded-2xl border border-white/10 pointer-events-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-xl shadow-lg">
              💰
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Your Capital</div>
              <div className="text-xl font-black text-white font-mono">
                {currentBalance.toLocaleString()} €
              </div>
            </div>
          </div>
          <div className="mt-2 w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-1000"
              style={{ width: `${Math.min((currentBalance / WINNING_BALANCE) * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className={`px-4 py-2 rounded-xl backdrop-blur-md border text-white font-bold text-xs uppercase tracking-widest pointer-events-auto shadow-xl ${gameMode === 'finance' ? 'bg-blue-600/80 border-blue-400/30' : 'bg-green-600/80 border-green-400/30'
            }`}>
            {gameMode} mode
          </div>
        </div>
      </div>

      <Sidebar
        players={isSinglePlayer ? [{
          id: 'single', name: 'You', avatar: 'male', capital: balance, position: currentLevelIndex,
          isHost: true, status: 'playing', taxExemptTurns: 0, hasPaidTax: false, isInteracting: false,
          jailSkipped: false,
          stats: { correctQuizzes: 0, wrongQuizzes: 0, listedItems: 0, investmentGains: 0, investmentLosses: 0, jailVisits: 0, jailSkips: 0, auctionWins: 0, taxesPaid: 0 }
        }] : (mpState?.players || [])}
        currentTurnIndex={mpState?.currentTurnIndex || 0}
        myId={isSinglePlayer ? 'single' : multiplayer.getMyId()}
        levels={levels}
      />

      {!isSinglePlayer && mpState && (
        <MobilePlayerStatus
          players={mpState.players}
          myId={multiplayer.getMyId()}
          levels={levels}
        />
      )}

      <GameMap
        levels={levels}
        currentLevel={currentLevelIndex}
        currentPlayer={myProfile || {
          id: 'single', name: 'You', avatar: 'male', capital: balance, position: currentLevelIndex,
          isHost: true, status: 'playing', taxExemptTurns: 0, hasPaidTax: false, isInteracting: false,
          jailSkipped: false,
          stats: { correctQuizzes: 0, wrongQuizzes: 0, listedItems: 0, investmentGains: 0, investmentLosses: 0, jailVisits: 0, jailSkips: 0, auctionWins: 0, taxesPaid: 0 }
        }}
        mode={gameMode}
        balance={currentBalance}
        onRollDice={handleRollDice}
        jailed={myProfile?.status === 'jail'}
        diceValue={lastDiceRoll}
        isRolling={isRolling}
        isMoving={isMoving}
        animatingLevel={currentLevelIndex}
        taxPool={0}
        isTaxpayer={isSinglePlayer ? false : (myProfile?.hasPaidTax || false)}
        taxExemptionTurns={isSinglePlayer ? 0 : (myProfile?.taxExemptTurns || 0)}
      />

      <GameModal
        activeField={activeModal}
        onClose={() => {
          setActiveModal(null);
          if (!isSinglePlayer) {
            multiplayer.sendAction({ type: 'ACTION_INTERACTION_END' });
          }
        }}
        balance={currentBalance}
        levelIndex={currentLevelIndex}
        mode={gameMode}
        levels={levels}
        players={isSinglePlayer ? [] : (mpState?.players || [])}
        isSinglePlayer={isSinglePlayer}
        onBalanceChange={(change) => {
          if (isSinglePlayer) {
            setBalance(prev => prev + change);
          } else {
            multiplayer.sendAction({ type: 'ACTION_QUIZ_RESULT', reward: change > 0 ? change : 0, penalty: change < 0 ? -change : 0, success: change > 0 });
          }
        }}
        onListingResult={(count, reward, penalty) => {
          if (isSinglePlayer) {
            setBalance(prev => prev + (count > 0 ? reward : -penalty));
          } else {
            multiplayer.sendAction({ type: 'ACTION_LISTING_RESULT', success: count > 0, reward, penalty, count });
          }
        }}
        onModeChange={(newMode) => {
          if (isSinglePlayer) {
            setMode(newMode);
          } else {
            multiplayer.sendAction({ type: 'ACTION_THEME_SWITCH', mode: newMode });
          }
        }}
        onTaxExemption={(turns) => {
          if (!isSinglePlayer) {
            multiplayer.sendAction({ type: 'ACTION_TAX_EXEMPT', turns });
          }
        }}
      />

      {/* Exemption Expiry Notification - Fixed Position to top-24 */}
      {showExpiry && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] animate-bounce">
          <div className="bg-rose-500 text-white px-6 py-3 rounded-2xl shadow-2xl border border-rose-400 flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-black text-sm uppercase tracking-wider leading-none">Tax Exemption Expired!</p>
              <p className="text-[10px] text-rose-100 font-bold opacity-80">You are now liable for taxes again.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
