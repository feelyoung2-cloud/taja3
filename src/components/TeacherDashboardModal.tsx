import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  KeyRound,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Lock,
  Unlock,
  BookOpen,
  RefreshCw,
  X,
  FileText
} from 'lucide-react';
import { hashPassword } from '../lib/crypto';
import {
  getTeacherSettings,
  setTeacherSettings,
  clearAllLeaderboardEntries,
  verifyFirestoreFullCRUD,
  ConnectionTestResult
} from '../lib/firebase';
import { STAGE_CONFIGS } from '../lib/words';

interface TeacherDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeaderboardReset?: () => void;
}

export const TeacherDashboardModal: React.FC<TeacherDashboardModalProps> = ({
  isOpen,
  onClose,
  onLeaderboardReset
}) => {
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);
  const [storedHash, setStoredHash] = useState<string | null>(null);

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Tab
  const [activeTab, setActiveTab] = useState<'reset' | 'vocab' | 'diagnostics' | 'security'>('reset');

  // Reset state
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  // Diagnostics
  const [diagResult, setDiagResult] = useState<ConnectionTestResult | null>(null);
  const [diagLoading, setDiagLoading] = useState(false);

  // Selected subject for vocab review
  const [vocabSubject, setVocabSubject] = useState<'국어' | '사회' | '과학'>('국어');

  useEffect(() => {
    if (isOpen) {
      checkAdminConfig();
    } else {
      // Reset sensitive states on close
      setPasswordInput('');
      setConfirmPasswordInput('');
      setAuthError(null);
      setAuthSuccess(null);
      setShowConfirmReset(false);
    }
  }, [isOpen]);

  const checkAdminConfig = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const settings = await getTeacherSettings();
      if (settings && settings.isConfigured && settings.passwordHash) {
        setIsConfigured(true);
        setStoredHash(settings.passwordHash);
      } else {
        setIsConfigured(false);
        setStoredHash(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('Teacher config load warning:', msg);
      // If doc does not exist, consider unconfigured
      setIsConfigured(false);
    } finally {
      setLoading(false);
    }
  };

  // Initial Password Setup
  const handleSetupPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (passwordInput.length < 4) {
      setAuthError('비밀번호를 4자리 이상 입력해 주세요.');
      return;
    }
    if (passwordInput !== confirmPasswordInput) {
      setAuthError('비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    try {
      setLoading(true);
      const hash = await hashPassword(passwordInput);
      await setTeacherSettings(hash);
      setStoredHash(hash);
      setIsConfigured(true);
      setIsAuthenticated(true);
      setPasswordInput('');
      setConfirmPasswordInput('');
      setAuthSuccess('교사 관리자 비밀번호가 안전하게 설정되었습니다!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setAuthError(`비밀번호 설정 실패: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  // Teacher Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!passwordInput) {
      setAuthError('비밀번호를 입력해 주세요.');
      return;
    }

    try {
      setLoading(true);
      const inputHash = await hashPassword(passwordInput);
      if (inputHash === storedHash) {
        setIsAuthenticated(true);
        setPasswordInput('');
        setAuthError(null);
      } else {
        setAuthError('비밀번호가 일치하지 않습니다.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setAuthError(`로그인 오류: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  // Reset Leaderboard in Firestore
  const handleResetLeaderboard = async () => {
    setIsResetting(true);
    setResetMessage(null);
    try {
      const deletedCount = await clearAllLeaderboardEntries();
      setResetMessage(`순위표 초기화 완료: 총 ${deletedCount}개의 순위 기록이 Firestore에서 삭제되었습니다.`);
      setShowConfirmReset(false);
      if (onLeaderboardReset) {
        onLeaderboardReset();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setResetMessage(`초기화 실패: ${msg}`);
    } finally {
      setIsResetting(false);
    }
  };

  // Run CRUD diagnostics
  const handleRunDiagnostics = async () => {
    setDiagLoading(true);
    try {
      const res = await verifyFirestoreFullCRUD();
      setDiagResult(res);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setDiagLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 font-sans-kr">
      <div className="bg-stone-900 border-2 border-amber-700/80 rounded-2xl max-w-2xl w-full p-4 sm:p-6 text-white shadow-2xl relative flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-950 border border-amber-600/70 text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-jua text-amber-100 flex items-center gap-2">
                교사 관리자 대시보드
                {isAuthenticated && (
                  <span className="text-[11px] font-sans px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700">
                    인증됨
                  </span>
                )}
              </h2>
              <p className="text-xs text-stone-400">
                학급 명예의 전당 순위표 초기화 및 교과 어휘 관리
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto py-4">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-stone-400 text-sm">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
              <span>관리자 설정 확인 중...</span>
            </div>
          ) : !isAuthenticated ? (
            /* Authentication / Initial Setup Screen */
            <div className="max-w-md mx-auto py-4 space-y-4">
              {!isConfigured ? (
                /* Step 1: Initial Password Setup */
                <form onSubmit={handleSetupPassword} className="space-y-4">
                  <div className="p-3.5 bg-amber-950/40 border border-amber-700/50 rounded-xl text-amber-200 text-xs leading-relaxed">
                    <p className="font-bold mb-1 flex items-center gap-1.5 text-amber-300">
                      <Lock className="w-4 h-4" /> 최초 관리자 비밀번호 등록
                    </p>
                    선생님 전용 비밀번호를 처음으로 등록합니다. 비밀번호는 SHA-256 해시값으로 암호화되어 안전하게 저장됩니다.
                  </div>

                  <div>
                    <label className="block text-xs text-stone-300 mb-1 font-medium">
                      관리자 비밀번호 (4자리 이상)
                    </label>
                    <input
                      type="password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="비밀번호 입력"
                      className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-lg text-white focus:outline-none focus:border-amber-500 text-sm"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-stone-300 mb-1 font-medium">
                      비밀번호 확인
                    </label>
                    <input
                      type="password"
                      value={confirmPasswordInput}
                      onChange={(e) => setConfirmPasswordInput(e.target.value)}
                      placeholder="비밀번호 다시 입력"
                      className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-lg text-white focus:outline-none focus:border-amber-500 text-sm"
                    />
                  </div>

                  {authError && (
                    <div className="text-xs text-rose-400 bg-rose-950/50 p-2.5 rounded-lg border border-rose-800">
                      {authError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm transition-colors shadow-md"
                  >
                    관리자 비밀번호 설정 및 로그인
                  </button>
                </form>
              ) : (
                /* Step 2: Teacher Login */
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="p-3.5 bg-stone-800/80 border border-stone-700 rounded-xl text-stone-300 text-xs">
                    교사 관리자 비밀번호를 입력해 주세요.
                  </div>

                  <div>
                    <label className="block text-xs text-stone-300 mb-1 font-medium">
                      비밀번호
                    </label>
                    <input
                      type="password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="비밀번호 입력"
                      className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-lg text-white focus:outline-none focus:border-amber-500 text-sm"
                      autoFocus
                    />
                  </div>

                  {authError && (
                    <div className="text-xs text-rose-400 bg-rose-950/50 p-2.5 rounded-lg border border-rose-800">
                      {authError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm transition-colors shadow-md"
                  >
                    로그인
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* Step 3: Authenticated Dashboard */
            <div className="space-y-4">
              {/* Tab Navigation */}
              <div className="flex border-b border-stone-800 gap-1 pb-1 text-xs">
                <button
                  onClick={() => setActiveTab('reset')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    activeTab === 'reset'
                      ? 'bg-amber-950/80 text-amber-300 border border-amber-600/60'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  순위표 초기화
                </button>
                <button
                  onClick={() => setActiveTab('vocab')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    activeTab === 'vocab'
                      ? 'bg-amber-950/80 text-amber-300 border border-amber-600/60'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  교과 어휘 사전 ({STAGE_CONFIGS.reduce((acc, c) => acc + c.words.length, 0)}단어)
                </button>
                <button
                  onClick={() => setActiveTab('diagnostics')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    activeTab === 'diagnostics'
                      ? 'bg-amber-950/80 text-amber-300 border border-amber-600/60'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Firestore CRUD 진단
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    activeTab === 'security'
                      ? 'bg-amber-950/80 text-amber-300 border border-amber-600/60'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  비밀번호 변경
                </button>
              </div>

              {/* Tab: Reset Leaderboard */}
              {activeTab === 'reset' && (
                <div className="space-y-4 py-2">
                  <div className="p-4 bg-rose-950/30 border border-rose-800/60 rounded-xl space-y-2">
                    <h3 className="font-bold text-rose-300 flex items-center gap-2 text-sm">
                      <AlertTriangle className="w-4 h-4" /> 명예의 전당 순위표 초기화
                    </h3>
                    <p className="text-xs text-stone-300 leading-relaxed">
                      새 학기, 새로운 차시, 또는 새로운 어휘 대결을 시작할 때 학급 학생들의 순위표 데이터를 깨끗하게 비울 수 있습니다.
                      초기화 시 Firestore의 <code className="text-rose-300">leaderboard</code> 컬렉션에 누적된 학생 점수 데이터가 일괄 삭제됩니다.
                    </p>
                  </div>

                  {resetMessage && (
                    <div className="p-3 bg-emerald-950/60 border border-emerald-700/60 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      <span>{resetMessage}</span>
                    </div>
                  )}

                  {!showConfirmReset ? (
                    <button
                      onClick={() => setShowConfirmReset(true)}
                      className="px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-sm flex items-center gap-2 transition-colors shadow"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>명예의 전당 순위표 초기화 진행</span>
                    </button>
                  ) : (
                    <div className="p-4 bg-stone-950 border-2 border-rose-600 rounded-xl space-y-3">
                      <p className="text-sm font-bold text-rose-300">
                        정말로 학급 순위표를 모두 삭제하시겠습니까?
                      </p>
                      <p className="text-xs text-stone-400">
                        삭제된 순위 기록은 복구할 수 없습니다. 확인 후 진행해 주세요.
                      </p>
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={handleResetLeaderboard}
                          disabled={isResetting}
                          className="px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                          {isResetting ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          <span>네, 모두 삭제합니다</span>
                        </button>
                        <button
                          onClick={() => setShowConfirmReset(false)}
                          disabled={isResetting}
                          className="px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Vocab Reference */}
              {activeTab === 'vocab' && (
                <div className="space-y-3 py-1">
                  <div className="flex gap-2">
                    {(['국어', '사회', '과학'] as const).map((sub) => (
                      <button
                        key={sub}
                        onClick={() => setVocabSubject(sub)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          vocabSubject === sub
                            ? sub === '국어'
                              ? 'bg-emerald-800 text-emerald-100'
                              : sub === '사회'
                              ? 'bg-amber-800 text-amber-100'
                              : 'bg-cyan-800 text-cyan-100'
                            : 'bg-stone-800 text-stone-400 hover:text-white'
                        }`}
                      >
                        {sub} 어휘 목록
                      </button>
                    ))}
                  </div>

                  {(() => {
                    const cfg = STAGE_CONFIGS.find((c) => c.subject === vocabSubject);
                    if (!cfg) return null;
                    return (
                      <div className="space-y-2">
                        <div className="text-xs text-stone-400">
                          {cfg.title} - 총 {cfg.words.length}개 어휘
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                          {cfg.words.map((w, idx) => (
                            <div
                              key={w.id}
                              className="p-2.5 rounded-lg bg-stone-950 border border-stone-800 text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-sm text-yellow-300">
                                  {idx + 1}. {w.word}
                                </span>
                              </div>
                              <p className="text-stone-300 leading-snug">{w.meaning}</p>
                              {w.tip && (
                                <p className="text-[11px] text-emerald-400/80 italic">
                                  💡 {w.tip}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Tab: Firestore Diagnostics */}
              {activeTab === 'diagnostics' && (
                <div className="space-y-3 py-1">
                  <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 text-xs text-stone-300 leading-relaxed">
                    실제 Firestore에 테스트 문서를 직접 <strong>생성(Create) → 읽기(Read) → 수정(Update) → 삭제(Delete)</strong>하여 데이터베이스 통신이 완벽하게 동작하는지 검증합니다.
                  </div>

                  <button
                    onClick={handleRunDiagnostics}
                    disabled={diagLoading}
                    className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${diagLoading ? 'animate-spin' : ''}`} />
                    <span>실제 Firestore CRUD 검증 테스트 실행</span>
                  </button>

                  {diagResult && (
                    <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-3 text-xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle
                          className={`w-5 h-5 ${
                            diagResult.success ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        />
                        <span className="font-bold text-sm">{diagResult.message}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-stone-300">
                        <div>문서 생성 (Create): {diagResult.details.create ? '🟢 통과' : '🔴 실패'}</div>
                        <div>문서 읽기 (Read): {diagResult.details.read ? '🟢 통과' : '🔴 실패'}</div>
                        <div>문서 수정 (Update): {diagResult.details.update ? '🟢 통과' : '🔴 실패'}</div>
                        <div>문서 삭제 (Delete): {diagResult.details.delete ? '🟢 통과' : '🔴 실패'}</div>
                      </div>
                      <div className="text-[11px] text-stone-500">
                        소요 시간: {diagResult.durationMs}ms
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Change Password */}
              {activeTab === 'security' && (
                <form onSubmit={handleSetupPassword} className="space-y-3 max-w-sm py-1">
                  <p className="text-xs text-stone-400">새로운 관리자 비밀번호를 입력해 주세요.</p>
                  <div>
                    <input
                      type="password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="새 비밀번호 (4자리 이상)"
                      className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <input
                      type="password"
                      value={confirmPasswordInput}
                      onChange={(e) => setConfirmPasswordInput(e.target.value)}
                      placeholder="새 비밀번호 확인"
                      className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  {authError && <div className="text-xs text-rose-400">{authError}</div>}
                  {authSuccess && <div className="text-xs text-emerald-400">{authSuccess}</div>}
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs"
                  >
                    비밀번호 변경 저장
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-stone-800 flex justify-between items-center text-xs text-stone-400">
          {isAuthenticated && (
            <button
              onClick={() => setIsAuthenticated(false)}
              className="text-stone-400 hover:text-white"
            >
              로그아웃
            </button>
          )}
          <div className="ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors font-medium"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
