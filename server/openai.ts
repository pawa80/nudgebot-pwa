import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  console.warn("Missing OPENAI_API_KEY environment variable. AI features will not work.");
}

// Initialize OpenAI client
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "missing-api-key" 
});

/**
 * Generate an AI response to a user's daily task
 */
export async function generateAIResponse(task: string, tone: string = "motivational"): Promise<string> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return getDefaultResponse(tone);
    }

    const toneInstructions = getToneInstructions(tone);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are a thoughtful coach that helps users reflect on their daily tasks. 
          ${toneInstructions}
          Keep your response to ONE brief paragraph (2-3 sentences maximum).`
        },
        {
          role: "user",
          content: `The user has shared the following high-impact task they plan to work on today: "${task}". 
          Provide a thought-provoking, challenging, or paradoxical response that makes them think more deeply about this task.`
        }
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    return response.choices[0].message.content?.trim() || getDefaultResponse(tone);
  } catch (error) {
    console.error("Error generating AI response:", error);
    return getDefaultResponse(tone);
  }
}

/**
 * Generate a weekly summary from a user's entries
 */
export async function generateWeeklySummary(entries: { task: string; aiResponse: string; date: Date; completed: boolean }[]): Promise<{ achievements: string; patterns: string; themes: string }> {
  try {
    if (!process.env.OPENAI_API_KEY || entries.length === 0) {
      return getDefaultSummary();
    }

    const formattedEntries = entries.map(entry => 
      `- Date: ${entry.date.toISOString().split('T')[0]}, Task: "${entry.task}", Completed: ${entry.completed ? "Yes" : "No"}`
    ).join("\n");

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `Analyze the user's daily tasks from the past week and create a brief, insightful summary focusing on three areas:
          1. Achievements - what they accomplished and completed
          2. Patterns - tendencies or habits in their task selection or completion
          3. Themes - recurring topics or focus areas
          
          Keep each section concise (1-2 sentences maximum). Return your analysis in JSON format with three keys: achievements, patterns, and themes.`
        },
        {
          role: "user",
          content: `Here are my tasks from the past week:\n${formattedEntries}`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 300,
      temperature: 0.5,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      achievements: result.achievements || "No achievements data available.",
      patterns: result.patterns || "No patterns data available.",
      themes: result.themes || "No themes data available."
    };
  } catch (error) {
    console.error("Error generating weekly summary:", error);
    return getDefaultSummary();
  }
}

// Helper functions
function getToneInstructions(tone: string): string {
  switch (tone.toLowerCase()) {
    case "motivational":
      return "Your tone should be motivational and encouraging, focusing on the potential impact and growth opportunities.";
    case "reflective":
      return "Your tone should be thoughtful and introspective, helping the user see deeper meanings and connections.";
    case "challenging":
      return "Your tone should be provocative and challenging, pushing the user to think beyond their comfort zone.";
    default:
      return "Your tone should be balanced, combining motivation with thoughtful insights.";
  }
}

function getDefaultResponse(tone: string): string {
  const responses = {
    motivational: "What if completing this task isn't just about checking a box, but about unlocking a new level of possibility? Success often creates its own momentum.",
    reflective: "Consider how this task fits into your larger journey. What does it reveal about your priorities and the future you're creating?",
    challenging: "If this is truly high-impact, how might you approach it in a way that maximizes its transformative potential rather than just getting it done?",
    default: "What new possibilities might emerge once you complete this task? Remember that each achievement creates its own horizon of new opportunities."
  };
  
  return responses[tone.toLowerCase()] || responses.default;
}

function getDefaultSummary(): { achievements: string; patterns: string; themes: string } {
  return {
    achievements: "You've been focusing on completing daily high-impact tasks. Continue building on this momentum.",
    patterns: "Your tasks show a balance between immediate needs and longer-term goals.",
    themes: "Growth and continuous improvement appear to be recurring themes in your chosen tasks."
  };
}
