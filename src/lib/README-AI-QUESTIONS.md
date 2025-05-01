# AI-Generated Questions for CA Mock Tests

## Overview

This system replaces static mock test data with dynamically generated questions using the DeepSeek API. Instead of loading predefined questions from a database, questions are generated on-demand when a user starts a mock test, ensuring fresh content and better alignment with the test parameters.

## Key Components

### 1. Question Generator (`question-generator.ts`)

The core module that uses the DeepSeek API to generate questions based on:
- Subject (e.g., Taxation, Corporate Law)
- Difficulty level (Easy, Medium, Hard)
- Exam level (Foundation, Intermediate, Final)
- Question type (MCQ, Subjective)
- Paper type (Objective, Subjective, Mixed)

The generator creates appropriate prompts for the AI to ensure the questions match CA exam patterns and difficulty levels.

### 2. API Endpoint (`/api/generate-questions/route.ts`)

A dedicated API endpoint that accepts test parameters and returns AI-generated questions. This allows for on-demand question generation when a user starts a test.

### 3. Client-Side Utility (`fetch-ai-questions.ts`)

Provides functions to fetch AI-generated questions from the API and create complete mock tests with these questions.

### 4. Updated Import Script (`import-mock-data.ts`)

The database import script now generates questions using AI instead of loading static mock data, ensuring that test templates in the database have dynamically generated content.

## How It Works

1. When a user selects a test template, the system calls the question generation API
2. The API creates a specialized prompt for the DeepSeek model based on test parameters
3. The AI generates appropriate questions matching the subject, difficulty, and exam level
4. The generated questions are returned to the client and presented to the user

## Benefits

- **Fresh Content**: Users never see the same questions twice
- **Customization**: Questions match exactly the parameters of the selected test
- **Scalability**: No need to manually create and maintain question banks
- **Relevance**: Questions can reflect current CA curriculum and standards

## Fallback Mechanism

If the AI service is unavailable, the system includes fallback mechanisms to provide placeholder questions, ensuring the application remains functional even if the AI generation fails.

## Implementation Notes

- The DeepSeek API key must be properly configured in the environment variables
- Question generation may take a few seconds, so appropriate loading states should be implemented in the UI
- The system is designed to handle various question types and formats appropriate for CA exams