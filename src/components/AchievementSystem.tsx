import React from 'react';
import { ACHIEVEMENT_DEFINITIONS } from '../game/constants';

export interface AchievementToastData {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface AchievementSystemProps {
  unlockedIds: string[];
  activeToast: AchievementToastData | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AchievementSystem: React.FC<AchievementSystemProps> = ({
  unlockedIds,
  activeToast,
  isOpen,
  onClose,
}) => {
  const allAchievements = Object.values(ACHIEVEMENT_DEFINITIONS);
  const totalCount = allAchievements.length;
  const unlockedCount = unlockedIds.length;
  const progressPercent = Math.round((unlockedCount / totalCount) * 100);

  return (
    <>
      {/* Toast Notification with Smooth Fade-in & Glow */}
      {activeToast && (
        <div className="fixed top-14 sm:top-16 right-4 sm:right-8 z-50 pointer-events-none animate-slide-in">
          <div className="flex items-center gap-3 bg-[#071712] border-2 border-[#ffe066] shadow-[0_0_30px_rgba(255,224,102,0.35),0_10px_25px_rgba(0,0,0,0.9)] rounded-lg p-3 sm:p-3.5 max-w-sm text-[#e6fbf4] backdrop-blur-md">
            <div className="w-11 h-11 rounded-md bg-[#132c23] border border-[#ffe066] flex items-center justify-center text-2xl shrink-0 shadow-inner">
              <span>{activeToast.icon}</span>
            </div>
            <div className="truncate">
              <div className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#ffd752] flex items-center gap-1.5">
                <span>✦</span>
                <span>成就達成 · ACHIEVEMENT UNLOCKED</span>
              </div>
              <div className="text-sm font-bold font-mono text-[#79ffd7] truncate">
                {activeToast.title}
              </div>
              <div className="text-[11px] text-[#86c5b4] font-mono truncate">
                {activeToast.description}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Achievement Overview Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="relative max-w-2xl w-full bg-[#06120e] border border-[#2b6d5b] rounded-xl p-4 sm:p-6 text-[#c7f5e8] shadow-[0_0_50px_rgba(43,109,91,0.4)] flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#183c31]">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🏆</span>
                <div>
                  <h3 className="font-mono font-bold text-base sm:text-lg text-[#7cffd9] tracking-wide">
                    幽井成就一覽 · ACHIEVEMENTS
                  </h3>
                  <p className="text-xs text-[#529e8a]">
                    記錄你在微光幽井中解開的隱藏謎題與冒險壯舉
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-xs font-mono text-[#529e8a]">
                  進度:{' '}
                  <span className="text-[#ffd447] font-bold">
                    {unlockedCount}
                  </span>{' '}
                  / {totalCount} ({progressPercent}%)
                </div>
                <button
                  onClick={onClose}
                  type="button"
                  className="text-xs font-mono text-[#509181] hover:text-[#9effdf] p-1 transition-colors"
                >
                  [關閉 ESC]
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-[#0a2019] h-2 rounded-full overflow-hidden mb-4 border border-[#163a2f]">
              <div
                className="bg-gradient-to-r from-[#38e8ac] to-[#ffd447] h-full transition-all duration-500 shadow-[0_0_10px_#ffd447]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Achievements Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto flex-1 pr-1">
              {allAchievements.map((item) => {
                const isUnlocked = unlockedIds.includes(item.id);

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-lg border transition-all flex items-start gap-3 ${
                      isUnlocked
                        ? 'border-[#ffe066]/70 bg-[#0d2a20] shadow-[0_0_12px_rgba(255,224,102,0.12)]'
                        : 'border-[#122820] bg-[#050c09] opacity-60'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-md flex items-center justify-center text-xl shrink-0 border ${
                        isUnlocked
                          ? 'border-[#ffe066] bg-[#1a4032] shadow-[0_0_10px_rgba(255,224,102,0.3)]'
                          : 'border-[#13261f] bg-[#07130e] grayscale'
                      }`}
                    >
                      {item.icon}
                    </div>

                    <div className="flex-1 truncate">
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-mono text-xs font-bold truncate ${
                            isUnlocked ? 'text-[#ffea75]' : 'text-[#58897c]'
                          }`}
                        >
                          {item.title}
                        </span>
                        <span
                          className={`text-[9px] font-mono px-1 rounded ${
                            isUnlocked
                              ? 'text-[#5cffd2] bg-[#12362b]'
                              : 'text-[#385e54] bg-[#091511]'
                          }`}
                        >
                          {isUnlocked ? '已達成' : '未解鎖'}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-[#85bfaf] mt-0.5 leading-snug">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-[#16382e] flex items-center justify-between text-xs font-mono text-[#4b8474]">
              <span>完成探索與環境謎題以點亮全數成就勳章</span>
              <button
                onClick={onClose}
                type="button"
                className="py-1.5 px-4 bg-[#143e33] hover:bg-[#1c5546] border border-[#2b7964] text-[#a4ffe1] font-semibold rounded transition-colors"
              >
                確定
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
