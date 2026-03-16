import { GameState, Player, Vec2 } from './types';
import { CharacterDef } from './characters';
import Peer, { DataConnection } from 'peerjs';

export type NetworkRole = 'host' | 'client' | 'offline';

export interface RemoteInput {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  bonk: boolean;
  boost: boolean;
  touchActive: boolean;
  touchMoveX: number;
  touchMoveY: number;
  touchBonk: boolean;
}

class NetworkManager {
  public role: NetworkRole = 'offline';
  public roomId: string | null = null;
  public playerId: string | null = null;
  
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private hostConnection: DataConnection | null = null;
  
  // Lobby state
  public playersInRoom: { id: string, name: string, character: CharacterDef }[] = [];
  
  // Remote Inputs (Host receives these)
  public remoteInputs: Record<string, RemoteInput> = {};
  
  // Remote State (Client receives this)
  public lastReceivedState: GameState | null = null;
  
  // Lobby Expiration
  public lobbyCreationTime: number | null = null;
  public lobbyExpired = false;
  private expirationTimer: any = null;

  // Callbacks
  public onLobbyUpdate: ((players: any[]) => void) | null = null;
  public onGameStart: (() => void) | null = null;
  public onLobbyExpired: (() => void) | null = null;
  public onPeerInitialized: ((id: string) => void) | null = null;
  
  createRoom(hostName: string, hostChar: CharacterDef): Promise<string> {
    return new Promise((resolve, reject) => {
      this.role = 'host';
      this.peer = new Peer({ debug: 2 });

      this.peer.on('open', (id) => {
        this.roomId = id;
        this.playerId = 'host-' + id;
        this.playersInRoom = [{ id: this.playerId, name: hostName, character: hostChar }];
        this.lobbyCreationTime = Date.now();
        this.lobbyExpired = false;
        
        console.log(`[Network] Peer created with ID: ${id}`);
        if (this.onPeerInitialized) this.onPeerInitialized(id);
        if (this.onLobbyUpdate) this.onLobbyUpdate(this.playersInRoom);

        // Start 5-minute timer
        this.expirationTimer = setTimeout(() => {
          if (this.playersInRoom.length > 0 && this.lastReceivedState === null && this.role === 'host') {
             // Game hasn't started yet and we are the host. If we were simulating state, lastReceivedState would remain null since only clients receive state this way. But wait, host doesn't receive state. A better check is if game has started via a flag. Let's add a simple flag.
          }
        }, 5 * 60 * 1000);

        resolve(id);
      });

      this.peer.on('connection', (conn) => {
        this.setupHostConnection(conn);
      });

      this.peer.on('error', (err) => {
        console.error('[Network] PeerJS Error:', err);
        reject(err);
      });
    });
  }

  private gameStarted = false;

