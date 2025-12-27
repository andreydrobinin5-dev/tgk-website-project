import re
import html

def sanitize_text(text: str, max_length: int = 500) -> str:
    """Очищает текст от опасных символов и ограничивает длину"""
    if not text:
        return ''
    
    text = text[:max_length]
    text = html.escape(text)
    
    return text.strip()

def validate_contact(contact: str) -> bool:
    """Проверяет корректность контакта (телефон, email или Telegram)"""
    if not contact or len(contact) > 100:
        return False
    
    phone_pattern = r'^[\d\s\+\-\(\)]{7,20}$'
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    telegram_pattern = r'^@[a-zA-Z0-9_]{5,32}$'
    
    return bool(re.match(phone_pattern, contact) or re.match(email_pattern, contact) or re.match(telegram_pattern, contact))

def validate_booking_type(booking_type: str) -> bool:
    """Проверяет тип записи"""
    allowed_types = ['know_what_i_want', 'not_sure', 'no_design']
    return booking_type in allowed_types

def validate_name(name: str) -> bool:
    """Проверяет имя клиента"""
    if not name or len(name) < 2 or len(name) > 100:
        return False
    
    return bool(re.match(r'^[а-яА-ЯёЁa-zA-Z\s\-]+$', name))