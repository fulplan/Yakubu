import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, AlertTriangle, HelpCircle, Bug, CreditCard, Shield, FileText } from "lucide-react";

const ticketSchema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  category: z.string().min(1, "Please select a category"),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  description: z.string().min(20, "Description must be at least 20 characters"),
  customerEmail: z.string().email("Valid email required").optional().or(z.literal("")),
  customerName: z.string().min(2, "Name must be at least 2 characters").optional().or(z.literal("")),
});

type TicketFormData = z.infer<typeof ticketSchema>;

const categories = [
  { value: "general", label: "General Inquiry", icon: HelpCircle },
  { value: "account", label: "Account Issues", icon: Shield },
  { value: "consignment", label: "Consignment Support", icon: FileText },
  { value: "payment", label: "Payment & Billing", icon: CreditCard },
  { value: "technical", label: "Technical Issues", icon: Bug },
  { value: "urgent", label: "Urgent Request", icon: AlertTriangle },
];

const priorities = [
  { value: "low", label: "Low", color: "bg-green-100 text-green-800" },
  { value: "medium", label: "Medium", color: "bg-blue-100 text-blue-800" },
  { value: "high", label: "High", color: "bg-orange-100 text-orange-800" },
  { value: "urgent", label: "Urgent", color: "bg-red-100 text-red-800" },
];

interface SupportTicketFormProps {
  onSuccess?: (ticket: any) => void;
  initialData?: Partial<TicketFormData>;
  guestMode?: boolean;
}

export default function SupportTicketForm({ onSuccess, initialData, guestMode = false }: SupportTicketFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      subject: initialData?.subject || "",
      category: initialData?.category || "",
      priority: initialData?.priority || "medium",
      description: initialData?.description || "",
      customerEmail: initialData?.customerEmail || "",
      customerName: initialData?.customerName || "",
    },
  });

  const createTicketMutation = useMutation({
    mutationFn: async (data: TicketFormData) => {
      // Ensure we always send customer info, either from user or form
      const payload = {
        ...data,
        customerEmail: guestMode ? data.customerEmail : (user?.email || data.customerEmail || ""),
        customerName: guestMode ? data.customerName : (`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || data.customerName || "Anonymous User"),
        customerId: guestMode ? undefined : user?.id
      };
      
      const response = await apiRequest("POST", "/api/support-tickets", payload);
      if (!response.ok) {
        throw new Error("Failed to create support ticket");
      }
      return response.json();
    },
    onSuccess: (ticket) => {
      toast({
        title: "Support Ticket Created",
        description: `Your ticket #${ticket.ticketNumber} has been submitted. We'll respond within 24 hours.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/support-tickets/mine"] });
      form.reset();
      onSuccess?.(ticket);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create ticket",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: TicketFormData) => {
    console.log('Form submitted with data:', data);
    console.log('User:', user);
    console.log('Guest mode:', guestMode);
    
    setIsSubmitting(true);
    try {
      await createTicketMutation.mutateAsync(data);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategory = categories.find(cat => cat.value === form.watch("category"));
  const selectedPriority = priorities.find(pri => pri.value === form.watch("priority"));

  return (
    <Card className="w-full max-w-2xl mx-auto" data-testid="support-ticket-form">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          <span>Create Support Ticket</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Tell us how we can help you. Our support team typically responds within 24 hours.
        </p>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Guest contact info */}
            {guestMode && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Name *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your full name" 
                          {...field} 
                          data-testid="input-customer-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address *</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="your.email@example.com" 
                          {...field} 
                          data-testid="input-customer-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Subject */}
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Brief summary of your issue" 
                      {...field} 
                      data-testid="input-subject"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => {
                          const Icon = category.icon;
                          return (
                            <SelectItem key={category.value} value={category.value}>
                              <div className="flex items-center space-x-2">
                                <Icon className="h-4 w-4" />
                                <span>{category.label}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-priority">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {priorities.map((priority) => (
                          <SelectItem key={priority.value} value={priority.value}>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className={priority.color}>
                                {priority.label}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Please provide detailed information about your issue or question..."
                      className="min-h-[120px]"
                      {...field} 
                      data-testid="textarea-description"
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    Include any relevant details such as error messages, account information, or steps to reproduce the issue.
                  </p>
                </FormItem>
              )}
            />

            {/* Current selection preview */}
            {(selectedCategory || selectedPriority) && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Ticket Preview:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedCategory && (
                    <Badge variant="outline" className="flex items-center space-x-1">
                      <selectedCategory.icon className="h-3 w-3" />
                      <span>{selectedCategory.label}</span>
                    </Badge>
                  )}
                  {selectedPriority && (
                    <Badge className={selectedPriority.color}>
                      {selectedPriority.label} Priority
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Submit button */}
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="min-w-[120px]"
                data-testid="button-submit-ticket"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Ticket"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}