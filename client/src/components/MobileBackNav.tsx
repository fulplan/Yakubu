import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

interface MobileBackNavProps {
  title: string;
  backPath: string;
  subtitle?: string;
}

export default function MobileBackNav({ title, backPath, subtitle }: MobileBackNavProps) {
  const [, setLocation] = useLocation();

  return (
    <div className="md:hidden mobile-back-nav mobile-padding">
      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setLocation(backPath)}
          className="mobile-optimized px-2"
          data-testid="mobile-back-button"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-foreground senior-friendly">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}