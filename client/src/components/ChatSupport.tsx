import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MessageCircle, X, Send, User, Bot } from "lucide-react";

export default function ChatSupport() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! How can I help you with your gold investment today?",
      isBot: true,
      timestamp: new Date(),
    }
  ]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const sendMessage = () => {
    if (!message.trim()) return;

    const newMessage = {
      id: messages.length + 1,
      text: message,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setMessage("");

    // Simulate bot response
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        text: "Thank you for your message. Our gold investment specialists will respond shortly. Is there anything specific about our storage or consignment services you'd like to know?",
        isBot: true,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
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

        {/* Notification Badge */}
        {!isOpen && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-xs text-white font-bold">1</span>
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
                  <p className="text-xs text-primary-foreground/80">Typically replies in minutes</p>
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
                  className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}
                  data-testid={`message-${msg.id}`}
                >
                  <div className={`flex items-start max-w-xs ${msg.isBot ? 'flex-row' : 'flex-row-reverse'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.isBot 
                        ? 'bg-primary text-primary-foreground mr-2' 
                        : 'bg-muted text-muted-foreground ml-2'
                    }`}>
                      {msg.isBot ? (
                        <Bot className="h-4 w-4" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </div>
                    <div className={`rounded-lg p-3 ${
                      msg.isBot 
                        ? 'bg-muted text-foreground' 
                        : 'bg-primary text-primary-foreground'
                    }`}>
                      <p className="text-sm">{msg.text}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {msg.timestamp.toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
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
                />
                <Button 
                  onClick={sendMessage}
                  disabled={!message.trim()}
                  size="sm"
                  data-testid="chat-send"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
