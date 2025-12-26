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
        setBookingModalOpen(false);
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
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-xl z-50 border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold tracking-tight">
              YOLO NAIILS
            </h1>
            <div className="flex items-center gap-3">
              <Button 
                onClick={() => setGalleryModalOpen(true)}
                variant="ghost"
                className="text-foreground/70 hover:bg-muted rounded-full px-4"
              >
                <Icon name="Image" size={18} className="mr-2" />
                Работы
              </Button>
              <Button 
                onClick={() => setCalendarModalOpen(true)}
                variant="ghost"
                className="text-foreground/70 hover:bg-muted rounded-full px-4"
              >
                <Icon name="Calendar" size={18} className="mr-2" />
                Календарь
              </Button>
              <Button 
                onClick={() => setBookingModalOpen(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6"
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
      />

      <footer className="py-12 px-6 bg-muted border-t border-border">
        <div className="container mx-auto max-w-6xl text-center">
          <p className="text-muted-foreground text-sm">© 2024 YOLO NAIILS. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;