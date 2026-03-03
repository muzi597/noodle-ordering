import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/kds',
})
export class KdsGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('join')
  handleJoin(
    @MessageBody() data: { shopId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`shop:${data.shopId}`);
    client.emit('joined', { shopId: data.shopId });
  }

  notifyNewOrder(shopId: string, order: Record<string, unknown>) {
    this.server.to(`shop:${shopId}`).emit('NEW_ORDER', order);
  }
}
