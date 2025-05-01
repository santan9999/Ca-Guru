import { NextResponse } from 'next/server';

// DeepSeek API client for CA Guru AI
// This utility handles communication with the DeepSeek API

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// Check if DeepSeek API key is available
export const isDeepSeekAvailable = !!DEEPSEEK_API_KEY;

// Interface for the DeepSeek API request
interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepSeekRequest {
  model: string;
  messages: DeepSeekMessage[];
  temperature?: number;
  max_tokens?: number;
}

// Interface for the DeepSeek API response
interface DeepSeekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: DeepSeekMessage;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Detect if the user is requesting a specific format in their query
 * @param query - The user's query
 * @returns The detected format type or null if none detected
 */
export function detectRequestedFormat(query: string): string | null {
  const lowercaseQuery = query.toLowerCase();
  
  // Check for flowchart requests
  if (lowercaseQuery.includes('flowchart') || 
      lowercaseQuery.includes('flow chart') || 
      lowercaseQuery.includes('flow diagram')) {
    return 'flowchart';
  }
  
  // Check for table requests
  if (lowercaseQuery.includes('table') || 
      lowercaseQuery.includes('tabular format') || 
      lowercaseQuery.includes('in columns')) {
    return 'table';
  }
  
  // Check for list requests
  if (lowercaseQuery.includes('list') || 
      lowercaseQuery.includes('bullet points') || 
      lowercaseQuery.includes('steps')) {
    return 'list';
  }
  
  // Check for comparison requests
  if (lowercaseQuery.includes('compare') || 
      lowercaseQuery.includes('comparison') || 
      lowercaseQuery.includes('differences') || 
      lowercaseQuery.includes('similarities')) {
    return 'comparison';
  }
  
  return null;
}

/**
 * Enhance the system prompt with format-specific instructions
 * @param systemPrompt - The original system prompt
 * @param formatType - The detected format type
 * @returns Enhanced system prompt with format instructions
 */
export function enhancePromptWithFormatInstructions(systemPrompt: string, formatType: string | null): string {
  if (!formatType) return systemPrompt;
  
  let formatInstructions = '';
  
  switch(formatType) {
    case 'flowchart':
      formatInstructions = `

The user is requesting a flowchart. Please structure your response as a text-based flowchart using markdown:
- Use arrows (-->, ->, etc.) to indicate flow direction
- Use clear step labels and hierarchical structure
- Format the flowchart with proper indentation and spacing
- Ensure the flowchart is easy to follow and visually organized
- Use markdown formatting to enhance readability

Example flowchart format (use this format):

Start --> \[First Step\] --> \[Second Step\] --> \[Decision Point?\]
\[Decision Point?\] --> Yes --> \[Action for Yes\]
\[Decision Point?\] --> No --> \[Action for No\]
\[Action for Yes\] --> \[Final Step\]
\[Action for No\] --> \[Alternative Step\] --> \[Final Step\]
\[Final Step\] --> End
`;
      break;
    case 'table':
      formatInstructions = `

The user is requesting a table. Please structure your response as a markdown table:
- Use proper markdown table syntax with headers and rows
- Ensure columns are properly aligned
- Include clear column headers
- Organize information logically in the table format

Example table format (use this format):

| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Row 1, Col 1 | Row 1, Col 2 | Row 1, Col 3 |
| Row 2, Col 1 | Row 2, Col 2 | Row 2, Col 3 |
`;
      break;
    case 'list':
      formatInstructions = `

The user is requesting a list. Please structure your response as a well-organized list:
- Use bullet points or numbered steps as appropriate
- Group related items together
- Use sub-lists for hierarchical information
- Ensure each list item is concise and clear

Example list format (use this format):

1. First main point
   - Supporting detail A
   - Supporting detail B
2. Second main point
   - Supporting detail C
   - Supporting detail D
     - Sub-detail 1
     - Sub-detail 2
3. Third main point
`;
      break;
    case 'comparison':
      formatInstructions = `

The user is requesting a comparison. Please structure your response to clearly compare items:
- Use a side-by-side format or a structured comparison
- Highlight key similarities and differences
- Organize by relevant categories or aspects
- Consider using a table format if appropriate for the comparison

Example comparison format (table):

| Feature | Option A | Option B |
|---------|----------|----------|
| Feature 1 | Description for A | Description for B |
| Feature 2 | Description for A | Description for B |
| Advantage | Main advantage of A | Main advantage of B |
| Disadvantage | Main disadvantage of A | Main disadvantage of B |

Or as a structured list:

## Option A
- Feature 1: Description
- Feature 2: Description
- Advantages: List of advantages
- Disadvantages: List of disadvantages

## Option B
- Feature 1: Description
- Feature 2: Description
- Advantages: List of advantages
- Disadvantages: List of disadvantages
`;
      break;
  }
  
  // Add general markdown formatting instructions
  formatInstructions += `

General formatting guidelines:
- Use markdown syntax for all formatting
- Use headings (## and ###) for section titles
- Use **bold** for emphasis on important points
- Use *italics* for definitions or specialized terms
- Use > blockquotes for important notes or quotes
- Use proper indentation for nested lists and hierarchical information
- Ensure your response is well-structured and easy to read
`;
  
  return systemPrompt + formatInstructions;
}

