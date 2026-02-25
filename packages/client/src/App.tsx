import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@blind/shared';

import LoginPage from '@/pages/admin/LoginPage';
import GameListPage from '@/pages/admin/GameListPage';
import CreateGamePage from '@/pages/admin/CreateGamePage';
import GameDetailPage from '@/pages/admin/GameDetailPage';

import JoinPage from '@/pages/player/JoinPage';
import SetProfilePage from '@/pages/player/SetProfilePage';
import LobbyPage from '@/pages/player/LobbyPage';
import GamePlayPage from '@/pages/player/GamePlayPage';
import GameFinishedPage from '@/pages/player/GameFinishedPage';

import ProtectedRoute from '@/components/common/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/join/:qrToken" element={<JoinPage />} />

      <Route
        path="/set-profile"
        element={
          <ProtectedRoute role={UserRole.PLAYER}>
            <SetProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/lobby"
        element={
          <ProtectedRoute role={UserRole.PLAYER}>
            <LobbyPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/play"
        element={
          <ProtectedRoute role={UserRole.PLAYER}>
            <GamePlayPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/finished"
        element={
          <ProtectedRoute role={UserRole.PLAYER}>
            <GameFinishedPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/games"
        element={
          <ProtectedRoute role={UserRole.ADMIN}>
            <GameListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/games/create"
        element={
          <ProtectedRoute role={UserRole.ADMIN}>
            <CreateGamePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/games/:id"
        element={
          <ProtectedRoute role={UserRole.ADMIN}>
            <GameDetailPage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function RootRedirect() {
  const { token, role } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (role === UserRole.ADMIN) return <Navigate to="/admin/games" replace />;
  if (role === UserRole.PLAYER) return <Navigate to="/play" replace />;
  return <Navigate to="/login" replace />;
}

export default App;
