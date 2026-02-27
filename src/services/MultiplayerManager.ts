import { Peer, DataConnection } from 'peerjs';
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
  | { type: 'ACTION_LISTING_RESULT'; success: boolean; reward: number; penalty: number; count: number }
  | { type: 'UPDATE_LEVELS'; levels: Level[] };

class MultiplayerManager {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private hostConnection: DataConnection | null = null;
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
      listedItems: 0,
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
  }

  createRoom(name: string, avatar: AvatarType): string {
    const roomId = nanoid(6).toUpperCase();
    this.peer = new Peer(roomId);
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

    this.peer.on('open', () => {
      this.onStateUpdate({ ...this.state });
    });

    this.peer.on('connection', (conn) => {
      conn.on('data', (data: any) => {
        this.handleMessage(conn, data as Message);
      });

      conn.on('close', () => {
        const pid = Array.from(this.connections.entries()).find(([_, c]) => c === conn)?.[0];
        if (pid) {
          this.state.players = this.state.players.filter(p => p.id !== pid);
          this.connections.delete(pid);
          this.broadcastState();
        }
      });
    });

    return roomId;
  }

  joinRoom(roomId: string, name: string, avatar: AvatarType) {
    this.peer = new Peer();
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

    this.peer.on('open', () => {
      const conn = this.peer!.connect(roomId, {
        metadata: { playerId: this.myId }
      });

      this.hostConnection = conn;

      conn.on('open', () => {
        this.sendMessage(conn, { type: 'JOIN_REQUEST', profile: this.myProfile! });
      });

      conn.on('data', (data: any) => {
        this.handleMessage(conn, data as Message);
      });

      conn.on('close', () => {
        alert('Disconnected from Host');
        window.location.reload();
      });
    });
  }

  private handleMessage(conn: DataConnection, msg: Message) {
    if (this.myProfile?.isHost) {
      const senderId = conn.metadata.playerId;
      switch (msg.type) {
        case 'JOIN_REQUEST':
          if (this.state.players.length < 6) {
            this.connections.set(msg.profile.id, conn);
            this.state.players.push(msg.profile);
            this.broadcastState();
          }
          break;
        case 'ACTION_DICE_ROLL':
        case 'ACTION_QUIZ_RESULT':
        case 'ACTION_TAX_PAY':
        case 'ACTION_TAX_COLLECT':
        case 'ACTION_INVEST':
        case 'ACTION_INSURANCE_BUY':
        case 'ACTION_THEME_SWITCH':
        case 'ACTION_AUCTION_START':
        case 'ACTION_AUCTION_ROLL':
        case 'ACTION_JAIL_WAIT':
        case 'ACTION_JAIL_SKIP':
        case 'ACTION_JAIL_PAY':
        case 'ACTION_LISTING_RESULT':
        case 'ACTION_TAX_EXEMPT':
        case 'ACTION_TAX_COLLECT_FROM_PLAYERS':
        case 'ACTION_INTERACTION_START':
        case 'ACTION_INTERACTION_END':
        case 'ACTION_AUCTION_END':
        case 'UPDATE_LEVELS':
          this.handleAction(senderId || this.myId, msg);
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

    // Turn enforcement (Host side)
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

        // AUTO TRIGGER AUCTION FOR EVERYONE
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
      case 'ACTION_LISTING_RESULT':
        if (msg.success) {
          player.capital += msg.reward;
          player.stats.listedItems += msg.count;
        } else {
          player.capital -= msg.penalty;
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
        // Auction turn enforcement
        const auctionPlayerIds = this.state.players.map(p => p.id);
        const expectedAuctionPlayerId = auctionPlayerIds[this.state.auction.turnIndex % auctionPlayerIds.length];

        if (playerId !== expectedAuctionPlayerId) {
          console.warn(`Auction roll ignored: expected ${expectedAuctionPlayerId}, got ${playerId}`);
          return;
        }

        this.state.auction.rolls[playerId] = msg.roll;
        this.state.auction.turnIndex++;

        // If everyone rolled, determine winner
        if (this.state.auction.turnIndex >= this.state.players.length) {
          const auctionRolls = Object.entries(this.state.auction.rolls);
          const maxAuctionRoll = Math.max(...auctionRolls.map(([_, r]) => r));
          const winners = auctionRolls.filter(([_, r]) => r === maxAuctionRoll);
          winners.forEach(([winId]) => {
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
        // DON'T set status to playing immediately.
        // Keep status as 'jail' so lock icon persists.
        player.jailSkipped = true;
        player.isInteracting = false; // Clear interaction state when skipping
        player.stats.jailSkips++;

        // Pass the turn
        const jailSkipNextIdx = (this.state.currentTurnIndex + 1) % this.state.players.length;
        this.state.currentTurnIndex = jailSkipNextIdx;

        // If the NEXT player is also in jail and skipped previously, release them
        const skipNextPlayer = this.state.players[jailSkipNextIdx];
        if (skipNextPlayer.status === 'jail' && skipNextPlayer.jailSkipped) {
          skipNextPlayer.status = 'playing';
          skipNextPlayer.jailSkipped = false;
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
          const target = this.state.players.find(p => p.id === msg.playerId);
          if (target) target.taxExemptTurns = msg.turns;
        } else {
          player.taxExemptTurns = msg.turns;
        }
        break;
      case 'ACTION_TAX_COLLECT_FROM_PLAYERS':
        msg.targets.forEach(targetId => {
          const target = this.state.players.find(p => p.id === targetId);
          if (target && target.taxExemptTurns === 0) {
            target.capital -= msg.amountPerPlayer;
            player.capital += msg.amountPerPlayer;
            target.stats.taxesPaid++;
          }
        });
        break;
      case 'ACTION_INTERACTION_START':
        player.isInteracting = true;
        break;
      case 'ACTION_INTERACTION_END':
        player.isInteracting = false;

        // Pass the turn only after interaction ends
        const nextIdx = (this.state.currentTurnIndex + 1) % this.state.players.length;
        const nextP = this.state.players[nextIdx];

        // Release from jail if they skipped previously
        if (nextP.status === 'jail' && nextP.jailSkipped) {
          nextP.status = 'playing';
          nextP.jailSkipped = false;
        }

        this.state.currentTurnIndex = nextIdx;
        break;
      case 'ACTION_AUCTION_END':
        this.state.auction.active = false;
        // Explicitly clear interacting for ALL players in the auction
        this.state.players.forEach(p => p.isInteracting = false);

        // Also increment turn after auction
        const auctionNextIdx = (this.state.currentTurnIndex + 1) % this.state.players.length;
        const auctionNextP = this.state.players[auctionNextIdx];
        if (auctionNextP.status === 'jail' && auctionNextP.jailSkipped) {
          auctionNextP.status = 'playing';
          auctionNextP.jailSkipped = false;
        }
        this.state.currentTurnIndex = auctionNextIdx;
        break;
      case 'UPDATE_LEVELS':
        this.state.levels = msg.levels;
        break;
    }
    this.checkWinCondition();
    this.broadcastState();
  }

  private broadcastState() {
    this.connections.forEach(conn => {
      this.sendMessage(conn, { type: 'STATE_UPDATE', state: this.state });
    });
    this.onStateUpdate({ ...this.state });
  }

  private sendMessage(conn: DataConnection, msg: Message) {
    conn.send(msg);
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
    } else if (this.hostConnection) {
      this.sendMessage(this.hostConnection, msg);
    }
  }

  getMyProfile() {
    return this.state.players.find(p => p.id === this.myId);
  }

  getMyId() { return this.myId; }
}

export const multiplayer = new MultiplayerManager();
