const ChatBTCLeaderboard = {
  getStats() {
    return JSON.parse(localStorage.getItem('chatBTCLeaderboard') || '{}') || {
      users: {}, // { username: { points, wins, cards, perks, optOut, status } }
      leaderboard: { daily: [], weekly: [], allTime: [] },
      cards: [], // Available cards in marketplace
      jackpots: {
        daily: { rolls: 0, quota: 100, number: 7777, reward: { btc: 0.0001, canto: 10 } },
        weekly: { rolls: 0, quota: 1000, number: 8888, reward: { btc: 0.001, canto: 50 } },
        monthly: { rolls: 0, quota: 10000, number: 9999, reward: { btc: 0.01, canto: 100, usd: 10 } },
      },
    };
  },
  saveStats(stats) {
    localStorage.setItem('chatBTCLeaderboard', JSON.stringify(stats));
  },
  resetStats() {
    localStorage.removeItem('chatBTCLeaderboard');
    this.updateUI();
  },
  updateUI() {
    const stats = this.getStats();
    this.updateLeaderboard('daily');
    this.updateMarketplace(stats.cards);
    this.updateVault();
    this.updateJackpotTracker();
  },
  getCurrentUser() {
    let username = localStorage.getItem('currentUser');
    if (!username) {
      username = prompt('Please sign up to participate (enter username):');
      if (username) {
        username = username.trim().replace(/[^a-zA-Z0-9]/g, '');
        if (username) localStorage.setItem('currentUser', username);
        else return null;
      }
    }
    return username;
  },
  updateJackpotTracker() {
    const stats = this.getStats();
    document.querySelector('#daily-jackpot').textContent = `0.0001 BTC + 10 Canto`;
    document.querySelector('#weekly-jackpot').textContent = `0.001 BTC + 50 Canto`;
    document.querySelector('#monthly-jackpot').textContent = `0.01 BTC + 100 Canto + $10`;
    document.querySelector('#daily-rolls').textContent = `${stats.jackpots.daily.rolls}/${stats.jackpots.daily.quota}`;
    document.querySelector('#weekly-rolls').textContent = `${stats.jackpots.weekly.rolls}/${stats.jackpots.weekly.quota}`;
    document.querySelector('#monthly-rolls').textContent = `${stats.jackpots.monthly.rolls}/${stats.jackpots.monthly.quota}`;
  },
};

