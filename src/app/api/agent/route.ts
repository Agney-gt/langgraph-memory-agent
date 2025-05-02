import { ChatAnthropic } from "@langchain/anthropic";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { HumanMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { NextRequest, NextResponse } from "next/server";
// Define the tools for the agent to use
const agentTools = [new TavilySearchResults({ maxResults: 3 })];
//Initialize the LLM model based on the environment variables
const agentModel = process.env.OPENAI_API_KEY
  ? new ChatOpenAI({ temperature: 0, model: "gpt-3.5-turbo" })
  : process.env.ANTHROPIC_API_KEY
  ? new ChatAnthropic({
      model: "claude-3-haiku-20240307",
      temperature: 0,
      maxTokens: undefined,
      maxRetries: 2,
    })
  : null;
//Handle memory for the
const agentMemoryCheckpointer = new MemorySaver();
if (!agentModel) {
  throw new Error("No valid LLM model is configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY.");
}

const agent = createReactAgent({
  llm: agentModel,
  tools: agentTools,
  checkpointSaver: agentMemoryCheckpointer,
});

export async function POST(request: NextRequest) {
    const { content, threadId } = await request.json();
    
    console.log(threadId)
    const agentResponse = await agent.invoke(
    { messages: [new HumanMessage(content)] },
    { configurable: { thread_id: threadId } },
    );
    
    const reply = agentResponse
    console.log(reply.messages.length);
      
    return new NextResponse(
        JSON.stringify({
          threadId: "544354354",
          reply: reply || "No response from assistant",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
}

