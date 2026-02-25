import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useGameStore } from '@/store/gameStore';
import { connectSocket } from '@/socket/socket';
import { WS_EVENTS } from '@blind/shared';
import Avatar from '@/components/common/Avatar';

export default function LobbyPage() {
  const navigate = useNavigate();
  const { profile, logout } = useAuthStore();
  const { connectedPlayers, setConnectedPlayers } = useGameStore();

  useEffect(() => {
    const socket = connectSocket();

    socket.on(WS_EVENTS.PLAYER_JOINED, (data: { connectedPlayers: number }) => {
      setConnectedPlayers(data.connectedPlayers);
    });

    socket.on(WS_EVENTS.GAME_STARTED, () => {
      navigate('/play');
    });

    socket.on(WS_EVENTS.FORCE_LOGOUT, () => {
      logout();
      navigate('/');
    });

    return () => {
      socket.off(WS_EVENTS.PLAYER_JOINED);
      socket.off(WS_EVENTS.GAME_STARTED);
      socket.off(WS_EVENTS.FORCE_LOGOUT);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/40 p-4">
      <div className="bg-background rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
        {profile && (
          <div className="flex items-center justify-center gap-3 mb-6">
            <Avatar avatarId={profile.avatarId} size="lg" />
            <span className="text-xl font-bold">{profile.nickname}</span>
          </div>
        )}

        <div className="mb-6">
          <div className="w-16 h-16 mx-auto rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>

        <h2 className="text-lg font-semibold mb-2">Ожидание начала игры...</h2>
        <p className="text-muted-foreground">
          Подключено игроков:{' '}
          <span className="font-bold text-primary">{connectedPlayers}</span>
        </p>
      </div>
    </div>
  );
}