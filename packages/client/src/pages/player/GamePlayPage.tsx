import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { gameApi } from '@/api/game.api';
import { useAuthStore } from '@/store/authStore';
import { useGameStore } from '@/store/gameStore';
import { connectSocket } from '@/socket/socket';
import { Decision, WS_EVENTS, GameStatus } from '@blind/shared';
import Avatar from '@/components/common/Avatar';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function GamePlayPage() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const {
    gameStatus, setGameData, setGameFinished, updateWaitingPlayers, addRoundResult, advanceStep,
  } = useGameStore();

  const [playerData, setPlayerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showResult, setShowResult] = useState<any>(null);

  const loadPlayerData = async () => {
    try {
      const data = await gameApi.getPlayerData();
      setPlayerData(data);
      setGameData({
        gameName: data.gameName,
        isOpen: data.isOpen,
        gameStatus: data.gameStatus as GameStatus,
        currentStep: data.currentStep,
        totalPoints: data.player.totalPoints,
      });

      if (data.gameStatus === 'FINISHED' || data.gameStatus === 'STOPPED') {
        navigate('/finished', { replace: true });
      }
    } catch (err) {
      console.error('Failed to load player data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlayerData();

    const socket = connectSocket();

    socket.on(WS_EVENTS.ROUND_RESULT, (data: any) => {
      setShowResult(data);
      // Reload data after showing result
      setTimeout(() => {
        loadPlayerData();
      }, 500);
    });

    socket.on(WS_EVENTS.STEP_COMPLETED, (data: any) => {
      advanceStep(data.newStep);
      loadPlayerData();
    });

    socket.on(WS_EVENTS.DECISION_MADE, (data: any) => {
      updateWaitingPlayers(data.waitingPlayers);
      // Update local playerData waiting list
      setPlayerData((prev: any) =>
        prev ? { ...prev, waitingPlayers: data.waitingPlayers } : prev,
      );
    });

    socket.on(WS_EVENTS.GAME_FINISHED, () => {
      setGameFinished();
      navigate('/finished', { replace: true });
    });

    socket.on(WS_EVENTS.GAME_STOPPED, () => {
      navigate('/finished', { replace: true });
    });

    return () => {
      socket.off(WS_EVENTS.ROUND_RESULT);
      socket.off(WS_EVENTS.STEP_COMPLETED);
      socket.off(WS_EVENTS.DECISION_MADE);
      socket.off(WS_EVENTS.GAME_FINISHED);
      socket.off(WS_EVENTS.GAME_STOPPED);
    };
  }, []);

  const handleDecision = async (decision: Decision) => {
    if (!playerData || submitting) return;

    const currentStepData = playerData.stepsData.find(
      (s: any) => s.step === playerData.currentStep && !s.isSkipped && !s.decision,
    );

    if (!currentStepData) return;

    setSubmitting(true);
    try {
      await gameApi.makeDecision(currentStepData.decisionId, decision);
      await loadPlayerData();
    } catch (err) {
      console.error('Failed to make decision:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !playerData) return <LoadingSpinner />;

  const currentStepData = playerData.stepsData.find(
    (s: any) => s.step === playerData.currentStep,
  );

  const hasDecided = currentStepData?.decision;
  const isSkipped = currentStepData?.isSkipped;
  const isWaiting = hasDecided && currentStepData?.result === null;

  return (
    <div className="min-h-screen bg-muted/40 p-4">
      {/* Header */}
      <div className="max-w-lg mx-auto mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar avatarId={profile?.avatarId || 0} size="sm" />
            <span className="font-medium">{profile?.nickname}</span>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Очки</div>
            <div className="text-2xl font-bold text-primary">{playerData.player.totalPoints}</div>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <Badge variant="outline">
            Раунд {playerData.currentStep} / {playerData.totalSteps}
          </Badge>
          <span className="text-sm text-muted-foreground">{playerData.gameName}</span>
        </div>
      </div>

      {/* Result popup */}
      {showResult && (
        <div className="max-w-lg mx-auto mb-4">
          <Card className="border-2 border-primary">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Результат раунда {showResult.step}</p>
              <div className="flex items-center justify-center gap-4 mb-2">
                <Badge variant={showResult.yourDecision === 'AGREE' ? 'default' : 'destructive'}>
                  Вы: {showResult.yourDecision === 'AGREE' ? 'Согласие' : 'Настаивание'}
                </Badge>
                <Badge variant={showResult.partnerDecision === 'AGREE' ? 'default' : 'destructive'}>
                  Партнёр: {showResult.partnerDecision === 'AGREE' ? 'Согласие' : 'Настаивание'}
                </Badge>
              </div>
              <p className="text-xl font-bold text-primary">+{showResult.yourResult} очков</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => setShowResult(null)}
              >
                Понятно
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main game area */}
      <div className="max-w-lg mx-auto">
        {isSkipped ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-lg font-medium mb-2">Вы пропускаете этот раунд</p>
              <p className="text-muted-foreground">Ожидайте следующий раунд</p>
            </CardContent>
          </Card>
        ) : isWaiting ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-12 h-12 mx-auto rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
              <p className="text-lg font-medium mb-2">
                Ваш выбор: {hasDecided === 'AGREE' ? 'Согласие' : 'Настаивание'}
              </p>
              <p className="text-muted-foreground mb-4">Ожидание решения партнёра...</p>

              {playerData.waitingPlayers.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">Ещё не решили:</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {playerData.waitingPlayers.map((p: any, i: number) => (
                      <div key={i} className="flex items-center gap-1 text-sm">
                        <Avatar avatarId={p.avatarId} size="sm" />
                        <span>{p.nickname}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : hasDecided ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-lg font-medium">Раунд завершён</p>
              <p className="text-muted-foreground">
                Ваш выбор: {hasDecided === 'AGREE' ? 'Согласие' : 'Настаивание'}
                {currentStepData?.result !== null && ` → +${currentStepData.result} очков`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div>
            {/* Partner info for open games */}
            {playerData.isOpen && currentStepData?.partner && (
              <Card className="mb-4">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar avatarId={currentStepData.partner.avatarId} size="md" />
                    <div>
                      <p className="font-medium">{currentStepData.partner.nickname}</p>
                      {currentStepData.partner.ratingAvailable ? (
                        <div className="text-sm text-muted-foreground">
                          <span>Общий рейтинг: {Math.round((currentStepData.partner.overallRating || 0) * 100)}%</span>
                          <span className="mx-2">•</span>
                          <span>Последние: {Math.round((currentStepData.partner.recentRating || 0) * 100)}%</span>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Недостаточно данных</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Decision buttons */}
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-lg font-medium mb-6">Ваше решение:</p>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="agree"
                    size="xl"
                    onClick={() => handleDecision(Decision.AGREE)}
                    disabled={submitting}
                    className="h-24 text-lg"
                  >
                    Согласиться
                  </Button>
                  <Button
                    variant="insist"
                    size="xl"
                    onClick={() => handleDecision(Decision.INSIST)}
                    disabled={submitting}
                    className="h-24 text-lg"
                  >
                    Настаивать
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* History */}
        {playerData.stepsData.filter((s: any) => s.result !== null).length > 0 && (
          <Card className="mt-4">
            <CardContent className="p-4">
              <p className="font-medium mb-3">История раундов</p>
              <div className="space-y-2">
                {playerData.stepsData
                  .filter((s: any) => s.result !== null || s.isSkipped)
                  .map((s: any) => (
                    <div key={s.step} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                      <span className="text-muted-foreground">Раунд {s.step}</span>
                      {s.isSkipped ? (
                        <Badge variant="outline">Пропуск</Badge>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Badge variant={s.decision === 'AGREE' ? 'default' : 'destructive'} className="text-xs">
                            {s.decision === 'AGREE' ? 'Согл.' : 'Наст.'}
                          </Badge>
                          <span className="font-medium">+{s.result}</span>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}