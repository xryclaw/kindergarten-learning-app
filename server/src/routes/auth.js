import bcrypt from 'bcrypt';
import { getDatabase } from '../db/index.js';

const SALT_ROUNDS = 10;

export default async function authRoutes(fastify, options) {
  const db = getDatabase();

  // 注册已关闭：仅保留内置账户
  fastify.post('/register', async (request, reply) => {
    return reply.code(403).send({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: '注册已关闭，请联系管理员'
      }
    });
  });

  // 家长登录
  fastify.post('/login', async (request, reply) => {
    const { username, password } = request.body;

    if (!username || !password) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '用户名和密码不能为空'
        }
      });
    }

    // 查找用户
    const user = db.prepare('SELECT * FROM parents WHERE username = ?').get(username);
    if (!user) {
      return reply.code(401).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '用户名或密码错误'
        }
      });
    }

    // 验证密码
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return reply.code(401).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '用户名或密码错误'
        }
      });
    }

    // 获取该家长的孩子列表
    const students = db.prepare(
      'SELECT id, name, nickname, avatar FROM students WHERE parent_id = ?'
    ).all(user.id);

    // 生成JWT token
    const token = fastify.jwt.sign({
      userId: user.id,
      username: user.username,
      role: user.role
    });

    // 设置httpOnly cookie
    reply.setCookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return {
      success: true,
      data: {
        userId: user.id,
        username: user.username,
        token,
        students
      },
      message: '登录成功'
    };
  });

  // 登出
  fastify.post('/logout', async (request, reply) => {
    reply.clearCookie('token');
    return {
      success: true,
      message: '登出成功'
    };
  });

  // 获取当前用户信息
  fastify.get('/me', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const user = db.prepare(
      'SELECT id, username, email, phone, created_at FROM parents WHERE id = ?'
    ).get(request.user.userId);

    if (!user) {
      return reply.code(404).send({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '用户不存在'
        }
      });
    }

    return {
      success: true,
      data: {
        userId: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        createdAt: user.created_at
      }
    };
  });
}
