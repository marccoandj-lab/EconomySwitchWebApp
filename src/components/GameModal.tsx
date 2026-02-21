import React, { useState, useEffect, useRef } from 'react';
import { GameMode, QuizQuestion, ListingChallenge, getInvestmentResult } from '../data/gameData';
import { Player } from '../types/game';
import { multiplayer } from '../services/MultiplayerManager';

interface ModalProps {
  onClose: () => void;
  children: React.ReactNode;
  mode: GameMode;
}

export function Modal({ onClose, children, mode }: ModalProps) {
  const bgClass = mode === 'finance'
    ? 'from-blue-900/90 to-indigo-900/90'
    : 'from-green-900/90 to-teal-900/90';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 animate-backdrop-fade" onClick={onClose} />
      <div className={`relative w-full sm:max-w-lg bg-gradient-to-br ${bgClass} rounded-t-3xl sm:rounded-3xl border border-white/20 shadow-2xl max-h-[92vh] overflow-y-auto animate-modal-pop`}>
        {children}
      </div>
    </div>
  );
}

// Income Modal
interface IncomeModalProps {
  title: string;
  description: string;
  amount: number;
  icon: string;
  mode: GameMode;
  onClose: () => void;
}

export function IncomeModal({ title, description, amount, icon, mode, onClose }: IncomeModalProps) {
  return (
    <Modal onClose={onClose} mode={mode}>
      <div className="p-6 text-center">
        <div className="text-6xl mb-4 animate-bounce">{icon}</div>
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        <p className="text-white/70 mb-6">{description}</p>
        <div className="bg-emerald-500/30 rounded-2xl p-4 mb-6 border border-emerald-400/30">
          <p className="text-emerald-300 text-sm uppercase tracking-wider mb-1">Gain</p>
          <p className="text-4xl font-black text-emerald-400">+{amount.toLocaleString('en')} €</p>
        </div>
        <p className="text-white/60 text-sm mb-4 italic">💡 Smart income management is the key to financial freedom!</p>
        <button
          onClick={onClose}
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 rounded-2xl transition-all active:scale-95 text-lg"
        >
          Continue ▶
        </button>
      </div>
    </Modal>
  );
}

// Expense Modal
interface ExpenseModalProps {
  title: string;
  description: string;
  amount: number;
  icon: string;
  mode: GameMode;
  onClose: () => void;
}

export function ExpenseModal({ title, description, amount, icon, mode, onClose }: ExpenseModalProps) {
  return (
    <Modal onClose={onClose} mode={mode}>
      <div className="p-6 text-center">
        <div className="text-6xl mb-4">{icon}</div>
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        <p className="text-white/70 mb-6">{description}</p>
        <div className="bg-rose-500/30 rounded-2xl p-4 mb-6 border border-rose-400/30">
          <p className="text-rose-300 text-sm uppercase tracking-wider mb-1">Loss</p>
          <p className="text-4xl font-black text-rose-400">-{amount.toLocaleString('en')} €</p>
        </div>
        <p className="text-white/60 text-sm mb-4 italic">💡 Always keep an emergency fund for 3-6 months of expenses!</p>
        <button
          onClick={onClose}
          className="w-full bg-rose-500 hover:bg-rose-400 text-white font-bold py-4 rounded-2xl transition-all active:scale-95 text-lg"
        >
          Continue ▶
        </button>
      </div>
    </Modal>
  );
}

