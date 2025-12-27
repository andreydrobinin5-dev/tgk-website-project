import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import AdminSlots from '@/components/admin/AdminSlots';
import AdminBookings from '@/components/admin/AdminBookings';

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tokenExpiry, setTokenExpiry] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const expiry = localStorage.getItem('admin_token_expiry');
      if (expiry) {
        const expiryDate = new Date(expiry);
        if (expiryDate > new Date()) {
          setTokenExpiry(expiry);
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('admin_token_expiry');
          setIsAuthenticated(false);
        }
      }
    };
    checkAuth();
  }, []);

  const handleLogin = async () => {
    if (!password) {
      toast({
        title: 'Ошибка',
        description: 'Введите пароль',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('https://functions.poehali.dev/a6d698fe-c92a-4d08-b994-4fc13e0a8679', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('admin_token', data.token);
        localStorage.setItem('admin_token_expiry', data.expires_at);
        setTokenExpiry(data.expires_at);
        setIsAuthenticated(true);
        toast({
          title: 'Успешно',
          description: 'Добро пожаловать в админ-панель'
        });
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Неверный пароль',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Проблема с подключением',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token_expiry');
    document.cookie = 'admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    setIsAuthenticated(false);
    setTokenExpiry(null);
    toast({
      title: 'Выход выполнен',
      description: 'Вы вышли из админ-панели'
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Админ-панель</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="Введите пароль"
                className="mt-2"
              />
            </div>
            <Button onClick={handleLogin} className="w-full" disabled={isLoading}>
              {isLoading ? 'Вход...' : 'Войти'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="https://cdn.poehali.dev/files/Screenshot_27.png" 
                alt="Admin" 
                className="w-10 h-10 rounded-full object-cover border-2 border-primary"
              />
              <h1 className="text-2xl font-semibold">Админ-панель</h1>
            </div>
            <Button onClick={handleLogout} variant="outline">
              <Icon name="LogOut" size={18} className="mr-2" />
              Выйти
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="slots" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="slots">
              <Icon name="Calendar" size={18} className="mr-2" />
              Слоты
            </TabsTrigger>
            <TabsTrigger value="bookings">
              <Icon name="Users" size={18} className="mr-2" />
              Заявки
            </TabsTrigger>
          </TabsList>

          <TabsContent value="slots">
            <AdminSlots />
          </TabsContent>

          <TabsContent value="bookings">
            <AdminBookings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;