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

  const handleScrollToPortfolio = () => {
    const element = document.getElementById('portfolio');
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section id="home" className="pt-32 pb-24 px-6">
      <div className="container mx-auto max-w-5xl text-center">
        <h2 className="text-6xl md:text-8xl font-medium leading-[1.1] mb-6 tracking-tight min-h-[200px] md:min-h-[300px]" style={{ fontFamily: "'Playfair Display', serif" }}>
          {displayedText.split('\n').map((line, idx) => (
            <span key={idx}>
              {line}
              {idx < displayedText.split('\n').length - 1 && <br />}
            </span>
          ))}
          <span className="animate-pulse">|</span>
        </h2>
        <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto animate-fade-in font-light">
          Создаю уникальные дизайны с заботой о ваших ногтях
        </p>
        <div className="flex gap-4 justify-center animate-slide-up">
          <Button 
            size="lg" 
            onClick={onScrollToBooking}
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-base px-8 h-12 rounded-full"
          >
            Записаться онлайн
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            onClick={handleScrollToPortfolio}
            className="text-base px-8 h-12 rounded-full border-border hover:bg-muted"
          >
            Смотреть работы
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;