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

interface CalendarSectionProps {
  groupedSlots: Record<string, TimeSlot[]>;
  onBookNow: () => void;
}

const CalendarSection = ({ groupedSlots, onBookNow }: CalendarSectionProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const tileDisabled = ({ date }: { date: Date }) => {
    const dateStr = date.toISOString().split('T')[0];
    return !groupedSlots[dateStr];
  };

  const tileClassName = ({ date }: { date: Date }) => {
    const dateStr = date.toISOString().split('T')[0];
    if (groupedSlots[dateStr]) {
      return 'available-date';
    }
    return '';
  };

  const tileContent = ({ date }: { date: Date }) => {
    const dateStr = date.toISOString().split('T')[0];
    const slots = groupedSlots[dateStr];
    if (slots) {
      const available = slots.filter(s => s.available).length;
      if (available > 0) {
        return (
          <div className="text-xs mt-1 font-semibold text-primary">
            {available} окон
          </div>
        );
      }
    }
    return null;
  };

  const handleDateChange = (value: Date | null) => {
    setSelectedDate(value);
  };

  const selectedDateStr = selectedDate?.toISOString().split('T')[0];
  const timeSlotsForSelectedDate = selectedDateStr ? groupedSlots[selectedDateStr] || [] : [];

  const getMonthDay = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { weekday: 'long' });
  };

  return (
    <section id="calendar" className="py-16 md:py-24 px-4 md:px-6 bg-muted/30 scroll-mt-20">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-3 md:mb-4 tracking-tight">
            Свободные окошки
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
            Выберите удобную дату и время для записи
          </p>
        </div>

        {Object.keys(groupedSlots).length === 0 ? (
          <div className="bg-card rounded-2xl p-8 md:p-12 text-center border border-border">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Icon name="Calendar" size={32} className="text-muted-foreground" />
            </div>
            <p className="text-base md:text-lg text-muted-foreground">
              Расписание пока не добавлено
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            <div className="bg-card rounded-2xl p-4 md:p-6 border border-border">
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

            <div className="bg-card rounded-2xl p-4 md:p-6 border border-border">
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
                    onClick={onBookNow}
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
    </section>
  );
};

export default CalendarSection;
