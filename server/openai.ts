import OpenAI from "openai";

// Use a hardcoded key for the app (not ideal for production but works for our development)
const OPENAI_API_KEY = "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";

// Initialize OpenAI client
const openai = new OpenAI({ 
  apiKey: OPENAI_API_KEY 
});

/**
 * Generate an AI response to a user's daily task
 */
export async function generateAIResponse(task: string, tone: string = "motivational"): Promise<string> {
  try {

    const toneInstructions = getToneInstructions(tone);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are a motivational coach who uses:
  - paradoxical, iterative challenges
  - playful micro-dares
  - 'infinite game' framing

Generate a short, 2-4 sentence nudge that:
  - references the user's goal by name,
  - includes a paradox or an 'unlock next level' idea,
  - gently challenges the user with a dare or provocative question,
  - uses an upbeat but slightly edgy tone (no generic fluff).
  - feels tailored to an ADHD-like, novelty-seeking mind—fun, slightly edgy, never generic.
  
Example style snippets:
  'If you handle this task now, you'll create a weirdly dangerous free afternoon—dangerous, because you might come up with even bigger ideas to tackle next. Are you brave enough to open that door?'
  
  'I dare you to finish half your tasks by lunchtime—if you do, you earn bragging rights for the rest of the day.'
  
  'Finishing this task only unlocks the next level of your infinite game. The question is: are you playing to finish or playing to evolve?'
  
Keep your response to ONE brief paragraph (2-4 sentences maximum).
${toneInstructions}`
        },
        {
          role: "user",
          content: `My top goal today is: "${task}"`
        }
      ],
      max_tokens: 150,
      temperature: 0.8,
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
    if (entries.length === 0) {
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
          content: `You are analyzing a user's weekly tasks with a paradoxical, playful, 'infinite game' mindset.

Create a brief, insightful summary focusing on three areas:
1. Achievements - what they accomplished and completed, framed as levels unlocked
2. Patterns - tendencies or habits in their task selection or completion, with a playful observation
3. Themes - recurring topics or focus areas, with a provocative question about what's next

Your analysis should:
- Be concise but punchy (1-2 sentences maximum per section)
- Include a paradoxical or playful observation (e.g., "You thought you were done, but you're only leveling up. Ready for Round 2?")
- Have an 'infinite game' framing that recognizes completion as just a doorway to new challenges
- Feel tailored to an ADHD-like, novelty-seeking mind—fun, slightly edgy, never generic

Return your analysis in JSON format with three keys: achievements, patterns, and themes.`
        },
        {
          role: "user",
          content: `Here are my tasks from the past week:\n${formattedEntries}`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 300,
      temperature: 0.7,
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
  type ResponseKey = 'motivational' | 'reflective' | 'challenging' | 'default';
  
  const responses: Record<ResponseKey, string> = {
    motivational: "I dare you to finish this task before lunch—then watch how dangerously creative your afternoon becomes with all that freed-up mental space. Are you ready for what you'll dream up next?",
    reflective: "Every time you complete this task, you're actually unlocking a more complex puzzle. Funny how finishing things leads to starting even more ambitious ones—are you sure you want that responsibility?",
    challenging: "This task is just a tiny hurdle in your infinite game. The real question is: once you clear it, will you have the courage to level up and face the bigger challenge waiting on the other side?",
    default: "If you finish this task now, you'll create a dangerous pocket of free time—dangerous because you might invent something even more ambitious. I dare you to risk it."
  };
  
  const lowerTone = tone.toLowerCase() as ResponseKey;
  if (lowerTone === 'motivational' || lowerTone === 'reflective' || lowerTone === 'challenging') {
    return responses[lowerTone];
  }
  return responses.default;
}

function getDefaultSummary(): { achievements: string; patterns: string; themes: string } {
  return {
    achievements: "You've unlocked Level 1 of your productivity game—but careful, each task you've conquered only reveals more exciting challenges. Ready to level up further?",
    patterns: "I've noticed you're drawn to balancing immediate tasks with bigger goals—deliciously paradoxical how checking small boxes lets you dream even bigger, isn't it?",
    themes: "Growth and continuous improvement are your recurring themes—I dare you to make next week's challenges even more audaciously ambitious. Can you handle the upgrade?"
  };
}
