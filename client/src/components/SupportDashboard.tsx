import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  Ticket, 
  MessageCircle, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Search,
  Plus,
  Calendar,
  User,
  Mail,
  FileText
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import SupportTicketForm from "./SupportTicketForm";

interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  category: string;
  priority: "low" | "normal" | "high" | "urgent";
  status: "open" | "in_progress" | "waiting_customer" | "resolved" | "closed";
  customerName: string;
  customerEmail: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  lastActivity: string;
  assignedTo?: string;
  resolutionNotes?: string;
  messages?: ChatMessage[];
}

interface ChatMessage {
  id: string;
  message: string;
  isCustomer: boolean;
  timestamp: string;
  userId: string;
}

const statusConfig = {
  open: { label: "Open", color: "bg-blue-100 text-blue-800", icon: Ticket },
  in_progress: { label: "In Progress", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  waiting_customer: { label: "Waiting for You", color: "bg-orange-100 text-orange-800", icon: AlertCircle },
  resolved: { label: "Resolved", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
  closed: { label: "Closed", color: "bg-gray-100 text-gray-800", icon: CheckCircle2 },
};

const priorityConfig = {
  low: { color: "bg-green-100 text-green-800" },
  normal: { color: "bg-blue-100 text-blue-800" },
  high: { color: "bg-orange-100 text-orange-800" },
  urgent: { color: "bg-red-100 text-red-800" },
};

export default function SupportDashboard() {
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newMessage, setNewMessage] = useState("");

  const { data: tickets = [], isLoading, error } = useQuery<SupportTicket[]>({
    queryKey: ["/api/support-tickets/mine"],
  });

  const { data: ticketDetails } = useQuery<SupportTicket & { messages?: ChatMessage[] }>({
    queryKey: ["/api/support/tickets", selectedTicket?.id],
    enabled: !!selectedTicket?.id,
  });

  const filteredTickets = (tickets || []).filter((ticket: SupportTicket) =>
    ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTicketCreated = (ticket: SupportTicket) => {
    setShowNewTicketForm(false);
    setSelectedTicket(ticket);
  };

  const getStatusIcon = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config?.icon || Ticket;
    return <Icon className="h-4 w-4" />;
  };

  if (showNewTicketForm) {
    return (
      <div className="w-full">
        <div className="mb-4 sm:mb-6">
          <Button 
            variant="outline" 
            onClick={() => setShowNewTicketForm(false)}
            data-testid="button-back-to-dashboard"
            className="w-full sm:w-auto"
          >
            ← Back to Support Dashboard
          </Button>
        </div>
        <SupportTicketForm onSuccess={handleTicketCreated} />
      </div>
    );
  }

  if (selectedTicket) {
    const messages = ticketDetails?.messages || [];
    return (
      <div className="w-full">
        <div className="mb-4 sm:mb-6">
          <Button 
            variant="outline" 
            onClick={() => setSelectedTicket(null)}
            data-testid="button-back-to-tickets"
            className="w-full sm:w-auto"
          >
            ← Back to All Tickets
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Ticket Details */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <Card data-testid="ticket-details-card">
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-0">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <span className="text-sm sm:text-base">#{selectedTicket.ticketNumber}</span>
                      <Badge className={`${statusConfig[selectedTicket.status].color} w-fit`}>
                        {getStatusIcon(selectedTicket.status)}
                        <span className="ml-1 text-xs sm:text-sm">{statusConfig[selectedTicket.status].label}</span>
                      </Badge>
                    </CardTitle>
                    <p className="text-base sm:text-lg font-medium mt-2 leading-tight">{selectedTicket.subject}</p>
                  </div>
                  <Badge className={`${priorityConfig[selectedTicket.priority].color} w-fit flex-shrink-0`}>
                    <span className="text-xs">{selectedTicket.priority.toUpperCase()}</span>
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3 sm:space-y-4">
                <div>
                  <h4 className="font-medium mb-2 text-sm sm:text-base">Description</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap text-sm sm:text-base leading-relaxed">
                    {selectedTicket.description}
                  </p>
                </div>
                
                {selectedTicket.resolutionNotes && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">Resolution Notes</h4>
                    <p className="text-green-700">{selectedTicket.resolutionNotes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Messages */}
            <Card data-testid="ticket-messages-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageCircle className="h-5 w-5" />
                  <span>Conversation ({messages.length})</span>
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3 sm:space-y-4 max-h-80 sm:max-h-96 overflow-y-auto">
                  {messages.length === 0 ? (
                    <p className="text-muted-foreground text-center py-6 sm:py-8 text-sm sm:text-base">
                      No messages yet. Start the conversation below.
                    </p>
                  ) : (
                    messages.map((message: ChatMessage) => (
                      <div
                        key={message.id}
                        className={`flex ${message.isCustomer ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={`max-w-[85%] sm:max-w-xs lg:max-w-md px-3 sm:px-4 py-2 rounded-lg ${
                            message.isCustomer 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted text-foreground'
                          }`}
                        >
                          <p className="text-sm break-words">{message.message}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                {selectedTicket.status !== 'closed' && (
                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t">
                    <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2 sm:gap-0">
                      <Textarea
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1 min-h-[80px] sm:min-h-[60px]"
                        rows={3}
                        data-testid="textarea-new-message"
                      />
                      <Button 
                        disabled={!newMessage.trim()}
                        data-testid="button-send-message"
                        className="w-full sm:w-auto"
                      >
                        Send
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Ticket Info Sidebar */}
          <div className="space-y-6">
            <Card data-testid="ticket-info-sidebar">
              <CardHeader>
                <CardTitle>Ticket Information</CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Created</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(selectedTicket.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Last Activity</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(selectedTicket.lastActivity), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Category</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {selectedTicket.category.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                
                {selectedTicket.assignedTo && (
                  <div className="flex items-center space-x-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Assigned To</p>
                      <p className="text-sm text-muted-foreground">{selectedTicket.assignedTo}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold">Support Center</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Manage your support tickets and get help</p>
        </div>
        <Button 
          onClick={() => setShowNewTicketForm(true)} 
          data-testid="button-new-ticket"
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Ticket
        </Button>
      </div>

      {/* Search */}
      <div className="mb-4 sm:mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-sm sm:text-base"
            data-testid="input-search-tickets"
          />
        </div>
      </div>

      {/* Tickets List */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all" className="text-xs sm:text-sm">All Tickets</TabsTrigger>
          <TabsTrigger value="open" className="text-xs sm:text-sm">Open</TabsTrigger>
          <TabsTrigger value="resolved" className="text-xs sm:text-sm">Resolved</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-3 sm:space-y-4">
          {isLoading ? (
            <div className="text-center py-6 sm:py-8">
              <p className="text-muted-foreground text-sm sm:text-base">Loading your tickets...</p>
            </div>
          ) : filteredTickets.length === 0 ? (
            <Card>
              <CardContent className="text-center py-6 sm:py-8">
                <Ticket className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                <p className="text-muted-foreground mb-3 sm:mb-4 text-sm sm:text-base">
                  {searchTerm ? "No tickets match your search." : "You haven't created any support tickets yet."}
                </p>
                <Button onClick={() => setShowNewTicketForm(true)} className="w-full sm:w-auto">
                  Create Your First Ticket
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredTickets.map((ticket: SupportTicket) => (
              <Card 
                key={ticket.id} 
                className="cursor-pointer hover:shadow-md transition-shadow active:scale-95"
                onClick={() => setSelectedTicket(ticket)}
                data-testid={`ticket-card-${ticket.id}`}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:space-x-3 mb-2">
                        <p className="font-medium text-sm sm:text-base">#{ticket.ticketNumber}</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge className={`${statusConfig[ticket.status].color} text-xs`}>
                            {getStatusIcon(ticket.status)}
                            <span className="ml-1">{statusConfig[ticket.status].label}</span>
                          </Badge>
                          <Badge variant="outline" className={`${priorityConfig[ticket.priority].color} text-xs`}>
                            {ticket.priority.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      
                      <h3 className="font-semibold text-base sm:text-lg mb-2 leading-tight">{ticket.subject}</h3>
                      <p className="text-muted-foreground text-xs sm:text-sm mb-3 line-clamp-2 leading-relaxed">
                        {ticket.description}
                      </p>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:space-x-4 text-xs sm:text-sm text-muted-foreground">
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">Created {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">Updated {formatDistanceToNow(new Date(ticket.lastActivity), { addSuffix: true })}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
        
        <TabsContent value="open">
          {/* Filter for open tickets */}
        </TabsContent>
        
        <TabsContent value="resolved">
          {/* Filter for resolved tickets */}
        </TabsContent>
      </Tabs>
    </div>
  );
}