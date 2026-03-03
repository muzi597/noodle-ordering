import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { OrdersModule } from './orders/orders.module';
import { KdsModule } from './kds/kds.module';
import { GatewayModule } from './gateway/gateway.module';

@Module({
  imports: [PrismaModule, GatewayModule, OrdersModule, KdsModule],
})
export class AppModule {}
