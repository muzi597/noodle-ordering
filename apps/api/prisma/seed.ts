import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const shop = await prisma.shop.upsert({
    where: { id: 'shop_demo' },
    update: {},
    create: {
      id: 'shop_demo',
      name: 'Demo Noodle Shop',
    },
  });
  console.log('Seeded shop:', shop.name);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
