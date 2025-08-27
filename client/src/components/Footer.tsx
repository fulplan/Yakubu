import { Shield, Linkedin, Twitter, Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const serviceLinks = [
    { label: "Gold Storage", href: "#services" },
    { label: "Consignment", href: "/consignment" },
    { label: "Digital Inheritance", href: "#inheritance" },
    { label: "Investment Advisory", href: "#advisory" },
    { label: "Insurance Services", href: "#insurance" },
  ];

  const supportLinks = [
    { label: "Help Center", href: "#help" },
    { label: "Contact Us", href: "#contact" },
    { label: "Track Consignment", href: "/tracking" },
    { label: "Pricing Calculator", href: "#pricing" },
    { label: "Live Chat", href: "#chat" },
  ];

  const legalLinks = [
    { label: "Privacy Policy", href: "#privacy" },
    { label: "Terms of Service", href: "#terms" },
    { label: "GDPR Compliance", href: "#gdpr" },
  ];

  const handleLinkClick = (href: string) => {
    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      element?.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = href;
    }
  };

  return (
    <footer className="bg-card border-t border-border" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2" data-testid="company-info">
            <div className="flex items-center mb-4">
              <Shield className="h-8 w-8 text-primary mr-2" />
              <h3 className="text-2xl font-serif font-bold text-primary">
                GoldVault Pro
              </h3>
            </div>
            <p className="text-muted-foreground mb-6 max-w-md">
              The world's most trusted platform for secure gold storage, investment, and inheritance planning. 
              Protecting wealth for future generations since 2020.
            </p>
            <div className="flex space-x-4">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-primary transition-colors"
                onClick={() => window.open('#', '_blank')}
                data-testid="social-linkedin"
              >
                <Linkedin className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-primary transition-colors"
                onClick={() => window.open('#', '_blank')}
                data-testid="social-twitter"
              >
                <Twitter className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-primary transition-colors"
                onClick={() => window.open('#', '_blank')}
                data-testid="social-facebook"
              >
                <Facebook className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {/* Services Links */}
          <div data-testid="services-links">
            <h4 className="font-semibold mb-4">Services</h4>
            <ul className="space-y-2">
              {serviceLinks.map((link, index) => (
                <li key={index}>
                  <Button
                    variant="ghost"
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors p-0 h-auto justify-start"
                    onClick={() => handleLinkClick(link.href)}
                    data-testid={`service-link-${index}`}
                  >
                    {link.label}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Support Links */}
          <div data-testid="support-links">
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              {supportLinks.map((link, index) => (
                <li key={index}>
                  <Button
                    variant="ghost"
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors p-0 h-auto justify-start"
                    onClick={() => handleLinkClick(link.href)}
                    data-testid={`support-link-${index}`}
                  >
                    {link.label}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Footer Bottom */}
        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center" data-testid="footer-bottom">
          <div className="text-sm text-muted-foreground mb-4 md:mb-0">
            © {currentYear} GoldVault Pro. All rights reserved. |{' '}
            {legalLinks.map((link, index) => (
              <span key={index}>
                <Button
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground p-0 h-auto text-sm"
                  onClick={() => handleLinkClick(link.href)}
                  data-testid={`legal-link-${index}`}
                >
                  {link.label}
                </Button>
                {index < legalLinks.length - 1 && ' | '}
              </span>
            ))}
          </div>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground" data-testid="security-badges">
            <span className="flex items-center">
              <Shield className="h-4 w-4 text-green-600 mr-1" />
              SSL Secured
            </span>
            <span className="flex items-center">
              <Shield className="h-4 w-4 text-green-600 mr-1" />
              Bank-Grade Security
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
