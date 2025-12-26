import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

const Index = () => {
  const [activeSection, setActiveSection] = useState('home');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  const timeSlots = [
    '10:00', '11:00', '12:00', '13:00', '14:00', 
    '15:00', '16:00', '17:00', '18:00', '19:00'
  ];

  const bookedSlots = ['12:00', '15:00', '17:00'];

  const services = [
    { 
      name: 'Маникюр', 
      price: 'от 1500₽', 
      duration: '1-1.5 часа',
      description: 'Классический или аппаратный маникюр с покрытием'
    },
    { 
      name: 'Педикюр', 
      price: 'от 2000₽', 
      duration: '1.5-2 часа',
      description: 'Комплексный уход за ногами с покрытием'
    },
    { 
      name: 'Дизайн', 
      price: 'от 500₽', 
      duration: '30 мин - 1 час',
      description: 'Художественное оформление ногтей'
    },
    { 
      name: 'Наращивание', 
      price: 'от 3000₽', 
      duration: '2-3 часа',
      description: 'Гелевое или акриловое наращивание'
    }
  ];

  const portfolio = [
    {
      image: 'https://cdn.poehali.dev/projects/c846c6bc-a002-4737-a261-823e13b16e94/files/c013c942-87f0-431d-a910-2f2b65965aac.jpg',
      title: 'Нежный дизайн',
      category: 'Маникюр'
    },
    {
      image: 'https://cdn.poehali.dev/projects/c846c6bc-a002-4737-a261-823e13b16e94/files/dd33ae66-c63d-4124-bdfa-b7be554c2c5d.jpg',
      title: 'Геометрия',
      category: 'Дизайн'
    },
    {
      image: 'https://cdn.poehali.dev/projects/c846c6bc-a002-4737-a261-823e13b16e94/files/28288c7d-4245-4cda-8882-ef51103d960a.jpg',
      title: 'Французский стиль',
      category: 'Маникюр'
    }
  ];

  const rules = [
    'Предоплата 500₽ обязательна для бронирования',
    'Отмена записи не позднее чем за 24 часа',
    'При опоздании более 15 минут запись отменяется',
    'Перенос записи возможен за 12 часов',
    'При повторной отмене без предупреждения предоплата не возвращается'
  ];

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-md z-50 border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight">YOLO NAIILS</h1>
            <div className="hidden md:flex gap-8">
              {['Главная', 'Портфолио', 'Услуги', 'Запись', 'Правила', 'Контакты'].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => scrollToSection(['home', 'portfolio', 'services', 'booking', 'rules', 'contacts'][idx])}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    activeSection === ['home', 'portfolio', 'services', 'booking', 'rules', 'contacts'][idx]
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            <Button size="sm" onClick={() => scrollToSection('booking')}>
              Записаться
            </Button>
          </div>
        </div>
      </nav>

      <section id="home" className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-fade-in">
              <Badge variant="secondary" className="w-fit">
                Профессиональный маникюр
              </Badge>
              <h2 className="text-5xl md:text-6xl font-bold leading-tight">
                Ваши ногти —<br />
                <span className="text-primary">наше искусство</span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Создаём уникальные дизайны и обеспечиваем идеальный уход за вашими ногтями 
                в атмосфере комфорта и внимания к деталям
              </p>
              <div className="flex gap-4 pt-4">
                <Button size="lg" onClick={() => scrollToSection('booking')}>
                  Записаться онлайн
                </Button>
                <Button size="lg" variant="outline" onClick={() => scrollToSection('portfolio')}>
                  Портфолио
                </Button>
              </div>
            </div>
            <div className="relative animate-scale-in">
              <div className="aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20 p-1">
                <img 
                  src={portfolio[0].image}
                  alt="Hero"
                  className="w-full h-full object-cover rounded-3xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="portfolio" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-12 animate-slide-up">
            <h2 className="text-4xl font-bold">Наши работы</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Каждый дизайн создаётся индивидуально с учётом ваших пожеланий и стиля
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {portfolio.map((item, idx) => (
              <Card 
                key={idx} 
                className="overflow-hidden group cursor-pointer transition-all hover:shadow-lg animate-scale-in"
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
                  <Badge variant="secondary" className="mb-2">{item.category}</Badge>
                  <h3 className="font-semibold">{item.title}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="services" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-12 animate-slide-up">
            <h2 className="text-4xl font-bold">Услуги</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Полный спектр услуг для красоты и здоровья ваших ногтей
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {services.map((service, idx) => (
              <Card 
                key={idx}
                className="transition-all hover:shadow-lg animate-fade-in"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-2xl font-semibold">{service.name}</h3>
                    <Badge variant="outline" className="text-lg">{service.price}</Badge>
                  </div>
                  <p className="text-muted-foreground mb-2">{service.description}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Icon name="Clock" size={16} />
                    <span>{service.duration}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="booking" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center space-y-4 mb-12 animate-slide-up">
            <h2 className="text-4xl font-bold">Онлайн запись</h2>
            <p className="text-muted-foreground">
              Выберите удобную дату и время для визита
            </p>
          </div>
          <Card className="animate-scale-in">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold mb-4">Выберите дату</h3>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                    disabled={(date) => date < new Date()}
                  />
                </div>
                <div>
                  <h3 className="font-semibold mb-4">Выберите время</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {timeSlots.map((time) => {
                      const isBooked = bookedSlots.includes(time);
                      const isSelected = selectedTime === time;
                      return (
                        <Button
                          key={time}
                          variant={isSelected ? 'default' : 'outline'}
                          disabled={isBooked}
                          onClick={() => setSelectedTime(time)}
                          className="w-full"
                        >
                          {time}
                          {isBooked && (
                            <Icon name="X" size={14} className="ml-1" />
                          )}
                        </Button>
                      );
                    })}
                  </div>
                  {selectedDate && selectedTime && (
                    <div className="mt-8 p-4 bg-primary/10 rounded-lg">
                      <h4 className="font-semibold mb-2">Выбрано:</h4>
                      <p className="text-sm">
                        {selectedDate.toLocaleDateString('ru-RU', { 
                          day: 'numeric', 
                          month: 'long',
                          year: 'numeric'
                        })} в {selectedTime}
                      </p>
                      <Button className="w-full mt-4">
                        Подтвердить запись
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="rules" className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center space-y-4 mb-12 animate-slide-up">
            <h2 className="text-4xl font-bold">Правила записи</h2>
            <p className="text-muted-foreground">
              Пожалуйста, ознакомьтесь с условиями перед бронированием
            </p>
          </div>
          <Card className="animate-fade-in">
            <CardContent className="p-8">
              <div className="space-y-4">
                {rules.map((rule, idx) => (
                  <div key={idx} className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-semibold text-sm">
                      {idx + 1}
                    </div>
                    <p className="pt-1">{rule}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="contacts" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center space-y-4 mb-12 animate-slide-up">
            <h2 className="text-4xl font-bold">Контакты</h2>
            <p className="text-muted-foreground">
              Свяжитесь с нами удобным способом
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="text-center animate-scale-in">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <Icon name="Send" size={24} />
                </div>
                <h3 className="font-semibold mb-2">Telegram</h3>
                <a 
                  href="https://t.me/YOLONAIILS" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  @YOLONAIILS
                </a>
              </CardContent>
            </Card>
            <Card className="text-center animate-scale-in" style={{ animationDelay: '0.1s' }}>
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <Icon name="Phone" size={24} />
                </div>
                <h3 className="font-semibold mb-2">Телефон</h3>
                <a 
                  href="tel:+79999999999" 
                  className="text-primary hover:underline"
                >
                  +7 (999) 999-99-99
                </a>
              </CardContent>
            </Card>
            <Card className="text-center animate-scale-in" style={{ animationDelay: '0.2s' }}>
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <Icon name="MapPin" size={24} />
                </div>
                <h3 className="font-semibold mb-2">Адрес</h3>
                <p className="text-muted-foreground text-sm">
                  Москва, ул. Примерная, д. 1
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <footer className="py-8 px-4 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2024 YOLO NAIILS. Все права защищены.
            </p>
            <div className="flex gap-4">
              <a 
                href="https://t.me/YOLONAIILS" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Icon name="Send" size={20} />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
