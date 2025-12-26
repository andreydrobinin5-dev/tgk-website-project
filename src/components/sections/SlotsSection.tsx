import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface TimeSlot {
  id: number;
  date: string;
  time: string;
  available: boolean;
}

interface SlotsSectionProps {
  groupedSlots: Record<string, TimeSlot[]>;
  selectedSlot: TimeSlot | null;
  onSelectSlot: (slot: TimeSlot) => void;
  onScrollToBooking: () => void;
}

const SlotsSection = ({ groupedSlots, selectedSlot, onSelectSlot, onScrollToBooking }: SlotsSectionProps) => {
  return (
    <section id="slots" className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-5xl font-bold text-center mb-12 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
          Свободные окошки
        </h2>
        {Object.keys(groupedSlots).length === 0 ? (
          <Card className="p-8 text-center bg-white/60 backdrop-blur-sm border-white/40">
            <p className="text-gray-600">Свободных слотов пока нет. Мастер скоро добавит новые окошки!</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedSlots).map(([date, dateSlots]) => (
              <Card key={date} className="p-6 bg-white/60 backdrop-blur-sm border-white/40 animate-fade-in">
                <h3 className="text-xl font-semibold mb-4">
                  {new Date(date).toLocaleDateString('ru-RU', { 
                    day: 'numeric', 
                    month: 'long',
                    weekday: 'short'
                  })}
                </h3>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {dateSlots.map((slot) => (
                    <Button
                      key={slot.id}
                      variant={selectedSlot?.id === slot.id ? 'default' : 'outline'}
                      disabled={!slot.available}
                      onClick={() => {
                        onSelectSlot(slot);
                        onScrollToBooking();
                      }}
                      className={selectedSlot?.id === slot.id ? 'bg-gradient-to-r from-pink-500 to-purple-600' : ''}
                    >
                      {slot.time.slice(0, 5)}
                    </Button>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default SlotsSection;
