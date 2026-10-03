/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useRef } from 'react';
import { GlowWellGame, GlowWellGameHandle } from './components/GlowWellGame';
import { Header } from './components/Header';
import { Minimap } from './components/Minimap';
import { GuideModal } from './components/GuideModal';
import { VictoryModal } from './components/VictoryModal';
import { EncounterLogModal } from './components/EncounterLogModal';
import {
  AchievementSystem,
  AchievementToastData,
} from './components/AchievementSystem';
import { AudioEngine } from './game/audio';
import { SaveManager } from './game/saveManager';
import { WeatherType } from './game/types';
import { WEATHER_CONFIGS, ACHIEVEMENT_DEFINITIONS } from './game/constants';

export default function App() {
  const gameRef = useRef<GlowWellGameHandle | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const [crtEnabled, setCrtEnabled] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isEncounterLogOpen, setIsEncounterLogOpen] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [activeAchievementToast, setActiveAchievementToast] =
    useState<AchievementToastData | null>(null);
  const [isWinModalOpen, setIsWinModalOpen] = useState(false);
  const [winTime, setWinTime] = useState(0);
  const [hasSaveFile, setHasSaveFile] = useState<boolean>(SaveManager.hasSave());

  // Live game telemetry
  const [stats, setStats] = useState({
    eggs: 0,
    totalEggs: 3,
    roomKey: '0,1',
    roomName: '幽微泉池 (Glow Springs)',
    switchPressed: false,
    pressurePlatformActive: false,
    visitedRooms: ['0,1'],
    discoveredCreatures: [] as string[],
    totalCreatures: 4,
    unlockedAchievements: [] as string[],
    totalAchievements: Object.keys(ACHIEVEMENT_DEFINITIONS).length,
    currentWeather: 'CALM' as WeatherType,
    isCompleted: false,
    timerSeconds: 0,
    hasSaveFile: SaveManager.hasSave(),
  });

  const [gameKey, setGameKey] = useState(0);

  const handleStatsUpdate = useCallback((newStats: typeof stats) => {
    setStats(newStats);
    setHasSaveFile(newStats.hasSaveFile);
  }, []);

  const handleWinTriggered = useCallback((elapsedTime: number) => {
    setWinTime(elapsedTime);
    setIsWinModalOpen(true);
  }, []);

  const handleAchievementUnlocked = useCallback(
    (achievement: {
      id: string;
      title: string;
      description: string;
      icon: string;
    }) => {
      setActiveAchievementToast(achievement);
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
      }
      toastTimeoutRef.current = window.setTimeout(() => {
        setActiveAchievementToast(null);
      }, 4500);
    },
    []
  );

  const handleToggleCrt = () => {
    setCrtEnabled((prev) => !prev);
  };

  const handleToggleMute = () => {
    const muted = AudioEngine.toggleMute();
    setIsMuted(muted);
  };

  const handleSave = () => {
    if (gameRef.current) {
      gameRef.current.saveGame();
      setHasSaveFile(true);
    }
  };

  const handleLoad = () => {
    if (gameRef.current) {
      gameRef.current.loadGame();
    }
  };

  const handleRestart = () => {
    setIsWinModalOpen(false);
    if (gameRef.current) {
      gameRef.current.resetGame();
    } else {
      setGameKey((prev) => prev + 1);
    }
  };

  const weather = WEATHER_CONFIGS[stats.currentWeather] || WEATHER_CONFIGS.CALM;

  return (
    <div className="min-h-screen bg-[#020508] text-[#9ee6d2] font-mono flex flex-col items-center selection:bg-[#1a4e40] selection:text-[#5cffd2]">
      {/* Universal Top Bar Contract */}
      <Header
        crtEnabled={crtEnabled}
        onToggleCrt={handleToggleCrt}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenEncounterLog={() => setIsEncounterLogOpen(true)}
        onOpenAchievements={() => setIsAchievementsOpen(true)}
        onSave={handleSave}
        onLoad={handleLoad}
        hasSaveFile={hasSaveFile}
        eggsCount={stats.eggs}
        totalEggs={stats.totalEggs}
        discoveredCreaturesCount={stats.discoveredCreatures.length}
        totalCreatures={stats.totalCreatures}
        unlockedAchievementsCount={stats.unlockedAchievements.length}
        totalAchievements={stats.totalAchievements}
        currentWeather={stats.currentWeather}
        timerSeconds={stats.timerSeconds}
      />

      {/* Main Container */}
      <main className="w-full max-w-5xl px-3 sm:px-6 py-3 sm:py-5 flex flex-col items-center gap-5">
        {/* Active Game Stage */}
        <div className="w-full flex flex-col items-center">
          <GlowWellGame
            ref={gameRef}
            key={gameKey}
            crtEnabled={crtEnabled}
            onStatsUpdate={handleStatsUpdate}
            onWinTriggered={handleWinTriggered}
            onAchievementUnlocked={handleAchievementUnlocked}
          />
        </div>

        {/* Sub-stage Panel: Controls hint & Minimap */}
        <div className="w-full max-w-[860px] grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          {/* Controls & Ecological Weather Callout */}
          <div className="md:col-span-2 bg-[#050b09] border border-[#142d26] rounded-lg p-3.5 text-xs space-y-3 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-[#132822]">
              <span className="font-bold text-[#62fad0] flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-[#5cffd2] shadow-[0_0_8px_#5cffd2]" />
                生態環境與探索技巧
              </span>
              <div className="flex items-center gap-2.5 text-[11px]">
                <button
                  onClick={() => setIsAchievementsOpen(true)}
                  className="text-[#ffd866] hover:underline flex items-center gap-1"
                  title="開啟幽井成就一覽"
                >
                  <span>🏆</span>
                  <span>
                    成就 ({stats.unlockedAchievements.length}/
                    {stats.totalAchievements})
                  </span>
                </button>
                <button
                  onClick={() => setIsEncounterLogOpen(true)}
                  className="text-[#65f5cb] hover:underline flex items-center gap-1"
                  title="開啟生物生態圖鑑"
                >
                  <span>📜</span>
                  <span>
                    圖鑑 ({stats.discoveredCreatures.length}/
                    {stats.totalCreatures})
                  </span>
                </button>
                <button
                  onClick={handleSave}
                  className="text-[#59f5c4] hover:underline"
                  title="儲存進度"
                >
                  [存檔 S]
                </button>
                <button
                  onClick={handleLoad}
                  disabled={!hasSaveFile}
                  className={`${hasSaveFile ? 'text-[#59f5c4] hover:underline' : 'text-[#2a5448] cursor-not-allowed'}`}
                  title="讀取進度"
                >
                  [讀檔 L]
                </button>
                <button
                  onClick={handleRestart}
                  className="text-[#4d8f7e] hover:text-[#7ee8ce] hover:underline transition-colors"
                  title="重置關卡"
                >
                  [重置 R]
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[#79b4a4]">
              <div className="bg-[#081512] p-2 rounded border border-[#122e26]">
                <div className="text-[10px] text-[#4d7d70] mb-0.5">移動 / 推石</div>
                <div className="text-[#aaffdf] font-semibold text-[11px]">
                  <kbd className="px-1 py-0.2 bg-[#0e241e] border border-[#1d4d40] rounded">
                    A
                  </kbd>{' '}
                  <kbd className="px-1 py-0.2 bg-[#0e241e] border border-[#1d4d40] rounded">
                    D
                  </kbd>{' '}
                  / 方向鍵
                </div>
              </div>

              <div className="bg-[#081512] p-2 rounded border border-[#122e26]">
                <div className="text-[10px] text-[#4d7d70] mb-0.5">起跳 / 彈跳</div>
                <div className="text-[#aaffdf] font-semibold text-[11px]">
                  <kbd className="px-1 py-0.2 bg-[#0e241e] border border-[#1d4d40] rounded">
                    W
                  </kbd>{' '}
                  / 空白鍵
                </div>
              </div>

              <div className="bg-[#081512] p-2 rounded border border-[#122e26]">
                <div className="text-[10px] text-[#4d7d70] mb-0.5">泡泡杖法寶</div>
                <div className="text-[#aaffdf] font-semibold text-[11px]">
                  <kbd className="px-1 py-0.2 bg-[#0e241e] border border-[#1d4d40] rounded">
                    J
                  </kbd>{' '}
                  或{' '}
                  <kbd className="px-1 py-0.2 bg-[#0e241e] border border-[#1d4d40] rounded">
                    Z
                  </kbd>
                </div>
              </div>

              <div className="bg-[#081512] p-2 rounded border border-[#122e26]">
                <div className="text-[10px] text-[#4d7d70] mb-0.5">當前地下氣候</div>
                <div className="text-[#ffd447] font-semibold text-[11px] truncate">
                  {weather.name}
                </div>
              </div>
            </div>

            <div className="text-[11px] text-[#4e8d7c] leading-relaxed space-y-1">
              <p>
                🔊{' '}
                <strong className="text-[#84fada]">
                  細緻材質與水域音效（Ambient Textures）
                </strong>
                ：移動經過岩石時發出細微摩擦聲，涉水或跳入泉池時激起清脆漣漪與水花，音量自適應當前場景深邃度。
              </p>
              <p>
                🏆{' '}
                <strong className="text-[#ffd447]">
                  隱藏謎題與成就系統（Achievement System）
                </strong>
                ：包含二段跳、擊碎石壁、重石壓踏、生物目擊、通關解封等 10 項專屬成就，達成時即時淡入通知並永久保存。
              </p>
            </div>
          </div>

          {/* Minimap Widget */}
          <div className="md:col-span-1">
            <Minimap
              currentRoomKey={stats.roomKey}
              visitedRooms={stats.visitedRooms}
              eggsCount={stats.eggs}
              totalEggs={stats.totalEggs}
              switchPressed={stats.switchPressed}
              pressurePlatformActive={stats.pressurePlatformActive}
            />
          </div>
        </div>
      </main>

      {/* Guide Modal */}
      <GuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

      {/* Encounter Log Modal */}
      <EncounterLogModal
        isOpen={isEncounterLogOpen}
        onClose={() => setIsEncounterLogOpen(false)}
        discoveredCreatures={stats.discoveredCreatures}
      />

      {/* Achievement System Notification Toast & Modal */}
      <AchievementSystem
        unlockedIds={stats.unlockedAchievements}
        activeToast={activeAchievementToast}
        isOpen={isAchievementsOpen}
        onClose={() => setIsAchievementsOpen(false)}
      />

      {/* Victory Summary Modal */}
      <VictoryModal
        isOpen={isWinModalOpen}
        timeSeconds={winTime}
        onRestart={handleRestart}
      />
    </div>
  );
}
