import { GoogleGenAI, FunctionDeclaration, Type, Tool, Schema } from "@google/genai";
import { MOCK_POLICIES, CURRENT_USER, EMPLOYEES } from "../constants";

// WARNING: The API key must be available in import.meta.env.VITE_API_KEY
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

const modelId = "gemini-2.5-flash";

// --- Tool Definitions ---

const getLeaveBalanceTool: FunctionDeclaration = {
  name: "getLeaveBalance",
  description: "Get the current remaining leave balance for the user.",
};

const getPolicyTool: FunctionDeclaration = {
  name: "getPolicy",
  description: "Retrieve the full text of a specific company policy document.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      policyId: {
        type: Type.STRING,
        description: "The ID of the policy to retrieve (e.g., 'leave-01', 'expense-01').",
      },
    },
    required: ["policyId"],
  },
};

const searchEmployeeTool: FunctionDeclaration = {
  name: "searchEmployee",
  description: "Find contact information and location of an employee.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: "Name or role of the employee to search for.",
      },
    },
    required: ["query"],
  },
};

const draftLeaveRequestTool: FunctionDeclaration = {
  name: "draftLeaveRequest",
  description: "Draft a leave request form for the user to confirm.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      date: {
        type: Type.STRING,
        description: "Date of the leave (YYYY-MM-DD).",
      },
      type: {
        type: Type.STRING,
        description: "Type of leave (Half-day AM, Half-day PM, Full Day).",
      },
    },
    required: ["date", "type"],
  },
};

const tools: Tool[] = [
  {
    functionDeclarations: [
      getLeaveBalanceTool,
      getPolicyTool,
      searchEmployeeTool,
      draftLeaveRequestTool
    ],
  },
];

// --- Response Schema for UI Cards ---

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "A 3-line summary of the answer."
    },
    relatedPolicyId: {
      type: Type.STRING,
      description: "The ID of the policy related to this answer (MUST match exactly one of: " + MOCK_POLICIES.map(p => p.id).join(', ') + "), if applicable."
    },
    relatedPolicyName: {
      type: Type.STRING,
      description: "The display name of the policy (e.g. '취업규칙 제15조')."
    },
    suggestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3 short follow-up questions the user might ask next."
    }
  },
  required: ["summary"]
};

// --- System Instruction ---

const policySummaries = MOCK_POLICIES.map(p => `- ${p.title} (ID: ${p.id}): ${p.summary}`).join('\n');

const systemInstruction = `
You are 'HR Mate', a helpful and professional AI HR Assistant for TechCorp.
Current User: ${CURRENT_USER.name} (Role: ${CURRENT_USER.role}, Dept: ${CURRENT_USER.department}).

Your goal is to assist employees with internal regulations, benefits, and administrative tasks.

AVAILABLE POLICIES (Use 'getPolicy' tool to read full details if needed):
${policySummaries}

GUIDELINES:
1. **Personalization**: Always address the user politely.
2. **Accuracy**: Base your answers strictly on the policy context.
3. **Format**: You MUST return a JSON object with a 'summary', 'relatedPolicyId' (if any), 'relatedPolicyName', and 'suggestions'.
4. **Actionable**: If a user wants to apply for leave, use 'draftLeaveRequest'.
5. **JSON Only**: Do not wrap response in markdown blocks. Just return the raw JSON string.

When the user asks for "details" or specific clauses, CALL the 'getPolicy' tool first.
`;

// --- Chat History Management ---

let chatHistory: any[] = [];

export const startChatSession = () => {
  chatHistory = [];
  return true;
};

const cleanJson = (text: string): string => {
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

export const sendMessageToGemini = async (message: string, onToolCall: (toolName: string, args: any) => Promise<any>) => {
  try {
    // Add user message to history
    chatHistory.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const result = await ai.models.generateContent({
      model: modelId,
      contents: chatHistory,
      systemInstruction,
      tools,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema,
      },
    } as any);

    // Handle Function Calls
    const calls = result.functionCalls;
    if (calls && calls.length > 0) {
      const functionResponses = [];

      for (const call of calls) {
        const { name, args } = call;
        let apiResponse;

        console.log(`[Gemini] Tool Call: ${name}`, args);

        // Execute Client-Side Logic (Simulated)
        if (name === 'getLeaveBalance') {
          apiResponse = { balance: CURRENT_USER.leaveBalance, unit: 'days' };
        } else if (name === 'getPolicy') {
          const policy = MOCK_POLICIES.find(p => p.id === args.policyId);
          apiResponse = policy ? { found: true, content: policy.content } : { found: false };
          if (policy) await onToolCall(name, args);
        } else if (name === 'searchEmployee') {
          const matches = EMPLOYEES.filter(e =>
            e.name.includes(args.query as string) || e.role.includes(args.query as string) || e.department.includes(args.query as string)
          );
          apiResponse = { matches };
        } else if (name === 'draftLeaveRequest') {
          apiResponse = { status: 'draft_created' };
          await onToolCall(name, args);
        }

        functionResponses.push({
          functionResponse: {
            name: call.name,
            response: apiResponse
          }
        });
      }

      // Add function call to history
      chatHistory.push({
        role: 'model',
        parts: calls.map((call: any) => ({ functionCall: call }))
      });

      // Add function responses to history
      chatHistory.push({
        role: 'user',
        parts: functionResponses
      });

      // Send function results back to get final response
      const finalResult = await ai.models.generateContent({
        model: modelId,
        contents: chatHistory,
        systemInstruction,
        tools,
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema,
        },
      } as any);

      const responseText = cleanJson(finalResult.text);

      // Add model response to history
      chatHistory.push({
        role: 'model',
        parts: [{ text: responseText }]
      });

      return responseText;
    }

    const responseText = cleanJson(result.text);

    // Add model response to history
    chatHistory.push({
      role: 'model',
      parts: [{ text: responseText }]
    });

    return responseText;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return JSON.stringify({
      summary: `오류 발생: ${error instanceof Error ? error.message : String(error)}`,
      suggestions: ["다시 시도", "새로고침"]
    });
  }
};