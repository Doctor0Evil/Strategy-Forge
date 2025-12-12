const KnowledgeRewardAutobot = {
  getStats() {
    return JSON.parse(localStorage.getItem('knowledgeRewardAutobot') || '{}') || {
      contributions: 0,
      chatBtcTokens: 0,
      cantoTokens: 0,
      specialQueries: 0,
      artifactsCreated: 0,
      autobot: {
        profit: 0,
        wagered: 0,
        totalBets: 0,
        totalWins: 0,
        totalLosses: 0,
        highestBet: 0,
        initialBalance: 0,
        currentBet: '0.00000001',
        loseCounter: 0
      }
    };
  },
  saveStats(stats) {
    localStorage.setItem('knowledgeRewardAutobot', JSON.stringify(stats));
  },
  resetStats() {
    localStorage.removeItem('knowledgeRewardAutobot');
    this.updateUI();
  },
  updateUI() {
    const stats = this.getStats();
    // Reward stats
    document.querySelector('#contrib-count').textContent = stats.contributions;
    document.querySelector('#chatbtc-tokens').textContent = stats.chatBtcTokens;
    document.querySelector('#canto-tokens').textContent = stats.cantoTokens;
    document.querySelector('#special-queries').textContent = stats.specialQueries;
    document.querySelector('#artifacts-created').textContent = stats.artifactsCreated;
    // Autobot stats
    document.querySelector('#autobot-profit').textContent = stats.autobot.profit.toFixed(8);
    document.querySelector('#autobot-wagered').textContent = stats.autobot.wagered.toFixed(8);
    document.querySelector('#autobot-bets').textContent = stats.autobot.totalBets;
    document.querySelector('#autobot-wins').textContent = stats.autobot.totalWins;
    document.querySelector('#autobot-losses').textContent = stats.autobot.totalLosses;
    document.querySelector('#autobot-highest').textContent = stats.autobot.highestBet.toFixed(8);
  }
};

// Autobot logic adapted from Freebitco.in AutoBot
const Autobot = {
  stopped: false,
  stop: false,
  multiplier: 100,
  maxWait: 100,
  stopBefore: 2, // Minutes before redirect
  chart: null,

  init() {
    this.$multiplyButton = document.querySelector('#multiply-button');
    this.$betAmount = document.querySelector('#bet-amount');
    this.$balance = document.querySelector('#balance');
    this.$result = document.querySelector('#multiply-result');
    this.stats = KnowledgeRewardAutobot.getStats().autobot;
    this.stats.initialBalance = parseFloat(this.$balance.textContent) || 0;
    KnowledgeRewardAutobot.saveStats(KnowledgeRewardAutobot.getStats());
    this.addChart();
    this.bindEvents();
  },

  addChart() {
    const ctx = document.querySelector('#myChart_total');
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Autobot Profit',
          data: [],
          borderColor: '#28a745',
          fill: false
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: { title: { display: true, text: 'Bets' } },
          y: { title: { display: true, text: 'Profit (BTC)' } }
        }
      }
    });
  },

  updateChart() {
    const now = new Date().toLocaleTimeString();
    this.chart.data.labels.push(now);
    this.chart.data.datasets[0].data.push(this.stats.profit);
    if (this.chart.data.labels.length > 20) {
      this.chart.data.labels.shift();
      this.chart.data.datasets[0].data.shift();
    }
    this.chart.update();
  },

  getRandomWait() {
    const wait = Math.floor(Math.random() * this.maxWait) + 100;
    console.log(`Waiting for ${wait}ms before next bet.`);
    return wait;
  },

  bindEvents() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        const resultText = this.$result.textContent.toLowerCase();
        if (resultText.includes('win')) {
          this.handleWin();
        } else if (resultText.includes('lose')) {
          this.handleLoss();
        }
      });
    });
    observer.observe(this.$result, { childList: true, subtree: true });

    document.querySelector('#start-autobot').addEventListener('click', () => {
      this.stopped = false;
      this.stop = false;
      this.startGame();
    });

    document.querySelector('#stop-autobot').addEventListener('click', () => {
      this.stopGame();
    });
  },

  handleWin() {
    this.stats.totalWins++;
    this.stats.loseCounter = 0;
    if (this.stats.totalWins % 5 === 0) {
      setTimeout(() => location.reload(), 5);
    }
    if (parseFloat(this.$betAmount.value) > this.stats.highestBet) {
      this.stats.highestBet = parseFloat(this.$betAmount.value);
    }
    this.updateStats();
    if (this.stop) {
      console.log('%cStopped', 'color: #FF0000');
      this.stopped = false;
      this.stop = false;
      return;
    }
    if (this.iHaveEnoughMoni()) {
      this.reset();
      if (this.stopped) return;
    }
    setTimeout(() => this.$multiplyButton.click(), this.getRandomWait());
  },

  handleLoss() {
    this.stats.loseCounter++;
    this.stats.totalLosses++;
    if (this.stats.loseCounter === 200) {
      const current = parseFloat(this.$betAmount.value);
      this.$betAmount.value = (current * 100).toFixed(8);
    }
    if (parseFloat(this.$betAmount.value) > this.stats.highestBet) {
      this.stats.highestBet = parseFloat(this.$betAmount.value);
    }
    this.updateStats();
    if (!this.stop) {
      this.multiplyBet();
      setTimeout(() => this.$multiplyButton.click(), this.getRandomWait());
    } else {
      this.stopped = false;
      this.stop = false;
    }
  },

  multiplyBet() {
    const current = parseFloat(this.$betAmount.value);
    this.$betAmount.value = (current * 1.01).toFixed(8);
  },

  updateStats() {
    this.stats.profit = parseFloat(this.$balance.textContent) - this.stats.initialBalance;
    this.stats.wagered += parseFloat(this.$betAmount.value);
    this.stats.totalBets++;
    KnowledgeRewardAutobot.saveStats(KnowledgeRewardAutobot.getStats());
    KnowledgeRewardAutobot.updateUI();
    this.updateChart();
    console.clear();
    console.log(`Initial Balance: ${this.stats.initialBalance}`);
    console.log(`Round: ${this.stats.totalBets}`);
    console.log(`Profit: ${this.stats.profit.toFixed(8)} BTC`);
    console.log(`Wagered: ${this.stats.wagered.toFixed(8)} BTC`);
    console.log(`%cWins: ${this.stats.totalWins} %cLosses: ${this.stats.totalLosses}`, 'color: #28a745', 'color: #dc3545');
    console.log(`%cHighest Bet: ${this.stats.highestBet.toFixed(8)}`, 'color: #28a745');
  },

  startGame() {
    console.log('Autobot started!');
    this.stats.currentBet = this.$betAmount.value;
    this.$multiplyButton.click();
  },

  stopGame() {
    console.log('Autobot will stop soon!');
    this.stopped = true;
    this.stop = true;
  },

  reset() {
    this.stats.loseCounter = 0;
    this.$betAmount.value = '0.00000001';
    this.stats.currentBet = this.$betAmount.value;
  },

  iHaveEnoughMoni() {
    const balance = parseFloat(this.$balance.textContent) * 1000000;
    const current = parseFloat(this.$betAmount.value) * 1000000;
    return ((balance * 2) / 100) * (current * 2) > 0.0001 / 100;
  }
};

