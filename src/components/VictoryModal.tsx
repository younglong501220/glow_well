import React from 'react';

interface VictoryModalProps {
  isOpen: boolean;
  timeSeconds: number;
  onRestart: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  timeSeconds,
  onRestart,
}) => {
  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const getRank = (secs: number) => {
    if (secs < 45) return { title: '幽谷神行者 (Speedrun Master)', color: 'text-amber-300' };
    if (secs < 90) return { title: '泡泡探險家 (Bubble Explorer)', color: 'text-emerald-300' };
    return { title: '幽井朝聖者 (Well Wanderer)', color: 'text-teal-300' };
  };

  const rank = getRank(timeSeconds);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
      <div className="relative max-w-md w-full bg-[#081310] border border-[#2d6e5a] rounded-xl p-6 text-center shadow-[0_0_50px_rgba(78,240,184,0.25)] text-[#c5f5e7]">
        {/* Glow halo */}
        <div className="mx-auto w-16 h-16 rounded-full bg-[#0e3127] border border-[#4be8b4] flex items-center justify-center mb-4 shadow-[0_0_20px_#4be8b4]">
          <span className="text-3xl">🪺</span>
        </div>

        <h2 className="text-xl font-bold font-mono tracking-wider text-[#79ffd7] mb-1">
          封印解除 · 幽谷通關！
        </h2>
        <p className="text-xs text-[#529c87] mb-6">
          你蒐集齊全了 3 顆神秘彩蛋，遠古之泉的禁錮已化為點點螢光消散。
        </p>

        <div className="bg-[#050c0a] border border-[#183d33] rounded-lg p-4 mb-6 space-y-2 text-xs font-mono">
          <div className="flex justify-between items-center text-[#7cb8a7]">
            <span>探索用時 (Time)</span>
            <span className="text-[#9effdf] font-bold text-sm tabular-nums">
              {formatTime(timeSeconds)}
            </span>
          </div>
          <div className="flex justify-between items-center text-[#7cb8a7]">
            <span>蒐集彩蛋 (Eggs)</span>
            <span className="text-[#ff80ea] font-bold">3 / 3 (100%)</span>
          </div>
          <div className="flex justify-between items-center text-[#7cb8a7]">
            <span>探險評價 (Rank)</span>
            <span className={`font-semibold ${rank.color}`}>{rank.title}</span>
          </div>
        </div>

        <button
          onClick={onRestart}
          type="button"
          className="w-full py-2.5 px-5 bg-[#174e40] hover:bg-[#1f6654] active:bg-[#123e33] border border-[#3de8b2] text-[#d6ffef] font-mono text-sm font-semibold rounded-lg transition-colors shadow-[0_0_15px_rgba(61,232,178,0.2)]"
        >
          重新啟程 (Play Again)
        </button>
      </div>
    </div>
  );
};
