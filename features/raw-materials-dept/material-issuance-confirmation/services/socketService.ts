import { io, Socket } from 'socket.io-client';
import Constants from 'expo-constants';

class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = Constants.expoConfig?.extra?.apiUrl || '';
  }

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  connect(): Socket {
    if (!this.socket) {
      const url = this.baseUrl.replace(/\/$/, '');
      this.socket = io(url, {
        transports: ['websocket'],
        autoConnect: true,
      });

      this.socket.on('connect', () => {
        console.log('🔌 Socket connected:', this.socket?.id);
      });

      this.socket.on('disconnect', () => {
        console.log('🔌 Socket disconnected');
      });

      this.socket.on('connect_error', (error) => {
        console.log('🔌 Socket connection error:', error.message);
      });
    }
    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  onMaterialIssuanceUpdate(callback: (data: any) => void): void {
    if (!this.socket) {
      this.connect();
    }
    this.socket?.on('material-issuance:update', callback);
  }

  offMaterialIssuanceUpdate(callback?: (data: any) => void): void {
    if (callback) {
      this.socket?.off('material-issuance:update', callback);
    } else {
      this.socket?.off('material-issuance:update');
    }
  }
}

export const socketService = SocketService.getInstance();
