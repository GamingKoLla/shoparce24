import React, { useState } from 'react';
import { MCItem, InventorySlot, ShopPricingConfig, TransactionLog } from '../types';
import { resolveItemPrices } from '../data/items';
import { ItemIcon } from './ItemIcon';
import { MinecraftTooltip } from './MinecraftTooltip';
import { playClickSound, playBuySuccessSound, playSellSuccessSound, playFailSound } from '../utils/audio';
import { Shield, Info, DollarSign, ArrowDownRight, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ShopSimulatorProps {
  allowedItems: MCItem[];
  inventory: InventorySlot[];
  setInventory: React.Dispatch<React.SetStateAction<InventorySlot[]>>;
  playerBalance: number;
  setPlayerBalance: React.Dispatch<React.SetStateAction<number>>;
  pricingConfig: ShopPricingConfig;
  transactionLogs: TransactionLog[];
  addLog: (type: TransactionLog['type'], details: string, amountChange: number, success: boolean) => void;
  selectedHandSlot: number;
  setSelectedHandSlot: (slot: number) => void;
  onOpenExploitTester: () => void;
}

export const ShopSimulator: React.FC<ShopSimulatorProps> = ({
  allowedItems,
  inventory,
  setInventory,
  playerBalance,
  setPlayerBalance,
  pricingConfig,
  transactionLogs,
  addLog,
  selectedHandSlot,
  setSelectedHandSlot,
  onOpenExploitTester,
}) => {
  // Tooltip hover state
  const [hoveredShopItem, setHoveredShopItem] = useState<{ item: MCItem; x: number; y: number } | null>(null);
  const [hoveredInvSlot, setHoveredInvSlot] = useState<{ slot: InventorySlot; x: number; y: number } | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showStatus = (text: string, type: 'success' | 'error' | 'info') => {
    setStatusMessage({ text, type });
    setTimeout(() => {
      setStatusMessage(null);
    }, 3500);
  };

  // 4 rows of 9 slots = 36 slots in Shop Chest
  const SHOP_ROWS = 4;
  const SHOP_TOTAL_SLOTS = SHOP_ROWS * 9;
  // Specific slots reserved for shop items (middle 2 rows)
  const SHOP_DISPLAY_SLOTS = [10, 11, 12, 13, 14, 15, 16, 19, 20, 21, 22, 23, 24, 25];

  // Helper to find free inventory space
  const findAvailableSlot = (inv: InventorySlot[], item: MCItem, amountToAdd: number): { canFit: boolean; targetSlot: number; merge: boolean } => {
    // 1. Check existing stack with space
    for (let i = 0; i < inv.length; i++) {
      const slot = inv[i];
      if (slot.item && slot.item.id === item.id && slot.count + amountToAdd <= item.maxStackSize) {
        return { canFit: true, targetSlot: i, merge: true };
      }
    }
    // 2. Check first empty slot
    for (let i = 0; i < inv.length; i++) {
      if (!inv[i].item) {
        return { canFit: true, targetSlot: i, merge: false };
      }
    }
    return { canFit: false, targetSlot: -1, merge: false };
  };

  // Handle Purchasing an item
  const handlePurchase = (item: MCItem, buyStack: boolean) => {
    playClickSound();
    const prices = resolveItemPrices(item, pricingConfig);
    const quantity = buyStack ? Math.min(64, item.maxStackSize) : 1;
    const totalCost = prices.buy * quantity;

    // Security Check 1: Space in Inventory BEFORE money withdrawal
    const spaceCheck = findAvailableSlot(inventory, item, quantity);
    if (!spaceCheck.canFit) {
      playFailSound();
      showStatus(`[ArcEdge] Inventory is full! Make space before purchasing.`, 'error');
      addLog('BUY', `Blocked purchase of ${quantity}x ${item.displayName}: Inventory Full`, 0, false);
      return;
    }

    // Security Check 2: Sufficient Funds
    if (playerBalance < totalCost) {
      playFailSound();
      showStatus(`[ArcEdge] Insufficient funds! Needed $${totalCost.toLocaleString()}, have $${playerBalance.toLocaleString()}`, 'error');
      addLog('BUY', `Declined purchase of ${quantity}x ${item.displayName}: Insufficient Funds`, 0, false);
      return;
    }

    // ATOMIC TRANSACTION:
    // Step 1: Deduct balance
    setPlayerBalance((prev) => prev - totalCost);

    // Step 2: Add item to player inventory
    setInventory((prev) => {
      const copy = [...prev];
      if (spaceCheck.merge) {
        copy[spaceCheck.targetSlot] = {
          ...copy[spaceCheck.targetSlot],
          count: copy[spaceCheck.targetSlot].count + quantity,
        };
      } else {
        copy[spaceCheck.targetSlot] = {
          slotIndex: spaceCheck.targetSlot,
          item,
          count: quantity,
        };
      }
      return copy;
    });

    playBuySuccessSound();
    showStatus(`Purchased ${quantity}x ${item.displayName} for $${totalCost.toLocaleString()}!`, 'success');
    addLog('BUY', `Purchased ${quantity}x ${item.displayName} for $${totalCost.toLocaleString()}`, -totalCost, true);
  };

  // Sell Hand Item
  const handleSellHand = () => {
    const handSlot = inventory[selectedHandSlot];
    if (!handSlot || !handSlot.item) {
      playFailSound();
      showStatus(`You are not holding an item in hotbar slot ${selectedHandSlot + 1}.`, 'error');
      return;
    }

    const item = handSlot.item;
    const prices = resolveItemPrices(item, pricingConfig);
    if (prices.sell <= 0) {
      playFailSound();
      showStatus(`${item.displayName} has no configured sell price!`, 'error');
      return;
    }

    const count = handSlot.count;
    const totalPayout = prices.sell * count;

    // Atomic removal first, then payment
    setInventory((prev) => {
      const copy = [...prev];
      copy[selectedHandSlot] = { slotIndex: selectedHandSlot, item: null, count: 0 };
      return copy;
    });

    setPlayerBalance((prev) => prev + totalPayout);
    playSellSuccessSound();
    showStatus(`Sold ${count}x ${item.displayName} for $${totalPayout.toLocaleString()}!`, 'success');
    addLog('SELL', `Sold ${count}x ${item.displayName} for $${totalPayout.toLocaleString()}`, totalPayout, true);
  };

  // Sell All Sellable Items in Inventory
  const handleSellAll = () => {
    let totalPayout = 0;
    let totalItems = 0;

    const newInv = inventory.map((slot) => {
      if (slot.item) {
        const prices = resolveItemPrices(slot.item, pricingConfig);
        if (prices.sell > 0) {
          totalPayout += prices.sell * slot.count;
          totalItems += slot.count;
          return { ...slot, item: null, count: 0 };
        }
      }
      return slot;
    });

    if (totalItems === 0) {
      playFailSound();
      showStatus(`No sellable items found in your inventory.`, 'info');
      return;
    }

    setInventory(newInv);
    setPlayerBalance((prev) => prev + totalPayout);
    playSellSuccessSound();
    showStatus(`Sold ${totalItems} items for $${totalPayout.toLocaleString()}!`, 'success');
    addLog('SELL', `Sold ${totalItems} items for $${totalPayout.toLocaleString()}`, totalPayout, true);
  };

  // Inspect Worth of Hand Item
  const handleInspectWorth = () => {
    const handSlot = inventory[selectedHandSlot];
    if (!handSlot || !handSlot.item) {
      showStatus(`You are not holding an item to evaluate.`, 'error');
      return;
    }
    const item = handSlot.item;
    const prices = resolveItemPrices(item, pricingConfig);
    const stackVal = prices.sell * handSlot.count;

    showStatus(
      `[Worth] ${item.displayName} x${handSlot.count} | Sell: $${prices.sell.toLocaleString()} ea | Stack: $${stackVal.toLocaleString()}`,
      'info'
    );
    addLog('WORTH_CHECK', `${item.displayName} x${handSlot.count} (Unit: $${prices.sell}, Stack: $${stackVal})`, 0, true);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Notification / Banner */}
      {statusMessage && (
        <div
          className={`flex items-center justify-between px-4 py-2.5 rounded-lg border text-sm font-medium transition-all shadow-md ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-200'
              : statusMessage.type === 'error'
              ? 'bg-red-950/70 border-red-500/60 text-red-200'
              : 'bg-blue-950/70 border-blue-500/60 text-blue-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {statusMessage.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />}
            {statusMessage.type === 'info' && <Info className="w-4 h-4 text-cyan-400 shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
          <span className="text-[11px] font-mono opacity-70">ArcEdge Server Output</span>
        </div>
      )}

      {/* Main Simulator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left 8 Cols: Authentic Minecraft GUI */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Shop Chest GUI Box */}
          <div className="mc-panel p-4 rounded-sm relative select-none">
            {/* Chest Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#a0a0a0] mb-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#3f3f3f] text-base tracking-wide font-sans">
                  ArcEdge Shop
                </span>
                <span className="text-xs bg-[#b5b5b5] text-[#333] px-2 py-0.5 rounded border border-[#8f8f8f] font-mono">
                  {allowedItems.length} allowed items
                </span>
              </div>
              <div className="text-xs text-[#444] font-mono">
                /shop • allowedbuy.yml
              </div>
            </div>

            {/* Shop Grid (36 slots, 4 rows x 9 columns) */}
            <div className="grid grid-cols-9 gap-1.5 p-2 bg-[#8c8c8c] rounded border-2 border-[#555] shadow-inner">
              {Array.from({ length: SHOP_TOTAL_SLOTS }).map((_, index) => {
                const itemIndex = SHOP_DISPLAY_SLOTS.indexOf(index);
                const item = itemIndex !== -1 && itemIndex < allowedItems.length ? allowedItems[itemIndex] : null;
                const isWalletSlot = index === SHOP_TOTAL_SLOTS - 5; // Bottom center slot

                if (isWalletSlot) {
                  return (
                    <div
                      key={index}
                      className="mc-slot w-11 h-11 flex items-center justify-center cursor-default bg-[#969696] relative group"
                      title="Your Current Wallet Balance"
                    >
                      <div className="w-7 h-7 rounded bg-amber-400 border border-amber-600 flex items-center justify-center text-amber-950 font-bold text-xs shadow-inner">
                        $
                      </div>
                    </div>
                  );
                }

                if (!item) {
                  // Gray Glass Pane filler
                  return (
                    <div
                      key={index}
                      className="mc-slot w-11 h-11 flex items-center justify-center bg-[#707070] opacity-40 cursor-not-allowed"
                    >
                      <div className="w-6 h-6 border border-slate-500/40 rounded-xs" />
                    </div>
                  );
                }

                const prices = resolveItemPrices(item, pricingConfig);

                return (
                  <div
                    key={index}
                    onClick={() => handlePurchase(item, false)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      handlePurchase(item, true);
                    }}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setHoveredShopItem({ item, x: rect.right + 10, y: rect.top });
                    }}
                    onMouseLeave={() => setHoveredShopItem(null)}
                    className="mc-slot w-11 h-11 flex items-center justify-center cursor-pointer transition-transform hover:scale-105 hover:bg-[#a6a6a6] active:scale-95 relative group"
                  >
                    <ItemIcon item={item} size="md" />
                    {/* Price tag on slot bottom */}
                    <span className="absolute -bottom-1 -right-1 text-[10px] font-bold text-amber-300 bg-black/80 px-1 rounded-xs font-mono leading-none shadow">
                      ${prices.buy >= 1000 ? `${(prices.buy / 1000).toFixed(1)}k` : prices.buy}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Shop GUI Instructions Footer */}
            <div className="mt-3 flex items-center justify-between text-xs text-[#444] pt-2 border-t border-[#a0a0a0]">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                Atomic anti-dupe locks active
              </span>
              <span className="font-mono text-[11px]">
                Left-Click: Buy 1 • Right-Click: Buy Stack
              </span>
            </div>
          </div>

          {/* Player Inventory (Simulated Minecraft Player Bag & Hotbar) */}
          <div className="mc-panel p-4 rounded-sm select-none">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#a0a0a0]">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#3f3f3f] text-sm font-sans">
                  Player Inventory
                </span>
                <span className="text-xs text-[#555] font-mono">
                  (Hover any item to view Sell & Stack Value!)
                </span>
              </div>
              <div className="text-xs font-mono text-[#444]">
                Holding slot: #{selectedHandSlot + 1}
              </div>
            </div>

            {/* 3 Rows of Main Inventory (Slots 0 to 26) */}
            <div className="grid grid-cols-9 gap-1.5 p-2 bg-[#8c8c8c] rounded border-2 border-[#555] shadow-inner mb-3">
              {inventory.slice(0, 27).map((slot, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedHandSlot(idx)}
                  onMouseEnter={(e) => {
                    if (slot.item) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setHoveredInvSlot({ slot, x: rect.right + 10, y: rect.top });
                    }
                  }}
                  onMouseLeave={() => setHoveredInvSlot(null)}
                  className={`mc-slot w-11 h-11 flex items-center justify-center cursor-pointer transition-all relative ${
                    selectedHandSlot === idx ? 'ring-2 ring-amber-400 bg-[#a0a0a0]' : 'hover:bg-[#999]'
                  }`}
                >
                  {slot.item && (
                    <>
                      <ItemIcon item={slot.item} size="md" />
                      {slot.count > 1 && (
                        <span className="absolute bottom-0.5 right-1 text-xs font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)] font-mono">
                          {slot.count}
                        </span>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Hotbar (Slots 27 to 35) */}
            <div className="pt-2 border-t border-[#a0a0a0]">
              <div className="text-[11px] font-bold text-[#444] mb-1.5 font-sans">
                HOTBAR (Select item to run /worth or /sell hand)
              </div>
              <div className="grid grid-cols-9 gap-1.5 p-2 bg-[#808080] rounded border-2 border-[#4a4a4a] shadow-inner">
                {inventory.slice(27, 36).map((slot, hotbarIndex) => {
                  const globalIdx = 27 + hotbarIndex;
                  const isSelected = selectedHandSlot === globalIdx;

                  return (
                    <div
                      key={globalIdx}
                      onClick={() => setSelectedHandSlot(globalIdx)}
                      onMouseEnter={(e) => {
                        if (slot.item) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredInvSlot({ slot, x: rect.right + 10, y: rect.top });
                        }
                      }}
                      onMouseLeave={() => setHoveredInvSlot(null)}
                      className={`mc-slot w-11 h-11 flex items-center justify-center cursor-pointer transition-all relative ${
                        isSelected ? 'ring-3 ring-cyan-400 bg-[#ababab]' : 'hover:bg-[#919191]'
                      }`}
                    >
                      {/* Slot number hint */}
                      <span className="absolute top-0.5 left-1 text-[9px] text-[#222] font-mono font-bold opacity-60">
                        {hotbarIndex + 1}
                      </span>
                      {slot.item && (
                        <>
                          <ItemIcon item={slot.item} size="md" />
                          {slot.count > 1 && (
                            <span className="absolute bottom-0.5 right-1 text-xs font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)] font-mono">
                              {slot.count}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Quick Action Bar */}
          <div className="bg-[#141824] p-3 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 shadow">
            <div className="flex items-center gap-2">
              <button
                onClick={handleInspectWorth}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 transition-colors shadow"
              >
                <DollarSign className="w-3.5 h-3.5" />
                Run /worth
              </button>
              <button
                onClick={handleSellHand}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-colors shadow"
              >
                <ArrowDownRight className="w-3.5 h-3.5" />
                Run /sell hand
              </button>
              <button
                onClick={handleSellAll}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1.5 transition-colors shadow"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Run /sell all
              </button>
            </div>

            <button
              onClick={onOpenExploitTester}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-700/60 flex items-center gap-1.5 transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-red-400" />
              Simulate Exploits
            </button>
          </div>

        </div>

        {/* Right 4 Cols: Live Inspector, Atomic Engine & Logs */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Selected Hand Item Card */}
          <div className="bg-[#141824] p-4 rounded-xl border border-slate-800 shadow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                Hand Item Inspector
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                Slot #{selectedHandSlot + 1}
              </span>
            </div>

            {inventory[selectedHandSlot]?.item ? (
              (() => {
                const held = inventory[selectedHandSlot].item!;
                const count = inventory[selectedHandSlot].count;
                const prices = resolveItemPrices(held, pricingConfig);
                const stackTotal = prices.sell * count;

                return (
                  <div className="space-y-3 bg-[#0c0e15] p-3 rounded-lg border border-slate-700/80">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded bg-slate-800 border border-slate-600 flex items-center justify-center">
                        <ItemIcon item={held} size="lg" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">
                          {held.displayName}
                        </h4>
                        <p className="text-xs text-slate-400 font-mono">
                          Count: {count}x / {held.maxStackSize}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                      <div className="bg-[#141824] p-2 rounded border border-slate-700">
                        <div className="text-[10px] uppercase text-slate-400 font-semibold font-mono">
                          Sell Price (Each)
                        </div>
                        <div className="text-sm font-bold text-emerald-400 font-mono">
                          ${prices.sell.toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-[#141824] p-2 rounded border border-slate-700">
                        <div className="text-[10px] uppercase text-slate-400 font-semibold font-mono">
                          Stack Value
                        </div>
                        <div className="text-sm font-bold text-amber-400 font-mono">
                          ${stackTotal.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={handleSellHand}
                        className="w-full py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs font-mono transition-colors"
                      >
                        Sell This Item (+${stackTotal.toLocaleString()})
                      </button>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="text-center py-6 text-slate-500 text-xs border border-dashed border-slate-800 rounded-lg">
                Click any slot in your inventory hotbar to inspect its sell and stack values.
              </div>
            )}
          </div>

          {/* Atomic Security Highlights */}
          <div className="bg-[#141824] p-4 rounded-xl border border-slate-800 shadow">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-emerald-400" />
              ArcEdge Active Protections
            </h3>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>Atomic 2-Phase Order</strong>: Space verified before balance deduction.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>Shift-Click &amp; Drag Canceled</strong>: Top GUI holder strictly intercepts illegal slot clicks.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>Profit Loop Shield</strong>: Sell ratio guaranteed strictly lower than buy cost.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>Zero-Tick Lag</strong>: No 5-second repeating task; PDC cached tooltips.</span>
              </li>
            </ul>
          </div>

          {/* Real-Time Transaction Logs */}
          <div className="bg-[#141824] p-4 rounded-xl border border-slate-800 shadow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white">
                Server Transaction Log
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                {transactionLogs.length} events
              </span>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {transactionLogs.length === 0 ? (
                <div className="text-center py-4 text-slate-500 text-xs font-mono">
                  No transactions yet. Click items in /shop to buy or sell.
                </div>
              ) : (
                transactionLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2 rounded bg-[#0c0e15] border border-slate-800 text-[11px] font-mono flex items-start justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-1 rounded text-[9px] font-bold ${
                            log.type === 'BUY'
                              ? 'bg-blue-900/60 text-blue-300'
                              : log.type === 'SELL'
                              ? 'bg-emerald-900/60 text-emerald-300'
                              : log.type === 'EXPLOIT_BLOCKED'
                              ? 'bg-red-900/60 text-red-300'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {log.type}
                        </span>
                        <span className="text-slate-400 text-[10px]">{log.timestamp}</span>
                      </div>
                      <p className="text-slate-200 mt-1">{log.details}</p>
                    </div>

                    {log.amountChange !== 0 && (
                      <span
                        className={`font-bold shrink-0 ${
                          log.amountChange > 0 ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {log.amountChange > 0 ? `+$${log.amountChange.toLocaleString()}` : `-$${Math.abs(log.amountChange).toLocaleString()}`}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Floating Minecraft Tooltips */}
      {hoveredShopItem && (
        <div
          className="fixed pointer-events-none z-50 transition-transform duration-75"
          style={{ left: `${hoveredShopItem.x}px`, top: `${hoveredShopItem.y}px` }}
        >
          <MinecraftTooltip
            item={hoveredShopItem.item}
            config={pricingConfig}
            mode="shop"
          />
        </div>
      )}

      {hoveredInvSlot && hoveredInvSlot.slot.item && (
        <div
          className="fixed pointer-events-none z-50 transition-transform duration-75"
          style={{ left: `${hoveredInvSlot.x}px`, top: `${hoveredInvSlot.y}px` }}
        >
          <MinecraftTooltip
            item={hoveredInvSlot.slot.item}
            count={hoveredInvSlot.slot.count}
            config={pricingConfig}
            mode="inventory"
          />
        </div>
      )}

    </div>
  );
};
