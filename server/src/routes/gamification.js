import { getDatabase } from '../db/index.js';

export default async function gamificationRoutes(fastify, options) {
  const db = getDatabase();

  // 获取学生游戏化数据
  fastify.get('/students/:studentId', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const studentId = parseInt(request.params.studentId);

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

    // 获取游戏化数据
    let gamification = db.prepare('SELECT * FROM student_gamification WHERE student_id = ?').get(studentId);

    // 如果不存在，创建默认记录
    if (!gamification) {
      db.prepare(`
        INSERT INTO student_gamification (student_id, total_points, current_streak, longest_streak, level)
        VALUES (?, 0, 0, 0, 1)
      `).run(studentId);
      gamification = db.prepare('SELECT * FROM student_gamification WHERE student_id = ?').get(studentId);
    }

    // 获取已获得的徽章
    const badges = db.prepare(`
      SELECT b.id, b.code, b.name, b.description, b.icon, sb.earned_at
      FROM student_badges sb
      JOIN badges b ON sb.badge_id = b.id
      WHERE sb.student_id = ?
      ORDER BY sb.earned_at DESC
    `).all(studentId);

    // 获取可获得的徽章
    const availableBadges = db.prepare(`
      SELECT id, code, name, description, icon, requirement_type, requirement_value
      FROM badges
      WHERE id NOT IN (
        SELECT badge_id FROM student_badges WHERE student_id = ?
      )
      ORDER BY requirement_value
    `).all(studentId);

    return {
      success: true,
      data: {
        studentId,
        totalPoints: gamification.total_points,
        currentStreak: gamification.current_streak,
        longestStreak: gamification.longest_streak,
        level: gamification.level,
        lastActivityDate: gamification.last_activity_date,
        badges,
        availableBadges
      }
    };
  });

  // 添加积分（内部调用）
  fastify.post('/students/:studentId/points', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const studentId = parseInt(request.params.studentId);
    const { points, activityDate } = request.body;

    if (!points || points <= 0) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '积分必须大于0'
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
      const today = activityDate || new Date().toISOString().split('T')[0];

      // 获取或创建游戏化记录
      let gamification = db.prepare('SELECT * FROM student_gamification WHERE student_id = ?').get(studentId);

      if (!gamification) {
        db.prepare(`
          INSERT INTO student_gamification (student_id, total_points, current_streak, longest_streak, level, last_activity_date)
          VALUES (?, ?, 1, 1, 1, ?)
        `).run(studentId, points, today);
      } else {
        // 更新积分
        const newPoints = gamification.total_points + points;

        // 计算连续天数
        let currentStreak = gamification.current_streak;
        let longestStreak = gamification.longest_streak;

        if (gamification.last_activity_date) {
          const lastDate = new Date(gamification.last_activity_date);
          const currentDate = new Date(today);
          const diffDays = Math.floor((currentDate - lastDate) / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            // 连续
            currentStreak += 1;
            longestStreak = Math.max(longestStreak, currentStreak);
          } else if (diffDays > 1) {
            // 中断
            currentStreak = 1;
          }
          // diffDays === 0 表示同一天，不更新连续天数
        } else {
          currentStreak = 1;
          longestStreak = 1;
        }

        // 计算等级（每100积分升1级）
        const newLevel = Math.floor(newPoints / 100) + 1;

        db.prepare(`
          UPDATE student_gamification
          SET total_points = ?,
              current_streak = ?,
              longest_streak = ?,
              level = ?,
              last_activity_date = ?
          WHERE student_id = ?
        `).run(newPoints, currentStreak, longestStreak, newLevel, today, studentId);
      }

      // 检查并授予徽章
      const earnedBadges = checkAndAwardBadges(db, studentId);

      // 获取更新后的数据
      gamification = db.prepare('SELECT * FROM student_gamification WHERE student_id = ?').get(studentId);

      return {
        success: true,
        data: {
          totalPoints: gamification.total_points,
          currentStreak: gamification.current_streak,
          longestStreak: gamification.longest_streak,
          level: gamification.level,
          earnedBadges
        },
        message: `获得 ${points} 积分！`
      };
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '添加积分失败'
        }
      });
    }
  });

  // 获取排行榜
  fastify.get('/leaderboard', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const { type = 'points', limit = 10 } = request.query;

    let orderBy = 'total_points DESC';
    if (type === 'streak') {
      orderBy = 'current_streak DESC';
    } else if (type === 'level') {
      orderBy = 'level DESC';
    }

    const leaderboard = db.prepare(`
      SELECT
        s.id,
        s.name,
        s.nickname,
        s.avatar,
        sg.total_points,
        sg.current_streak,
        sg.level
      FROM student_gamification sg
      JOIN students s ON sg.student_id = s.id
      ORDER BY ${orderBy}
      LIMIT ?
    `).all(parseInt(limit));

    return {
      success: true,
      data: {
        type,
        leaderboard
      }
    };
  });
}

// 检查并授予徽章
function checkAndAwardBadges(db, studentId) {
  const earnedBadges = [];

  // 获取游戏化数据
  const gamification = db.prepare('SELECT * FROM student_gamification WHERE student_id = ?').get(studentId);
  if (!gamification) return earnedBadges;

  // 获取学习统计
  const stats = db.prepare(`
    SELECT
      COUNT(DISTINCT topic_id) as completed_topics,
      SUM(CASE WHEN score = 100 THEN 1 ELSE 0 END) as perfect_scores
    FROM learning_records
    WHERE student_id = ? AND completed = 1
  `).get(studentId);

  // 获取未获得的徽章
  const availableBadges = db.prepare(`
    SELECT id, code, requirement_type, requirement_value
    FROM badges
    WHERE id NOT IN (
      SELECT badge_id FROM student_badges WHERE student_id = ?
    )
  `).all(studentId);

  const insertBadge = db.prepare('INSERT INTO student_badges (student_id, badge_id) VALUES (?, ?)');

  for (const badge of availableBadges) {
    let earned = false;

    switch (badge.requirement_type) {
      case 'points':
        earned = gamification.total_points >= badge.requirement_value;
        break;
      case 'streak':
        earned = gamification.current_streak >= badge.requirement_value;
        break;
      case 'topics':
        earned = stats.completed_topics >= badge.requirement_value;
        break;
      case 'perfect_score':
        earned = stats.perfect_scores >= badge.requirement_value;
        break;
    }

    if (earned) {
      try {
        insertBadge.run(studentId, badge.id);
        earnedBadges.push(badge.code);
      } catch (err) {
        // 可能已存在，忽略
      }
    }
  }

  return earnedBadges;
}
