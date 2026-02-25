import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/auth.api';
import { UserRole } from '@blind/shared';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function JoinPage() {
  const { qrToken } = useParams<{ qrToken: string }>();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [error, setError] = useState('');

  useEffect(() => {
    if (!qrToken) {
      setError('Некорректная ссылка');
      return;
    }

    const join = async () => {
      try {
        const result = await authApi.joinByQr(qrToken);
        setAuth(result.accessToken, UserRole.PLAYER, result.user.id, result.gameId);
        navigate('/set-profile');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Ошибка подключения к игре');
      }
    };

    join();
  }, [qrToken]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
        <div className="bg-background rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
          <p className="text-destructive text-lg">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner text="Подключение к игре..." />
    </div>
  );
}