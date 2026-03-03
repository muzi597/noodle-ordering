import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { KdsService } from './kds.service';

@Controller('kds/orders')
export class KdsController {
  constructor(private readonly kdsService: KdsService) {}

  @Get()
  findPaid(@Query('shopId') shopId: string) {
    return this.kdsService.findPaid(shopId);
  }

  @Post(':id/done')
  done(@Param('id') id: string) {
    return this.kdsService.done(id);
  }
}
