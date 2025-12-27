import { Card, CardContent } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import Icon from '@/components/ui/icon';

interface PortfolioItem {
  image: string;
  title: string;
}

interface PortfolioSectionProps {
  portfolio: PortfolioItem[];
}

const PortfolioSection = ({ portfolio }: PortfolioSectionProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  
  const displayedPortfolio = showAll ? portfolio : portfolio.slice(0, 6);

  const handlePrev = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedIndex !== null && selectedIndex < portfolio.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'Escape') setSelectedIndex(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex]);

  return (
    <>
    <section id="portfolio" className="py-24 px-6 scroll-mt-20">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-5xl md:text-6xl font-semibold text-center mb-16 tracking-tight">
          Мои работы
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {displayedPortfolio.map((item, idx) => (
            <Card 
              key={idx} 
              className="overflow-hidden group cursor-pointer bg-card border-border hover:shadow-xl transition-all duration-500 animate-scale-in"
              style={{ animationDelay: `${idx * 0.1}s` }}
              onClick={() => setSelectedIndex(idx)}
            >
              <div className="aspect-square overflow-hidden relative">
                <img 
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                  <Icon name="Maximize2" className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" size={32} />
                </div>
              </div>
            </Card>
          ))}
        </div>
        
        {!showAll && portfolio.length > 6 && (
          <div className="flex justify-center mt-12">
            <button
              onClick={() => setShowAll(true)}
              className="px-8 py-4 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-all duration-300 hover:scale-105 shadow-lg"
            >
              Смотреть больше
            </button>
          </div>
        )}
      </div>
    </section>

    <DialogPrimitive.Root open={selectedIndex !== null} onOpenChange={() => setSelectedIndex(null)}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/90 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
          <button 
            onClick={() => setSelectedIndex(null)}
            className="absolute top-2 right-2 sm:top-4 sm:right-4 z-50 bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <Icon name="X" className="text-white" size={20} />
          </button>

          {selectedIndex !== null && selectedIndex > 0 && (
            <button 
              onClick={handlePrev}
              className="absolute left-2 sm:left-4 z-50 bg-white/10 hover:bg-white/20 rounded-full p-2 sm:p-3 transition-colors"
            >
              <Icon name="ChevronLeft" className="text-white" size={24} />
            </button>
          )}

          {selectedIndex !== null && selectedIndex < portfolio.length - 1 && (
            <button 
              onClick={handleNext}
              className="absolute right-2 sm:right-4 z-50 bg-white/10 hover:bg-white/20 rounded-full p-2 sm:p-3 transition-colors"
            >
              <Icon name="ChevronRight" className="text-white" size={24} />
            </button>
          )}

          {selectedIndex !== null && (
            <img 
              key={selectedIndex}
              src={portfolio[selectedIndex].image} 
              alt="Полный размер"
              className="max-w-full max-h-full object-contain animate-in fade-in zoom-in-95 duration-300"
            />
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
    </>
  );
};

export default PortfolioSection;