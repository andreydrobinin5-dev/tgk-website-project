import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface TimeSlot {
  id: number;
  date: string;
  time: string;
  available: boolean;
}

const AdminSlots = () => {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [newSlotTime, setNewSlotTime] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/9689b825-c9ac-49db-b85b-f1310460470d');
      const data = await response.json();
      setSlots(data);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить слоты',
        variant: 'destructive'
      });
    }
  };

  const handleAddSlot = async () => {
    if (!selectedDate || !newSlotTime) {
      toast({
        title: 'Ошибка',
        description: 'Выберите дату и время',
        variant: 'destructive'
      });
      return;
    }

    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    try {
      const response = await fetch('https://functions.poehali.dev/9689b825-c9ac-49db-b85b-f1310460470d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dateStr,
          time: newSlotTime
        })
      });

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: 'Слот добавлен'
        });
        setNewSlotTime('');
        setIsAddDialogOpen(false);
        fetchSlots();
      } else {
        throw new Error('Failed to add slot');
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось добавить слот',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteSlot = async (slotId: number) => {
    try {
      const response = await fetch('https://functions.poehali.dev/9689b825-c9ac-49db-b85b-f1310460470d', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot_id: slotId })
      });

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: 'Слот удален'
        });
        fetchSlots();
      } else {
        throw new Error('Failed to delete slot');
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить слот',
        variant: 'destructive'
      });
    }
  };

  const groupSlotsByDate = (slots: TimeSlot[]) => {
    const grouped: Record<string, TimeSlot[]> = {};
    slots.forEach(slot => {
      if (!grouped[slot.date]) {
        grouped[slot.date] = [];
      }
      grouped[slot.date].push(slot);
    });
    return grouped;
  };

  const groupedSlots = groupSlotsByDate(slots);

  const tileClassName = ({ date }: { date: Date }) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    if (groupedSlots[dateStr]) {
      return 'available-date';
    }
    return '';
  };

  const quickAddTimes = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

  const handleQuickAdd = async (time: string) => {
    if (!selectedDate) {
      toast({
        title: 'Ошибка',
        description: 'Выберите дату в календаре',
        variant: 'destructive'
      });
      return;
    }

    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    try {
      const response = await fetch('https://functions.poehali.dev/9689b825-c9ac-49db-b85b-f1310460470d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dateStr,
          time: time
        })
      });

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: `Слот ${time} добавлен`
        });
        fetchSlots();
      } else {
        throw new Error('Failed to add slot');
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось добавить слот',
        variant: 'destructive'
      });
    }
  };

  const selectedDateStr = selectedDate ? (() => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })() : undefined;
  const slotsForSelectedDate = selectedDateStr ? groupedSlots[selectedDateStr] || [] : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Управление слотами</CardTitle>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Icon name="Plus" size={18} className="mr-2" />
                  Добавить вручную
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Новый слот</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label>Выбранная дата</Label>
                    <Input
                      value={selectedDate?.toLocaleDateString('ru-RU') || 'Не выбрана'}
                      disabled
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Время</Label>
                    <Input
                      id="time"
                      type="time"
                      value={newSlotTime}
                      onChange={(e) => setNewSlotTime(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <Button onClick={handleAddSlot} className="w-full">
                    Добавить
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium mb-3">Выберите дату</h3>
              <div className="calendar-wrapper">
                <Calendar
                  onChange={setSelectedDate as any}
                  value={selectedDate}
                  tileClassName={tileClassName}
                  locale="ru-RU"
                  minDate={new Date()}
                />
              </div>
              
              {selectedDate && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-3">Быстрое добавление времени</h3>
                  <div className="grid grid-cols-5 gap-2">
                    {quickAddTimes.map((time) => (
                      <Button
                        key={time}
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickAdd(time)}
                        className="text-xs"
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              {selectedDate ? (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">
                    Слоты на {selectedDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </h3>
                  {slotsForSelectedDate.length > 0 ? (
                    <div className="space-y-2">
                      {slotsForSelectedDate.map((slot) => (
                        <div
                          key={slot.id}
                          className="flex items-center justify-between bg-muted p-3 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-lg">{slot.time.slice(0, 5)}</span>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                slot.available
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {slot.available ? 'Свободно' : 'Занято'}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSlot(slot.id)}
                          >
                            <Icon name="Trash2" size={16} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Нет слотов на эту дату
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Выберите дату в календаре
                </div>
              )}
            </div>
          </div>

          {Object.keys(groupedSlots).length > 0 && (
            <div className="mt-8 pt-6 border-t border-border">
              <h3 className="text-sm font-medium mb-4">Все слоты</h3>
              <div className="space-y-4">
                {Object.entries(groupedSlots).map(([date, dateSlots]) => (
                  <div key={date} className="bg-muted rounded-xl p-4">
                    <h4 className="font-medium mb-2 text-sm">
                      {new Date(date).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        weekday: 'short'
                      })}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {dateSlots.map((slot) => (
                        <span
                          key={slot.id}
                          className={`text-xs px-3 py-1.5 rounded-full ${
                            slot.available
                              ? 'bg-card text-foreground'
                              : 'bg-card text-muted-foreground line-through'
                          }`}
                        >
                          {slot.time.slice(0, 5)}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSlots;