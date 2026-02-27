import { GameMode, financeQuizzes, sustainabilityQuizzes, financeListings, sustainabilityListings, incomeEvents, expenseEvents, jailMessages, Level } from '../data/gameData';
import { IncomeModal, ExpenseModal, QuizModal, ListingModal, JailModal, SwitchModal, InvestmentModal, TaxSmallModal, TaxLargeModal, AuctionModal, InsuranceModal, VictoryModal, JailSkipModal, TurnAnnouncementModal } from './GameModal';
import { multiplayer } from '../services/MultiplayerManager';
import { Player } from '../types/game';

interface GameModalContainerProps {
  activeField: string | null;
  onClose: () => void;
  balance: number;
  levelIndex: number;
  mode: GameMode;
  onBalanceChange: (change: number) => void;
  onListingResult: (count: number, reward: number, penalty: number) => void;
  onModeChange: (mode: GameMode) => void;
  onTaxExemption: (turns: number) => void;
  levels: Level[];
  players: Player[];
  isSinglePlayer: boolean;
}

const GameModalContainer: React.FC<GameModalContainerProps> = ({
  activeField,
  onClose,
  balance,
  levelIndex,
  mode,
  onBalanceChange,
  onListingResult,
  onModeChange,
  onTaxExemption,
  levels,
  players,
  isSinglePlayer,
}) => {
  const isAuctionActive = multiplayer.state.auction.active;
  const isGameOver = multiplayer.state.status === 'finished';

  // Jail Skip logic: If it's MY turn and I am in jail, show JailSkipModal
  const myProfile = multiplayer.getMyProfile();
  const isMyTurn = players[multiplayer.state.currentTurnIndex]?.id === myProfile?.id;
  const showJailSkip = isMyTurn && myProfile?.status === 'jail' && !myProfile?.jailSkipped && !multiplayer.state.auction.active;

  const showModal = activeField || isAuctionActive || isGameOver || showJailSkip;

  if (!showModal) return null;

  // Prioritize VictoryModal
  if (isGameOver) {
    return <VictoryModal players={players} />;
  }

  // Prioritize JailSkipModal
  if (showJailSkip) {
    return (
      <JailSkipModal
        mode={mode}
        onSkip={() => {
          multiplayer.sendAction({ type: 'ACTION_JAIL_SKIP' });
          // DO NOT call onClose() here. 
          // ACTION_JAIL_SKIP already increments the turn index,
          // which will cause showJailSkip to become false and the modal to hide.
          // Calling onClose() triggers ACTION_INTERACTION_END, incrementing turn AGAIN.
        }}
      />
    );
  }

  const currentQuizzes = mode === 'finance' ? financeQuizzes : sustainabilityQuizzes;
  const currentListings = mode === 'finance' ? financeListings : sustainabilityListings;

  // Pick random content
  // Use a hash of levelIndex and potentially game session to get more variety,
  // but for "no repeat within session", we can use a randomized offset generated at start.
  // For now, let's just use levelIndex but we could add a session seed.
  const quiz = currentQuizzes[levelIndex % currentQuizzes.length];
  const listing = currentListings[levelIndex % currentListings.length];
  const income = incomeEvents[levelIndex % incomeEvents.length];
  const expense = expenseEvents[levelIndex % expenseEvents.length];
  const jail = jailMessages[levelIndex % jailMessages.length];

  // If Auction is active, prioritize it
  if (isAuctionActive) {
    const currentTurnIndex = multiplayer.state.currentTurnIndex;
    const activePlayerIndex = currentTurnIndex;
    const activePlayerId = players[activePlayerIndex]?.id;
    const canContinue = multiplayer.getMyId() === activePlayerId;

    return (
      <AuctionModal
        mode={mode}
        players={multiplayer.state.players}
        currentPlayerIndex={activePlayerIndex}
        canContinue={canContinue}
        onResult={(won) => {
          if (won) onTaxExemption(3);
          multiplayer.sendAction({ type: 'ACTION_AUCTION_END' });
          onClose();
        }}
      />
    );
  }

  switch (activeField) {
    case 'income':
      return (
        <IncomeModal
          title={income.title}
          description={income.description}
          amount={income.amount}
          icon={income.icon}
          mode={mode}
          onClose={() => {
            onBalanceChange(income.amount);
            onClose();
          }}
        />
      );
    case 'expense':
      return (
        <ExpenseModal
          title={expense.title}
          description={expense.description}
          amount={expense.amount}
          icon={expense.icon}
          mode={mode}
          onClose={() => {
            onBalanceChange(-expense.amount);
            onClose();
          }}
        />
      );
    case 'quiz':
      return (
        <QuizModal
          quiz={quiz}
          mode={mode}
          onResult={(correct, reward, penalty) => {
            onBalanceChange(correct ? reward : -penalty);
            onClose();
          }}
        />
      );
    case 'listing':
      return (
        <ListingModal
          challenge={listing}
          mode={mode}
          onResult={(success, reward, penalty, itemsCount) => {
            if (success) onListingResult(itemsCount || 0, reward, penalty);
            else onListingResult(0, reward, penalty);
            onClose();
          }}
        />
      );
    case 'jail':
      return (
        <JailModal
          title={jail.title}
          description={jail.description}
          icon={jail.icon}
          jailFine={75000}
          balance={balance}
          mode={mode}
          onPay={() => {
            if (isSinglePlayer) {
              onBalanceChange(-75000);
            } else {
              multiplayer.sendAction({ type: 'ACTION_JAIL_PAY', fine: 75000 });
            }
            onClose();
          }}
          onSkip={() => {
            if (isSinglePlayer) {
              multiplayer.state.currentTurnIndex = (multiplayer.state.currentTurnIndex + 1) % players.length;
            } else {
              multiplayer.sendAction({ type: 'ACTION_JAIL_WAIT' });
            }
            onClose();
          }}
        />
      );
    case 'switch':
      return (
        <SwitchModal
          fromMode={mode}
          toMode={mode === 'finance' ? 'sustainability' : 'finance'}
          onClose={() => {
            onModeChange(mode === 'finance' ? 'sustainability' : 'finance');
            onClose();
          }}
        />
      );
    case 'investment':
      return (
        <InvestmentModal
          balance={balance}
          mode={mode}
          onResult={(profit) => {
            onBalanceChange(profit);
            onClose();
          }}
        />
      );
    case 'tax_small':
      const myTaxExemption = multiplayer.state.players.find(p => p.id === multiplayer.getMyId())?.taxExemptTurns || 0;
      return (
        <TaxSmallModal
          taxExemptionTurns={myTaxExemption}
          mode={mode}
          onClose={onClose}
        />
      );
    case 'tax_large':
      const myId = multiplayer.getMyId();
      const otherPlayers = multiplayer.state.players.filter(p => p.id !== myId);
      const targets = otherPlayers.filter(p => {
        const field = levels[p.position % levels.length];
        return field.type === 'tax_small';
      });

      return (
        <TaxLargeModal
          targets={targets}
          mode={mode}
          onCollect={(targetIds) => {
            multiplayer.sendAction({
              type: 'ACTION_TAX_COLLECT_FROM_PLAYERS',
              targets: targetIds,
              amountPerPlayer: 35000
            });
            onClose();
          }}
          onClose={onClose}
        />
      );
    case 'auction_insurance':
      // This is now handled by the isAuctionActive check at top for Finance mode
      if (mode === 'sustainability') {
        return (
          <InsuranceModal
            balance={balance}
            price={35000}
            mode={mode}
            onBuy={(price) => {
              onBalanceChange(-price);
              onTaxExemption(3);
              onClose();
            }}
            onClose={onClose}
          />
        );
      }
      return null;
    case 'turn_announcement':
      return <TurnAnnouncementModal onComplete={onClose} />;
    default:
      return null;
  }
};

export default GameModalContainer;
