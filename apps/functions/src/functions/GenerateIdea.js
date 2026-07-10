const { app } = require('@azure/functions');

const PROMPTS = [
  "Redesign the homepage of a popular streaming service with a brutalist aesthetic.",
  "Create a brand identity for a coffee shop that only opens at midnight.",
  "Design a smartwatch app for tracking dreams.",
  "Develop a portfolio website using only CSS grid and 3 colors.",
  "Write a pitch for a futuristic sci-fi movie where AI are the good guys."
];

app.http('GenerateIdea', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    context.log(`GenerateIdea function processed a request for URL: "${request.url}"`);

    const randomPrompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];

    return {
      status: 200,
      jsonBody: {
        success: true,
        prompt: randomPrompt,
        message: "Microservice executed successfully via Azure Functions!"
      }
    };
  }
});
