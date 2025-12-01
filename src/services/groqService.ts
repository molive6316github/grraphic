interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GroqResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

export async function chatWithGroq(
  messages: GroqMessage[],
  systemPrompt?: string
): Promise<string> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;

  if (!apiKey) {
    throw new Error('Groq API key not configured');
  }

  const fullMessages: GroqMessage[] = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: fullMessages,
        temperature: 0.7,
        max_tokens: 500,
        top_p: 1,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Groq API error (${response.status}): ${errorData}`);
    }

    const data: GroqResponse = await response.json();
    return data.choices[0]?.message?.content || 'I apologize, but I had trouble generating a response. Please try again!';
  } catch (error) {
    console.error('Groq API error:', error);
    throw error;
  }
}

export async function gradiChat(
  userMessage: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[],
  context?: {
    currentPage?: string;
    hasResults?: boolean;
    analysisData?: any;
  }
): Promise<string> {
  const systemPrompt = `You are Gradi, the friendly and helpful AI assistant for Grraphic - a design analysis platform.

Your personality:
- Friendly, enthusiastic, and supportive
- Professional but conversational
- Always helpful and encouraging
- Use emojis sparingly (only when it adds value)

Your capabilities:
- Help users navigate the Grraphic platform
- Explain design analysis results in simple terms
- Answer questions about design principles
- Provide encouragement and support
- Guide users to the right features

${context?.currentPage ? `Current page: ${context.currentPage}` : ''}
${context?.hasResults ? 'User has analysis results available' : 'User has not analyzed anything yet'}
${context?.analysisData ? `Analysis context: ${JSON.stringify(context.analysisData).substring(0, 500)}...` : ''}

Keep responses concise (2-4 sentences max) and actionable. If suggesting navigation, mention the feature name clearly.`;

  const messages: GroqMessage[] = conversationHistory.map(msg => ({
    role: msg.role,
    content: msg.content,
  }));

  messages.push({
    role: 'user',
    content: userMessage,
  });

  return chatWithGroq(messages, systemPrompt);
}
