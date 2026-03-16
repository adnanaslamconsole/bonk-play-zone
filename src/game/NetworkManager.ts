import { GameState, Player, Vec2 } from './types';
import { CharacterDef } from './characters';

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
  private channel: BroadcastChannel | null = null;
  
  // Lobby state
  public playersInRoom: { id: string, name: string, character: CharacterDef }[] = [];
  
  // Remote Inputs (Host receives these)
  public remoteInputs: Record<string, RemoteInput> = {};
  
  // Remote State (Client receives this)
  public lastReceivedState: GameState | null = null;
  private lobbyInterval: any = null;
  private joinInterval: any = null;

  // Callbacks
  public onLobbyUpdate: ((players: any[]) => void) | null = null;
  public onGameStart: (() => void) | null = null;
  
  connect() {
    if (this.channel) return;
    this.channel = new BroadcastChannel('bonkstars_multiplayer');
    
    this.channel.onmessage = (event) => {
      const { type, data, roomId } = event.data;
      
      // If we have a room ID set, filter out messages for other rooms
      if (this.roomId && roomId && roomId !== this.roomId) return;

      switch (type) {
        case 'JOIN_REQUEST':
          if (this.role === 'host' && data.roomId === this.roomId) {
            this.handleJoinRequest(data.player);
          }
          break;
        case 'LOBBY_UPDATE':
          if (this.role === 'client') {
            const players = data;
            if (JSON.stringify(players) !== JSON.stringify(this.playersInRoom)) {
              console.log('[Network] Lobby updated:', players);
              this.playersInRoom = players;
              if (this.onLobbyUpdate) this.onLobbyUpdate(this.playersInRoom);
            }
          }
          break;
        case 'GAME_START':
          if (this.role === 'client') {
            console.log('[Network] Game starting!');
            if (this.onGameStart) this.onGameStart();
          }
          break;
        case 'PLAYER_INPUT':
          if (this.role === 'host') {
            this.remoteInputs[data.id] = data.input;
          }
          break;
        case 'GAME_STATE':
          if (this.role === 'client') {
            this.lastReceivedState = data;
          }
          break;
        case 'ROOM_CLOSED':
          if (this.role === 'client') {
            console.log('[Network] Room closed by host');
            this.disconnect();
            if (this.onLobbyUpdate) this.onLobbyUpdate([]);
          }
          break;
      }
    };
  }

  createRoom(hostName: string, hostChar: CharacterDef): string {
    this.role = 'host';
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.roomId = code;
    this.playerId = 'host-' + Math.random().toString(36).substring(2, 6);
    
    this.playersInRoom = [{ id: this.playerId, name: hostName, character: hostChar }];
    
    // Periodically broadcast lobby state so late-joining clients see it
    if (this.lobbyInterval) clearInterval(this.lobbyInterval);
    this.lobbyInterval = setInterval(() => {
      this.sendToChannel('LOBBY_UPDATE', this.playersInRoom);
    }, 500); // 2Hz heartbeat

    if (this.onLobbyUpdate) this.onLobbyUpdate(this.playersInRoom);
    return code;
  }

  joinRoom(code: string, clientName: string, clientChar: CharacterDef) {
    this.role = 'client';
    this.roomId = code.toUpperCase();
    this.playerId = 'client-' + Math.random().toString(36).substring(2, 6);
    this.playersInRoom = [{ id: this.playerId, name: clientName, character: clientChar }]; 
    
    console.log(`[Network] Joining room ${this.roomId} as ${clientName}...`);
    
    // Periodically send join request until we are accepted (see ourselves in lobby)
    if (this.joinInterval) clearInterval(this.joinInterval);
    const sendJoin = () => {
      if (this.role !== 'client') {
        clearInterval(this.joinInterval);
        return;
      }
      // If we are already in the list with more than just ourselves, or the host recognized us
      if (this.playersInRoom.length > 0 && this.playersInRoom.some(p => p.id === this.playerId && this.playersInRoom.length > 1)) {
        console.log('[Network] Join confirmed by host list');
        clearInterval(this.joinInterval);
        return;
      }

      this.sendToChannel('JOIN_REQUEST', {
        roomId: this.roomId,
        player: {
          id: this.playerId,
          name: clientName,
          character: clientChar
        }
      });
    };

    sendJoin();
    this.joinInterval = setInterval(sendJoin, 1000);
  }

  private handleJoinRequest(player: any) {
    if (this.role !== 'host') return;
    
    const existing = this.playersInRoom.find(p => p.id === player.id);
    if (!existing) {
      console.log('[Network] New player discovered:', player.name);
      this.playersInRoom = [...this.playersInRoom, player];
      if (this.onLobbyUpdate) this.onLobbyUpdate(this.playersInRoom);
    }
    
    // Always broadcast lobby update when a join request comes in
    // to ensure the joining client gets the full list immediately.
    this.sendToChannel('LOBBY_UPDATE', this.playersInRoom);
    console.log('[Network] Sent LOBBY_UPDATE for room:', this.roomId);
  }

  startGame() {
    if (this.role === 'host') {
      this.sendToChannel('GAME_START', null);
      if (this.onGameStart) this.onGameStart();
    }
  }

  broadcastState(state: GameState) {
    if (this.role !== 'host') return;
    this.sendToChannel('GAME_STATE', state);
  }

  sendInput(input: RemoteInput) {
    if (this.role !== 'client' || !this.playerId) return;
    this.sendToChannel('PLAYER_INPUT', { id: this.playerId, input });
  }

  private sendToChannel(type: string, data: any) {
    if (this.channel) {
      this.channel.postMessage({ type, data, roomId: this.roomId });
    }
  }

  disconnect() {
    if (this.lobbyInterval) clearInterval(this.lobbyInterval);
    if (this.joinInterval) clearInterval(this.joinInterval);
    if (this.role === 'host') {
      this.sendToChannel('ROOM_CLOSED', null);
    }
    this.role = 'offline';
    this.roomId = null;
    this.playersInRoom = [];
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
  }
}

export const networkManager = new NetworkManager();

