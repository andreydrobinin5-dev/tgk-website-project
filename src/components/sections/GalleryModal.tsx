import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PortfolioItem {
  image: string;
  title: string;
}

interface GalleryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portfolio: PortfolioItem[];
}

const GalleryModal = ({ open, onOpenChange, portfolio }: GalleryModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] sm:max-h-[90vh] p-0 gap-0 bg-card backdrop-blur-3xl border-border shadow-2xl overflow-hidden">
        <DialogHeader className="px-4 sm:px-6 md:px-8 pt-4 sm:pt-6 md:pt-8 pb-3 md:pb-4 flex-shrink-0">
          <DialogTitle className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight">
            Мои работы
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Галерея выполненных работ по маникюру
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-full max-h-[calc(95vh-100px)] sm:max-h-[calc(90vh-120px)]">
          <div className="px-4 sm:px-6 md:px-8 pb-4 sm:pb-6 md:pb-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
              {portfolio.map((item, idx) => (
                <div 
                  key={idx}
                  className="group cursor-pointer animate-scale-in"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className="aspect-[3/4] overflow-hidden rounded-xl sm:rounded-2xl bg-muted">
                    <img 
                      src={item.image}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <p className="mt-2 text-xs sm:text-sm font-medium text-muted-foreground text-center">{item.title}</p>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default GalleryModal;