import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KdsGateway } from '../gateway/kds.gateway';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private kdsGateway: KdsGateway,
  ) {}

  async create(dto: CreateOrderDto) {
    const order = await this.prisma.order.create({
      data: {
        shopId: dto.shopId,
        tableCode: dto.tableCode,
        remark: dto.remark,
        items: {
          create: dto.items.map((item) => ({
            name: item.name,
            qty: item.qty,
            priceCents: item.priceCents,
          })),
        },
      },
      include: { items: true },
    });
    return order;
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    return order;
  }

  async mockPaid(id: string) {
    const order = await this.prisma.order.update({
      where: { id },
      data: { status: 'PAID' },
      include: { items: true },
    });
    this.kdsGateway.notifyNewOrder(order.shopId, order);
    return order;
  }
}
