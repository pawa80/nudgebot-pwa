# NudgeBot - Daily Motivational Challenge App

NudgeBot is a Progressive Web App that transforms personal productivity into an engaging, gamified experience. The app generates AI-powered, paradoxical reflections that turn mundane tasks into exciting personal growth challenges.

## Features

- **Daily Check-ins**: Respond to a simple prompt: "What's the one high-impact thing you'll do today that excites + challenges you?"
- **AI-Powered Responses**: Receive thought-provoking reflections tailored to your input
- **Weekly Summaries**: Review AI-generated analyses of your achievements, patterns, and recurring themes
- **Progressive Web App**: Install on your Android home screen for quick access
- **Offline Support**: Basic functionality works even without internet connection
- **Mobile-Optimized**: Touch-friendly interface designed for smartphones

## Technology Stack

- **Frontend**: React with TypeScript, TailwindCSS, and shadcn/ui components
- **Backend**: Express.js (Node.js)
- **Database**: PostgreSQL with Drizzle ORM
- **AI Integration**: OpenAI API for generating personalized responses
- **Authentication**: JWT-based user authentication

## About

NudgeBot is specifically designed for ADHD-like, novelty-seeking mindsets with paradoxical challenges, micro-dares, and iterative thinking approaches. The daily interaction takes just 30 seconds, with a 1-minute weekly review, making it perfect for busy individuals looking to maintain focus on high-impact tasks.

## Getting Started

1. Visit the app URL
2. Create an account or log in
3. Enter your high-impact task for the day
4. Receive your personalized nudge
5. Install the PWA to your home screen for the best experience

## Development

This project is built with modern JavaScript/TypeScript tooling including Vite, React, and Express. The codebase follows a modular structure with the frontend and backend in the same repository for seamless development.

## Deploying to GitHub Pages

To deploy the client application to GitHub Pages, follow these steps:

1.  **Build the client**: Run the following command in your terminal:
    ```bash
    npm run build:client
    ```
2.  **Output Directory**: The build process will generate the static assets in the `/docs` folder in the root of the project.
3.  **GitHub Pages Configuration**:
    *   In your GitHub repository settings, navigate to the "Pages" section.
    *   Set the **Source** to "Deploy from a branch".
    *   Choose your **Branch** (e.g., `main` or your default branch).
    *   Select the **/docs** folder as the source for your site.
4.  **Live URL**: Your application will be available at a URL similar to `https://<username>.github.io/<repository-name>/`. For this specific project, the URL will be: `https://pawa80.github.io/nudgebot-pwa/`
5.  **Limitation Reminder**: Please note that this deployment method only serves the static client-side application. Backend features, including user authentication, AI-powered responses, and data storage, will not function as they require the server to be running. This deployment is suitable for previewing the UI and client-side interactions.