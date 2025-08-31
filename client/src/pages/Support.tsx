import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  Ticket, 
  BookOpen, 
  Phone, 
  Mail, 
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight
} from "lucide-react";
import SupportDashboard from "@/components/SupportDashboard";
import KnowledgeBase from "@/components/KnowledgeBase";
import ChatSupport from "@/components/ChatSupport";
import SupportTicketForm from "@/components/SupportTicketForm";

export default function Support() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["/api/user"],
    retry: false,
  });

  const { data: tickets = [] } = useQuery<any[]>({
    queryKey: ["/api/support-tickets/mine"],
    enabled: !!user,
  });

  const openTickets = tickets.filter((ticket: any) => 
    ticket.status === 'open' || ticket.status === 'in_progress'
  ).length;

  const waitingTickets = tickets.filter((ticket: any) => 
    ticket.status === 'waiting_customer'
  ).length;

  if (showNewTicketForm) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-4 sm:py-8">
          <div className="mb-4 sm:mb-6">
            <Button 
              variant="outline" 
              onClick={() => setShowNewTicketForm(false)}
              data-testid="button-back-to-support"
              className="w-full sm:w-auto mb-4 sm:mb-0"
            >
              ← Back to Support Center
            </Button>
          </div>
          <SupportTicketForm 
            onSuccess={() => {
              setShowNewTicketForm(false);
              setActiveTab("tickets");
            }}
            guestMode={!user}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="text-center mb-6 sm:mb-8 px-4 sm:px-0">
          <h1 className="text-2xl sm:text-4xl font-bold mb-2 sm:mb-3">Support Center</h1>
          <p className="text-base sm:text-xl text-muted-foreground">
            We're here to help you with your gold investment journey
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-6 sm:mb-8 h-auto">
            <TabsTrigger value="overview" data-testid="tab-overview" className="flex-col sm:flex-row gap-1 sm:gap-2 py-3 sm:py-2">
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="tickets" data-testid="tab-tickets" className="flex-col sm:flex-row gap-1 sm:gap-2 py-3 sm:py-2 relative">
              <Ticket className="h-4 w-4" />
              <span className="text-xs sm:text-sm">My Tickets</span>
              {(openTickets > 0 || waitingTickets > 0) && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 sm:relative sm:top-0 sm:right-0 sm:ml-2 w-5 h-5 sm:w-auto sm:h-auto p-0 sm:p-1 text-xs flex items-center justify-center">
                  <span className="sm:hidden">{openTickets + waitingTickets}</span>
                  <span className="hidden sm:inline">{openTickets + waitingTickets}</span>
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="knowledge" data-testid="tab-knowledge" className="flex-col sm:flex-row gap-1 sm:gap-2 py-3 sm:py-2">
              <BookOpen className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Help Center</span>
            </TabsTrigger>
            <TabsTrigger value="contact" data-testid="tab-contact" className="flex-col sm:flex-row gap-1 sm:gap-2 py-3 sm:py-2">
              <Phone className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Contact Us</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 sm:space-y-8">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow border-primary/20 hover:border-primary/40 active:scale-95"
                onClick={() => setShowNewTicketForm(true)}
                data-testid="card-new-ticket"
              >
                <CardContent className="p-4 sm:p-6 text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                    <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Create Ticket</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Get help with a specific issue
                  </p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow active:scale-95"
                onClick={() => setActiveTab("knowledge")}
                data-testid="card-browse-help"
              >
                <CardContent className="p-4 sm:p-6 text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                    <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Browse Help Center</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Find answers instantly
                  </p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow active:scale-95"
                onClick={() => setActiveTab("tickets")}
                data-testid="card-my-tickets"
              >
                <CardContent className="p-4 sm:p-6 text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                    <Ticket className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">My Tickets</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    View ticket history
                  </p>
                  {(openTickets > 0 || waitingTickets > 0) && (
                    <Badge variant="destructive" className="mt-1 sm:mt-2 text-xs">
                      {openTickets + waitingTickets} active
                    </Badge>
                  )}
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow active:scale-95"
                onClick={() => setActiveTab("contact")}
                data-testid="card-contact-us"
              >
                <CardContent className="p-4 sm:p-6 text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                    <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Live Chat</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Chat with our team
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Status Overview */}
            {user && tickets.length > 0 && (
              <Card data-testid="status-overview">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Your Support Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                        <span className="font-semibold text-blue-600 text-lg sm:text-xl">{openTickets}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-blue-700">Open Tickets</p>
                    </div>
                    
                    <div className="text-center p-3 sm:p-4 bg-orange-50 rounded-lg">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                        <span className="font-semibold text-orange-600 text-lg sm:text-xl">{waitingTickets}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-orange-700">Awaiting Response</p>
                    </div>
                    
                    <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                        <span className="font-semibold text-green-600 text-lg sm:text-xl">
                          {(tickets || []).filter((t: any) => t.status === 'resolved').length}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-green-700">Resolved Tickets</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Popular Help Articles */}
            <Card data-testid="popular-articles">
              <CardHeader>
                <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                  <span className="text-lg sm:text-xl">Popular Help Articles</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setActiveTab("knowledge")}
                    className="w-full sm:w-auto"
                  >
                    View All
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3">
                {[
                  { title: "How to create your first gold consignment", category: "Getting Started" },
                  { title: "Understanding storage fees and pricing", category: "Payments" },
                  { title: "Setting up your digital will", category: "Account" },
                  { title: "Gold purity verification process", category: "Consignment" },
                ].map((article, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors active:scale-95"
                    onClick={() => setActiveTab("knowledge")}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm sm:text-base leading-tight">{article.title}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">{article.category}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground ml-2 flex-shrink-0" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tickets">
            <div>
              <SupportDashboard />
            </div>
          </TabsContent>

          <TabsContent value="knowledge">
            <div>
              <KnowledgeBase />
            </div>
          </TabsContent>

          <TabsContent value="contact" className="space-y-6 sm:space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              {/* Contact Information */}
              <Card data-testid="contact-info">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Get in Touch</CardTitle>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    Choose the best way to reach our support team
                  </p>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6">
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base">Live Chat</h3>
                      <p className="text-muted-foreground text-xs sm:text-sm mb-2">
                        Chat with our support team in real-time. Available 24/7.
                      </p>
                      <Button size="sm" onClick={() => setShowNewTicketForm(true)} className="w-full sm:w-auto">
                        Start Chat
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base">Email Support</h3>
                      <p className="text-muted-foreground text-xs sm:text-sm mb-2">
                        Send us an email and we'll respond within 24 hours.
                      </p>
                      <p className="text-xs sm:text-sm font-medium break-all">support@goldconsignment.com</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base">Phone Support</h3>
                      <p className="text-muted-foreground text-xs sm:text-sm mb-2">
                        Call us for urgent matters. Available Mon-Fri, 9AM-6PM EST.
                      </p>
                      <p className="text-xs sm:text-sm font-medium">+1 (555) 123-4567</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Support Hours */}
              <Card data-testid="support-hours">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Support Hours</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  {[
                    { day: "Monday - Friday", time: "9:00 AM - 6:00 PM EST", available: true },
                    { day: "Saturday", time: "10:00 AM - 4:00 PM EST", available: true },
                    { day: "Sunday", time: "Emergency support only", available: false },
                  ].map((schedule, index) => (
                    <div key={index} className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm sm:text-base flex-shrink-0">{schedule.day}</span>
                      <div className="flex items-center space-x-2 min-w-0">
                        <span className="text-xs sm:text-sm text-muted-foreground text-right">{schedule.time}</span>
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          schedule.available ? 'bg-green-500' : 'bg-orange-500'
                        }`} />
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 rounded-lg">
                    <p className="text-xs sm:text-sm text-blue-700">
                      <strong>Emergency Support:</strong> For urgent security issues or account access problems, 
                      our emergency line is available 24/7 at +1 (555) 999-0000.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Chat Widget */}
      <ChatSupport />
    </div>
  );
}