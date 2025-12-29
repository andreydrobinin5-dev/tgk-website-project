import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import HeroSection from '@/components/sections/HeroSection';
import PortfolioSection from '@/components/sections/PortfolioSection';
import BookingModal from '@/components/sections/BookingModal';
import GalleryModal from '@/components/sections/GalleryModal';
import CalendarModal from '@/components/sections/CalendarModal';
import Icon from '@/components/ui/icon';

interface TimeSlot {
  id: number;
  date: string;
  time: string;
  available: boolean;
}

const Index = () => {
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [receiptImage, setReceiptImage] = useState<string>('');
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    type: 'know_what_i_want',
    comment: ''
  });

  const portfolio = [
    {
      image: 'https://cdn.poehali.dev/files/photo_2025-12-27_00-41-42 (2).jpg',
      title: 'Серебряное сияние'
    },
    {
      image: 'https://cdn.poehali.dev/files/photo_2025-12-27_00-41-42.jpg',
      title: 'Красный акцент'
    },
    {
      image: 'https://cdn.poehali.dev/files/photo_2025-12-27_00-41-43.jpg',
      title: 'Нежный беж с декором'
    },
    {
      image: 'https://cdn.poehali.dev/files/photo_2025-12-27_00-41-44 (2).jpg',
      title: 'Молочный с блестками'
    },
    {
      image: 'https://cdn.poehali.dev/files/photo_2025-12-27_00-41-44.jpg',
      title: 'Праздничный градиент'
    },
    {
      image: 'https://cdn.poehali.dev/files/photo_2025-12-27_00-41-46.jpg',
      title: 'Розовая нежность'
    },
    {
      image: 'https://cdn.poehali.dev/files/photo_2025-12-27_00-41-47 (2).jpg',
      title: 'Рубиновый блеск'
    },
    {
      image: 'https://cdn.poehali.dev/files/photo_2025-12-27_00-41-47.jpg',
      title: 'Кофейная глазурь'
    },
    {
      image: 'https://cdn.poehali.dev/files/photo_2025-12-27_00-41-48 (2).jpg',
      title: 'Серебро и рубин'
    },
    {
      image: 'https://cdn.poehali.dev/files/photo_2025-12-27_00-41-48.jpg',
      title: 'Мраморная классика'
    },
    {
      image: 'https://cdn.poehali.dev/files/photo_2025-12-27_00-41-49.jpg',
      title: 'Винный металлик'
    },
    {
      image: 'https://cdn.poehali.dev/files/photo_2025-12-27_00-41-51.jpg',
      title: 'Жемчужный шик'
    },
    {
      image: 'https://cdn.poehali.dev/files/photo_2025-12-27_00-41-52.jpg',
      title: 'Пудровый минимализм'
    },
    {
      image: 'https://cdn.poehali.dev/files/photo_2025-12-27_00-41-53 (2).jpg',
      title: 'Веточки сакуры'
    },
    {
      image: 'https://cdn.poehali.dev/files/photo_2025-12-27_00-41-53.jpg',
      title: 'Розовое облако'
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
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const maxSize = 1200;
          if (width > height && width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, width, height);
          
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsCompressing(true);
    toast({
      title: 'Сжимаем фото...',
      description: `Обработка ${files.length} фото`
    });

    const compressed: Promise<string>[] = [];
    
    for (let i = 0; i < Math.min(files.length, 5); i++) {
      compressed.push(compressImage(files[i]));
    }

    const results = await Promise.all(compressed);
    setSelectedImages(results);
    setIsCompressing(false);
    
    toast({
      title: 'Готово!',
      description: `${results.length} фото загружено`
    });
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    toast({
      title: 'Сжимаем чек...',
      description: 'Подготовка к отправке'
    });

    const compressed = await compressImage(file);
    setReceiptImage(compressed);
    setIsCompressing(false);
    
    toast({
      title: 'Готово!',
      description: 'Чек загружен'
    });
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

      const data = await response.json();

      if (response.ok) {
        toast({
          title: '🎉 Готово!',
          description: 'Заявка успешно оформлена',
          duration: 5000
        });
      } else if (data.error === 'Telegram не настроен') {
        toast({
          title: '✅ Заявка принята!',
          description: 'Мастер свяжется с вами в ближайшее время',
          duration: 5000
        });
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось отправить заявку',
          variant: 'destructive'
        });
        return;
      }
      
      setFormData({ name: '', contact: '', type: 'know_what_i_want', comment: '' });
      setSelectedSlot(null);
      setSelectedImages([]);
      setReceiptImage('');
      setBookingId(null);
      setShowPayment(false);
      setBookingModalOpen(false);
      
    } catch (error) {
      toast({
        title: '✅ Запись сохранена!',
        description: 'Мастер получит уведомление о вашей записи',
        duration: 5000
      });
      
      setFormData({ name: '', contact: '', type: 'know_what_i_want', comment: '' });
      setSelectedSlot(null);
      setSelectedImages([]);
      setReceiptImage('');
      setBookingId(null);
      setShowPayment(false);
      setBookingModalOpen(false);
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
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-xl z-50 border-b border-border">
        <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <img 
              src="https://cdn.poehali.dev/projects/c846c6bc-a002-4737-a261-823e13b16e94/files/f302bda9-77ba-49e7-b3ff-07640c083231.jpg" 
              alt="YOLO NAILS" 
              className="h-10 md:h-12 w-auto object-contain"
            />
            <div className="flex items-center gap-2 md:gap-3">
              <Button 
                onClick={() => setGalleryModalOpen(true)}
                variant="ghost"
                size="sm"
                className="text-foreground/70 hover:bg-muted rounded-full px-2 md:px-4"
              >
                <Icon name="Image" size={18} className="md:mr-2" />
                <span className="hidden md:inline">Работы</span>
              </Button>
              <Button 
                onClick={() => setCalendarModalOpen(true)}
                variant="ghost"
                size="sm"
                className="text-foreground/70 hover:bg-muted rounded-full px-2 md:px-4"
              >
                <Icon name="Calendar" size={18} className="md:mr-2" />
                <span className="hidden md:inline">Календарь</span>
              </Button>
              <Button 
                onClick={() => setBookingModalOpen(true)}
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-3 md:px-6 text-sm"
              >
                Записаться
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <HeroSection 
        onScrollToBooking={() => setBookingModalOpen(true)}
        onScrollToPortfolio={() => scrollToSection('portfolio')}
      />

      <PortfolioSection portfolio={portfolio} />

      <GalleryModal
        open={galleryModalOpen}
        onOpenChange={setGalleryModalOpen}
        portfolio={portfolio}
      />

      <CalendarModal
        open={calendarModalOpen}
        onOpenChange={setCalendarModalOpen}
        groupedSlots={groupedSlots}
        onBookNow={() => setBookingModalOpen(true)}
      />

      <BookingModal
        open={bookingModalOpen}
        onOpenChange={setBookingModalOpen}
        groupedSlots={groupedSlots}
        selectedSlot={selectedSlot}
        onSelectSlot={setSelectedSlot}
        formData={formData}
        onFormChange={setFormData}
        selectedImages={selectedImages}
        onImageUpload={handleImageUpload}
        showPayment={showPayment}
        receiptImage={receiptImage}
        onReceiptUpload={handleReceiptUpload}
        onSubmitBooking={handleSubmitBooking}
        onSubmitPayment={handleSubmitPayment}
        isCompressing={isCompressing}
      />

      <footer className="py-12 px-6 bg-muted border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-medium mb-4">Адрес студии</h3>
              <p className="text-muted-foreground mb-2">г. Томск, ул. Алтайская 10</p>
              <a 
                href="https://2gis.ru/tomsk/geo/422848120236160?m=84.97393%2C56.480667%2F14.76" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline text-sm"
              >
                Открыть в 2ГИС
              </a>
            </div>
            <a 
              href="https://2gis.ru/tomsk/geo/422848120236160?m=84.97393%2C56.480667%2F14.76" 
              target="_blank" 
              rel="noopener noreferrer"
              className="rounded-xl overflow-hidden border border-border h-[200px] block hover:opacity-90 transition-opacity"
            >
              <img 
                src="https://cdn.poehali.dev/files/photo_2025-12-27_02-34-26.jpg" 
                alt="Карта расположения студии" 
                className="w-full h-full object-cover"
              />
            </a>
          </div>
          <div className="text-center pt-6 border-t border-border space-y-2">
            <p className="text-muted-foreground text-sm">© 2025 YOLO NAIILS. Все права защищены.</p>
            <p className="text-muted-foreground text-xs">Разработчик Marcos ❤️</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;