import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MessageSquare, Clock, User, Send, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MobileBackNav from "@/components/MobileBackNav";
import { useLocation } from "wouter";

export default function SupportTicket() {
  const [match, params] = useRoute("/support/:ticketId");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const ticketId = params?.ticketId;
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: ticket, isLoading, error } = useQuery({
    queryKey: ["/api/support-tickets", ticketId],
    queryFn: async () => {
      if (!ticketId) return null;
      const response = await apiRequest("GET", `/api/support/tickets/${ticketId}`);
      if (!response.ok) {
        if (response.status === 404) throw new Error("Ticket not found");
        throw new Error("Failed to fetch ticket");
      }
      return response.json();
    },
    enabled: !!ticketId && !!user,
    retry: false,
  }) as { data: any, isLoading: boolean, error: any };

  // Fetch chat messages for this ticket
  const { data: messages = [], isLoading: messagesLoading, refetch: refetchMessages } = useQuery({
    queryKey: ["/api/chat/ticket", ticketId],
    queryFn: async () => {
      if (!ticketId) return [];
      const response = await apiRequest("GET", `/api/chat/ticket/${ticketId}`);
      if (!response.ok) {
        if (response.status === 404) return [];
        throw new Error("Failed to fetch messages");
      }
      return response.json();
    },
    enabled: !!ticketId && !!user,
    refetchInterval: 5000, // Refresh every 5 seconds for new messages
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", `/api/chat/ticket/${ticketId}/message`, {
        message: message.trim()
      });
      if (!response.ok) throw new Error("Failed to send message");
      return response.json();
    },
    onSuccess: () => {
      setNewMessage("");
      refetchMessages();
      toast({
        title: "Message Sent",
        description: "Your message has been sent to the support team.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Message",
        description: error.message || "There was an error sending your message.",
        variant: "destructive",
      });
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(newMessage);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation 
          goldPrice={2034.50}
          onLogin={() => setLocation("/auth")}
          onRegister={() => setLocation("/auth")}
        />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Please log in to view support tickets</h1>
            <Button onClick={() => setLocation("/auth")}>Log In</Button>
          </div>
        </main>

      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation 
          goldPrice={2034.50}
          onLogin={() => setLocation("/auth")}
          onRegister={() => setLocation("/auth")}
        />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <p>Loading support ticket...</p>
          </div>
        </main>

      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation 
          goldPrice={2034.50}
          onLogin={() => setLocation("/auth")}
          onRegister={() => setLocation("/auth")}
        />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setLocation("/dashboard?tab=support")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
          
          <Card>
            <CardContent className="text-center py-12">
              <h1 className="text-2xl font-bold mb-4">Support Ticket Not Found</h1>
              <p className="text-muted-foreground mb-4">
                The support ticket you're looking for doesn't exist or you don't have permission to view it.
              </p>
              <Button onClick={() => setLocation("/dashboard?tab=support")}>
                Back to Support Tickets
              </Button>
            </CardContent>
          </Card>
        </main>

      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'resolved':
        return 'default';
      case 'open':
        return 'secondary';
      case 'pending':
        return 'outline';
      case 'escalated':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'secondary';
      case 'medium':
        return 'outline';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation 
        goldPrice={2034.50}
        onLogin={() => setLocation("/auth")}
        onRegister={() => setLocation("/auth")}
      />
      
      <MobileBackNav 
        title="Support Ticket" 
        backPath="/dashboard?tab=support" 
        subtitle={`Ticket #${ticket?.id?.slice(0, 8) || ''}`}
      />
      
      <main className="max-w-4xl mx-auto px-4 py-8 mobile-padding">
        {/* Header - Desktop Only */}
        <div className="hidden md:flex items-center gap-4 mb-8">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setLocation("/dashboard?tab=support")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Support
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Support Ticket</h1>
            <p className="text-muted-foreground">Ticket #{ticket.id.slice(0, 8)}</p>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="md:hidden mb-6">
          <h1 className="text-2xl font-bold">Support Ticket</h1>
          <p className="text-muted-foreground">Ticket #{ticket.id.slice(0, 8)}</p>
        </div>

        {/* Ticket Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <MessageSquare className="h-5 w-5" />
                    {ticket.subject}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Category: {ticket.category} • Priority: {ticket.priority}
                  </CardDescription>
                </div>
                <div className="flex flex-col gap-2">
                  <Badge variant={getStatusColor(ticket.status)}>
                    {ticket.status.replace(/_/g, ' ')}
                  </Badge>
                  <Badge variant={getPriorityColor(ticket.priority)}>
                    {ticket.priority} priority
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                  {ticket.description}
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Customer:</span>
                  <span>{ticket.customerName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Created:</span>
                  <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {ticket.assignedTo && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Assigned to:</span>
                  <span className="ml-2">Support Agent</span>
                </div>
              )}

              {ticket.resolvedAt && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Resolved on:</span>
                  <span className="ml-2">{new Date(ticket.resolvedAt).toLocaleDateString()}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chat/Communication Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Communication
                </span>
                {messages.length > 0 && (
                  <Badge variant="outline">{messages.length} messages</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Chat with our support team about this ticket
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Messages Display */}
              <div className="space-y-3 max-h-96 overflow-y-auto border rounded-lg p-4 bg-muted/20">
                {messagesLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Loading messages...</p>
                  </div>
                ) : messages.length > 0 ? (
                  <>
                    {messages.map((message: any, index: number) => (
                      <div 
                        key={message.id || index} 
                        className={`flex ${message.isCustomer ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={`max-w-[80%] rounded-lg px-4 py-2 ${
                            message.isCustomer 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-white border shadow-sm'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium">
                              {message.isCustomer ? 'You' : 'Support Agent'}
                            </span>
                            <span className="text-xs opacity-70">
                              {message.createdAt && !isNaN(new Date(message.createdAt).getTime()) ? 
                                new Date(message.createdAt).toLocaleString() : 
                                'Just now'
                              }
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">No messages yet</p>
                    <p className="text-xs text-muted-foreground">Start the conversation below</p>
                  </div>
                )}
              </div>

              {/* Message Input */}
              {ticket.status !== 'resolved' && (
                <form onSubmit={handleSendMessage} className="space-y-3">
                  <Textarea
                    placeholder="Type your message to the support team..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={sendMessageMutation.isPending}
                    className="min-h-[80px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                      Press Enter to send, Shift+Enter for new line
                    </p>
                    <Button 
                      type="submit" 
                      size="sm"
                      disabled={!newMessage.trim() || sendMessageMutation.isPending}
                    >
                      {sendMessageMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}

              {ticket.status === 'resolved' && (
                <div className="text-center py-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    This ticket has been resolved. If you need further assistance, please create a new ticket.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between">
            <Button 
              variant="outline"
              onClick={() => setLocation("/customer-support")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Support Center
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => setLocation("/customer-support?tab=create")}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Create New Ticket
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}