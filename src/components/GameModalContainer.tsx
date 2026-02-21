import React from 'react';
import { GameMode, financeQuizzes, sustainabilityQuizzes, financeListings, sustainabilityListings, incomeEvents, expenseEvents, jailMessages } from '../data/gameData';
import { IncomeModal, ExpenseModal, QuizModal, ListingModal, JailModal, SwitchModal, InvestmentModal, TaxSmallModal, TaxLargeModal, AuctionModal, InsuranceModal } from './GameModal';
import { multiplayer } from '../services/MultiplayerManager';

interface GameModalContainerProps {
  activeField: string | null;
  onClose: () => void;
  balance: number;
  levelIndex: number;
  mode: GameMode;
  onBalanceChange: (change: number) => void;
  onModeChange: (mode: GameMode) => void;
  onTaxExemption: (turns: number) => void;
}

const GameModalContainer: React.FC<GameModalContainerProps> = ({
  activeField,
  onClose,
  balance,
  levelIndex,
  mode,
  onBalanceChange,
  onModeChange,
  onTaxExemption,
}) => {
  if (!activeField) return null;

  const currentQuizzes = mode === 'finance' ? financeQuizzes : sustainabilityQuizzes;
  const currentListings = mode === 'finance' ? financeListings : sustainabilityListings;
  
  // Pick random content
  const quiz = currentQuizzes[levelIndex % currentQuizzes.length];
  const listing = currentListings[levelIndex % currentListings.length];
  const income = incomeEvents[levelIndex % incomeEvents.length];
  const expense = expenseEvents[levelIndex % expenseEvents.length];
  const jail = jailMessages[levelIndex % jailMessages.length];

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
          onResult={(success, reward, penalty) => {
            if (success) onBalanceChange(reward);
            else onBalanceChange(-penalty);
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
            onBalanceChange(-75000);
            onClose();
          }}
          onSkip={onClose}
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
      return (
        <TaxSmallModal
          balance={balance}
          taxExemptionTurns={0}
          mode={mode}
          onPay={(amount) => {
            multiplayer.sendAction({ type: 'ACTION_TAX_PAY', amount });
            onClose();
          }}
          onClose={onClose}
        />
      );
    case 'tax_large':
      const myProfile = multiplayer.getMyProfile();
      return (
        <TaxLargeModal
          taxPool={multiplayer.state.taxPool}
          isTaxpayer={myProfile?.hasPaidTax || false}
          mode={mode}
          onCollect={() => {
            multiplayer.sendAction({ type: 'ACTION_TAX_COLLECT' });
            onClose();
          }}
          onClose={onClose}
        />
      );
    case 'auction_insurance':
      if (mode === 'finance') {
        return (
          <AuctionModal
            mode={mode}
            players={multiplayer.state.players}
            currentPlayerIndex={multiplayer.state.currentTurnIndex}
            onResult={(won) => {
              if (won) onTaxExemption(3);
              onClose();
            }}
          />
        );
      } else {
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
    default:
      return null;
  }
};

export default GameModalContainer;
