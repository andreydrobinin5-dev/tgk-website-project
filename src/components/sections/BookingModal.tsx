import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useState } from 'react';

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
  isCompressing?: boolean;
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
  onSubmitPayment,
  isCompressing = false
}: BookingModalProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const availableDates = Object.keys(groupedSlots).map(date => new Date(date));
  
  const tileDisabled = ({ date }: { date: Date }) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return !groupedSlots[dateStr];
  };

  const tileClassName = ({ date }: { date: Date }) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    if (groupedSlots[dateStr]) {
      return 'available-date';
    }
    return '';
  };

  const tileContent = ({ date }: { date: Date }) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const slots = groupedSlots[dateStr];
    
    if (slots && slots.length > 0) {
      return (
        <div className="mt-1 text-[9px] sm:text-[10px] font-bold px-1 py-0.5 rounded-md bg-primary/20 text-primary border border-primary/30">
          {slots.length}
        </div>
      );
    }
    return null;
  };

  const handleDateChange = (value: Date | null) => {
    setSelectedDate(value);
  };

  const selectedDateStr = selectedDate ? (() => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })() : undefined;
  const timeSlotsForSelectedDate = selectedDateStr ? groupedSlots[selectedDateStr] || [] : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] sm:max-h-[90vh] p-0 gap-0 bg-gradient-to-br from-card via-card to-card/95 backdrop-blur-3xl border-border/50 shadow-2xl overflow-hidden">
        <DialogHeader className="px-4 sm:px-6 md:px-8 pt-6 sm:pt-8 md:pt-10 pb-4 md:pb-6 flex-shrink-0 border-b border-border/50">
          <DialogTitle className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {!showPayment ? '✨ Запись на маникюр' : '💳 Подтверждение оплаты'}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-2">
            {!showPayment ? 'Выберите удобное время и заполните форму' : 'Внесите предоплату 300₽ для подтверждения записи'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-full max-h-[calc(95vh-100px)] sm:max-h-[calc(90vh-120px)]">
          <div className="px-4 sm:px-6 md:px-8 pb-4 sm:pb-6 md:pb-8">
            {!showPayment ? (
              <div className="space-y-8">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-1 bg-gradient-to-b from-primary to-primary/40 rounded-full"></div>
                    <h3 className="text-xl font-semibold">Выберите дату и время</h3>
                  </div>
                  {Object.keys(groupedSlots).length === 0 ? (
                    <div className="p-8 text-center bg-gradient-to-br from-muted/50 to-muted rounded-3xl border border-border/30">
                      <p className="text-lg text-muted-foreground">✨ Свободных окошек пока нет</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="calendar-wrapper">
                        <Calendar
                          onChange={handleDateChange as any}
                          value={selectedDate}
                          tileDisabled={tileDisabled}
                          tileClassName={tileClassName}
                          tileContent={tileContent}
                          locale="ru-RU"
                          minDate={new Date()}
                        />
                      </div>

                      <div className="mt-6">
                        {selectedDate && timeSlotsForSelectedDate.length > 0 ? (
                          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">🕐</span>
                              <p className="text-base font-medium">
                                Доступное время
                              </p>
                            </div>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3">
                              {timeSlotsForSelectedDate.map((slot) => (
                                <Button
                                  key={slot.id}
                                  variant={selectedSlot?.id === slot.id ? 'default' : 'outline'}
                                  disabled={!slot.available}
                                  onClick={() => onSelectSlot(slot)}
                                  className={`h-11 sm:h-12 text-sm sm:text-base font-medium transition-all duration-200 active:scale-95 ${
                                    selectedSlot?.id === slot.id 
                                      ? 'bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg scale-105' 
                                      : 'hover:bg-muted/80 hover:border-primary/30 hover:scale-105'
                                  }`}
                                >
                                  {slot.time.slice(0, 5)}
                                </Button>
                              ))}
                            </div>
                          </div>
                        ) : selectedDate ? (
                          <div className="flex flex-col items-center justify-center py-12 text-center px-4 bg-muted/30 rounded-2xl">
                            <span className="text-4xl mb-3">📅</span>
                            <p className="text-base text-muted-foreground">Нет доступных окошек на эту дату</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-12 text-center px-4 bg-gradient-to-br from-muted/30 to-muted/10 rounded-2xl border-2 border-dashed border-border/50">
                            <span className="text-4xl mb-3">👆</span>
                            <p className="text-base text-muted-foreground">Выберите дату в календаре</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {selectedSlot && (
                  <div className="space-y-6 pt-8 mt-8 border-t-2 border-gradient-to-r from-transparent via-border to-transparent animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div>
                      <Label htmlFor="name" className="text-base font-medium flex items-center gap-2">
                        <span>👤</span> Ваше имя
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
                        placeholder="Анна"
                        className="mt-3 h-14 text-base bg-background/50 border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl transition-all"
                      />
                    </div>

                    <div>
                      <Label htmlFor="contact" className="text-base font-medium flex items-center gap-2">
                        <span>✈️</span> Telegram
                      </Label>
                      <Input
                        id="contact"
                        value={formData.contact}
                        onChange={(e) => onFormChange({ ...formData, contact: e.target.value })}
                        placeholder="@username"
                        className="mt-3 h-14 text-base bg-background/50 border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl transition-all"
                      />
                    </div>

                    <div>
                      <Label className="text-base font-medium flex items-center gap-2">
                        <span>💅</span> Что планируете?
                      </Label>
                      <RadioGroup value={formData.type} onValueChange={(value) => onFormChange({ ...formData, type: value })} className="mt-3 space-y-3">
                        <div className="flex items-center space-x-4 p-5 rounded-2xl bg-gradient-to-r from-muted/50 to-muted/30 hover:from-muted/70 hover:to-muted/50 border border-border/30 hover:border-primary/30 transition-all cursor-pointer group">
                          <RadioGroupItem value="know_what_i_want" id="know" className="group-hover:border-primary/50" />
                          <Label htmlFor="know" className="cursor-pointer font-normal text-base">Знаю, что хочу</Label>
                        </div>
                        <div className="flex items-center space-x-4 p-5 rounded-2xl bg-gradient-to-r from-muted/50 to-muted/30 hover:from-muted/70 hover:to-muted/50 border border-border/30 hover:border-primary/30 transition-all cursor-pointer group">
                          <RadioGroupItem value="not_sure" id="not_sure" className="group-hover:border-primary/50" />
                          <Label htmlFor="not_sure" className="cursor-pointer font-normal text-base">Пока не определилась</Label>
                        </div>
                        <div className="flex items-center space-x-4 p-5 rounded-2xl bg-gradient-to-r from-muted/50 to-muted/30 hover:from-muted/70 hover:to-muted/50 border border-border/30 hover:border-primary/30 transition-all cursor-pointer group">
                          <RadioGroupItem value="no_design" id="no_design" className="group-hover:border-primary/50" />
                          <Label htmlFor="no_design" className="cursor-pointer font-normal text-base">Без дизайна</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div>
                      <Label htmlFor="comment" className="text-base font-medium flex items-center gap-2">
                        <span>💬</span> Комментарий <span className="text-sm text-muted-foreground font-normal">(по желанию)</span>
                      </Label>
                      <Textarea
                        id="comment"
                        value={formData.comment}
                        onChange={(e) => onFormChange({ ...formData, comment: e.target.value })}
                        placeholder="Опишите желаемый дизайн или пожелания..."
                        className="mt-3 min-h-28 text-base bg-background/50 border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl transition-all"
                      />
                    </div>

                    <div>
                      <Label htmlFor="photos" className="text-base font-medium flex items-center gap-2">
                        <span>📷</span> Фото-референсы <span className="text-sm text-muted-foreground font-normal">(до 5 шт.)</span>
                      </Label>
                      <Input
                        id="photos"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={onImageUpload}
                        className="mt-3 h-14 bg-background/50 border-border hover:border-primary/30 rounded-xl transition-all cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:font-medium hover:file:bg-primary/20"
                      />
                      {selectedImages.length > 0 && (
                        <div className="mt-4 flex gap-3 flex-wrap">
                          {selectedImages.map((img, idx) => (
                            <div key={idx} className="relative group">
                              <img src={img} alt={`Preview ${idx}`} className="w-24 h-24 object-cover rounded-2xl border-2 border-border/50 group-hover:border-primary/50 transition-all shadow-lg" />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-2xl transition-all"></div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <Button 
                      onClick={onSubmitBooking} 
                      disabled={isCompressing}
                      className="w-full h-16 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] rounded-2xl"
                    >
                      {isCompressing ? (
                        <span className="flex items-center gap-2">⏳ Обработка фото...</span>
                      ) : (
                        <span className="flex items-center gap-2">💳 Продолжить к предоплате</span>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-8">
                <div className="text-center py-8 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-3xl border border-primary/20">
                  <div className="text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-3">
                    300 ₽
                  </div>
                  <p className="text-base text-muted-foreground">Предоплата для подтверждения записи</p>
                </div>

                <div className="bg-gradient-to-br from-muted/80 to-muted/40 p-8 rounded-3xl border border-border/50 space-y-4 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">🏦</span>
                    <p className="text-lg font-semibold">Реквизиты для перевода</p>
                  </div>
                  <div 
                    className="bg-background/50 p-5 rounded-2xl cursor-pointer hover:bg-background/70 transition-all active:scale-[0.98]"
                    onClick={async () => {
                      const cardNumber = '2204320434494284';
                      const btn = document.getElementById('copy-card-btn');
                      
                      try {
                        if (navigator.clipboard && window.isSecureContext) {
                          await navigator.clipboard.writeText(cardNumber);
                        } else {
                          const textArea = document.createElement('textarea');
                          textArea.value = cardNumber;
                          textArea.style.position = 'fixed';
                          textArea.style.left = '-999999px';
                          textArea.style.top = '-999999px';
                          document.body.appendChild(textArea);
                          textArea.focus();
                          textArea.select();
                          document.execCommand('copy');
                          textArea.remove();
                        }
                        
                        if (btn) {
                          btn.textContent = '✓ Скопировано!';
                          setTimeout(() => {
                            btn.textContent = '📋 Нажмите для копирования';
                          }, 2000);
                        }
                      } catch (err) {
                        console.error('Copy failed:', err);
                        if (btn) {
                          btn.textContent = '❌ Ошибка копирования';
                          setTimeout(() => {
                            btn.textContent = '📋 Нажмите для копирования';
                          }, 2000);
                        }
                      }
                    }}
                  >
                    <p className="text-sm text-muted-foreground mb-2">Ozon Банк</p>
                    <p className="text-xl font-mono font-bold tracking-wider select-all">2204 3204 3449 4284</p>
                    <p id="copy-card-btn" className="text-xs text-primary mt-2 font-medium">
                      📋 Нажмите для копирования
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground pt-2 flex items-center gap-2">
                    <span>👤</span> Получатель: Арина Ш.
                  </p>
                </div>

                <div>
                  <Label htmlFor="receipt" className="text-base font-medium flex items-center gap-2 mb-3">
                    <span>🧾</span> Загрузите чек об оплате
                  </Label>
                  <Input
                    id="receipt"
                    type="file"
                    accept="image/*"
                    onChange={onReceiptUpload}
                    className="h-14 bg-background/50 border-border hover:border-primary/30 rounded-xl transition-all cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:font-medium hover:file:bg-primary/20"
                  />
                  {receiptImage && (
                    <div className="mt-6 flex justify-center">
                      <div className="relative group">
                        <img src={receiptImage} alt="Receipt" className="w-40 h-40 object-cover rounded-3xl border-2 border-primary/30 shadow-2xl" />
                        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 rounded-3xl transition-all"></div>
                        <div className="absolute -top-2 -right-2 bg-green-500 text-white p-2 rounded-full shadow-lg">✓</div>
                      </div>
                    </div>
                  )}
                </div>

                <Button 
                  onClick={onSubmitPayment} 
                  className="w-full h-16 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!receiptImage || isCompressing}
                >
                  {isCompressing ? (
                    <span className="flex items-center gap-2">⏳ Обработка чека...</span>
                  ) : (
                    <span className="flex items-center gap-2">✨ Записаться</span>
                  )}
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;