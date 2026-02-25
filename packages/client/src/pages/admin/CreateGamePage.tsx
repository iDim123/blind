import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeftIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { gameApi } from '@/api/game.api';
import { qrApi } from '@/api/qr.api';

export default function CreateGamePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    playersCount: 12,
    groupsCount: 3,
    playersByGroups: '',
    stepsCount: 5,
    isOpen: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [qrDialog, setQrDialog] = useState<{
    open: boolean;
    qrDataUrl: string;
    joinUrl: string;
    gameId: number;
  }>({ open: false, qrDataUrl: '', joinUrl: '', gameId: 0 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const game = await gameApi.create({
        ...form,
        playersByGroups: form.playersByGroups || undefined,
      });
      const qr = await qrApi.generate(game.id);
      setQrDialog({
        open: true,
        qrDataUrl: qr.qrDataUrl,
        joinUrl: qr.joinUrl,
        gameId: game.id,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка создания игры');
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="container py-8 max-w-lg">
      <Button variant="ghost" onClick={() => navigate('/admin/games')} className="mb-4">
        <ArrowLeftIcon className="mr-2 h-4 w-4" />
        Назад к списку
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Создание игры</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Название</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="playersCount">Количество игроков</Label>
              <Input
                id="playersCount"
                type="number"
                min={1}
                max={30}
                value={form.playersCount}
                onChange={(e) => update('playersCount', parseInt(e.target.value) || 0)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="groupsCount">Количество групп</Label>
              <Input
                id="groupsCount"
                type="number"
                min={1}
                value={form.groupsCount}
                onChange={(e) => update('groupsCount', parseInt(e.target.value) || 0)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="playersByGroups">Распределение по группам</Label>
              <Input
                id="playersByGroups"
                value={form.playersByGroups}
                onChange={(e) => update('playersByGroups', e.target.value)}
                placeholder="4,4,4"
              />
              <p className="text-xs text-muted-foreground">
                Через запятую. Если пусто — автоматическое распределение
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stepsCount">Количество раундов</Label>
              <Input
                id="stepsCount"
                type="number"
                min={1}
                value={form.stepsCount}
                onChange={(e) => update('stepsCount', parseInt(e.target.value) || 0)}
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isOpen">Открытая игра</Label>
              <Switch
                id="isOpen"
                checked={form.isOpen}
                onCheckedChange={(checked) => update('isOpen', checked)}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Создание...' : 'Создать игру'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Dialog open={qrDialog.open} onOpenChange={(open) => setQrDialog((p) => ({ ...p, open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Игра создана!</DialogTitle>
            <DialogDescription>QR-код для подключения игроков</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {qrDialog.qrDataUrl && (
              <img src={qrDialog.qrDataUrl} alt="QR Code" className="w-64 h-64" />
            )}
            <p className="text-xs text-muted-foreground text-center break-all">
              {qrDialog.joinUrl}
            </p>
            <div className="flex gap-2 w-full">
              <Button
                className="flex-1"
                onClick={() => navigate(`/admin/games/${qrDialog.gameId}`)}
              >
                Перейти к игре
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate('/admin/games')}
              >
                К списку
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}