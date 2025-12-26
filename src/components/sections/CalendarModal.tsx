import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';

interface TimeSlot {
  id: number;
  date: string;
  time: string;
  available: boolean;
}

interface CalendarModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupedSlots: Record<string, TimeSlot[]>;
}

const CalendarModal = ({ open, onOpenChange, groupedSlots }: CalendarModalProps) => {
  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { weekday: 'short' });
  };

  const getMonthDay = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] sm:max-h-[90vh] p-0 gap-0 bg-card backdrop-blur-3xl border-border shadow-2xl overflow-hidden">
        <DialogHeader className="px-4 sm:px-6 md:px-8 pt-4 sm:pt-6 md:pt-8 pb-3 md:pb-4">
          <DialogTitle className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight">
            Расписание
          </DialogTitle>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">Свободные и занятые окошки</p>
        </DialogHeader>

        <ScrollArea className="h-full max-h-[calc(95vh-120px)] sm:max-h-[calc(90vh-140px)] px-4 sm:px-6 md:px-8 pb-4 sm:pb-6 md:pb-8">
          {Object.keys(groupedSlots).length === 0 ? (
            <div className="py-8 sm:py-12 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Icon name="Calendar" size={28} className="text-muted-foreground sm:w-8 sm:h-8" />
              </div>
              <p className="text-sm sm:text-base text-muted-foreground">Расписание пока не добавлено</p>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {Object.entries(groupedSlots).map(([date, dateSlots]) => {
                const availableCount = dateSlots.filter(s => s.available).length;
                const totalCount = dateSlots.length;
                
                return (
                  <div 
                    key={date}
                    className="bg-muted rounded-xl sm:rounded-2xl p-4 sm:p-6 animate-fade-in"
                  >
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div>
                        <h3 className="text-base sm:text-lg md:text-xl font-medium">
                          {getMonthDay(date)}
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground capitalize">{getDayName(date)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs sm:text-sm font-medium text-green-600">
                          {availableCount} свободно
                        </p>
                        <p className="text-xs text-muted-foreground">
                          из {totalCount}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {dateSlots.map((slot) => (
                        <div
                          key={slot.id}
                          className={`
                            px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-center text-xs sm:text-sm font-medium
                            ${slot.available 
                              ? 'bg-card text-foreground border border-border' 
                              : 'bg-muted text-muted-foreground line-through'
                            }
                          `}
                        >
                          {slot.time.slice(0, 5)}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default CalendarModal;