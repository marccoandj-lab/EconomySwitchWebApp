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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-black/70 animate-backdrop-fade" onClick={onClose} />
      <div className={`relative w-full sm:max-w-lg bg-gradient-to-br ${bgClass} rounded-[2rem] border border-white/20 shadow-2xl max-h-[95vh] overflow-y-auto animate-modal-pop`}>
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
  onResult: (success: boolean, reward: number, penalty: number, itemsCount: number) => void;
}

export function ListingModal({ challenge, mode, onResult }: ListingModalProps) {
  const [input, setInput] = useState('');
  const [found, setFound] = useState<string[]>([]);
  const [wrongCount, setWrongCount] = useState(0);
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
          setTimeout(() => onResult(success, challenge.reward, challenge.penalty, found.length), 1500);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [finished, found.length, challenge]);

  const handleSubmit = () => {
    if (!input.trim() || finished) return;

    // Improved normalization: Lowercase, remove punctuation, remove extra spaces
    const normalize = (str: string) =>
      str.toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
        .replace(/\s{2,}/g, " ")
        .trim();

    const normalizedInput = normalize(input);
    const alreadyFound = found.some(f => normalize(f) === normalizedInput);

    if (alreadyFound) {
      setMessage('⚠️ Already listed!');
      setInput('');
      setTimeout(() => setMessage(''), 1500);
      return;
    }

    // Flexible matching:
    // 1. Direct match
    // 2. Input is part of a valid answer (e.g. "solar" matches "Solar power")
    // 3. Valid answer is part of input (for slightly longer descriptions)
    const match = challenge.answers.find(answer => {
      const normalizedAnswer = normalize(answer);
      return normalizedAnswer === normalizedInput ||
        (normalizedInput.length > 3 && normalizedAnswer.includes(normalizedInput)) ||
        (normalizedAnswer.length > 3 && normalizedInput.includes(normalizedAnswer));
    });

    if (match) {
      const newFound = [...found, input.trim()];
      setFound(newFound);
      setMessage('✅ Match Found!');
      setInput('');
      if (newFound.length >= challenge.required) {
        setFinished(true);
        setTimeout(() => onResult(true, challenge.reward, challenge.penalty, newFound.length), 1200);
      }
    } else {
      setWrongCount(prev => prev + 1);
      setMessage('❌ Not in dictionary!');
      setInput('');
    }
    setTimeout(() => setMessage(''), 1500);
  };

  const handleSkip = () => {
    setFinished(true);
    onResult(false, 0, 0, found.length);
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
          <div className="flex items-center justify-between mt-1">
            <p className="text-white/60 text-sm">Required: {challenge.required} of {challenge.answers.length}+</p>
            {challenge.hint && <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider italic">Hint: {challenge.hint}</p>}
          </div>
        </div>
        <div className="flex gap-2 mb-4">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder={`e.g. ${challenge.answers[0]}`}
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
        {finished && found.length >= challenge.required && (
          <div className="bg-emerald-500/20 border border-emerald-400/30 rounded-2xl p-4 mb-4 text-center animate-bounce">
            <p className="text-emerald-400 font-bold uppercase tracking-widest text-[10px] mb-1">Challenge Completed!</p>
            <p className="text-2xl font-black text-white">+ {challenge.reward.toLocaleString('en')} €</p>
          </div>
        )}
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] text-white/40 uppercase font-black">Correct</span>
              <span className="text-emerald-400 font-black">{found.length}/{challenge.required}</span>
            </div>
            <div className="flex flex-col border-l border-white/10 pl-4">
              <span className="text-[10px] text-white/40 uppercase font-black">Invalid</span>
              <span className="text-rose-400 font-black">{wrongCount}</span>
            </div>
          </div>
          {finished && (
            <div className={`font-bold text-lg ${found.length >= challenge.required ? 'text-emerald-400' : 'text-rose-400'}`}>
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



// ── TAX SMALL MODAL ──
export function TaxSmallModal({ taxExemptionTurns, onClose, mode, amount }: { taxExemptionTurns: number, onClose: () => void, mode: GameMode, amount: number }) {
  const isExempt = taxExemptionTurns > 0;

  useEffect(() => {
    if (isExempt) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [onClose, isExempt]);

  return (
    <Modal onClose={() => { }} mode={mode}>
      <div className="p-6 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-white mb-2">Caution!</h2>
        {isExempt ? (
          <div className="bg-emerald-500/20 border border-emerald-400/30 rounded-2xl p-6 mb-4">
            <p className="text-emerald-400 font-bold text-xl mb-1 text-center">🛡️ Tax Exempted!</p>
            <p className="text-white/40 text-[10px] mt-2">You are safe from collection for {taxExemptionTurns} more turns.</p>
          </div>
        ) : (
          <>
            <div className="bg-amber-500/20 border border-amber-400/30 rounded-2xl p-6 mb-4">
              <p className="text-amber-400 font-bold text-lg mb-2">Vulnerable Zone</p>
              <p className="text-white/70 text-sm leading-relaxed mb-4">
                You are standing on a small tax field. This incurs a fee and makes you vulnerable to large tax collections!
              </p>
              <div className="bg-rose-500/20 border border-rose-500/30 rounded-xl p-3 inline-block">
                <p className="text-rose-400 font-black text-xl">Tax Fee: {amount.toLocaleString('en')} €</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-full bg-rose-500 hover:bg-rose-400 text-white font-black py-4 rounded-2xl transition-all shadow-lg active:scale-95"
            >
              PAY TAX & CONTINUE
            </button>
          </>
        )}
        {isExempt && <p className="text-white/30 text-[10px] animate-pulse">Closing in 3s...</p>}
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
                      <img
                        src={`/assets/${p.avatar}.png`}
                        alt=""
                        className="w-8 h-8 object-contain rounded-lg bg-white/5 p-1"
                      />
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
  canContinue?: boolean;
}

export function AuctionModal({ onResult, mode, players, currentPlayerIndex, canContinue = true }: AuctionModalProps) {
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
                <img
                  src={`/assets/${activeRoller.avatar}.png`}
                  alt=""
                  className="w-8 h-8 object-contain"
                />
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
                    <img
                      src={`/assets/${p.avatar}.png`}
                      alt=""
                      className="w-6 h-6 object-contain"
                    />
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
            {canContinue ? (
              <button onClick={() => onResult(winnerId === players[currentPlayerIndex].id)} className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 rounded-2xl transition-all shadow-lg active:scale-95 animate-pulse">
                Continue ▶
              </button>
            ) : (
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 italic text-white/40 text-sm">
                Waiting for {players[currentPlayerIndex]?.name} to continue...
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}

// ── JAIL MODAL ──
export function JailModal({ title, description, icon, jailFine, balance, mode, onPay, onSkip }: { title: string, description: string, icon: string, jailFine: number, balance: number, mode: GameMode, onPay: () => void, onSkip: () => void }) {
  const canAfford = balance >= jailFine;
  return (
    <Modal onClose={() => { }} mode={mode}>
      <div className="p-6 text-center">
        <div className="text-5xl mb-4">{icon}</div>
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        <p className="text-white/60 text-sm mb-6">{description}</p>

        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 mb-6">
          <p className="text-rose-400 text-[10px] uppercase font-bold tracking-widest mb-1">Get out fine</p>
          <p className="text-3xl font-black text-white">{jailFine.toLocaleString('en')} €</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onSkip}
            className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 rounded-2xl transition-all active:scale-95"
          >
            Skip Turn
          </button>
          <button
            onClick={onPay}
            disabled={!canAfford}
            className={`font-bold py-4 rounded-2xl transition-all ${canAfford
              ? "bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20"
              : "bg-gray-800 text-white/20 cursor-not-allowed border border-white/5"
              }`}
          >
            Pay and Continue
          </button>
        </div>
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

// ── VICTORY MODAL ──
interface VictoryModalProps {
  players: Player[];
}

export function VictoryModal({ players }: VictoryModalProps) {
  const sortedPlayers = [...players].sort((a, b) => b.capital - a.capital);
  const winner = sortedPlayers[0];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-xl overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl p-4 sm:p-8 my-auto overflow-hidden">
        {/* Animated Background effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-gradient-to-b from-blue-500/20 to-transparent blur-3xl" />

        <div className="relative z-10 text-center">
          <div className="text-5xl sm:text-7xl mb-2 sm:mb-4 animate-bounce">🏆</div>
          <h1 className="text-2xl sm:text-4xl font-black text-white mb-1 sm:mb-2 uppercase tracking-tighter">Game Over!</h1>
          <p className="text-white/50 text-[10px] sm:text-base mb-4 sm:mb-8 italic leading-tight">The first player to reach 1,000,000 € has been crowned!</p>

          {/* Winner Stats */}
          <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-400/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-4 sm:mb-8 text-left">
            <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30 shrink-0">
                <img
                  src={`/assets/${winner.avatar}.png`}
                  alt=""
                  className="w-10 h-10 sm:w-14 sm:h-14 object-contain"
                />
              </div>
              <div className="min-w-0">
                <div className="text-[8px] sm:text-[10px] text-blue-400 font-bold uppercase tracking-widest">Winner</div>
                <div className="text-lg sm:text-2xl font-black text-white truncate">{winner.name}</div>
              </div>
              <div className="ml-auto text-right shrink-0">
                <div className="text-[8px] sm:text-[10px] text-white/40 uppercase font-bold tracking-widest">Final Capital</div>
                <div className="text-lg sm:text-2xl font-black text-green-400">{winner.capital.toLocaleString()} €</div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              <StatItem label="Quiz Correct" value={winner.stats.correctQuizzes} icon="✅" />
              <StatItem label="Quiz Wrong" value={winner.stats.wrongQuizzes} icon="❌" />
              <StatItem label="Auction Wins" value={winner.stats.auctionWins} icon="⚖️" />
              <StatItem label="Invest. Profit" value={`${winner.stats.investmentGains.toLocaleString()} €`} icon="📈" />
              <StatItem label="Invest. Loss" value={`${winner.stats.investmentLosses.toLocaleString()} €`} icon="📉" />
              <StatItem label="Jail Visits" value={winner.stats.jailVisits} icon="🔒" />
            </div>
          </div>

          {/* Rankings */}
          <div className="space-y-1.5 sm:space-y-2 max-h-32 sm:max-h-48 overflow-y-auto pr-1 custom-scrollbar">
            {sortedPlayers.map((p, idx) => (
              <div key={p.id} className={`flex items-center gap-2 sm:gap-4 p-2 sm:p-3 rounded-xl sm:rounded-2xl border ${idx === 0 ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/5'}`}>
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-white/5 flex items-center justify-center font-bold text-white/50 text-xs sm:text-sm">{idx + 1}.</div>
                <img
                  src={`/assets/${p.avatar}.png`}
                  alt=""
                  className="w-6 h-6 sm:w-8 sm:h-8 object-contain shrink-0"
                />
                <span className="font-bold text-white text-[11px] sm:text-sm truncate">{p.name}</span>
                <span className="ml-auto font-black text-white/80 text-[11px] sm:text-sm shrink-0">{p.capital.toLocaleString()} €</span>
              </div>
            ))}
          </div>

          <button onClick={() => window.location.reload()} className="mt-4 sm:mt-8 w-full sm:w-auto px-8 py-3 sm:py-4 bg-white text-slate-900 font-black rounded-xl sm:rounded-2xl hover:scale-105 active:scale-95 transition-all text-xs sm:text-sm uppercase tracking-widest">
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value, icon }: { label: string, value: string | number, icon: string }) {
  return (
    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm">{icon}</span>
        <span className="text-[9px] text-white/40 uppercase font-bold truncate">{label}</span>
      </div>
      <div className="text-xs font-black text-white truncate">{value}</div>
    </div>
  );
}

// ── JAIL SKIP MODAL ──
interface JailSkipModalProps {
  onSkip: () => void;
  mode: GameMode;
}

export function JailSkipModal({ onSkip, mode }: JailSkipModalProps) {
  return (
    <Modal onClose={() => { }} mode={mode}>
      <div className="p-8 text-center">
        <div className="text-7xl mb-6 relative">
          🔒
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-20 bg-rose-500/20 blur-2xl -z-10" />
        </div>
        <h2 className="text-3xl font-black text-white mb-2">You Are In Jail!</h2>
        <p className="text-white/50 text-base mb-8">Your turn has been skipped because you are in jail. You must wait for your next turn to play again.</p>

        <button
          onClick={onSkip}
          className="w-full py-5 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white font-black rounded-[1.5rem] transition-all shadow-xl shadow-black/40 border border-white/10 active:scale-95 flex items-center justify-center gap-3 group"
        >
          <span className="text-xl group-hover:rotate-12 transition-transform">➡️</span>
          SKIP TURN
        </button>
      </div>
    </Modal>
  );
}

// ── TURN ANNOUNCEMENT MODAL ──
export function TurnAnnouncementModal({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-12 py-8 rounded-[2rem] shadow-2xl border-4 border-white/20 animate-modal-pop">
        <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic scale-110">
          It's Your Turn! 🎲
        </h2>
      </div>
    </div>
  );
}
