import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

interface TimeSlot {
  id: number;
  date: string;
  time: string;
  available: boolean;
}

const Index = () => {
  const [activeSection, setActiveSection] = useState('home');
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [receiptImage, setReceiptImage] = useState<string>('');
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    type: 'know_what_i_want',
    comment: ''
  });

  const portfolio = [
    {
      image: 'https://cdn.poehali.dev/projects/c846c6bc-a002-4737-a261-823e13b16e94/files/c013c942-87f0-431d-a910-2f2b65965aac.jpg',
      title: 'Нежный дизайн'
    },
    {
      image: 'https://cdn.poehali.dev/projects/c846c6bc-a002-4737-a261-823e13b16e94/files/dd33ae66-c63d-4124-bdfa-b7be554c2c5d.jpg',
      title: 'Геометрия'
    },
    {
      image: 'https://cdn.poehali.dev/projects/c846c6bc-a002-4737-a261-823e13b16e94/files/28288c7d-4245-4cda-8882-ef51103d960a.jpg',
      title: 'Французский стиль'
    }
  ];

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

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const readers: Promise<string>[] = [];
    
    for (let i = 0; i < Math.min(files.length, 5); i++) {
      readers.push(
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target?.result as string);
          reader.readAsDataURL(files[i]);
        })
      );
    }

    Promise.all(readers).then((results) => {
      setSelectedImages(results);
    });
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setReceiptImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitBooking = async () => {
    if (!selectedSlot || !formData.name || !formData.contact) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все обязательные поля',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await fetch('https://functions.poehali.dev/406a4a18-71da-46ec-a8a4-efc9c7c87810', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slot_id: selectedSlot.id,
          name: formData.name,
          contact: formData.contact,
          type: formData.type,
          comment: formData.comment,
          photos: selectedImages
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setBookingId(data.booking_id);
        setShowPayment(true);
        scrollToSection('payment');
        toast({
          title: 'Отлично!',
          description: 'Заявка создана, теперь внесите предоплату'
        });
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось создать заявку',
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

  const handleSubmitPayment = async () => {
    if (!receiptImage || !bookingId) {
      toast({
        title: 'Ошибка',
        description: 'Загрузите чек об оплате',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await fetch('https://functions.poehali.dev/07e0a713-f93f-4b65-b2a7-9c7d8d9afe18', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingId,
          receipt_url: receiptImage
        })
      });

      if (response.ok) {
        toast({
          title: '🎉 Готово!',
          description: 'Заявка отправлена мастеру в Telegram',
          duration: 5000
        });
        
        setFormData({ name: '', contact: '', type: 'know_what_i_want', comment: '' });
        setSelectedSlot(null);
        setSelectedImages([]);
        setReceiptImage('');
        setBookingId(null);
        setShowPayment(false);
        scrollToSection('home');
      } else {
        toast({
          title: 'Ошибка',
          description: 'Не удалось отправить заявку',
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <nav className="fixed top-0 w-full bg-white/70 backdrop-blur-xl z-50 border-b border-white/20 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              YOLO NAIILS
            </h1>
            <Button 
              size="sm" 
              onClick={() => scrollToSection('booking')}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            >
              Записаться
            </Button>
          </div>
        </div>
      </nav>

      <section id="home" className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <Badge variant="secondary" className="mb-6 bg-white/60 backdrop-blur-sm">
            💅 Мастер маникюра
          </Badge>
          <h2 className="text-6xl md:text-7xl font-bold leading-tight mb-6 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent animate-fade-in">
            Ваши ногти —<br />наше искусство
          </h2>
          <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto animate-fade-in">
            Создаём уникальные дизайны и обеспечиваем идеальный уход
          </p>
          <div className="flex gap-4 justify-center animate-slide-up">
            <Button 
              size="lg" 
              onClick={() => scrollToSection('booking')}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-lg px-8"
            >
              Записаться онлайн
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => scrollToSection('portfolio')}
              className="text-lg px-8 border-2"
            >
              Работы
            </Button>
          </div>
        </div>
      </section>

      <section id="portfolio" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-5xl font-bold text-center mb-12 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            Галерея работ
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {portfolio.map((item, idx) => (
              <Card 
                key={idx} 
                className="overflow-hidden group cursor-pointer bg-white/60 backdrop-blur-sm border-white/40 hover:shadow-2xl transition-all animate-scale-in"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="aspect-square overflow-hidden">
                  <img 
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-center">{item.title}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-white/40 backdrop-blur-sm">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-5xl font-bold text-center mb-12 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            Почему я?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-8 bg-white/60 backdrop-blur-sm border-white/40 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center mx-auto mb-4">
                <Icon name="Sparkles" size={32} className="text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Честные цены</h3>
              <p className="text-gray-600">Никаких скрытых доплат</p>
            </Card>
            <Card className="text-center p-8 bg-white/60 backdrop-blur-sm border-white/40 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center mx-auto mb-4">
                <Icon name="Palette" size={32} className="text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Стильный дизайн</h3>
              <p className="text-gray-600">Индивидуальный подход</p>
            </Card>
            <Card className="text-center p-8 bg-white/60 backdrop-blur-sm border-white/40 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center mx-auto mb-4">
                <Icon name="ShieldCheck" size={32} className="text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Предоплата 300₽</h3>
              <p className="text-gray-600">Гарантия записи</p>
            </Card>
          </div>
        </div>
      </section>

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
                          setSelectedSlot(slot);
                          scrollToSection('booking');
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

      <section id="booking" className="py-20 px-4 bg-white/40 backdrop-blur-sm">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-5xl font-bold text-center mb-12 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            Форма записи
          </h2>
          <Card className="p-8 bg-white/60 backdrop-blur-sm border-white/40 animate-scale-in">
            {selectedSlot ? (
              <div className="mb-6 p-4 bg-gradient-to-r from-pink-100 to-purple-100 rounded-lg">
                <p className="text-center font-semibold">
                  Выбрано: {new Date(selectedSlot.date).toLocaleDateString('ru-RU')} в {selectedSlot.time.slice(0, 5)}
                </p>
              </div>
            ) : (
              <div className="mb-6 p-4 bg-yellow-100 rounded-lg text-center">
                <p className="text-sm">↑ Сначала выберите свободное окошко выше</p>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <Label htmlFor="name">Ваше имя *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Анна"
                  className="bg-white/80"
                />
              </div>

              <div>
                <Label htmlFor="contact">Контакт (телефон или Telegram) *</Label>
                <Input
                  id="contact"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  placeholder="+7 (999) 999-99-99 или @username"
                  className="bg-white/80"
                />
              </div>

              <div>
                <Label>Сценарий записи *</Label>
                <RadioGroup value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <div className="flex items-center space-x-2 p-3 rounded-lg bg-white/80">
                    <RadioGroupItem value="know_what_i_want" id="know" />
                    <Label htmlFor="know" className="cursor-pointer">✅ Знаю, что хочу</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg bg-white/80">
                    <RadioGroupItem value="not_sure" id="not_sure" />
                    <Label htmlFor="not_sure" className="cursor-pointer">🤔 Пока не определилась</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg bg-white/80">
                    <RadioGroupItem value="no_design" id="no_design" />
                    <Label htmlFor="no_design" className="cursor-pointer">⭕ Без дизайна</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="comment">Комментарий (необязательно)</Label>
                <Textarea
                  id="comment"
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  placeholder="Опишите желаемый дизайн или задайте вопрос"
                  className="bg-white/80 min-h-24"
                />
              </div>

              <div>
                <Label htmlFor="photos">Фото-референсы (до 5 фото)</Label>
                <Input
                  id="photos"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="bg-white/80"
                />
                {selectedImages.length > 0 && (
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {selectedImages.map((img, idx) => (
                      <img key={idx} src={img} alt={`Preview ${idx}`} className="w-20 h-20 object-cover rounded" />
                    ))}
                  </div>
                )}
              </div>

              <Button 
                onClick={handleSubmitBooking} 
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-lg h-12"
                disabled={!selectedSlot}
              >
                Отправить заявку и перейти к предоплате
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {showPayment && (
        <section id="payment" className="py-20 px-4">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-5xl font-bold text-center mb-12 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent animate-fade-in">
              Предоплата
            </h2>
            <Card className="p-8 bg-white/60 backdrop-blur-sm border-white/40 animate-scale-in">
              <div className="text-center mb-6">
                <p className="text-3xl font-bold text-purple-600 mb-2">300 ₽</p>
                <p className="text-gray-600">Обязательная предоплата для подтверждения записи</p>
              </div>

              <div className="bg-gradient-to-r from-pink-100 to-purple-100 p-6 rounded-lg mb-6">
                <h3 className="font-semibold mb-3">Реквизиты для перевода:</h3>
                <p className="mb-2">💳 Карта Сбербанк: <span className="font-mono">2202 2000 0000 0000</span></p>
                <p className="mb-2">📱 СБП: <span className="font-mono">+7 (999) 999-99-99</span></p>
                <p className="text-sm text-gray-600 mt-3">Получатель: Иванова Анна Сергеевна</p>
              </div>

              <div className="space-y-4">
                <Label htmlFor="receipt">Загрузите чек об оплате *</Label>
                <Input
                  id="receipt"
                  type="file"
                  accept="image/*"
                  onChange={handleReceiptUpload}
                  className="bg-white/80"
                />
                {receiptImage && (
                  <div className="mt-3">
                    <img src={receiptImage} alt="Receipt" className="w-32 h-32 object-cover rounded mx-auto" />
                  </div>
                )}

                <Button 
                  onClick={handleSubmitPayment} 
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-lg h-12"
                  disabled={!receiptImage}
                >
                  Я внесла предоплату — отправить мастеру
                </Button>
              </div>
            </Card>
          </div>
        </section>
      )}

      <footer className="py-8 px-4 bg-white/60 backdrop-blur-sm border-t border-white/20">
        <div className="container mx-auto max-w-6xl text-center">
          <p className="text-gray-600">© 2024 YOLO NAIILS. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
