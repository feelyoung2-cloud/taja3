import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Heart, Sparkles, Trophy, ArrowRight, RotateCcw, Flame, Check, HelpCircle } from 'lucide-react';
import { STAGE_CONFIGS, StageConfig, WordItem } from '../lib/words';
import { sound } from '../lib/audio';
import { EraserAnimation } from './EraserAnimation';
import { ChalkDustEffect } from './ChalkParticle';
import { saveLeaderboardEntry } from '../lib/firebase';

interface FallingWord {
  instanceId: string;
  item: WordItem;
  x: number; // percentage from left (8% ~ 82%)
  y: number; // percentage from top (0% ~ 90%)
  speed: number;
}

interface ErasedEvent {
  id: string;
  word: string;
  meaning: string;
  pixelX: number;
  pixelY: number;
  score: number;
}

interface GameCanvasProps {
  nickname: string;
  onGameOverOrClear: (finalScore: number, finalStage: number) => void;
  onOpenLeaderboard: () => void;
  onBackToLobby: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  nickname,
  onGameOverOrClear,
  onOpenLeaderboard,
  onBackToLobby,
}) => {
  const [currentStageIdx, setCurrentStageIdx] = useState(0); // 0: 국어, 1: 사회, 2: 과학
  const stageConfig: StageConfig = STAGE_CONFIGS[currentStageIdx];

  const [lives, setLives] = useState(5);
  const [score, setScore] = useState(0);
  const [stageClearedCount, setStageClearedCount] = useState(0); // words cleared in this stage
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);

  // Active falling words
  const [fallingWords, setFallingWords] = useState<FallingWord[]>([]);
  const [typedInput, setTypedInput] = useState('');

  // Eraser animation and particle events
  const [erasedEvents, setErasedEvents] = useState<ErasedEvent[]>([]);
  const [dustParticles, setDustParticles] = useState<{ id: string; x: number; y: number }[]>([]);

  // Stage transition overlay
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionCountdown, setTransitionCountdown] = useState(3);

  // Final State
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [isSavingScore, setIsSavingScore] = useState(false);
  const [scoreSavedSuccess, setScoreSavedSuccess] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const usedWordIdsRef = useRef<Set<string>>(new Set());

  // Focus input
  useEffect(() => {
    if (!isTransitioning && !isGameFinished) {
      inputRef.current?.focus();
    }
  }, [isTransitioning, isGameFinished, currentStageIdx]);

  // Keep input focused when clicking canvas
  const handleCanvasClick = () => {
    inputRef.current?.focus();
  };

  // Spawn word logic
  const spawnWord = useCallback(() => {
    if (isTransitioning || isGameFinished) return;

    // Filter available words
    const stageWords = stageConfig.words;
    const available = stageWords.filter((w) => !usedWordIdsRef.current.has(w.id));
    const wordPool = available.length > 0 ? available : stageWords;

    const chosen = wordPool[Math.floor(Math.random() * wordPool.length)];
    usedWordIdsRef.current.add(chosen.id);

    // Random X between 8% and 78% so words don't clip offscreen
    const randomX = 8 + Math.random() * 70;

    const newFalling: FallingWord = {
      instanceId: `fw_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      item: chosen,
      x: randomX,
      y: 2, // starts at top
      speed: stageConfig.speed,
    };

    setFallingWords((prev) => [...prev, newFalling]);
  }, [stageConfig, isTransitioning, isGameFinished]);

  // Spawner interval
  useEffect(() => {
    if (isTransitioning || isGameFinished) return;

    // Initial spawn
    if (fallingWords.length === 0) {
      spawnWord();
    }

    const interval = setInterval(() => {
      // Max 4 words on screen simultaneously to keep it fun and manageable for 4th graders
      setFallingWords((prev) => {
        if (prev.length < 4) {
          spawnWord();
        }
        return prev;
      });
    }, stageConfig.spawnInterval);

    return () => clearInterval(interval);
  }, [stageConfig, isTransitioning, isGameFinished, spawnWord, fallingWords.length]);

  // Game physics loop (words falling)
  useEffect(() => {
    if (isTransitioning || isGameFinished) return;

    const tickInterval = 50; // 20 fps update for steady falling
    const timer = setInterval(() => {
      setFallingWords((prev) => {
        const nextWords: FallingWord[] = [];
        let lostLivesCount = 0;

        for (const fw of prev) {
          const nextY = fw.y + fw.speed;

          if (nextY >= 82) {
            // Reached bottom threshold!
            lostLivesCount++;
            sound.playHeartLost();
          } else {
            nextWords.push({ ...fw, y: nextY });
          }
        }

        if (lostLivesCount > 0) {
          setCombo(0); // reset combo
          setLives((l) => {
            const nextL = l - lostLivesCount;
            if (nextL <= 0) {
              handleGameOver(false);
              return 0;
            }
            return nextL;
          });
        }

        return nextWords;
      });
    }, tickInterval);

    return () => clearInterval(timer);
  }, [isTransitioning, isGameFinished]);

  // Stage clear trigger
  const handleStageClear = useCallback(() => {
    sound.playStageClear();
    setFallingWords([]);
    usedWordIdsRef.current.clear();

    if (currentStageIdx < 2) {
      // Advance to next stage (국어 -> 사회 or 사회 -> 과학)
      setIsTransitioning(true);
      setTransitionCountdown(3);
    } else {
      // Victory: Cleared all 3 stages!
      handleGameOver(true);
    }
  }, [currentStageIdx]);

  // Stage transition countdown
  useEffect(() => {
    if (!isTransitioning) return;

    if (transitionCountdown > 0) {
      const timer = setTimeout(() => {
        setTransitionCountdown((c) => c - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setIsTransitioning(false);
      setCurrentStageIdx((prev) => prev + 1);
      setStageClearedCount(0);
    }
  }, [isTransitioning, transitionCountdown]);

  // Game Over or Victory handler
  const handleGameOver = async (victory: boolean) => {
    setIsGameFinished(true);
    setIsVictory(victory);

    let finalCalculatedScore = score;
    if (victory) {
      // Add bonus for remaining lives
      const lifeBonus = lives * 200;
      finalCalculatedScore += lifeBonus;
      setScore(finalCalculatedScore);
      sound.playGameClear();

      // Confetti celebration
      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
    } else {
      sound.playHeartLost();
    }

    // Save to Firestore leaderboard!
    setIsSavingScore(true);
    try {
      await saveLeaderboardEntry(nickname, finalCalculatedScore, currentStageIdx + 1);
      setScoreSavedSuccess(true);
    } catch (err) {
      console.error('Failed to auto-save score to Firestore:', err);
    } finally {
      setIsSavingScore(false);
    }

    onGameOverOrClear(finalCalculatedScore, currentStageIdx + 1);
  };

  // Word submission logic
  const handleWordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isTransitioning || isGameFinished) return;

    const input = typedInput.trim();
    if (!input) return;

    // Find if input matches any falling word
    const matchedIndex = fallingWords.findIndex((fw) => fw.item.word === input);

    if (matchedIndex !== -1) {
      const target = fallingWords[matchedIndex];
      sound.playEraserWipe();

      // Calculate position on container in pixels
      const containerRect = containerRef.current?.getBoundingClientRect();
      const pixelX = containerRect ? (containerRect.width * target.x) / 100 : 200;
      const pixelY = containerRect ? (containerRect.height * target.y) / 100 : 200;

      // Score points: base 100 + combo bonus
      const currentCombo = combo + 1;
      setCombo(currentCombo);
      setMaxCombo((prev) => Math.max(prev, currentCombo));

      const comboBonus = Math.min(50, (currentCombo - 1) * 10);
      const pointsGained = 100 + comboBonus;
      setScore((s) => s + pointsGained);

      // Trigger eraser animation
      const eventId = `erase_${Date.now()}`;
      setErasedEvents((prev) => [
        ...prev,
        {
          id: eventId,
          word: target.item.word,
          meaning: target.item.meaning,
          pixelX,
          pixelY,
          score: pointsGained,
        },
      ]);

      // Trigger chalk dust
      setDustParticles((prev) => [...prev, { id: eventId, x: pixelX, y: pixelY }]);

      // Remove the matched word
      setFallingWords((prev) => prev.filter((_, idx) => idx !== matchedIndex));
      setTypedInput('');

      // Check if stage target reached
      const nextCleared = stageClearedCount + 1;
      setStageClearedCount(nextCleared);

      if (nextCleared >= stageConfig.targetCount) {
        handleStageClear();
      }
    } else {
      // Missed typing
      setTypedInput('');
    }
  };

  // Keyboard typing sound
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTypedInput(e.target.value);
    sound.playChalkType();
  };

  return (
    <div
      ref={containerRef}
      onClick={handleCanvasClick}
      className="relative flex-1 flex flex-col justify-between w-full h-[520px] sm:h-[560px] p-3 sm:p-4 cursor-text"
    >
      {/* Blackboard Top Stats Bar */}
      <div className="flex items-center justify-between z-20 pb-2 border-b border-white/10 font-jua">
        {/* Left: Stage & Subject Info */}
        <div className="flex items-center gap-2 sm:gap-3">
          <span className={`px-2.5 py-1 rounded-lg text-xs sm:text-sm font-bold border ${stageConfig.badgeBg} shadow-sm`}>
            {stageConfig.title}
          </span>
          <div className="flex items-center gap-1.5 text-xs text-emerald-200">
            <span>목표:</span>
            <span className="text-yellow-300 font-bold">
              {stageClearedCount}/{stageConfig.targetCount}
            </span>
            <span className="hidden sm:inline text-stone-300">단어</span>
          </div>
        </div>

        {/* Center: Lives (Hearts) */}
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Heart
              key={i}
              className={`w-5 h-5 sm:w-6 sm:h-6 transition-all ${
                i < lives
                  ? 'text-rose-400 fill-rose-500 drop-shadow-[0_0_6px_rgba(244,63,94,0.8)] scale-105'
                  : 'text-stone-600 fill-stone-800 opacity-40 scale-95'
              }`}
            />
          ))}
        </div>

        {/* Right: Score & Combo */}
        <div className="flex items-center gap-3">
          {combo > 1 && (
            <div className="hidden sm:flex items-center gap-1 text-xs text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-600/50 animate-pulse">
              <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
              <span>{combo} 연속!</span>
            </div>
          )}
          <div className="text-right">
            <span className="text-xs text-stone-300 mr-1.5">점수:</span>
            <span className="text-xl sm:text-2xl text-yellow-300 text-chalk-yellow">
              {score.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Falling Words Playing Field */}
      <div className="relative flex-1 w-full overflow-hidden my-1">
        {/* Subtle chalkboard grid guidelines */}
        <div className="absolute inset-0 border-b border-white/10 border-dashed pointer-events-none opacity-20" />

        {/* Falling Words */}
        {fallingWords.map((fw) => (
          <div
            key={fw.instanceId}
            className="absolute transition-all duration-75 select-none"
            style={{
              left: `${fw.x}%`,
              top: `${fw.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Chalk Word Box */}
            <div className="px-3.5 py-1.5 rounded-xl bg-black/30 border border-white/30 backdrop-blur-xs shadow-lg flex flex-col items-center">
              <span className={`text-2xl sm:text-3xl font-chalk font-bold ${stageConfig.colorClass} tracking-wide`}>
                {fw.item.word}
              </span>
            </div>
          </div>
        ))}

        {/* Chalkboard Eraser Animations */}
        {erasedEvents.map((evt) => (
          <EraserAnimation
            key={evt.id}
            x={evt.pixelX}
            y={evt.pixelY}
            wordText={evt.word}
            wordMeaning={evt.meaning}
            scoreGained={evt.score}
            onFinished={() => {
              setErasedEvents((prev) => prev.filter((e) => e.id !== evt.id));
            }}
          />
        ))}

        {/* Chalk Dust Particles */}
        {dustParticles.map((dp) => (
          <ChalkDustEffect
            key={dp.id}
            x={dp.x}
            y={dp.y}
            color={stageConfig.chalkStickColor}
            onComplete={() => {
              setDustParticles((prev) => prev.filter((p) => p.id !== dp.id));
            }}
          />
        ))}

        {/* Bottom Danger Baseline (Chalk line where hearts are lost) */}
        <div className="absolute bottom-[2%] left-0 right-0 h-0.5 border-b-2 border-rose-500/40 border-dashed flex justify-between items-center px-4">
          <span className="text-[10px] text-rose-400/80 font-chalk bg-stone-900/80 px-2 py-0.5 rounded border border-rose-800/40">
            ⚠️ 이 선에 닿으면 하트가 줄어들어요!
          </span>
          <span className="text-[10px] text-rose-400/80 font-chalk bg-stone-900/80 px-2 py-0.5 rounded border border-rose-800/40">
            ⚠️ 이 선에 닿으면 하트가 줄어들어요!
          </span>
        </div>
      </div>

      {/* Bottom Typing Input Field */}
      <form onSubmit={handleWordSubmit} className="relative z-30 pt-2">
        <div className="relative max-w-xl mx-auto flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={typedInput}
            onChange={handleInputChange}
            placeholder="단어를 타이핑하고 Enter 키를 누르세요!"
            className="w-full py-3 px-5 rounded-2xl bg-stone-900/90 border-2 border-emerald-500/80 focus:border-yellow-400 focus:outline-none text-xl sm:text-2xl font-jua text-white placeholder-stone-400 shadow-2xl text-center tracking-wider transition-all"
            disabled={isTransitioning || isGameFinished}
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
          />
          <button
            type="submit"
            className="absolute right-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-jua text-base rounded-xl transition-all shadow"
          >
            입력
          </button>
        </div>
        <div className="text-center text-xs text-stone-300 font-chalk mt-1.5">
          학생 닉네임: <span className="text-yellow-300 font-bold font-sans-kr">{nickname}</span> | 
          현재 과목: <span className="text-emerald-300 font-bold font-sans-kr">{stageConfig.subject}</span>
        </div>
      </form>

      {/* Stage Cleared Transition Modal */}
      {isTransitioning && (
        <div className="absolute inset-0 z-40 bg-stone-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center animate-fade-in font-jua">
          <div className="p-4 rounded-2xl bg-emerald-950/90 border-4 border-yellow-400 max-w-md w-full shadow-2xl space-y-3">
            <span className="text-4xl">🎉</span>
            <h2 className="text-2xl sm:text-3xl text-yellow-300 text-chalk-yellow">
              {stageConfig.title} 클리어!
            </h2>
            <p className="text-sm text-emerald-200 font-sans-kr">
              목표 어휘 {stageConfig.targetCount}개를 모두 멋지게 입력했습니다!
            </p>
            <div className="p-3 bg-stone-900/80 rounded-xl border border-stone-700 text-xs text-stone-300 font-sans-kr">
              다음 도전:&nbsp;
              <strong className="text-yellow-300 font-jua text-sm">
                {STAGE_CONFIGS[currentStageIdx + 1]?.title}
              </strong>
              <div className="text-[11px] text-stone-400 mt-1">
                {STAGE_CONFIGS[currentStageIdx + 1]?.subtitle}
              </div>
            </div>
            <div className="text-2xl text-white font-bold animate-pulse">
              {transitionCountdown}초 후 시작합니다...
            </div>
            <button
              onClick={() => {
                setIsTransitioning(false);
                setCurrentStageIdx((prev) => prev + 1);
                setStageClearedCount(0);
              }}
              className="px-5 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-stone-950 font-bold text-sm shadow hover:scale-105 active:scale-95 transition-all"
            >
              지금 바로 다음 단계 시작 ➔
            </button>
          </div>
        </div>
      )}

      {/* Game Finished Overlay (Clear or Game Over) */}
      {isGameFinished && (
        <div className="absolute inset-0 z-40 bg-stone-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center font-sans-kr">
          <div className="p-5 sm:p-7 rounded-2xl bg-stone-900/95 border-4 border-amber-600 max-w-lg w-full shadow-2xl space-y-4">
            <div className="text-5xl">
              {isVictory ? '🏆' : '✏️'}
            </div>

            <h2 className="text-2xl sm:text-3xl font-jua font-bold text-yellow-300 text-chalk-yellow">
              {isVictory ? '4학년 교과 어휘 완전 정복!' : '게임 종료! 수고했어요!'}
            </h2>

            <p className="text-sm text-stone-300 font-chalk text-base">
              {isVictory
                ? '국어, 사회, 과학 3개 과목의 필수 어휘를 모두 클리어했습니다!'
                : '아쉽게 하트가 모두 소진되었어요. 다시 연습해보세요!'}
            </p>

            {/* Score Summary Box */}
            <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-2 text-sm font-sans-kr">
              <div className="flex justify-between items-center text-stone-300">
                <span>학생 닉네임:</span>
                <span className="font-bold text-white font-jua text-base">{nickname}</span>
              </div>
              <div className="flex justify-between items-center text-stone-300">
                <span>달성한 최종 단계:</span>
                <span className="font-bold text-emerald-300 font-jua">
                  {currentStageIdx + 1}단계 ({stageConfig.subject})
                </span>
              </div>
              <div className="flex justify-between items-center text-stone-300">
                <span>최고 연속 콤보:</span>
                <span className="font-bold text-amber-300">{maxCombo} 콤보</span>
              </div>
              <div className="border-t border-stone-800 pt-2 flex justify-between items-center">
                <span className="text-stone-300 font-bold">최종 점수:</span>
                <span className="font-jua text-3xl text-yellow-300">
                  {score.toLocaleString()} 점
                </span>
              </div>
            </div>

            {/* Firestore Leaderboard Registration Status */}
            <div className="text-xs text-emerald-300 flex items-center justify-center gap-1.5 py-1">
              {isSavingScore ? (
                <span>학급 명예의 전당에 점수 기록 중...</span>
              ) : scoreSavedSuccess ? (
                <span className="flex items-center gap-1 font-bold text-emerald-400">
                  <Check className="w-4 h-4" />
                  학급 명예의 전당 순위표에 점수가 등록되었습니다!
                </span>
              ) : (
                <span className="text-stone-400">명예의 전당 저장 완료</span>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={onOpenLeaderboard}
                className="flex-1 py-2.5 rounded-xl bg-yellow-600 hover:bg-yellow-500 text-stone-950 font-jua font-bold text-base flex items-center justify-center gap-1.5 transition-all shadow"
              >
                <Trophy className="w-4 h-4" />
                <span>명예의 전당 확인</span>
              </button>
              <button
                onClick={onBackToLobby}
                className="flex-1 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-jua font-bold text-base flex items-center justify-center gap-1.5 transition-all shadow"
              >
                <RotateCcw className="w-4 h-4" />
                <span>처음으로 돌아가기</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
