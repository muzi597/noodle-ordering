import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KdsService {
  constructor(private prisma: PrismaService) {}

  async findPaid(shopId: string) {
    return this.prisma.order.findMany({
      where: {
        status: 'PAID',
        ...(shopId ? { shopId } : {}),
      },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async done(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    return this.prisma.order.update({
      where: { id },
      data: { status: 'DONE' },
      include: { items: true },
    });
  }
}
