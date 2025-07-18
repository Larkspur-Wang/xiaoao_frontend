/**
 * 聊天历史管理模块
 * 提供智能标题生成、历史搜索、分类等功能
 */

class ChatHistoryManager {
  constructor() {
    this.dbName = 'OTISChatHistory';
    this.dbVersion = 1;
    this.db = null;
    this.init();
  }

  // 初始化IndexedDB
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // 创建会话存储
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
          sessionStore.createIndex('userId', 'userId', { unique: false });
          sessionStore.createIndex('createdAt', 'createdAt', { unique: false });
          sessionStore.createIndex('title', 'title', { unique: false });
        }
        
        // 创建消息存储
        if (!db.objectStoreNames.contains('messages')) {
          const messageStore = db.createObjectStore('messages', { keyPath: 'id' });
          messageStore.createIndex('sessionId', 'sessionId', { unique: false });
          messageStore.createIndex('timestamp', 'timestamp', { unique: false });
          messageStore.createIndex('role', 'role', { unique: false });
        }
      };
    });
  }

  // 智能标题生成
  generateSmartTitle(messages) {
    if (!messages || messages.length === 0) {
      return '新对话';
    }

    // 获取用户的第一条消息
    const firstUserMessage = messages.find(msg => msg.role === 'user');
    if (!firstUserMessage) {
      return '新对话';
    }

    const content = firstUserMessage.content.trim();
    
    // 关键词提取和标题生成规则
    const titleRules = [
      // 问候语
      { pattern: /^(你好|您好|hi|hello)/i, title: '问候对话' },
      
      // 电梯相关
      { pattern: /(电梯|升降机|扶梯|自动扶梯)/i, title: '电梯咨询' },
      { pattern: /(故障|维修|保养|检修)/i, title: '维修服务' },
      { pattern: /(安装|施工|工程)/i, title: '安装工程' },
      { pattern: /(价格|报价|费用|成本)/i, title: '价格咨询' },
      { pattern: /(技术|参数|规格|配置)/i, title: '技术咨询' },
      
      // 服务相关
      { pattern: /(预约|约定|安排)/i, title: '预约服务' },
      { pattern: /(投诉|问题|建议)/i, title: '客户反馈' },
      { pattern: /(培训|学习|教程)/i, title: '培训咨询' },
      
      // 通用问题
      { pattern: /(怎么|如何|怎样)/i, title: '操作咨询' },
      { pattern: /(什么|啥|哪个)/i, title: '信息查询' },
      { pattern: /(为什么|为啥|原因)/i, title: '原因分析' }
    ];

    // 应用规则生成标题
    for (const rule of titleRules) {
      if (rule.pattern.test(content)) {
        return rule.title;
      }
    }

    // 如果没有匹配的规则，使用前20个字符作为标题
    const title = content.length > 20 ? content.substring(0, 20) + '...' : content;
    return title;
  }

  // 保存会话
  async saveSession(sessionData) {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction(['sessions'], 'readwrite');
    const store = transaction.objectStore('sessions');
    
    const session = {
      id: sessionData.session_id,
      userId: sessionData.user_id,
      title: sessionData.title || this.generateSmartTitle(sessionData.messages || []),
      createdAt: new Date(sessionData.created_at || Date.now()),
      updatedAt: new Date(),
      messageCount: sessionData.messages ? sessionData.messages.length : 0,
      lastMessage: sessionData.messages && sessionData.messages.length > 0 
        ? sessionData.messages[sessionData.messages.length - 1].content.substring(0, 100)
        : '',
      metadata: {
        tools_enabled: sessionData.tools_enabled,
        max_history: sessionData.max_history
      }
    };
    
    return new Promise((resolve, reject) => {
      const request = store.put(session);
      request.onsuccess = () => resolve(session);
      request.onerror = () => reject(request.error);
    });
  }

  // 保存消息
  async saveMessage(sessionId, messageData) {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction(['messages'], 'readwrite');
    const store = transaction.objectStore('messages');
    
    const message = {
      id: `${sessionId}_${Date.now()}_${Math.random()}`,
      sessionId: sessionId,
      role: messageData.role,
      content: messageData.content,
      timestamp: new Date(messageData.timestamp || Date.now()),
      metadata: messageData.metadata || {}
    };
    
    return new Promise((resolve, reject) => {
      const request = store.add(message);
      request.onsuccess = () => resolve(message);
      request.onerror = () => reject(request.error);
    });
  }

  // 获取会话列表
  async getSessions(userId, limit = 50) {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction(['sessions'], 'readonly');
    const store = transaction.objectStore('sessions');
    const index = store.index('userId');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(userId);
      request.onsuccess = () => {
        const sessions = request.result
          .sort((a, b) => b.updatedAt - a.updatedAt)
          .slice(0, limit);
        resolve(sessions);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // 搜索会话
  async searchSessions(userId, query) {
    const sessions = await this.getSessions(userId);
    const lowercaseQuery = query.toLowerCase();
    
    return sessions.filter(session => 
      session.title.toLowerCase().includes(lowercaseQuery) ||
      session.lastMessage.toLowerCase().includes(lowercaseQuery)
    );
  }

  // 删除会话
  async deleteSession(sessionId) {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction(['sessions', 'messages'], 'readwrite');
    const sessionStore = transaction.objectStore('sessions');
    const messageStore = transaction.objectStore('messages');
    
    // 删除会话
    await new Promise((resolve, reject) => {
      const request = sessionStore.delete(sessionId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    // 删除相关消息
    const messageIndex = messageStore.index('sessionId');
    return new Promise((resolve, reject) => {
      const request = messageIndex.openCursor(sessionId);
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // 更新会话标题
  async updateSessionTitle(sessionId, newTitle) {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction(['sessions'], 'readwrite');
    const store = transaction.objectStore('sessions');
    
    return new Promise((resolve, reject) => {
      const getRequest = store.get(sessionId);
      getRequest.onsuccess = () => {
        const session = getRequest.result;
        if (session) {
          session.title = newTitle;
          session.updatedAt = new Date();
          
          const putRequest = store.put(session);
          putRequest.onsuccess = () => resolve(session);
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error('Session not found'));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // 获取会话统计
  async getSessionStats(sessionId) {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction(['messages'], 'readonly');
    const store = transaction.objectStore('messages');
    const index = store.index('sessionId');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(sessionId);
      request.onsuccess = () => {
        const messages = request.result;
        const userMessages = messages.filter(msg => msg.role === 'user');
        const assistantMessages = messages.filter(msg => msg.role === 'assistant');
        
        const stats = {
          totalMessages: messages.length,
          userMessages: userMessages.length,
          assistantMessages: assistantMessages.length,
          firstMessage: messages.length > 0 ? messages[0].timestamp : null,
          lastMessage: messages.length > 0 ? messages[messages.length - 1].timestamp : null,
          avgMessageLength: messages.length > 0 
            ? Math.round(messages.reduce((sum, msg) => sum + msg.content.length, 0) / messages.length)
            : 0
        };
        
        resolve(stats);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // 导出会话数据
  async exportSession(sessionId) {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction(['sessions', 'messages'], 'readonly');
    const sessionStore = transaction.objectStore('sessions');
    const messageStore = transaction.objectStore('messages');
    
    // 获取会话信息
    const session = await new Promise((resolve, reject) => {
      const request = sessionStore.get(sessionId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    // 获取消息列表
    const messages = await new Promise((resolve, reject) => {
      const index = messageStore.index('sessionId');
      const request = index.getAll(sessionId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    return {
      session,
      messages: messages.sort((a, b) => a.timestamp - b.timestamp)
    };
  }
}

// 全局实例
window.chatHistoryManager = new ChatHistoryManager();