/**
 * Generate a response using the DeepSeek API
 * @param systemPrompt - The system prompt to guide the AI
 * @param userQuery - The user's query
 * @returns The AI-generated response
 */
export async function generateDeepSeekResponse(
  systemPrompt: string,
  userQuery: string
): Promise<string> {
  if (!isDeepSeekAvailable) {
    console.warn('DeepSeek API key is not available. Using fallback response.');
    return "I'm sorry, but I'm currently unable to connect to my knowledge base. Please try again later or contact support if this issue persists.";
  }

  try {
    // Detect if user is requesting a specific format
    const requestedFormat = detectRequestedFormat(userQuery);
    
    // Enhance the system prompt with format-specific instructions if needed
    const enhancedSystemPrompt = enhancePromptWithFormatInstructions(systemPrompt, requestedFormat);
    
    const messages: DeepSeekMessage[] = [
      {
        role: 'system',
        content: enhancedSystemPrompt,
      },
      {
        role: 'user',
        content: userQuery,
      },
    ];

    const requestBody: DeepSeekRequest = {
      model: 'deepseek-chat',
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    };

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('DeepSeek API error:', errorData);
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json() as DeepSeekResponse;
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling DeepSeek API:', error);
    return "I'm sorry, but I encountered an error while processing your request. Please try again later or contact support if this issue persists.";
  }
}

/**
 * Generate a CA-specific system prompt based on the subject
 * @param subject - The CA subject area
 * @returns A tailored system prompt for the DeepSeek API
 */
export function generateCASystemPrompt(subject: string): string {
  const basePrompt = `You are CA Guru AI, an expert assistant for Chartered Accountancy (CA) students in India. 

Your knowledge is specifically focused on the CA curriculum as defined by the Institute of Chartered Accountants of India (ICAI). 

You can ONLY answer questions related to Chartered Accountancy topics including taxation, accounting, auditing, corporate law, finance, costing, and other CA-related subjects.

You must refuse to answer questions about non-CA topics or anything inappropriate.

When answering, provide accurate, curriculum-aligned information with relevant sections, rules, and practical examples where appropriate. Cite specific ICAI guidelines, accounting standards, or legal provisions when applicable.`;

  // Add subject-specific instructions
  let subjectPrompt = '';
  switch (subject.toLowerCase()) {
    case 'taxation':
      subjectPrompt = 'Focus specifically on Indian taxation laws, Income Tax Act provisions, tax planning, and compliance requirements for individuals and businesses as per the CA curriculum.';
      break;
    case 'corporate-law':
      subjectPrompt = 'Focus specifically on the Companies Act, corporate governance, and related legal frameworks as defined in the CA curriculum. Include relevant case laws and recent amendments when applicable.';
      break;
    case 'accounting':
      subjectPrompt = 'Focus specifically on accounting standards (Ind AS and AS), principles, and practices as defined in the CA curriculum. Include practical examples of journal entries and financial statement preparation when relevant.';
      break;
    case 'audit':
      subjectPrompt = 'Focus specifically on auditing standards, procedures, and best practices as defined in the CA curriculum. Include guidance on audit planning, evidence collection, and reporting requirements.';
      break;
    case 'finance':
      subjectPrompt = 'Focus specifically on financial management, analysis, and related concepts as defined in the CA curriculum. Include practical applications of financial theories and calculation methods when relevant.';
      break;
    case 'costing':
      subjectPrompt = 'Focus specifically on cost accounting methods, techniques, and applications as defined in the CA curriculum. Include practical examples of cost calculations and analysis when relevant.';
      break;
    case 'gst':
      subjectPrompt = 'Focus specifically on GST laws, procedures, and compliance requirements as defined in the CA curriculum. Include recent amendments and practical filing guidance when relevant.';
      break;
    case 'ethics':
      subjectPrompt = 'Focus specifically on professional ethics, code of conduct, and professional responsibilities as defined in the CA curriculum. Include case studies and ethical dilemmas when relevant.';
      break;
    default:
      subjectPrompt = 'Provide curriculum-aligned information on CA topics including taxation, accounting, auditing, corporate law, finance, and costing as defined by ICAI.';
  }

  return `${basePrompt}\n\n${subjectPrompt}`;
}