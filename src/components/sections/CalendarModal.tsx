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
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0 bg-white/98 backdrop-blur-3xl border-gray-200 shadow-2xl">
        <DialogHeader className="px-8 pt-8 pb-4">
          <DialogTitle className="text-3xl font-semibold tracking-tight">
            Расписание
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-2">Свободные и занятые окошки</p>
        </DialogHeader>

        <ScrollArea className="px-8 pb-8">
          {Object.keys(groupedSlots).length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Icon name="Calendar" size={32} className="text-gray-400" />
              </div>
              <p className="text-gray-600">Расписание пока не добавлено</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedSlots).map(([date, dateSlots]) => {
                const availableCount = dateSlots.filter(s => s.available).length;
                const totalCount = dateSlots.length;
                
                return (
                  <div 
                    key={date}
                    className="bg-gray-50 rounded-2xl p-6 animate-fade-in"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-medium">
                          {getMonthDay(date)}
                        </h3>
                        <p className="text-sm text-gray-600 capitalize">{getDayName(date)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-600">
                          {availableCount} свободно
                        </p>
                        <p className="text-xs text-gray-500">
                          из {totalCount}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                      {dateSlots.map((slot) => (
                        <div
                          key={slot.id}
                          className={`
                            px-3 py-2 rounded-lg text-center text-sm font-medium
                            ${slot.available 
                              ? 'bg-white text-gray-900 border border-gray-200' 
                              : 'bg-gray-200 text-gray-400 line-through'
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