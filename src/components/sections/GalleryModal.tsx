import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 gap-0 bg-white/98 backdrop-blur-3xl border-gray-200 shadow-2xl">
        <DialogHeader className="px-8 pt-8 pb-4">
          <DialogTitle className="text-3xl font-semibold tracking-tight">
            Мои работы
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="px-8 pb-8">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {portfolio.map((item, idx) => (
              <div 
                key={idx}
                className="group cursor-pointer animate-scale-in"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="aspect-square overflow-hidden rounded-2xl bg-gray-100">
                  <img 
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <p className="mt-3 text-sm font-medium text-gray-700 text-center">{item.title}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default GalleryModal;