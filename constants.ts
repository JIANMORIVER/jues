import { AppData } from './types';

export const INITIAL_DATA: AppData = {
  score: 0,
  daily: [
    { 
      id: 1, 
      title: "晨间咖啡", 
      desc: "去六分街喝一杯美式。", 
      reward: 50, 
      completed: false, 
      block: "morning", 
      subtasks: [{ text: "不加糖", done: false }] 
    },
    { 
      id: 2, 
      title: "代码提交", 
      desc: "修复昨晚突袭留下的Bug。", 
      reward: 100, 
      completed: false, 
      block: "morning", 
      subtasks: [] 
    },
    { 
      id: 3, 
      title: "健身环大冒险", 
      desc: "有氧运动30分钟。", 
      reward: 150, 
      completed: false, 
      block: "evening", 
      subtasks: [] 
    }
  ],
  target: [
    { 
      id: 101, 
      title: "阅读《设计心理学》", 
      desc: "本周读完前三章。", 
      reward: 300, 
      completed: false, 
      subtasks: [{ text: "第一章", done: true }, { text: "第二章", done: false }] 
    }
  ],
  training: [
    { 
      id: 201, 
      title: "喝水 (5杯)", 
      desc: "保持水分充足。", 
      reward: 50, 
      subtasks: [{ text: "第1杯", done: false }, { text: "第2杯", done: false }] 
    },
    { 
      id: 202, 
      title: "深蹲 x 50", 
      desc: "腿部力量基础。", 
      reward: 100, 
      subtasks: [] 
    }
  ],
  challenge: [
    { 
      id: 301, 
      title: "和妮可逛街", 
      desc: "光映广场见面。", 
      time: "2025-11-23T14:00", 
      reward: 200, 
      completed: false, 
      importance: true,
      urgency: false,
      subtasks: [] 
    },
    { 
      id: 302, 
      title: "零号空洞探险", 
      desc: "周五晚上的探险活动。", 
      time: "2025-11-21T20:00", 
      reward: 500, 
      completed: false, 
      importance: true,
      urgency: true,
      subtasks: [] 
    }
  ]
};