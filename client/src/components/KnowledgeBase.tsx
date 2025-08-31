import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  BookOpen, 
  ThumbsUp, 
  ThumbsDown, 
  Eye, 
  ChevronRight,
  HelpCircle,
  Shield,
  CreditCard,
  FileText,
  Settings,
  ArrowLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface KnowledgeBaseArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  viewCount: number;
  helpfulVotes: number;
  notHelpfulVotes: number;
  createdAt: string;
  updatedAt: string;
  isPublished: boolean;
}

const categories = [
  { 
    value: "getting_started", 
    label: "Getting Started", 
    icon: BookOpen,
    description: "Learn the basics of our platform"
  },
  { 
    value: "account", 
    label: "Account Management", 
    icon: Shield,
    description: "Manage your account settings and security"
  },
  { 
    value: "consignment", 
    label: "Gold Consignment", 
    icon: FileText,
    description: "Everything about consigning your gold"
  },
  { 
    value: "payments", 
    label: "Payments & Billing", 
    icon: CreditCard,
    description: "Payment methods, billing, and pricing"
  },
  { 
    value: "technical", 
    label: "Technical Support", 
    icon: Settings,
    description: "Troubleshooting and technical issues"
  },
  { 
    value: "general", 
    label: "General", 
    icon: HelpCircle,
    description: "Frequently asked questions"
  },
];

export default function KnowledgeBase() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeBaseArticle | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch articles
  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["/api/knowledge-base", { category: selectedCategory, search: searchTerm }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory) params.append("category", selectedCategory);
      if (searchTerm) params.append("search", searchTerm);
      
      const response = await fetch(`/api/knowledge-base?${params}`);
      if (!response.ok) throw new Error("Failed to fetch articles");
      return response.json();
    },
  });

  // Fetch single article
  const { data: articleDetails } = useQuery({
    queryKey: ["/api/knowledge-base", selectedArticle?.id],
    queryFn: async () => {
      const response = await fetch(`/api/knowledge-base/${selectedArticle?.id}`);
      if (!response.ok) throw new Error("Failed to fetch article");
      return response.json();
    },
    enabled: !!selectedArticle?.id,
  });

  // Vote on article
  const voteMutation = useMutation({
    mutationFn: async ({ articleId, isHelpful }: { articleId: string; isHelpful: boolean }) => {
      const response = await apiRequest("POST", `/api/knowledge-base/${articleId}/vote`, { isHelpful });
      if (!response.ok) throw new Error("Failed to vote");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thank you!",
        description: "Your feedback helps us improve our help center.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-base"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit your feedback. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleVote = (articleId: string, isHelpful: boolean) => {
    voteMutation.mutate({ articleId, isHelpful });
  };

  const filteredArticles = searchTerm 
    ? articles.filter((article: KnowledgeBaseArticle) =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : articles;

  // Article detail view
  if (selectedArticle) {
    const article = articleDetails || selectedArticle;
    
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => setSelectedArticle(null)}
            className="mb-4"
            data-testid="button-back-to-articles"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Help Center
          </Button>
        </div>

        <Card data-testid="article-detail-card">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Badge variant="outline" className="mb-3">
                  {categories.find(cat => cat.value === article.category)?.label || article.category}
                </Badge>
                <CardTitle className="text-2xl mb-3">{article.title}</CardTitle>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span className="flex items-center space-x-1">
                    <Eye className="h-4 w-4" />
                    <span>{article.viewCount} views</span>
                  </span>
                  <span>•</span>
                  <span>Last updated {new Date(article.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="prose prose-sm max-w-none">
            <div 
              className="whitespace-pre-wrap text-foreground leading-relaxed"
              dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, '<br>') }}
            />
          </CardContent>

          <Separator className="my-6" />

          {/* Article feedback */}
          <CardContent>
            <div className="bg-muted/50 rounded-lg p-6">
              <h3 className="font-semibold mb-3">Was this article helpful?</h3>
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleVote(article.id, true)}
                  disabled={voteMutation.isPending}
                  data-testid="button-vote-helpful"
                  className="flex items-center space-x-2"
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span>Yes ({article.helpfulVotes})</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleVote(article.id, false)}
                  disabled={voteMutation.isPending}
                  data-testid="button-vote-not-helpful"
                  className="flex items-center space-x-2"
                >
                  <ThumbsDown className="h-4 w-4" />
                  <span>No ({article.notHelpfulVotes})</span>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                Your feedback helps us improve our documentation.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main knowledge base view
  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-3">Help Center</h1>
        <p className="text-muted-foreground mb-6">
          Find answers to your questions and learn how to make the most of our platform
        </p>
        
        {/* Search */}
        <div className="max-w-md mx-auto relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for help articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-articles"
          />
        </div>
      </div>

      {/* Categories */}
      {!searchTerm && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Card
                key={category.value}
                className={`cursor-pointer hover:shadow-md transition-shadow ${
                  selectedCategory === category.value ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedCategory(
                  selectedCategory === category.value ? null : category.value
                )}
                data-testid={`category-card-${category.value}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{category.label}</h3>
                      <p className="text-sm text-muted-foreground">
                        {category.description}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Articles */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading articles...</p>
          </div>
        ) : filteredArticles.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? "No articles match your search. Try different keywords." 
                  : selectedCategory
                    ? "No articles found in this category."
                    : "No articles available."
                }
              </p>
              {(searchTerm || selectedCategory) && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory(null);
                  }}
                >
                  View All Articles
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {(searchTerm || selectedCategory) && (
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  {searchTerm && `Search results for "${searchTerm}"`}
                  {selectedCategory && `Articles in ${categories.find(c => c.value === selectedCategory)?.label}`}
                  {" "}({filteredArticles.length} articles)
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory(null);
                  }}
                >
                  Clear filters
                </Button>
              </div>
            )}
            
            {filteredArticles.map((article: KnowledgeBaseArticle) => (
              <Card
                key={article.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedArticle(article)}
                data-testid={`article-card-${article.id}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="outline">
                          {categories.find(cat => cat.value === article.category)?.label || article.category}
                        </Badge>
                      </div>
                      
                      <h3 className="font-semibold text-lg mb-2 hover:text-primary transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-muted-foreground mb-3 line-clamp-2">
                        {article.excerpt}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center space-x-1">
                          <Eye className="h-3 w-3" />
                          <span>{article.viewCount} views</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <ThumbsUp className="h-3 w-3" />
                          <span>{article.helpfulVotes} helpful</span>
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground ml-4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>
    </div>
  );
}