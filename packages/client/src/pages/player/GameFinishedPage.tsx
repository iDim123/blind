import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';

export default function GameFinishedPage() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const handleExit = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <div className="bg-background rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
        <h1 className="text-2xl font-bold mb-4">Игра завершена!</h1>
        <p className="text-muted-foreground mb-6">Результаты будут доработаны в Фазе 5</p>
        <Button onClick={handleExit} size="xl" className="w-full">
          Выйти
        </Button>
      </div>
    </div>
  );
}