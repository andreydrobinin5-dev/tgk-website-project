import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface HeroSectionProps {
  onScrollToBooking: () => void;
  onScrollToPortfolio: () => void;
}

const HeroSection = ({ onScrollToBooking, onScrollToPortfolio }: HeroSectionProps) => {
  return (
    <section id="home" className="pt-32 pb-20 px-4">
      <div className="container mx-auto max-w-6xl text-center">
        <Badge variant="secondary" className="mb-6 bg-white/60 backdrop-blur-sm">
          💅 Мастер маникюра
        </Badge>
        <h2 className="text-6xl md:text-7xl font-bold leading-tight mb-6 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent animate-fade-in">
          Ваши ногти —<br />наше искусство
        </h2>
        <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto animate-fade-in">
          Создаём уникальные дизайны и обеспечиваем идеальный уход
        </p>
        <div className="flex gap-4 justify-center animate-slide-up">
          <Button 
            size="lg" 
            onClick={onScrollToBooking}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-lg px-8"
          >
            Записаться онлайн
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            onClick={onScrollToPortfolio}
            className="text-lg px-8 border-2"
          >
            Работы
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
