import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MessageCircle, X, Send, User, Bot, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ChatMessage {
  id: string;
  message: string;
  isCustomer: boolean;
  timestamp: string;
  sessionId: string;
}

export default function ChatSupport() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: user } = useQuery({
    queryKey: ["/api/user"],
    retry: false,
  }) as { data: any };

  // Initialize chat when opened
  useEffect(() => {
    if (isOpen && user) {
      setIsConnected(true);
      // Load existing support ticket or create one
      loadOrCreateTicket();
    }
  }, [isOpen, user]);

  const loadOrCreateTicket = async () => {
    try {
      // Try to get user's existing open ticket
      const response = await apiRequest("GET", "/api/support-tickets/mine");
      if (response.ok) {
        const tickets = await response.json();
        const openTicket = tickets.find((t: any) => t.status === 'open');
        
        if (openTicket) {
          setSessionId(openTicket.id);
          // Load messages for this ticket
          const messagesResponse = await apiRequest("GET", `/api/chat/ticket/${openTicket.id}`);
          if (messagesResponse.ok) {
            const ticketMessages = await messagesResponse.json();
            setMessages(ticketMessages.map((msg: any) => ({
              id: msg.id,
              message: msg.message,
              isCustomer: msg.isCustomer,
              timestamp: msg.timestamp,
              sessionId: msg.sessionId
            })));
          }
        } else {
          // Show initial greeting
          setMessages([{
            id: 'greeting',
            message: "Hello! I'm here to help you with your gold investment questions. How can I assist you today?",
            isCustomer: false,
            timestamp: new Date().toISOString(),
            sessionId: 'system'
          }]);
        }
      }
    } catch (error) {
      console.error('Error loading chat:', error);
      setMessages([{
        id: 'greeting',
        message: "Hello! I'm here to help you with your gold investment questions. How can I assist you today?",
        isCustomer: false,
        timestamp: new Date().toISOString(),
        sessionId: 'system'
      }]);
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Poll for new messages when there's an active session
  useEffect(() => {
    if (!sessionId || !isOpen) return;
    
    const pollMessages = async () => {
      try {
        const response = await apiRequest("GET", `/api/chat/ticket/${sessionId}`);
        if (response.ok) {
          const ticketMessages = await response.json();
          const formattedMessages = ticketMessages.map((msg: any) => ({
            id: msg.id,
            message: msg.message,
            isCustomer: msg.isCustomer,
            timestamp: msg.timestamp,
            sessionId: msg.sessionId
          }));
          
          // Only update if messages changed
          setMessages(prev => {
            if (prev.length !== formattedMessages.length) {
              setIsTyping(false); // Turn off typing when new message arrives
              return formattedMessages;
            }
            return prev;
          });
        }
      } catch (error) {
        console.error('Error polling messages:', error);
      }
    };

    const interval = setInterval(pollMessages, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, [sessionId, isOpen]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const sendMessage = async () => {
    if (!message.trim() || !user) return;
    
    const messageText = message.trim();
    setMessage("");
    
    try {
      let ticketId = sessionId;
      
      // Create ticket if none exists
      if (!ticketId) {
        const ticketResponse = await apiRequest("POST", "/api/support-tickets", {
          subject: "Live Chat Support",
          description: messageText,
          category: "general",
          priority: "medium",
          customerName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          customerEmail: user.email,
          customerId: user.id
        });
        
        if (ticketResponse.ok) {
          const ticket = await ticketResponse.json();
          ticketId = ticket.id;
          setSessionId(ticketId);
        } else {
          throw new Error("Failed to create support ticket");
        }
      } else {
        // Send message to existing ticket
        const messageResponse = await apiRequest("POST", `/api/chat/ticket/${ticketId}/message`, {
          message: messageText
        });
        
        if (!messageResponse.ok) {
          throw new Error("Failed to send message");
        }
      }
      
      // Add message to UI immediately
      const newMessage: ChatMessage = {
        id: crypto.randomUUID(),
        message: messageText,
        isCustomer: true,
        timestamp: new Date().toISOString(),
        sessionId: ticketId || ''
      };
      
      setMessages(prev => [...prev, newMessage]);
      setIsTyping(true);
      
      // Auto-response for first message
      if (!sessionId) {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: crypto.randomUUID(),
            message: "Thank you for contacting us! I've received your message and our support team will respond shortly. Your ticket number is #" + (ticketId?.slice(-8) || ''),
            isCustomer: false,
            timestamp: new Date().toISOString(),
            sessionId: ticketId || ''
          }]);
          setIsTyping(false);
        }, 1500);
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getConnectionStatusIcon = () => {
    if (isConnected) {
      return <CheckCircle className="h-3 w-3 text-green-500" />;
    } else {
      return <AlertCircle className="h-3 w-3 text-orange-500" />;
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50" data-testid="chat-support">
      {/* Chat Toggle Button */}
      <div className="relative">
        <Button
          onClick={toggleChat}
          className={`w-14 h-14 rounded-full shadow-lg transition-all duration-300 ${
            isOpen ? 'bg-destructive hover:bg-destructive/90' : 'bg-primary hover:bg-primary/90'
          }`}
          data-testid="chat-toggle"
        >
          {isOpen ? (
            <X className="h-6 w-6 text-primary-foreground" />
          ) : (
            <MessageCircle className="h-6 w-6 text-primary-foreground" />
          )}
        </Button>

        {/* Connection Status Badge */}
        {!isOpen && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-background rounded-full flex items-center justify-center border border-border">
            {getConnectionStatusIcon()}
          </div>
        )}
      </div>

      {/* Chat Widget */}
      {isOpen && (
        <Card className="absolute bottom-16 right-0 chat-mobile shadow-2xl border border-border transform transition-all duration-300 ease-out mobile-card" data-testid="chat-widget">
          {/* Chat Header */}
          <CardHeader className="bg-primary text-primary-foreground p-4 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-3">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold">Gold Investment Support</p>
                  <div className="flex items-center space-x-1">
                    {getConnectionStatusIcon()}
                    <p className="text-xs text-primary-foreground/80">
                      {isConnected ? 'Live chat active' : 'Connecting...'}
                    </p>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleChat}
                className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10"
                data-testid="chat-close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          {/* Chat Messages */}
          <CardContent className="p-0 flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-background" data-testid="chat-messages">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${!msg.isCustomer ? 'justify-start' : 'justify-end'}`}
                  data-testid={`message-${msg.id}`}
                >
                  <div className={`flex items-start max-w-xs ${!msg.isCustomer ? 'flex-row' : 'flex-row-reverse'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      !msg.isCustomer 
                        ? 'bg-primary text-primary-foreground mr-2' 
                        : 'bg-muted text-muted-foreground ml-2'
                    }`}>
                      {!msg.isCustomer ? (
                        <Bot className="h-4 w-4" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </div>
                    <div className={`rounded-lg p-3 ${
                      !msg.isCustomer 
                        ? 'bg-muted text-foreground' 
                        : 'bg-primary text-primary-foreground'
                    }`}>
                      <p className="text-sm">{msg.message}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {new Date(msg.timestamp).toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Typing indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-start max-w-xs flex-row">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-primary text-primary-foreground mr-2">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="rounded-lg p-3 bg-muted text-foreground">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-border bg-card mobile-padding" data-testid="chat-input">
              <div className="flex items-center space-x-2">
                <Input
                  type="text"
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 text-base mobile-form-input"
                  data-testid="chat-message-input"
                  disabled={!isConnected}
                />
                <Button 
                  onClick={sendMessage}
                  disabled={!message.trim() || !isConnected}
                  size="sm"
                  data-testid="chat-send"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              {!isConnected && (
                <p className="text-xs text-muted-foreground mt-2">
                  Reconnecting to chat service...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