// Quiz Modal
interface QuizModalProps {
  quiz: QuizQuestion;
  mode: GameMode;
  onResult: (correct: boolean, reward: number, penalty: number) => void;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'];
const OPTION_COLORS = [
  { base: 'bg-blue-500/20 border-blue-400/30 hover:bg-blue-500/40 text-blue-100', selected: 'bg-blue-500/60 border-blue-300 text-white', correct: 'bg-emerald-500/40 border-emerald-400 text-emerald-100', wrong: 'bg-rose-500/40 border-rose-400 text-rose-100' },
  { base: 'bg-purple-500/20 border-purple-400/30 hover:bg-purple-500/40 text-purple-100', selected: 'bg-purple-500/60 border-purple-300 text-white', correct: 'bg-emerald-500/40 border-emerald-400 text-emerald-100', wrong: 'bg-rose-500/40 border-rose-400 text-rose-100' },
  { base: 'bg-amber-500/20 border-amber-400/30 hover:bg-amber-500/40 text-amber-100', selected: 'bg-amber-500/60 border-amber-300 text-white', correct: 'bg-emerald-500/40 border-emerald-400 text-emerald-100', wrong: 'bg-rose-500/40 border-rose-400 text-rose-100' },
  { base: 'bg-teal-500/20 border-teal-400/30 hover:bg-teal-500/40 text-teal-100', selected: 'bg-teal-500/60 border-teal-300 text-white', correct: 'bg-emerald-500/40 border-emerald-400 text-emerald-100', wrong: 'bg-rose-500/40 border-rose-400 text-rose-100' },
];

export function QuizModal({ quiz, mode, onResult }: QuizModalProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(35);

  useEffect(() => {
    if (answered) return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer);
          if (!answered) {
            handleSelect(-1); // Timeout as wrong answer
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [answered]);

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    const isCorrect = idx === quiz.correct;
    setTimeout(() => {
      onResult(isCorrect, quiz.reward, quiz.penalty);
    }, 2200);
  };

  const getOptionClass = (idx: number) => {
    const c = OPTION_COLORS[idx];
    if (!answered) return `${c.base} cursor-pointer`;
    if (idx === quiz.correct) return `${c.correct} cursor-default`;
    if (idx === selected && idx !== quiz.correct) return `${c.wrong} cursor-default`;
    return `bg-white/5 border-white/10 text-white/30 cursor-default`;
  };

  const timerColor = timeLeft > 15 ? 'text-emerald-400' : timeLeft > 8 ? 'text-amber-400' : 'text-rose-400';

  return (
    <Modal onClose={() => { }} mode={mode}>
      <div className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-3xl">❓</div>
          <div className="flex-1">
            <p className="text-white/60 text-xs uppercase tracking-wider">Quiz Question</p>
            <p className="text-white font-semibold text-sm">{mode === 'finance' ? '💼 Financial Literacy' : '🌱 Sustainability'}</p>
          </div>
          {!answered && (
            <div className={`text-2xl font-black mr-2 ${timerColor} animate-pulse`}>
              {timeLeft}s
            </div>
          )}
          <div className="flex gap-2">
            <div className="bg-emerald-500/20 border border-emerald-400/30 rounded-lg px-2 py-1 text-center">
              <p className="text-emerald-300 text-[10px]">✅ Win</p>
              <p className="text-emerald-400 font-black text-xs">+{quiz.reward.toLocaleString('en')} €</p>
            </div>
            <div className="bg-rose-500/20 border border-rose-400/30 rounded-lg px-2 py-1 text-center">
              <p className="text-rose-300 text-[10px]">❌ Lose</p>
              <p className="text-rose-400 font-black text-xs">-{quiz.penalty.toLocaleString('en')} €</p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 rounded-2xl p-4 mb-4 border border-white/10">
          <p className="text-white text-sm font-semibold leading-snug">{quiz.question}</p>
        </div>

        <div className="flex flex-col gap-2 mb-4">
          {quiz.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={answered}
              className={`
                w-full text-left px-4 py-3 rounded-xl border-2 transition-all duration-200
                text-sm font-medium leading-snug active:scale-98
                ${getOptionClass(idx)}
              `}
            >
              <span className="font-black mr-2">{OPTION_LABELS[idx]})</span>
              {option.replace(/^[A-D]\)\s*/, '')}
              {answered && idx === quiz.correct && <span className="float-right">✅</span>}
              {answered && idx === selected && idx !== quiz.correct && <span className="float-right">❌</span>}
            </button>
          ))}
        </div>

        {answered && (
          <div className={`rounded-2xl p-3 border animate-fade-in ${selected === quiz.correct ? 'bg-emerald-500/20 border-emerald-400/30' : 'bg-rose-500/20 border-rose-400/30'}`}>
            <p className="text-white font-black text-base mb-1">
              {selected === quiz.correct ? '✅ Correct!' : '❌ Wrong answer!'}
            </p>
            <p className="text-white/80 text-xs leading-relaxed mb-2">{quiz.explanation}</p>
            <p className={`font-black text-lg ${selected === quiz.correct ? 'text-emerald-400' : 'text-rose-400'}`}>
              {selected === quiz.correct ? `+${quiz.reward.toLocaleString('en')} €` : `-${quiz.penalty.toLocaleString('en')} €`}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}

// Listing Modal
interface ListingModalProps {
  challenge: ListingChallenge;
  mode: GameMode;
  onResult: (success: boolean, reward: number, penalty: number) => void;
}

export function ListingModal({ challenge, mode, onResult }: ListingModalProps) {
  const [input, setInput] = useState('');
  const [found, setFound] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(35);
  const [finished, setFinished] = useState(false);
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (finished) return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer);
          setFinished(true);
          const success = found.length >= challenge.required;
          setTimeout(() => onResult(success, challenge.reward, challenge.penalty), 1500);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [finished, found.length, challenge]);

  const handleSubmit = () => {
    if (!input.trim() || finished) return;
    const normalized = input.trim().toLowerCase();
    const isValid = challenge.answers.some(a => normalized.includes(a.toLowerCase()) || a.toLowerCase().includes(normalized));
    const alreadyFound = found.some(f => f.toLowerCase() === normalized);

    if (isValid && !alreadyFound) {
      const newFound = [...found, input.trim()];
      setFound(newFound);
      setMessage('✅ Correct!');
      setInput('');
      if (newFound.length >= challenge.required) {
        setFinished(true);
        setTimeout(() => onResult(true, challenge.reward, challenge.penalty), 1200);
      }
    } else if (alreadyFound) {
      setMessage('⚠️ Already listed!');
    } else {
      setMessage('❌ Not on the list!');
    }
    setTimeout(() => setMessage(''), 1500);
  };

  const handleSkip = () => {
    setFinished(true);
    onResult(false, 0, 0);
  };

  const timerColor = timeLeft > 15 ? 'text-emerald-400' : timeLeft > 8 ? 'text-amber-400' : 'text-rose-400';

  return (
    <Modal onClose={() => { }} mode={mode}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-4xl">📝</div>
            <p className="text-white font-semibold">Listing Challenge</p>
          </div>
          <div className={`text-3xl font-black ${timerColor}`}>{timeLeft}s</div>
        </div>
        <div className="bg-white/10 rounded-2xl p-4 mb-4">
          <p className="text-white font-semibold">{challenge.prompt}</p>
          <p className="text-white/60 text-sm mt-1">Required: {challenge.required} of {challenge.answers.length}+</p>
        </div>
        <div className="flex gap-2 mb-4">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="Type answer..."
            disabled={finished}
            className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 outline-none focus:border-white/40"
          />
          <button
            onClick={handleSubmit}
            disabled={finished}
            className="bg-blue-500 hover:bg-blue-400 text-white font-bold px-5 rounded-xl transition-all active:scale-95"
          >
            ✓
          </button>
        </div>
        {message && <p className="text-center text-white font-semibold mb-3 animate-pulse">{message}</p>}
        <div className="flex flex-wrap gap-2 min-h-12 mb-4">
          {found.map((f, i) => (
            <span key={i} className="bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 px-3 py-1 rounded-full text-sm font-medium">
              ✓ {f}
            </span>
          ))}
        </div>
        <div className="flex justify-between items-center mb-4">
          <div className="text-white/60 text-sm">{found.length}/{challenge.required} found</div>
          {finished && (
            <div className={`font-bold ${found.length >= challenge.required ? 'text-emerald-400' : 'text-rose-400'}`}>
              {found.length >= challenge.required ? `+${challenge.reward.toLocaleString('en')} €` : `-${challenge.penalty.toLocaleString('en')} €`}
            </div>
          )}
        </div>

        {finished && (
          <div className="bg-white/5 rounded-xl p-3 mb-4 border border-white/10 animate-fade-in text-center">
            <p className="text-white/50 text-[10px] uppercase tracking-wider mb-1">Recommended Answer</p>
            <p className="text-white font-bold italic">"{challenge.answers[0]}"</p>
          </div>
        )}

        {!finished && (
          <button
            onClick={handleSkip}
            className="w-full bg-white/10 hover:bg-white/20 text-white/70 font-bold py-3 rounded-xl transition-all active:scale-95 text-sm mb-3 border border-white/10"
          >
            Skip Challenge (No Reward) ▶
          </button>
        )}
        <div className="w-full bg-white/10 rounded-full h-2">
          <div
            className="bg-emerald-400 h-2 rounded-full transition-all"
            style={{ width: `${(found.length / challenge.required) * 100}%` }}
          />
        </div>
      </div>
    </Modal>
  );
}

