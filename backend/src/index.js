import { app } from './app.js';
import { config } from './config.js';
import { prisma } from './lib/prisma.js';

const server = app.listen(config.port, () => {
  console.log(`API running at http://localhost:${config.port}/api`);
});

async function shutdown() {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
