import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface PortfolioItem {
  image: string;
  title: string;
}

interface PortfolioSectionProps {
  portfolio: PortfolioItem[];
}

const PortfolioSection = ({ portfolio }: PortfolioSectionProps) => {
  return (
    <>
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
    </>
  );
};

export default PortfolioSection;