// Knowledge Rewards logic
const KnowledgeRewards = {
  handleSubmission() {
    const input = document.querySelector('#knowledge-input').value.trim();
    if (!input) return;

    const stats = KnowledgeRewardAutobot.getStats();
    stats.contributions++;
    stats.chatBtcTokens += 10;
    stats.cantoTokens += 5;

    if (Math.random() < 0.1) { // 10% chance for artifact
      stats.artifactsCreated++;
      if (stats.artifactsCreated % 3 === 0) {
        stats.specialQueries++;
        alert('Congratulations! You earned a Special Query for creating 3 Chat_BTC_Artifacts!');
      }
      alert('Chat_BTC_Artifact created! Keep contributing!');
    }

    KnowledgeRewardAutobot.saveStats(stats);
    KnowledgeRewardAutobot.updateUI();
    document.querySelector('#knowledge-input').value = '';
    this.updateContributionChart();
  },

  initContributionChart() {
    const ctx = document.querySelector('#myChart_contributions');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Contributions Over Time',
          data: [],
          borderColor: '#28a745',
          fill: false
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: { title: { display: true, text: 'Time' } },
          y: { title: { display: true, text: 'Contributions' } }
        }
      }
    });
  },

  updateContributionChart() {
    const stats = KnowledgeRewardAutobot.getStats();
    const chart = Chart.getChart('myChart_contributions');
    const now = new Date().toLocaleTimeString();
    chart.data.labels.push(now);
    chart.data.datasets[0].data.push(stats.contributions);
    if (chart.data.labels.length > 20) {
      chart.data.labels.shift();
      chart.data.datasets[0].data.shift();
    }
    chart.update();
  }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  Autobot.init();
  KnowledgeRewards.initContributionChart();
  document.querySelector('#submit-knowledge').addEventListener('click', () => KnowledgeRewards.handleSubmission());
  document.querySelector('#reset-rewards').addEventListener('click', () => {
    if (confirm('Reset all rewards and autobot stats?')) {
      KnowledgeRewardAutobot.resetStats();
    }
  });
  setInterval(() => KnowledgeRewards.updateContributionChart(), 60000);
});
```
