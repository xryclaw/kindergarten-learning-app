import bcrypt from 'bcrypt';
import { getDatabase } from './index.js';

const SALT_ROUNDS = 10;

export function runSeed() {
  const db = getDatabase();

  // 1. Seed parents (admin + demo parent)
  const adminHash = bcrypt.hashSync('admin123', SALT_ROUNDS);
  const parentHash = bcrypt.hashSync('parent123', SALT_ROUNDS);

  const insertParent = db.prepare(`
    INSERT OR IGNORE INTO parents (username, password_hash, email, phone, role)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertParent.run('admin', adminHash, 'admin@example.com', '13800000000', 'admin');
  insertParent.run('parent1', parentHash, 'parent1@example.com', '13800138001', 'parent');

  // 2. Seed demo students (if none exist)
  const parent = db.prepare(`SELECT id FROM parents WHERE username = ?`).get('parent1');
  if (parent) {
    const existingStudents = db.prepare(`SELECT COUNT(*) as count FROM students WHERE parent_id = ?`).get(parent.id);
    if (existingStudents.count === 0) {
      const insertStudent = db.prepare(`
        INSERT INTO students (parent_id, name, nickname, birth_date, avatar, grade)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      insertStudent.run(parent.id, '小明', '明明', '2020-05-15', '/avatars/boy1.png', 'kindergarten');
      insertStudent.run(parent.id, '小红', '红红', '2020-08-20', '/avatars/girl1.png', 'kindergarten');
      console.log('Seeded demo students');
    }
  }

  // 3. Seed topics (if none exist)
  const topicCount = db.prepare(`SELECT COUNT(*) as count FROM topics`).get();
  if (topicCount.count === 0) {
    const insertTopic = db.prepare(`
      INSERT INTO topics (category, title, content, difficulty, order_index, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertTopic.run(
      'character',
      '《江南》识字',
      JSON.stringify({
        type: 'character',
        characters: [
          { id: 1, char: '江', pinyin: 'jiāng', meaning: '大河', strokes: 6, radical: '氵' },
          { id: 2, char: '南', pinyin: 'nán', meaning: '南方', strokes: 9, radical: '十' },
          { id: 3, char: '可', pinyin: 'kě', meaning: '可以', strokes: 5, radical: '口' },
          { id: 4, char: '采', pinyin: 'cǎi', meaning: '采摘', strokes: 8, radical: '爫' },
          { id: 5, char: '莲', pinyin: 'lián', meaning: '莲花', strokes: 10, radical: '艹' },
          { id: 6, char: '戏', pinyin: 'xì', meaning: '玩耍', strokes: 6, radical: '戈' },
          { id: 7, char: '间', pinyin: 'jiān', meaning: '中间', strokes: 7, radical: '门' },
          { id: 8, char: '东', pinyin: 'dōng', meaning: '东方', strokes: 5, radical: '一' },
          { id: 9, char: '北', pinyin: 'běi', meaning: '北方', strokes: 5, radical: '匕' }
        ],
        story: {
          title: '《江南》',
          content: '江南可采莲，莲叶何田田。\n鱼戏莲叶间。\n鱼戏莲叶东，\n鱼戏莲叶西，\n鱼戏莲叶南，\n鱼戏莲叶北。'
        },
        writingChars: ['可', '叶', '东', '西']
      }),
      2, 1, 1
    );

    insertTopic.run(
      'pinyin',
      '整体认读音节',
      JSON.stringify({
        type: 'pinyin',
        wholePinyin: [
          { pinyin: 'ye', example: '叶子', tones: ['yē', 'yé', 'yě', 'yè'] },
          { pinyin: 'yue', example: '月亮', tones: ['yuē', 'yué', 'yuě', 'yuè'] },
          { pinyin: 'yi', example: '一', tones: ['yī', 'yí', 'yǐ', 'yì'] },
          { pinyin: 'wu', example: '五', tones: ['wū', 'wú', 'wǔ', 'wù'] },
          { pinyin: 'yu', example: '鱼', tones: ['yū', 'yú', 'yǔ', 'yù'] }
        ],
        compoundFinals: ['üe', 'ie', 'üan', 'ün', 'ing', 'ong', 'eng', 'ang'],
        gameItems: [
          { id: 1, pinyin: 'kě', char: '可' },
          { id: 2, pinyin: 'yè', char: '叶' },
          { id: 3, pinyin: 'dōng', char: '东' },
          { id: 4, pinyin: 'xī', char: '西' },
          { id: 5, pinyin: 'jiāng', char: '江' },
          { id: 6, pinyin: 'nán', char: '南' }
        ]
      }),
      1, 1, 1
    );

    insertTopic.run(
      'math',
      '20以内应用题',
      JSON.stringify({
        type: 'math',
        problems: [
          { id: 1, text: '小明有8个苹果，吃了3个，还剩几个？', answer: 5, type: '减法', keywords: ['吃了', '还剩'] },
          { id: 2, text: '树上有5只鸟，又飞来7只，一共有几只？', answer: 12, type: '加法', keywords: ['又飞来', '一共'] },
          { id: 3, text: '妈妈买了15个橘子，给了弟弟6个，妈妈还有几个？', answer: 9, type: '减法', keywords: ['给了', '还有'] },
          { id: 4, text: '小红有9支铅笔，小明有6支，小红比小明多几支？', answer: 3, type: '求相差', keywords: ['比', '多几'] },
          { id: 5, text: '停车场有12辆车，开走了4辆，还有几辆？', answer: 8, type: '减法', keywords: ['开走', '还有'] },
          { id: 6, text: '花园里有7朵红花，8朵黄花，一共有几朵花？', answer: 15, type: '加法', keywords: ['一共'] },
          { id: 7, text: '小明今年6岁，爸爸今年32岁，爸爸比小明大几岁？', answer: 26, type: '求相差', keywords: ['比', '大几'] }
        ]
      }),
      1, 1, 1
    );

    insertTopic.run(
      'story',
      '小兔子找萝卜',
      JSON.stringify({
        type: 'story',
        content: [
          '小兔子饿了，想找萝卜吃。',
          '它来到菜园，看到了很多萝卜。',
          '小兔子高兴地拔了一个大萝卜，开心地吃了起来。'
        ],
        questions: [
          { question: '小兔子想找什么？', options: ['萝卜', '白菜', '苹果'], answer: '萝卜' },
          { question: '小兔子在哪里找到萝卜？', options: ['森林', '菜园', '河边'], answer: '菜园' }
        ]
      }),
      1, 1, 1
    );

    insertTopic.run(
      'scratch',
      '认识Scratch',
      JSON.stringify({
        type: 'scratch',
        icon: '🐱',
        description: '了解Scratch界面和基本概念',
        steps: [
          {
            title: '什么是Scratch',
            description: 'Scratch是用积木块编程，就像搭积木一样简单！',
            blocks: [
              { type: 'motion', text: '移动 10 步' },
              { type: 'motion', text: '右转 15 度' }
            ]
          },
          {
            title: '角色和舞台',
            description: '角色是会动的小精灵，舞台是它们表演的地方。',
            blocks: [
              { type: 'looks', text: '说 你好！持续 2 秒' },
              { type: 'looks', text: '将颜色特效增加 25' }
            ]
          }
        ]
      }),
      1, 1, 1
    );

    console.log('Seeded demo topics');
  }

  console.log('Database seed completed');
}