  private startExpirationTimer() {
    this.gameStarted = false;
    this.lobbyExpired = false;
    if (this.expirationTimer) clearTimeout(this.expirationTimer);
    
    this.expirationTimer = setTimeout(() => {
      if (!this.gameStarted) {
        this.expireLobby();
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  private expireLobby() {
    console.log('[Network] Lobby expired.');
    this.lobbyExpired = true;
    this.broadcastToClients({ type: 'LOBBY_EXPIRED' });
    if (this.onLobbyExpired) this.onLobbyExpired();
    this.disconnect();
  }

  private setupHostConnection(conn: DataConnection) {
    conn.on('open', () => {
      console.log(`[Network] Client connected: ${conn.peer}`);
      
      if (this.lobbyExpired || this.gameStarted) {
         conn.send({ type: 'ROOM_CLOSED' });
         setTimeout(() => conn.close(), 500);
         return;
      }
      
      this.connections.set(conn.peer, conn);
    });

    conn.on('data', (data: any) => {
      if (data.type === 'JOIN_REQUEST') {
        const existing = this.playersInRoom.find(p => p.id === data.player.id);
        if (!existing) {
          console.log('[Network] New player joined:', data.player.name);
          this.playersInRoom = [...this.playersInRoom, data.player];
          if (this.onLobbyUpdate) this.onLobbyUpdate(this.playersInRoom);
        }
        this.broadcastToClients({ type: 'LOBBY_UPDATE', players: this.playersInRoom });
      }
      else if (data.type === 'PLAYER_INPUT') {
        this.remoteInputs[data.id] = data.input;
      }
    });

    conn.on('close', () => {
      console.log(`[Network] Client disconnected: ${conn.peer}`);
      this.connections.delete(conn.peer);
      // Remove from players array by finding the player ID formatted client-{peerId}
      const pId = 'client-' + conn.peer;
      this.playersInRoom = this.playersInRoom.filter(p => p.id !== pId);
      if (this.onLobbyUpdate) this.onLobbyUpdate(this.playersInRoom);
      this.broadcastToClients({ type: 'LOBBY_UPDATE', players: this.playersInRoom });
    });
  }

  joinRoom(roomId: string, clientName: string, clientChar: CharacterDef): Promise<void> {
    return new Promise((resolve, reject) => {
      this.role = 'client';
      this.roomId = roomId;
      this.peer = new Peer({ debug: 2 });

      this.peer.on('open', (id) => {
        this.playerId = 'client-' + id;
        console.log(`[Network] Connected as ${this.playerId}, joining room ${roomId}`);
        
        const conn = this.peer!.connect(roomId, { reliable: true });
        this.hostConnection = conn;

        conn.on('open', () => {
          this.playersInRoom = [{ id: this.playerId!, name: clientName, character: clientChar }];
          conn.send({
            type: 'JOIN_REQUEST',
            player: {
              id: this.playerId,
              name: clientName,
              character: clientChar
            }
          });
          resolve();
        });

        conn.on('data', (data: any) => {
          if (data.type === 'LOBBY_UPDATE') {
            const players = data.players;
            if (JSON.stringify(players) !== JSON.stringify(this.playersInRoom)) {
              console.log('[Network] Lobby updated:', players);
              this.playersInRoom = players;
              if (this.onLobbyUpdate) this.onLobbyUpdate(this.playersInRoom);
            }
          }
          else if (data.type === 'GAME_START') {
            console.log('[Network] Game starting!');
            if (this.onGameStart) this.onGameStart();
          }
          else if (data.type === 'GAME_STATE') {
            this.lastReceivedState = data.state;
          }
          else if (data.type === 'ROOM_CLOSED' || data.type === 'LOBBY_EXPIRED') {
             console.log('[Network] Room closed/expired by host');
             if (data.type === 'LOBBY_EXPIRED' && this.onLobbyExpired) {
               this.onLobbyExpired();
             }
             this.disconnect();
             if (this.onLobbyUpdate) this.onLobbyUpdate([]);
          }
        });

        conn.on('close', () => {
          console.log('[Network] Host connection closed.');
          this.disconnect();
        });
      });

      this.peer.on('error', (err) => {
        console.error('[Network] PeerJS joining Error:', err);
        reject(err);
      });
    });
  }

  startGame() {
    if (this.role === 'host') {
      this.gameStarted = true;
      if (this.expirationTimer) clearTimeout(this.expirationTimer);
      this.broadcastToClients({ type: 'GAME_START' });
      if (this.onGameStart) this.onGameStart();
    }
  }

  broadcastState(state: GameState) {
    if (this.role !== 'host') return;
    this.broadcastToClients({ type: 'GAME_STATE', state });
  }

  sendInput(input: RemoteInput) {
    if (this.role !== 'client' || !this.playerId || !this.hostConnection) return;
    
    // We send input unreliably if possible for lower latency, but PeerJS defaults to reliable data channels mostly.
    this.hostConnection.send({ type: 'PLAYER_INPUT', id: this.playerId, input });
  }

  private broadcastToClients(data: any) {
    if (this.role === 'host') {
      this.connections.forEach(conn => {
        if (conn.open) {
           conn.send(data);
        }
      });
    }
  }

  disconnect() {
    if (this.expirationTimer) clearTimeout(this.expirationTimer);
    if (this.role === 'host') {
      this.broadcastToClients({ type: 'ROOM_CLOSED' });
    }
    
    if (this.hostConnection) {
      this.hostConnection.close();
      this.hostConnection = null;
    }
    
    this.connections.forEach(conn => conn.close());
    this.connections.clear();

    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }

    this.role = 'offline';
    this.roomId = null;
    this.playerId = null;
    this.playersInRoom = [];
    this.gameStarted = false;
  }
}

export const networkManager = new NetworkManager();

