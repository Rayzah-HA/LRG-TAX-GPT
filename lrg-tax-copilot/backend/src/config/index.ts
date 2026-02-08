import dotenv from 'dotenv';

dotenv.config();

const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',

  notionApiKey: process.env.NOTION_API_KEY || '',
  notionDatabaseIds: {
    policies: process.env.NOTION_POLICIES_DB_ID || '',
    templates: process.env.NOTION_TEMPLATES_DB_ID || '',
    pricingRules: process.env.NOTION_PRICING_RULES_DB_ID || '',
    topicBriefs: process.env.NOTION_TOPIC_BRIEFS_DB_ID || '',
  },

  confidenceThreshold: 0.70,

  retrievalLimits: {
    perDatabase: 5,
    total: 10,
  },

  auth: {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    jwtExpiresIn: '8h',
    bcryptRounds: 10,
  },
} as const;

function validateProductionConfig(): void {
  const required: { key: string; value: string }[] = [
    { key: 'ANTHROPIC_API_KEY', value: config.anthropicApiKey },
    { key: 'JWT_SECRET', value: process.env.JWT_SECRET || '' },
    { key: 'FRONTEND_URL', value: process.env.FRONTEND_URL || '' },
  ];

  const missing = required.filter((r) => !r.value);

  if (missing.length > 0) {
    const names = missing.map((r) => r.key).join(', ');
    throw new Error(
      `Missing required environment variables for production: ${names}`
    );
  }
}

if (config.nodeEnv === 'production') {
  validateProductionConfig();
}

export default config;
