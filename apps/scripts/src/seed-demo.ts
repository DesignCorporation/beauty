import { logger } from '@dc-beauty/utils';
import { prisma } from '@dc-beauty/db';

async function seedDemo() {
  try {
    logger.info('🌱 Seeding demo salon data...');
    
    // TODO: Implement demo data seeding
    const salon = await prisma.salon.upsert({
      where: { slug: 'demo-salon' },
      update: {},
      create: {
        name: 'Demo Beauty Salon',
        slug: 'demo-salon',
        description: 'A beautiful demo salon for development',
      },
    });

    logger.info(`✅ Demo salon created: ${salon.name}`);
  } catch (error) {
    logger.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedDemo();
