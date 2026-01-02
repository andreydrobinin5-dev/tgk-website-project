import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useState } from 'react';
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
  onBookNow: () => void;
}

const CalendarModal = ({ open, onOpenChange, groupedSlots, onBookNow }: CalendarModalProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const getLocalDateStr = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const tileDisabled = ({ date }: { date: Date }) => {
    const dateStr = getLocalDateStr(date);
    return !groupedSlots[dateStr];
  };

  const tileClassName = ({ date }: { date: Date }) => {
    const dateStr = getLocalDateStr(date);
    if (groupedSlots[dateStr]) {
      return 'available-date';
    }
    return '';
  };

  const tileContent = ({ date }: { date: Date }) => {
    const dateStr = getLocalDateStr(date);
    const slots = groupedSlots[dateStr];
    
    if (slots && slots.length > 0) {
      return (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs font-semibold px-1.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
          {slots.length}
        </div>
      );
    }
    return null;
  };

  const handleDateChange = (value: Date | null) => {
    setSelectedDate(value);
  };

  const selectedDateStr = selectedDate ? getLocalDateStr(selectedDate) : undefined;
  const timeSlotsForSelectedDate = selectedDateStr ? groupedSlots[selectedDateStr] || [] : [];

  const getMonthDay = (dateStr: string) => {
    // Парсим дату как локальную, а не UTC
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getDayName = (dateStr: string) => {
    // Парсим дату как локальную, а не UTC
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('ru-RU', { weekday: 'long' });
  };

  const handleBookClick = () => {
    onOpenChange(false);
    onBookNow();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] sm:max-h-[90vh] p-0 gap-0 bg-card backdrop-blur-3xl border-border shadow-2xl overflow-hidden">
        <DialogHeader className="px-4 sm:px-6 md:px-8 pt-4 sm:pt-6 md:pt-8 pb-3 md:pb-4">
          <DialogTitle className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight">
            Расписание записи
          </DialogTitle>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">Выберите удобную дату и время</p>
        </DialogHeader>

        <ScrollArea className="h-full max-h-[calc(95vh-120px)] sm:max-h-[calc(90vh-140px)]">
          <div className="px-4 sm:px-6 md:px-8 pb-4 sm:pb-6 md:pb-8">
            {Object.keys(groupedSlots).length === 0 ? (
              <div className="py-8 sm:py-12 text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Icon name="Calendar" size={28} className="text-muted-foreground sm:w-8 sm:h-8" />
                </div>
                <p className="text-sm sm:text-base text-muted-foreground">Расписание пока не добавлено</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                <div className="bg-background rounded-2xl p-4 md:p-6 border border-border">
                  <div className="calendar-wrapper">
                    <Calendar
                      onChange={handleDateChange as any}
                      value={selectedDate}
                      tileDisabled={tileDisabled}
                      tileClassName={tileClassName}
                      tileContent={tileContent}
                      locale="ru-RU"
                      minDate={new Date()}
                    />
                  </div>
                </div>

                <div className="bg-background rounded-2xl p-4 md:p-6 border border-border">
                  {selectedDate && timeSlotsForSelectedDate.length > 0 ? (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xl md:text-2xl font-medium mb-1">
                          {getMonthDay(selectedDateStr!)}
                        </h3>
                        <p className="text-sm text-muted-foreground capitalize">
                          {getDayName(selectedDateStr!)}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <p className="text-sm font-medium text-muted-foreground">
                          Доступное время ({timeSlotsForSelectedDate.filter(s => s.available).length} окошек)
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {timeSlotsForSelectedDate.map((slot) => (
                            <div
                              key={slot.id}
                              className={`
                                px-3 py-2 rounded-lg text-center text-sm font-medium
                                ${slot.available 
                                  ? 'bg-primary/10 text-primary border-2 border-primary/20' 
                                  : 'bg-muted text-muted-foreground line-through border border-border'
                                }
                              `}
                            >
                              {slot.time.slice(0, 5)}
                            </div>
                          ))}
                        </div>
                      </div>

                      <Button 
                        onClick={handleBookClick}
                        className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground text-base mt-4"
                      >
                        Записаться на {selectedDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                      </Button>
                    </div>
                  ) : selectedDate ? (
                    <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        <Icon name="X" size={24} className="text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Нет доступных окошек на эту дату
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        <Icon name="CalendarDays" size={24} className="text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground px-4">
                        Выберите дату в календаре, чтобы увидеть свободные окошки
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default CalendarModal;