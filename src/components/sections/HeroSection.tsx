import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';

interface HeroSectionProps {
  onScrollToBooking: () => void;
  onScrollToPortfolio: () => void;
}

const HeroSection = ({ onScrollToBooking, onScrollToPortfolio }: HeroSectionProps) => {
  const [displayedText, setDisplayedText] = useState('');
  const fullText = 'Искусство в каждой\nдетали';
  
  useEffect(() => {
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setDisplayedText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
      }
    }, 80);

    return () => clearInterval(typingInterval);
  }, []);



  return (
    <section id="home" className="pt-24 md:pt-32 pb-16 md:pb-24 px-4 md:px-6">
      <div className="container mx-auto max-w-5xl text-center">
        <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-medium leading-[1.1] mb-4 md:mb-6 tracking-tight min-h-[140px] sm:min-h-[180px] md:min-h-[200px] lg:min-h-[300px]" style={{ fontFamily: "'Playfair Display', serif" }}>
          {displayedText.split('\n').map((line, idx) => (
            <span key={idx}>
              {line}
              {idx < displayedText.split('\n').length - 1 && <br />}
            </span>
          ))}
          <span className="animate-pulse">|</span>
        </h2>
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground mb-8 md:mb-12 max-w-2xl mx-auto animate-fade-in font-light px-4">
          Создаю уникальные дизайны с заботой о ваших ногтях
        </p>
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center animate-slide-up px-4">
          <Button 
            size="lg" 
            onClick={onScrollToBooking}
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm md:text-base px-6 md:px-8 h-11 md:h-12 rounded-full w-full sm:w-auto"
          >
            Записаться онлайн
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            onClick={onScrollToPortfolio}
            className="text-sm md:text-base px-6 md:px-8 h-11 md:h-12 rounded-full border-border hover:bg-muted w-full sm:w-auto"
          >
            Смотреть работы
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;