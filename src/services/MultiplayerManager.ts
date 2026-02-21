import { Peer, DataConnection } from 'peerjs';
import { nanoid } from 'nanoid';
import { Player } from '../types/game';
import { generateLevels } from '../data/levelGenerator';
import { Level } from '../data/gameData';

export type GameState = {
  roomId: string;
  players: Player[];
  currentTurnIndex: number;
  status: 'waiting' | 'starting' | 'playing' | 'ended';
  turnTimeLeft: number;
  mode: 'finance' | 'sustainability';
  auction: {
    active: boolean;
    rolls: Record<string, number>;
    turnIndex: number;
  };
  levels: Level[];
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
    levels: []
  };

  private myId: string = nanoid(10);
  private myProfile: Player | null = null;

  init(onUpdate: (state: GameState) => void) {
    this.onStateUpdate = onUpdate;
  }

  createRoom(name: string, avatar: 'male' | 'female' | 'robot'): string {
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
      isInteracting: false
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

  joinRoom(roomId: string, name: string, avatar: 'male' | 'female' | 'robot') {
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
      isInteracting: false
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

  private handleAction(playerId: string, msg: Message) {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player) return;

    switch (msg.type) {
      case 'ACTION_DICE_ROLL':
        player.position += msg.steps;
        if (player.taxExemptTurns > 0) player.taxExemptTurns--;

        // Calculate next turn
        let nextIndex = (this.state.currentTurnIndex + 1) % this.state.players.length;

        // Turn skip logic for jailed players
        while (this.state.players[nextIndex].status === 'jail') {
          // If everyone is in jail, free everyone and break
          if (this.state.players.every(p => p.status === 'jail')) {
            this.state.players.forEach(p => p.status = 'playing');
            break;
          }

          // release for the NEXT round, but they are skipped THIS turn
          this.state.players[nextIndex].status = 'playing';
          nextIndex = (nextIndex + 1) % this.state.players.length;
        }

        this.state.currentTurnIndex = nextIndex;

        // AUTO TRIGGER AUCTION FOR EVERYONE
        const boardField = this.state.levels[player.position]?.type;
        if (boardField === 'auction_insurance' && this.state.mode === 'finance') {
          this.state.auction = { active: true, rolls: {}, turnIndex: 0 };
        }
        break;
      case 'ACTION_QUIZ_RESULT':
        player.capital += msg.success ? msg.reward : -msg.penalty;
        break;
      case 'ACTION_TAX_PAY':
      case 'ACTION_TAX_COLLECT':
        break;
      case 'ACTION_INVEST':
        player.capital -= msg.stake;
        player.capital += Math.floor(msg.stake * msg.result);
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
        this.state.auction.rolls[playerId] = msg.roll;
        this.state.auction.turnIndex++;

        // If everyone rolled, determine winner
        if (this.state.auction.turnIndex >= this.state.players.length) {
          const rolls = Object.entries(this.state.auction.rolls);
          const maxRoll = Math.max(...rolls.map(([_, r]) => r));
          const winner = rolls.find(([_, r]) => r === maxRoll);
          if (winner) {
            const winnerPlayer = this.state.players.find(p => p.id === winner[0]);
            if (winnerPlayer) {
              winnerPlayer.taxExemptTurns = 3;
            }
          }
        }
        break;
      case 'ACTION_JAIL_WAIT':
        player.status = 'jail';
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
          }
        });
        break;
      case 'ACTION_INTERACTION_START':
        player.isInteracting = true;
        break;
      case 'ACTION_INTERACTION_END':
        player.isInteracting = false;
        break;
      case 'ACTION_AUCTION_END':
        this.state.auction.active = false;
        player.isInteracting = false;
        break;
      case 'UPDATE_LEVELS':
        this.state.levels = msg.levels;
        break;
    }
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
