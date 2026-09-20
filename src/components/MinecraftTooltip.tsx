import React from 'react';
import { MCItem, ShopPricingConfig } from '../types';
import { resolveItemPrices } from '../data/items';

interface MinecraftTooltipProps {
  item: MCItem | null;
  count?: number;
  config: ShopPricingConfig;
  mode: 'shop' | 'inventory';
}

export const MinecraftTooltip: React.FC<MinecraftTooltipProps> = ({
  item,
  count = 1,
  config,
  mode,
}) => {
  if (!item) return null;

  const prices = resolveItemPrices(item, config);
  const totalSellValue = prices.sell * count;

  return (
    <div className="mc-tooltip p-2.5 text-xs select-none pointer-events-none z-50 min-w-[190px] shadow-2xl">
      {/* Item Display Title */}
      <div className={`font-bold text-sm leading-snug mb-1 ${
        item.isRestricted ? 'text-purple-300' :
        item.category === 'rare' ? 'text-yellow-300' :
        'text-white'
      }`}>
        {item.displayName}
      </div>

      {mode === 'inventory' ? (
        /* Inventory Hover Tooltip Requirement: */
        <div className="space-y-0.5 border-t border-purple-900/60 pt-1">
          <div className="text-emerald-400 font-mono">
            Sell Value: ${prices.sell.toLocaleString()} each
          </div>
          {count > 1 && (
            <div className="text-amber-300 font-mono font-semibold">
              Stack Value: ${totalSellValue.toLocaleString()}
            </div>
          )}
          <div className="text-[10px] text-purple-300/80 pt-1 italic font-sans">
            {item.description}
          </div>
          <div className="text-[9px] text-slate-400 font-mono pt-0.5">
            minecraft:{item.materialName.toLowerCase()}
          </div>
        </div>
      ) : (
        /* Shop GUI Tooltip */
        <div className="space-y-1 border-t border-purple-900/60 pt-1">
          <div className="flex justify-between items-center text-slate-300">
            <span>Buy Price:</span>
            <span className="text-amber-300 font-bold font-mono">
              ${prices.buy.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span>Sell Value:</span>
            <span className="text-emerald-400 font-mono">
              ${prices.sell.toLocaleString()}
            </span>
          </div>
          <div className="border-t border-purple-900/40 my-1" />
          <div className="text-[10px] space-y-0.5">
            <p className="text-yellow-300">▶ Left-Click: Buy 1</p>
            <p className="text-yellow-300">▶ Right-Click: Buy Stack ({item.maxStackSize})</p>
            <p className="text-cyan-300">▶ Middle-Click: Inspect Worth</p>
          </div>
        </div>
      )}
    </div>
  );
};
