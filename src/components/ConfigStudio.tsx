import React, { useState } from 'react';
import { MCItem, ShopPricingConfig } from '../types';
import { MINECRAFT_ITEMS, resolveItemPrices } from '../data/items';
import { ItemIcon } from './ItemIcon';
import { Settings, AlertTriangle, ShieldCheck, Plus, Trash2, Check, Sliders, FileText, Copy } from 'lucide-react';
import { playClickSound } from '../utils/audio';

interface ConfigStudioProps {
  pricingConfig: ShopPricingConfig;
  setPricingConfig: React.Dispatch<React.SetStateAction<ShopPricingConfig>>;
  allowedItems: MCItem[];
  setAllowedItems: React.Dispatch<React.SetStateAction<MCItem[]>>;
  onReloadPlugin: () => void;
}

export const ConfigStudio: React.FC<ConfigStudioProps> = ({
  pricingConfig,
  setPricingConfig,
  allowedItems,
  setAllowedItems,
  onReloadPlugin,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [activeYamlTab, setActiveYamlTab] = useState<'config' | 'allowedbuy'>('allowedbuy');
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Check for profit loops across all items
  const profitLoopIssues = Object.entries(pricingConfig.manualPrices).filter(
    ([_, price]) => price.sell >= price.buy
  );

  // Update default pricing ratios
  const updateDefaultPricing = (field: keyof ShopPricingConfig, value: number) => {
    setPricingConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Toggle item in allowedbuy.yml
  const toggleAllowedItem = (item: MCItem) => {
    playClickSound();
    const isAlreadyAllowed = allowedItems.some((i) => i.id === item.id);
    if (isAlreadyAllowed) {
      setAllowedItems((prev) => prev.filter((i) => i.id !== item.id));
    } else {
      setAllowedItems((prev) => [...prev, item]);
    }
  };

  // Update manual price for an item
  const updateItemPrice = (material: string, type: 'buy' | 'sell', val: number) => {
    setPricingConfig((prev) => {
      const current = prev.manualPrices[material] || { buy: prev.defaultBuyPrice, sell: prev.defaultSellPrice };
      return {
        ...prev,
        manualPrices: {
          ...prev.manualPrices,
          [material]: {
            ...current,
            [type]: Math.max(0, val),
          },
        },
      };
    });
  };

  // Generate dynamic YAML representations
  const generatedAllowedBuyYaml = `# ==============================================================================
# ArcEdgeShop - Allowed Buy Items
# ONLY items listed here can be purchased in /shop.
# Keep the default shop limited to useful everyday items.
# Server owner can freely add/remove allowed items here without altering pricing.
# ==============================================================================

items:
${allowedItems.map((item) => `  - ${item.materialName}`).join('\n')}
`;

  const generatedConfigYaml = `# ==============================================================================
# ArcEdgeShop - Main Configuration & Central Pricing Database
# ==============================================================================

pricing:
  default-buy-price: ${pricingConfig.defaultBuyPrice}.0
  default-sell-price: ${pricingConfig.defaultSellPrice}.0
  sell-price-ratio: ${pricingConfig.sellPriceRatio.toFixed(2)}
  prevent-profit-loops: true

prices:
${Object.entries(pricingConfig.manualPrices)
  .map(
    ([mat, p]) => `  ${mat}:
    buy: ${p.buy}.0
    sell: ${p.sell}.0`
  )
  .join('\n')}

gui:
  title: "<gradient:#2b5876:#4e4376><bold>ArcEdge Shop</bold></gradient>"
  rows: 4
  fill-empty-slots: true
  filler-item: "GRAY_STAINED_GLASS_PANE"

tooltip:
  enabled: true
  unit-format: "<gray>Sell Value: <green>\${price} each</green></gray>"

security:
  cooldown-ms: 250
  atomic-transactions: true

economy:
  currency-symbol: "$"
`;

  const copyYaml = () => {
    const text = activeYamlTab === 'config' ? generatedConfigYaml : generatedAllowedBuyYaml;
    navigator.clipboard.writeText(text);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  // Filter items for the allowedbuy selector
  const filteredCatalog = MINECRAFT_ITEMS.filter((item) => {
    const matchesSearch =
      item.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.materialName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      
      {/* Clarification Callout: Where to Configure Sell Price vs Buy Price */}
      <div className="bg-[#101524] border border-cyan-800/80 rounded-xl p-5 shadow-lg space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-700 flex items-center justify-center text-cyan-400">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              Where to Configure Sell Prices vs. Whitelist Buy Items
            </h3>
            <p className="text-xs text-slate-300">
              Clear distinction between <code className="text-emerald-300 font-mono">allowedbuy.yml</code> and <code className="text-cyan-300 font-mono">config.yml</code>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="bg-[#0b0d14] p-3.5 rounded-lg border border-emerald-800/60">
            <div className="flex items-center gap-1.5 font-bold text-emerald-400 font-mono mb-1">
              <Check className="w-3.5 h-3.5" />
              allowedbuy.yml (Shop Whitelist)
            </div>
            <p className="text-slate-300 leading-relaxed">
              Defines <strong>which items appear in <code className="text-white font-mono">/shop</code></strong>. Players can browse, add, or buy items listed here.
            </p>
            <div className="bg-[#141824] p-2 mt-2 rounded font-mono text-[11px] text-emerald-300">
              items:<br />
              &nbsp;&nbsp;- DIAMOND<br />
              &nbsp;&nbsp;- COBBLESTONE
            </div>
          </div>

          <div className="bg-[#0b0d14] p-3.5 rounded-lg border border-cyan-800/60">
            <div className="flex items-center gap-1.5 font-bold text-cyan-400 font-mono mb-1">
              <Settings className="w-3.5 h-3.5" />
              config.yml (Where You Configure SELL Prices!)
            </div>
            <p className="text-slate-300 leading-relaxed">
              All <strong>sell prices</strong> for <code className="text-white font-mono">/sell</code>, <code className="text-white font-mono">/worth</code>, and shop buy prices are configured in <strong><code className="text-cyan-300 font-mono">config.yml</code></strong> under the <code className="text-cyan-300 font-mono">prices:</code> section or auto-calculated with <code className="text-cyan-300 font-mono">sell-price-ratio</code>.
            </p>
            <div className="bg-[#141824] p-2 mt-2 rounded font-mono text-[11px] text-cyan-300">
              prices:<br />
              &nbsp;&nbsp;DIAMOND:<br />
              &nbsp;&nbsp;&nbsp;&nbsp;buy: 5000.0<br />
              &nbsp;&nbsp;&nbsp;&nbsp;sell: 1000.0 <span className="text-slate-400"># &lt;-- Set sell price here!</span>
            </div>
          </div>
        </div>
      </div>

      {/* Header Banner */}
      <div className="bg-[#141824] p-5 rounded-xl border border-slate-800 shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            Central Pricing &amp; Dual-File Configuration Architecture
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            <strong className="text-slate-300">allowedbuy.yml</strong> controls /shop inventory exclusively. 
            <strong className="text-slate-300"> config.yml</strong> controls the central pricing database used for /shop, /worth, and /sell.
          </p>
        </div>

        <button
          onClick={onReloadPlugin}
          className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow flex items-center gap-1.5 transition-colors self-start md:self-center"
        >
          <Sliders className="w-3.5 h-3.5" />
          Simulate /arcedgeshop reload
        </button>
      </div>

      {/* Profit Loop Alert Banner (If any) */}
      {profitLoopIssues.length > 0 ? (
        <div className="bg-red-950/70 border border-red-500/80 p-4 rounded-xl flex items-start gap-3 shadow-md">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-red-200">
              Profit Loop Alert Detected!
            </h4>
            <p className="text-xs text-red-300/90 mt-1">
              The following item(s) have Sell Price &gt;= Buy Price, allowing infinite money duplication:
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {profitLoopIssues.map(([mat, p]) => (
                <span key={mat} className="px-2 py-0.5 rounded bg-red-900/60 border border-red-700 text-xs font-mono text-red-200">
                  {mat}: Buy ${p.buy} / Sell ${p.sell}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-red-400 mt-2 font-mono">
              ArcEdgeShop automated engine will clamp sell prices to 80% of buy in production to protect the economy.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-950/40 border border-emerald-700/60 p-3 rounded-xl flex items-center gap-2.5 text-xs text-emerald-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Profit Loop Guard Active:</strong> All items have buy price higher than sell price. Zero infinite-money arbitrage opportunities.
          </span>
        </div>
      )}

      {/* Fallback Pricing & Ratio Settings */}
      <div className="bg-[#141824] p-5 rounded-xl border border-slate-800 shadow">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          Fallback Auto-Pricing Engine (Configurable Defaults)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="bg-[#0c0e15] p-3.5 rounded-lg border border-slate-800">
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              default-buy-price ($)
            </label>
            <p className="text-[11px] text-slate-400 mb-2">Used if allowed item has no manual price</p>
            <input
              type="number"
              min="1"
              value={pricingConfig.defaultBuyPrice}
              onChange={(e) => updateDefaultPricing('defaultBuyPrice', Number(e.target.value))}
              className="w-full bg-[#141824] border border-slate-700 rounded px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="bg-[#0c0e15] p-3.5 rounded-lg border border-slate-800">
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              default-sell-price ($)
            </label>
            <p className="text-[11px] text-slate-400 mb-2">Base fallback sell value</p>
            <input
              type="number"
              min="1"
              value={pricingConfig.defaultSellPrice}
              onChange={(e) => updateDefaultPricing('defaultSellPrice', Number(e.target.value))}
              className="w-full bg-[#141824] border border-slate-700 rounded px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="bg-[#0c0e15] p-3.5 rounded-lg border border-slate-800">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-300">
                sell-price-ratio
              </label>
              <span className="text-xs font-bold text-cyan-400 font-mono">
                {(pricingConfig.sellPriceRatio * 100).toFixed(0)}% of Buy
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">Dynamic sell price ratio calculation</p>
            <input
              type="range"
              min="0.05"
              max="0.80"
              step="0.05"
              value={pricingConfig.sellPriceRatio}
              onChange={(e) => updateDefaultPricing('sellPriceRatio', Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer mt-2"
            />
          </div>

        </div>
      </div>

      {/* Allowedbuy.yml Item Selector Matrix */}
      <div className="bg-[#141824] p-5 rounded-xl border border-slate-800 shadow">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              allowedbuy.yml Item Management
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Currently allowing <strong className="text-emerald-400">{allowedItems.length}</strong> items in /shop. Click any item card to toggle allowed status.
            </p>
          </div>

          {/* Search & Category Filter */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#0c0e15] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-[#0c0e15] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Categories</option>
              <option value="building">Building</option>
              <option value="food">Food</option>
              <option value="combat">Combat</option>
              <option value="resources">Resources</option>
              <option value="modern_26">26.x Updates</option>
              <option value="rare">Progression / Rare</option>
            </select>
          </div>
        </div>

        {/* Item Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto pr-1">
          {filteredCatalog.map((item) => {
            const isAllowed = allowedItems.some((i) => i.id === item.id);
            const prices = resolveItemPrices(item, pricingConfig);

            return (
              <div
                key={item.id}
                onClick={() => toggleAllowedItem(item)}
                className={`p-3 rounded-lg border transition-all cursor-pointer select-none flex items-start justify-between gap-2.5 ${
                  isAllowed
                    ? 'bg-[#112224] border-emerald-500/70 shadow-sm'
                    : 'bg-[#0c0e15] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-9 h-9 rounded bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                    <ItemIcon item={item} size="sm" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white leading-tight">
                        {item.displayName}
                      </span>
                      {item.isRestricted && (
                        <span className="px-1 py-0.2 text-[9px] rounded bg-purple-900/60 text-purple-300 border border-purple-700/60 font-mono">
                          Rare
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {item.materialName}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] font-mono">
                      <span className="text-amber-300">Buy: ${prices.buy}</span>
                      <span className="text-slate-600">/</span>
                      <span className="text-emerald-400">Sell: ${prices.sell}</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 mt-0.5">
                  {isAllowed ? (
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                      <Check className="w-3 h-3" />
                    </span>
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 text-slate-500 flex items-center justify-center text-xs">
                      <Plus className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Manual Item Pricing & Sell Price Configuration Matrix */}
      <div className="bg-[#141824] p-5 rounded-xl border border-slate-800 shadow space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Item Buy &amp; Sell Price Configurator (config.yml)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Customize exact Buy and Sell prices for specific materials. These are saved directly to <code className="text-cyan-300 font-mono">prices:</code> in <code className="text-cyan-300 font-mono">config.yml</code>.
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2.5 py-1 rounded">
            Synchronized with /worth, /sell, and /shop
          </span>
        </div>

        {/* Selected Quick Pricing Editor */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(pricingConfig.manualPrices).map(([mat, price]) => {
            const mcItem = MINECRAFT_ITEMS.find((i) => i.materialName === mat);
            const isAllowedInShop = allowedItems.some((i) => i.materialName === mat);

            return (
              <div
                key={mat}
                className="bg-[#0c0e15] border border-slate-800 p-3.5 rounded-lg space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {mcItem && (
                      <div className="w-7 h-7 rounded bg-slate-800 flex items-center justify-center">
                        <ItemIcon item={mcItem} size="sm" />
                      </div>
                    )}
                    <div>
                      <h4 className="text-xs font-bold text-white leading-tight">
                        {mcItem ? mcItem.displayName : mat}
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400">
                        {mat}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                      isAllowedInShop
                        ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400'
                    }`}
                  >
                    {isAllowedInShop ? 'In /shop' : 'Sell-only'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] text-amber-400 font-mono block mb-1">
                      Buy Price ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={price.buy}
                      onChange={(e) => updateItemPrice(mat, 'buy', Number(e.target.value))}
                      className="w-full bg-[#141824] border border-slate-700 rounded px-2.5 py-1 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-emerald-400 font-mono block mb-1">
                      Sell Price ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={price.sell}
                      onChange={(e) => updateItemPrice(mat, 'sell', Number(e.target.value))}
                      className={`w-full bg-[#141824] border rounded px-2.5 py-1 text-xs font-mono text-white focus:outline-none ${
                        price.sell >= price.buy
                          ? 'border-red-500 text-red-300 focus:border-red-400'
                          : 'border-slate-700 focus:border-emerald-400'
                      }`}
                    />
                  </div>
                </div>

                {price.sell >= price.buy && (
                  <p className="text-[10px] text-red-400 font-mono">
                    Warning: Sell &gt;= Buy creates a profit loop!
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Live YAML File Inspector & Exporter */}
      <div className="bg-[#141824] p-5 rounded-xl border border-slate-800 shadow">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveYamlTab('allowedbuy')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeYamlTab === 'allowedbuy'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              allowedbuy.yml (Shop Items)
            </button>
            <button
              onClick={() => setActiveYamlTab('config')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeYamlTab === 'config'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              config.yml (Main Pricing)
            </button>
          </div>

          <button
            onClick={copyYaml}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            {copyFeedback ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copyFeedback ? 'Copied YAML!' : 'Copy File'}</span>
          </button>
        </div>

        <pre className="bg-[#090b10] p-4 rounded-lg border border-slate-800 text-xs font-mono text-emerald-400/90 overflow-x-auto max-h-72 leading-relaxed">
          {activeYamlTab === 'config' ? generatedConfigYaml : generatedAllowedBuyYaml}
        </pre>
      </div>

    </div>
  );
};
