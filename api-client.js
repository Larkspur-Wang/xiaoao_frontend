class OTISAPIClient {
  constructor(baseURL = null) {
    // 根据环境自动选择API地址
    if (!baseURL) {
      const isProduction = window.location.protocol === 'https:';
      baseURL = isProduction
        ? '/api'  // 生产环境使用代理
        : 'http://47.117.87.105:8080/api/v1';  // 本地开发
    }

    this.baseURL = baseURL;
    this.token = localStorage.getItem('otis_token') || null;
    this.user = JSON.parse(localStorage.getItem('otis_user') || 'null');

    console.log('API客户端初始化，baseURL:', this.baseURL);
  }

  // 设置API基础URL
  setBaseURL(url) {
    this.baseURL = url;
  }

  // 获取认证头
  getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    };
  }

  // 健康检查
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseURL}/health`);
      return await response.json();
    } catch (error) {
      console.error('健康检查失败:', error);
      throw error;
    }
  }

  // 登录 (简化版认证)
  async login(userId) {
    try {
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        this.token = data.data.access_token;
        this.user = data.data.user;
        
        // 保存到本地存储
        localStorage.setItem('otis_token', this.token);
        localStorage.setItem('otis_user', JSON.stringify(this.user));
      }
      
      return data;
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  }

  // 登出
  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('otis_token');
    localStorage.removeItem('otis_user');
  }

  // 创建会话
  async createSession(userId, userRole, sessionConfig = null) {
    try {
      const requestBody = {
        user_id: userId,
        user_role: userRole
      };

      if (sessionConfig) {
        requestBody.session_config = sessionConfig;
      }

      const response = await fetch(`${this.baseURL}/sessions`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(requestBody)
      });
      
      return await response.json();
    } catch (error) {
      console.error('创建会话失败:', error);
      throw error;
    }
  }

  // 获取会话列表
  async getSessions(page = 1, pageSize = 20, userId = null, status = 'active') {
    try {
      let url = `${this.baseURL}/sessions?page=${page}&page_size=${pageSize}`;
      
      if (userId) {
        url += `&user_id=${userId}`;
      }
      
      if (status) {
        url += `&status=${status}`;
      }
      
      const response = await fetch(url, {
        headers: this.getAuthHeaders()
      });
      
      return await response.json();
    } catch (error) {
      console.error('获取会话列表失败:', error);
      throw error;
    }
  }

  // 获取消息历史
  async getMessageHistory(sessionId, limit = 50, role = null) {
    try {
      let url = `${this.baseURL}/sessions/${sessionId}/messages?limit=${limit}`;
      
      if (role) {
        url += `&role=${role}`;
      }
      
      const response = await fetch(url, {
        headers: this.getAuthHeaders()
      });
      
      return await response.json();
    } catch (error) {
      console.error('获取消息历史失败:', error);
      throw error;
    }
  }

  // 发送消息 (流式响应)
  async sendMessageStream(sessionId, message, onChunk) {
    try {
      const response = await fetch(`${this.baseURL}/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ 
          message, 
          stream: true,
          tools_enabled: true
        })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6));
              onChunk(event);
            } catch (e) {
              console.error('解析SSE事件失败:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      throw error;
    }
  }

  // 发送消息 (非流式响应)
  async sendMessage(sessionId, message) {
    try {
      const response = await fetch(`${this.baseURL}/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ 
          message, 
          stream: false,
          tools_enabled: true
        })
      });
      
      return await response.json();
    } catch (error) {
      console.error('发送消息失败:', error);
      throw error;
    }
  }
}
