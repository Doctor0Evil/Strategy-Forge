class AINavigator {
  constructor() {
    this.voiceRecognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    this.setupVoiceControls();
    this.setupGestures();
  }
  setupVoiceControls() {
    this.voiceRecognition.continuous = true;
    this.voiceRecognition.interimResults = true;
    this.voiceRecognition.lang = 'en-US';

    this.voiceRecognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');
      
      this.processVoiceCommand(transcript);
    };

    this.voiceRecognition.start();
  }

  processVoiceCommand(command) {
    const normalized = command.toLowerCase().trim();
    
    const commands = {
      'open dice game': () => this.navigateTo('#dice-game'),
      'go to governance': () => this.navigateTo('#dao-governance'),
      'deposit bitcoin': () => this.openModal('deposit-modal'),
      'spin wheel': () => document.getElementById('spin-button').click(),
      'what are my rewards': () => this.showRewards(),
      'help': () => this.showHelp()
    };

    for (const [keyword, action] of Object.entries(commands)) {
      if (normalized.includes(keyword)) {
        action();
        break;
      }
    }
  }

  setupGestures() {
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', (event) => {
        if (Math.abs(event.beta) > 45) { // Tilt right
          this.nextMenu();
        } else if (Math.abs(event.beta) < -45) { // Tilt left
          this.prevMenu();
        }
      });
    }
  }

  showSmartSuggestions() {
    // AI-powered contextual suggestions
    const suggestions = this.analyzeBehavior();
    
    const suggestionPanel = document.getElementById('ai-suggestions');
    suggestionPanel.innerHTML = suggestions.map(s => `
      <div class="suggestion" onclick="${s.action}">
        <i class="${s.icon}"></i>
        <span>${s.text}</span>
      </div>
    `).join('');
  }

  analyzeBehavior() {
    // Sample AI analysis - would integrate with real ML model
    const now = new Date();
    const hour = now.getHours();
    
    if (hour >= 20 || hour < 5) {
      return [{
        text: "Night Owl Bonus: 2x FUN tokens until 5AM!",
        icon: "fas fa-moon",
        action: "window.location='#night-bonus'"
      }];
    }
    
    return [];
  }
}
\\
// CHATAI.sol
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

contract CHATAI is ERC20Votes {
    address public minigameContract;
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18;
    
    constructor() ERC20("CHAT-AI Token", "CHATAI") ERC20Permit("CHAT-AI Token") {
        _mint(msg.sender, MAX_SUPPLY * 20 / 100); // Team (vested)
        _mint(address(this), MAX_SUPPLY * 80 / 100); // Treasury
    }
    
    function setMinigameContract(address _contract) external onlyOwner {
        minigameContract = _contract;
    }
    
    function claimGameRewards(address user) external {
        require(msg.sender == minigameContract, "Unauthorized");
        uint256 amount = calculateRewards(user);
        _transfer(address(this), user, amount);
    }
    
    function calculateRewards(address user) public view returns (uint256) {
        // Logic to calculate earned rewards from gameplay
        return 100 * 10**18; // Example
    }
}

contract CHATAIGovernance {
    CHATAI public token;
    uint256 public proposalCount;
    
    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 endBlock;
        bool executed;
    }
    
    mapping(uint256 => Proposal) public proposals;
    mapping(address => uint256) public lastVoteBlock;
    
    constructor(address _token) {
        token = CHATAI(_token);
    }
    
    function propose(string memory description) external {
        require(token.getVotes(msg.sender) >= 1000 * 10**18, "Insufficient tokens");
        proposalCount++;
        proposals[proposalCount] = Proposal({
            id: proposalCount,
            proposer: msg.sender,
            description: description,
            forVotes: 0,
            againstVotes: 0,
            endBlock: block.number + 40320, // ~1 week
            executed: false
        });
    }
    
    function vote(uint256 proposalId, bool support) external {
        Proposal storage proposal = proposals[proposalId];
        require(block.number < proposal.endBlock, "Voting ended");
        require(lastVoteBlock[msg.sender] < proposal.endBlock, "Already voted");
        
        uint256 votes = token.getVotes(msg.sender);
        if (support) {
            proposal.forVotes += votes;
        } else {
            proposal.againstVotes += votes;
        }
        
        lastVoteBlock[msg.sender] = block.number;
    }
    
    function executeProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(block.number >= proposal.endBlock, "Voting ongoing");
        require(!proposal.executed, "Already executed");
        require(proposal.forVotes > proposal.againstVotes, "Proposal failed");
        
        // Execute proposal logic here
        proposal.executed = true;
    }
}
