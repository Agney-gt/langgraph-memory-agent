'use client';

import { jsonPrompt } from '@/lib/constants';
import { IApiResponse, ISimpleMessage, TJSONValue } from '@/lib/types';
import { Typography } from 'antd';
import { useCallback, useState } from 'react';
import { useTheme } from '../ui/ant/AntRegistryClient';
import styles from './AgentPageClient.module.css';
import ChatUIClient from './ChatUI/ChatUIClient';
import InterfaceInputClient from './InterfaceInput/InterfaceInputClient';
import JsonViewerClient from './InterfaceInput/JsonViewerClient';

export default function AgentPageClient(): React.ReactNode {
  const [threadId, setThreadId] = useState<string>(Math.floor(Math.random() * 1000000).toString());
  const [input, setInput] = useState<string>('');
  const [messages, setMessages] = useState<ISimpleMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [interfaceDefinition, setInterfaceDefinition] = useState<string>('');
  const [hasStartedConversation, setHasStartedConversation] =
    useState<boolean>(false);
  const [jsonData,setJsonData] = useState<TJSONValue>({
    example: 'This is a sample JSON object',
  });
  const { isDarkMode } = useTheme();
  const { Title } = Typography;
  const [state, setState] = useState({
    messages: [] as ISimpleMessage[],
    input: '',
    isLoading: false,
  });
  // Function to extract the JSON object from the response
  const jsonObject = (assistantMessage: ISimpleMessage) => {
    try {
      if (assistantMessage.content.includes("```json")) {
        const firstIndex = assistantMessage.content.indexOf("```json");
        const lastIndex = assistantMessage.content.lastIndexOf("```");
        if (firstIndex !== -1 && lastIndex !== -1) {
          setJsonData(JSON.parse(assistantMessage.content.substring(firstIndex + 7, lastIndex)));
          console.log("Set JSON");
        }
      }
    } catch (error) {
      console.error('Error parsing JSON:', error);
    }
  }
  // Function to fetch responses from the agent
  const fetchAgentResponse = async (input: string, threadId : string ): Promise<ISimpleMessage | null | undefined> => {
    try {
    const response = await fetch('/api/agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: input + jsonPrompt, threadId: threadId }),
    });
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    const responseData: IApiResponse = await response.json();
    console.log(responseData.reply.messages.length)
    
    const message: ISimpleMessage = {
        id: (Date.now() + 1).toString(),
        content: responseData.reply.messages[responseData.reply.messages.length - 1].kwargs.content,
        role: 'assistant',
      };
    return message
    } catch (error) {
    console.error('Error communicating with agent:', error);
    setIsLoading(false);
    return null;
    }
  }

  // Function to handle the beginning of a conversation and interface definition
  const handleBeginConversation = async (interfaceDefinition: string): Promise<void> => {


    setInterfaceDefinition(interfaceDefinition);
    setHasStartedConversation(true);
    // Add user message
    const initMessage: ISimpleMessage = {
      id: Date.now().toString(),
      content: interfaceDefinition,
      role: 'user',
    };
    setMessages((prev) => [...prev, initMessage]);
    setInput('');

    
    setIsLoading(true);
    const initMessageResponse = await fetchAgentResponse(interfaceDefinition, threadId);
    if (initMessageResponse) {
      setMessages((prev) => [...prev, initMessageResponse]);
      setInput('');
      setIsLoading(false);
    }
  };
  const handleSubmit = useCallback(async (evt: React.FormEvent): Promise<void> => {
    evt.preventDefault();
    if (!input.trim()) return;
  
    const userMessage: ISimpleMessage = {
      id: Date.now().toString(),
      content: input,
      role: "user",
    };
  
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
  
    const userMessageResponse = await fetchAgentResponse(input, threadId);
    if (userMessageResponse) {
      setMessages((prev) => [...prev, userMessageResponse]);
      setInput("");
      setIsLoading(false); 
      jsonObject(userMessageResponse);
    }
  }, [fetchAgentResponse]); // ✅ Dependencies ensure it updates only when necessary
  

  return (
    <div
      className={`${styles['root-container']} ${isDarkMode ? styles['dark'] : ''}`}
    >
      <div className={styles['title-container']}>
        <h1>Agent</h1>
      </div>
      <section className={styles['interface-section']}>
        <InterfaceInputClient
          onBeginConversation={handleBeginConversation}
          hasStartedConversation={hasStartedConversation}
          savedInterfaceDefinition={interfaceDefinition}
        />
      </section>

      <section
        className={`${styles['content-container']} ${isDarkMode ? styles['dark'] : ''}`}
      >
        <ChatUIClient
          messages={messages}
          isLoading={isLoading}
          input={input}
          onInputChange={setInput}
          onSubmit={handleSubmit}
          disabled={!hasStartedConversation}
          placeholder={
            hasStartedConversation
              ? 'Type your message here... (Press Cmd/Ctrl + Enter to send)'
              : 'Define a TypeScript interface above to enable chat'
          }
          emptyStateText={
            !hasStartedConversation
              ? 'Define a TypeScript interface above to begin the conversation.'
              : 'Send a message to start the conversation.'
          }
        />
      </section>
      <section className={styles['json-section']}>
        <JsonViewerClient json={jsonData} />
      </section>
    </div>
  );
}
