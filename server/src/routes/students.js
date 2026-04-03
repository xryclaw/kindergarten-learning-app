import { getDatabase } from '../db/index.js';

export default async function studentsRoutes(fastify, options) {
  const db = getDatabase();

  // 获取孩子列表
  fastify.get('/', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const students = db.prepare(
      'SELECT id, name, nickname, birth_date, avatar, grade, created_at FROM students WHERE parent_id = ?'
    ).all(request.user.userId);

    return {
      success: true,
      data: students
    };
  });

  // 添加孩子
  fastify.post('/', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const { name, nickname, birthDate, avatar, grade } = request.body;

    if (!name) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '姓名不能为空'
        }
      });
    }

    try {
      const result = db.prepare(
        'INSERT INTO students (parent_id, name, nickname, birth_date, avatar, grade) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(request.user.userId, name, nickname || null, birthDate || null, avatar || null, grade || 'kindergarten');

      const student = db.prepare(
        'SELECT id, name, nickname, birth_date, avatar, grade, created_at FROM students WHERE id = ?'
      ).get(result.lastInsertRowid);

      return {
        success: true,
        data: student,
        message: '添加成功'
      };
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '添加失败'
        }
      });
    }
  });

  // 更新孩子信息
  fastify.put('/:id', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const studentId = parseInt(request.params.id);
    const { name, nickname, birthDate, avatar, grade } = request.body;

    // 验证权限：确保该学生属于当前家长
    const student = db.prepare('SELECT parent_id FROM students WHERE id = ?').get(studentId);
    if (!student) {
      return reply.code(404).send({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '学生不存在'
        }
      });
    }

    if (student.parent_id !== request.user.userId) {
      return reply.code(403).send({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '无权限访问'
        }
      });
    }

    // 构建更新语句
    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (nickname !== undefined) {
      updates.push('nickname = ?');
      values.push(nickname);
    }
    if (birthDate !== undefined) {
      updates.push('birth_date = ?');
      values.push(birthDate);
    }
    if (avatar !== undefined) {
      updates.push('avatar = ?');
      values.push(avatar);
    }
    if (grade !== undefined) {
      updates.push('grade = ?');
      values.push(grade);
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

    values.push(studentId);

    try {
      db.prepare(`UPDATE students SET ${updates.join(', ')} WHERE id = ?`).run(...values);

      const updatedStudent = db.prepare(
        'SELECT id, name, nickname, birth_date, avatar, grade FROM students WHERE id = ?'
      ).get(studentId);

      return {
        success: true,
        data: updatedStudent,
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

  // 删除孩子
  fastify.delete('/:id', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const studentId = parseInt(request.params.id);

    // 验证权限
    const student = db.prepare('SELECT parent_id FROM students WHERE id = ?').get(studentId);
    if (!student) {
      return reply.code(404).send({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '学生不存在'
        }
      });
    }

    if (student.parent_id !== request.user.userId) {
      return reply.code(403).send({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '无权限访问'
        }
      });
    }

    try {
      db.prepare('DELETE FROM students WHERE id = ?').run(studentId);
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

  // 获取孩子学习进度
  fastify.get('/:id/progress', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const studentId = parseInt(request.params.id);
    const { startDate, endDate, category } = request.query;

    // 验证权限
    const student = db.prepare('SELECT parent_id, name FROM students WHERE id = ?').get(studentId);
    if (!student) {
      return reply.code(404).send({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '学生不存在'
        }
      });
    }

    if (student.parent_id !== request.user.userId) {
      return reply.code(403).send({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '无权限访问'
        }
      });
    }

    // 构建查询条件
    let whereClause = 'WHERE lr.student_id = ?';
    const params = [studentId];

    if (startDate) {
      whereClause += ' AND DATE(lr.created_at) >= ?';
      params.push(startDate);
    }
    if (endDate) {
      whereClause += ' AND DATE(lr.created_at) <= ?';
      params.push(endDate);
    }
    if (category) {
      whereClause += ' AND t.category = ?';
      params.push(category);
    }

    // 获取总体统计
    const summary = db.prepare(`
      SELECT
        COUNT(*) as totalRecords,
        SUM(lr.duration_seconds) as totalDuration,
        AVG(lr.score) as averageScore,
        COUNT(DISTINCT lr.topic_id) as completedTopics
      FROM learning_records lr
      JOIN topics t ON lr.topic_id = t.id
      ${whereClause}
    `).get(...params);

    // 按类别统计
    const byCategory = db.prepare(`
      SELECT
        t.category,
        COUNT(*) as records,
        AVG(lr.score) as avgScore,
        SUM(lr.duration_seconds) as duration
      FROM learning_records lr
      JOIN topics t ON lr.topic_id = t.id
      ${whereClause}
      GROUP BY t.category
    `).all(...params);

    // 最近活动
    const recentActivities = db.prepare(`
      SELECT
        DATE(lr.created_at) as date,
        t.title as topicTitle,
        lr.score,
        lr.duration_seconds as duration
      FROM learning_records lr
      JOIN topics t ON lr.topic_id = t.id
      ${whereClause}
      ORDER BY lr.created_at DESC
      LIMIT 10
    `).all(...params);

    return {
      success: true,
      data: {
        studentId,
        studentName: student.name,
        period: {
          start: startDate || null,
          end: endDate || null
        },
        summary: {
          totalRecords: summary.totalRecords || 0,
          totalDuration: summary.totalDuration || 0,
          averageScore: Math.round(summary.averageScore || 0),
          completedTopics: summary.completedTopics || 0
        },
        byCategory: byCategory.reduce((acc, item) => {
          acc[item.category] = {
            records: item.records,
            avgScore: Math.round(item.avgScore),
            duration: item.duration
          };
          return acc;
        }, {}),
        recentActivities
      }
    };
  });
}
