import React from 'react';
import { WeatherType } from '../game/types';
import { WEATHER_CONFIGS } from '../game/constants';

interface HeaderProps {
  crtEnabled: boolean;
  onToggleCrt: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenGuide: () => void;
  onOpenEncounterLog: () => void;
  onOpenAchievements: () => void;
  onSave: () => void;
  onLoad: () => void;
  hasSaveFile: boolean;
  eggsCount: number;
  totalEggs: number;
  discoveredCreaturesCount: number;
  totalCreatures: number;
  unlockedAchievementsCount: number;
  totalAchievements: number;
  currentWeather: WeatherType;
  timerSeconds: number;
}

export const Header: React.FC<HeaderProps> = ({
  crtEnabled,
  onToggleCrt,
  isMuted,
  onToggleMute,
  onOpenGuide,
  onOpenEncounterLog,
  onOpenAchievements,
  onSave,
  onLoad,
  hasSaveFile,
  eggsCount,
  totalEggs,
  discoveredCreaturesCount,
  totalCreatures,
  unlockedAchievementsCount,
  totalAchievements,
  currentWeather,
  timerSeconds,
}) => {
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const weatherInfo = WEATHER_CONFIGS[currentWeather] || WEATHER_CONFIGS.CALM;

  return (
    <header className="w-full max-w-5xl flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 border-b border-[#122822] bg-[#030706]">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-2">
        <span className="text-sm sm:text-base md:text-lg font-mono font-bold tracking-wider text-[#75ffd6] drop-shadow-[0_0_8px_rgba(117,255,214,0.4)] whitespace-nowrap">
          螢光幽井 GLOW WELL
        </span>
      </div>

      {/* Zone 2: Informational live exploration metrics */}
      <div className="hidden lg:flex items-center gap-3.5 text-xs font-mono text-[#529482]">
        <div className="flex items-center gap-1.5">
          <span>彩蛋:</span>
          <span className="text-[#ff85eb] font-semibold tabular-nums">
            {eggsCount} / {totalEggs}
          </span>
        </div>
        <span aria-hidden="true" className="text-[#1a3830]">·</span>
        <div className="flex items-center gap-1.5">
          <span>生物:</span>
          <span className="text-[#55f2c2] font-semibold tabular-nums">
            {discoveredCreaturesCount} / {totalCreatures}
          </span>
        </div>
        <span aria-hidden="true" className="text-[#1a3830]">·</span>
        <div className="flex items-center gap-1.5">
          <span>成就:</span>
          <span className="text-[#ffd447] font-semibold tabular-nums">
            {unlockedAchievementsCount} / {totalAchievements}
          </span>
        </div>
        <span aria-hidden="true" className="text-[#1a3830]">·</span>
        <div className="flex items-center gap-1.5" title={weatherInfo.description}>
          <span>氣候:</span>
          <span className="text-[#96f2d5] font-semibold">
            {weatherInfo.name}
          </span>
        </div>
        <span aria-hidden="true" className="text-[#1a3830]">·</span>
        <div className="flex items-center gap-1.5">
          <span>用時:</span>
          <span className="text-[#96f2d5] font-semibold tabular-nums">
            {formatTime(timerSeconds)}
          </span>
        </div>
      </div>

      {/* Zone 3: Primary functional actions */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {/* Achievements Modal Button */}
        <button
          onClick={onOpenAchievements}
          type="button"
          className="px-2 sm:px-2.5 py-1 text-xs font-mono rounded border border-[#6b581e] bg-[#211b08] hover:bg-[#332b0f] text-[#ffd866] transition-colors whitespace-nowrap flex items-center gap-1 shadow-sm"
          title="查看解鎖成就"
        >
          <span>🏆</span>
          <span className="hidden sm:inline">成就</span>
          <span className="text-[10px] text-[#ffe680] font-bold">
            ({unlockedAchievementsCount}/{totalAchievements})
          </span>
        </button>

        {/* Encounter Log Button */}
        <button
          onClick={onOpenEncounterLog}
          type="button"
          className="px-2 sm:px-2.5 py-1 text-xs font-mono rounded border border-[#2b6d5b] bg-[#0d2a21] hover:bg-[#143a2e] text-[#86ffd8] transition-colors whitespace-nowrap flex items-center gap-1 shadow-sm"
          title="開啟幽井生物生態圖鑑 (Encounter Log)"
        >
          <span>📜</span>
          <span className="hidden sm:inline">圖鑑</span>
          <span className="text-[10px] text-[#52f8be] font-bold">
            ({discoveredCreaturesCount}/{totalCreatures})
          </span>
        </button>

        {/* Save & Load */}
        <button
          onClick={onSave}
          type="button"
          className="px-2 sm:px-2.5 py-1 text-xs font-mono rounded border border-[#1d4d3f] bg-[#091b15] hover:bg-[#123126] text-[#78fad2] transition-colors whitespace-nowrap flex items-center gap-1"
          title="儲存進度 (S)"
        >
          <span>💾</span>
          <span className="hidden md:inline">儲存</span>
        </button>

        <button
          onClick={onLoad}
          disabled={!hasSaveFile}
          type="button"
          className={`px-2 sm:px-2.5 py-1 text-xs font-mono rounded border transition-colors whitespace-nowrap flex items-center gap-1 ${
            hasSaveFile
              ? 'border-[#246250] bg-[#0c261e] hover:bg-[#153b2e] text-[#86ffd8]'
              : 'border-[#10231e] bg-[#040907] text-[#2d5248] cursor-not-allowed opacity-50'
          }`}
          title={hasSaveFile ? '讀取進度 (L)' : '無存檔'}
        >
          <span>📂</span>
          <span className="hidden md:inline">讀取</span>
        </button>

        {/* CRT Toggle */}
        <button
          onClick={onToggleCrt}
          type="button"
          className={`px-1.5 sm:px-2 py-1 text-xs font-mono rounded border transition-colors ${
            crtEnabled
              ? 'bg-[#0f2a22] border-[#296856] text-[#63fed0]'
              : 'bg-[#071310] border-[#16362e] text-[#427a6c] hover:text-[#7ce5cb]'
          }`}
          title="切換 CRT 復古濾鏡"
        >
          CRT
        </button>

        {/* Sound Toggle */}
        <button
          onClick={onToggleMute}
          type="button"
          className="p-1 px-1.5 text-xs font-mono rounded border border-[#16362e] bg-[#071310] hover:bg-[#0d221c] text-[#6fe3c5] transition-colors"
          title={isMuted ? '開啟音效' : '靜音'}
          aria-label={isMuted ? '開啟音效' : '靜音'}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>

        {/* Guide */}
        <button
          onClick={onOpenGuide}
          type="button"
          className="px-2 sm:px-2.5 py-1 text-xs font-mono rounded border border-[#23584a] bg-[#0b241d] hover:bg-[#12362c] text-[#86ffd8] transition-colors shadow-sm"
        >
          說明
        </button>
      </div>
    </header>
  );
};
