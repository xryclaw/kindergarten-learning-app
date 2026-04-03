import { createApp } from './src/app.js';
import { initDatabase } from './src/db/index.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const DB_PATH = process.env.DB_PATH || join(__dirname, '../data/app.db');

async function start() {
  try {
    // 初始化数据库
    console.log(`Initializing database at: ${DB_PATH}`);
    initDatabase(DB_PATH);

    // 创建并启动服务器
    const app = await createApp();

    await app.listen({ port: PORT, host: HOST });

    console.log(`Server listening on http://${HOST}:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
