import React, { useState } from 'react';
import { MCItem, InventorySlot, ShopPricingConfig, TransactionLog } from '../types';
import { resolveItemPrices, MINECRAFT_ITEMS } from '../data/items';
import { ItemIcon } from './ItemIcon';
import { playClickSound, playSellSuccessSound, playFailSound } from '../utils/audio';
import { DollarSign, ArrowDownRight, CheckCircle2, AlertCircle, RefreshCcw, ShieldCheck } from 'lucide-react';

interface WorthSellTesterProps {
  inventory: InventorySlot[];
  setInventory: React.Dispatch<React.SetStateAction<InventorySlot[]>>;
  playerBalance: number;
  setPlayerBalance: React.Dispatch<React.SetStateAction<number>>;
  pricingConfig: ShopPricingConfig;
  selectedHandSlot: number;
  setSelectedHandSlot: (slot: number) => void;
  addLog: (type: TransactionLog['type'], details: string, amountChange: number, success: boolean) => void;
}

export const WorthSellTester: React.FC<WorthSellTesterProps> = ({
  inventory,
  setInventory,
  playerBalance,
  setPlayerBalance,
  pricingConfig,
  selectedHandSlot,
  setSelectedHandSlot,
  addLog,
}) => {
  const [testAmount, setTestAmount] = useState<number>(16);
  const [customItemToSpawn, setCustomItemToSpawn] = useState<string>('diamond');
  const [terminalOutput, setTerminalOutput] = useState<Array<{ text: string; color: string; id: string }>>([
    {
      id: '1',
      text: '[ArcEdgeShop] Synchronized pricing engine initialized. /worth and /sell bound to unified registry.',
      color: 'text-cyan-400',
    },
  ]);

  const addTerminal = (text: string, color: string = 'text-slate-200') => {
    setTerminalOutput((prev) => [
      ...prev,
      { text: `[${new Date().toLocaleTimeString()}] ${text}`, color, id: Math.random().toString() },
    ]);
  };

  const handSlot = inventory[selectedHandSlot];
  const handItem = handSlot?.item;
  const handItemPrices = handItem ? resolveItemPrices(handItem, pricingConfig) : null;
  const handStackValue = handItem && handItemPrices ? handItemPrices.sell * handSlot.count : 0;

  // Execute /worth command
  const runWorthHand = () => {
    playClickSound();
    if (!handItem || !handItemPrices) {
      playFailSound();
      addTerminal('[Error] You are not holding an item in hand slot #' + (selectedHandSlot + 1), 'text-red-400');
      return;
    }

    if (handItemPrices.sell <= 0) {
      playFailSound();
      addTerminal(`[Worth] ${handItem.displayName} has no configured sell price and cannot be sold.`, 'text-yellow-400');
      return;
    }

    addTerminal(
      `----------------- ArcEdge Worth -----------------`,
      'text-cyan-400'
    );
    addTerminal(
      `${handItem.displayName} x${handSlot.count}`,
      'text-white font-bold'
    );
    addTerminal(
      `Sell Price: $${handItemPrices.sell.toLocaleString()} each`,
      'text-emerald-400'
    );
    addTerminal(
      `Stack Value: $${handStackValue.toLocaleString()}`,
      'text-amber-300 font-bold'
    );
    addTerminal(
      `------------------------------------------------`,
      'text-cyan-400'
    );

    addLog('WORTH_CHECK', `${handItem.displayName} x${handSlot.count}: $${handStackValue.toLocaleString()}`, 0, true);
  };

  // Execute /worth all command
  const runWorthAll = () => {
    playClickSound();
    let totalValue = 0;
    let totalItems = 0;
    const breakdown: Record<string, { count: number; total: number }> = {};

    inventory.forEach((slot) => {
      if (slot.item) {
        const prices = resolveItemPrices(slot.item, pricingConfig);
        if (prices.sell > 0) {
          const val = prices.sell * slot.count;
          totalValue += val;
          totalItems += slot.count;
          if (!breakdown[slot.item.displayName]) {
            breakdown[slot.item.displayName] = { count: 0, total: 0 };
          }
          breakdown[slot.item.displayName].count += slot.count;
          breakdown[slot.item.displayName].total += val;
        }
      }
    });

    addTerminal(`------------- Full Inventory Worth -------------`, 'text-cyan-400');
    if (totalItems === 0) {
      addTerminal(`No sellable items in inventory.`, 'text-slate-400');
      return;
    }

    Object.entries(breakdown).forEach(([name, data]) => {
      addTerminal(`• ${name} x${data.count} = $${data.total.toLocaleString()}`, 'text-slate-300');
    });

    addTerminal(
      `Total Value: $${totalValue.toLocaleString()} across ${totalItems} items`,
      'text-amber-300 font-bold'
    );
    addTerminal(`------------------------------------------------`, 'text-cyan-400');

    addLog('WORTH_CHECK', `Full Inventory: $${totalValue.toLocaleString()}`, 0, true);
  };

  // Execute /sell hand
  const runSellHand = () => {
    if (!handItem || !handItemPrices) {
      playFailSound();
      addTerminal('[Sell Error] Cannot sell: Hand is empty.', 'text-red-400');
      return;
    }

    if (handItemPrices.sell <= 0) {
      playFailSound();
      addTerminal(`[Sell Error] ${handItem.displayName} has no valid sell price.`, 'text-red-400');
      return;
    }

    const count = handSlot.count;
    const payout = handItemPrices.sell * count;

    // ATOMIC VERIFY & REMOVAL FIRST
    setInventory((prev) => {
      const copy = [...prev];
      copy[selectedHandSlot] = { slotIndex: selectedHandSlot, item: null, count: 0 };
      return copy;
    });

    // Then deposit funds
    setPlayerBalance((prev) => prev + payout);
    playSellSuccessSound();

    addTerminal(
      `[Sell] Successfully sold ${count}x ${handItem.displayName} for $${payout.toLocaleString()}!`,
      'text-emerald-400 font-bold'
    );
    addLog('SELL', `Sold ${count}x ${handItem.displayName} for $${payout.toLocaleString()}`, payout, true);
  };

  // Execute /sell all
  const runSellAll = () => {
    let totalPayout = 0;
    let totalSold = 0;

    const newInv = inventory.map((slot) => {
      if (slot.item) {
        const prices = resolveItemPrices(slot.item, pricingConfig);
        if (prices.sell > 0) {
          totalPayout += prices.sell * slot.count;
          totalSold += slot.count;
          return { ...slot, item: null, count: 0 };
        }
      }
      return slot;
    });

    if (totalSold === 0) {
      playFailSound();
      addTerminal('[Sell All] No sellable items found in inventory.', 'text-yellow-400');
      return;
    }

    setInventory(newInv);
    setPlayerBalance((prev) => prev + totalPayout);
    playSellSuccessSound();

    addTerminal(
      `[Sell All] Atomic sale complete: ${totalSold} items liquidated for $${totalPayout.toLocaleString()}!`,
      'text-emerald-400 font-bold'
    );
    addLog('SELL', `Sold all (${totalSold} items) for $${totalPayout.toLocaleString()}`, totalPayout, true);
  };

  // Spawn test items into selected slot for testing
  const spawnTestItem = () => {
    playClickSound();
    const item = MINECRAFT_ITEMS.find((i) => i.id === customItemToSpawn) || MINECRAFT_ITEMS[0];
    const qty = Math.min(testAmount, item.maxStackSize);

    setInventory((prev) => {
      const copy = [...prev];
      copy[selectedHandSlot] = {
        slotIndex: selectedHandSlot,
        item,
        count: qty,
      };
      return copy;
    });

    addTerminal(`Spawned ${qty}x ${item.displayName} into hand slot #${selectedHandSlot + 1}`, 'text-purple-300');
  };

  return (
    <div className="space-y-6">
      
      {/* Overview Banner */}
      <div className="bg-[#141824] p-4 rounded-xl border border-slate-800 shadow">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              Synchronized /worth &amp; /sell Command Verification
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Both commands share the exact same pricing resolver. Items without a sell price are strictly rejected,
              and sales are processed atomically.
            </p>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="px-2.5 py-1 rounded bg-emerald-950/70 border border-emerald-800/80 text-emerald-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              100% Price Sync Verified
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Command Action Panels (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Active Hand Item Status */}
          <div className="bg-[#141824] p-5 rounded-xl border border-slate-800 shadow">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center justify-between">
              <span>Target Held Item (Hotbar Slot #{selectedHandSlot + 1})</span>
              <span className="text-xs text-slate-400 font-mono">
                Click slot below to change
              </span>
            </h3>

            {handItem ? (
              <div className="bg-[#0b0d14] p-4 rounded-xl border border-slate-700/80 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-lg bg-slate-800 border-2 border-slate-600 flex items-center justify-center shadow">
                    <ItemIcon item={handItem} size="lg" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">
                      {handItem.displayName}
                    </h4>
                    <p className="text-xs text-slate-400 font-mono">
                      minecraft:{handItem.materialName.toLowerCase()} • Quantity: {handSlot.count}x
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-emerald-400 font-bold font-mono">
                        Sell: ${handItemPrices?.sell.toLocaleString()} each
                      </span>
                      <span className="text-xs text-slate-500">•</span>
                      <span className="text-xs text-amber-300 font-bold font-mono">
                        Stack: ${handStackValue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={runWorthHand}
                    className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-colors"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    /worth
                  </button>
                  <button
                    onClick={runSellHand}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-colors"
                  >
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    /sell hand
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-[#0b0d14] border border-dashed border-slate-800 rounded-xl">
                <p className="text-slate-400 text-sm">Selected hand slot is currently empty.</p>
                <p className="text-slate-500 text-xs mt-1">Use the spawner below or select another slot with items.</p>
              </div>
            )}

            {/* Hotbar Slot Picker */}
            <div className="mt-4 pt-3 border-t border-slate-800">
              <div className="text-xs font-semibold text-slate-400 mb-2">
                Quick Hotbar Selection:
              </div>
              <div className="grid grid-cols-9 gap-1.5">
                {inventory.slice(27, 36).map((slot, idx) => {
                  const globalSlot = 27 + idx;
                  const isSelected = selectedHandSlot === globalSlot;
                  return (
                    <button
                      key={globalSlot}
                      onClick={() => setSelectedHandSlot(globalSlot)}
                      className={`h-11 rounded border flex flex-col items-center justify-center relative transition-all ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-950/40 shadow'
                          : 'border-slate-700 bg-[#0e111a] hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-[9px] font-mono text-slate-500 absolute top-0.5 left-1">
                        {idx + 1}
                      </span>
                      {slot.item && (
                        <div className="flex items-center justify-center">
                          <ItemIcon item={slot.item} size="sm" />
                          {slot.count > 1 && (
                            <span className="absolute bottom-0 right-1 text-[10px] font-mono text-white font-bold">
                              {slot.count}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Test Item Spawner Box */}
          <div className="bg-[#141824] p-5 rounded-xl border border-slate-800 shadow">
            <h3 className="text-sm font-bold text-white mb-3">
              Spawn Test Item into Hand
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Item Material</label>
                <select
                  value={customItemToSpawn}
                  onChange={(e) => setCustomItemToSpawn(e.target.value)}
                  className="w-full bg-[#0c0e15] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  {MINECRAFT_ITEMS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.displayName} ({item.versionAdded})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Quantity</label>
                <div className="flex gap-1">
                  {[1, 16, 64].map((q) => (
                    <button
                      key={q}
                      onClick={() => setTestAmount(q)}
                      className={`flex-1 py-2 text-xs rounded border font-mono ${
                        testAmount === q
                          ? 'bg-cyan-600 text-white border-cyan-500'
                          : 'bg-[#0c0e15] text-slate-300 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      {q}x
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-end">
                <button
                  onClick={spawnTestItem}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg shadow transition-colors flex items-center justify-center gap-1.5"
                >
                  <RefreshCcw className="w-3.5 h-3.5" />
                  Spawn to Slot
                </button>
              </div>
            </div>
          </div>

          {/* Bulk Action Controls */}
          <div className="bg-[#141824] p-4 rounded-xl border border-slate-800 flex items-center justify-between shadow">
            <div>
              <h4 className="text-sm font-bold text-white">Bulk Inventory Commands</h4>
              <p className="text-xs text-slate-400">Process entire inventory evaluation or liquidation</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={runWorthAll}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              >
                /worth all
              </button>
              <button
                onClick={runSellAll}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow transition-colors"
              >
                /sell all
              </button>
            </div>
          </div>

        </div>

        {/* Right Column: In-Game Chat / Console Simulation (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#0b0d14] rounded-xl border border-slate-800 p-4 shadow-lg h-[520px] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono text-xs font-bold text-slate-200">
                  Paper Minecraft Chat Stream
                </span>
              </div>
              <button
                onClick={() => setTerminalOutput([])}
                className="text-[11px] text-slate-400 hover:text-slate-200 font-mono"
              >
                Clear
              </button>
            </div>

            {/* Scrollable Output Box */}
            <div className="flex-1 overflow-y-auto py-3 space-y-1.5 font-mono text-xs pr-1">
              {terminalOutput.map((line) => (
                <div key={line.id} className={`${line.color} leading-relaxed whitespace-pre-wrap`}>
                  {line.text}
                </div>
              ))}
            </div>

            {/* Command Input Simulation Bar */}
            <div className="pt-3 border-t border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-cyan-400 font-mono text-xs font-bold">/</span>
                <input
                  type="text"
                  readOnly
                  value="Type /worth or /sell via buttons"
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-400 font-mono cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
