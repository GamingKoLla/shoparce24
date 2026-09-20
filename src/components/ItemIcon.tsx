import React from 'react';
import { MCItem } from '../types';

interface ItemIconProps {
  item: MCItem | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ItemIcon: React.FC<ItemIconProps> = ({ item, size = 'md', className = '' }) => {
  if (!item) {
    return <div className="w-full h-full" />;
  }

  const dim = size === 'sm' ? 'w-6 h-6 text-xs' : size === 'lg' ? 'w-10 h-10 text-base' : 'w-8 h-8 text-sm';

  // Distinct visual signatures for Minecraft items
  const getItemVisual = (id: string, mat: string) => {
    switch (id) {
      case 'diamond':
        return (
          <div className="w-full h-full flex items-center justify-center relative">
            <div className="w-5 h-5 bg-[#4dedf4] rotate-45 border border-[#1b9aa0] shadow-[0_0_8px_rgba(77,237,244,0.6)] flex items-center justify-center">
              <div className="w-2 h-2 bg-white/60 -rotate-45" />
            </div>
          </div>
        );
      case 'cobblestone':
        return (
          <div className="w-full h-full bg-[#737373] border-2 border-[#404040] flex flex-wrap p-0.5 gap-0.5">
            <div className="w-2 h-2 bg-[#525252]" />
            <div className="w-2 h-2 bg-[#8c8c8c]" />
            <div className="w-2 h-2 bg-[#525252]" />
            <div className="w-2 h-2 bg-[#333333]" />
          </div>
        );
      case 'stone':
        return (
          <div className="w-full h-full bg-[#828282] border border-[#555555] rounded-xs shadow-inner flex items-center justify-center">
            <div className="w-3 h-3 bg-[#6e6e6e] rounded-xs" />
          </div>
        );
      case 'oak_log':
        return (
          <div className="w-full h-full bg-[#6d5130] border-2 border-[#43321d] flex flex-col justify-center items-center">
            <div className="w-4 h-2 bg-[#9c7a4d] border border-[#5e4120]" />
          </div>
        );
      case 'iron_ingot':
        return (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-6 h-3.5 bg-gradient-to-r from-[#d9d9d9] via-[#ffffff] to-[#a6a6a6] border border-[#787878] rounded-xs shadow" />
          </div>
        );
      case 'gold_ingot':
        return (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-6 h-3.5 bg-gradient-to-r from-[#fadb41] via-[#fff48f] to-[#c79a0b] border border-[#a17800] rounded-xs shadow" />
          </div>
        );
      case 'bread':
        return (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-6 h-4 bg-[#b5651d] rounded-full border border-[#6b3503] flex items-center justify-center">
              <div className="w-3 h-1 bg-[#e09858] rounded-full" />
            </div>
          </div>
        );
      case 'cooked_beef':
        return (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-6 h-4.5 bg-[#5e2b20] rounded-sm border border-[#2b100a] flex items-center justify-center rotate-6">
              <div className="w-2 h-2 bg-[#8c3b2d] rounded-full" />
            </div>
          </div>
        );
      case 'arrow':
        return (
          <div className="w-full h-full flex items-center justify-center rotate-45">
            <div className="w-6 h-1 bg-[#8a7250] relative">
              <div className="absolute -left-1 -top-1 w-2 h-3 bg-[#c7c7c7] border border-gray-600 rotate-45" />
              <div className="absolute -right-1 -top-1 w-2 h-3 bg-white" />
            </div>
          </div>
        );
      case 'shield':
        return (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-5 h-6 bg-[#636b75] border-2 border-[#3d4249] rounded-b-lg flex items-center justify-center">
              <div className="w-2.5 h-3 bg-[#a8b2be]" />
            </div>
          </div>
        );
      case 'golden_apple':
        return (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-5 h-5 bg-[#ffcc00] rounded-full border border-[#cc9900] shadow-[0_0_8px_rgba(255,204,0,0.8)] flex items-center justify-center relative">
              <div className="absolute -top-1 right-2 w-1.5 h-2 bg-[#5c3e1e] rounded-xs" />
              <div className="w-1.5 h-1.5 bg-white/70 rounded-full" />
            </div>
          </div>
        );
      case 'resin_clump':
      case 'resin_bricks':
        return (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-5 h-5 bg-[#e06516] rounded border border-[#8f3603] shadow-[0_0_6px_rgba(224,101,22,0.6)] flex items-center justify-center">
              <div className="w-2 h-2 bg-[#ffa352]" />
            </div>
          </div>
        );
      case 'pale_oak_log':
        return (
          <div className="w-full h-full bg-[#d5d7d8] border-2 border-[#8c9194] flex flex-col justify-center items-center">
            <div className="w-4 h-2 bg-[#eef1f2] border border-[#a2a7aa]" />
          </div>
        );
      case 'creaking_heart':
        return (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-5 h-5 bg-[#2d3032] border-2 border-[#e06516] shadow-[0_0_10px_rgba(224,101,22,0.9)] flex items-center justify-center animate-pulse">
              <div className="w-2 h-2 bg-[#ff8a3d]" />
            </div>
          </div>
        );
      case 'bundle':
        return (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-5 h-5.5 bg-[#967756] border border-[#523e2b] rounded-b-md relative flex items-center justify-center">
              <div className="absolute -top-1 w-4 h-1.5 bg-[#e0d3b6] border border-[#7a6a4d] rounded-xs" />
            </div>
          </div>
        );
      case 'breeze_rod':
        return (
          <div className="w-full h-full flex items-center justify-center rotate-45">
            <div className="w-6 h-1.5 bg-gradient-to-r from-[#e3e8f7] via-[#a2b5e8] to-[#5b78c7] rounded shadow-[0_0_6px_rgba(162,181,232,0.8)]" />
          </div>
        );
      case 'mace':
        return (
          <div className="w-full h-full flex items-center justify-center rotate-45">
            <div className="w-1.5 h-6 bg-[#634832] relative">
              <div className="absolute -top-2 -left-2 w-5 h-5 bg-[#2e313d] border border-[#5e6378] rounded-xs" />
            </div>
          </div>
        );
      case 'heavy_core':
        return (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-5 h-5 bg-[#333845] border-2 border-[#768099] shadow flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-[#1b1e26] border border-[#8f9bb5]" />
            </div>
          </div>
        );
      case 'elytra':
        return (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-6 h-5 border-2 border-[#4b5563] bg-[#374151] rounded-t-xl rounded-b-xs shadow flex items-center justify-center">
              <span className="text-[9px] font-bold text-indigo-300">EL</span>
            </div>
          </div>
        );
      default:
        return (
          <div className="w-full h-full bg-slate-700 border border-slate-500 rounded-xs flex items-center justify-center text-[10px] font-mono text-slate-200 font-bold uppercase">
            {mat.substring(0, 2)}
          </div>
        );
    }
  };

  return (
    <div className={`relative select-none flex items-center justify-center ${dim} ${className}`}>
      {getItemVisual(item.id, item.materialName)}
    </div>
  );
};
