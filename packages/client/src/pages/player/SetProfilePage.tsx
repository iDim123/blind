import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/auth.api';
import { AVATAR_COUNT } from '@blind/shared';
import { cn } from '@/lib/utils';
import Avatar from '@/components/common/Avatar';

export default function SetProfilePage() {
  const navigate = useNavigate();
  const { setProfile } = useAuthStore();
  const [nickname, setNickname] = useState('');
  const [avatarId, setAvatarId] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError('Введите имя');
      return;
    }
    if (avatarId === 0) {
      setError('Выберите аватарку');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await authApi.setProfile({ nickname: nickname.trim(), avatarId });
      setProfile({ nickname: nickname.trim(), avatarId });
      navigate('/lobby');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка сохранения профиля');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <div className="bg-background rounded-2xl shadow-lg p-6 max-w-sm w-full">
        <h1 className="text-xl font-bold text-center mb-1">Добро пожаловать!</h1>
        <p className="text-muted-foreground text-center text-sm mb-6">
          Напишите ваше имя (ненастоящее) и выберите аватарку
        </p>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Ваш псевдоним"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={20}
            className="w-full px-4 py-3 border border-input rounded-xl text-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring mb-4"
          />

          <p className="text-sm text-muted-foreground mb-3">Выберите аватарку:</p>
          <div className="grid grid-cols-6 gap-2 mb-6">
            {Array.from({ length: AVATAR_COUNT }, (_, i) => i + 1).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setAvatarId(id)}
                className={cn(
                  'p-1 rounded-lg transition-all',
                  avatarId === id
                    ? 'ring-2 ring-primary ring-offset-2 scale-110'
                    : 'hover:scale-105',
                )}
              >
                <Avatar avatarId={id} size="md" />
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl text-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Сохранение...' : 'Продолжить'}
          </button>
        </form>
      </div>
    </div>
  );
}