// Dice-rolling and attack mechanics
const DiceGame = {
  rollDice() {
    return Math.floor(Math.random() * 10000) + 1; // 10,000-sided dice
  },
  getAttackType() {
    const types = [
      { type: 'Long-Shot', damage: -5, missChance: 0 },
      { type: 'Ricochet', damage: -5, missChance: 0.2, criticalChance: 0.05 },
      { type: 'Lucky-Shot', damage: 5, missChance: 0 },
      { type: 'Direct-Hit', damage: 0, status: 'Winded', statusEffect: -5 },
      { type: 'Limb-Shot', damage: 0, status: ['Slow-Moves', 'Crippled'], statusEffect: [-7.3, 'skip-2-turns'] },
    ];
    return types[Math.floor(Math.random() * types.length)];
  },
  generateCard() {
    const tiers = ['Common', 'Rare', 'Epic', 'Legendary'];
    const bonuses = [
      { type: 'BTC', value: (Math.random() * 0.0001).toFixed(8) },
      { type: 'Canto', value: Math.floor(Math.random() * 10) },
      { type: 'Perk', value: 'Accuracy +5%', lifetime: true },
      { type: 'Move', value: 'Extra Roll' },
    ];
    return {
      id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tier: tiers[Math.floor(Math.random() * tiers.length)],
      bonus: bonuses[Math.floor(Math.random() * bonuses.length)],
    };
  },
  async processSubmission(username, input) {
    if (!username) return;
    const stats = ChatBTCLeaderboard.getStats();
    if (!stats.users[username] || stats.users[username].optOut) return;
    if (stats.users[username].status?.turns > 0) {
      if (stats.users[username].status.effect === 'skip-2-turns') {
        stats.users[username].status.turns--;
        if (stats.users[username].status.turns === 0) delete stats.users[username].status;
        ChatBTCLeaderboard.saveStats(stats);
        return;
      }
    }

    const roll = this.rollDice();
    stats.jackpots.daily.rolls++;
    stats.jackpots.weekly.rolls++;
    stats.jackpots.monthly.rolls++;
    stats.users[username] = stats.users[username] || { points: 0, wins: 0, cards: [], perks: [], optOut: false };
    stats.users[username].points += roll / 10000; // Normalize to 0–1 for leaderboard

    // Jackpot checks
    let jackpotMessage = '';
    if (roll === stats.jackpots.daily.number && stats.jackpots.daily.rolls >= stats.jackpots.daily.quota) {
      jackpotMessage = `${username} hit the Daily Jackpot (${roll})! Awarded ${stats.jackpots.daily.reward.btc} BTC + ${stats.jackpots.daily.reward.canto} Canto`;
      stats.jackpots.daily.rolls = 0;
    } else if (roll === stats.jackpots.weekly.number && stats.jackpots.weekly.rolls >= stats.jackpots.weekly.quota) {
      jackpotMessage = `${username} hit the Weekly Jackpot (${roll})! Awarded ${stats.jackpots.weekly.reward.btc} BTC + ${stats.jackpots.weekly.reward.canto} Canto`;
      stats.jackpots.weekly.rolls = 0;
    } else if (roll === stats.jackpots.monthly.number && stats.jackpots.monthly.rolls >= stats.jackpots.monthly.quota) {
      jackpotMessage = `${username} hit the Monthly Jackpot (${roll})! Awarded ${stats.jackpots.monthly.reward.btc} BTC + ${stats.jackpots.monthly.reward.canto} Canto + $${stats.jackpots.monthly.reward.usd}`;
      stats.jackpots.monthly.rolls = 0;
    }
    if (jackpotMessage) {
      document.querySelector('#jackpot-tracker-submenu').classList.add('jackpot-animation');
      setTimeout(() => document.querySelector('#jackpot-tracker-submenu').classList.remove('jackpot-animation'), 1000);
      alert(jackpotMessage);
    }

    // Player Card chance (1%)
    if (Math.random() < 0.01) {
      const card = this.generateCard();
      stats.users[username].cards.push(card);
      stats.cards.push(card);
      alert(`${username} received a ${card.tier} card: ${card.bonus.type} (${card.bonus.value})!`);
    }

    // Attack chance (25%)
    if (Math.random() < 0.25) {
      const opponent = this.getRandomOpponent(username);
      if (opponent) {
        const attack = this.getAttackType();
        this.executeAttack(username, opponent, attack);
      }
    }

    ChatBTCLeaderboard.saveStats(stats);
    ChatBTCLeaderboard.updateUI();
  },
  getRandomOpponent(currentUser) {
    const stats = ChatBTCLeaderboard.getStats();
    const activeUsers = Object.keys(stats.users).filter(u => u !== currentUser && !stats.users[u].optOut && !stats.users[u].status?.effect === 'skip-2-turns');
    return activeUsers.length ? activeUsers[Math.floor(Math.random() * activeUsers.length)] : null;
  },
  executeAttack(attacker, defender, attack) {
    const stats = ChatBTCLeaderboard.getStats();
    let message = `${attacker} attacks ${defender} with ${attack.type}! `;
    let damage = attack.damage || 0;

    if (attack.missChance && Math.random() < attack.missChance) {
      message += 'Missed!';
    } else if (attack.criticalChance && Math.random() < attack.criticalChance) {
      message += 'Critical Hit!';
      damage *= 2;
    } else if (attack.status) {
      if (Array.isArray(attack.status)) {
        const statusIndex = Math.floor(Math.random() * attack.status.length);
        const status = attack.status[statusIndex];
        const effect = attack.statusEffect[statusIndex];
        stats.users[defender].status = { type: status, effect, turns: status === 'Crippled' ? 2 : 1 };
        message += `${defender} is ${status} (${effect})!`;
      } else {
        stats.users[defender].status = { type: attack.status, effect: attack.statusEffect, turns: 1 };
        message += `${defender} is ${attack.status} (${attack.statusEffect}% accuracy)!`;
      }
    } else {
      stats.users[defender].points = Math.max(0, stats.users[defender].points + damage / 10000);
      message += `Dealt ${Math.abs(damage)}% ${damage < 0 ? 'damage' : 'bonus'}!`;
    }

    stats.users[attacker].wins += 1;
    document.querySelector('#leaderboard-content').classList.add('attack-animation');
    setTimeout(() => document.querySelector('#leaderboard-content').classList.remove('attack-animation'), 500);
    alert(message);
    ChatBTCLeaderboard.saveStats(stats);
    ChatBTCLeaderboard.updateUI();
  },
};

