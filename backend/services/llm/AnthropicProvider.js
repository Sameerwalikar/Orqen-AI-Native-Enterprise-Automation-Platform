const LLMProvider = require('./LLMProvider');

class AnthropicProvider extends LLMProvider {
  constructor(apiKey, apiBase) {
    super();
    this.apiKey = apiKey;
    this.apiBase = apiBase || 'https://api.anthropic.com/v1';
  }

  async executeChat(options) {
    const { model, messages, temperature = 0.7 } = options;
    const systemMessage = messages.find(m => m.role === 'system');
    const system = systemMessage ? systemMessage.content : undefined;
    const userMessages = messages.filter(m => m.role !== 'system');

    const response = await fetch(`${this.apiBase}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model || 'claude-3-5-sonnet-20241022',
        messages: userMessages,
        system,
        temperature,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || 
        `Anthropic API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    return {
      output: data.content[0]?.text || '',
      usage: {
        prompt_tokens: data.usage?.input_tokens || 0,
        completion_tokens: data.usage?.output_tokens || 0,
        total_tokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
      },
      model: data.model || model,
    };
  }
}

module.exports = AnthropicProvider;
