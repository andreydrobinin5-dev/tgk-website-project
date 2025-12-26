import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';

interface HeroSectionProps {
  onScrollToBooking: () => void;
  onScrollToPortfolio: () => void;
}

const HeroSection = ({ onScrollToBooking, onScrollToPortfolio }: HeroSectionProps) => {
  const [displayedText, setDisplayedText] = useState('');
  const fullText = 'Ваши ногти —\nнаше искусство';
  
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
    <section id="home" className="pt-32 pb-24 px-6">
      <div className="container mx-auto max-w-5xl text-center">
        <Badge variant="secondary" className="mb-8 bg-gray-100 text-gray-700 border-0 text-sm">
          💅 Профессиональный маникюр
        </Badge>
        <h2 className="text-6xl md:text-8xl font-medium leading-[1.1] mb-6 tracking-tight min-h-[200px] md:min-h-[300px]" style={{ fontFamily: "'Playfair Display', serif" }}>
          {displayedText.split('\n').map((line, idx) => (
            <span key={idx}>
              {line}
              {idx < displayedText.split('\n').length - 1 && <br />}
            </span>
          ))}
          <span className="animate-pulse">|</span>
        </h2>
        <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-2xl mx-auto animate-fade-in font-light">
          Создаём уникальные дизайны и обеспечиваем идеальный уход
        </p>
        <div className="flex gap-4 justify-center animate-slide-up">
          <Button 
            size="lg" 
            onClick={onScrollToBooking}
            className="bg-black hover:bg-gray-800 text-white text-base px-8 h-12 rounded-full"
          >
            Записаться онлайн
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            onClick={onScrollToPortfolio}
            className="text-base px-8 h-12 rounded-full border-gray-300 hover:bg-gray-50"
          >
            Смотреть работы
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;