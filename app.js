// 在你的主要 JavaScript 文件中注册 Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker 注册成功:', registration.scope);
      })
      .catch(error => {
        console.log('Service Worker 注册失败:', error);
      });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // 初始化API客户端
  const apiClient = new OTISAPIClient();
  
  // 配置API地址 - 根据环境选择
  const isProduction = window.location.protocol === 'https:';
  const apiBaseURL = isProduction
    ? '/api'  // 生产环境使用Cloudflare Functions代理
    : 'http://47.117.87.105:8080/api/v1';   // 本地开发直接访问

  apiClient.setBaseURL(apiBaseURL);
  
  // 当前会话ID
  let currentSessionId = null;
  let isMobile = window.innerWidth <= 768;
  
  // DOM元素
  const loginPage = document.getElementById('login-page');
  const mainPage = document.getElementById('main-page');
  const loginBtn = document.getElementById('login-btn');
  const userIdSelect = document.getElementById('user-id');
  const loginStatus = document.getElementById('login-status');
  const userName = document.getElementById('user-name');
  const userAvatar = document.getElementById('user-avatar');
  const logoutBtn = document.getElementById('logout-btn');
  const newSessionBtn = document.getElementById('new-session-btn');
  const sessionsList = document.getElementById('sessions-list');
  const noSessionMessage = document.getElementById('no-session-message');
  const chatContainer = document.getElementById('chat-container');
  const chatPanel = document.getElementById('chat-panel');
  const sessionsPanel = document.getElementById('sessions-panel');
  const currentSessionTitle = document.getElementById('current-session-title');
  const messagesContainer = document.getElementById('messages-container');
  const messageInput = document.getElementById('message-input');
  const sendMessageBtn = document.getElementById('send-message-btn');
  const backBtn = document.getElementById('back-btn');
  
  // 移动端导航元素
  const navSessions = document.getElementById('nav-sessions');
  const navNewSession = document.getElementById('nav-new-session');
  const navProfile = document.getElementById('nav-profile');

  // 搜索相关元素
  const sessionSearch = document.getElementById('session-search');
  const clearSearchBtn = document.getElementById('clear-search');
  
  // 检查设备类型
  function checkDeviceType() {
    isMobile = window.innerWidth <= 768;
    if (isMobile) {
      document.body.classList.add('mobile');
    } else {
      document.body.classList.remove('mobile');
    }
  }
  
  // 检查是否已登录
  function checkAuth() {
    if (apiClient.token && apiClient.user) {
      showMainPage();
      loadSessions();
    } else {
      showLoginPage();
    }
  }
  
  // 显示登录页面
  function showLoginPage() {
    loginPage.classList.add('active');
    mainPage.classList.remove('active');
  }
  
  // 显示主页面
  function showMainPage() {
    loginPage.classList.remove('active');
    mainPage.classList.add('active');
    
    // 显示用户信息
    if (apiClient.user) {
      userName.textContent = apiClient.user.name;
      userAvatar.textContent = apiClient.user.name.charAt(0).toUpperCase();
    }
  }
  
  // 登录处理
  async function handleLogin() {
    const userId = userIdSelect.value;
    
    if (!userId) {
      showLoginError('请选择用户身份');
      return;
    }
    
    try {
      loginBtn.disabled = true;
      loginStatus.textContent = '登录中...';
      loginStatus.className = 'status-message';
      loginStatus.classList.remove('hidden');
      
      const result = await apiClient.login(userId);
      
      if (result.success) {
        showLoginSuccess('登录成功');
        setTimeout(() => {
          showMainPage();
          loadSessions();
        }, 1000);
      } else {
        showLoginError(result.message || '登录失败');
      }
    } catch (error) {
      showLoginError('登录请求失败，请检查网络连接');
    } finally {
      loginBtn.disabled = false;
    }
  }
  
  // 显示登录错误
  function showLoginError(message) {
    loginStatus.textContent = message;
    loginStatus.className = 'status-message error';
    loginStatus.classList.remove('hidden');
  }
  
  // 显示登录成功
  function showLoginSuccess(message) {
    loginStatus.textContent = message;
    loginStatus.className = 'status-message success';
    loginStatus.classList.remove('hidden');
  }
  
  // 登出处理
  function handleLogout() {
    apiClient.logout();
    showLoginPage();
    currentSessionId = null;
    hideChatPanel();
  }
  
  // 显示聊天面板（移动端）
  function showChatPanel() {
    if (isMobile) {
      chatPanel.classList.add('active');
      backBtn.classList.remove('hidden');
    }
  }
  
  // 隐藏聊天面板（移动端）
  function hideChatPanel() {
    if (isMobile) {
      chatPanel.classList.remove('active');
      backBtn.classList.add('hidden');
    }
  }
  
  // 加载会话列表
  async function loadSessions() {
    try {
      sessionsList.innerHTML = `
        <div class="loading">
          <div class="loading-spinner"></div>
          加载中...
        </div>
      `;
      
      const result = await apiClient.getSessions(1, 20, apiClient.user.user_id);
      
      if (result.success) {
        renderSessionsList(result.data.sessions);
      } else {
        sessionsList.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon material-icons">error_outline</div>
            <div class="empty-state-title">加载失败</div>
            <div class="empty-state-subtitle">${result.message || '请重试'}</div>
          </div>
        `;
      }
    } catch (error) {
      sessionsList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon material-icons">network_check</div>
          <div class="empty-state-title">网络错误</div>
          <div class="empty-state-subtitle">请检查网络连接后重试</div>
        </div>
      `;
    }
  }
  
  // 获取会话摘要
  function getSessionSummary(messages) {
    if (!messages || messages.length === 0) return '开始新的对话';
    
    // 获取最后一条用户消息或助手消息
    const lastMessage = messages[messages.length - 1];
    const content = lastMessage.content || '';
    
    // 如果是用户消息，获取前一条助手消息
    if (lastMessage.role === 'user' && messages.length > 1) {
      const assistantMessage = messages[messages.length - 2];
      if (assistantMessage && assistantMessage.role === 'assistant') {
        return truncateText(assistantMessage.content, 30);
      }
    }
    
    return truncateText(content, 30);
  }
  
  // 截断文本
  function truncateText(text, maxLength) {
    if (!text) return '开始新的对话';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }
  
  // 格式化相对时间
  function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // 渲染会话列表
  function renderSessionsList(sessions) {
    if (!sessions || sessions.length === 0) {
      sessionsList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon material-icons">chat</div>
          <div class="empty-state-title">暂无会话</div>
          <div class="empty-state-subtitle">点击右上角按钮创建新会话</div>
        </div>
      `;
      return;
    }
    
    sessionsList.innerHTML = '';
    
    // 按创建时间倒序排序
    const sortedSessions = [...sessions].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    sortedSessions.forEach(session => {
      const sessionItem = document.createElement('div');
      sessionItem.className = 'session-item';
      sessionItem.dataset.id = session.session_id;
      
      if (session.session_id === currentSessionId) {
        sessionItem.classList.add('active');
      }
      
      // 生成智能标题 - 如果没有messages，使用其他信息
      let smartTitle = '新对话';
      let summary = '开始新的对话';

      if (session.messages && session.messages.length > 0) {
        smartTitle = chatHistoryManager.generateSmartTitle(session.messages);
        summary = getSessionSummary(session.messages);
      } else if (session.last_message) {
        // 如果有最后一条消息，基于它生成标题
        const mockMessages = [{ role: 'user', content: session.last_message }];
        smartTitle = chatHistoryManager.generateSmartTitle(mockMessages);
        summary = session.last_message.length > 50 ? session.last_message.substring(0, 50) + '...' : session.last_message;
      } else {
        // 使用会话ID的一部分作为标题
        smartTitle = `会话 ${session.session_id.substring(0, 8)}`;
      }

      const relativeTime = formatRelativeTime(session.created_at);

      sessionItem.innerHTML = `
        <div class="session-avatar">
          <span class="material-icons">smart_toy</span>
        </div>
        <div class="session-content">
          <div class="session-title" title="${smartTitle}">${smartTitle}</div>
          <div class="session-preview">${summary}</div>
          <div class="session-meta">
            <span class="session-time">${relativeTime}</span>
            ${session.message_count > 0 ? `<span class="session-badge">${session.message_count}</span>` : ''}
          </div>
        </div>
        <div class="session-actions">
          <button class="session-action-btn" data-action="edit" title="编辑标题">
            <span class="material-icons">edit</span>
          </button>
          <button class="session-action-btn" data-action="delete" title="删除会话">
            <span class="material-icons">delete</span>
          </button>
        </div>
      `;
      
      // 会话点击事件
      sessionItem.addEventListener('click', (e) => {
        // 如果点击的是操作按钮，不触发会话选择
        if (e.target.closest('.session-action-btn')) {
          return;
        }
        selectSession(session.session_id);
      });

      // 操作按钮事件
      const actionBtns = sessionItem.querySelectorAll('.session-action-btn');
      actionBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = btn.dataset.action;
          const sessionId = session.session_id;

          if (action === 'edit') {
            editSessionTitle(sessionId, smartTitle);
          } else if (action === 'delete') {
            deleteSession(sessionId);
          }
        });
      });

      sessionsList.appendChild(sessionItem);
    });
  }

  // 编辑会话标题
  async function editSessionTitle(sessionId, currentTitle) {
    const newTitle = prompt('请输入新的会话标题:', currentTitle);
    if (newTitle && newTitle !== currentTitle) {
      try {
        await chatHistoryManager.updateSessionTitle(sessionId, newTitle);
        loadSessions(); // 重新加载会话列表
      } catch (error) {
        alert('更新标题失败，请重试');
      }
    }
  }

  // 删除会话
  async function deleteSession(sessionId) {
    if (confirm('确定要删除这个会话吗？此操作不可撤销。')) {
      try {
        await chatHistoryManager.deleteSession(sessionId);

        // 如果删除的是当前会话，清空聊天界面
        if (sessionId === currentSessionId) {
          currentSessionId = null;
          chatContainer.classList.add('hidden');
          noSessionMessage.classList.remove('hidden');
        }

        loadSessions(); // 重新加载会话列表
      } catch (error) {
        alert('删除会话失败，请重试');
      }
    }
  }
  
  // 创建新会话
  async function createNewSession() {
    try {
      const result = await apiClient.createSession(
        apiClient.user.user_id,
        apiClient.user.role,
        {
          max_history: 50,
          timeout_minutes: 30,
          tools_enabled: true,
          stream_response: true
        }
      );
      
      if (result.success) {
        loadSessions();
        selectSession(result.data.session_id);
      } else {
        alert('创建会话失败: ' + (result.message || '未知错误'));
      }
    } catch (error) {
      alert('创建会话失败，请检查网络连接');
    }
  }
  
  // 选择会话
  async function selectSession(sessionId) {
    // 更新UI
    const sessionItems = document.querySelectorAll('.session-item');
    sessionItems.forEach(item => {
      if (item.dataset.id === sessionId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
    
    currentSessionId = sessionId;
    currentSessionTitle.textContent = `会话 ${sessionId.slice(-6)}`;
    
    // 显示聊天界面
    noSessionMessage.classList.add('hidden');
    chatContainer.classList.remove('hidden');
    
    if (isMobile) {
      showChatPanel();
    }
    
    // 加载消息历史
    await loadMessageHistory(sessionId);
  }
  
  // 加载消息历史
  async function loadMessageHistory(sessionId) {
    try {
      messagesContainer.innerHTML = `
        <div class="loading">
          <div class="loading-spinner"></div>
          加载消息历史中...
        </div>
      `;
      
      const result = await apiClient.getMessageHistory(sessionId);
      
      if (result.success) {
        renderMessages(result.data.messages);
      } else {
        messagesContainer.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon material-icons">error_outline</div>
            <div class="empty-state-title">加载失败</div>
            <div class="empty-state-subtitle">${result.message || '请重试'}</div>
          </div>
        `;
      }
    } catch (error) {
      messagesContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon material-icons">network_check</div>
          <div class="empty-state-title">网络错误</div>
          <div class="empty-state-subtitle">请检查网络连接后重试</div>
        </div>
      `;
    }
  }
  
  // 渲染消息
  function renderMessages(messages) {
    messagesContainer.innerHTML = '';
    
    if (!messages || messages.length === 0) {
      const welcomeMessage = createMessageElement('assistant', '您好！我是OTIS电梯助手小奥，有什么可以帮助您的吗？');
      messagesContainer.appendChild(welcomeMessage);
      return;
    }
    
    messages.forEach(message => {
      const messageElement = createMessageElement(message.role, message.content, message);
      messagesContainer.appendChild(messageElement);
    });
    
    // 滚动到底部
    scrollToBottom();
  }
  
  // 创建消息元素
  function createMessageElement(role, content, messageData = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;

    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';

    // 使用更现代的头像显示
    if (role === 'user') {
      avatarDiv.textContent = apiClient.user ? apiClient.user.name.charAt(0).toUpperCase() : 'U';
    } else {
      avatarDiv.textContent = '小奥';
    }

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';
    textDiv.textContent = content;

    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = new Date().toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });

    contentDiv.appendChild(textDiv);
    contentDiv.appendChild(timeDiv);

    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(contentDiv);

    // 如果有工具调用
    if (messageData && messageData.tool_calls && messageData.tool_calls.length > 0) {
      messageData.tool_calls.forEach(toolCall => {
        const toolDiv = createToolCallElement(toolCall);
        contentDiv.appendChild(toolDiv);
      });
    }

    return messageDiv;
  }

  // 创建打字指示器
  function createTypingIndicator() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant';

    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    avatarDiv.textContent = '小奥';

    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';

    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('div');
      dot.className = 'typing-dot';
      typingDiv.appendChild(dot);
    }

    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(typingDiv);

    return messageDiv;
  }
  
  // 创建工具调用元素
  function createToolCallElement(toolCall) {
    const toolDiv = document.createElement('div');
    toolDiv.className = 'tool-call';
    
    const headerDiv = document.createElement('div');
    headerDiv.className = 'tool-call-header';
    headerDiv.textContent = `🔧 ${toolCall.tool_name}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'tool-call-content';
    contentDiv.innerHTML = `
      <strong>参数:</strong> ${JSON.stringify(toolCall.parameters, null, 2)}
      <br>
      <strong>结果:</strong> ${JSON.stringify(toolCall.result, null, 2)}
    `;
    
    toolDiv.appendChild(headerDiv);
    toolDiv.appendChild(contentDiv);
    
    return toolDiv;
  }
  
  // 滚动到底部
  function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
  
  // 发送消息
  async function sendMessage() {
    const message = messageInput.value.trim();

    if (!message || !currentSessionId) {
      return;
    }

    // 添加用户消息到界面
    const userMessage = createMessageElement('user', message);
    messagesContainer.appendChild(userMessage);

    // 清空输入框并调整高度
    messageInput.value = '';
    messageInput.style.height = 'auto';

    // 滚动到底部
    scrollToBottom();

    // 显示打字动画
    const typingIndicator = createTypingIndicator();
    messagesContainer.appendChild(typingIndicator);
    scrollToBottom();

    try {
      // 禁用发送按钮
      sendMessageBtn.disabled = true;

      // 短暂延迟以显示打字动画
      await new Promise(resolve => setTimeout(resolve, 500));

      // 移除打字动画，创建助手消息元素
      messagesContainer.removeChild(typingIndicator);
      const assistantMessage = createMessageElement('assistant', '');
      messagesContainer.appendChild(assistantMessage);

      const assistantText = assistantMessage.querySelector('.message-text');

      // 使用流式响应
      await apiClient.sendMessageStream(currentSessionId, message, event => {
        handleStreamEvent(event, assistantText, assistantMessage);
      });
    } catch (error) {
      // 移除打字动画（如果还存在）
      if (typingIndicator.parentNode) {
        messagesContainer.removeChild(typingIndicator);
      }

      // 创建错误消息
      const errorMessage = createMessageElement('assistant', '消息发送失败，请重试');
      messagesContainer.appendChild(errorMessage);
    } finally {
      // 启用发送按钮
      sendMessageBtn.disabled = false;

      // 滚动到底部
      scrollToBottom();
    }
  }
  
  // 处理流式事件
  function handleStreamEvent(event, textElement, messageElement) {
    switch (event.type) {
      case 'content_delta':
        textElement.textContent += event.data.content;
        scrollToBottom();
        break;
        
      case 'tool_call_start':
        const toolCall = event.data;
        const toolElement = createToolCallElement(toolCall);
        messageElement.querySelector('.message-content').appendChild(toolElement);
        scrollToBottom();
        break;
        
      case 'tool_call_end':
        // 更新工具调用结果
        const existingToolElements = messageElement.querySelectorAll('.tool-call');
        if (existingToolElements.length > 0) {
          const lastToolElement = existingToolElements[existingToolElements.length - 1];
          const contentDiv = lastToolElement.querySelector('.tool-call-content');
          contentDiv.innerHTML = `
            <strong>参数:</strong> ${JSON.stringify(event.data.parameters, null, 2)}
            <br>
            <strong>结果:</strong> ${JSON.stringify(event.data.result, null, 2)}
          `;
        }
        scrollToBottom();
        break;
        
      case 'error':
        textElement.textContent += `\n❌ 错误: ${event.data.error}`;
        scrollToBottom();
        break;
    }
  }
  
  // 自动调整文本框高度
  function autoResizeTextarea() {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
  }

  // 执行搜索
  async function performSearch(query) {
    if (!apiClient.user) return;

    try {
      let sessions;
      if (query) {
        // 使用历史管理器搜索
        sessions = await chatHistoryManager.searchSessions(apiClient.user.user_id, query);
      } else {
        // 获取所有会话
        const result = await apiClient.getSessions(1, 50, apiClient.user.user_id);
        sessions = result.success ? result.data.sessions : [];
      }

      renderSessionsList(sessions);
    } catch (error) {
      console.error('搜索失败:', error);
    }
  }

  // 保存会话到历史管理器
  async function saveSessionToHistory(sessionData) {
    try {
      await chatHistoryManager.saveSession(sessionData);
    } catch (error) {
      console.error('保存会话历史失败:', error);
    }
  }

  // 保存消息到历史管理器
  async function saveMessageToHistory(sessionId, messageData) {
    try {
      await chatHistoryManager.saveMessage(sessionId, messageData);
    } catch (error) {
      console.error('保存消息历史失败:', error);
    }
  }
  
  // 事件监听器
  loginBtn.addEventListener('click', handleLogin);
  logoutBtn.addEventListener('click', handleLogout);
  newSessionBtn.addEventListener('click', createNewSession);
  sendMessageBtn.addEventListener('click', sendMessage);
  backBtn.addEventListener('click', hideChatPanel);
  
  // 移动端导航事件
  if (navSessions) {
    navSessions.addEventListener('click', (e) => {
      e.preventDefault();
      hideChatPanel();
    });
  }
  
  if (navNewSession) {
    navNewSession.addEventListener('click', (e) => {
      e.preventDefault();
      createNewSession();
    });
  }
  
  if (navProfile) {
    navProfile.addEventListener('click', (e) => {
      e.preventDefault();
      handleLogout();
    });
  }
  
  // 按Enter发送消息
  messageInput.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  });
  
  // 自动调整文本框高度
  messageInput.addEventListener('input', autoResizeTextarea);

  // 搜索功能
  let searchTimeout;
  sessionSearch.addEventListener('input', (e) => {
    const query = e.target.value.trim();

    // 显示/隐藏清除按钮
    if (query) {
      clearSearchBtn.classList.remove('hidden');
    } else {
      clearSearchBtn.classList.add('hidden');
    }

    // 防抖搜索
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      performSearch(query);
    }, 300);
  });

  clearSearchBtn.addEventListener('click', () => {
    sessionSearch.value = '';
    clearSearchBtn.classList.add('hidden');
    performSearch('');
  });

  // 窗口大小改变时重新检测设备类型
  window.addEventListener('resize', checkDeviceType);
  
  // 注册Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker 注册成功:', registration.scope);
      })
      .catch(error => {
        console.log('Service Worker 注册失败:', error);
      });
  }
  
  // 移动端键盘适配
  function handleMobileKeyboard() {
    if (!isMobile) return;

    const messageInputElement = document.getElementById('message-input');
    const messagesContainerElement = document.getElementById('messages-container');
    const chatContainerElement = document.getElementById('chat-container');

    if (!messageInputElement || !messagesContainerElement) return;

    // 监听输入框焦点
    messageInputElement.addEventListener('focus', () => {
      // 延迟执行，等待键盘弹出
      setTimeout(() => {
        // 滚动到底部
        messagesContainerElement.scrollTop = messagesContainerElement.scrollHeight;

        // 调整聊天容器高度
        const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        const headerHeight = 64;
        const bottomNavHeight = 56;
        const inputHeight = 80;

        const availableHeight = viewportHeight - headerHeight - bottomNavHeight - inputHeight;
        messagesContainerElement.style.height = `${Math.max(200, availableHeight)}px`;
      }, 300);
    });

    messageInputElement.addEventListener('blur', () => {
      // 恢复原始高度
      setTimeout(() => {
        messagesContainerElement.style.height = '';
      }, 300);
    });

    // 监听视口变化（键盘弹出/收起）
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => {
        if (document.activeElement === messageInputElement) {
          const viewportHeight = window.visualViewport.height;
          const headerHeight = 64;
          const bottomNavHeight = 56;
          const inputHeight = 80;

          const availableHeight = viewportHeight - headerHeight - bottomNavHeight - inputHeight;
          messagesContainerElement.style.height = `${Math.max(200, availableHeight)}px`;
        }
      });
    }
  }

  // 初始检查
  checkDeviceType();
  checkAuth();
  handleMobileKeyboard();
});


