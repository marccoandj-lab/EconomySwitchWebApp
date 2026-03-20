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
  | { type: 'UPDATE_LEVELS'; levels: Level[] };

class MultiplayerManager {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private hostConnection: DataConnection | null = null;
  private onStateUpdate: (state: GameState) => void = () => { };
  private onError: (error: string) => void = () => { };

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

  init(onUpdate: (state: GameState) => void, onError: (err: string) => void) {
    this.onStateUpdate = onUpdate;
    this.onError = onError;
    // Notify immediate state on init to sync UI
    onUpdate({ ...this.state });
  }

  // Common ICE servers for better NAT traversal on phones/mobiles
  private readonly config = {
    config: {
      'iceServers': [
        { 'urls': 'stun:stun.l.google.com:19302' },
        { 'urls': 'stun:stun1.l.google.com:19302' },
        { 'urls': 'stun:stun2.l.google.com:19302' },
        { 'urls': 'stun:stun3.l.google.com:19302' },
        { 'urls': 'stun:stun4.l.google.com:19302' },
      ]
    }
  };

  private getPeerConfig() {
    const isRender = window.location.hostname.includes('onrender.com');
    const RENDER_HOST = 'economyswitchwebapp.onrender.com';

    // ALWAYS use the Render server in production OR if we want to test cross-device from localhost
    // This ensures phone and PC are on the same signaling plane
    return {
      ...this.config,
      host: isRender ? window.location.hostname : RENDER_HOST,
      port: 443,
      secure: true,
      path: '/peerjs'
    };
  }

  createRoom(name: string, avatar: AvatarType): string {
    const roomId = nanoid(6).toUpperCase();
    this.peer = new Peer(roomId, this.getPeerConfig());
    
    this.peer.on('error', (err) => {
      console.error('Peer error:', err.type);
      if (err.type === 'unavailable-id') {
        this.onError('Room ID already exists. Try again.');
      } else {
        this.onError('Connection error: ' + err.type);
      }
    });

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
    this.peer = new Peer(this.getPeerConfig());

    this.peer.on('error', (err) => {
      console.error('Join error:', err.type);
      if (err.type === 'peer-unavailable') {
        this.onError('Room does not exist! Please check the code.');
      } else {
        this.onError('Connection failed: ' + err.type);
      }
    });

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
      const senderId = conn.metadata?.playerId;
      switch (msg.type) {
        case 'JOIN_REQUEST':
          if (this.state.players.length < 6) {
            // Already connected?
            if (this.state.players.find(p => p.id === msg.profile.id)) return;
            
            this.connections.set(msg.profile.id, conn);
            this.state.players.push(msg.profile);
            
            // Give the connection a fraction of a second to be fully ready before large state sync
            setTimeout(() => {
              this.broadcastState();
              console.log("Player joined and state broadcasted:", msg.profile.name);
            }, 300);
          }
          break;
        default:
          this.handleAction(senderId || this.myId, msg);
          break;
      }
    } else {
      if (msg.type === 'STATE_UPDATE') {
        // Only accept state if it's reasonably populated
        if (msg.state && msg.state.players && msg.state.players.length > 0) {
          this.state = { ...this.state, ...msg.state };
          this.onStateUpdate(this.state);
        }
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
    const allowedActions: Message['type'][] = [
      'ACTION_AUCTION_ROLL', 'ACTION_INTERACTION_START', 'ACTION_INTERACTION_END', 
      'JOIN_REQUEST', 'UPDATE_LEVELS', 'ACTION_AUCTION_END'
    ];

    if (!isMyTurn && !allowedActions.includes(msg.type)) return;

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
        const expectedId = auctionPlayerIds[this.state.auction.turnIndex % auctionPlayerIds.length];
        if (playerId !== expectedId) return;
        this.state.auction.rolls[playerId] = msg.roll;
        this.state.auction.turnIndex++;
        if (this.state.auction.turnIndex >= this.state.players.length) {
          const rolls = Object.entries(this.state.auction.rolls);
          const maxRoll = Math.max(...rolls.map(([_, r]) => r));
          rolls.filter(([_, r]) => r === maxRoll).forEach(([winId]) => {
            const winner = this.state.players.find(p => p.id === winId);
            if (winner) {
              winner.taxExemptTurns = 3;
              winner.stats.auctionWins++;
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
        const nextIdx = (this.state.currentTurnIndex + 1) % this.state.players.length;
        this.state.currentTurnIndex = nextIdx;
        const nextP = this.state.players[nextIdx];
        if (nextP.status === 'jail' && nextP.jailSkipped) {
          nextP.status = 'playing';
          nextP.jailSkipped = false;
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
        const nextI = (this.state.currentTurnIndex + 1) % this.state.players.length;
        const nextIP = this.state.players[nextI];
        if (nextIP.status === 'jail' && nextIP.jailSkipped) {
          nextIP.status = 'playing';
          nextIP.jailSkipped = false;
        }
        this.state.currentTurnIndex = nextI;
        break;
      case 'ACTION_AUCTION_END':
        this.state.auction.active = false;
        this.state.players.forEach(p => p.isInteracting = false);
        const aNex = (this.state.currentTurnIndex + 1) % this.state.players.length;
        const aNexP = this.state.players[aNex];
        if (aNexP.status === 'jail' && aNexP.jailSkipped) {
          aNexP.status = 'playing';
          aNexP.jailSkipped = false;
        }
        this.state.currentTurnIndex = aNex;
        break;
      case 'UPDATE_LEVELS':
        this.state.levels = msg.levels;
        break;
    }
    this.checkWinCondition();
    this.broadcastState();
  }

  private broadcastState() {
    const fullState = { ...this.state };
    this.connections.forEach(conn => {
      this.sendMessage(conn, { type: 'STATE_UPDATE', state: fullState });
    });
    this.onStateUpdate(fullState);
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
