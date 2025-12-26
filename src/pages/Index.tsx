import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import HeroSection from '@/components/sections/HeroSection';
import PortfolioSection from '@/components/sections/PortfolioSection';
import SlotsSection from '@/components/sections/SlotsSection';
import BookingSection from '@/components/sections/BookingSection';

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

      <HeroSection 
        onScrollToBooking={() => scrollToSection('booking')}
        onScrollToPortfolio={() => scrollToSection('portfolio')}
      />

      <PortfolioSection portfolio={portfolio} />

      <SlotsSection 
        groupedSlots={groupedSlots}
        selectedSlot={selectedSlot}
        onSelectSlot={setSelectedSlot}
        onScrollToBooking={() => scrollToSection('booking')}
      />

      <BookingSection 
        selectedSlot={selectedSlot}
        formData={formData}
        selectedImages={selectedImages}
        showPayment={showPayment}
        receiptImage={receiptImage}
        onFormChange={setFormData}
        onImageUpload={handleImageUpload}
        onReceiptUpload={handleReceiptUpload}
        onSubmitBooking={handleSubmitBooking}
        onSubmitPayment={handleSubmitPayment}
      />

      <footer className="py-8 px-4 bg-white/60 backdrop-blur-sm border-t border-white/20">
        <div className="container mx-auto max-w-6xl text-center">
          <p className="text-gray-600">© 2024 YOLO NAIILS. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