// Jail Modal
interface JailModalProps {
  title: string;
  description: string;
  icon: string;
  jailFine: number;
  balance: number;
  mode: GameMode;
  onPay: () => void;
  onSkip: () => void;
}

export function JailModal({ title, description, icon, jailFine, balance, mode, onPay, onSkip }: JailModalProps) {
  const canAfford = balance >= jailFine;

  return (
    <Modal onClose={onSkip} mode={mode}>
      <div className="p-6 text-center">
        <div className="text-6xl mb-4">{icon}</div>
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        <p className="text-white/70 mb-6">{description}</p>
        <div className="bg-gray-700/50 rounded-2xl p-4 mb-6 border border-gray-600/30">
          <p className="text-gray-400 text-sm mb-2">Options:</p>
          <p className="text-white/80 text-sm">🚫 Skip one turn</p>
          <p className="text-white/80 text-sm">💰 Pay {jailFine.toLocaleString('en')} € and exit immediately</p>
        </div>

        {!canAfford && (
          <div className="bg-rose-500/20 border border-rose-400/30 rounded-xl p-3 mb-6">
            <p className="text-rose-400 text-sm font-bold">⚠️ Insufficient funds!</p>
            <p className="text-white/60 text-xs">You need at least {jailFine.toLocaleString('en')} € to pay your way out.</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              multiplayer.sendAction({ type: 'ACTION_JAIL_WAIT' });
              onSkip();
            }}
            className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-4 rounded-2xl transition-all active:scale-95"
          >
            🚫 Wait
          </button>
          <button
            onClick={onPay}
            disabled={!canAfford}
            className={`font-bold py-4 rounded-2xl transition-all active:scale-95 ${canAfford
              ? "bg-amber-500 hover:bg-amber-400 text-white shadow-lg shadow-amber-500/20"
              : "bg-gray-700 text-white/30 cursor-not-allowed border border-white/5"
              }`}
          >
            💰 Pay {jailFine.toLocaleString('en')} €
          </button>
        </div>
      </div>
    </Modal>
  );
}

