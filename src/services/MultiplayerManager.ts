import { io, Socket } from 'socket.io-client';
import { nanoid } from 'nanoid';
import { Player, AvatarType } from '../types/game';
import { generateLevels } from '../data/levelGenerator';
import { Level } from '../data/gameData';

export type GameState = {
  roomId: string;
  players: Player[];
  currentTurnIndex: number;
  status: 'waiting' | 'starting' | 'playing' | 'ended' | 'finished';
  turnTimeLeft: number;
  mode: 'finance' | 'sustainability';
  auction: {
    active: boolean;
    rolls: Record<string, number>;
    turnIndex: number;
  };
  levels: Level[];
  taxPool: number;
};

export type Message =
  | { type: 'JOIN_REQUEST'; profile: Player }
  | { type: 'STATE_UPDATE'; state: GameState }
  | { type: 'START_GAME' }
  | { type: 'ACTION_DICE_ROLL'; steps: number }
  | { type: 'ACTION_QUIZ_RESULT'; reward: number; penalty: number; success: boolean }
  | { type: 'ACTION_TAX_PAY'; amount: number }
  | { type: 'ACTION_TAX_COLLECT' }
  | { type: 'ACTION_INVEST'; result: number; amount: number; stake: number }
  | { type: 'ACTION_INSURANCE_BUY'; cost: number }
  | { type: 'ACTION_THEME_SWITCH'; mode: 'finance' | 'sustainability' }
  | { type: 'ACTION_AUCTION_START' }
  | { type: 'ACTION_AUCTION_ROLL'; roll: number }
  | { type: 'ACTION_JAIL_WAIT' }
  | { type: 'ACTION_TAX_EXEMPT'; turns: number; playerId?: string }
  | { type: 'ACTION_TAX_COLLECT_FROM_PLAYERS'; targets: string[]; amountPerPlayer: number }
  | { type: 'ACTION_INTERACTION_START' }
  | { type: 'ACTION_INTERACTION_END' }
  | { type: 'ACTION_AUCTION_END' }
  | { type: 'ACTION_JAIL_SKIP' }
  | { type: 'ACTION_JAIL_PAY'; fine: number }
  | { type: 'UPDATE_LEVELS'; levels: Level[] };

class MultiplayerManager {
  private socket: Socket | null = null;
  private onStateUpdate: (state: GameState) => void = () => { };

  public state: GameState = {
    roomId: '',
    players: [],
    currentTurnIndex: 0,
    status: 'waiting',
    turnTimeLeft: 60,
    mode: 'finance',
    auction: { active: false, rolls: {}, turnIndex: 0 },
    levels: [],
    taxPool: 0
  };

  public myId: string = nanoid(10);
  private myProfile: Player | null = null;

  private createInitialStats() {
    return {
      correctQuizzes: 0,
      wrongQuizzes: 0,
      investmentGains: 0,
      investmentLosses: 0,
      jailVisits: 0,
      jailSkips: 0,
      auctionWins: 0,
      taxesPaid: 0
    };
  }

