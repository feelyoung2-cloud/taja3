import React, { useState } from 'react';
import { Volume2, VolumeX, Trophy, ShieldAlert, Sparkles, CheckCircle, AlertTriangle, RefreshCw, GraduationCap } from 'lucide-react';
import { sound } from '../lib/audio';
import { ConnectionTestResult, verifyFirestoreFullCRUD } from '../lib/firebase';

interface ChalkboardFrameProps {
  children: React.ReactNode;
  onOpenLeaderboard: () => void;
  onOpenTeacherDashboard: () => void;
  firebaseStatus: {
    tested: boolean;
    loading: boolean;
    success: boolean;
    message: string;
    result?: ConnectionTestResult;
  };
  onRetestFirebase: () => void;
}

export const ChalkboardFrame: React.FC<ChalkboardFrameProps> = ({
  children,
  onOpenLeaderboard,
  onOpenTeacherDashboard,
  firebaseStatus,
  onRetestFirebase,
}) => {
  const [isMuted, setIsMuted] = useState(sound.isMuted);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const handleToggleSound = () => {
    const next = sound.toggleMute();
    setIsMuted(next);
  };

  return (
    <div className="min-h-screen w-full bg-stone-950 p-2 sm:p-4 md:p-6 flex flex-col items-center justify-center font-sans-kr select-none">
      {/* Outer Wooden Frame */}
      <div className="w-full max-w-5xl rounded-2xl p-3 sm:p-5 md:p-6 bg-gradient-to-b from-amber-800 via-amber-900 to-amber-950 border-[6px] sm:border-[10px] border-amber-950 shadow-2xl relative">
        {/* Frame corner screws */}
        <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-amber-400/50 border border-amber-900 shadow-inner" />
        <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-amber-400/50 border border-amber-900 shadow-inner" />
        <div className="absolute bottom-2 left-2 w-3 h-3 rounded-full bg-amber-400/50 border border-amber-900 shadow-inner" />
        <div className="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-amber-400/50 border border-amber-900 shadow-inner" />

        {/* Top Blackboard Header Bar */}
        <div className="flex flex-wrap items-center justify-between pb-3 px-2 border-b border-amber-900/60 mb-2 gap-2 text-white">
          {/* Title / Class Badge */}
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-950/80 rounded-lg border border-amber-700/60 text-amber-300">
              <GraduationCap className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-lg sm:text-xl font-bold font-jua text-amber-100 flex items-center gap-1.5">
                4학년 교과 어휘 타자 연습
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-900/80 text-emerald-300 border border-emerald-600/50 font-normal">
                  국어·사회·과학
                </span>
              </h1>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* Real Firebase Status Badge */}
            <button
              onClick={() => setShowStatusModal(true)}
              title="클릭하여 Firestore 실제 CRUD 연결 상태 확인"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors shadow-sm ${
                firebaseStatus.loading
                  ? 'bg-amber-950/80 text-amber-300 border-amber-600/60'
                  : firebaseStatus.success
                  ? 'bg-emerald-950/90 text-emerald-300 border-emerald-600/80 hover:bg-emerald-900'
                  : 'bg-rose-950/90 text-rose-300 border-rose-600/80 hover:bg-rose-900'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  firebaseStatus.loading
                    ? 'bg-amber-400 animate-ping'
                    : firebaseStatus.success
                    ? 'bg-emerald-400'
                    : 'bg-rose-500'
                }`}
              />
              <span className="hidden sm:inline">
                {firebaseStatus.loading
                  ? 'Firebase 확인 중'
                  : firebaseStatus.success
                  ? 'Firebase 연결 정상'
                  : 'Firebase 연결 오류'}
              </span>
              <span className="sm:hidden">
                {firebaseStatus.success ? '연결됨' : '연결안됨'}
              </span>
            </button>

            {/* Leaderboard button */}
            <button
              onClick={onOpenLeaderboard}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-yellow-950/80 hover:bg-yellow-900 text-yellow-300 border border-yellow-600/60 text-xs font-bold font-jua transition-all shadow hover:scale-105 active:scale-95"
            >
              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              <span>명예의 전당</span>
            </button>

            {/* Mute button */}
            <button
              onClick={handleToggleSound}
              className={`p-1.5 rounded-lg border text-xs transition-colors ${
                isMuted
                  ? 'bg-stone-800 text-stone-400 border-stone-700'
                  : 'bg-stone-800/90 hover:bg-stone-700 text-amber-200 border-amber-700/60'
              }`}
              title={isMuted ? '소리 켜기' : '소리 끄기 (음소거)'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Blackboard Canvas Area */}
        <div className="chalkboard-bg rounded-xl border-4 border-stone-800/90 shadow-inner relative overflow-hidden min-h-[500px] flex flex-col justify-between">
          {children}
        </div>

        {/* Chalk Ledge & Tray at Bottom */}
        <div className="mt-2 h-9 bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 rounded-lg border-t-2 border-b-2 border-amber-950 shadow-inner flex items-center justify-between px-4 relative">
          {/* Chalk sticks */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* White chalk */}
            <div className="w-8 sm:w-12 h-2.5 rounded-full bg-slate-100 shadow-md transform -rotate-1" title="흰색 분필 (국어)" />
            {/* Yellow chalk */}
            <div className="w-8 sm:w-12 h-2.5 rounded-full bg-yellow-200 shadow-md transform rotate-1" title="노란 분필 (사회)" />
            {/* Cyan chalk */}
            <div className="w-8 sm:w-12 h-2.5 rounded-full bg-sky-200 shadow-md transform -rotate-2" title="하늘색 분필 (과학)" />
            {/* Pink chalk */}
            <div className="w-7 sm:w-10 h-2.5 rounded-full bg-pink-200 shadow-md transform rotate-2 hidden sm:block" title="분홍 분필" />

            {/* Chalkboard eraser in tray */}
            <div className="h-4 w-14 bg-stone-700 rounded-sm border border-amber-950 flex flex-col overflow-hidden shadow ml-2">
              <div className="h-1.5 bg-amber-800" />
              <div className="h-2.5 bg-stone-600" />
            </div>
          </div>

          <div className="text-[11px] text-amber-300/70 font-chalk hidden md:block">
            칠판에 분필로 쓱쓱! 국어 · 사회 · 과학 교과 어휘를 즐겁게 배워요
          </div>

          {/* Teacher Admin Entry Button in Corner */}
          <button
            onClick={onOpenTeacherDashboard}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950/80 hover:bg-amber-900 text-amber-200/80 hover:text-amber-100 text-[11px] font-sans border border-amber-700/40 transition-colors shadow-sm"
            title="선생님 관리자 대시보드 (순위표 초기화)"
          >
            <ShieldAlert className="w-3 h-3 text-amber-400" />
            <span>교사용 모드</span>
          </button>
        </div>
      </div>

      {/* Firebase Status Diagnostic Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border-2 border-emerald-600/70 rounded-2xl max-w-md w-full p-5 text-white shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <CheckCircle className={`w-5 h-5 ${firebaseStatus.success ? 'text-emerald-400' : 'text-rose-400'}`} />
                <h3 className="font-jua text-lg">Firebase 연결 상태 진단</h3>
              </div>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-stone-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3 text-sm">
              <div className="p-3 rounded-lg bg-stone-950 border border-stone-800">
                <div className="text-stone-400 text-xs mb-1">Firestore 연결 상태</div>
                <div className="font-bold flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${firebaseStatus.success ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  {firebaseStatus.message}
                </div>
              </div>

              {/* CRUD Detail Checklist */}
              {firebaseStatus.result && (
                <div className="p-3 rounded-lg bg-stone-950 border border-stone-800 space-y-2">
                  <div className="text-stone-400 text-xs font-bold">실제 Firestore CRUD 검증 내역:</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-stone-300">
                      <span className={firebaseStatus.result.details.create ? 'text-emerald-400' : 'text-rose-400'}>
                        {firebaseStatus.result.details.create ? '✓' : '✗'}
                      </span>
                      <span>문서 생성 (Create)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-stone-300">
                      <span className={firebaseStatus.result.details.read ? 'text-emerald-400' : 'text-rose-400'}>
                        {firebaseStatus.result.details.read ? '✓' : '✗'}
                      </span>
                      <span>문서 읽기 (Read)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-stone-300">
                      <span className={firebaseStatus.result.details.update ? 'text-emerald-400' : 'text-rose-400'}>
                        {firebaseStatus.result.details.update ? '✓' : '✗'}
                      </span>
                      <span>문서 수정 (Update)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-stone-300">
                      <span className={firebaseStatus.result.details.delete ? 'text-emerald-400' : 'text-rose-400'}>
                        {firebaseStatus.result.details.delete ? '✓' : '✗'}
                      </span>
                      <span>문서 삭제 (Delete)</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-stone-500 pt-1">
                    응답 소요 시간: {firebaseStatus.result.durationMs}ms
                  </div>
                </div>
              )}

              <p className="text-xs text-stone-400 leading-relaxed">
                학생들이 게임을 마치면 닉네임과 최고 점수가 Firestore의 <code className="text-emerald-300">leaderboard</code> 컬렉션에 자동 저장되며 학급 명예의 전당 순위표에 실시간 반영됩니다.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
              <button
                onClick={() => {
                  onRetestFirebase();
                }}
                disabled={firebaseStatus.loading}
                className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${firebaseStatus.loading ? 'animate-spin' : ''}`} />
                <span>재검증 실행</span>
              </button>
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
