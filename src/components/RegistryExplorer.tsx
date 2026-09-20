import React, { useState } from 'react';
import { MINECRAFT_ITEMS, resolveItemPrices } from '../data/items';
import { MCItem, ShopPricingConfig } from '../types';
import { ItemIcon } from './ItemIcon';
import { Database, Sparkles, Cpu, ShieldAlert, CheckCircle, ExternalLink } from 'lucide-react';

interface RegistryExplorerProps {
  pricingConfig: ShopPricingConfig;
}

export const RegistryExplorer: React.FC<RegistryExplorerProps> = ({ pricingConfig }) => {
  const [selectedVersion, setSelectedVersion] = useState<string>('all');
  const [mockFutureItem, setMockFutureItem] = useState<string>('');
  const [simulatedItems, setSimulatedItems] = useState<MCItem[]>([]);

  const handleSimulateNewItem = () => {
    if (!mockFutureItem.trim()) return;
    const cleanId = mockFutureItem.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const newItem: MCItem = {
      id: cleanId,
      materialName: cleanId.toUpperCase(),
      displayName: mockFutureItem.trim(),
      category: 'modern_26',
      versionAdded: '26.3+ Upcoming',
      isAllowedBuyDefault: false,
      isRestricted: false,
      maxStackSize: 64,
      description: 'Auto-discovered dynamic item registered by Paper server runtime.',
    };
    setSimulatedItems((prev) => [newItem, ...prev]);
    setMockFutureItem('');
  };

  const allDisplayItems = [...simulatedItems, ...MINECRAFT_ITEMS];

  const filteredItems = allDisplayItems.filter((item) => {
    if (selectedVersion === 'all') return true;
    if (selectedVersion === '26.x') return item.versionAdded.includes('26') || item.versionAdded.includes('1.21');
    if (selectedVersion === 'vanilla') return item.versionAdded === 'Vanilla';
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner Explaining Modern Registry Architecture */}
      <div className="bg-[#141824] p-5 rounded-xl border border-slate-800 shadow">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white">
                Paper 26.1.2 - 26.3+ Dynamic Item Registry System
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              How does ArcEdgeShop recognize every item up to 26.3 and future upcoming updates without needing plugin updates?
              In modern Paper, instead of hardcoded enums, we query{' '}
              <code className="px-1.5 py-0.5 rounded bg-[#0b0d14] text-cyan-300 font-mono text-[11px] border border-slate-700">
                RegistryAccess.registryAccess().getRegistry(RegistryKey.ITEM)
              </code>.
              When Mojang/Paper releases 26.2, 26.3, or snapshots, any new material is registered on server boot and auto-priced via fallback algorithms with zero NMS or reflection!
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1.5 rounded-lg bg-cyan-950/80 border border-cyan-800 text-cyan-300 text-xs font-mono font-semibold flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              Java 25 Native
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Item Simulator: Test Upcoming 26.3 / 26.4 Item Auto-Indexing */}
      <div className="bg-[#141824] p-5 rounded-xl border border-slate-800 shadow">
        <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          Test Future Item Discovery (e.g. 26.3 Snapshot Items)
        </h3>
        <p className="text-xs text-slate-400 mb-3">
          Type the name of any hypothetical future Minecraft block or item to see how ArcEdgeShop dynamically detects it,
          generates a profit-loop safe price, and makes it available for <code className="font-mono text-cyan-300">/worth</code> and <code className="font-mono text-cyan-300">/sell</code> instantly.
        </p>

        <div className="flex gap-2 max-w-xl">
          <input
            type="text"
            placeholder="e.g. Pale Resin Crystal, Creaking Vine, Echo Gem..."
            value={mockFutureItem}
            onChange={(e) => setMockFutureItem(e.target.value)}
            className="flex-1 bg-[#0c0e15] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <button
            onClick={handleSimulateNewItem}
            disabled={!mockFutureItem.trim()}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow transition-all"
          >
            Simulate Discovery
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedVersion('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedVersion === 'all'
                ? 'bg-cyan-600 text-white shadow'
                : 'bg-[#141824] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Items ({allDisplayItems.length})
          </button>
          <button
            onClick={() => setSelectedVersion('26.x')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedVersion === '26.x'
                ? 'bg-cyan-600 text-white shadow'
                : 'bg-[#141824] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Modern 26.x &amp; 1.21 Features
          </button>
          <button
            onClick={() => setSelectedVersion('vanilla')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedVersion === 'vanilla'
                ? 'bg-cyan-600 text-white shadow'
                : 'bg-[#141824] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Vanilla Classic Items
          </button>
        </div>

        <span className="text-xs text-slate-400 font-mono hidden sm:inline">
          Showing {filteredItems.length} registry entries
        </span>
      </div>

      {/* Items Registry Table / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredItems.map((item) => {
          const prices = resolveItemPrices(item, pricingConfig);
          return (
            <div
              key={item.id}
              className="bg-[#141824] p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 transition-all flex items-start gap-3 shadow"
            >
              <div className="w-10 h-10 rounded-lg bg-[#0b0d14] border border-slate-700 flex items-center justify-center shrink-0">
                <ItemIcon item={item} size="md" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-xs font-bold text-white truncate">
                    {item.displayName}
                  </h4>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 shrink-0">
                    {item.versionAdded}
                  </span>
                </div>

                <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                  minecraft:{item.materialName.toLowerCase()}
                </p>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
                  <span className="text-amber-400 font-bold">
                    Buy: ${prices.buy.toLocaleString()}
                  </span>
                  <span className="text-emerald-400 font-bold">
                    Sell: ${prices.sell.toLocaleString()}
                  </span>
                </div>

                <div className="mt-1 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                  <span>{prices.isManual ? 'Configured Price' : 'Dynamic Fallback'}</span>
                  <span className="text-emerald-400">Loop-Safe ✓</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
