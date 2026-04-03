import { getDatabase } from '../db/index.js';

export default async function learningRoutes(fastify, options) {
  const db = getDatabase();

  // 提交学习记录
  fastify.post('/records', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const { studentId, topicId, activityType, score, durationSeconds, completed, data } = request.body;

    if (!studentId || !topicId || !activityType) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '缺少必填字段'
        }
      });
    }

    // 验证学生属于当前家长
    const student = db.prepare('SELECT parent_id FROM students WHERE id = ?').get(studentId);
    if (!student || student.parent_id !== request.user.userId) {
      return reply.code(403).send({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '无权限访问'
        }
      });
    }

    try {
      const result = db.prepare(`
        INSERT INTO learning_records (student_id, topic_id, activity_type, score, duration_seconds, completed, data)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(studentId, topicId, activityType, score || null, durationSeconds || null, completed ? 1 : 0, JSON.stringify(data || {}));

      return {
        success: true,
        data: {
          recordId: result.lastInsertRowid,
          studentId,
          topicId,
          score,
          createdAt: new Date().toISOString()
        },
        message: '记录成功'
      };
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '记录失败'
        }
      });
    }
  });

  // 获取学习记录
  fastify.get('/records', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const { studentId, topicId, activityType, startDate, endDate, page = 1, limit = 20 } = request.query;

    if (!studentId) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'studentId是必填参数'
        }
      });
    }

    // 验证权限
    const student = db.prepare('SELECT parent_id FROM students WHERE id = ?').get(studentId);
    if (!student || student.parent_id !== request.user.userId) {
      return reply.code(403).send({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '无权限访问'
        }
      });
    }

    // 构建查询
    let whereClause = 'WHERE lr.student_id = ?';
    const params = [studentId];

    if (topicId) {
      whereClause += ' AND lr.topic_id = ?';
      params.push(topicId);
    }
    if (activityType) {
      whereClause += ' AND lr.activity_type = ?';
      params.push(activityType);
    }
    if (startDate) {
      whereClause += ' AND DATE(lr.created_at) >= ?';
      params.push(startDate);
    }
    if (endDate) {
      whereClause += ' AND DATE(lr.created_at) <= ?';
      params.push(endDate);
    }

    // 获取总数
    const total = db.prepare(`
      SELECT COUNT(*) as count
      FROM learning_records lr
      ${whereClause}
    `).get(...params).count;

    // 获取记录
    const offset = (page - 1) * limit;
    const records = db.prepare(`
      SELECT
        lr.id,
        lr.student_id,
        lr.topic_id,
        t.title as topicTitle,
        lr.activity_type,
        lr.score,
        lr.duration_seconds,
        lr.completed,
        lr.created_at
      FROM learning_records lr
      JOIN topics t ON lr.topic_id = t.id
      ${whereClause}
      ORDER BY lr.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    return {
      success: true,
      data: {
        records,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    };
  });

  // 获取学习统计
  fastify.get('/stats', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const { studentId, period = 'week' } = request.query;

    if (!studentId) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'studentId是必填参数'
        }
      });
    }

    // 验证权限
    const student = db.prepare('SELECT parent_id FROM students WHERE id = ?').get(studentId);
    if (!student || student.parent_id !== request.user.userId) {
      return reply.code(403).send({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '无权限访问'
        }
      });
    }

    // 计算日期范围
    let dateFilter = '';
    switch (period) {
      case 'today':
        dateFilter = "AND DATE(lr.created_at) = DATE('now')";
        break;
      case 'week':
        dateFilter = "AND lr.created_at >= datetime('now', '-7 days')";
        break;
      case 'month':
        dateFilter = "AND lr.created_at >= datetime('now', '-30 days')";
        break;
      case 'all':
      default:
        dateFilter = '';
    }

    // 总体统计
    const summary = db.prepare(`
      SELECT
        COUNT(*) as totalRecords,
        SUM(duration_seconds) as totalDuration,
        AVG(score) as averageScore,
        COUNT(DISTINCT topic_id) as completedTopics
      FROM learning_records lr
      WHERE student_id = ? ${dateFilter}
    `).get(studentId);

    // 每日统计
    const dailyStats = db.prepare(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as records,
        SUM(duration_seconds) as duration,
        AVG(score) as avgScore
      FROM learning_records
      WHERE student_id = ? ${dateFilter}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `).all(studentId);

    // 按类别统计
    const categoryStats = db.prepare(`
      SELECT
        t.category,
        COUNT(*) as count,
        AVG(lr.score) as avgScore
      FROM learning_records lr
      JOIN topics t ON lr.topic_id = t.id
      WHERE lr.student_id = ? ${dateFilter}
      GROUP BY t.category
    `).all(studentId);

    return {
      success: true,
      data: {
        period,
        totalRecords: summary.totalRecords || 0,
        totalDuration: summary.totalDuration || 0,
        averageScore: Math.round(summary.averageScore || 0),
        completedTopics: summary.completedTopics || 0,
        dailyStats,
        categoryStats: categoryStats.reduce((acc, item) => {
          acc[item.category] = {
            count: item.count,
            avgScore: Math.round(item.avgScore)
          };
          return acc;
        }, {})
      }
    };
  });

  // 记录错题
  fastify.post('/mistakes', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const { studentId, topicId, questionId, wrongAnswer, correctAnswer } = request.body;

    if (!studentId || !topicId || !questionId) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '缺少必填字段'
        }
      });
    }

    // 验证权限
    const student = db.prepare('SELECT parent_id FROM students WHERE id = ?').get(studentId);
    if (!student || student.parent_id !== request.user.userId) {
      return reply.code(403).send({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '无权限访问'
        }
      });
    }

    try {
      // 检查是否已存在
      const existing = db.prepare(
        'SELECT id, retry_count FROM mistakes WHERE student_id = ? AND topic_id = ? AND question_id = ?'
      ).get(studentId, topicId, questionId);

      if (existing) {
        // 更新重试次数
        db.prepare(`
          UPDATE mistakes
          SET retry_count = retry_count + 1, last_retry_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(existing.id);

        return {
          success: true,
          data: {
            mistakeId: existing.id,
            studentId,
            topicId,
            questionId,
            retryCount: existing.retry_count + 1,
            mastered: false
          },
          message: '错题已更新'
        };
      } else {
        // 插入新错题
        const result = db.prepare(`
          INSERT INTO mistakes (student_id, topic_id, question_id, wrong_answer, correct_answer)
          VALUES (?, ?, ?, ?, ?)
        `).run(studentId, topicId, questionId, wrongAnswer || null, correctAnswer || null);

        return {
          success: true,
          data: {
            mistakeId: result.lastInsertRowid,
            studentId,
            topicId,
            questionId,
            retryCount: 0,
            mastered: false
          },
          message: '错题已记录'
        };
      }
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '记录失败'
        }
      });
    }
  });

  // 获取错题集
  fastify.get('/mistakes', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const { studentId, topicId, mastered, page = 1, limit = 20 } = request.query;

    if (!studentId) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'studentId是必填参数'
        }
      });
    }

    // 验证权限
    const student = db.prepare('SELECT parent_id FROM students WHERE id = ?').get(studentId);
    if (!student || student.parent_id !== request.user.userId) {
      return reply.code(403).send({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '无权限访问'
        }
      });
    }

    // 构建查询
    let whereClause = 'WHERE m.student_id = ?';
    const params = [studentId];

    if (topicId) {
      whereClause += ' AND m.topic_id = ?';
      params.push(topicId);
    }
    if (mastered !== undefined) {
      whereClause += ' AND m.mastered = ?';
      params.push(mastered === 'true' ? 1 : 0);
    }

    // 获取总数
    const total = db.prepare(`
      SELECT COUNT(*) as count
      FROM mistakes m
      ${whereClause}
    `).get(...params).count;

    // 获取错题
    const offset = (page - 1) * limit;
    const mistakes = db.prepare(`
      SELECT
        m.id,
        m.student_id,
        m.topic_id,
        t.title as topicTitle,
        m.question_id,
        m.wrong_answer,
        m.correct_answer,
        m.retry_count,
        m.mastered,
        m.created_at,
        m.last_retry_at
      FROM mistakes m
      JOIN topics t ON m.topic_id = t.id
      ${whereClause}
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    return {
      success: true,
      data: {
        mistakes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    };
  });

  // 更新错题状态
  fastify.put('/mistakes/:id', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const mistakeId = parseInt(request.params.id);
    const { mastered } = request.body;

    // 验证权限
    const mistake = db.prepare(`
      SELECT m.student_id, s.parent_id
      FROM mistakes m
      JOIN students s ON m.student_id = s.id
      WHERE m.id = ?
    `).get(mistakeId);

    if (!mistake) {
      return reply.code(404).send({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '错题不存在'
        }
      });
    }

    if (mistake.parent_id !== request.user.userId) {
      return reply.code(403).send({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '无权限访问'
        }
      });
    }

    try {
      db.prepare('UPDATE mistakes SET mastered = ? WHERE id = ?').run(mastered ? 1 : 0, mistakeId);

      const updated = db.prepare('SELECT id, mastered, retry_count FROM mistakes WHERE id = ?').get(mistakeId);

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
}
