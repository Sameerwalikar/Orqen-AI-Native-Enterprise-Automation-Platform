const config = require('../../config');
const OpenAIProvider = require('./OpenAIProvider');
const OpenRouterProvider = require('./OpenRouterProvider');
const AnthropicProvider = require('./AnthropicProvider');
const GeminiProvider = require('./GeminiProvider');

function getLLMProvider() {
  const providerType = (config.LLM_PROVIDER || 'openrouter').toLowerCase();
  
  switch (providerType) {
    case 'openai':
      return new OpenAIProvider(config.OPENAI_API_KEY, config.OPENAI_API_BASE);
    case 'openrouter':
      return new OpenRouterProvider(config.OPENAI_API_KEY, config.OPENAI_API_BASE);
    case 'anthropic':
      return new AnthropicProvider(process.env.ANTHROPIC_API_KEY, process.env.ANTHROPIC_API_BASE);
    case 'gemini':
      return new GeminiProvider(process.env.GEMINI_API_KEY, process.env.GEMINI_API_BASE);
    default:
      throw new Error(`Unsupported LLM provider type: ${providerType}`);
  }
}

module.exports = {
  getLLMProvider,
};
