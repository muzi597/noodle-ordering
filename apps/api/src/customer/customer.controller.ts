import { Controller, Post, Body } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CreateCustomerOrderDto } from './dto/create-customer-order.dto';

@Controller('customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post('orders')
  createOrder(@Body() dto: CreateCustomerOrderDto) {
    return this.customerService.createOrder(dto);
  }
}
