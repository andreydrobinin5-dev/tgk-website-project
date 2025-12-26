import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
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
  const [newSlotDate, setNewSlotDate] = useState('');
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
    if (!newSlotDate || !newSlotTime) {
      toast({
        title: 'Ошибка',
        description: 'Заполните дату и время',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await fetch('https://functions.poehali.dev/9689b825-c9ac-49db-b85b-f1310460470d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: newSlotDate,
          time: newSlotTime
        })
      });

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: 'Слот добавлен'
        });
        setNewSlotDate('');
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
                  Добавить слот
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Новый слот</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label htmlFor="date">Дата</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newSlotDate}
                      onChange={(e) => setNewSlotDate(e.target.value)}
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
          {Object.keys(groupedSlots).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Слотов пока нет. Добавьте первый слот.
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedSlots).map(([date, dateSlots]) => (
                <div key={date} className="bg-muted rounded-xl p-4">
                  <h3 className="font-medium mb-3">
                    {new Date(date).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      weekday: 'short'
                    })}
                  </h3>
                  <div className="space-y-2">
                    {dateSlots.map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between bg-card p-3 rounded-lg"
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSlots;