// Switch Modal
interface SwitchModalProps {
  fromMode: GameMode;
  toMode: GameMode;
  onClose: () => void;
}

export function SwitchModal({ fromMode, toMode, onClose }: SwitchModalProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const patternClass = toMode === 'finance' ? 'bg-finance-pattern' : 'bg-eco-pattern';
  const gradientClass = toMode === 'finance'
    ? 'from-blue-900/95 via-indigo-950/98 to-slate-900/98 border-blue-400/30'
    : 'from-green-900/95 via-teal-950/98 to-slate-900/98 border-green-400/30';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 animate-backdrop-fade" />
      <div className={`relative w-full max-w-sm bg-gradient-to-br ${gradientClass} ${patternClass} rounded-3xl border shadow-2xl p-8 text-center animate-modal-pop overflow-hidden`}>

        <div className={`absolute -top-24 -left-24 w-48 h-48 rounded-full blur-3xl opacity-20 ${toMode === 'finance' ? 'bg-blue-400' : 'bg-green-400'}`} />
        <div className={`absolute -bottom-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20 ${toMode === 'finance' ? 'bg-indigo-400' : 'bg-teal-400'}`} />

        <div className="relative z-10 text-6xl mb-4 animate-bounce">🔄</div>
        <h2 className="text-2xl font-black text-white mb-4">Topic Switched!</h2>

        <div className="flex items-center justify-center gap-6 mb-5">
          <div className="flex flex-col items-center gap-1">
            <span className="text-4xl">{fromMode === 'finance' ? '💼' : '🌱'}</span>
            <span className="text-white/40 text-xs">{fromMode === 'finance' ? 'Finance' : 'Sustainability'}</span>
          </div>
          <div className="text-white/30 text-3xl font-bold">→</div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-4xl">{toMode === 'finance' ? '💼' : '🌱'}</span>
            <span className={`text-xs font-bold ${toMode === 'finance' ? 'text-blue-300' : 'text-green-300'}`}>
              {toMode === 'finance' ? 'Finance' : 'Environment'}
            </span>
          </div>
        </div>

        <div className={`rounded-2xl p-4 mb-6 border ${toMode === 'sustainability'
          ? 'bg-green-500/20 border-green-400/30'
          : 'bg-blue-500/20 border-blue-400/30'
          }`}>
          <p className={`text-lg font-bold mb-1 ${toMode === 'sustainability' ? 'text-green-300' : 'text-blue-300'}`}>
            {toMode === 'sustainability' ? '🌱 Now in Environment Mode!' : '💼 Now in Finance Mode!'}
          </p>
          <p className="text-white/60 text-sm leading-relaxed">
            {toMode === 'sustainability'
              ? 'Questions are now about ecology, ESG and green energy.'
              : 'Questions are now about budgeting, investing and finance.'}
          </p>
        </div>

        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-white/30 animate-pulse" />
          <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">
            Closing Automatically...
          </p>
        </div>
      </div>
    </div>
  );
}

// Investment Modal
interface InvestmentModalProps {
  balance: number;
  mode: GameMode;
  onResult: (profit: number) => void;
}

export function InvestmentModal({ balance, mode, onResult }: InvestmentModalProps) {
  const [phase, setPhase] = useState<'choose' | 'rolling' | 'result'>('choose');
  const [investAmount, setInvestAmount] = useState(0);
  const [diceValue, setDiceValue] = useState(1);
  const [displayDice, setDisplayDice] = useState(0);
  const [resultInfo, setResultInfo] = useState<{ multiplier: number; message: string; result: 'lose' | 'even' | 'win' } | null>(null);
  const [timeLeft, setTimeLeft] = useState(35);

  useEffect(() => {
    if (phase !== 'choose') return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer);
          if (phase === 'choose') {
            handleSkip();
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase]);

  const investOptions = [5000, 25000, 75000, 100000];
  const diceFaces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

  const handleInvest = (amount: number) => {
    setInvestAmount(amount);
    setPhase('rolling');

    const finalValue = Math.floor(Math.random() * 6) + 1;
    let frame = 0;
    const interval = setInterval(() => {
      setDisplayDice(Math.floor(Math.random() * 6));
      frame++;
      if (frame > 20) {
        clearInterval(interval);
        setDiceValue(finalValue);
        setDisplayDice(finalValue - 1);
        const res = getInvestmentResult(finalValue);
        setResultInfo(res);
        setPhase('result');
      }
    }, 80);
  };

  const handleClose = () => {
    if (!resultInfo) return;
    const profit = Math.round(investAmount * resultInfo.multiplier) - investAmount;
    onResult(profit);
  };

  const handleSkip = () => {
    onResult(0);
  };

  const timerColor = timeLeft > 15 ? 'text-emerald-400' : timeLeft > 8 ? 'text-amber-400' : 'text-rose-400';

  return (
    <Modal onClose={() => { }} mode={mode}>
      <div className="p-6 text-center relative">
        {phase === 'choose' && (
          <div className={`absolute top-6 right-6 text-2xl font-black ${timerColor} animate-pulse`}>
            {timeLeft}s
          </div>
        )}
        <div className="text-5xl mb-3">📊</div>
        <h2 className="text-2xl font-bold text-white mb-1">Investment</h2>
        <p className="text-white/60 text-sm mb-4">The fate of your investment depends on luck.</p>

        {phase === 'choose' && (
          <>
            <div className="bg-white/10 rounded-2xl p-4 mb-4 border border-white/10">
              <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Your Capital</p>
              <p className="text-2xl font-black text-white">{balance.toLocaleString('en')} €</p>
            </div>

            <div className="bg-white/5 rounded-xl p-3 mb-4 border border-white/10">
              <p className="text-white/50 text-xs mb-2">Outcomes:</p>
              <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                <div className="bg-rose-500/20 rounded-lg p-1.5 text-rose-300">⚀ 1=0x</div>
                <div className="bg-rose-500/15 rounded-lg p-1.5 text-rose-300">⚁ 2=0x</div>
                <div className="bg-rose-500/10 rounded-lg p-1.5 text-rose-300">⚂ 3=0.5x</div>
                <div className="bg-white/10 rounded-lg p-1.5 text-white/60">⚃ 4=1x</div>
                <div className="bg-emerald-500/20 rounded-lg p-1.5 text-emerald-300">⚄ 5=2x</div>
                <div className="bg-yellow-500/20 rounded-lg p-1.5 text-yellow-300 font-bold">⚅ 6=4x</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {investOptions.map(amount => {
                const canAfford = balance >= amount;
                return (
                  <button
                    key={amount}
                    disabled={!canAfford}
                    onClick={() => handleInvest(amount)}
                    className={`font-bold py-3 rounded-xl border transition-all ${canAfford ? "bg-blue-500/30 hover:bg-blue-500/50 border-blue-400/30 text-white" : "bg-gray-800 border-white/5 text-white/20 cursor-not-allowed"}`}
                  >
                    {amount.toLocaleString('en')} €
                  </button>
                );
              })}
            </div>
            <button onClick={handleSkip} className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 rounded-xl transition-all text-sm">Skip Investment ▶</button>
          </>
        )}

        {phase === 'rolling' && (
          <>
            <p className="text-white/70 mb-4">Invested: <span className="text-blue-400 font-bold">{investAmount.toLocaleString('en')} €</span></p>
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 rounded-2xl border-2 border-white/30 bg-white/10 flex items-center justify-center animate-dice-spin">
                <span className="text-6xl">{diceFaces[displayDice]}</span>
              </div>
            </div>
          </>
        )}

        {phase === 'result' && resultInfo && (
          <>
            <p className="text-white/70 mb-3">Invested: <span className="text-blue-400 font-bold">{investAmount.toLocaleString('en')} €</span></p>
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-2xl border-2 border-white/30 bg-white/10 flex items-center justify-center relative">
                <span className="text-5xl">{diceFaces[diceValue - 1]}</span>
              </div>
            </div>
            <p className="text-lg font-bold text-white mb-3">{resultInfo.message}</p>
            <div className={`rounded-2xl p-4 mb-4 border ${resultInfo.result === 'win' ? 'bg-emerald-500/20 border-emerald-400/30' : resultInfo.result === 'lose' ? 'bg-rose-500/20 border-rose-400/30' : 'bg-white/10 border-white/20'}`}>
              <p className="text-2xl font-black text-white">{(Math.round(investAmount * resultInfo.multiplier) - investAmount).toLocaleString('en')} €</p>
            </div>
            <button onClick={handleClose} className={`w-full font-bold py-4 rounded-2xl transition-all text-lg ${resultInfo.result === 'win' ? 'bg-emerald-500 hover:bg-emerald-400 text-white' : 'bg-rose-500 hover:bg-rose-400 text-white'}`}>Continue ▶</button>
          </>
        )}
      </div>
    </Modal>
  );
}

