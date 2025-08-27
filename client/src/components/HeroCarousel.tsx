import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";

interface HeroCarouselProps {
  onStartConsignment: () => void;
  onViewPricing: () => void;
}

interface Slide {
  title: string;
  subtitle: string;
  description: string;
  primaryAction: string;
  secondaryAction: string;
  image: string;
}

export default function HeroCarousel({ onStartConsignment, onViewPricing }: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides: Slide[] = [
    {
      title: "Secure Your Gold Legacy",
      subtitle: "Professional gold storage and investment services",
      description: "World-class security, comprehensive insurance, and seamless inheritance planning for your precious metals portfolio.",
      primaryAction: "Consign Gold Now",
      secondaryAction: "View Pricing Plans",
      image: "https://images.unsplash.com/photo-1576086213369-97a306d36557?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&h=1000"
    },
    {
      title: "Bank-Grade Security",
      subtitle: "State-of-the-art vault facilities",
      description: "24/7 monitoring, biometric access, and climate-controlled storage in certified secure facilities across multiple locations.",
      primaryAction: "Learn About Security",
      secondaryAction: "Schedule Tour",
      image: "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&h=1000"
    },
    {
      title: "Digital Inheritance Planning",
      subtitle: "Secure your family's future",
      description: "Advanced digital will creation and inheritance management to ensure your gold assets are passed down according to your wishes.",
      primaryAction: "Create Digital Will",
      secondaryAction: "Learn More",
      image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&h=1000"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const handlePrimaryAction = () => {
    if (currentSlide === 0) {
      onStartConsignment();
    } else if (currentSlide === 1) {
      // Scroll to services section
      document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Scroll to inheritance section or open inheritance planning
      onStartConsignment();
    }
  };

  const handleSecondaryAction = () => {
    if (currentSlide === 0) {
      onViewPricing();
    } else {
      // For other slides, scroll to relevant sections or show more info
      onViewPricing();
    }
  };

  return (
    <section className="relative h-screen overflow-hidden" data-testid="hero-carousel">
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
          style={{
            backgroundImage: `url('${slide.image}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
          data-testid={`slide-${index}`}
        >
          <div className="hero-gradient absolute inset-0"></div>
          <div className="relative h-full flex items-center justify-center text-center">
            <div className="max-w-4xl mx-auto px-4">
              <div className="fade-in">
                <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6">
                  {slide.title.split(' ').map((word, wordIndex) => (
                    <span key={wordIndex}>
                      {word === 'Gold' || word === 'Legacy' || word === 'Security' || word === 'Inheritance' ? (
                        <span className="text-primary">{word}</span>
                      ) : (
                        word
                      )}
                      {wordIndex < slide.title.split(' ').length - 1 && ' '}
                    </span>
                  ))}
                </h1>
                <p className="text-xl md:text-2xl text-gray-200 mb-4">
                  {slide.subtitle}
                </p>
                <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
                  {slide.description}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={handlePrimaryAction}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105"
                    data-testid="hero-primary-action"
                  >
                    <Play className="h-5 w-5 mr-2" />
                    {slide.primaryAction}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleSecondaryAction}
                    className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8 py-4 rounded-lg font-semibold text-lg transition-all"
                    data-testid="hero-secondary-action"
                  >
                    {slide.secondaryAction}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
        onClick={prevSlide}
        data-testid="carousel-prev"
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
        onClick={nextSlide}
        data-testid="carousel-next"
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2" data-testid="carousel-indicators">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide ? 'bg-primary scale-125' : 'bg-white/50 hover:bg-white/70'
            }`}
            onClick={() => goToSlide(index)}
            data-testid={`indicator-${index}`}
          />
        ))}
      </div>

      {/* Auto-play indicator */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
        <div className="bg-black/30 backdrop-blur-sm rounded-full px-3 py-1 text-white/80 text-sm">
          Auto-advancing in {6}s
        </div>
      </div>
    </section>
  );
}