  init(onUpdate: (state: GameState) => void) {
    this.onStateUpdate = onUpdate;
    if (this.socket) {
      this.socket.off('message');
      this.socket.on('message', (data: { senderId: string, msg: Message }) => {
        this.handleMessageFromServer(data.senderId, data.msg);
      });
      return;
    }
    const isProd = window.location.hostname !== 'localhost';
    // Prioritizing VITE_MULTIPLAYER_SERVER_URL if provided (ideal for Vercel + Render setup)
    const envUrl = import.meta.env.VITE_MULTIPLAYER_SERVER_URL;
    const serverUrl = envUrl || (isProd ? window.location.origin : 'http://localhost:9000');
    
    console.log(`Initialising Socket.io on: ${serverUrl}`);
    this.socket = io(serverUrl);
    
    this.socket.on('message', (data: { senderId: string, msg: Message }) => {
      this.handleMessageFromServer(data.senderId, data.msg);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
  }

  createRoom(name: string, avatar: AvatarType): string {
    const roomId = nanoid(6).toUpperCase();
    this.state.roomId = roomId;
    this.state.status = 'waiting';
    this.state.levels = generateLevels(100, 'finance');

    this.myProfile = {
      id: this.myId,
      name,
      avatar,
      capital: 50000,
      position: 0,
      isHost: true,
      status: 'waiting',
      taxExemptTurns: 0,
      hasPaidTax: false,
      isInteracting: false,
      jailSkipped: false,
      stats: this.createInitialStats()
    };

    this.state.players = [this.myProfile];
    this.socket?.emit('create-room', roomId);
    this.onStateUpdate({ ...this.state });
    
    return roomId;
  }

  joinRoom(roomId: string, name: string, avatar: AvatarType) {
    this.state.roomId = roomId;
    this.myProfile = {
      id: this.myId,
      name,
      avatar,
      capital: 50000,
      position: 0,
      isHost: false,
      status: 'waiting',
      taxExemptTurns: 0,
      hasPaidTax: false,
      isInteracting: false,
      jailSkipped: false,
      stats: this.createInitialStats()
    };

    this.socket?.emit('join-room', roomId);
    this.sendMessage({ type: 'JOIN_REQUEST', profile: this.myProfile! });
  }

  private handleMessageFromServer(senderId: string, msg: Message) {
    if (this.myProfile?.isHost) {
      switch (msg.type) {
        case 'JOIN_REQUEST':
          if (this.state.players.length < 6 && !this.state.players.find(p => p.id === msg.profile.id)) {
            this.state.players.push(msg.profile);
            this.broadcastState();
          }
          break;
        default:
          if (msg.type !== 'STATE_UPDATE') {
            this.handleAction(senderId, msg);
          }
          break;
      }
    } else {
      if (msg.type === 'STATE_UPDATE') {
        this.state = msg.state;
        this.onStateUpdate(this.state);
      }
    }
  }

  private checkWinCondition() {
    const winner = this.state.players.find(p => p.capital >= 1000000);
    if (winner && this.state.status !== 'finished') {
      this.state.status = 'finished';
    }
  }

  private handleAction(playerId: string, msg: Message) {
    const playerIndex = this.state.players.findIndex(p => p.id === playerId);
    const player = this.state.players[playerIndex];
    if (!player) return;

    const isMyTurn = this.state.currentTurnIndex === playerIndex;
    const allowedActionsWhileNotTurn: Message['type'][] = [
      'ACTION_AUCTION_ROLL',
      'ACTION_INTERACTION_START',
      'ACTION_INTERACTION_END',
      'JOIN_REQUEST',
      'UPDATE_LEVELS',
      'ACTION_AUCTION_END'
    ];

    if (!isMyTurn && !allowedActionsWhileNotTurn.includes(msg.type)) {
      console.warn(`Action ${msg.type} ignored: not player ${playerId}'s turn.`);
      return;
    }

    switch (msg.type) {
      case 'ACTION_DICE_ROLL':
        player.position += msg.steps;
        if (player.taxExemptTurns > 0) player.taxExemptTurns--;
        const boardField = this.state.levels[player.position]?.type;
        if (boardField === 'auction_insurance' && this.state.mode === 'finance') {
          this.state.auction = { active: true, rolls: {}, turnIndex: 0 };
        }
        break;
      case 'ACTION_QUIZ_RESULT':
        if (msg.success) {
          player.capital += msg.reward;
          player.stats.correctQuizzes++;
        } else {
          player.capital -= msg.penalty;
          player.stats.wrongQuizzes++;
        }
        break;
      case 'ACTION_TAX_PAY':
        player.capital -= msg.amount;
        this.state.taxPool += msg.amount;
        player.stats.taxesPaid++;
        break;
      case 'ACTION_TAX_COLLECT':
        break;
      case 'ACTION_INVEST':
        player.capital -= msg.stake;
        const investResult = Math.floor(msg.stake * msg.result);
        player.capital += investResult;
        if (investResult > msg.stake) {
          player.stats.investmentGains += (investResult - msg.stake);
        } else if (investResult < msg.stake) {
          player.stats.investmentLosses += (msg.stake - investResult);
        }
        break;
      case 'ACTION_INSURANCE_BUY':
        player.capital -= msg.cost;
        player.taxExemptTurns = 3;
        break;
      case 'ACTION_THEME_SWITCH':
        this.state.mode = msg.mode;
        break;
      case 'ACTION_AUCTION_START':
        this.state.auction = { active: true, rolls: {}, turnIndex: 0 };
        break;
      case 'ACTION_AUCTION_ROLL':
        const auctionPlayerIds = this.state.players.map(p => p.id);
        const expectedAuctionPlayerId = auctionPlayerIds[this.state.auction.turnIndex % auctionPlayerIds.length];
        if (playerId !== expectedAuctionPlayerId) return;
        this.state.auction.rolls[playerId] = msg.roll;
        this.state.auction.turnIndex++;
        if (this.state.auction.turnIndex >= this.state.players.length) {
          const auctionRolls = Object.entries(this.state.auction.rolls);
          const maxAuctionRoll = Math.max(...auctionRolls.map(([_, r]) => r));
          auctionRolls.filter(([_, r]) => r === maxAuctionRoll).forEach(([winId]) => {
            const winnerPlayer = this.state.players.find(p => p.id === winId);
            if (winnerPlayer) {
              winnerPlayer.taxExemptTurns = 3;
              winnerPlayer.stats.auctionWins++;
            }
          });
        }
        break;
      case 'ACTION_JAIL_WAIT':
        player.status = 'jail';
        player.jailSkipped = false;
        player.stats.jailVisits++;
        break;
      case 'ACTION_JAIL_SKIP':
        player.jailSkipped = true;
        player.isInteracting = false;
        player.stats.jailSkips++;
        const jNext = (this.state.currentTurnIndex + 1) % this.state.players.length;
        this.state.currentTurnIndex = jNext;
        const snp = this.state.players[jNext];
        if (snp.status === 'jail' && snp.jailSkipped) {
          snp.status = 'playing';
          snp.jailSkipped = false;
        }
        break;
      case 'ACTION_JAIL_PAY':
        player.capital -= msg.fine;
        player.status = 'playing';
        player.jailSkipped = false;
        this.state.taxPool += msg.fine;
        break;
      case 'ACTION_TAX_EXEMPT':
        if (msg.playerId) {
          const tgt = this.state.players.find(p => p.id === msg.playerId);
          if (tgt) tgt.taxExemptTurns = msg.turns;
        } else {
          player.taxExemptTurns = msg.turns;
        }
        break;
      case 'ACTION_TAX_COLLECT_FROM_PLAYERS':
        msg.targets.forEach(tid => {
          const tgt = this.state.players.find(p => p.id === tid);
          if (tgt && tgt.taxExemptTurns === 0) {
            tgt.capital -= msg.amountPerPlayer;
            player.capital += msg.amountPerPlayer;
            tgt.stats.taxesPaid++;
          }
        });
        break;
      case 'ACTION_INTERACTION_START':
        player.isInteracting = true;
        break;
      case 'ACTION_INTERACTION_END':
        player.isInteracting = false;
        const nIndex = (this.state.currentTurnIndex + 1) % this.state.players.length;
        const nNextP = this.state.players[nIndex];
        if (nNextP.status === 'jail' && nNextP.jailSkipped) {
          nNextP.status = 'playing';
          nNextP.jailSkipped = false;
        }
        this.state.currentTurnIndex = nIndex;
        break;
      case 'ACTION_AUCTION_END':
        this.state.auction.active = false;
        this.state.players.forEach(p => p.isInteracting = false);
        const aNextIdx = (this.state.currentTurnIndex + 1) % this.state.players.length;
        const aNextP = this.state.players[aNextIdx];
        if (aNextP.status === 'jail' && aNextP.jailSkipped) {
          aNextP.status = 'playing';
          aNextP.jailSkipped = false;
        }
        this.state.currentTurnIndex = aNextIdx;
        break;
      case 'UPDATE_LEVELS':
        this.state.levels = msg.levels;
        break;
    }
    this.checkWinCondition();
    this.broadcastState();
  }

  private broadcastState() {
    this.sendMessage({ type: 'STATE_UPDATE', state: this.state });
    this.onStateUpdate({ ...this.state });
  }

  private sendMessage(msg: Message) {
    this.socket?.emit('message', { roomId: this.state.roomId, msg });
  }

  startGame() {
    if (this.myProfile?.isHost && this.state.players.length >= 2) {
      this.state.status = 'playing';
      this.broadcastState();
    }
  }

  sendAction(msg: Message) {
    if (this.myProfile?.isHost) {
      this.handleAction(this.myId, msg);
    } else {
      this.sendMessage(msg);
    }
  }

  getMyProfile() {
    return this.state.players.find(p => p.id === this.myId);
  }

  getMyId() { return this.myId; }
}

export const multiplayer = new MultiplayerManager();