// Leaderboard and marketplace UI
ChatBTCLeaderboard.updateLeaderboard = function(filter) {
  const stats = this.getStats();
  const users = Object.entries(stats.users)
    .map(([username, data]) => ({ username, points: data.points, wins: data.wins, cards: data.cards.length }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 10);
  stats.leaderboard[filter] = users;
  this.saveStats(stats);

  const content = document.querySelector('#leaderboard-content');
  content.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Rank</th>
          <th>Username</th>
          <th>Points</th>
          <th>Wins</th>
          <th>Cards</th>
        </tr>
      </thead>
      <tbody>
        ${users.map((u, i) => `
          <tr class="leaderboard-item">
            <td>${i + 1}</td>
            <td>${u.username}</td>
            <td>${u.points.toFixed(4)}</td>
            <td>${u.wins}</td>
            <td>${u.cards}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
};

ChatBTCLeaderboard.updateMarketplace = function(cards) {
  const content = document.querySelector('#marketplace-content');
  content.innerHTML = cards.map(card => `
    <div class="marketplace-card">
      <p>Card ID: ${card.id}</p>
      <p>Tier: ${card.tier}</p>
      <p>Bonus: ${card.bonus.type} (${card.bonus.value})</p>
    </div>
  `).join('');
};

ChatBTCLeaderboard.updateVault = function() {
  const username = this.getCurrentUser();
  const stats = this.getStats();
  const cards = stats.users[username]?.cards || [];
  const content = document.querySelector('#vault-content');
  content.innerHTML = cards.map(card => `
    <div class="vault-card">
      <p>Card ID: ${card.id}</p>
      <p>Tier: ${card.tier}</p>
      <p>Bonus: ${card.bonus.type} (${card.bonus.value})</p>
    </div>
  `).join('');
};
const initLeaderboardChart = () => {
  const ctx = document.querySelector('#myChart_leaderboard');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Your Points Over Time',
        data: [],
        borderColor: '#28a745',
        fill: false,
      }],
    },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: 'Time' } },
        y: { title: { display: true, text: 'Points' } },
      },
    },
  });
};

const updateLeaderboardChart = () => {
  const username = ChatBTCLeaderboard.getCurrentUser();
  if (!username) return;
  const stats = ChatBTCLeaderboard.getStats();
  const chart = Chart.getChart('myChart_leaderboard');
  const now = new Date().toLocaleTimeString();
  chart.data.labels.push(now);
  chart.data.datasets[0].data.push(stats.users[username]?.points || 0);
  if (chart.data.labels.length > 20) {
    chart.data.labels.shift();
    chart.data.datasets[0].data.shift();
  }
  chart.update();
};
const KnowledgeRewards = {
  initContributionChart() {
    const ctx = document.querySelector('#myChart_contributions');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Contributions', 'ChatBTC Tokens', 'Canto Tokens', 'Artifacts', 'Special Queries'],
        datasets: [{
          label: 'Your Stats',
          data: [0, 0, 0, 0, 0],
          backgroundColor: '#28a745',
        }],
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Count' } },
        },
      },
    });
  },
  updateContributionChart() {
    const stats = KnowledgeRewardAutobot.getStats();
    const chart = Chart.getChart('myChart_contributions');
    chart.data.datasets[0].data = [
      stats.contributions,
      stats.chatBtcTokens,
      stats.cantoTokens,
      stats.artifactsCreated,
      stats.specialQueries,
    ];
    chart.update();
  },
  handleSubmission() {
    const username = ChatBTCLeaderboard.getCurrentUser();
    if (!username) return;

    const input = document.querySelector('#knowledge-input').value.trim();
    if (!input) return;

    const stats = KnowledgeRewardAutobot.getStats();
    stats.contributions++;
    stats.chatBtcTokens += 10;
    stats.cantoTokens += 5;

    if (Math.random() < 0.1) {
      stats.artifactsCreated++;
      if (stats.artifactsCreated % 3 === 0) {
        stats.specialQueries++;
        alert('Congratulations! You earned a Special Query for creating 3 Chat_BTC_Artifacts!');
      }
      alert('Chat_BTC_Artifact created! Keep contributing!');
    }

    KnowledgeRewardAutobot.saveStats(stats);
    KnowledgeRewardAutobot.updateUI();
    this.updateContributionChart();
    document.querySelector('#knowledge-input').value = '';
    DiceGame.processSubmission(username, input);
    updateLeaderboardChart();
  },
};
const KnowledgeRewardAutobot = {
  getStats() {
    return JSON.parse(localStorage.getItem('knowledgeRewardStats') || '{}') || {
      contributions: 0,
      chatBtcTokens: 0,
      cantoTokens: 0,
      artifactsCreated: 0,
      specialQueries: 0,
    };
  },
  saveStats(stats) {
    localStorage.setItem('knowledgeRewardStats', JSON.stringify(stats));
  },
  resetStats() {
    localStorage.removeItem('knowledgeRewardStats');
    this.updateUI();
  },
  updateUI() {
    const stats = this.getStats();
    document.querySelector('#contributions').textContent = stats.contributions;
    document.querySelector('#chat-btc-tokens').textContent = stats.chatBtcTokens;
    document.querySelector('#canto-tokens').textContent = stats.cantoTokens;
    document.querySelector('#artifacts-created').textContent = stats.artifactsCreated;
    document.querySelector('#special-queries').textContent = stats.specialQueries;
  },
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  const username = ChatBTCLeaderboard.getCurrentUser();
  if (username) {
    const stats = ChatBTCLeaderboard.getStats();
    stats.users[username] = stats.users[username] || { points: 0, wins: 0, cards: [], perks: [], optOut: false };
    ChatBTCLeaderboard.saveStats(stats);
  }

  KnowledgeRewards.initContributionChart();
  initLeaderboardChart();
  ChatBTCLeaderboard.updateUI();
  KnowledgeRewardAutobot.updateUI();

  document.querySelector('#submit-knowledge').addEventListener('click', () => KnowledgeRewards.handleSubmission());
  document.querySelector('#reset-rewards').addEventListener('click', () => {
    if (confirm('Reset all rewards, autobot stats, and leaderboard data?')) {
      KnowledgeRewardAutobot.resetStats();
      ChatBTCLeaderboard.resetStats();
    }
  });

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      ChatBTCLeaderboard.updateLeaderboard(btn.dataset.filter);
    });
  });

  document.querySelector('#trade-button').addEventListener('click', () => {
    const cardId = document.querySelector('#trade-offer').value.trim();
    const currency = document.querySelector('#trade-currency').value;
    const username = ChatBTCLeaderboard.getCurrentUser();
    const stats = ChatBTCLeaderboard.getStats();
    const card = stats.cards.find(c => c.id === cardId);
    if (card && stats.users[username]) {
      const fee = currency === 'btc' ? 0.00002 : currency === 'canto' ? 2 : 0.2; // 2% fee
      stats.users[username].cards.push(card);
      stats.cards = stats.cards.filter(c => c.id !== cardId);
      stats.jackpots.daily.reward.btc += currency === 'btc' ? fee : 0;
      stats.jackpots.daily.reward.canto += currency === 'canto' ? fee : 0;
      alert(`Purchased ${card.tier} card for ${currency}! Fee: ${fee} ${currency}`);
      ChatBTCLeaderboard.saveStats(stats);
      ChatBTCLeaderboard.updateUI();
    } else {
      alert('Invalid card ID or user not found.');
    }
  });

  document.querySelector('#convert-nft').addEventListener('click', () => {
    const username = ChatBTCLeaderboard.getCurrentUser();
    const stats = ChatBTCLeaderboard.getStats();
    const card = stats.users[username]?.cards[0];
    if (card) {
      const fee = 0.00005; // NFT minting fee
      stats.jackpots.daily.reward.btc += fee;
      stats.users[username].cards = stats.users[username].cards.filter(c => c.id !== card.id);
      alert(`Card ${card.id} converted to NFT! Fee: ${fee} BTC`);
      ChatBTCLeaderboard.saveStats(stats);
      ChatBTCLeaderboard.updateUI();
    } else {
      alert('No cards available to convert.');
    }
  });

  document.querySelector('#opt-out-toggle').addEventListener('click', () => {
    const username = ChatBTCLeaderboard.getCurrentUser();
    const stats = ChatBTCLeaderboard.getStats();
    if (stats.users[username]) {
      stats.users[username].optOut = !stats.users[username].optOut;
      alert(`Dice rolling ${stats.users[username].optOut ? 'disabled' : 'enabled'} for ${username}`);
      ChatBTCLeaderboard.saveStats(stats);
    }
  });
  setInterval(() => {
    const now = new Date();
    const stats = ChatBTCLeaderboard.getStats();
    if (now.getUTCHours() === 0 && now.getUTCMinutes() === 0) stats.jackpots.daily.rolls = 0;
    if (now.getUTCDay() === 0) stats.jackpots.weekly.rolls = 0;
    if (now.getUTCDate() === 1) stats.jackpots.monthly.rolls = 0;
    ChatBTCLeaderboard.saveStats(stats);
    ChatBTCLeaderboard.updateUI();
  }, 60000);

  setInterval(updateLeaderboardChart, 60000);
});
