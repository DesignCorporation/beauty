import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { IMessageChannel, MessageData, MessageResult } from '../types/messaging';
import { logger } from '@dc-beauty/utils';
import { tenantPrisma } from '../lib/tenantPrisma';

export interface WebChatConfig {
  enabled: boolean;
  allowedOrigins: string[];
  maxConnections?: number;
  roomPrefix?: string;
}

export class WebChatChannel implements IMessageChannel {
  private io: SocketIOServer;
  private config: WebChatConfig;
  private connectedClients: Map<string, { salonId: string; clientId?: string }> = new Map();

  constructor(httpServer: HTTPServer, config: WebChatConfig) {
    this.config = config;
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: config.allowedOrigins,
        credentials: true
      },
      path: '/api/v1/messaging/webchat/socket.io'
    });

    this.setupSocketHandlers();
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket) => {
      logger.info('WebChat client connected', { socketId: socket.id });

      // Authenticate and join salon room
      socket.on('join-salon', async (data: { salonSlug: string; clientInfo?: any }) => {
        try {
          // Get salon by slug
          const tprisma = tenantPrisma('system'); // Use system context for salon lookup
          const salon = await tprisma.salon.findUnique({
            where: { slug: data.salonSlug },
            select: { id: true, displayName: true, primaryLocale: true }
          });

          if (!salon) {
            socket.emit('error', { code: 'SALON_NOT_FOUND', message: 'Salon not found' });
            return;
          }

          // Join salon room
          const roomName = `salon:${salon.id}`;
          await socket.join(roomName);
          
          this.connectedClients.set(socket.id, { 
            salonId: salon.id, 
            clientId: data.clientInfo?.clientId 
          });

          socket.emit('joined-salon', { 
            salonId: salon.id, 
            salonName: salon.displayName,
            locale: salon.primaryLocale 
          });

          logger.info('Client joined salon room', { 
            socketId: socket.id, 
            salonId: salon.id, 
            roomName 
          });

        } catch (error) {
          logger.error('Error joining salon:', error);
          socket.emit('error', { code: 'JOIN_ERROR', message: 'Failed to join salon' });
        }
      });

      // Handle incoming messages
      socket.on('send-message', async (data: { text: string; clientId?: string }) => {
        try {
          const clientInfo = this.connectedClients.get(socket.id);
          if (!clientInfo) {
            socket.emit('error', { code: 'NOT_AUTHENTICATED', message: 'Please join a salon first' });
            return;
          }

          // Create message through messaging hub
          const messageData: MessageData = {
            tenantId: clientInfo.salonId,
            clientId: data.clientId || clientInfo.clientId,
            channel: 'WEB_CHAT',
            direction: 'IN',
            text: data.text,
            meta: {
              socketId: socket.id,
              timestamp: new Date().toISOString()
            }
          };

          // Log incoming message
          const tprisma = tenantPrisma(clientInfo.salonId);
          await tprisma.messageLog.create({
            data: {
              salonId: clientInfo.salonId,
              clientId: data.clientId || clientInfo.clientId,
              channel: 'WEB_CHAT',
              direction: 'IN',
              rawText: data.text,
              status: 'SENT',
              sourceLocale: 'auto-detect'
            }
          });

          // Broadcast to salon staff (admin interface)
          const roomName = `salon:${clientInfo.salonId}`;
          this.io.to(roomName).emit('new-message', messageData);

          logger.info('WebChat message processed', { 
            salonId: clientInfo.salonId, 
            messageLength: data.text.length 
          });

        } catch (error) {
          logger.error('Error processing WebChat message:', error);
          socket.emit('error', { code: 'MESSAGE_ERROR', message: 'Failed to send message' });
        }
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        this.connectedClients.delete(socket.id);
        logger.info('WebChat client disconnected', { socketId: socket.id });
      });
    });
  }

  async send(message: MessageData): Promise<MessageResult> {
    try {
      if (!message.tenantId) {
        throw new Error('TenantId is required for WebChat messages');
      }

      const roomName = `salon:${message.tenantId}`;
      
      // Send to all connected clients in salon room
      this.io.to(roomName).emit('outbound-message', {
        text: message.text,
        direction: 'OUT',
        timestamp: new Date().toISOString(),
        staffId: message.staffId,
        templateCode: message.templateCode
      });

      // Log outbound message
      const tprisma = tenantPrisma(message.tenantId);
      await tprisma.messageLog.create({
        data: {
          salonId: message.tenantId,
          clientId: message.clientId,
          staffId: message.staffId,
          channel: 'WEB_CHAT',
          direction: 'OUT',
          rawText: message.text,
          translatedText: message.translatedText,
          templateCode: message.templateCode,
          status: 'SENT'
        }
      });

      return {
        success: true,
        messageId: `webchat_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        channel: 'WEB_CHAT',
        deliveredAt: new Date(),
        meta: { roomName, connectedClients: this.connectedClients.size }
      };

    } catch (error) {
      logger.error('WebChat send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        channel: 'WEB_CHAT'
      };
    }
  }

  async isConfigured(tenantId: string): Promise<boolean> {
    return this.config.enabled;
  }

  async getConfig(tenantId: string): Promise<WebChatConfig> {
    return this.config;
  }

  // Helper methods
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  getSalonConnections(salonId: string): string[] {
    return Array.from(this.connectedClients.entries())
      .filter(([_, info]) => info.salonId === salonId)
      .map(([socketId]) => socketId);
  }

  async broadcastToSalon(salonId: string, event: string, data: any): Promise<void> {
    const roomName = `salon:${salonId}`;
    this.io.to(roomName).emit(event, data);
  }
}
