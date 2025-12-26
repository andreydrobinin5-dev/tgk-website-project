import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Booking {
  id: number;
  slot_id: number;
  name: string;
  contact: string;
  type: string;
  comment: string;
  photos: string[];
  receipt_url: string | null;
  date: string;
  time: string;
  created_at: string;
}

const AdminBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/406a4a18-71da-46ec-a8a4-efc9c7c87810');
      const data = await response.json();
      setBookings(data);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить заявки',
        variant: 'destructive'
      });
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'know_what_i_want': 'Знаю, что хочу',
      'not_sure': 'Не определилась',
      'no_design': 'Без дизайна'
    };
    return labels[type] || type;
  };

  const openDetail = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsDetailOpen(true);
  };

  const handleDelete = async (bookingId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Вы уверены, что хотите удалить эту заявку?')) {
      return;
    }

    try {
      const response = await fetch(`https://functions.poehali.dev/406a4a18-71da-46ec-a8a4-efc9c7c87810?id=${bookingId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: 'Заявка удалена, слот освобожден'
        });
        fetchBookings();
      } else {
        const data = await response.json();
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось удалить заявку',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Проблема с подключением',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Заявки клиентов</CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Icon name="Users" size={48} className="mx-auto mb-4 opacity-50" />
              <p>Заявок пока нет</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  onClick={() => openDetail(booking)}
                  className="bg-muted rounded-xl p-4 cursor-pointer hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Icon name="User" size={20} className="text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{booking.name}</h3>
                        <p className="text-sm text-muted-foreground">{booking.contact}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-medium">
                          {new Date(booking.date).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'short'
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground">{booking.time.slice(0, 5)}</p>
                      </div>
                      <Button
                        onClick={(e) => handleDelete(booking.id, e)}
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Icon name="Trash2" size={18} />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Icon name="Info" size={14} />
                    <span>{getTypeLabel(booking.type)}</span>
                    {booking.receipt_url && (
                      <>
                        <span>•</span>
                        <span className="text-green-600 flex items-center gap-1">
                          <Icon name="CheckCircle" size={14} />
                          Оплачено
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Детали заявки</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-4 pr-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Имя</p>
                    <p className="font-medium">{selectedBooking.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Контакт</p>
                    <p className="font-medium">{selectedBooking.contact}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Дата записи</p>
                    <p className="font-medium">
                      {new Date(selectedBooking.date).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Время</p>
                    <p className="font-medium">{selectedBooking.time.slice(0, 5)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Тип записи</p>
                    <p className="font-medium">{getTypeLabel(selectedBooking.type)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Дата создания</p>
                    <p className="font-medium">
                      {new Date(selectedBooking.created_at).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                </div>

                {selectedBooking.comment && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Комментарий</p>
                    <p className="bg-muted p-3 rounded-lg">{selectedBooking.comment}</p>
                  </div>
                )}

                {selectedBooking.photos && selectedBooking.photos.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Фото-референсы</p>
                    <div className="grid grid-cols-3 gap-3">
                      {selectedBooking.photos.map((photo, idx) => (
                        <img
                          key={idx}
                          src={photo}
                          alt={`Референс ${idx + 1}`}
                          className="w-full aspect-square object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {selectedBooking.receipt_url && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Чек об оплате</p>
                    <img
                      src={selectedBooking.receipt_url}
                      alt="Чек"
                      className="w-48 rounded-lg"
                    />
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBookings;