import React, { useState } from 'react';
import { Play, Trophy, Sparkles, BookOpen, Globe2, Compass, FlaskConical, Award } from 'lucide-react';
import { sound } from '../lib/audio';

interface LobbyViewProps {
  onStartGame: (nickname: string) => void;
  onOpenLeaderboard: () => void;
}

const DEFAULT_NICKNAMES = [
  '지혜로운 호랑이',
  '꿈꾸는 별',
  '성실한 독수리',
  '달리는 토끼',
  '빛나는 다람쥐',
  '멋진 판다',
];

export const LobbyView: React.FC<LobbyViewProps> = ({ onStartGame, onOpenLeaderboard }) => {
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nickname.trim();
    if (!trimmed) {
      setError('자신의 닉네임이나 이름을 입력해 주세요!');
      return;
    }
    if (trimmed.length > 15) {
      setError('닉네임은 15자 이내로 입력해 주세요.');
      return;
    }
    sound.playChalkType();
    onStartGame(trimmed);
  };

  const handleSelectPreset = (name: string) => {
    setNickname(name);
    setError(null);
    sound.playChalkType();
  };

  return (
    <div className="flex-1 flex flex-col justify-between items-center p-4 sm:p-6 text-center select-none max-w-3xl mx-auto w-full font-sans-kr">
      {/* Blackboard Title */}
      <div className="pt-2 sm:pt-4 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs sm:text-sm font-bold">
          <Sparkles className="w-4 h-4 text-yellow-300" />
          <span>초등학교 4학년 필수 학습 어휘 타자 게임</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold font-chalk text-white text-chalk tracking-wide leading-tight mt-1">
          ✏️ 4학년 교과 어휘 타자 연습
        </h1>
        <p className="text-sm sm:text-base text-emerald-200/90 font-chalk max-w-lg mx-auto">
          하늘에서 떨어지는 분필 단어를 지우개로 쓱싹 지우며 국어 · 사회 · 과학 실력을 쑥쑥 키워보세요!
        </p>
      </div>

      {/* 3 Stage Course Preview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full my-4">
        {/* Stage 1: 국어 */}
        <div className="p-3 sm:p-3.5 rounded-xl bg-stone-900/60 border border-emerald-600/50 backdrop-blur-xs text-left space-y-1.5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-800 text-emerald-100 font-bold font-jua">
              1단계
            </span>
            <BookOpen className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-bold text-base font-jua text-white">국어 어휘 마스터</div>
          <p className="text-xs text-stone-300 font-chalk">
            제안, 관용구, 비유, 줄거리, 맞춤법, 공감, 중심생각 등
          </p>
        </div>

        {/* Stage 2: 사회 */}
        <div className="p-3 sm:p-3.5 rounded-xl bg-stone-900/60 border border-amber-600/50 backdrop-blur-xs text-left space-y-1.5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-800 text-amber-100 font-bold font-jua">
              2단계
            </span>
            <Compass className="w-4 h-4 text-amber-400" />
          </div>
          <div className="font-bold text-base font-jua text-white">사회 어휘 마스터</div>
          <p className="text-xs text-stone-300 font-chalk">
            주민자치, 지방의회, 문화유산, 등고선, 공공기관 등
          </p>
        </div>

        {/* Stage 3: 과학 */}
        <div className="p-3 sm:p-3.5 rounded-xl bg-stone-900/60 border border-cyan-600/50 backdrop-blur-xs text-left space-y-1.5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-800 text-cyan-100 font-bold font-jua">
              3단계
            </span>
            <FlaskConical className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="font-bold text-base font-jua text-white">과학 어휘 마스터</div>
          <p className="text-xs text-stone-300 font-chalk">
            지층, 화석, 증발, 응결, 혼합물, 광합성, 프리즘 등
          </p>
        </div>
      </div>

      {/* Nickname Entry Box */}
      <div className="w-full max-w-md bg-stone-900/80 p-4 sm:p-5 rounded-2xl border-2 border-emerald-600/60 shadow-xl backdrop-blur-sm space-y-3">
        <form onSubmit={handleStart} className="space-y-3">
          <div className="text-left">
            <label className="block text-xs font-bold text-emerald-300 mb-1 font-jua">
              학생 닉네임 입력 (로그인 없이 바로 시작)
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                if (error) setError(null);
              }}
              placeholder="자신의 닉네임이나 이름 입력 (예: 4반 민준)"
              className="w-full py-2.5 px-4 rounded-xl bg-stone-950 border-2 border-stone-700 focus:border-yellow-400 focus:outline-none text-white font-jua text-lg text-center tracking-wide"
              maxLength={15}
              autoFocus
            />
          </div>

          {/* Quick Preset Nicknames for elementary fun */}
          <div className="text-left space-y-1">
            <span className="text-[11px] text-stone-400">추천 닉네임 골라보기:</span>
            <div className="flex flex-wrap gap-1.5">
              {DEFAULT_NICKNAMES.map((name) => (
                <button
                  type="button"
                  key={name}
                  onClick={() => handleSelectPreset(name)}
                  className="px-2 py-0.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-[11px] text-stone-300 border border-stone-700 transition-colors"
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="text-xs text-rose-400 bg-rose-950/60 p-2 rounded-lg border border-rose-800 font-medium">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-jua text-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>게임 시작하기</span>
            </button>

            <button
              type="button"
              onClick={onOpenLeaderboard}
              className="py-3 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-yellow-300 font-jua text-sm font-bold flex items-center justify-center gap-1.5 border border-yellow-600/40 shadow transition-all"
              title="학급 명예의 전당 보기"
            >
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="hidden sm:inline">명예의 전당</span>
            </button>
          </div>
        </form>
      </div>

      {/* Bottom Hint */}
      <div className="pt-2 text-xs text-stone-400 font-chalk">
        💡 단어가 바닥에 닿으면 하트(생명)가 깎여요! 엔터(Enter) 키로 지우개 쓱싹!
      </div>
    </div>
  );
};
