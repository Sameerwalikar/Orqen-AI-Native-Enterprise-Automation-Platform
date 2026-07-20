const LLMProvider = require('./LLMProvider');

class OpenAIProvider extends LLMProvider {
  constructor(apiKey, apiBase) {
    super();
    this.apiKey = apiKey;
    this.apiBase = apiBase || 'https://api.openai.com/v1';
  }

  async executeChat(options) {
    const { model, messages, temperature = 0.7 } = options;
    const response = await fetch(`${this.apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'gpt-4o-mini',
        messages,
        temperature,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || 
        `OpenAI API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    return {
      output: data.choices[0]?.message?.content || '',
      usage: data.usage || {},
      model: data.model || model,
    };
  }
}

module.exports = OpenAIProvider;
