import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KdsGateway } from '../gateway/kds.gateway';
import { CreateCustomerOrderDto } from './dto/create-customer-order.dto';
import { verifyQrSignature } from './qr-hmac';

@Injectable()
export class CustomerService {
  constructor(
    private prisma: PrismaService,
    private kdsGateway: KdsGateway,
  ) {}

  async createOrder(dto: CreateCustomerOrderDto) {
    const secret = process.env.QR_SIGNING_SECRET;
    if (!secret) {
      throw new ForbiddenException('QR_SIGNING_SECRET environment variable is not configured');
    }

    const valid = verifyQrSignature(
      dto.shopId,
      dto.tableCode,
      dto.shopName,
      dto.v,
      dto.sig,
      secret,
    );
    if (!valid) {
      throw new ForbiddenException('Invalid or expired QR code');
    }

    const order = await this.prisma.order.create({
      data: {
        shopId: dto.shopId,
        tableCode: dto.tableCode,
        remark: dto.remark,
        status: 'PAID',
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

    this.kdsGateway.notifyNewOrder(order.shopId, order);
    return order;
  }
}
