import React, { useState, useEffect } from 'react';
import { ChalkboardFrame } from './components/ChalkboardFrame';
import { LobbyView } from './components/LobbyView';
import { GameCanvas } from './components/GameCanvas';
import { LeaderboardModal } from './components/LeaderboardModal';
import { TeacherDashboardModal } from './components/TeacherDashboardModal';
import { verifyFirestoreFullCRUD, ConnectionTestResult } from './lib/firebase';

export default function App() {
  const [view, setView] = useState<'lobby' | 'playing'>('lobby');
  const [nickname, setNickname] = useState('');
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);

  // Real Firebase Firestore Connection state
  const [firebaseStatus, setFirebaseStatus] = useState<{
    tested: boolean;
    loading: boolean;
    success: boolean;
    message: string;
    result?: ConnectionTestResult;
  }>({
    tested: false,
    loading: true,
    success: false,
    message: 'Firestore 연결 확인 중...',
  });

  // Verify real Firestore connection on boot (create -> read -> update -> delete)
  const runFirebaseVerification = async () => {
    setFirebaseStatus((prev) => ({
      ...prev,
      loading: true,
      message: 'Firestore CRUD 테스트 실행 중...',
    }));

    try {
      const result = await verifyFirestoreFullCRUD();
      setFirebaseStatus({
        tested: true,
        loading: false,
        success: result.success,
        message: result.message,
        result,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFirebaseStatus({
        tested: true,
        loading: false,
        success: false,
        message: `연결 실패: ${msg}`,
      });
    }
  };

  useEffect(() => {
    runFirebaseVerification();
  }, []);

  const handleStartGame = (studentNickname: string) => {
    setNickname(studentNickname);
    setView('playing');
  };

  const handleBackToLobby = () => {
    setView('lobby');
  };

  return (
    <div className="w-full min-h-screen bg-stone-950">
      <ChalkboardFrame
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenTeacherDashboard={() => setIsTeacherModalOpen(true)}
        firebaseStatus={firebaseStatus}
        onRetestFirebase={runFirebaseVerification}
      >
        {view === 'lobby' ? (
          <LobbyView
            onStartGame={handleStartGame}
            onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          />
        ) : (
          <GameCanvas
            nickname={nickname}
            onGameOverOrClear={(finalScore, finalStage) => {
              // Game finished callback
            }}
            onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
            onBackToLobby={handleBackToLobby}
          />
        )}
      </ChalkboardFrame>

      {/* Hall of Fame Modal */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
      />

      {/* Teacher Dashboard Modal */}
      <TeacherDashboardModal
        isOpen={isTeacherModalOpen}
        onClose={() => setIsTeacherModalOpen(false)}
        onLeaderboardReset={() => {
          // If needed, refresh views
        }}
      />
    </div>
  );
}
