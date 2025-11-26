
import { GoogleGenAI } from "@google/genai";
import { ChatMessage, GroundingSource, HospitalLocation } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return 'Unknown error occurred';
  }
};

// 1. General First Aid Chat with Search Grounding
export const sendFirstAidMessage = async (
  history: ChatMessage[],
  newMessage: string,
  language: string = 'en-US'
): Promise<ChatMessage> => {
  if (!process.env.API_KEY) {
    return {
      id: Date.now().toString(),
      role: 'model',
      text: "API Key missing. Please set process.env.API_KEY to use the AI.",
      timestamp: Date.now(),
      isError: true
    };
  }

  const model = 'gemini-2.5-flash';
  
  // Map language code to full language name for better prompting
  const langMap: Record<string, string> = {
    'en-US': 'English',
    'te-IN': 'Telugu',
    'hi-IN': 'Hindi',
    'ta-IN': 'Tamil'
  };
  const langName = langMap[language] || 'English';
  
  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        { role: 'user', parts: [{ text: `System: You are an expert First Aid assistant. Provide clear, step-by-step instructions. If the user asks about medical procedures (like CPR), prioritize showing diagrams or referring to images found via search. \n\nIMPORTANT: Respond in ${langName}. \n\nUser: ${newMessage}` }] }
      ],
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: `You are a helpful emergency response assistant. Keep answers concise and action-oriented. Use bullet points for steps. Respond in ${langName}.`
      }
    });

    const text = response.text || "I couldn't find an answer to that.";
    
    // Extract grounding chunks for "Images from google search" requirement
    const groundingSources: GroundingSource[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web) {
          groundingSources.push({
            title: chunk.web.title,
            uri: chunk.web.uri,
            sourceType: 'search'
          });
        }
      });
    }

    return {
      id: Date.now().toString(),
      role: 'model',
      text,
      timestamp: Date.now(),
      groundingSources
    };

  } catch (error: any) {
    console.error("Gemini Error:", error);
    return {
      id: Date.now().toString(),
      role: 'model',
      text: `Error connecting to AI: ${getErrorMessage(error)}`,
      timestamp: Date.now(),
      isError: true
    };
  }
};

// 2. Map Search for Hospitals
export const findNearbyPlaces = async (
  lat: number,
  long: number,
  query: string = "hospitals and clinics"
): Promise<{ text: string; locations: HospitalLocation[] }> => {
   if (!process.env.API_KEY) {
     return { text: "API Key Missing", locations: [] };
   }

   try {
     const response = await ai.models.generateContent({
       model: 'gemini-2.5-flash',
       contents: `Find ${query} near latitude ${lat}, longitude ${long}. List them with name, address, and rating.`,
       config: {
         tools: [{ googleMaps: {} }],
         toolConfig: {
           retrievalConfig: {
            latLng: { latitude: lat, longitude: long }
           }
         }
       }
     });

     const text = response.text || "";
     const locations: HospitalLocation[] = [];

     // Parse grounding chunks from Maps
     const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
     if (chunks) {
       chunks.forEach((chunk: any) => {
         if (chunk.web?.uri && chunk.web?.uri.includes('google.com/maps')) {
           locations.push({
             name: chunk.web.title || "Unknown Place",
             address: "View on Map",
             location: { latitude: 0, longitude: 0 } 
           });
         }
       });
     }

     return { text, locations };
   } catch (e) {
     console.error(e);
     return { text: "Failed to find location info.", locations: [] };
   }
}
