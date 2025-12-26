import { Card, CardContent } from '@/components/ui/card';

interface PortfolioItem {
  image: string;
  title: string;
}

interface PortfolioSectionProps {
  portfolio: PortfolioItem[];
}

const PortfolioSection = ({ portfolio }: PortfolioSectionProps) => {
  return (
    <section id="portfolio" className="py-24 px-6 scroll-mt-20">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-5xl md:text-6xl font-semibold text-center mb-16 tracking-tight">
          Мои работы
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {portfolio.map((item, idx) => (
            <Card 
              key={idx} 
              className="overflow-hidden group cursor-pointer bg-white border-gray-100 hover:shadow-xl transition-all duration-500 animate-scale-in"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className="aspect-square overflow-hidden">
                <img 
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <CardContent className="p-6">
                <h3 className="font-medium text-center text-gray-700">{item.title}</h3>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PortfolioSection;