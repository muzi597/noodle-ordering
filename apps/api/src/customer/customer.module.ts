import { Module } from '@nestjs/common';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [GatewayModule],
  controllers: [CustomerController],
  providers: [CustomerService],
})
export class CustomerModule {}
