import React from 'react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
      <div className="relative max-w-xl w-full bg-[#06120e] border border-[#215747] rounded-xl p-4 sm:p-5 text-[#c4f0e4] shadow-[0_0_50px_rgba(33,87,71,0.5)] max-h-[88vh] flex flex-col">
        {/* Fixed Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#183d33] shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">🫧</span>
            <div>
              <h3 className="font-mono font-bold text-base text-[#7cffd9] tracking-wide">
                《螢光幽井》探索與解謎全手冊
              </h3>
              <p className="text-[11px] text-[#559b89]">
                操作、生靈收集、道具技巧與環境機關指引
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-xs font-mono text-[#549786] hover:text-[#9effdf] p-1 transition-colors"
          >
            [關閉 ESC]
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="space-y-4 text-xs font-mono leading-relaxed text-[#7db5a6] overflow-y-auto flex-1 pr-2">
          {/* Key Highlight: How to collect the Frog & Creatures */}
          <div className="bg-[#09221a] border-2 border-[#38e8ac]/80 rounded-lg p-3 text-[#d2fcee] shadow-[0_0_15px_rgba(56,232,172,0.18)]">
            <h4 className="font-bold text-[#5cffd2] text-sm mb-1.5 flex items-center gap-2">
              <span className="text-base">🐸</span>
              <span>青蛙（螢光仙蟾）要怎麼收集？</span>
            </h4>
            <div className="space-y-2 text-[11px] leading-relaxed text-[#9fe6d4]">
              <p>
                <strong className="text-[#ffe066]">1. 位置：</strong>
                青蛙就在冒險的<span className="text-[#ffe066]">起始房間 [0,1] 幽微泉池</span>！從起點電話亭往右走，越過清冽水潭，中央有一座微光小石島，青蛙正靜靜坐在石島上，喉囊伴隨呼吸微光鼓動。
              </p>
              <p>
                <strong className="text-[#ffe066]">2. 收集與互動方式（兩種方式皆可）：</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 pl-1 text-[#b5fae7]">
                <li>
                  <strong className="text-[#ffffff]">直接走上前靠近：</strong>
                  跳上中央石島，走近青蛙身邊（約 50 像素內）。
                </li>
                <li>
                  <strong className="text-[#ffffff]">吹泡泡親暱互動：</strong>
                  按下 <kbd className="px-1 py-0.5 bg-[#0f3126] border border-[#2d7962] rounded text-[#7effd8]">J</kbd> 或 <kbd className="px-1 py-0.5 bg-[#0f3126] border border-[#2d7962] rounded text-[#7effd8]">Z</kbd> 對著青蛙吹出一個泡泡，泡泡飄向牠時即可收錄！
                </li>
              </ul>
              <p className="bg-[#061812] p-2 rounded border border-[#1b4b3c] text-[10.5px] text-[#71cfb9]">
                💡 <strong>提示：</strong>
                收集生靈不同於拾取彩蛋，生靈是幽谷中的活體夥伴，收錄後牠們會留在井底陪伴你，並永久登錄至頂部導覽列的
                <strong className="text-[#7effd8]">【📜 生態圖鑑】</strong>中，同時點亮成就勳章！
              </p>
            </div>
          </div>

          {/* Controls */}
          <div>
            <h4 className="font-bold text-[#a6ffe2] mb-1.5 flex items-center gap-1.5">
              <span>●</span> 鍵盤與觸控操作
            </h4>
            <div className="grid grid-cols-2 gap-2 bg-[#040908] p-3 rounded border border-[#14332b]">
              <div>
                <span className="text-[#9fffdc]">A / D</span> 或 <span className="text-[#9fffdc]">← / →</span> : 左右移動 / 推動石塊
              </div>
              <div>
                <span className="text-[#9fffdc]">W / Space</span> 或 <span className="text-[#9fffdc]">↑</span> : 輕靈起跳
              </div>
              <div>
                <span className="text-[#9fffdc]">J / Z / K</span> : 吹出魔法泡泡
              </div>
              <div>
                <span className="text-[#9fffdc]">S 鍵</span> : 隨時儲存進度
              </div>
              <div>
                <span className="text-[#9fffdc]">L 鍵</span> : 快速讀取進度
              </div>
              <div>
                <span className="text-[#9fffdc]">R 鍵</span> : 重置幽井狀態
              </div>
            </div>
          </div>

          {/* Bubble tech */}
          <div>
            <h4 className="font-bold text-[#a6ffe2] mb-1.5 flex items-center gap-1.5">
              <span>●</span> 《動物井》核心機制：踩泡泡二段跳 (Bubble Tech)
            </h4>
            <div className="bg-[#040908] p-3 rounded border border-[#14332b] space-y-1.5 text-[11px]">
              <p>
                跳躍至空中最高點時，按下 <span className="text-[#59f5c4]">J 或 Z</span> 吹出泡泡。
              </p>
              <p>
                下墜時精準踩在泡泡頂部，將會觸發強大的<strong>反作用力二段彈跳（Double Jump）</strong>！熟練此技巧才能登上高聳岩壁取得暗處的神秘彩蛋。
              </p>
            </div>
          </div>

          {/* Environment & Puzzles */}
          <div>
            <h4 className="font-bold text-[#a6ffe2] mb-1.5 flex items-center gap-1.5">
              <span>●</span> 環境解謎與生靈機關
            </h4>
            <div className="space-y-2 bg-[#040908] p-3 rounded border border-[#14332b] text-[11px]">
              <div>
                <strong className="text-[#ffd447]">🧱 脆弱裂紋石壁：</strong>
                泛著金黃/螢綠微光的石壁可被破壞！利用泡泡在石壁旁爆炸、推動重石砸向石壁，或從高處借力下墜衝擊，即可粉碎石壁露出隱藏通道。
              </div>
              <div>
                <strong className="text-[#5cffd2]">📦 可推動重石方塊：</strong>
                走上前推動重石方塊，方塊具備重力。可推至踏板開關上持久壓制，亦可作為墊腳石攀登高處。
              </div>
              <div>
                <strong className="text-[#ffe066]">⚙ 重力感應石臺：</strong>
                位於 [1,1] 深淵幽徑的凹槽石板。需將重石推入凹槽壓制平臺，遠處高聳的隱藏石柱障壁才會沉降入地，開通通向深處彩蛋與水母空域的通道。
              </div>
              <div>
                <strong className="text-[#65f5cb]">🔊 動態距離共鳴音（Audio Compass）：</strong>
                接近未拾取的彩蛋或未發現的生靈時，洞窟背景音將升騰起和諧的水晶泛音，距離越近音調越高！
              </div>
              <div>
                <strong className="text-[#ffe359]">☎ 幽谷電話亭（記錄點）：</strong>
                位於起點之泉旁，走近電話亭將自動響鈴並為你留下記錄，下次可隨時按讀檔繼續冒險！
              </div>
              <div>
                <strong className="text-[#75ffd6]">🏆 成就系統：</strong>
                共收錄 10 項探索、操作與解謎挑戰，達成時會即時在右上角淡入榮譽通知並永久記錄。
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="mt-3 pt-3 border-t border-[#183d33] flex items-center justify-between shrink-0">
          <span className="text-[11px] text-[#4d8777] font-mono">
            提示：可上下滾動查看完整說明
          </span>
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
