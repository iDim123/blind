import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@blind/shared';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function JoinPage() {
  const { qrToken } = useParams<{ qrToken: string }>();
  const navigate = useNavigate();
  const { token, role, gameId, setAuth, setGameId } = useAuthStore();
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(true);

  useEffect(() => {
    // If already logged in as player for this game, skip join
    if (token && role === UserRole.PLAYER && gameId) {
      navigate('/set-profile', { replace: true });
      return;
    }

    if (!qrToken) {
      setError('Неверная ссылка');
      setJoining(false);
      return;
    }

    const join = async () => {
      try {
        const result = await authApi.joinByQr(qrToken);
        setAuth(result.accessToken, UserRole.PLAYER, result.user.id);
        setGameId(result.gameId!);

        if (result.needsProfile) {
          navigate('/set-profile', { replace: true });
        } else {
          navigate('/lobby', { replace: true });
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Не удалось присоединиться');
      } finally {
        setJoining(false);
      }
    };

    join();
  }, [qrToken]);

  if (joining) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-center">Ошибка</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <LoadingSpinner />;
}
