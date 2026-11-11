import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/[\s_-]+/g, '-');

const img = (seed) => `https://picsum.photos/seed/${seed}/800/800`;

const catalog = {
  Electronics: [
    ['Wireless Headphones', 'Over-ear Bluetooth headphones with active noise cancelling and 30-hour battery life.', 89.99, 25, true],
    ['Smart Watch', 'Fitness tracking, heart-rate monitor, notifications and a 7-day battery.', 129.0, 15, true],
    ['Portable Speaker', 'Waterproof Bluetooth speaker with deep bass. Perfect for outdoors.', 49.5, 40, false],
    ['USB-C Charger 65W', 'Fast charger for laptops, tablets and phones with two USB-C ports.', 34.99, 60, false],
    ['Mechanical Keyboard', 'Hot-swappable switches, RGB backlight and an aluminium frame.', 74.0, 4, false],
  ],
  Clothing: [
    ['Classic Cotton T-Shirt', 'Soft 100% cotton crew-neck tee. Pre-shrunk and breathable.', 15.0, 100, false],
    ['Denim Jacket', 'Timeless washed denim jacket with button front and chest pockets.', 59.99, 20, true],
    ['Running Sneakers', 'Lightweight, cushioned running shoes for daily training.', 69.0, 30, true],
    ['Wool Beanie', 'Warm knitted beanie made from soft merino wool.', 12.5, 3, false],
  ],
  Home: [
    ['Ceramic Coffee Mug', 'Handmade 350ml stoneware mug, dishwasher safe.', 9.99, 80, false],
    ['Scented Candle', 'Soy wax candle with notes of vanilla and sandalwood. 40-hour burn.', 18.0, 45, false],
    ['Desk Lamp', 'Adjustable LED desk lamp with 3 colour modes and USB charging port.', 29.99, 22, true],
    ['Throw Blanket', 'Cosy knitted throw blanket, 130 x 170 cm.', 39.0, 18, false],
  ],
  Books: [
    ['The Beginner\'s Cookbook', '100 simple, delicious recipes for everyday cooking.', 22.0, 35, false],
    ['Learn to Code', 'A friendly introduction to programming with JavaScript.', 27.5, 50, true],
    ['Mindful Living', 'Practical habits for a calmer, more focused life.', 16.99, 2, false],
  ],
};

async function main() {
  // Admin user
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: 'ADMIN' },
    create: {
      name: 'Store Admin',
      email: adminEmail,
      password: await bcrypt.hash(adminPassword, 10),
      role: 'ADMIN',
    },
  });

  // Demo customer
  await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      name: 'Demo Customer',
      email: 'customer@example.com',
      password: await bcrypt.hash('customer123', 10),
    },
  });

  // Categories and products
  for (const [categoryName, products] of Object.entries(catalog)) {
    const category = await prisma.category.upsert({
      where: { slug: slugify(categoryName) },
      update: {},
      create: { name: categoryName, slug: slugify(categoryName) },
    });

    for (const [name, description, price, stock, featured] of products) {
      const slug = slugify(name);
      await prisma.product.upsert({
        where: { slug },
        update: {},
        create: {
          name,
          slug,
          description,
          price,
          stock,
          featured,
          imageUrl: img(slug),
          categoryId: category.id,
        },
      });
    }
  }

  console.log('Seed complete.');
  console.log(`  Admin:    ${adminEmail} / ${adminPassword}`);
  console.log('  Customer: customer@example.com / customer123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
