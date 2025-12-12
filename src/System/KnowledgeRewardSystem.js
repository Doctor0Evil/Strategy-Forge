const KnowledgeRewards = {
  getStats() {
    return JSON.parse(localStorage.getItem('knowledgeRewards') || '{}') || {
      contributions: 0,
      chatBtcTokens: 0,
      cantoTokens: 0,
      specialQueries: 0,
      artifactsCreated: 0
    };
  },
  saveStats(stats) {
    localStorage.setItem('knowledgeRewards', JSON.stringify(stats));
  },
  resetStats() {
    localStorage.removeItem('knowledgeRewards');
    this.updateUI();
  }
};
const initRewardUI = () => {
  const rewardPanel = document.createElement('div');
  rewardPanel.className = 'submenu-panel';
  rewardPanel.id = 'knowledge-rewards-submenu';
  rewardPanel.innerHTML = `
    <h3>Knowledge Rewards</h3>
    <div class="reward-stats">
      <p>Contributions: <span id="contrib-count">0</span></p>
      <p>ChatBTC Tokens: <span id="chatbtc-tokens">0</span></p>
      <p>Canto Tokens: <span id="canto-tokens">0</span></p>
      <p>Special Queries: <span id="special-queries">0</span></p>
      <p>Artifacts Created: <span id="artifacts-created">0</span></p>
    </div>
    <div class="reward-input">
      <textarea id="knowledge-input" placeholder="Submit knowledge to the chatbot..."></textarea>
      <button id="submit-knowledge"><i class="fas fa-upload"></i> Submit</button>
    </div>
    <button id="reset-rewards"><i class="fas fa-trash"></i> Reset Rewards</button>
  `;
  document.querySelector('#chat-btc').appendChild(rewardPanel);
  KnowledgeRewards.updateUI();
};
KnowledgeRewards.updateUI = () => {
  const stats = KnowledgeRewards.getStats();
  document.querySelector('#contrib-count').textContent = stats.contributions;
  document.querySelector('#chatbtc-tokens').textContent = stats.chatBtcTokens;
  document.querySelector('#canto-tokens').textContent = stats.cantoTokens;
  document.querySelector('#special-queries').textContent = stats.specialQueries;
  document.querySelector('#artifacts-created').textContent = stats.artifactsCreated;
};
 (server-side would handle actual validation)
const simulateArtifactCreation = () => {
  return Math.random() < 0.1; 
};
const handleKnowledgeSubmission = () => {
  const input = document.querySelector('#knowledge-input').value.trim();
  if (!input) return;

  const stats = KnowledgeRewards.getStats();
  stats.contributions += 1;
  stats.chatBtcTokens += 10; 
  stats.cantoTokens += 5;   
  if (simulateArtifactCreation()) {
    stats.artifactsCreated += 1;
    if (stats.artifactsCreated % 3 === 0) {
      stats.specialQueries += 1; 
      alert('Congratulations! You earned a Special Query for creating 3 Chat_BTC_Artifacts!');
    }
    alert('Chat_BTC_Artifact created! Keep contributing!');
  }
  KnowledgeRewards.saveStats(stats);
  KnowledgeRewards.updateUI();
  document.querySelector('#knowledge-input').value = ''; // Clear input
};
document.addEventListener('DOMContentLoaded', () => {
  initRewardUI();
  document.querySelector('#submit-knowledge').addEventListener('click', handleKnowledgeSubmission);
  document.querySelector('#reset-rewards').addEventListener('click', () => {
    if (confirm('Reset all knowledge rewards?')) {
      KnowledgeRewards.resetStats();
    }
  });
  const menuItem = document.createElement('div');
  menuItem.className = 'menu-item';
  menuItem.dataset.submenu = 'knowledge-rewards';
  menuItem.innerHTML = '<i class="fas fa-book"></i> Knowledge Rewards';
  document.querySelector('.mega-menu').appendChild(menuItem);
  const mobileNavItem = document.createElement('div');
  mobileNavItem.className = 'nav-item';
  mobileNavItem.dataset.target = 'knowledge-rewards';
  mobileNavItem.innerHTML = '<i class="fas fa-book"></i> Rewards';
  document.querySelector('.mobile-nav').appendChild(mobileNavItem);
});
const initContributionChart = () => {
  const ctx = document.createElement('canvas');
  ctx.id = 'myChart_contributions';
  document.querySelector('.graphs').appendChild(ctx);
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
};
const updateContributionChart = () => {
  const stats = KnowledgeRewards.getStats();
  const chart = Chart.getChart('myChart_contributions');
  const now = new Date().toLocaleTimeString();
  chart.data.labels.push(now);
  chart.data.datasets[0].data.push(stats.contributions);
  if (chart.data.labels.length > 20) {
    chart.data.labels.shift();
    chart.data.datasets[0].data.shift();
  }
  chart.update();
};
setInterval(updateContributionChart, 60000); 
document.addEventListener('DOMContentLoaded', initContributionChart);
