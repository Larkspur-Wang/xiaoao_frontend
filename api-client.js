class OTISAPIClient {
  constructor(baseURL = null) {
    // 直接使用HTTP后端API，不管前端是什么协议
    if (!baseURL) {
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

      if (isLocalhost) {
        // 本地开发：使用本地CORS代理
        baseURL = 'http://localhost:3001/api/v1';
      } else {
        // 生产环境：直接连接HTTP后端
        baseURL = 'http://47.117.87.105:8080/api/v1';
      }
    }

    this.baseURL = baseURL;
    this.token = localStorage.getItem('otis_token') || null;
    this.user = JSON.parse(localStorage.getItem('otis_user') || 'null');

    console.log('API客户端初始化，baseURL:', this.baseURL);
    console.log('当前域名:', window.location.origin);
    console.log('协议:', window.location.protocol);
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

  // 通用请求方法，直接连接后端API
  async makeRequest(endpoint, options = {}) {
    const url = this.baseURL + endpoint;

    try {
      console.log('直连API请求:', url);
      console.log('请求选项:', options);

      // 合并默认头部和自定义头部
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      };

      console.log('最终请求头:', headers);

      const response = await fetch(url, {
        ...options,
        mode: 'cors', // 明确设置CORS模式
        headers: headers
      });

      console.log('API响应状态:', response.status);
      return response;

    } catch (error) {
      console.error('API请求失败:', error);

      // 如果是Mixed Content或CORS错误，提供用户友好的错误信息
      if (error.message.includes('CORS') ||
          error.message.includes('fetch') ||
          error.message.includes('Mixed Content') ||
          error.message.includes('blocked')) {
        throw new Error('网络连接失败：HTTPS页面无法访问HTTP API，请使用HTTP版本或联系管理员配置HTTPS后端');
      }

      throw error;
    }
  }

  // 健康检查
  async checkHealth() {
    try {
      const response = await this.makeRequest('/health');
      return await response.json();
    } catch (error) {
      console.error('健康检查失败:', error);
      throw error;
    }
  }

  // 登录 (简化版认证)
  async login(userId) {
    try {
      console.log('发送登录请求，用户ID:', userId);

      const requestBody = JSON.stringify({ user_id: userId });
      console.log('请求体内容:', requestBody);

      const response = await this.makeRequest('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: requestBody
      });

      console.log('登录响应状态:', response.status);

      const responseText = await response.text();
      console.log('登录响应内容:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON解析失败:', parseError);
        throw new Error('服务器响应格式错误');
      }

      console.log('解析后的登录数据:', data);

      if (data.success) {
        this.token = data.data.access_token;
        this.user = data.data.user;

        // 保存到本地存储
        localStorage.setItem('otis_token', this.token);
        localStorage.setItem('otis_user', JSON.stringify(this.user));

        console.log('登录成功，token:', this.token);
        console.log('用户信息:', this.user);
      } else {
        console.warn('登录失败，服务器返回:', data);
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
      const response = await this.makeRequest(`/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`
        },
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
