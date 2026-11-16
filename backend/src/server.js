const app = require('./app');
const env = require('./config/env');
const prisma = require('./config/db');

const server = app.listen(env.PORT, () => console.log(`API running on http://localhost:${env.PORT}  (admin: /admin)`));

const shutdown = () => server.close(async () => { await prisma.$disconnect(); process.exit(0); });
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
