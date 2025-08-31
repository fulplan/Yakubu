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
  });

  // WebSocket connection
  useEffect(() => {
    if (isOpen && !wsRef.current) {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      try {
        wsRef.current = new WebSocket(wsUrl);
        
        wsRef.current.onopen = () => {
          console.log('WebSocket connected');
          setIsConnected(true);
          
          // Authenticate if user is logged in
          if (user && wsRef.current) {
            wsRef.current.send(JSON.stringify({
              type: 'authenticate',
              userId: user.id,
              isAdmin: user.role === 'admin'
            }));
          }
        };
        
        wsRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            switch (data.type) {
              case 'authenticated':
                console.log('Authenticated with server');
                // Send initial greeting
                setMessages([{
                  id: 'greeting',
                  message: "Hello! I'm here to help you with your gold investment questions. How can I assist you today?",
                  isCustomer: false,
                  timestamp: new Date().toISOString(),
                  sessionId: 'system'
                }]);
                break;
                
              case 'chat_message':
                setMessages(prev => [...prev, {
                  id: data.id,
                  message: data.message,
                  isCustomer: data.isCustomer,
                  timestamp: data.timestamp,
                  sessionId: data.sessionId
                }]);
                setIsTyping(false);
                break;
                
              case 'error':
                toast({
                  title: "Chat Error",
                  description: data.message,
                  variant: "destructive",
                });
                break;
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
        
        wsRef.current.onclose = () => {
          console.log('WebSocket disconnected');
          setIsConnected(false);
          wsRef.current = null;
        };
        
        wsRef.current.onerror = (error) => {
          console.error('WebSocket error:', error);
          setIsConnected(false);
          toast({
            title: "Connection Error",
            description: "Unable to connect to chat service. Please try again.",
            variant: "destructive",
          });
        };
        
      } catch (error) {
        console.error('Error creating WebSocket:', error);
        toast({
          title: "Connection Error",
          description: "Unable to establish chat connection.",
          variant: "destructive",
        });
      }
    }
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
        setIsConnected(false);
      }
    };
  }, [isOpen, user, toast]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const sendMessage = async () => {
    if (!message.trim()) return;
    
    const messageText = message.trim();
    setMessage("");
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // Send via WebSocket
      wsRef.current.send(JSON.stringify({
        type: 'chat_message',
        message: messageText,
        sessionId: sessionId || crypto.randomUUID()
      }));
      
      // Add message immediately to UI
      const newMessage: ChatMessage = {
        id: crypto.randomUUID(),
        message: messageText,
        isCustomer: true,
        timestamp: new Date().toISOString(),
        sessionId: sessionId || crypto.randomUUID()
      };
      
      setMessages(prev => [...prev, newMessage]);
      setIsTyping(true);
      
    } else {
      // Fallback to HTTP if WebSocket is not available
      try {
        const response = await apiRequest("POST", "/api/support/sessions", {
          customerEmail: user?.email || "anonymous@example.com",
          customerName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : "Anonymous User",
          metadata: { source: 'chat_widget' }
        });
        
        if (response.ok) {
          const session = await response.json();
          setSessionId(session.id);
          
          // Add message to UI
          const newMessage: ChatMessage = {
            id: crypto.randomUUID(),
            message: messageText,
            isCustomer: true,
            timestamp: new Date().toISOString(),
            sessionId: session.id
          };
          
          setMessages(prev => [...prev, newMessage]);
          
          // Simulate support response
          setTimeout(() => {
            setMessages(prev => [...prev, {
              id: crypto.randomUUID(),
              message: "Thank you for contacting us! A support specialist will respond to you shortly. In the meantime, you might find our help center useful.",
              isCustomer: false,
              timestamp: new Date().toISOString(),
              sessionId: session.id
            }]);
          }, 1000);
        }
      } catch (error) {
        console.error('Error sending message:', error);
        toast({
          title: "Error",
          description: "Failed to send message. Please try again.",
          variant: "destructive",
        });
      }
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
        <Card className="absolute bottom-16 right-0 w-80 h-96 shadow-2xl border border-border transform transition-all duration-300 ease-out" data-testid="chat-widget">
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
            <div className="p-4 border-t border-border bg-card" data-testid="chat-input">
              <div className="flex items-center space-x-2">
                <Input
                  type="text"
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 text-sm"
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
