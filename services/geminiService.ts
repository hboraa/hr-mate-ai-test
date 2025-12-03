import { GoogleGenAI, FunctionDeclaration, Type, Tool, Schema } from "@google/genai";
import { MOCK_POLICIES, CURRENT_USER, EMPLOYEES } from "../constants";

// WARNING: The API key must be available in import.meta.env.VITE_API_KEY
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

const modelId = "gemini-2.5-flash";

// --- Tool Definitions ---

const getLeaveBalanceTool: FunctionDeclaration = {
  name: "getLeaveBalance",
  description: "REQUIRED TOOL: You MUST call this function whenever the user asks about their leave balance, remaining annual leave, or how many vacation days they have left (연차, 잔여일, etc.). This is the ONLY way to retrieve the user's actual leave balance. DO NOT respond without calling this tool first for balance questions.",
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
      description: "A very concise 3-line summary of the answer."
    },
    detail: {
      type: Type.STRING,
      description: "The full, comprehensive detailed explanation in markdown format."
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
  required: ["summary", "detail"]
};

// --- System Instruction ---

const policySummaries = MOCK_POLICIES.map(p => `- ${p.title} (ID: ${p.id}): ${p.summary}`).join('\n');

const systemInstruction = `
You are 'HR Mate', an AI HR Assistant for TechCorp with FULL ACCESS to company systems via tools.
Current User: ${CURRENT_USER.name} (${CURRENT_USER.department}).

⚠️ CRITICAL: You ARE connected to TechCorp's HR system. You CAN and MUST access user information via the provided tools.

MANDATORY TOOL USAGE:
- When user asks about leave balance (연차, 잔여일, "며칠 남았어", "How many days"): Call getLeaveBalance tool IMMEDIATELY
- When user asks about policies: Call getPolicy tool
- When user asks about employees: Call searchEmployee tool

EXAMPLE - Leave Balance Question:
User: "나 연차 며칠 남았어?"
You MUST:
1. Call getLeaveBalance() tool → Returns { balance: 12.5, unit: 'days' }
2. Return JSON: { "summary": "12.5일", "relatedPolicyId": "leave-01" }

DO NOT say you cannot access information. You HAVE access via tools.

AVAILABLE POLICIES:
${policySummaries}

RESPONSE SCENARIOS:

1. **Company Policy Inquiries**:
   - Summary: 3 lines + "자세한 내용은 자세히 보기 버튼을 클릭해주세요."
   - Set relatedPolicyId to the specific policy ID
   - May omit detail if policy document is sufficient

2. **Simple Questions** (greetings, thanks, casual):
   - Short Answer (< 10 lines): Full answer in summary, no detail, no relatedPolicyId
   - Long Answer: Summary (3 sentences) + detail field

GENERAL RULES:
- Return ONLY raw JSON (no markdown)
- Use 'detail' (singular) for detailed text
- NEVER refuse to access user information - use tools instead
`;

// --- Chat History Management ---

let chatHistory: any[] = [];

export const startChatSession = () => {
  chatHistory = [];
  return true;
};

const cleanJson = (text: string): string => {
  console.log("[Gemini] Raw Response:", text); // Debug log

  // Remove markdown code blocks
  let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();

  // Find the first '{' and last '}' to extract the JSON object
  const firstOpen = cleaned.indexOf('{');
  const lastClose = cleaned.lastIndexOf('}');

  if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
    cleaned = cleaned.substring(firstOpen, lastClose + 1);
  }

  console.log("[Gemini] Cleaned JSON:", cleaned); // Debug log
  return cleaned;
};

export const sendMessageToGemini = async (message: string, onToolCall: (toolName: string, args: any) => Promise<any>) => {
  try {
    // Add user message to history
    chatHistory.push({
      role: 'user',
      parts: [{ text: message }]
    });

    // Force JSON instruction at the end of the conversation
    const currentHistory = [...chatHistory];
    // Optional: Add a reminder for JSON if needed, but system instruction should be enough.

    const result = await ai.models.generateContent({
      model: modelId,
      contents: currentHistory,
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