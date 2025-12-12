class SupportSystem {
  constructor() {
    this.chatHistory = [];
    this.initChat();
  }
  
  initChat() {
    this.chatContainer = document.createElement('div');
    this.chatContainer.className = 'support-chat';
    this.chatContainer.innerHTML = `
      <div class="chat-header">
        <span>AI Support</span>
        <button class="close-chat">×</button>
      </div>
      <div class="chat-messages"></div>
      <div class="chat-input">
        <input type="text" placeholder="Ask a question...">
        <button class="send-btn"><i class="fas fa-paper-plane"></i></button>
        <button class="voice-btn"><i class="fas fa-microphone"></i></button>
      </div>
    `;
    
    document.body.appendChild(this.chatContainer);
    
    // Set up event listeners
    this.setupChatEvents();
  }
  
  setupChatEvents() {
    const input = this.chatContainer.querySelector('input');
    const sendBtn = this.chatContainer.querySelector('.send-btn');
    
    sendBtn.addEventListener('click', () => this.sendMessage(input.value));
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMessage(input.value);
    });
    
    // Voice input
    this.chatContainer.querySelector('.voice-btn').addEventListener('click', () => {
      this.startVoiceInput();
    });
  }
  
  async sendMessage(text) {
    if (!text.trim()) return;
    
    // Add user message
    this.addMessage('user', text);
    
    // Process message
    const response = await this.processSupportQuery(text);
    this.addMessage('ai', response);
  }
  
  async processSupportQuery(query) {
    // Check FAQ first
    const faqMatch = this.checkFAQ(query);
    if (faqMatch) return faqMatch;
    
    // Check account-specific issues
    if (query.includes('balance') || query.includes('withdraw')) {
      const balance = await this.getUserBalance();
      return `Your current balance is ${balance} satoshis. ` +
             `Withdrawals usually process within 1-3 blockchain confirmations.`;
    }
    
    // Fallback to AI
    return this.querySupportAI(query);
  }
  
  async querySupportAI(query) {
    const response = await fetch('/api/support/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        context: {
          lastActions: this.getUserActions(),
          balance: await this.getUserBalance(),
          openTickets: this.getOpenTickets()
        }
      })
    });
    
    const data = await response.json();
    return data.response;
  }
}
\\
src/Main/Controls/Contextual_Right_Click_Menu.js
class ContextMenu {
  constructor() {
    this.menuItems = {
      default: [
        { icon: 'fa-search', label: 'Search Platform', action: 'openSearch()' },
        { separator: true },
        { icon: 'fa-wallet', label: 'Quick Deposit', action: 'openDeposit()' },
        { icon: 'fa-robot', label: 'Ask AI Assistant', action: 'openAIHelp()' }
      ],
      game: [
        { icon: 'fa-chart-line', label: 'View Stats', action: 'showGameStats()' },
        { icon: 'fa-users', label: 'Challenge Friend', action: 'startPvP()' },
        { icon: 'fa-book', label: 'Game Rules', action: 'showGameRules()' }
      ],
      user: [
        { icon: 'fa-user', label: 'View Profile', action: 'viewProfile()' },
        { icon: 'fa-comment', label: 'Send Message', action: 'startChat()' },
        { icon: 'fa-gift', label: 'Send Gift', action: 'openGiftMenu()' }
      ]
    };
    
    this.initContextMenu();
  }
  
  initContextMenu() {
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      
      // Determine context
      let context = 'default';
      if (e.target.closest('.game-container')) context = 'game';
      if (e.target.closest('.user-profile')) context = 'user';
      
      this.showMenu(e.clientX, e.clientY, context);
    });
    
    document.addEventListener('click', () => {
      this.hideMenu();
    });
  }
  
  showMenu(x, y, context) {
    this.hideMenu();
    
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    
    this.menuItems[context].forEach(item => {
      if (item.separator) {
        menu.appendChild(document.createElement('hr'));
      } else {
        const itemEl = document.createElement('div');
        itemEl.className = 'menu-item';
        itemEl.innerHTML = `
          <i class="fas ${item.icon}"></i>
          <span>${item.label}</span>
        `;
        itemEl.addEventListener('click', () => {
          eval(item.action);
          this.hideMenu();
        });
        menu.appendChild(itemEl);
      }
    });
    
    document.body.appendChild(menu);
    this.currentMenu = menu;
  }
  
  hideMenu() {
    if (this.currentMenu) {
      this.currentMenu.remove();
      this.currentMenu = null;
    }
  }
}
