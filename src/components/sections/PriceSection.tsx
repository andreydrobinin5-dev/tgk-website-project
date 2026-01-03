import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

const PriceSection = () => {
  const services = [
    {
      category: 'НАРАЩИВАНИЕ',
      icon: 'Sparkles',
      items: [
        { name: 'S', price: '1600₽', sizes: '1-2' },
        { name: 'M', price: '1900₽', sizes: '3-4' },
        { name: 'L', price: '2000₽', sizes: '5-6' },
        { name: 'XL', price: '2200₽', sizes: '7-8' },
        { name: 'XXL', price: '2500₽', sizes: '9-10' },
      ]
    },
    {
      category: 'ПОКРЫТИЕ',
      icon: 'Paintbrush',
      items: [
        { name: '1-2', price: '1400₽' },
        { name: '3-4', price: '1500₽' },
      ],
      note: 'Наращивание: Коррекция до 1 вкл. +200₽ от стоимости наращивания. Дальше только перенаращивание.'
    },
    {
      category: 'ДИЗАЙН',
      icon: 'Palette',
      items: [
        { name: 'Втирка/френч/слайдеры', price: '250₽' },
        { name: 'Фигурки (1 шт)', price: '50-100₽' },
        { name: 'Ручная роспись', price: '15-20₽' },
        { name: 'Стразы/блестки', price: '20₽' },
      ]
    },
    {
      category: 'ДОПЫ',
      icon: 'Plus',
      items: [
        { name: 'Маникюр без покрытия', price: '700₽' },
        { name: 'Донаращивание/наращивание', price: '50/100₽' },
        { name: 'Снятие др. мастера', price: '100₽' },
        { name: 'Снятие (без покрытия)', price: '300₽' },
      ]
    }
  ];

  return (
    <section id="price" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-foreground">Прайс-лист</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {services.map((service) => (
            <Card key={service.category} className="border-primary/10 hover:border-primary/30 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Icon name={service.icon as any} className="text-primary" size={20} />
                  {service.category}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {service.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{item.name}</span>
                        {'sizes' in item && (
                          <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                            {item.sizes}
                          </span>
                        )}
                      </div>
                      <span className="text-primary font-semibold">{item.price}</span>
                    </div>
                  ))}
                </div>
                {service.note && (
                  <p className="text-xs text-muted-foreground mt-4 pt-3 border-t border-border/50">
                    {service.note}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PriceSection;