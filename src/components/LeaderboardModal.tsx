import React, { useEffect, useState } from 'react';
import { Trophy, Medal, RefreshCw, X, Award, Calendar, BookOpen } from 'lucide-react';
import { LeaderboardEntry, getTopLeaderboard } from '../lib/firebase';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ isOpen, onClose }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchScores = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTopLeaderboard(10);
      setEntries(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError('순위표를 불러오는 중 오류가 발생했습니다.');
      console.error('Leaderboard error:', msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchScores();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getStageBadge = (stage: number) => {
    if (stage === 3) {
      return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-900/90 text-cyan-200 border border-cyan-500/60">3단계 (과학)</span>;
    }
    if (stage === 2) {
      return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-900/90 text-amber-200 border border-amber-500/60">2단계 (사회)</span>;
    }
    return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-900/90 text-emerald-200 border border-emerald-500/60">1단계 (국어)</span>;
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="chalkboard-bg border-4 border-amber-800 rounded-2xl max-w-xl w-full p-4 sm:p-6 text-white shadow-2xl relative flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-emerald-700/60">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="p-2 rounded-xl bg-yellow-950 border border-yellow-500/60 text-yellow-400">
              <Trophy className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-jua text-chalk-yellow tracking-wide">
                🏆 학급 명예의 전당 (Top 10)
              </h2>
              <p className="text-xs text-emerald-300/80 font-chalk">
                4학년 교과 어휘 타자왕들의 최고 점수 순위표입니다!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2 pr-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-stone-400 font-chalk text-lg">
              <RefreshCw className="w-7 h-7 animate-spin text-yellow-400" />
              <span>칠판 순위표를 불러오는 중입니다...</span>
            </div>
          ) : error ? (
            <div className="py-10 text-center text-rose-300 bg-rose-950/40 rounded-xl border border-rose-800/60 p-4">
              <p className="font-bold text-sm">{error}</p>
              <button
                onClick={fetchScores}
                className="mt-3 px-3 py-1 bg-stone-800 hover:bg-stone-700 rounded-lg text-xs"
              >
                다시 시도
              </button>
            </div>
          ) : entries.length === 0 ? (
            <div className="py-12 text-center text-emerald-200/70 font-chalk text-lg space-y-2">
              <Award className="w-10 h-10 mx-auto text-yellow-500/60" />
              <p>아직 등록된 기록이 없습니다!</p>
              <p className="text-sm text-stone-400">게임을 플레이하고 첫 번째 명예의 전당 주인공이 되어보세요 ✏️</p>
            </div>
          ) : (
            entries.map((entry, idx) => {
              const isFirst = idx === 0;
              const isSecond = idx === 1;
              const isThird = idx === 2;

              return (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border transition-all ${
                    isFirst
                      ? 'bg-amber-950/70 border-yellow-500/80 shadow-md shadow-yellow-950/40 scale-[1.01]'
                      : isSecond
                      ? 'bg-stone-800/60 border-slate-400/60'
                      : isThird
                      ? 'bg-amber-950/40 border-amber-700/50'
                      : 'bg-emerald-950/30 border-emerald-800/40 hover:bg-emerald-950/50'
                  }`}
                >
                  {/* Left: Rank & Nickname */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 flex items-center justify-center font-jua text-lg">
                      {isFirst ? (
                        <span className="text-2xl" title="1등 금메달">🥇</span>
                      ) : isSecond ? (
                        <span className="text-2xl" title="2등 은메달">🥈</span>
                      ) : isThird ? (
                        <span className="text-2xl" title="3등 동메달">🥉</span>
                      ) : (
                        <span className="text-stone-400 font-bold">{idx + 1}</span>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-base sm:text-lg font-jua text-white flex items-center gap-2">
                        <span>{entry.nickname}</span>
                        {getStageBadge(entry.stageReached)}
                      </div>
                      <div className="text-[11px] text-stone-400 flex items-center gap-1 font-sans-kr">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(entry.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Score */}
                  <div className="text-right">
                    <div className="font-jua text-xl sm:text-2xl text-yellow-300 tracking-wider">
                      {entry.score.toLocaleString()}
                      <span className="text-sm font-normal text-amber-200 ml-1">점</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-emerald-800/60 flex items-center justify-between text-xs text-stone-400">
          <button
            onClick={fetchScores}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>새로고침</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 font-bold text-white transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
