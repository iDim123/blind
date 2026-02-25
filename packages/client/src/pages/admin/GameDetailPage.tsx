import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ArrowLeftIcon } from '@radix-ui/react-icons';
import { gameApi } from '@/api/game.api';
import { qrApi } from '@/api/qr.api';
import { GameResponse, WS_EVENTS } from '@blind/shared';
import { connectSocket } from '@/socket/socket';
import Avatar from '@/components/common/Avatar';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'destructive' }> = {
  CREATED: { label: 'Создана', variant: 'secondary' },
  STARTED: { label: 'Запущена', variant: 'default' },
  FINISHED: { label: 'Завершена', variant: 'success' },
  STOPPED: { label: 'Остановлена', variant: 'destructive' },
};

export default function GameDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [connectedPlayers, setConnectedPlayers] = useState(0);

  const loadGame = async () => {
    try {
      const data = await gameApi.getById(Number(id));
      setGame(data);
    } catch (err) {
      console.error('Failed to load game:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadQr = async () => {
    try {
      const data = await qrApi.generate(Number(id));
      setQrDataUrl(data.qrDataUrl);
    } catch (err) {
      console.error('Failed to load QR:', err);
    }
  };

  useEffect(() => {
    loadGame();
    loadQr();

    const socket = connectSocket();

    socket.on(WS_EVENTS.ADMIN_UPDATE, (data: any) => {
      if (data.gameId === Number(id)) {
        setConnectedPlayers(data.connectedPlayers ?? 0);
        loadGame(); // refresh game data
      }
    });

    socket.on(WS_EVENTS.PLAYER_JOINED, (data: any) => {
      setConnectedPlayers(data.connectedPlayers ?? 0);
    });

    return () => {
      socket.off(WS_EVENTS.ADMIN_UPDATE);
      socket.off(WS_EVENTS.PLAYER_JOINED);
    };
  }, [id]);

  const handleStart = async () => {
    try {
      await gameApi.start(Number(id));
      loadGame();
    } catch (err) {
      console.error('Failed to start game:', err);
    }
  };

  const handleStop = async () => {
    try {
      await gameApi.stop(Number(id));
      loadGame();
    } catch (err) {
      console.error('Failed to stop game:', err);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!game) return <div className="p-8 text-center">Игра не найдена</div>;

  const sc = statusConfig[game.status] || statusConfig.CREATED;

  return (
    <div className="container py-8 max-w-5xl">
      <Button variant="ghost" onClick={() => navigate('/admin/games')} className="mb-4">
        <ArrowLeftIcon className="mr-2 h-4 w-4" />
        К списку игр
      </Button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{game.name}</h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant={sc.variant}>{sc.label}</Badge>
            <span className="text-sm text-muted-foreground">
              Игроки: {game.playerProfiles?.length ?? 0} / {game.playersCount}
            </span>
            <span className="text-sm text-muted-foreground">
              Онлайн: <span className="font-bold text-primary">{connectedPlayers}</span>
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          {game.status === 'CREATED' && (
            <Button onClick={handleStart} className="bg-green-600 hover:bg-green-700">
              Старт игры
            </Button>
          )}
          {game.status === 'STARTED' && (
            <Button variant="destructive" onClick={handleStop}>
              Остановить
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* QR Code */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">QR-код для подключения</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Code" className="w-64 h-64" />
            ) : (
              <div className="w-64 h-64 bg-muted rounded flex items-center justify-center text-muted-foreground">
                Загрузка...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Game Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Параметры</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Игроки:</span>
              <span className="font-medium">{game.playersCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Группы:</span>
              <span className="font-medium">{game.groupsCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Раунды:</span>
              <span className="font-medium">{game.stepsCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Открытая:</span>
              <span className="font-medium">{game.isOpen ? 'Да' : 'Нет'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Players */}
      {game.playerProfiles && game.playerProfiles.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Игроки ({game.playerProfiles.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Игрок</TableHead>
                  <TableHead>Группа</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {game.playerProfiles.map((p: any, i: number) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono">{i + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar avatarId={p.avatarId} size="sm" />
                        <span>{p.nickname.startsWith('__pending_') ? '(ожидает)' : p.nickname}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {p.groupId ? `Группа ${p.groupId}` : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
