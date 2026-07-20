const LLMProvider = require('./LLMProvider');

class GeminiProvider extends LLMProvider {
  constructor(apiKey, apiBase) {
    super();
    this.apiKey = apiKey;
    this.apiBase = apiBase || 'https://generativelanguage.googleapis.com/v1beta/models';
  }

  async executeChat(options) {
    const { model = 'gemini-1.5-flash', messages, temperature = 0.7 } = options;
    const contents = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const systemMessage = messages.find(m => m.role === 'system');
    const systemInstruction = systemMessage 
      ? { parts: [{ text: systemMessage.content }] }
      : undefined;

    const url = `${this.apiBase}/${model}:generateContent?key=${this.apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        systemInstruction,
        generationConfig: {
          temperature,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || 
        `Gemini API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const outputText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const prompt_tokens = data.usageMetadata?.promptTokenCount || 0;
    const completion_tokens = data.usageMetadata?.candidatesTokenCount || 0;

    return {
      output: outputText,
      usage: {
        prompt_tokens,
        completion_tokens,
        total_tokens: prompt_tokens + completion_tokens,
      },
      model,
    };
  }
}

module.exports = GeminiProvider;