// Victory Modal
export function VictoryModal({ balance, onReplay }: { balance: number, steps: number, onReplay: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/80 animate-backdrop-fade" />
      <div className="relative w-full max-w-md bg-gradient-to-br from-yellow-900/95 to-amber-900/95 rounded-3xl border border-yellow-400/30 p-8 text-center my-4 animate-modal-pop">
        <div className="text-7xl mb-4">🏆</div>
        <h1 className="text-3xl font-black text-yellow-400 mb-1 uppercase">Winner!</h1>
        <p className="text-white text-lg mb-6">You reached 1,000,000 €!</p>
        <div className="bg-white/10 rounded-2xl p-4 mb-6 space-y-3">
          <div className="flex justify-between text-white">
            <span className="text-white/70">Final Capital</span>
            <span className="font-bold text-yellow-400">{balance.toLocaleString('en')} €</span>
          </div>
        </div>
        <button onClick={onReplay} className="w-full bg-yellow-500 hover:bg-yellow-400 text-white font-black py-4 rounded-2xl transition-all active:scale-95 text-xl shadow-xl shadow-yellow-500/30">🔄 Play Again</button>
      </div>
    </div>
  );
}

// ── TAX SMALL MODAL ──
export function TaxSmallModal({ taxExemptionTurns, onClose, mode }: { taxExemptionTurns: number, onClose: () => void, mode: GameMode }) {
  const isExempt = taxExemptionTurns > 0;

  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <Modal onClose={onClose} mode={mode}>
      <div className="p-6 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-white mb-2">Caution!</h2>
        {isExempt ? (
          <div className="bg-emerald-500/20 border border-emerald-400/30 rounded-2xl p-6 mb-4">
            <p className="text-emerald-400 font-bold text-xl mb-1 text-center">🛡️ Tax Exempted!</p>
            <p className="text-white/40 text-[10px] mt-2">You are safe from collection for {taxExemptionTurns} more turns.</p>
          </div>
        ) : (
          <div className="bg-amber-500/20 border border-amber-400/30 rounded-2xl p-6 mb-4">
            <p className="text-amber-400 font-bold text-lg mb-2">Vulnerable Zone</p>
            <p className="text-white/70 text-sm leading-relaxed">
              You are standing on a small tax field. If anyone lands on the Tax Collection (🏦) field, they can take money from you!
            </p>
          </div>
        )}
        <p className="text-white/30 text-[10px] animate-pulse">Closing in 3s...</p>
      </div>
    </Modal>
  );
}

// ── TAX LARGE MODAL ──
interface TaxLargeModalProps {
  targets: Player[];
  onCollect: (targetIds: string[]) => void;
  onClose: () => void;
  mode: GameMode;
}

