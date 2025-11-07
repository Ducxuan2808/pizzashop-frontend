import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class AiChatService {
  private apiKey = 'YOUR_GEMINI_API_KEY'; // Replace with your actual Gemini API key
  private apiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
  private chatHistory: ChatMessage[] = [];

  constructor(private http: HttpClient) {
    this.loadChatHistory();
  }

  private loadChatHistory(): void {
    const storedHistory = localStorage.getItem('chatHistory');
    if (storedHistory) {
      this.chatHistory = JSON.parse(storedHistory);
    }
  }

  private saveChatHistory(): void {
    localStorage.setItem('chatHistory', JSON.stringify(this.chatHistory));
  }

  getChatHistory(): ChatMessage[] {
    return [...this.chatHistory];
  }

  clearChatHistory(): void {
    this.chatHistory = [];
    this.saveChatHistory();
  }

  addMessageToHistory(message: ChatMessage): void {
    this.chatHistory.push(message);
    this.saveChatHistory();
  }

  sendMessage(message: string): Observable<string> {
    // Add user message to history
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    this.chatHistory.push(userMessage);
    this.saveChatHistory();

    // Create context for the AI based on previous messages (optional - for better context)
    const recentMessages = this.chatHistory
      .slice(-5) // Use last 5 messages for context
      .map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

    // Create the request payload for Gemini API
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ 
            text: message + '\n\nContext: You are an AI assistant for a pizza shop website named PizZing. Help users with questions about the pizza menu, ordering process, delivery options, and other related information. Be friendly and helpful.' 
          }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800
      }
    };

    // Make the API request
    return this.http.post<any>(
      `${this.apiEndpoint}?key=${this.apiKey}`,
      payload,
      { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) }
    ).pipe(
      map(response => {
        const aiResponseText = response.candidates[0].content.parts[0].text || 'Xin lỗi, tôi không thể trả lời câu hỏi của bạn lúc này.';
        
        // Add AI response to history
        const aiMessage: ChatMessage = {
          role: 'assistant',
          content: aiResponseText,
          timestamp: new Date()
        };
        this.chatHistory.push(aiMessage);
        this.saveChatHistory();
        
        return aiResponseText;
      }),
      catchError(error => {
        console.error('Error calling Gemini API:', error);
        const errorMessage = 'Xin lỗi, đã xảy ra lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.';
        
        // Add error response to history
        const aiMessage: ChatMessage = {
          role: 'assistant',
          content: errorMessage,
          timestamp: new Date()
        };
        this.chatHistory.push(aiMessage);
        this.saveChatHistory();
        
        return of(errorMessage);
      })
    );
  }
} 