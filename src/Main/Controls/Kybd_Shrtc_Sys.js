class KeyboardShortcuts {
  constructor() {
    this.shortcuts = {
      'KeyG': () => this.navigateTo('games'),
      'KeyD': () => this.openDeposit(),
      'KeyW': () => this.openWithdraw(),
      'KeyA': () => this.openAI(),
      'KeyS': () => this.openSettings(),
      'KeyQ': () => this.quickGame('dice'),
      'KeyE': () => this.quickGame('multiply'),
      'Escape': () => this.closeAllModals(),
      'Slash': () => this.focusSearch()
    };
    
    this.init();
  }
  
  init() {
    document.addEventListener('keydown', (e) => {
      // Ignore if typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      const key = e.code;
      if (this.shortcuts[key] && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        this.shortcuts[key]();
      }
    });
  }
  
  showShortcutHelp() {
    const helpModal = document.createElement('div');
    helpModal.className = 'shortcut-help';
    helpModal.innerHTML = `
      <h3>Keyboard Shortcuts</h3>
      <div class="shortcut-grid">
        ${Object.entries({
          'G': 'Go to Games',
          'D': 'Deposit BTC',
          'W': 'Withdraw',
          'A': 'AI Assistant',
          'Q': 'Quick Dice Game',
          'E': 'Quick Multiply Game',
          '/': 'Search',
          'ESC': 'Close Modals'
        }).map(([key, desc]) => `
          <div class="shortcut-item">
            <kbd>${key}</kbd>
            <span>${desc}</span>
          </div>
        `).join('')}
      </div>
    `;
    
    document.body.appendChild(helpModal);
  }
