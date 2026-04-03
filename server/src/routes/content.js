import { getDatabase } from '../db/index.js';

export default async function contentRoutes(fastify, options) {
  const db = getDatabase();

  // 获取知识点列表
  fastify.get('/topics', async (request, reply) => {
    const { category, difficulty, isActive, page = 1, limit = 20 } = request.query;

    // 构建查询
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (category) {
      whereClause += ' AND category = ?';
      params.push(category);
    }
    if (difficulty) {
      whereClause += ' AND difficulty = ?';
      params.push(parseInt(difficulty));
    }
    if (isActive !== undefined) {
      whereClause += ' AND is_active = ?';
      params.push(isActive === 'true' ? 1 : 0);
    }

    // 获取总数
    const total = db.prepare(`
      SELECT COUNT(*) as count
      FROM topics
      ${whereClause}
    `).get(...params).count;

    // 获取列表
    const offset = (page - 1) * limit;
    const topics = db.prepare(`
      SELECT
        id,
        category,
        title,
        difficulty,
        order_index,
        is_active,
        created_at,
        updated_at
      FROM topics
      ${whereClause}
      ORDER BY category, order_index, id
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    return {
      success: true,
      data: {
        topics,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    };
  });

  // 获取知识点详情
  fastify.get('/topics/:id', async (request, reply) => {
    const topicId = parseInt(request.params.id);

    const topic = db.prepare(`
      SELECT
        id,
        category,
        title,
        content,
        difficulty,
        order_index,
        is_active,
        created_at,
        updated_at
      FROM topics
      WHERE id = ?
    `).get(topicId);

    if (!topic) {
      return reply.code(404).send({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '知识点不存在'
        }
      });
    }

    // 解析JSON内容
    topic.content = JSON.parse(topic.content);

    return {
      success: true,
      data: topic
    };
  });

  // 创建知识点（管理员）
  fastify.post('/topics', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    // 检查管理员权限
    if (request.user.role !== 'admin') {
      return reply.code(403).send({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '需要管理员权限'
        }
      });
    }

    const { category, title, content, difficulty = 1, orderIndex = 0, isActive = true } = request.body;

    if (!category || !title || !content) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '缺少必填字段'
        }
      });
    }

    // 验证category
    const validCategories = ['character', 'pinyin', 'math', 'story', 'scratch'];
    if (!validCategories.includes(category)) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '无效的类型'
        }
      });
    }

    try {
      const result = db.prepare(`
        INSERT INTO topics (category, title, content, difficulty, order_index, is_active)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(category, title, JSON.stringify(content), difficulty, orderIndex, isActive ? 1 : 0);

      return {
        success: true,
        data: {
          id: result.lastInsertRowid,
          category,
          title,
          createdAt: new Date().toISOString()
        },
        message: '创建成功'
      };
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '创建失败'
        }
      });
    }
  });

  // 更新知识点（管理员）
  fastify.put('/topics/:id', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    // 检查管理员权限
    if (request.user.role !== 'admin') {
      return reply.code(403).send({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '需要管理员权限'
        }
      });
    }

    const topicId = parseInt(request.params.id);
    const { title, content, difficulty, orderIndex, isActive } = request.body;

    // 检查知识点是否存在
    const existing = db.prepare('SELECT id FROM topics WHERE id = ?').get(topicId);
    if (!existing) {
      return reply.code(404).send({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '知识点不存在'
        }
      });
    }

    try {
      // 构建更新语句
      const updates = [];
      const params = [];

      if (title !== undefined) {
        updates.push('title = ?');
        params.push(title);
      }
      if (content !== undefined) {
        updates.push('content = ?');
        params.push(JSON.stringify(content));
      }
      if (difficulty !== undefined) {
        updates.push('difficulty = ?');
        params.push(difficulty);
      }
      if (orderIndex !== undefined) {
        updates.push('order_index = ?');
        params.push(orderIndex);
      }
      if (isActive !== undefined) {
        updates.push('is_active = ?');
        params.push(isActive ? 1 : 0);
      }

      if (updates.length === 0) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '没有要更新的字段'
          }
        });
      }

      params.push(topicId);

      db.prepare(`
        UPDATE topics
        SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(...params);

      const updated = db.prepare(`
        SELECT id, category, title, difficulty, order_index, is_active, updated_at
        FROM topics WHERE id = ?
      `).get(topicId);

      return {
        success: true,
        data: updated,
        message: '更新成功'
      };
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '更新失败'
        }
      });
    }
  });

  // 删除知识点（管理员）
  fastify.delete('/topics/:id', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    // 检查管理员权限
    if (request.user.role !== 'admin') {
      return reply.code(403).send({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '需要管理员权限'
        }
      });
    }

    const topicId = parseInt(request.params.id);

    try {
      const result = db.prepare('DELETE FROM topics WHERE id = ?').run(topicId);

      if (result.changes === 0) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '知识点不存在'
          }
        });
      }

      return {
        success: true,
        message: '删除成功'
      };
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '删除失败'
        }
      });
    }
  });

  // 批量导入知识点（管理员）
  fastify.post('/topics/import', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    // 检查管理员权限
    if (request.user.role !== 'admin') {
      return reply.code(403).send({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '需要管理员权限'
        }
      });
    }

    const { topics } = request.body;

    if (!Array.isArray(topics) || topics.length === 0) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'topics必须是非空数组'
        }
      });
    }

    const validCategories = ['character', 'pinyin', 'math', 'story', 'scratch'];
    let imported = 0;
    const errors = [];

    const insertStmt = db.prepare(`
      INSERT INTO topics (category, title, content, difficulty, order_index, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction((topicsToImport) => {
      for (let i = 0; i < topicsToImport.length; i++) {
        const topic = topicsToImport[i];

        try {
          if (!topic.category || !topic.title || !topic.content) {
            errors.push({ index: i, error: '缺少必填字段' });
            continue;
          }

          if (!validCategories.includes(topic.category)) {
            errors.push({ index: i, error: '无效的类型' });
            continue;
          }

          insertStmt.run(
            topic.category,
            topic.title,
            JSON.stringify(topic.content),
            topic.difficulty || 1,
            topic.orderIndex || 0,
            topic.isActive !== false ? 1 : 0
          );

          imported++;
        } catch (err) {
          errors.push({ index: i, error: err.message });
        }
      }
    });

    try {
      transaction(topics);

      return {
        success: true,
        data: {
          imported,
          failed: errors.length,
          errors
        },
        message: `成功导入${imported}条，失败${errors.length}条`
      };
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '导入失败'
        }
      });
    }
  });
}
