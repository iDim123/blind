import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { PlusIcon, ExitIcon, StopIcon, EyeOpenIcon } from '@radix-ui/react-icons';
import { gameApi } from '@/api/game.api';
import { authApi } from '@/api/auth.api';
import { GameResponse } from '@blind/shared';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'destructive' | 'warning' | 'outline' }> = {
  CREATED: { label: 'Создана', variant: 'secondary' },
  STARTED: { label: 'Запущена', variant: 'default' },
  FINISHED: { label: 'Завершена', variant: 'success' },
  STOPPED: { label: 'Остановлена', variant: 'destructive' },
};

export default function GameListPage() {
  const navigate = useNavigate();
  const [games, setGames] = useState<GameResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const loadGames = async () => {
    try {
      const data = await gameApi.getList();
      setGames(data);
    } catch (err) {
      console.error('Failed to load games:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGames();
  }, []);

  const handleStopGame = async (gameId: number) => {
    try {
      await gameApi.stop(gameId);
      loadGames();
    } catch (err) {
      console.error('Failed to stop game:', err);
    }
  };

  const handleLogoutAll = async (gameId: number) => {
    try {
      await authApi.logoutAllPlayers(gameId);
    } catch (err) {
      console.error('Failed to logout players:', err);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Список игр</h1>
        <Button onClick={() => navigate('/admin/games/create')}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Создать игру
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>Название</TableHead>
                <TableHead className="w-24">Игроки</TableHead>
                <TableHead className="w-24">Группы</TableHead>
                <TableHead className="w-24">Раунды</TableHead>
                <TableHead>Текущий шаг</TableHead>
                <TableHead className="w-28">Статус</TableHead>
                <TableHead className="w-24">Открытая?</TableHead>
                <TableHead className="w-28">Дата</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {games.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                    Нет созданных игр
                  </TableCell>
                </TableRow>
              )}
              {games.map((game) => {
                const sc = statusConfig[game.status] || statusConfig.CREATED;
                return (
                  <TableRow key={game.id}>
                    <TableCell className="font-mono">{game.id}</TableCell>
                    <TableCell className="font-medium">{game.name}</TableCell>
                    <TableCell>{game.playersCount}</TableCell>
                    <TableCell>{game.groupsCount}</TableCell>
                    <TableCell>{game.stepsCount}</TableCell>
                    <TableCell className="text-xs">
                      {game.groups.map((g) => (
                        <span key={g.id} className="inline-block mr-2">
                          G{g.groupIndex}:{g.currentStep}
                        </span>
                      ))}
                    </TableCell>
                    <TableCell>
                      <Badge variant={sc.variant}>{sc.label}</Badge>
                    </TableCell>
                    <TableCell>{game.isOpen ? 'Да' : 'Нет'}</TableCell>
                    <TableCell className="text-xs">
                      {new Date(game.createdAt).toLocaleDateString('ru-RU')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/games/${game.id}`)}
                        >
                          <EyeOpenIcon className="mr-1 h-3.5 w-3.5" />
                          Просмотр
                        </Button>

                        {game.status === 'STARTED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleStopGame(game.id)}
                          >
                            <StopIcon className="mr-1 h-3.5 w-3.5" />
                            Стоп
                          </Button>
                        )}

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-600">
                              <ExitIcon className="mr-1 h-3.5 w-3.5" />
                              Выход всех
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Подтверждение</AlertDialogTitle>
                              <AlertDialogDescription>
                                Вылогинить всех игроков из игры «{game.name}»?
                                Все активные сессии будут завершены.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Отмена</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => handleLogoutAll(game.id)}
                              >
                                Вылогинить всех
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}