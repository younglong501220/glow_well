import React from 'react';

interface MinimapProps {
  currentRoomKey: string;
  visitedRooms: string[];
  eggsCount: number;
  totalEggs: number;
  switchPressed: boolean;
  pressurePlatformActive: boolean;
}

export const Minimap: React.FC<MinimapProps> = ({
  currentRoomKey,
  visitedRooms,
  eggsCount,
  totalEggs,
  switchPressed,
  pressurePlatformActive,
}) => {
  // 2x2 room matrix
  const rooms = [
    [
      { key: '0,0', label: '遠古祭壇', hint: '神秘石像' },
      { key: '1,0', label: '機關深閘', hint: '紅色結界' },
    ],
    [
      { key: '0,1', label: '幽微泉池', hint: '起始之泉' },
      { key: '1,1', label: '深淵幽徑', hint: '重力石臺' },
    ],
  ];

  return (
    <div className="bg-[#060c0a] border border-[#16362e] rounded-lg p-3 text-xs font-mono text-[#7bb8a8]">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#16362e]">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-[#38e8ac] shadow-[0_0_6px_#38e8ac]" />
          <span className="font-semibold text-[#b8f5e3]">幽井地圖 (2×2 ROOMS)</span>
        </div>
        <div className="text-[11px] text-[#5aa894]">
          彩蛋: <span className="text-[#ff85eb] font-bold">{eggsCount}</span> / {totalEggs}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 my-1">
        {rooms.map((row, rIdx) =>
          row.map((room) => {
            const isVisited = visitedRooms.includes(room.key);
            const isCurrent = currentRoomKey === room.key;

            return (
              <div
                key={room.key}
                className={`p-2 rounded border transition-all duration-200 relative flex flex-col justify-between h-16 ${
                  isCurrent
                    ? 'border-[#4ef0b8] bg-[#0c241e] shadow-[inset_0_0_10px_rgba(78,240,184,0.15)] ring-1 ring-[#4ef0b8]/40'
                    : isVisited
                    ? 'border-[#1b443a] bg-[#091714] text-[#69a595]'
                    : 'border-[#102420] bg-[#040807] text-[#284840] opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] tracking-widest uppercase">
                    {room.key}
                  </span>
                  {isCurrent && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5cffd2] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#5cffd2]" />
                    </span>
                  )}
                </div>

                <div className="truncate font-sans font-medium text-[11px] text-[#9de8d4]">
                  {isVisited ? room.label : '??? 未探索'}
                </div>

                <div className="text-[9px] flex items-center justify-between text-[#4e8e7e]">
                  <span>{isVisited ? room.hint : '...'}</span>
                  {room.key === '1,0' && isVisited && (
                    <span className={switchPressed ? 'text-[#5cffd2]' : 'text-[#ff4066]'}>
                      {switchPressed ? '閘門解除' : '閘門閉鎖'}
                    </span>
                  )}
                  {room.key === '1,1' && isVisited && (
                    <span className={pressurePlatformActive ? 'text-[#5cffd2]' : 'text-[#ffd447]'}>
                      {pressurePlatformActive ? '石柱沉降' : '石柱封閉'}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="pt-2 mt-2 border-t border-[#122e27] text-[10px] text-[#4d7d70] flex items-center justify-between">
        <span>● 當前位置: [{currentRoomKey}]</span>
        <span>按 [J/Z] 吹出泡泡並踩踏彈跳</span>
      </div>
    </div>
  );
};
