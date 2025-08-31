import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
// Auth is handled by ProtectedRoute wrapper
import AdminNavigation from "@/components/AdminNavigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package, 
  Gavel, 
  Coins, 
  TrendingUp,
  Plus,
  CheckCircle,
  AlertTriangle,
  FileText,
  MessageSquare,
  MessageCircle,
  BarChart3,
  Shield,
  Clock,
  User,
  Calendar,
  Edit,
  Trash2,
  Save,
  X,
  UserCheck,
  Settings,
  Eye,
  FileQuestion,
  Send,
  Bell,
  BellRing,
  Headphones,
  ArrowUp,
  Zap,
  Timer,
  UserCog,
  PhoneCall,
  MapPin,
  Truck,
  AlertCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// User Management Component
function UserManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [creditDebitDialogOpen, setCreditDebitDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [transactionType, setTransactionType] = useState<'credit' | 'debit'>('credit');
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionDescription, setTransactionDescription] = useState('');
  const [goldDialogOpen, setGoldDialogOpen] = useState(false);
  const [goldTransactionType, setGoldTransactionType] = useState<'credit' | 'debit'>('credit');
  const [goldWeight, setGoldWeight] = useState('');
  const [goldPurity, setGoldPurity] = useState('');
  const [goldDescription, setGoldDescription] = useState('');
  const [goldPurchasePrice, setGoldPurchasePrice] = useState('');
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'user'
  });

  // Fetch all users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
  }) as { data: any[], isLoading: boolean };

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await apiRequest("POST", "/api/admin/users", userData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "User Created",
        description: "New user has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsCreateDialogOpen(false);
      setNewUser({ email: '', password: '', firstName: '', lastName: '', role: 'user' });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create User",
        description: error.message || "An error occurred while creating the user.",
        variant: "destructive",
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PATCH", `/api/admin/users/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "User Updated",
        description: "User has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setEditingUser(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update User",
        description: error.message || "An error occurred while updating the user.",
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      toast({
        title: "User Deleted",
        description: "User has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Delete User",
        description: error.message || "An error occurred while deleting the user.",
        variant: "destructive",
      });
    },
  });

  // Credit/debit account mutation
  const accountTransactionMutation = useMutation({
    mutationFn: async ({ userId, type, amount, description }: { userId: string; type: 'credit' | 'debit'; amount: number; description: string }) => {
      const response = await apiRequest("POST", `/api/admin/users/${userId}/${type}`, { amount, description });
      return response.json();
    },
    onSuccess: (_, { type }) => {
      toast({
        title: "Transaction Successful",
        description: `Account ${type} completed successfully.`,
      });
      setCreditDebitDialogOpen(false);
      setTransactionAmount('');
      setTransactionDescription('');
    },
    onError: (error: any) => {
      toast({
        title: "Transaction Failed",
        description: error.message || "An error occurred during the transaction.",
        variant: "destructive",
      });
    },
  });

  // Gold credit/debit mutation
  const goldTransactionMutation = useMutation({
    mutationFn: async ({ userId, type, weight, purity, description, purchasePrice }: { 
      userId: string; 
      type: 'credit' | 'debit'; 
      weight: number; 
      purity: number; 
      description: string; 
      purchasePrice?: number 
    }) => {
      const response = await apiRequest("POST", `/api/admin/users/${userId}/${type}-gold`, { 
        weight, 
        purity, 
        description, 
        purchasePrice 
      });
      return response.json();
    },
    onSuccess: (_, { type }) => {
      toast({
        title: "Gold Transaction Successful",
        description: `Gold ${type} completed successfully.`,
      });
      setGoldDialogOpen(false);
      setGoldWeight('');
      setGoldPurity('');
      setGoldDescription('');
      setGoldPurchasePrice('');
    },
    onError: (error: any) => {
      toast({
        title: "Gold Transaction Failed",
        description: error.message || "An error occurred during the gold transaction.",
        variant: "destructive",
      });
    },
  });

  const handleCreateUser = () => {
    if (!newUser.email || !newUser.password || !newUser.firstName || !newUser.lastName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    createUserMutation.mutate(newUser);
  };

  const handleUpdateUser = (user: any) => {
    updateUserMutation.mutate({ id: user.id, data: user });
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleCreditDebit = () => {
    const amount = parseFloat(transactionAmount);
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0.",
        variant: "destructive",
      });
      return;
    }

    accountTransactionMutation.mutate({
      userId: selectedUserId,
      type: transactionType,
      amount,
      description: transactionDescription || `Account ${transactionType} by admin`
    });
  };

  const handleGoldCreditDebit = () => {
    const weight = parseFloat(goldWeight);
    const purity = parseFloat(goldPurity);
    const purchasePrice = goldPurchasePrice ? parseFloat(goldPurchasePrice) : undefined;
    
    if (!weight || weight <= 0) {
      toast({
        title: "Invalid Weight",
        description: "Please enter a valid weight greater than 0.",
        variant: "destructive",
      });
      return;
    }

    if (!purity || purity <= 0 || purity > 100) {
      toast({
        title: "Invalid Purity",
        description: "Please enter a valid purity between 0 and 100%.",
        variant: "destructive",
      });
      return;
    }

    goldTransactionMutation.mutate({
      userId: selectedUserId,
      type: goldTransactionType,
      weight,
      purity,
      description: goldDescription || `Gold ${goldTransactionType} by admin`,
      purchasePrice
    });
  };

  if (usersLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading users...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              User Management ({users.length} users)
            </CardTitle>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-user">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">First Name *</label>
                      <Input
                        type="text"
                        placeholder="John"
                        value={newUser.firstName}
                        onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                        data-testid="input-first-name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Last Name *</label>
                      <Input
                        type="text"
                        placeholder="Doe"
                        value={newUser.lastName}
                        onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                        data-testid="input-last-name"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email Address *</label>
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      data-testid="input-email"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Password *</label>
                    <Input
                      type="password"
                      placeholder="Enter password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      data-testid="input-password"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Role</label>
                    <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                      <SelectTrigger data-testid="select-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Customer</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsCreateDialogOpen(false)}
                      data-testid="button-cancel"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateUser}
                      disabled={createUserMutation.isPending}
                      data-testid="button-create"
                    >
                      {createUserMutation.isPending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2"></div>
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Create User
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user: any) => (
              <Card key={user.id} className="p-4" data-testid={`user-${user.id}`}>
                {editingUser?.id === user.id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">First Name</label>
                        <Input
                          value={editingUser.firstName || ''}
                          onChange={(e) => setEditingUser({ ...editingUser, firstName: e.target.value })}
                          data-testid={`edit-first-name-${user.id}`}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Last Name</label>
                        <Input
                          value={editingUser.lastName || ''}
                          onChange={(e) => setEditingUser({ ...editingUser, lastName: e.target.value })}
                          data-testid={`edit-last-name-${user.id}`}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Email</label>
                        <Input
                          value={editingUser.email || ''}
                          onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                          data-testid={`edit-email-${user.id}`}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Role</label>
                        <Select 
                          value={editingUser.role || 'user'} 
                          onValueChange={(value) => setEditingUser({ ...editingUser, role: value })}
                        >
                          <SelectTrigger data-testid={`edit-role-${user.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">Customer</SelectItem>
                            <SelectItem value="admin">Administrator</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setEditingUser(null)}
                        data-testid={`button-cancel-edit-${user.id}`}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        onClick={() => handleUpdateUser(editingUser)}
                        disabled={updateUserMutation.isPending}
                        data-testid={`button-save-${user.id}`}
                      >
                        {updateUserMutation.isPending ? (
                          <>
                            <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{user.firstName} {user.lastName}</h4>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <div className="flex items-center mt-1">
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role === 'admin' ? 'Administrator' : 'Customer'}
                          </Badge>
                          <span className="text-xs text-muted-foreground ml-2">
                            Joined {new Date(user.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingUser({ ...user })}
                        data-testid={`button-edit-${user.id}`}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUserId(user.id);
                          setTransactionType('credit');
                          setCreditDebitDialogOpen(true);
                        }}
                        data-testid={`button-credit-${user.id}`}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Credit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUserId(user.id);
                          setTransactionType('debit');
                          setCreditDebitDialogOpen(true);
                        }}
                        data-testid={`button-debit-${user.id}`}
                      >
                        <Coins className="h-4 w-4 mr-1" />
                        Debit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUserId(user.id);
                          setGoldTransactionType('credit');
                          setGoldDialogOpen(true);
                        }}
                        data-testid={`button-gold-credit-${user.id}`}
                      >
                        <Shield className="h-4 w-4 mr-1" />
                        Gold+
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={deleteUserMutation.isPending}
                        data-testid={`button-delete-${user.id}`}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))}
            {users.length === 0 && (
              <div className="text-center py-12">
                <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h4 className="text-lg font-semibold mb-2">No Users Found</h4>
                <p className="text-muted-foreground">Start by creating your first user.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Credit/Debit Dialog */}
      <Dialog open={creditDebitDialogOpen} onOpenChange={setCreditDebitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {transactionType === 'credit' ? 'Credit Account' : 'Debit Account'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium">Amount ($)</label>
              <Input
                type="number"
                placeholder="0.00"
                value={transactionAmount}
                onChange={(e) => setTransactionAmount(e.target.value)}
                data-testid="input-transaction-amount"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Enter transaction description..."
                value={transactionDescription}
                onChange={(e) => setTransactionDescription(e.target.value)}
                data-testid="textarea-transaction-description"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setCreditDebitDialogOpen(false)}
                data-testid="button-cancel-transaction"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreditDebit}
                disabled={accountTransactionMutation.isPending}
                data-testid="button-confirm-transaction"
              >
                {accountTransactionMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    {transactionType === 'credit' ? <Plus className="h-4 w-4 mr-2" /> : <Coins className="h-4 w-4 mr-2" />}
                    {transactionType === 'credit' ? 'Credit Account' : 'Debit Account'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Gold Credit/Debit Dialog */}
      <Dialog open={goldDialogOpen} onOpenChange={setGoldDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {goldTransactionType === 'credit' ? 'Credit Gold Holdings' : 'Debit Gold Holdings'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Weight (oz) *</label>
                <Input
                  type="number"
                  step="0.0001"
                  placeholder="0.0000"
                  value={goldWeight}
                  onChange={(e) => setGoldWeight(e.target.value)}
                  data-testid="input-gold-weight"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Purity (%) *</label>
                <Input
                  type="number"
                  step="0.001"
                  placeholder="99.9"
                  value={goldPurity}
                  onChange={(e) => setGoldPurity(e.target.value)}
                  data-testid="input-gold-purity"
                />
              </div>
            </div>
            {goldTransactionType === 'credit' && (
              <div>
                <label className="text-sm font-medium">Purchase Price ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={goldPurchasePrice}
                  onChange={(e) => setGoldPurchasePrice(e.target.value)}
                  data-testid="input-gold-purchase-price"
                />
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Enter transaction description..."
                value={goldDescription}
                onChange={(e) => setGoldDescription(e.target.value)}
                data-testid="textarea-gold-description"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setGoldDialogOpen(false)}
                data-testid="button-cancel-gold-transaction"
              >
                Cancel
              </Button>
              <Button
                onClick={handleGoldCreditDebit}
                disabled={goldTransactionMutation.isPending}
                data-testid="button-confirm-gold-transaction"
              >
                {goldTransactionMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    {goldTransactionType === 'credit' ? <Shield className="h-4 w-4 mr-2" /> : <Coins className="h-4 w-4 mr-2" />}
                    {goldTransactionType === 'credit' ? 'Credit Gold' : 'Debit Gold'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Admin() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [claimNotes, setClaimNotes] = useState("");
  const [selectedConsignment, setSelectedConsignment] = useState<any>(null);
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [verifiedWeight, setVerifiedWeight] = useState("");
  const [verifiedPurity, setVerifiedPurity] = useState("");
  const [verificationNotes, setVerificationNotes] = useState("");
  const [addToAccount, setAddToAccount] = useState(true);
  const [statusUpdateDialogOpen, setStatusUpdateDialogOpen] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [statusNotes, setStatusNotes] = useState("");
  const [selectedClaimForDetails, setSelectedClaimForDetails] = useState<any>(null);
  const [claimDetailsDialogOpen, setClaimDetailsDialogOpen] = useState(false);
  const [communicationMessage, setCommunicationMessage] = useState("");
  const [assignedAdmin, setAssignedAdmin] = useState("");
  const [claimPriority, setClaimPriority] = useState("");
  const [claimFilter, setClaimFilter] = useState("all"); // all, pending, assigned, high_priority
  const [documentVerificationDialog, setDocumentVerificationDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [documentStatus, setDocumentStatus] = useState("");
  const [documentNotes, setDocumentNotes] = useState("");
  const [resolutionDialog, setResolutionDialog] = useState(false);
  const [resolutionType, setResolutionType] = useState("");
  
  // Tracking update states
  const [trackingUpdateDialogOpen, setTrackingUpdateDialogOpen] = useState(false);
  const [selectedConsignmentForTracking, setSelectedConsignmentForTracking] = useState<any>(null);
  const [trackingStatus, setTrackingStatus] = useState("");
  const [trackingLocation, setTrackingLocation] = useState("");
  const [trackingDescription, setTrackingDescription] = useState("");
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [resolutionDetails, setResolutionDetails] = useState("");
  
  // Support System State
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [ticketFilter, setTicketFilter] = useState("all");
  const [supportResponse, setSupportResponse] = useState("");
  const [escalationDialog, setEscalationDialog] = useState(false);
  const [escalationReason, setEscalationReason] = useState("");
  const [escalationTo, setEscalationTo] = useState("");
  const [chatDialog, setChatDialog] = useState(false);
  const [activeChatUser, setActiveChatUser] = useState<any>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [notificationDialog, setNotificationDialog] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationUsers, setNotificationUsers] = useState<string[]>([]);
  const [ticketChatMessages, setTicketChatMessages] = useState<any[]>([]);
  const [resolveDialog, setResolveDialog] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");

  // Auth protection
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (user as any)?.role !== "admin")) {
      toast({
        title: "Unauthorized",
        description: "Admin access required. Redirecting to login...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/auth";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  // Admin data queries
  const { data: pendingClaims = [], isLoading: claimsLoading } = useQuery({
    queryKey: ["/api/admin/pending-claims"],
    enabled: !!user,
  }) as { data: any[], isLoading: boolean };

  const { data: allClaims = [], isLoading: allClaimsLoading } = useQuery({
    queryKey: ["/api/admin/claims"],
    enabled: !!user,
  }) as { data: any[], isLoading: boolean };

  const { data: consignments = [], isLoading: consignmentsLoading } = useQuery({
    queryKey: ["/api/admin/consignments"],
    enabled: !!user,
  }) as { data: any[], isLoading: boolean };

  const { data: goldPrices } = useQuery({
    queryKey: ["/api/gold-prices"],
  }) as { data: { usd: number } | undefined };

  // Support ticket queries  
  const { data: supportTickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ["/api/admin/support-tickets"],
    enabled: !!user,
  }) as { data: any[], isLoading: boolean };

  const { data: adminNotifications = [], isLoading: notificationsLoading } = useQuery({
    queryKey: ["/api/admin/notifications"],
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30 seconds
  }) as { data: any[], isLoading: boolean };

  // Filter claims based on admin selection
  const filteredClaims = allClaims.filter((claim: any) => {
    switch (claimFilter) {
      case 'pending':
        return claim.status === 'pending';
      case 'under_review':
        return claim.status === 'under_review';
      case 'high_priority':
        return claim.priority === 'high';
      case 'inheritance':
        return claim.claimType === 'inheritance';
      case 'ownership_dispute':
        return claim.claimType === 'ownership_dispute';
      case 'withdrawal_request':
        return claim.claimType === 'withdrawal_request';
      case 'all':
      default:
        return true;
    }
  });

  // Enhanced claims mutations
  const assignClaimMutation = useMutation({
    mutationFn: async ({ id, adminId }: { id: string; adminId?: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/claims/${id}/assign`, { adminId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Claim Assigned",
        description: "Claim has been assigned successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/claims"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-claims"] });
      // Keep the claim selected after assignment for continued management
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Assign Claim",
        description: error.message || "An error occurred while assigning the claim.",
        variant: "destructive",
      });
    },
  });

  const addCommunicationMutation = useMutation({
    mutationFn: async ({ id, message }: { id: string; message: string }) => {
      const response = await apiRequest("POST", `/api/admin/claims/${id}/communication`, { message });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Communication Sent",
        description: "Your message has been sent to the customer.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/claims"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
      setCommunicationMessage("");
      // Refresh the selected claim to show updated communication
      if (selectedClaim) {
        setSelectedClaim({...selectedClaim, communicationLog: [...(selectedClaim.communicationLog || []), {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          message: communicationMessage,
          fromAdmin: true,
          adminId: user?.id
        }]});
      }
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Communication",
        description: error.message || "An error occurred while adding communication.",
        variant: "destructive",
      });
    },
  });

  const updatePriorityMutation = useMutation({
    mutationFn: async ({ id, priority }: { id: string; priority: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/claims/${id}/priority`, { priority });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Priority Updated",
        description: "Claim priority has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/claims"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update Priority",
        description: error.message || "An error occurred while updating priority.",
        variant: "destructive",
      });
    },
  });

  // Consignment mutations
  const updateConsignmentStatusMutation = useMutation({
    mutationFn: async ({ id, status, adminNotes }: { id: string; status: string; adminNotes?: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/consignments/${id}/status`, { status, adminNotes });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Consignment Updated",
        description: "Consignment status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/consignments"] });
      setStatusUpdateDialogOpen(false);
      setNewStatus("");
      setStatusNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update Consignment",
        description: error.message || "An error occurred while updating the consignment.",
        variant: "destructive",
      });
    },
  });

  const verifyConsignmentMutation = useMutation({
    mutationFn: async ({ id, verifiedWeight, verifiedPurity, adminNotes, addToAccount }: { 
      id: string; 
      verifiedWeight: number; 
      verifiedPurity: number; 
      adminNotes: string; 
      addToAccount: boolean 
    }) => {
      const response = await apiRequest("POST", `/api/admin/consignments/${id}/verify`, { 
        verifiedWeight, 
        verifiedPurity, 
        adminNotes, 
        addToAccount 
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Consignment Verified",
        description: "Consignment has been verified successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/consignments"] });
      setVerificationDialogOpen(false);
      setVerifiedWeight("");
      setVerifiedPurity("");
      setVerificationNotes("");
      setSelectedConsignment(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Verify Consignment",
        description: error.message || "An error occurred while verifying the consignment.",
        variant: "destructive",
      });
    },
  });

  // Mutations
  const updateClaimMutation = useMutation({
    mutationFn: async ({ id, status, adminNotes }: { id: string; status: string; adminNotes?: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/claims/${id}/status`, { status, adminNotes });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Claim Updated",
        description: "Claim status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-claims"] });
      setSelectedClaim(null);
      setClaimNotes("");
    },
    onError: (error) => {
      // Auth handled by ProtectedRoute
      toast({
        title: "Failed to Update Claim",
        description: error.message || "An error occurred while updating the claim.",
        variant: "destructive",
      });
    },
  });

  // Tracking update mutation
  const updateTrackingMutation = useMutation({
    mutationFn: async ({ consignmentId, status, location, description, notifyCustomer }: {
      consignmentId: string;
      status: string;
      location: string;
      description: string;
      notifyCustomer: boolean;
    }) => {
      const response = await apiRequest("POST", `/api/admin/tracking/${consignmentId}/update`, {
        status,
        location,
        description,
        isPublic: true,
        notifyCustomer
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Tracking Updated",
        description: "Consignment tracking has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/consignments"] });
      setTrackingUpdateDialogOpen(false);
      setSelectedConsignmentForTracking(null);
      setTrackingStatus("");
      setTrackingLocation("");
      setTrackingDescription("");
      setNotifyCustomer(true);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update Tracking",
        description: error.message || "An error occurred while updating tracking.",
        variant: "destructive",
      });
    },
  });

  const handleTrackingUpdate = () => {
    if (!selectedConsignmentForTracking || !trackingStatus) return;
    
    updateTrackingMutation.mutate({
      consignmentId: selectedConsignmentForTracking.id,
      status: trackingStatus,
      location: trackingLocation,
      description: trackingDescription,
      notifyCustomer,
    });
  };

  const handleClaimAction = (status: string) => {
    if (!selectedClaim) return;
    
    updateClaimMutation.mutate({
      id: selectedClaim.id,
      status,
      adminNotes: claimNotes,
    });
  };

  // Support ticket mutations
  const updateTicketStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/support-tickets/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Ticket Status Updated",
        description: "Support ticket status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support-tickets"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update Ticket",
        description: error.message || "An error occurred while updating the ticket status.",
        variant: "destructive",
      });
    },
  });

  const escalateTicketMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await apiRequest("POST", `/api/admin/support-tickets/${id}/escalate`, { reason });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Ticket Escalated",
        description: "Support ticket has been escalated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support-tickets"] });
      setEscalationDialog(false);
      setEscalationReason("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Escalate Ticket",
        description: error.message || "An error occurred while escalating the ticket.",
        variant: "destructive",
      });
    },
  });

  const resolveTicketMutation = useMutation({
    mutationFn: async ({ id, resolutionNotes }: { id: string; resolutionNotes: string }) => {
      const response = await apiRequest("POST", `/api/admin/support-tickets/${id}/resolve`, { resolutionNotes });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Ticket Resolved",
        description: "Support ticket has been resolved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support-tickets"] });
      setResolveDialog(false);
      setResolutionNotes("");
      setSelectedTicket(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Resolve Ticket",
        description: error.message || "An error occurred while resolving the ticket.",
        variant: "destructive",
      });
    },
  });

  const sendChatMessageMutation = useMutation({
    mutationFn: async ({ sessionId, message, ticketId }: { sessionId: string; message: string; ticketId?: string }) => {
      const response = await apiRequest("POST", `/api/chat/${sessionId}`, {
        message,
        ticketId,
        userId: (user as any)?.id,
        isCustomer: false,
        messageType: 'text'
      });
      return response.json();
    },
    onSuccess: () => {
      setChatMessage("");
      // Refresh chat messages for the ticket
      if (selectedTicket?.chatSessionId) {
        loadTicketChatMessages(selectedTicket.chatSessionId);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Message",
        description: error.message || "An error occurred while sending the message.",
        variant: "destructive",
      });
    },
  });

  // Helper function to load chat messages for a ticket
  const loadTicketChatMessages = async (sessionId: string) => {
    try {
      const response = await apiRequest("GET", `/api/chat/${sessionId}`, {});
      const messages = await response.json();
      setTicketChatMessages(messages);
    } catch (error) {
      console.error("Failed to load chat messages:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Calculate stats
  const totalConsignments = consignments.length;
  const totalGoldWeight = consignments.reduce((sum: number, c: any) => sum + parseFloat(c.weight || 0), 0);
  const totalPortfolioValue = consignments.reduce((sum: number, c: any) => sum + parseFloat(c.estimatedValue || 0), 0);
  const pendingClaimsCount = pendingClaims.length;

  return (
    <div className="min-h-screen bg-background">
      <AdminNavigation
        goldPrice={goldPrices?.usd || 2034.50}
        user={user}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="admin-page">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold mb-4">Admin Management Center</h1>
          <p className="text-xl text-muted-foreground">
            Comprehensive administration tools for managing consignments, claims, and customer support
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-8" data-testid="admin-tabs">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-7 gap-2 h-auto p-2 bg-muted">
            <TabsTrigger 
              value="overview" 
              data-testid="tab-overview"
              className="flex flex-col items-center justify-center p-4 text-xs md:text-sm min-h-[60px] md:min-h-[40px] data-[state=active]:bg-background data-[state=active]:text-foreground"
            >
              <BarChart3 className="h-5 w-5 mb-1 md:hidden" />
              <span className="font-medium">Overview</span>
            </TabsTrigger>
            <TabsTrigger 
              value="consignments" 
              data-testid="tab-consignments"
              className="flex flex-col items-center justify-center p-4 text-xs md:text-sm min-h-[60px] md:min-h-[40px] data-[state=active]:bg-background data-[state=active]:text-foreground"
            >
              <Package className="h-5 w-5 mb-1 md:hidden" />
              <span className="font-medium">Consignments</span>
            </TabsTrigger>
            <TabsTrigger 
              value="tracking" 
              data-testid="tab-tracking"
              className="flex flex-col items-center justify-center p-4 text-xs md:text-sm min-h-[60px] md:min-h-[40px] data-[state=active]:bg-background data-[state=active]:text-foreground"
            >
              <MapPin className="h-5 w-5 mb-1 md:hidden" />
              <span className="font-medium">Tracking</span>
            </TabsTrigger>
            <TabsTrigger 
              value="claims" 
              data-testid="tab-claims"
              className="flex flex-col items-center justify-center p-4 text-xs md:text-sm min-h-[60px] md:min-h-[40px] data-[state=active]:bg-background data-[state=active]:text-foreground"
            >
              <Gavel className="h-5 w-5 mb-1 md:hidden" />
              <span className="font-medium">Claims</span>
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              data-testid="tab-users"
              className="flex flex-col items-center justify-center p-4 text-xs md:text-sm min-h-[60px] md:min-h-[40px] data-[state=active]:bg-background data-[state=active]:text-foreground"
            >
              <User className="h-5 w-5 mb-1 md:hidden" />
              <span className="font-medium">Users</span>
            </TabsTrigger>
            <TabsTrigger 
              value="support" 
              data-testid="tab-support"
              className="flex flex-col items-center justify-center p-4 text-xs md:text-sm min-h-[60px] md:min-h-[40px] data-[state=active]:bg-background data-[state=active]:text-foreground"
            >
              <MessageSquare className="h-5 w-5 mb-1 md:hidden" />
              <span className="font-medium">Support</span>
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              data-testid="tab-analytics"
              className="flex flex-col items-center justify-center p-4 text-xs md:text-sm min-h-[60px] md:min-h-[40px] data-[state=active]:bg-background data-[state=active]:text-foreground"
            >
              <TrendingUp className="h-5 w-5 mb-1 md:hidden" />
              <span className="font-medium">Analytics</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6" data-testid="overview-content">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <Card data-testid="stat-active-consignments">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Consignments</p>
                      <p className="text-2xl font-bold">{totalConsignments.toLocaleString()}</p>
                    </div>
                    <Package className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="stat-pending-claims">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pending Claims</p>
                      <p className="text-2xl font-bold">{pendingClaimsCount}</p>
                    </div>
                    <Gavel className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="stat-total-gold">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Gold (oz)</p>
                      <p className="text-2xl font-bold">{totalGoldWeight.toFixed(1)}</p>
                    </div>
                    <Coins className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="stat-portfolio-value">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Portfolio Value</p>
                      <p className="text-2xl font-bold">
                        ${(totalPortfolioValue / 1000000).toFixed(1)}M
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activities */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
              <Card data-testid="recent-consignments">
                <CardHeader>
                  <CardTitle>Recent Consignments</CardTitle>
                </CardHeader>
                <CardContent>
                  {consignments.slice(0, 5).length > 0 ? (
                    <div className="space-y-3">
                      {consignments.slice(0, 5).map((consignment: any, index: number) => (
                        <div key={consignment.id} className="flex items-center justify-between p-4 bg-muted rounded-lg" data-testid={`recent-consignment-${index}`}>
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mr-3">
                              <Plus className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <div>
                              <p className="font-medium">#{consignment.consignmentNumber}</p>
                              <p className="text-sm text-muted-foreground">{consignment.weight} oz</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">${parseFloat(consignment.estimatedValue).toLocaleString()}</p>
                            <Badge variant={consignment.status === 'stored' ? 'default' : 'secondary'}>
                              {consignment.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No recent consignments</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card data-testid="pending-actions">
                <CardHeader>
                  <CardTitle>Pending Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingClaims.length > 0 ? (
                      pendingClaims.slice(0, 3).map((claim: any, index: number) => (
                        <div key={claim.id} className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg" data-testid={`pending-action-${index}`}>
                          <div className="flex items-center">
                            <Gavel className="h-5 w-5 text-yellow-600 mr-3" />
                            <div>
                              <p className="font-medium">Inheritance Claim</p>
                              <p className="text-sm text-muted-foreground">From: {claim.claimantName}</p>
                            </div>
                          </div>
                          <Button 
                            size="sm"
                            onClick={() => setSelectedClaim(claim)}
                            data-testid={`button-review-claim-${index}`}
                          >
                            Review
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                        <p className="text-muted-foreground">No pending actions</p>
                      </div>
                    )}

                    {/* Sample KYC Review Action */}
                    <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg" data-testid="pending-action-kyc">
                      <div className="flex items-center">
                        <User className="h-5 w-5 text-blue-600 mr-3" />
                        <div>
                          <p className="font-medium">KYC Review Required</p>
                          <p className="text-sm text-muted-foreground">Multiple customer documents</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" data-testid="button-review-kyc">
                        Review KYC
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Consignments Tab */}
          <TabsContent value="consignments" className="space-y-6" data-testid="consignments-content">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  All Consignments ({consignments.length})
                  <Badge variant="outline">
                    {consignments.filter((c: any) => c.status === 'pending').length} Pending Review
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {consignmentsLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-muted-foreground">Loading consignments...</p>
                  </div>
                ) : consignments.length > 0 ? (
                  <div className="space-y-4">
                    {consignments.map((consignment: any) => (
                      <Card key={consignment.id} className="p-4" data-testid={`admin-consignment-${consignment.id}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                              <h4 className="font-semibold text-lg">#{consignment.consignmentNumber}</h4>
                              <Badge variant={
                                consignment.status === 'verified' ? 'default' : 
                                consignment.status === 'pending' ? 'secondary' : 
                                consignment.status === 'stored' ? 'outline' :
                                'destructive'
                              }>
                                {consignment.status}
                              </Badge>
                              {consignment.status === 'pending' && (
                                <Badge variant="destructive" className="animate-pulse">
                                  Needs Review
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{consignment.description}</p>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="font-medium">Customer:</span>
                                <p className="text-muted-foreground">{consignment.userName || consignment.userEmail}</p>
                              </div>
                              <div>
                                <span className="font-medium">Weight:</span>
                                <p className="text-muted-foreground">{consignment.weight} oz</p>
                              </div>
                              <div>
                                <span className="font-medium">Purity:</span>
                                <p className="text-muted-foreground">{consignment.purity}%</p>
                              </div>
                              <div>
                                <span className="font-medium">Est. Value:</span>
                                <p className="text-muted-foreground">${parseFloat(consignment.estimatedValue).toLocaleString()}</p>
                              </div>
                              <div>
                                <span className="font-medium">Storage Plan:</span>
                                <p className="text-muted-foreground capitalize">{consignment.storagePlan}</p>
                              </div>
                              <div>
                                <span className="font-medium">Created:</span>
                                <p className="text-muted-foreground">{new Date(consignment.createdAt).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <span className="font-medium">Insurance:</span>
                                <p className="text-muted-foreground">{consignment.insuranceEnabled ? 'Yes' : 'No'}</p>
                              </div>
                              <div>
                                <span className="font-medium">Vault:</span>
                                <p className="text-muted-foreground">{consignment.vaultLocation || 'Not assigned'}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2 ml-4">
                            {consignment.status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedConsignment(consignment);
                                  setVerifiedWeight(consignment.weight);
                                  setVerifiedPurity(consignment.purity);
                                  setVerificationDialogOpen(true);
                                }}
                                data-testid={`button-verify-${consignment.id}`}
                              >
                                <UserCheck className="h-4 w-4 mr-1" />
                                Verify
                              </Button>
                            )}
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedConsignment(consignment);
                                setNewStatus(consignment.status);
                                setStatusUpdateDialogOpen(true);
                              }}
                              data-testid={`button-update-status-${consignment.id}`}
                            >
                              <Settings className="h-4 w-4 mr-1" />
                              Update Status
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`/tracking/${consignment.consignmentNumber}`, '_blank')}
                              data-testid={`button-view-tracking-${consignment.id}`}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Tracking
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h4 className="text-lg font-semibold mb-2">No consignments found</h4>
                    <p className="text-muted-foreground">
                      Consignments will appear here as customers create them.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Claims Tab */}
          <TabsContent value="claims" className="space-y-6" data-testid="claims-content">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Claims List */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Claims Management</CardTitle>
                    <Select value={claimFilter} onValueChange={setClaimFilter}>
                      <SelectTrigger className="w-[200px]" data-testid="select-claim-filter">
                        <SelectValue placeholder="Filter claims" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Claims</SelectItem>
                        <SelectItem value="pending">Pending Review</SelectItem>
                        <SelectItem value="under_review">Under Review</SelectItem>
                        <SelectItem value="high_priority">High Priority</SelectItem>
                        <SelectItem value="inheritance">Inheritance</SelectItem>
                        <SelectItem value="ownership_dispute">Ownership Disputes</SelectItem>
                        <SelectItem value="withdrawal_request">Withdrawal Requests</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {allClaimsLoading ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-muted-foreground">Loading claims...</p>
                    </div>
                  ) : filteredClaims.length > 0 ? (
                    <div className="space-y-4">
                      {filteredClaims.map((claim: any) => (
                        <Card 
                          key={claim.id} 
                          className={`p-4 cursor-pointer transition-colors ${selectedClaim?.id === claim.id ? 'bg-primary/5 border-primary' : 'hover:bg-muted'}`}
                          onClick={() => setSelectedClaim(claim)}
                          data-testid={`claim-${claim.id}`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold">{claim.claimantName}</h4>
                              <p className="text-sm text-muted-foreground">{claim.claimantEmail}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                  {new Date(claim.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <Badge variant="secondary">
                              {claim.status}
                            </Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Gavel className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h4 className="text-lg font-semibold mb-2">No pending claims</h4>
                      <p className="text-muted-foreground">
                        Inheritance claims will appear here for review.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Enhanced Claim Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Comprehensive Claim Review
                    {selectedClaim && (
                      <Badge variant={selectedClaim.status === 'pending' ? 'secondary' : selectedClaim.status === 'approved' ? 'default' : selectedClaim.status === 'rejected' ? 'destructive' : 'outline'}>
                        {selectedClaim.status}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="max-h-[600px] overflow-y-auto">
                  {selectedClaim ? (
                    <div className="space-y-6">
                      {/* Claim Overview */}
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Claim Overview
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Claimant:</span>
                            <p className="font-medium">{selectedClaim.claimantName}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Email:</span>
                            <p className="font-medium">{selectedClaim.claimantEmail}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Claim Type:</span>
                            <p className="capitalize font-medium">{selectedClaim.claimType || 'inheritance'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Priority:</span>
                            <Badge variant={selectedClaim.priority === 'high' || selectedClaim.priority === 'urgent' ? 'destructive' : 'secondary'} className="text-xs">
                              {selectedClaim.priority || 'normal'}
                            </Badge>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Submitted:</span>
                            <p className="font-medium">{new Date(selectedClaim.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Assigned To:</span>
                            <p className="font-medium">{selectedClaim.assignedTo || 'Unassigned'}</p>
                          </div>
                        </div>
                        {selectedClaim.claimReason && (
                          <div className="mt-3">
                            <span className="text-muted-foreground">Reason:</span>
                            <p className="mt-1 text-sm">{selectedClaim.claimReason}</p>
                          </div>
                        )}
                      </div>

                      {/* Document Verification */}
                      {selectedClaim.documentUrls?.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Document Verification ({selectedClaim.documentUrls.length} documents)
                          </h4>
                          <div className="space-y-2">
                            {selectedClaim.documentUrls.map((url: string, index: number) => (
                              <div key={index} className="flex items-center gap-2 p-3 bg-muted rounded border">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <div className="flex-1">
                                  <span className="text-sm font-medium">Document {index + 1}</span>
                                  <p className="text-xs text-muted-foreground">
                                    {url.includes('id') ? 'Identity Document' : 
                                     url.includes('court') ? 'Court Order' :
                                     url.includes('death') ? 'Death Certificate' :
                                     url.includes('will') ? 'Will/Testament' : 'Supporting Document'}
                                  </p>
                                </div>
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="sm" data-testid={`button-view-doc-${index}`}>
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => {
                                      setSelectedDocument({ url, index, type: url.includes('id') ? 'ID' : 'Other' });
                                      setDocumentVerificationDialog(true);
                                    }}
                                    data-testid={`button-verify-doc-${index}`}
                                  >
                                    <Shield className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Communication Log */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Communication History
                        </h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto mb-3">
                          {selectedClaim.communications?.length > 0 ? (
                            selectedClaim.communications.map((comm: any, index: number) => (
                              <div key={index} className="text-xs p-2 bg-muted/30 rounded">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-medium">{comm.adminName || 'Admin'}</span>
                                  <span className="text-muted-foreground">{new Date(comm.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p>{comm.message}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground text-center py-2">No communications yet</p>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <Textarea
                            value={communicationMessage}
                            onChange={(e) => setCommunicationMessage(e.target.value)}
                            placeholder="Add communication to claimant..."
                            rows={2}
                            className="flex-1"
                            data-testid="textarea-communication"
                          />
                          <Button
                            onClick={() => {
                              if (communicationMessage.trim()) {
                                addCommunicationMutation.mutate({
                                  id: selectedClaim.id,
                                  message: communicationMessage
                                });
                              }
                            }}
                            disabled={addCommunicationMutation.isPending || !communicationMessage.trim()}
                            size="sm"
                            data-testid="button-send-communication"
                          >
                            <Send className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Admin Actions */}
                      <div>
                        <h4 className="font-semibold mb-3">Admin Actions</h4>
                        <div className="space-y-3">
                          {/* Priority & Assignment */}
                          <div className="flex gap-2">
                            <Select value={claimPriority} onValueChange={setClaimPriority}>
                              <SelectTrigger className="w-32" data-testid="select-priority">
                                <SelectValue placeholder="Priority" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (claimPriority) {
                                  updatePriorityMutation.mutate({
                                    id: selectedClaim.id,
                                    priority: claimPriority
                                  });
                                }
                              }}
                              disabled={updatePriorityMutation.isPending || !claimPriority}
                              data-testid="button-update-priority"
                            >
                              <Settings className="h-3 w-3 mr-1" />
                              Set Priority
                            </Button>
                          </div>

                          {/* Admin Notes */}
                          <div>
                            <Label htmlFor="adminNotes">Comprehensive Review Notes</Label>
                            <Textarea
                              id="adminNotes"
                              value={claimNotes}
                              onChange={(e) => setClaimNotes(e.target.value)}
                              placeholder="Document your review findings, verification results, legal considerations..."
                              rows={4}
                              data-testid="textarea-admin-notes"
                            />
                          </div>

                          {/* Resolution Actions */}
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => {
                                setResolutionType('approved');
                                setResolutionDialog(true);
                              }}
                              disabled={updateClaimMutation.isPending}
                              className="flex-1"
                              data-testid="button-approve-claim"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve Claim
                            </Button>
                            <Button 
                              variant="destructive"
                              onClick={() => {
                                setResolutionType('rejected');
                                setResolutionDialog(true);
                              }}
                              disabled={updateClaimMutation.isPending}
                              className="flex-1"
                              data-testid="button-reject-claim"
                            >
                              <AlertTriangle className="h-4 w-4 mr-2" />
                              Reject Claim
                            </Button>
                          </div>
                          
                          <Button 
                            variant="outline"
                            onClick={() => {
                              setResolutionType('additional_info');
                              setResolutionDialog(true);
                            }}
                            disabled={updateClaimMutation.isPending}
                            className="w-full"
                            data-testid="button-request-info"
                          >
                            <FileQuestion className="h-4 w-4 mr-2" />
                            Request Additional Information
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Gavel className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h4 className="text-lg font-semibold mb-2">Select a Claim to Review</h4>
                      <p className="text-muted-foreground">
                        Choose a claim from the list to access comprehensive review tools, document verification, and resolution workflows.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6" data-testid="users-content">
            <UserManagement />
          </TabsContent>

          {/* Enhanced Support Tab */}
          <TabsContent value="support" className="space-y-6" data-testid="support-content">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Support Overview Cards */}
              <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Open Tickets</p>
                        <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">12</p>
                      </div>
                      <MessageSquare className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-green-50 dark:bg-green-900/20 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">Active Chats</p>
                        <p className="text-2xl font-bold text-green-800 dark:text-green-200">3</p>
                      </div>
                      <MessageCircle className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Escalated</p>
                        <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">2</p>
                      </div>
                      <ArrowUp className="h-8 w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Avg Response</p>
                        <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">2.5m</p>
                      </div>
                      <Timer className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Support Tickets List */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Headphones className="h-5 w-5" />
                      Support Tickets
                    </CardTitle>
                    <div className="flex gap-2">
                      <Select value={ticketFilter} onValueChange={setTicketFilter}>
                        <SelectTrigger className="w-[140px]" data-testid="select-ticket-filter">
                          <SelectValue placeholder="Filter tickets" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Tickets</SelectItem>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="escalated">Escalated</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button 
                        onClick={() => setNotificationDialog(true)}
                        variant="outline" 
                        size="sm"
                        data-testid="button-send-notifications"
                      >
                        <Bell className="h-4 w-4 mr-1" />
                        Notify
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="max-h-[500px] overflow-y-auto">
                  {ticketsLoading ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading support tickets...</p>
                    </div>
                  ) : supportTickets.filter(ticket => ticketFilter === 'all' || ticket.status === ticketFilter).length === 0 ? (
                    <div className="text-center py-12">
                      <Headphones className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h4 className="text-lg font-semibold mb-2">No Support Tickets</h4>
                      <p className="text-muted-foreground">
                        {ticketFilter === 'all' ? 'No support tickets found.' : `No ${ticketFilter} tickets found.`}
                      </p>
                    </div>
                  ) : supportTickets.filter(ticket => ticketFilter === 'all' || ticket.status === ticketFilter).map((ticket) => (
                    <Card 
                      key={ticket.id}
                      className={`p-4 mb-3 cursor-pointer transition-colors ${
                        selectedTicket?.id === ticket.id ? 'bg-primary/5 border-primary' : 'hover:bg-muted'
                      }`}
                      onClick={() => setSelectedTicket(ticket)}
                      data-testid={`ticket-${ticket.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{ticket.customerName}</h4>
                            <Badge 
                              variant={ticket.priority === 'urgent' || ticket.priority === 'high' ? 'destructive' : 
                                       ticket.priority === 'medium' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {ticket.priority}
                            </Badge>
                            <Badge 
                              variant={ticket.status === 'escalated' ? 'destructive' : 
                                       ticket.status === 'open' ? 'default' : 'outline'}
                              className="text-xs"
                            >
                              {ticket.status}
                            </Badge>
                            {ticket.assignedTo && (
                              <Badge variant="secondary" className="text-xs">
                                Assigned
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">{ticket.subject}</p>
                          <p className="text-sm text-muted-foreground mb-2">{ticket.customerEmail}</p>
                          <p className="text-sm line-clamp-2">{ticket.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(ticket.createdAt).toLocaleDateString()} {new Date(ticket.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveChatUser(ticket);
                              setChatDialog(true);
                              if (ticket.chatSessionId) {
                                loadTicketChatMessages(ticket.chatSessionId);
                              }
                            }}
                            data-testid={`button-chat-${ticket.id}`}
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                          {ticket.status !== 'escalated' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTicket(ticket);
                                setEscalationDialog(true);
                              }}
                              data-testid={`button-escalate-${ticket.id}`}
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </CardContent>
              </Card>

              {/* Ticket Details & Response */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCog className="h-5 w-5" />
                    Ticket Response
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedTicket ? (
                    <div className="space-y-4">
                      {/* Ticket Info */}
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Ticket Details</h4>
                        <div className="space-y-1 text-sm">
                          <p><span className="text-muted-foreground">Customer:</span> {selectedTicket.customerName}</p>
                          <p><span className="text-muted-foreground">Email:</span> {selectedTicket.customerEmail}</p>
                          <p><span className="text-muted-foreground">Subject:</span> {selectedTicket.subject}</p>
                          <p><span className="text-muted-foreground">Category:</span> {selectedTicket.category || 'General'}</p>
                          <p><span className="text-muted-foreground">Status:</span> 
                            <Badge variant="outline" className="ml-2 text-xs">{selectedTicket.status}</Badge>
                          </p>
                          <p><span className="text-muted-foreground">Priority:</span> 
                            <Badge variant={selectedTicket.priority === 'urgent' || selectedTicket.priority === 'high' ? 'destructive' : 'default'} className="ml-2 text-xs">
                              {selectedTicket.priority}
                            </Badge>
                          </p>
                          {selectedTicket.assignedTo && (
                            <p><span className="text-muted-foreground">Assigned To:</span> Admin</p>
                          )}
                          <p><span className="text-muted-foreground">Created:</span> {new Date(selectedTicket.createdAt).toLocaleString()}</p>
                        </div>
                      </div>

                      {/* Conversation History */}
                      <div>
                        <h4 className="font-medium mb-2">Description & History</h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto bg-muted/30 p-3 rounded">
                          <div className="text-sm">
                            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded mb-2">
                              <span className="font-medium text-blue-800 dark:text-blue-200">Original Request:</span>
                              <p className="text-blue-700 dark:text-blue-300">{selectedTicket.description}</p>
                              <span className="text-xs text-blue-600 dark:text-blue-400">{new Date(selectedTicket.createdAt).toLocaleString()}</span>
                            </div>
                            {selectedTicket.responses && selectedTicket.responses.length > 0 && 
                              selectedTicket.responses.map((response: any, index: number) => (
                                <div key={index} className="bg-green-100 dark:bg-green-900/30 p-2 rounded mb-2">
                                  <span className="font-medium text-green-800 dark:text-green-200">Admin Response:</span>
                                  <p className="text-green-700 dark:text-green-300">{response.message}</p>
                                  <span className="text-xs text-green-600 dark:text-green-400">{new Date(response.createdAt).toLocaleString()}</span>
                                </div>
                              ))
                            }
                            {selectedTicket.escalationReason && (
                              <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded mb-2">
                                <span className="font-medium text-orange-800 dark:text-orange-200">Escalation Reason:</span>
                                <p className="text-orange-700 dark:text-orange-300">{selectedTicket.escalationReason}</p>
                                <span className="text-xs text-orange-600 dark:text-orange-400">{new Date(selectedTicket.escalatedAt).toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex gap-2 mb-3">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setSupportResponse("Thank you for contacting us. I understand your concern and I'm here to help resolve this matter promptly.")}
                          data-testid="button-template-acknowledge"
                        >
                          Acknowledge
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setSupportResponse("I've reviewed your case and need additional information to provide the best assistance. Could you please provide...")}
                          data-testid="button-template-info-request"
                        >
                          Request Info
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setSupportResponse("Great news! I've resolved your inquiry. Your issue has been addressed and you should see the changes reflected shortly.")}
                          data-testid="button-template-resolved"
                        >
                          Resolved
                        </Button>
                      </div>

                      {/* Response Input */}
                      <div>
                        <Label htmlFor="supportResponse">Your Response</Label>
                        <Textarea
                          id="supportResponse"
                          value={supportResponse}
                          onChange={(e) => setSupportResponse(e.target.value)}
                          placeholder="Type your response to the customer..."
                          rows={5}
                          data-testid="textarea-support-response"
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          onClick={async () => {
                            if (supportResponse.trim()) {
                              try {
                                const response = await apiRequest("POST", `/api/admin/support-tickets/${selectedTicket.id}/respond`, {
                                  message: supportResponse
                                });
                                if (response.ok) {
                                  toast({
                                    title: "Response Sent",
                                    description: `Response sent to ${selectedTicket.customerName}`,
                                  });
                                  setSupportResponse("");
                                  queryClient.invalidateQueries({ queryKey: ["/api/admin/support-tickets"] });
                                }
                              } catch (error) {
                                toast({
                                  title: "Failed to Send Response",
                                  description: "An error occurred while sending the response.",
                                  variant: "destructive",
                                });
                              }
                            }
                          }}
                          disabled={!supportResponse.trim()}
                          className="flex-1"
                          data-testid="button-send-response"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Send Response
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setActiveChatUser(selectedTicket);
                            setChatDialog(true);
                          }}
                          data-testid="button-start-chat"
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Live Chat
                        </Button>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setResolveDialog(true);
                          }}
                          size="sm"
                          data-testid="button-resolve-ticket"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Mark Resolved
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            setEscalationDialog(true);
                          }}
                          size="sm"
                          data-testid="button-escalate-ticket"
                        >
                          <ArrowUp className="h-4 w-4 mr-1" />
                          Escalate
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Headphones className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h4 className="text-lg font-semibold mb-2">Select a Support Ticket</h4>
                      <p className="text-muted-foreground">
                        Choose a ticket from the list to view details and respond to the customer.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tracking Tab */}
          <TabsContent value="tracking" className="space-y-6" data-testid="tracking-content">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Tracking Overview */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Consignment Tracking Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">In Transit</p>
                              <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">5</p>
                            </div>
                            <Truck className="h-8 w-8 text-blue-600" />
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-green-50 dark:bg-green-900/20 border-green-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-green-600 dark:text-green-400">In Vault</p>
                              <p className="text-2xl font-bold text-green-800 dark:text-green-200">15</p>
                            </div>
                            <Shield className="h-8 w-8 text-green-600" />
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Under Review</p>
                              <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">3</p>
                            </div>
                            <AlertCircle className="h-8 w-8 text-orange-600" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Consignment List for Tracking */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Consignments Tracking</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {consignments.slice(0, 5).map((consignment: any) => (
                      <div key={consignment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <div className="text-2xl">
                              {(() => {
                                const statusEmojis = {
                                  received: '📦',
                                  in_vault: '🏦',
                                  under_review: '🔍',
                                  in_transit: '🚚',
                                  delivered: '✅',
                                  rejected: '❌'
                                };
                                return statusEmojis[consignment.trackingStatus as keyof typeof statusEmojis] || '📋';
                              })()}
                            </div>
                            <div>
                              <p className="font-medium">{consignment.trackingId || consignment.consignmentNumber}</p>
                              <p className="text-sm text-muted-foreground">{consignment.userEmail}</p>
                              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                <span>Status: {(consignment.trackingStatus || 'received').replace('_', ' ')}</span>
                                {consignment.currentLocation && (
                                  <>
                                    <span>•</span>
                                    <span>📍 {consignment.currentLocation}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedConsignmentForTracking(consignment);
                              setTrackingStatus(consignment.trackingStatus || 'received');
                              setTrackingLocation(consignment.currentLocation || '');
                              setTrackingDescription('');
                              setNotifyCustomer(true);
                              setTrackingUpdateDialogOpen(true);
                            }}
                          >
                            <MapPin className="h-4 w-4 mr-1" />
                            Update
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              // Schedule future update
                              console.log('Schedule update for:', consignment.id);
                            }}
                          >
                            <Clock className="h-4 w-4 mr-1" />
                            Schedule
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {consignments.length === 0 && (
                      <div className="text-center py-12">
                        <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h4 className="text-lg font-semibold mb-2">No Consignments Yet</h4>
                        <p className="text-muted-foreground">
                          Consignments will appear here once customers start submitting items.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions for Tracking */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Quick Tracking Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                      className="h-20 flex flex-col items-center justify-center"
                      variant="outline"
                      onClick={() => {
                        // Bulk update multiple consignments
                        console.log('Bulk update tracking');
                      }}
                    >
                      <Truck className="h-6 w-6 mb-2" />
                      Bulk Status Update
                    </Button>
                    
                    <Button 
                      className="h-20 flex flex-col items-center justify-center"
                      variant="outline"
                      onClick={() => {
                        // Send notifications to all customers with pending updates
                        console.log('Send tracking notifications');
                      }}
                    >
                      <Bell className="h-6 w-6 mb-2" />
                      Send Notifications
                    </Button>
                    
                    <Button 
                      className="h-20 flex flex-col items-center justify-center"
                      variant="outline"
                      onClick={() => {
                        // View public tracking portal
                        window.open('/track', '_blank');
                      }}
                    >
                      <Eye className="h-6 w-6 mb-2" />
                      View Public Portal
                    </Button>
                    
                    <Button 
                      className="h-20 flex flex-col items-center justify-center"
                      variant="outline"
                      onClick={() => {
                        // Export tracking report
                        console.log('Export tracking report');
                      }}
                    >
                      <FileText className="h-6 w-6 mb-2" />
                      Export Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6" data-testid="analytics-content">
            <Card>
              <CardHeader>
                <CardTitle>Platform Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h4 className="text-lg font-semibold mb-2">Analytics Dashboard</h4>
                  <p className="text-muted-foreground mb-4">
                    Comprehensive analytics and reporting features will be implemented here.
                  </p>
                  <Button variant="outline" data-testid="button-view-analytics">
                    View Full Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Consignment Verification Dialog */}
        <Dialog open={verificationDialogOpen} onOpenChange={setVerificationDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Verify Consignment {selectedConsignment?.consignmentNumber}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Original Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Customer:</span>
                    <p>{selectedConsignment?.userName || selectedConsignment?.userEmail}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Description:</span>
                    <p>{selectedConsignment?.description}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Reported Weight:</span>
                    <p>{selectedConsignment?.weight} oz</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Reported Purity:</span>
                    <p>{selectedConsignment?.purity}%</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Est. Value:</span>
                    <p>${parseFloat(selectedConsignment?.estimatedValue || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Storage Plan:</span>
                    <p className="capitalize">{selectedConsignment?.storagePlan}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="verifiedWeight">Verified Weight (oz) *</Label>
                  <Input
                    id="verifiedWeight"
                    type="number"
                    step="0.0001"
                    placeholder="0.0000"
                    value={verifiedWeight}
                    onChange={(e) => setVerifiedWeight(e.target.value)}
                    data-testid="input-verified-weight"
                  />
                </div>
                <div>
                  <Label htmlFor="verifiedPurity">Verified Purity (%) *</Label>
                  <Input
                    id="verifiedPurity"
                    type="number"
                    step="0.001"
                    placeholder="99.9"
                    value={verifiedPurity}
                    onChange={(e) => setVerifiedPurity(e.target.value)}
                    data-testid="input-verified-purity"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="verificationNotes">Verification Notes</Label>
                <Textarea
                  id="verificationNotes"
                  placeholder="Add any notes about the verification process..."
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  rows={3}
                  data-testid="textarea-verification-notes"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="addToAccount"
                    checked={addToAccount}
                    onCheckedChange={(checked) => setAddToAccount(checked === true)}
                    data-testid="checkbox-add-to-account"
                  />
                  <Label htmlFor="addToAccount" className="text-sm">
                    Add verified gold to customer's account
                  </Label>
                </div>
                
                {addToAccount && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700">
                      <strong>Account Credit:</strong> Customer will receive{' '}
                      <span className="font-mono">{verifiedWeight || '0'} oz</span> of{' '}
                      <span className="font-mono">{verifiedPurity || '0'}%</span> purity gold in their account.
                    </p>
                  </div>
                )}
                
                <div>
                  <Label htmlFor="vaultLocation">Vault Location (Optional)</Label>
                  <Select>
                    <SelectTrigger data-testid="select-vault-location">
                      <SelectValue placeholder="Select vault location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="london-1">London Vault 1</SelectItem>
                      <SelectItem value="london-2">London Vault 2</SelectItem>
                      <SelectItem value="zurich-1">Zurich Vault 1</SelectItem>
                      <SelectItem value="singapore-1">Singapore Vault 1</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Validation Warnings */}
              {(parseFloat(verifiedWeight) !== parseFloat(selectedConsignment?.weight || '0') || 
                parseFloat(verifiedPurity) !== parseFloat(selectedConsignment?.purity || '0')) && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div className="text-sm text-yellow-700">
                      <p className="font-medium">Values differ from customer submission:</p>
                      {parseFloat(verifiedWeight) !== parseFloat(selectedConsignment?.weight || '0') && (
                        <p>• Weight: Customer {selectedConsignment?.weight} oz → Verified {verifiedWeight} oz</p>
                      )}
                      {parseFloat(verifiedPurity) !== parseFloat(selectedConsignment?.purity || '0') && (
                        <p>• Purity: Customer {selectedConsignment?.purity}% → Verified {verifiedPurity}%</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setVerificationDialogOpen(false)}
                  data-testid="button-cancel-verification"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setVerificationDialogOpen(false);
                    setRejectionDialogOpen(true);
                  }}
                  data-testid="button-reject-consignment"
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => {
                    const weight = parseFloat(verifiedWeight);
                    const purity = parseFloat(verifiedPurity);
                    
                    if (!weight || weight <= 0) {
                      toast({
                        title: "Invalid Weight",
                        description: "Please enter a valid weight greater than 0.",
                        variant: "destructive",
                      });
                      return;
                    }
                    
                    if (!purity || purity <= 0 || purity > 100) {
                      toast({
                        title: "Invalid Purity",
                        description: "Please enter a valid purity between 0 and 100%.",
                        variant: "destructive",
                      });
                      return;
                    }

                    verifyConsignmentMutation.mutate({
                      id: selectedConsignment.id,
                      verifiedWeight: weight,
                      verifiedPurity: purity,
                      adminNotes: verificationNotes,
                      addToAccount,
                    });
                  }}
                  disabled={verifyConsignmentMutation.isPending}
                  data-testid="button-verify-consignment"
                >
                  {verifyConsignmentMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2"></div>
                      Verifying...
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Verify Consignment
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Status Update Dialog */}
        <Dialog open={statusUpdateDialogOpen} onOpenChange={setStatusUpdateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Consignment Status</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="bg-muted p-3 rounded">
                <p className="text-sm">
                  <span className="font-medium">Consignment:</span> {selectedConsignment?.consignmentNumber}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Current Status:</span> {selectedConsignment?.status}
                </p>
              </div>

              <div>
                <Label htmlFor="newStatus">New Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger data-testid="select-new-status">
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="stored">Stored</SelectItem>
                    <SelectItem value="claimed">Claimed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="statusNotes">Admin Notes</Label>
                <Textarea
                  id="statusNotes"
                  placeholder="Add notes about this status change..."
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  rows={3}
                  data-testid="textarea-status-notes"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setStatusUpdateDialogOpen(false)}
                  data-testid="button-cancel-status-update"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (!newStatus) {
                      toast({
                        title: "Missing Status",
                        description: "Please select a new status.",
                        variant: "destructive",
                      });
                      return;
                    }

                    updateConsignmentStatusMutation.mutate({
                      id: selectedConsignment.id,
                      status: newStatus,
                      adminNotes: statusNotes,
                    });
                  }}
                  disabled={updateConsignmentStatusMutation.isPending}
                  data-testid="button-update-status"
                >
                  {updateConsignmentStatusMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Settings className="h-4 w-4 mr-2" />
                      Update Status
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

        {/* Document Verification Dialog */}
        <Dialog open={documentVerificationDialog} onOpenChange={setDocumentVerificationDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Document Verification
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {selectedDocument && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Document Details</h4>
                  <div className="text-sm space-y-1">
                    <p><span className="text-muted-foreground">Type:</span> {selectedDocument.type} Document</p>
                    <p><span className="text-muted-foreground">File:</span> Document {selectedDocument.index + 1}</p>
                    <p><span className="text-muted-foreground">URL:</span> <span className="font-mono text-xs break-all">{selectedDocument.url}</span></p>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="documentStatus">Verification Status</Label>
                <Select value={documentStatus} onValueChange={setDocumentStatus}>
                  <SelectTrigger data-testid="select-document-status">
                    <SelectValue placeholder="Select verification status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="verified">Verified ✓</SelectItem>
                    <SelectItem value="rejected">Rejected ✗</SelectItem>
                    <SelectItem value="requires_clarification">Requires Clarification ⚠️</SelectItem>
                    <SelectItem value="pending_additional">Pending Additional Documents 📋</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="documentNotes">Verification Notes</Label>
                <Textarea
                  id="documentNotes"
                  value={documentNotes}
                  onChange={(e) => setDocumentNotes(e.target.value)}
                  placeholder="Document verification details, authenticity checks, issues found..."
                  rows={4}
                  data-testid="textarea-document-notes"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDocumentVerificationDialog(false);
                    setDocumentStatus("");
                    setDocumentNotes("");
                    setSelectedDocument(null);
                  }}
                  data-testid="button-cancel-document-verification"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (!documentStatus) {
                      toast({
                        title: "Missing Status",
                        description: "Please select a verification status.",
                        variant: "destructive",
                      });
                      return;
                    }

                    toast({
                      title: "Document Verified",
                      description: `Document ${selectedDocument?.index + 1} marked as ${documentStatus}.`,
                    });

                    setDocumentVerificationDialog(false);
                    setDocumentStatus("");
                    setDocumentNotes("");
                    setSelectedDocument(null);
                  }}
                  disabled={!documentStatus}
                  data-testid="button-save-document-verification"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Save Verification
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Claim Resolution Dialog */}
        <Dialog open={resolutionDialog} onOpenChange={setResolutionDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {resolutionType === 'approved' ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : resolutionType === 'rejected' ? (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                ) : (
                  <FileQuestion className="h-5 w-5 text-blue-600" />
                )}
                {resolutionType === 'approved' ? 'Approve Claim' : 
                 resolutionType === 'rejected' ? 'Reject Claim' : 
                 'Request Additional Information'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className={`p-4 rounded-lg ${
                resolutionType === 'approved' ? 'bg-green-50 dark:bg-green-900/20' :
                resolutionType === 'rejected' ? 'bg-red-50 dark:bg-red-900/20' :
                'bg-blue-50 dark:bg-blue-900/20'
              }`}>
                <h4 className="font-medium mb-2">Resolution Summary</h4>
                <div className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">Claimant:</span> {selectedClaim?.claimantName}</p>
                  <p><span className="text-muted-foreground">Claim Type:</span> {selectedClaim?.claimType || 'inheritance'}</p>
                  <p><span className="text-muted-foreground">Action:</span> 
                    <span className={`ml-1 font-medium ${
                      resolutionType === 'approved' ? 'text-green-700 dark:text-green-400' :
                      resolutionType === 'rejected' ? 'text-red-700 dark:text-red-400' :
                      'text-blue-700 dark:text-blue-400'
                    }`}>
                      {resolutionType === 'approved' ? 'APPROVE CLAIM' : 
                       resolutionType === 'rejected' ? 'REJECT CLAIM' : 
                       'REQUEST ADDITIONAL INFORMATION'}
                    </span>
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="resolutionDetails">
                  {resolutionType === 'approved' ? 'Approval Details & Next Steps' : 
                   resolutionType === 'rejected' ? 'Rejection Reason & Explanation' : 
                   'Information Required'}
                </Label>
                <Textarea
                  id="resolutionDetails"
                  value={resolutionDetails}
                  onChange={(e) => setResolutionDetails(e.target.value)}
                  placeholder={
                    resolutionType === 'approved' ? 
                      'Explain the approval decision, next steps for the claimant, timeline for resolution...' :
                    resolutionType === 'rejected' ? 
                      'Provide detailed reason for rejection, legal basis, appeal process if applicable...' :
                      'Specify what additional documents or information is needed from the claimant...'
                  }
                  rows={6}
                  data-testid="textarea-resolution-details"
                />
              </div>

              {resolutionType === 'approved' && (
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    <strong>⚠️ Important:</strong> Approving this claim will initiate the resolution process. 
                    Ensure all documentation has been properly verified and legal requirements met.
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setResolutionDialog(false);
                    setResolutionType("");
                    setResolutionDetails("");
                  }}
                  data-testid="button-cancel-resolution"
                >
                  Cancel
                </Button>
                <Button
                  variant={resolutionType === 'rejected' ? 'destructive' : 'default'}
                  onClick={() => {
                    if (!resolutionDetails.trim()) {
                      toast({
                        title: "Missing Details",
                        description: "Please provide resolution details.",
                        variant: "destructive",
                      });
                      return;
                    }

                    // Update claim with resolution
                    updateClaimMutation.mutate({
                      id: selectedClaim.id,
                      status: resolutionType === 'additional_info' ? 'pending_info' : resolutionType,
                      adminNotes: `${claimNotes}\n\nResolution Details: ${resolutionDetails}`,
                    });

                    setResolutionDialog(false);
                    setResolutionType("");
                    setResolutionDetails("");
                  }}
                  disabled={updateClaimMutation.isPending || !resolutionDetails.trim()}
                  data-testid="button-confirm-resolution"
                >
                  {updateClaimMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      {resolutionType === 'approved' ? (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      ) : resolutionType === 'rejected' ? (
                        <AlertTriangle className="h-4 w-4 mr-2" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      {resolutionType === 'approved' ? 'Approve Claim' : 
                       resolutionType === 'rejected' ? 'Reject Claim' : 
                       'Send Request'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Escalation Dialog */}
        <Dialog open={escalationDialog} onOpenChange={setEscalationDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ArrowUp className="h-5 w-5 text-orange-600" />
                Escalate Support Ticket
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Ticket Information</h4>
                <div className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">Customer:</span> {selectedTicket?.customer}</p>
                  <p><span className="text-muted-foreground">Subject:</span> {selectedTicket?.subject}</p>
                  <p><span className="text-muted-foreground">Current Priority:</span> 
                    <Badge variant="destructive" className="ml-2 text-xs">{selectedTicket?.priority}</Badge>
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="escalationTo">Escalate To</Label>
                <Select value={escalationTo} onValueChange={setEscalationTo}>
                  <SelectTrigger data-testid="select-escalation-target">
                    <SelectValue placeholder="Select escalation target" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="senior_support">Senior Support Manager</SelectItem>
                    <SelectItem value="technical_team">Technical Team Lead</SelectItem>
                    <SelectItem value="legal_team">Legal Department</SelectItem>
                    <SelectItem value="executive_team">Executive Team</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="escalationReason">Escalation Reason</Label>
                <Textarea
                  id="escalationReason"
                  value={escalationReason}
                  onChange={(e) => setEscalationReason(e.target.value)}
                  placeholder="Please provide detailed reason for escalation, current situation, and what resolution is needed..."
                  rows={5}
                  data-testid="textarea-escalation-reason"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEscalationDialog(false);
                    setEscalationReason("");
                    setEscalationTo("");
                  }}
                  data-testid="button-cancel-escalation"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (!escalationReason.trim() || !escalationTo) {
                      toast({
                        title: "Missing Information",
                        description: "Please select escalation target and provide reason.",
                        variant: "destructive",
                      });
                      return;
                    }

                    toast({
                      title: "Ticket Escalated",
                      description: `Ticket escalated to ${escalationTo.replace('_', ' ')} successfully.`,
                    });

                    setEscalationDialog(false);
                    setEscalationReason("");
                    setEscalationTo("");
                  }}
                  disabled={!escalationReason.trim() || !escalationTo}
                  data-testid="button-confirm-escalation"
                >
                  <ArrowUp className="h-4 w-4 mr-2" />
                  Escalate Ticket
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Live Chat Dialog */}
        <Dialog open={chatDialog} onOpenChange={setChatDialog}>
          <DialogContent className="max-w-3xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-green-600" />
                Live Chat - {activeChatUser?.customerName}
                <Badge variant="default" className="bg-green-100 text-green-800 text-xs">Online</Badge>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="bg-muted/30 p-4 rounded-lg">
                <div className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">Customer:</span> {activeChatUser?.customer}</p>
                  <p><span className="text-muted-foreground">Email:</span> {activeChatUser?.email}</p>
                  <p><span className="text-muted-foreground">Related Ticket:</span> {activeChatUser?.subject}</p>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="h-[300px] overflow-y-auto border rounded-lg p-4 bg-background">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg max-w-sm">
                        <p className="text-sm">{activeChatUser?.lastMessage}</p>
                        <span className="text-xs text-muted-foreground">Customer • {activeChatUser?.time}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 justify-end">
                    <div className="flex-1">
                      <div className="bg-primary text-primary-foreground p-3 rounded-lg max-w-sm ml-auto">
                        <p className="text-sm">Thank you for reaching out. I'm here to help with your inquiry. Let me look into this right away.</p>
                        <span className="text-xs opacity-80">Admin • Just now</span>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <UserCog className="h-4 w-4 text-primary-foreground" />
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg max-w-sm">
                        <p className="text-sm">Great, thanks! I really need this resolved quickly.</p>
                        <span className="text-xs text-muted-foreground">Customer • Just now</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Input */}
              <div className="flex gap-2">
                <Input
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Type your message..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && chatMessage.trim()) {
                      toast({
                        title: "Message Sent",
                        description: "Your message has been sent to the customer.",
                      });
                      setChatMessage("");
                    }
                  }}
                  className="flex-1"
                  data-testid="input-chat-message"
                />
                <Button
                  onClick={() => {
                    if (chatMessage.trim() && activeChatUser?.chatSessionId) {
                      sendChatMessageMutation.mutate({
                        sessionId: activeChatUser.chatSessionId,
                        message: chatMessage,
                        ticketId: activeChatUser.id
                      });
                    }
                  }}
                  disabled={!chatMessage.trim()}
                  data-testid="button-send-chat"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Customer typing...</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" data-testid="button-call-customer">
                    <PhoneCall className="h-4 w-4 mr-1" />
                    Call
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setChatDialog(false)}
                    data-testid="button-end-chat"
                  >
                    End Chat
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Notification Dialog */}
        <Dialog open={notificationDialog} onOpenChange={setNotificationDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BellRing className="h-5 w-5 text-blue-600" />
                Send Customer Notifications
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Notification Options</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="notify-all"
                      checked={notificationUsers.includes('all')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setNotificationUsers(['all', 'email', 'sms', 'push']);
                        } else {
                          setNotificationUsers([]);
                        }
                      }}
                    />
                    <Label htmlFor="notify-all" className="text-sm">All active customers</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="notify-support"
                      checked={notificationUsers.includes('support')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setNotificationUsers([...notificationUsers, 'support']);
                        } else {
                          setNotificationUsers(notificationUsers.filter(u => u !== 'support'));
                        }
                      }}
                    />
                    <Label htmlFor="notify-support" className="text-sm">Customers with open support tickets</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="notify-high-priority"
                      checked={notificationUsers.includes('high_priority')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setNotificationUsers([...notificationUsers, 'high_priority']);
                        } else {
                          setNotificationUsers(notificationUsers.filter(u => u !== 'high_priority'));
                        }
                      }}
                    />
                    <Label htmlFor="notify-high-priority" className="text-sm">High-value customers only</Label>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="notificationMessage">Notification Message</Label>
                <Textarea
                  id="notificationMessage"
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  placeholder="Enter your notification message (maintenance updates, service announcements, etc.)..."
                  rows={4}
                  data-testid="textarea-notification"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setNotificationDialog(false);
                    setNotificationMessage("");
                    setNotificationUsers([]);
                  }}
                  data-testid="button-cancel-notification"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (!notificationMessage.trim() || notificationUsers.length === 0) {
                      toast({
                        title: "Missing Information",
                        description: "Please enter a message and select notification targets.",
                        variant: "destructive",
                      });
                      return;
                    }

                    toast({
                      title: "Notifications Sent",
                      description: `Notifications sent to ${notificationUsers.length} user group(s) successfully.`,
                    });

                    setNotificationDialog(false);
                    setNotificationMessage("");
                    setNotificationUsers([]);
                  }}
                  disabled={!notificationMessage.trim() || notificationUsers.length === 0}
                  data-testid="button-send-notification"
                >
                  <BellRing className="h-4 w-4 mr-2" />
                  Send Notifications
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Resolve Ticket Dialog */}
        <Dialog open={resolveDialog} onOpenChange={setResolveDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Resolve Ticket</DialogTitle>
              <DialogDescription>
                Mark this ticket as resolved and add resolution notes.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="resolutionNotes">Resolution Notes</Label>
                <Textarea
                  id="resolutionNotes"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Describe how the issue was resolved..."
                  rows={4}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setResolveDialog(false);
                    setResolutionNotes("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (selectedTicket) {
                      resolveTicketMutation.mutate({
                        id: selectedTicket.id,
                        resolutionNotes: resolutionNotes || "Ticket resolved by admin."
                      });
                    }
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Resolve Ticket
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Tracking Update Dialog */}
        <Dialog open={trackingUpdateDialogOpen} onOpenChange={setTrackingUpdateDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Update Tracking</DialogTitle>
              <DialogDescription>
                Update the tracking status and location for consignment #{selectedConsignmentForTracking?.trackingId || selectedConsignmentForTracking?.consignmentNumber}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="trackingStatus">Tracking Status</Label>
                <Select value={trackingStatus} onValueChange={setTrackingStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="received">📦 Received</SelectItem>
                    <SelectItem value="in_vault">🏦 In Vault</SelectItem>
                    <SelectItem value="under_review">🔍 Under Review</SelectItem>
                    <SelectItem value="in_transit">🚚 In Transit</SelectItem>
                    <SelectItem value="delivered">✅ Delivered</SelectItem>
                    <SelectItem value="rejected">❌ Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="trackingLocation">Current Location</Label>
                <Input
                  id="trackingLocation"
                  value={trackingLocation}
                  onChange={(e) => setTrackingLocation(e.target.value)}
                  placeholder="e.g., New York Distribution Center"
                />
              </div>
              
              <div>
                <Label htmlFor="trackingDescription">Update Description</Label>
                <Textarea
                  id="trackingDescription"
                  value={trackingDescription}
                  onChange={(e) => setTrackingDescription(e.target.value)}
                  placeholder="Additional details about this tracking update..."
                  rows={3}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="notifyCustomer"
                  checked={notifyCustomer}
                  onCheckedChange={(checked) => setNotifyCustomer(checked as boolean)}
                />
                <Label htmlFor="notifyCustomer" className="text-sm">Send notification to customer</Label>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setTrackingUpdateDialogOpen(false);
                    setSelectedConsignmentForTracking(null);
                    setTrackingStatus("");
                    setTrackingLocation("");
                    setTrackingDescription("");
                    setNotifyCustomer(true);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleTrackingUpdate}
                  disabled={updateTrackingMutation.isPending || !trackingStatus}
                >
                  {updateTrackingMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Truck className="h-4 w-4 mr-2" />
                      Update Tracking
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      <Footer />
    </div>
  );
}
