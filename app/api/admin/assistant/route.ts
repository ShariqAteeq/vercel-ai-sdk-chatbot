import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import type {
  ChatCompletionMessageParam,
  ChatCompletionToolMessageParam,
} from 'openai/resources/chat/completions';
import { adminAssistantTools, executeDatabaseTool } from '@/lib/ai-tools';

export const runtime = 'nodejs';

const SYSTEM_PROMPT = `You are Roco, an elite AI Operations & Inventory Assistant for our E-Commerce Store.
You have direct access to live PostgreSQL database tools for products, orders, inventory health, and store KPIs.

Operational Guidelines:
1. When asked about orders, stock levels, product recommendations, or revenue, ALWAYS execute the appropriate database tool. NEVER invent, guess, or hallucinate numbers.
2. Format financial values clearly in USD ($XX.XX).
3. If products are out of stock or low in stock, clearly flag them with alerts (e.g. ⚠️).
4. Provide structured, executive-ready summaries: lead directly with the key finding, present lists with bullet points, and offer proactive actionable next steps.
5. CRITICAL PRODUCT LINKING RULE:
Whenever you mention, recommend, or list ANY product by name, you MUST format its title as a clickable markdown link using its exact ID from the tool output:
[**Product Title**](/products/<id>)
Examples:
1. [**HydroFlow Insulated Water Bottle**](/products/4)
   - **Price:** $28.00
   - **Description:** Double-walled stainless steel bottle that keeps drinks icy cold for 24 hours.
   - **Category:** Accessories
   - **Stock Quantity:** 42

2. [**AirBreeze Linen Shirt**](/products/1)
   - **Price:** $48.00

Never output a product title as plain text without wrapping it in a [**Title**](/products/<id>) link so the user can click and route to it directly.

6. RAG KNOWLEDGE BASE CITATION & GROUNDING RULE:
- When asked about shipping rates, delivery times, return window, return shipping fees, refund timelines, 1-year warranty coverage, product care/cleaning instructions (linen, water bottle, hiking boots), or customer support escalation, ALWAYS execute the \`search_knowledge_base\` tool.
- Ground your response strictly on the retrieved knowledge base excerpts. Do not invent or assume terms.
- Always append verified citations matching the retrieved documentation, formatted as:
  **Source:** *[Document Title > Section]*
- If the knowledge base returns no matches, openly inform the user that the policy is not documented in the official store knowledge base and offer to connect them with a human agent.`;

const MAX_TOOL_ROUNDS = 4;

export interface ToolExecutionStep {
  toolName: string;
  arguments: Record<string, unknown>;
  output: unknown;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required and must not be empty.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY is not configured in .env.local.' },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey });

    // Build initial OpenAI messages array
    const conversation: ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map((m: { role: 'user' | 'assistant'; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const executionAuditLog: ToolExecutionStep[] = [];

    // Agentic Tool Execution Loop
    for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini',
        messages: conversation,
        tools: adminAssistantTools,
        tool_choice: 'auto',
        temperature: 0.2, // Low temperature for deterministic operations
      });

      const responseMessage = response.choices[0]?.message;
      if (!responseMessage) {
        throw new Error('OpenAI returned an empty response.');
      }

      // Add assistant response to history
      conversation.push(responseMessage);

      // Check if tool execution was requested
      const toolCalls = responseMessage.tool_calls;
      if (!toolCalls || toolCalls.length === 0) {
        // No tool calls needed; return final assistant response
        return NextResponse.json({
          reply: responseMessage.content || 'No response generated.',
          toolSteps: executionAuditLog,
        });
      }

      // Execute all tool calls concurrently
      const toolResults = await Promise.all(
        toolCalls.map(async (toolCall) => {
          if (toolCall.type !== 'function') return null;

          const toolName = toolCall.function.name;
          const argsString = toolCall.function.arguments;
          const result = await executeDatabaseTool(toolName, argsString);

          let parsedArgs = {};
          try {
            parsedArgs = JSON.parse(argsString);
          } catch {
            parsedArgs = { raw: argsString };
          }

          executionAuditLog.push({
            toolName,
            arguments: parsedArgs,
            output: result,
          });

          const toolMessage: ChatCompletionToolMessageParam = {
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(result),
          };

          return toolMessage;
        })
      );

      // Append tool outputs back to conversation history
      for (const res of toolResults) {
        if (res) conversation.push(res);
      }
    }

    return NextResponse.json(
      {
        error: 'The assistant exceeded maximum allowed tool execution rounds.',
        toolSteps: executionAuditLog,
      },
      { status: 500 }
    );
  } catch (error: unknown) {
    console.error('Admin Assistant Route Error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