export function TaxLargeModal({ targets, onCollect, onClose, mode }: TaxLargeModalProps) {
  const amountPerPlayer = 35000;
  const totalPotential = targets.length * amountPerPlayer;

  return (
    <Modal onClose={onClose} mode={mode}>
      <div className="p-6 text-center">
        <div className="text-6xl mb-4 animate-pulse">🏦</div>
        <h2 className="text-2xl font-bold text-white mb-2">Tax Inspection</h2>
        <p className="text-white/60 text-sm mb-6 italic">Collect taxes from players currently on small tax fields.</p>

        {targets.length > 0 ? (
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 max-h-48 overflow-y-auto">
              <p className="text-[10px] text-white/40 uppercase font-bold mb-3 tracking-widest">Liable Players:</p>
              <div className="space-y-2">
                {targets.map(p => (
                  <div key={p.id} className="flex items-center justify-between bg-white/5 p-2 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span>{p.avatar === 'male' ? '👨' : p.avatar === 'female' ? '👩' : '🤖'}</span>
                      <span className="text-xs font-medium text-white">{p.name}</span>
                    </div>
                    <span className="text-rose-400 text-xs font-bold">{p.taxExemptTurns > 0 ? '🛡️ EXEMPT' : `-${amountPerPlayer.toLocaleString()} €`}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-emerald-500/20 border border-emerald-400/30 rounded-2xl p-4">
              <p className="text-white/60 text-[10px] uppercase font-bold tracking-widest mb-1">Total Collection</p>
              <p className="text-3xl font-black text-emerald-400">{totalPotential.toLocaleString()} €</p>
            </div>

            <button
              onClick={() => onCollect(targets.filter(p => p.taxExemptTurns === 0).map(p => p.id))}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-emerald-500/20 text-lg"
            >
              COLLECT ALL 💰
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-rose-500/10 border border-rose-400/20 rounded-2xl p-8">
              <p className="text-rose-300 font-bold mb-2">No Takers!</p>
              <p className="text-white/40 text-xs">There are no players currently on small tax fields. You collect nothing this time.</p>
            </div>
            <button onClick={onClose} className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 rounded-2xl transition-all">Continue ▶</button>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ── AUCTION MODAL ──
interface AuctionModalProps {
  onResult: (won: boolean) => void;
  mode: GameMode;
  players: Player[];
  currentPlayerIndex: number;
}

export function AuctionModal({ onResult, mode, players, currentPlayerIndex }: AuctionModalProps) {
  const [hasRolled, setHasRolled] = useState(false);
  const myId = multiplayer.getMyId();
  const auctionState = multiplayer.state.auction;
  const isHost = players.find(p => p.id === myId)?.isHost;

  useEffect(() => {
    if (isHost && !auctionState.active) {
      multiplayer.sendAction({ type: 'ACTION_AUCTION_START' });
    }
  }, [isHost]);

  const handleRoll = () => {
    const roll = Math.floor(Math.random() * 6) + 1;
    multiplayer.sendAction({ type: 'ACTION_AUCTION_ROLL', roll });
    setHasRolled(true);
  };

  const rolls = auctionState.rolls || {};
  const turnIndex = auctionState.turnIndex || 0;
  const allRolled = turnIndex >= players.length;

  let winnerId: string | null = null;
  if (allRolled) {
    const rollsList = Object.entries(rolls);
    const maxVal = Math.max(...rollsList.map(([_, r]) => r));
    const winners = players.filter(p => rolls[p.id] === maxVal);
    winnerId = winners[0]?.id || null;
  }

  const myIndex = players.findIndex(p => p.id === myId);
  const isMyTurnToRoll = myIndex === turnIndex;
  const activeRoller = players[turnIndex] || players[0];

  return (
    <Modal onClose={() => { }} mode={mode}>
      <div className="p-6 text-center">
        <div className="text-6xl mb-4">⚖️</div>
        <h2 className="text-2xl font-bold text-white mb-2">Multiplayer Auction</h2>
        <p className="text-white/70 mb-6 italic text-sm">Everyone in the session is rolling for the Exemption Card!</p>

        {!allRolled ? (
          <div className="space-y-6">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 mb-4 text-center">
              <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-1">Upcoming Roller:</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg">{activeRoller.avatar === 'male' ? '👨' : activeRoller.avatar === 'female' ? '👩' : '🤖'}</span>
                <span className="text-white font-bold">{activeRoller.name} {activeRoller.id === myId && '(You)'}</span>
              </div>
            </div>

            <button
              onClick={handleRoll}
              disabled={!isMyTurnToRoll || hasRolled}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-xl ${!isMyTurnToRoll || hasRolled
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50'
                : 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white hover:scale-105 active:scale-95 shadow-amber-900/40'
                }`}
            >
              {hasRolled ? 'Rolled! ⏳' : isMyTurnToRoll ? 'Roll Dice! 🎲' : 'Waiting for Turn... ⏳'}
            </button>

            <div className="grid grid-cols-3 gap-3">
              {players.map(p => {
                const pRoll = rolls[p.id];
                const isRollingNow = players[turnIndex]?.id === p.id;
                return (
                  <div key={p.id} className="flex flex-col items-center gap-1">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl border-2 transition-all ${pRoll
                      ? 'bg-emerald-500/20 border-emerald-400'
                      : isRollingNow
                        ? 'bg-blue-500/20 border-blue-400 animate-pulse'
                        : 'bg-white/5 border-white/10 opacity-50'
                      }`}>
                      {pRoll ? pRoll : '🎲'}
                    </div>
                    <span className={`text-[10px] truncate w-16 text-center ${isRollingNow ? 'text-blue-400 font-bold' : 'text-white/40'}`}>
                      {p.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-2 mb-6 max-h-40 overflow-y-auto pr-1">
              {players.map(p => (
                <div key={p.id} className={`flex items-center justify-between p-3 rounded-xl border ${p.id === winnerId ? 'bg-emerald-500/20 border-emerald-400/40' : 'bg-white/5 border-white/5'}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{p.avatar === 'male' ? '👨' : p.avatar === 'female' ? '👩' : '🤖'}</span>
                    <span className={`text-xs font-bold ${p.id === winnerId ? 'text-emerald-300' : 'text-white/60'}`}>{p.name}</span>
                  </div>
                  <span className={`font-black text-xl ${p.id === winnerId ? 'text-emerald-400' : 'text-white/40'}`}>{rolls[p.id]}</span>
                </div>
              ))}
            </div>
            <div className={`rounded-2xl p-4 mb-6 ${winnerId === multiplayer.getMyId() ? 'bg-emerald-500/20 border border-emerald-400/30' : 'bg-white/5 border border-white/10'}`}>
              <p className="text-white font-bold text-center">
                {winnerId === multiplayer.getMyId() ? '🎉 You Won Tax Exemption!' : `😢 ${players.find(p => p.id === winnerId)?.name} Won!`}
              </p>
            </div>
            <button onClick={() => onResult(winnerId === players[currentPlayerIndex].id)} className="w-full bg-amber-500 hover:bg-amber-400 text-white font-bold py-4 rounded-2xl transition-all">Continue ▶</button>
          </>
        )}
      </div>
    </Modal>
  );
}

// ── INSURANCE MODAL ──
export function InsuranceModal({ balance, price, onBuy, onClose, mode }: { balance: number, price: number, onBuy: (price: number) => void, onClose: () => void, mode: GameMode }) {
  const canAfford = balance >= price;
  return (
    <Modal onClose={onClose} mode={mode}>
      <div className="p-6 text-center">
        <div className="text-6xl mb-4">🛡️</div>
        <h2 className="text-2xl font-bold text-white mb-2">Purchase Insurance</h2>
        <p className="text-white/60 text-sm mb-6">Invest in insurance to stay exempt from taxes and fees for the next 3 rounds.</p>

        <div className="bg-amber-500/20 border border-amber-400/30 rounded-2xl p-4 mb-6 text-center">
          <p className="text-amber-300 text-[10px] uppercase mb-1 tracking-widest font-bold">Insurance Premium</p>
          <p className="text-4xl font-black text-amber-400">{price.toLocaleString('en')} €</p>
        </div>

        {!canAfford && (
          <div className="bg-rose-500/20 border border-rose-400/30 rounded-xl p-3 mb-6">
            <p className="text-rose-400 text-sm font-bold">⚠️ Insufficient Funds</p>
            <p className="text-white/60 text-xs">You cannot afford this insurance right now.</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 rounded-2xl transition-all active:scale-95"
          >
            ❌ Skip
          </button>
          <button
            onClick={() => onBuy(price)}
            disabled={!canAfford}
            className={`font-bold py-4 rounded-2xl transition-all ${canAfford
              ? "bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20 scale-105"
              : "bg-gray-700 text-white/30 cursor-not-allowed border border-white/5 opacity-50"
              }`}
          >
            ✅ Buy
          </button>
        </div>
      </div>
    </Modal>
  );
}
