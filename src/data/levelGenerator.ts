import { FieldType, GameMode, Level } from './gameData';

const getFieldMeta = (type: FieldType, _mode: GameMode): Omit<Level, 'id'> => {
  switch (type) {
    case 'start':
      return {
        type,
        label: 'START',
        icon: '🚀',
        color: 'text-white',
        bgColor: 'bg-gradient-to-br from-violet-500 to-purple-600',
        borderColor: 'border-violet-400',
        glowColor: 'shadow-violet-400/50',
      };
    case 'income':
      return {
        type,
        label: 'Income',
        icon: '💰',
        color: 'text-white',
        bgColor: 'bg-gradient-to-br from-emerald-400 to-green-600',
        borderColor: 'border-emerald-400',
        glowColor: 'shadow-emerald-400/50',
      };
    case 'expense':
      return {
        type,
        label: 'Expense',
        icon: '💸',
        color: 'text-white',
        bgColor: 'bg-gradient-to-br from-rose-400 to-red-600',
        borderColor: 'border-rose-400',
        glowColor: 'shadow-rose-400/50',
      };
    case 'quiz':
      return {
        type,
        label: 'Quiz',
        icon: '❓',
        color: 'text-black',
        bgColor: 'bg-gradient-to-br from-yellow-300 to-amber-500',
        borderColor: 'border-yellow-200',
        glowColor: 'shadow-yellow-400/50',
      };
    case 'listing':
      return {
        type,
        label: 'Listing',
        icon: '📝',
        color: 'text-white',
        bgColor: 'bg-gradient-to-br from-purple-500 to-violet-700',
        borderColor: 'border-purple-400',
        glowColor: 'shadow-purple-400/50',
      };
    case 'jail':
      return {
        type,
        label: 'Jail',
        icon: '🚔',
        color: 'text-white',
        bgColor: 'bg-gradient-to-br from-gray-600 to-gray-800',
        borderColor: 'border-gray-500',
        glowColor: 'shadow-gray-600/50',
      };
    case 'switch':
      return {
        type,
        label: 'SWITCH',
        icon: '🔄',
        color: 'text-white',
        bgColor: 'bg-gradient-to-br from-teal-400 via-cyan-500 to-blue-600',
        borderColor: 'border-teal-400',
        glowColor: 'shadow-teal-400/50',
      };
    case 'investment':
      return {
        type,
        label: 'Investment',
        icon: '📊',
        color: 'text-white',
        bgColor: 'bg-gradient-to-br from-blue-400 to-indigo-600',
        borderColor: 'border-blue-300',
        glowColor: 'shadow-blue-400/50',
      };
    case 'tax_small':
      return {
        type,
        label: 'Tax',
        icon: '💸',
        color: 'text-white',
        bgColor: 'bg-gradient-to-br from-pink-400 to-rose-500',
        borderColor: 'border-pink-300',
        glowColor: 'shadow-pink-400/50',
      };
    case 'tax_large':
      return {
        type,
        label: 'Tax Collect',
        icon: '🏦',
        color: 'text-white',
        bgColor: 'bg-gradient-to-br from-pink-500 to-fuchsia-600',
        borderColor: 'border-pink-200',
        glowColor: 'shadow-pink-500/80 animate-pulse',
      };
    case 'auction_insurance':
      return {
        type,
        label: _mode === 'finance' ? 'Auction' : 'Insurance',
        icon: _mode === 'finance' ? '⚖️' : '🛡️',
        color: 'text-white',
        bgColor: 'bg-gradient-to-br from-amber-400 to-yellow-600',
        borderColor: 'border-yellow-300',
        glowColor: 'shadow-yellow-400/50',
      };
    default:
      return {
        type,
        label: 'Field',
        icon: '⭐',
        color: 'text-white',
        bgColor: 'bg-gray-500',
        borderColor: 'border-gray-400',
        glowColor: 'shadow-gray-400/50',
      };
  }
};

const getRandomFieldType = (): FieldType => {
  const types: FieldType[] = [
    'income', 'income', 'income', 'income', 'income',
    'expense',
    'quiz', 'quiz',
    'listing',
    'investment',
    'switch',
    'jail',
    'tax_small', 'tax_small',
    'tax_large',
    'auction_insurance',
  ];
  return types[Math.floor(Math.random() * types.length)];
};

export const generateLevels = (
  count: number = 60, 
  mode: GameMode = 'finance', 
  startId: number = 0,
  lastType?: FieldType
): Level[] => {
  const levels: Level[] = [];
  let prevType = lastType;

  // Start field is only for the very first level
  if (startId === 0) {
    const startField = { id: 0, ...getFieldMeta('start', mode) };
    levels.push(startField);
    prevType = 'start';
  }

  const loopStart = startId === 0 ? 1 : 0;
  for (let i = loopStart; i < count; i++) {
    let type = getRandomFieldType();
    
    // Ensure no two identical fields are next to each other
    // Also try to avoid jail/switch being too frequent or adjacent if possible
    while (type === prevType) {
      type = getRandomFieldType();
    }
    
    prevType = type;
    levels.push({ id: startId + i, ...getFieldMeta(type, mode) });
  }

  return levels;
};
