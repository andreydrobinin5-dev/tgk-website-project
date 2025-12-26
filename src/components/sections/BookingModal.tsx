import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

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

interface BookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupedSlots: Record<string, TimeSlot[]>;
  selectedSlot: TimeSlot | null;
  onSelectSlot: (slot: TimeSlot) => void;
  formData: FormData;
  onFormChange: (data: FormData) => void;
  selectedImages: string[];
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showPayment: boolean;
  receiptImage: string;
  onReceiptUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmitBooking: () => void;
  onSubmitPayment: () => void;
}

const BookingModal = ({
  open,
  onOpenChange,
  groupedSlots,
  selectedSlot,
  onSelectSlot,
  formData,
  onFormChange,
  selectedImages,
  onImageUpload,
  showPayment,
  receiptImage,
  onReceiptUpload,
  onSubmitBooking,
  onSubmitPayment
}: BookingModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 gap-0 bg-white/98 backdrop-blur-3xl border-gray-200 shadow-2xl">
        <DialogHeader className="px-8 pt-8 pb-4">
          <DialogTitle className="text-3xl font-semibold tracking-tight">
            {!showPayment ? 'Запись на маникюр' : 'Подтверждение оплаты'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="px-8 pb-8">
          {!showPayment ? (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-medium mb-4">Выберите дату и время</h3>
                {Object.keys(groupedSlots).length === 0 ? (
                  <div className="p-6 text-center bg-gray-50 rounded-2xl">
                    <p className="text-gray-600">Свободных окошек пока нет</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(groupedSlots).map(([date, dateSlots]) => (
                      <div key={date} className="space-y-3">
                        <p className="text-sm font-medium text-gray-700">
                          {new Date(date).toLocaleDateString('ru-RU', { 
                            day: 'numeric', 
                            month: 'long',
                            weekday: 'short'
                          })}
                        </p>
                        <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                          {dateSlots.map((slot) => (
                            <Button
                              key={slot.id}
                              variant={selectedSlot?.id === slot.id ? 'default' : 'outline'}
                              disabled={!slot.available}
                              onClick={() => onSelectSlot(slot)}
                              className={`h-11 ${selectedSlot?.id === slot.id ? 'bg-black hover:bg-gray-800 text-white' : 'hover:bg-gray-50'}`}
                            >
                              {slot.time.slice(0, 5)}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedSlot && (
                <div className="space-y-6 pt-6 border-t">
                  <div>
                    <Label htmlFor="name" className="text-base">Ваше имя</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
                      placeholder="Анна"
                      className="mt-2 h-12 bg-white border-gray-200"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contact" className="text-base">Телефон или Telegram</Label>
                    <Input
                      id="contact"
                      value={formData.contact}
                      onChange={(e) => onFormChange({ ...formData, contact: e.target.value })}
                      placeholder="+7 (999) 999-99-99"
                      className="mt-2 h-12 bg-white border-gray-200"
                    />
                  </div>

                  <div>
                    <Label className="text-base">Что планируете?</Label>
                    <RadioGroup value={formData.type} onValueChange={(value) => onFormChange({ ...formData, type: value })} className="mt-3 space-y-2">
                      <div className="flex items-center space-x-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                        <RadioGroupItem value="know_what_i_want" id="know" />
                        <Label htmlFor="know" className="cursor-pointer font-normal">Знаю, что хочу</Label>
                      </div>
                      <div className="flex items-center space-x-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                        <RadioGroupItem value="not_sure" id="not_sure" />
                        <Label htmlFor="not_sure" className="cursor-pointer font-normal">Пока не определилась</Label>
                      </div>
                      <div className="flex items-center space-x-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                        <RadioGroupItem value="no_design" id="no_design" />
                        <Label htmlFor="no_design" className="cursor-pointer font-normal">Без дизайна</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label htmlFor="comment" className="text-base">Комментарий (по желанию)</Label>
                    <Textarea
                      id="comment"
                      value={formData.comment}
                      onChange={(e) => onFormChange({ ...formData, comment: e.target.value })}
                      placeholder="Опишите желаемый дизайн"
                      className="mt-2 min-h-24 bg-white border-gray-200"
                    />
                  </div>

                  <div>
                    <Label htmlFor="photos" className="text-base">Фото-референсы (до 5 шт.)</Label>
                    <Input
                      id="photos"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={onImageUpload}
                      className="mt-2 h-12 bg-white border-gray-200"
                    />
                    {selectedImages.length > 0 && (
                      <div className="mt-4 flex gap-3 flex-wrap">
                        {selectedImages.map((img, idx) => (
                          <img key={idx} src={img} alt={`Preview ${idx}`} className="w-20 h-20 object-cover rounded-lg" />
                        ))}
                      </div>
                    )}
                  </div>

                  <Button 
                    onClick={onSubmitBooking} 
                    className="w-full h-12 bg-black hover:bg-gray-800 text-white text-base"
                  >
                    Продолжить к оплате
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center py-6">
                <p className="text-4xl font-semibold mb-2">300 ₽</p>
                <p className="text-gray-600">Предоплата для подтверждения</p>
              </div>

              <div className="bg-gray-50 p-6 rounded-2xl space-y-2">
                <p className="font-medium mb-3">Реквизиты для перевода</p>
                <p className="text-sm">Карта Сбербанк: <span className="font-mono">2202 2000 0000 0000</span></p>
                <p className="text-sm">СБП: <span className="font-mono">+7 (999) 999-99-99</span></p>
                <p className="text-xs text-gray-500 mt-3">Получатель: Иванова Анна Сергеевна</p>
              </div>

              <div className="space-y-4">
                <Label htmlFor="receipt" className="text-base">Загрузите чек об оплате</Label>
                <Input
                  id="receipt"
                  type="file"
                  accept="image/*"
                  onChange={onReceiptUpload}
                  className="h-12 bg-white border-gray-200"
                />
                {receiptImage && (
                  <div className="mt-4">
                    <img src={receiptImage} alt="Receipt" className="w-32 h-32 object-cover rounded-lg mx-auto" />
                  </div>
                )}

                <Button 
                  onClick={onSubmitPayment} 
                  className="w-full h-12 bg-black hover:bg-gray-800 text-white text-base"
                  disabled={!receiptImage}
                >
                  Подтвердить запись
                </Button>
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;