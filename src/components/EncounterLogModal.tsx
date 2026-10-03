import React, { useState } from 'react';
import { WELL_CREATURES } from '../game/constants';

interface EncounterLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  discoveredCreatures: string[];
}

export const EncounterLogModal: React.FC<EncounterLogModalProps> = ({
  isOpen,
  onClose,
  discoveredCreatures,
}) => {
  const [selectedCreatureId, setSelectedCreatureId] = useState<string>(
    WELL_CREATURES[0].id
  );

  if (!isOpen) return null;

  const totalCount = WELL_CREATURES.length;
  const discoveredCount = discoveredCreatures.length;
  const activeCreature =
    WELL_CREATURES.find((c) => c.id === selectedCreatureId) || WELL_CREATURES[0];
  const isSelectedDiscovered = discoveredCreatures.includes(activeCreature.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
      <div className="relative max-w-2xl w-full bg-[#06120e] border border-[#235848] rounded-xl p-4 sm:p-6 text-[#c7f5e8] shadow-[0_0_50px_rgba(35,88,72,0.4)] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#183c31]">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📜</span>
            <div>
              <h3 className="font-mono font-bold text-base sm:text-lg text-[#7cffd9] tracking-wide">
                幽井生態圖鑑 · ENCOUNTER LOG
              </h3>
              <p className="text-xs text-[#529e8a]">
                記錄徘徊在地底微光深處的神秘生物
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs font-mono text-[#529e8a]">
              登錄進度:{' '}
              <span className="text-[#6affd0] font-bold">
                {discoveredCount}
              </span>{' '}
              / {totalCount}
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

        {/* Content Body: Sidebar list + Detail Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 overflow-y-auto flex-1 pr-1">
          {/* Creatures List */}
          <div className="md:col-span-1 space-y-2">
            <div className="text-[11px] font-mono text-[#518b7c] uppercase tracking-wider mb-1">
              生物名冊
            </div>
            {WELL_CREATURES.map((creature) => {
              const isDiscovered = discoveredCreatures.includes(creature.id);
              const isSelected = selectedCreatureId === creature.id;

              return (
                <button
                  key={creature.id}
                  onClick={() => setSelectedCreatureId(creature.id)}
                  type="button"
                  className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-center gap-2.5 ${
                    isSelected
                      ? 'border-[#55f2c2] bg-[#0d2a21] shadow-[inset_0_0_10px_rgba(85,242,194,0.15)] ring-1 ring-[#55f2c2]/40'
                      : 'border-[#143229] bg-[#071612] hover:bg-[#0c221b] text-[#71ab9c]'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-md flex items-center justify-center text-base border ${
                      isDiscovered
                        ? 'border-[#2d6e5a] bg-[#0c2e24] shadow-[0_0_8px_rgba(85,242,194,0.2)]'
                        : 'border-[#122b23] bg-[#050e0c] opacity-50'
                    }`}
                  >
                    {isDiscovered ? creature.avatar : '❓'}
                  </div>

                  <div className="truncate flex-1">
                    <div className="font-mono text-xs font-semibold truncate text-[#c4f5e7]">
                      {isDiscovered ? creature.name : '??? 未知生物'}
                    </div>
                    <div className="text-[10px] text-[#4d8576] truncate font-mono">
                      {isDiscovered ? creature.englishName : '尚未目擊'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Creature Detail Card */}
          <div className="md:col-span-2 bg-[#040d0a] border border-[#173e33] rounded-lg p-4 flex flex-col justify-between">
            {isSelectedDiscovered ? (
              <div className="space-y-3.5 animate-fade-in">
                {/* Creature Hero Lockup */}
                <div className="flex items-center gap-3.5 pb-3 border-b border-[#14342a]">
                  <div
                    className="w-14 h-14 rounded-lg border flex items-center justify-center text-3xl shadow-lg relative"
                    style={{
                      borderColor: activeCreature.glowColor,
                      backgroundColor: '#071f18',
                      boxShadow: `0 0 16px ${activeCreature.glowColor}40`,
                    }}
                  >
                    <span>{activeCreature.avatar}</span>
                  </div>
                  <div>
                    <h4 className="text-base font-bold font-mono text-[#82ffd9]">
                      {activeCreature.name}
                    </h4>
                    <p className="text-xs text-[#5aa894] font-mono">
                      {activeCreature.englishName}
                    </p>
                    <div className="text-[11px] text-[#478474] font-mono mt-0.5">
                      目擊棲所: <span className="text-[#a5fadc]">{activeCreature.habitat}</span>
                    </div>
                  </div>
                </div>

                {/* Ecological Behavior */}
                <div>
                  <div className="text-[11px] font-mono text-[#589c89] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#46e8b4]" />
                    生態習性觀察
                  </div>
                  <p className="text-xs font-mono text-[#91d1c1] leading-relaxed bg-[#061611] p-2.5 rounded border border-[#123126]">
                    {activeCreature.behaviorDesc}
                  </p>
                </div>

                {/* Subterranean Lore */}
                <div>
                  <div className="text-[11px] font-mono text-[#589c89] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ff7fe9]" />
                    幽谷古籍誌異 (Lore)
                  </div>
                  <p className="text-xs font-mono text-[#a3e2d3] leading-relaxed italic bg-[#061611] p-2.5 rounded border border-[#123126]">
                    「{activeCreature.lore}」
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-16 h-16 rounded-full border border-[#1b3e34] bg-[#071612] flex items-center justify-center text-2xl text-[#396e60] shadow-inner">
                  <span>❔</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold font-mono text-[#4b8a7a]">
                    此生物尚未被目擊登錄
                  </h4>
                  <p className="text-xs text-[#3a685c] mt-1 max-w-xs font-mono leading-relaxed">
                    在幽井的深處各房間探索，走近神秘動靜或對其吹出微光泡泡，即可登錄其生態誌異。
                  </p>
                </div>
                <div className="text-[11px] font-mono text-[#458071] bg-[#071a14] px-3 py-2 rounded border border-[#13382c] space-y-1 text-left w-full max-w-sm">
                  <div>
                    傳聞棲所: <span className="text-[#65ffd8] font-bold">{activeCreature.habitat}</span>
                  </div>
                  <div className="text-[#3ed4a5] text-[10.5px]">
                    💡 收集方法：走上前靠近牠（跳上所在石島），或按 <kbd className="px-1 py-0.2 bg-[#09221a] border border-[#1e5847] rounded">J / Z</kbd> 吹出泡泡飄向牠即可收錄！
                  </div>
                </div>
              </div>
            )}

            <div className="pt-3 mt-3 border-t border-[#133229] flex items-center justify-between text-[11px] text-[#4d8576] font-mono">
              <span>靠近生物時將會引發微光共鳴</span>
              <span>全部登錄解鎖幽谷全貌</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-[#16382e] flex justify-end">
          <button
            onClick={onClose}
            type="button"
            className="py-1.5 px-4 bg-[#143e33] hover:bg-[#1c5546] border border-[#2b7964] text-[#a4ffe1] font-mono text-xs font-semibold rounded transition-colors"
          >
            返回幽井
          </button>
        </div>
      </div>
    </div>
  );
};
