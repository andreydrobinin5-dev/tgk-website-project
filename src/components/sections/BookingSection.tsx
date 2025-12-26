import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface TimeSlot {
  id: number;
  date: string;
  time: string;
  available: boolean;
}

interface FormData {
  name: string;
  contact: string;
  type: string;
  comment: string;
}

interface BookingSectionProps {
  selectedSlot: TimeSlot | null;
  formData: FormData;
  selectedImages: string[];
  showPayment: boolean;
  receiptImage: string;
  onFormChange: (data: FormData) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onReceiptUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmitBooking: () => void;
  onSubmitPayment: () => void;
}

const BookingSection = ({
  selectedSlot,
  formData,
  selectedImages,
  showPayment,
  receiptImage,
  onFormChange,
  onImageUpload,
  onReceiptUpload,
  onSubmitBooking,
  onSubmitPayment
}: BookingSectionProps) => {
  return (
    <>
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
                  onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
                  placeholder="Анна"
                  className="bg-white/80"
                />
              </div>

              <div>
                <Label htmlFor="contact">Контакт (телефон или Telegram) *</Label>
                <Input
                  id="contact"
                  value={formData.contact}
                  onChange={(e) => onFormChange({ ...formData, contact: e.target.value })}
                  placeholder="+7 (999) 999-99-99 или @username"
                  className="bg-white/80"
                />
              </div>

              <div>
                <Label>Сценарий записи *</Label>
                <RadioGroup value={formData.type} onValueChange={(value) => onFormChange({ ...formData, type: value })}>
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
                  onChange={(e) => onFormChange({ ...formData, comment: e.target.value })}
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
                  onChange={onImageUpload}
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
                onClick={onSubmitBooking} 
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
                  onChange={onReceiptUpload}
                  className="bg-white/80"
                />
                {receiptImage && (
                  <div className="mt-3">
                    <img src={receiptImage} alt="Receipt" className="w-32 h-32 object-cover rounded mx-auto" />
                  </div>
                )}

                <Button 
                  onClick={onSubmitPayment} 
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
    </>
  );
};

export default BookingSection;
