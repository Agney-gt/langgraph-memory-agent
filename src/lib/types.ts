//There are several instances where explicit types are missing, especially in the handleSubmit function. 
//The code uses some interfaces (ISimpleMessage) but fails to define interfaces for other complex objects or API responses, 
//relying on inline or implicit typing in critical areas (such as `data = await response.json()`).

export interface IApiResponse {
    reply: {
      messages: {
        kwargs: {
          content: string;
        };
      }[];
    };
  }
  
export interface ISimpleMessage {
    id: string;
    content: string;
    role: 'user' | 'assistant';
  }
  
  // Define a generic JSON value type
export type TJSONValue =
    | string
    | number
    | boolean
    | null
    | { [key: string]: TJSONValue }
    | TJSONValue[];