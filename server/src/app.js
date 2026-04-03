import Fastify from 'fastify';
import fastifyJWT from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import fastifyRateLimit from '@fastify/rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initDatabase } from './db/index.js';
import { authenticate } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import studentsRoutes from './routes/students.js';
import learningRoutes from './routes/learning.js';
import contentRoutes from './routes/content.js';
import gamificationRoutes from './routes/gamification.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function createApp(options = {}) {
  const fastify = Fastify({
    logger: true,
    ...options
  });

  // 注册插件
  await fastify.register(fastifyCookie);

  await fastify.register(fastifyJWT, {
    secret: process.env.JWT_SECRET || 'kindergarten-learning-app-secret-change-in-production',
    cookie: {
      cookieName: 'token',
      signed: false
    }
  });

  await fastify.register(fastifyCors, {
    origin: process.env.NODE_ENV === 'production' ? false : 'http://localhost:5173',
    credentials: true
  });

  await fastify.register(fastifyRateLimit, {
    max: 100,
    timeWindow: '1 minute'
  });

  // 添加认证装饰器
  fastify.decorate('authenticate', authenticate);

  // 健康检查
  fastify.get('/api/health', async (request, reply) => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      uptime: process.uptime()
    };
  });

  // 注册API路由
  await fastify.register(authRoutes, { prefix: '/api/v1/auth' });
  await fastify.register(studentsRoutes, { prefix: '/api/v1/students' });
  await fastify.register(learningRoutes, { prefix: '/api/v1/learning' });
  await fastify.register(contentRoutes, { prefix: '/api/v1/content' });
  await fastify.register(gamificationRoutes, { prefix: '/api/v1/gamification' });

  // 静态文件服务（生产环境）
  if (process.env.NODE_ENV === 'production') {
    const clientDistPath = join(__dirname, '../../client/dist');

    await fastify.register(fastifyStatic, {
      root: clientDistPath,
      prefix: '/'
    });

    // SPA fallback - 所有非API路由返回index.html
    fastify.setNotFoundHandler((request, reply) => {
      if (request.url.startsWith('/api')) {
        reply.code(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '接口不存在'
          }
        });
      } else {
        reply.sendFile('index.html');
      }
    });
  }

  return fastify;
}
