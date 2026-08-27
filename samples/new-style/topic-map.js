/**
 * Topic → icon keyword mapping for TIMPS PostCards.
 * Each regex tests against the lowercase headline.
 * First match wins; fallback is "chip".
 */

const topicMap = [
  // Legal / lawsuits
  { pattern: /lawsuit|sue[sd]?|gavel|court|judge|ruling|trade.?secret|alleg|first amend/i, icon: 'gavel' },
  { pattern: /justice|prosecut|verdict|indict/i, icon: 'justice' },

  // Funding / IPO / valuation
  { pattern: /ipo|funding|valuation|billion|round|close[sd]?\s+(a\s+)?\$|invest|series/i, icon: 'funding' },
  { pattern: /coin|token|crypto|defi|web3|blockchain/i, icon: 'coin' },

  // Deals / partnerships / acquisitions
  { pattern: /deal|partner|acqui|merge|buy|purchas|handshake|joint/i, icon: 'deal' },

  // AI models / reasoning
  { pattern: /gpt|gemini|claude|llm|model|reason|fable|mythos|opus|sonnet/i, icon: 'brain' },
  { pattern: /ai agent|agentic|autonomous|agent/i, icon: 'robot' },
  { pattern: /rag|retrieval|embedding|vector|search/i, icon: 'database' },

  // AI voice / media
  { pattern: /voice|clone|deepfake|speech|audio|podcast/i, icon: 'megaphone' },

  // Robotics / humanoid
  { pattern: /robot|humanoid|bipedal|manipulat/i, icon: 'robot' },

  // Chips / hardware / compute
  { pattern: /chip|gpu|tpu|npu|semicon|silicon|cuda|core/i, icon: 'chip' },
  { pattern: /compute|inference|training|flop|petaflop/i, icon: 'chip_ai' },

  // Cloud / infrastructure
  { pattern: /cloud|aws|azure|gcp|stargate|data\s*center|server|infra/i, icon: 'server' },
  { pattern: /docker|container|kubernetes|k8s|deploy/i, icon: 'container' },

  // API / platform
  { pattern: /api|platform|endpoint|sdk|framework/i, icon: 'api_hub' },
  { pattern: /open.?source|github|repo|code|coding|copilot|cursor|ide/i, icon: 'terminal' },

  // Security / privacy
  { pattern: /secur|hack|breach|vulnerab|cyber|attack|exploit/i, icon: 'shield' },
  { pattern: /privacy|surveillance|spy|intelligence|agency/i, icon: 'warning' },

  // Space / satellite
  { pattern: /spacex|rocket|orbit|satellite|launch|nasa|space/i, icon: 'satellite' },

  // Phone / mobile
  { pattern: /phone|mobile|ios|android|app store|swipe|dating/i, icon: 'phone' },

  // Globe / international / regulation
  { pattern: /global|international|india|europe|china|regulat|ban|tariff|washington/i, icon: 'globe' },

  // Growth / predictions / charts
  { pattern: /predict|forecast|grow|surge|record|market|stock|share/i, icon: 'chart' },

  // Documents / reports / papers
  { pattern: /report|paper|study|survey|research|find|discover/i, icon: 'document' },

  // Layers / stack / architecture
  { pattern: /stack|layer|architect|full.?stack|middleware/i, icon: 'layers' },

  // Speed / performance
  { pattern: /fast|speed|latenc|perform|optim|turbo|flash/i, icon: 'bolt' },

  // Hand interaction
  { pattern: /swipe|scroll|touch|gesture|tap|interact/i, icon: 'hand_swipe' },

  // Cloud sync / sync
  { pattern: /sync|backup|replicat|mirror|storage/i, icon: 'cloud_sync' },
];

const FALLBACK_ICON = 'chip';

function mapTopicToIcon(headline) {
  const lower = headline.toLowerCase();
  for (const { pattern, icon } of topicMap) {
    if (pattern.test(lower)) return icon;
  }
  return FALLBACK_ICON;
}

module.exports = { topicMap, mapTopicToIcon, FALLBACK_ICON };
