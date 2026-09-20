import React from 'react';
import { BookOpen, Cpu, ShieldCheck, Zap, Database, CheckCircle2, Terminal } from 'lucide-react';

export const ResearchDocs: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Overview Banner */}
      <div className="bg-[#141824] p-6 rounded-xl border border-slate-800 shadow">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-cyan-950/80 border border-cyan-800 flex items-center justify-center text-cyan-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              Paper 26.1.2 - 26.3+ Architecture &amp; Compatibility Research
            </h2>
            <p className="text-xs text-slate-400">
              Modern Paper API standards, Java 25 toolchains, dynamic registry discovery, and exploit mitigation.
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: Dynamic Registry & Auto-Discovery */}
      <div className="bg-[#141824] p-6 rounded-xl border border-slate-800 shadow space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
          <Database className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-bold text-white">
            1. How ArcEdgeShop Automatically Discovers Every Item in 26.1.2 through 26.3+
          </h3>
        </div>

        <div className="text-sm text-slate-300 space-y-3 leading-relaxed">
          <p>
            In legacy Bukkit/Spigot plugins, developers relied on static enums like <code className="text-red-400 bg-red-950/40 px-1 py-0.5 rounded font-mono text-xs">Material.valueOf(name)</code> or hardcoded material arrays. Whenever Mojang released a minor or major update (such as 1.21.x or 26.1 - 26.3), any new item added to the game (e.g., Pale Garden blocks, Resin Clumps, Creaking Hearts, Bundles, Breeze Rods) would either throw <code className="text-red-400 font-mono text-xs">IllegalArgumentException</code> or simply fail to exist in the shop.
          </p>
          <p>
            <strong>ArcEdgeShop solves this using modern Paper RegistryAccess:</strong>
          </p>
          <div className="bg-[#090b10] p-4 rounded-lg border border-slate-800 font-mono text-xs text-cyan-300 overflow-x-auto">
            <span className="text-slate-500">// Dynamic runtime registry resolution in Paper 26.x:</span><br />
            Registry&lt;ItemType&gt; registry = RegistryAccess.registryAccess().getRegistry(RegistryKey.ITEM);<br />
            for (ItemType itemType : registry) &#123;<br />
            &nbsp;&nbsp;&nbsp;&nbsp;NamespacedKey key = itemType.getKey(); <span className="text-slate-500">// e.g. "minecraft:resin_clump"</span><br />
            &nbsp;&nbsp;&nbsp;&nbsp;Material mat = Material.matchMaterial(key.asString());<br />
            &nbsp;&nbsp;&nbsp;&nbsp;registerDynamicItem(key.getKey().toUpperCase(), mat);<br />
            &#125;
          </div>
          <ul className="space-y-1.5 list-disc pl-5 text-xs text-slate-300">
            <li><strong>Zero Recompilation Needed</strong>: When your server updates from 26.1.2 to 26.2, 26.3, or upcoming snapshots, Paper registers the new item types into the server registry on startup. ArcEdgeShop indexes them dynamically without requiring a plugin update.</li>
            <li><strong>Zero NMS or Reflection Hacks</strong>: Does not use <code className="font-mono text-xs text-slate-200">net.minecraft.server</code> internals or reflection, guaranteeing stability across Paper build releases.</li>
            <li><strong>Java 25 Native</strong>: Compiled with <code className="font-mono text-xs text-slate-200">&lt;release&gt;25&lt;/release&gt;</code> to utilize the latest JVM performance improvements and modern record structures.</li>
          </ul>
        </div>
      </div>

      {/* Section 2: Atomic Transactions & Anti-Dupe */}
      <div className="bg-[#141824] p-6 rounded-xl border border-slate-800 shadow space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-bold text-white">
            2. Atomic Economy &amp; Duplication Prevention Architecture
          </h3>
        </div>

        <div className="text-sm text-slate-300 space-y-3 leading-relaxed">
          <p>
            Economy exploits typically occur when:
          </p>
          <ol className="list-decimal pl-5 space-y-1 text-xs text-slate-300">
            <li>A player triggers multiple packets simultaneously (e.g. macro auto-clickers) before the database writes the updated balance.</li>
            <li>A player buys items when their inventory is full, causing money to be taken or items to vanish.</li>
            <li>A player uses Shift-Click, Number-Key swaps, or inventory drag packets to clone items from GUI slots.</li>
          </ol>

          <p className="pt-2"><strong>How ArcEdgeShop blocks every attack vector:</strong></p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="bg-[#0b0d14] p-3.5 rounded-lg border border-slate-800">
              <h4 className="font-bold text-cyan-300 mb-1">Two-Phase Verification Order</h4>
              <p className="text-slate-400">
                In <code className="font-mono text-slate-200">/sell</code>, items are verified and cleared from the player inventory <em>first</em>. If the Vault transaction fails or throws, items are rolled back safely. In <code className="font-mono text-slate-200">/shop</code>, inventory stack space is validated before withdrawing any money.
              </p>
            </div>
            <div className="bg-[#0b0d14] p-3.5 rounded-lg border border-slate-800">
              <h4 className="font-bold text-cyan-300 mb-1">Custom InventoryHolder Identification</h4>
              <p className="text-slate-400">
                The shop GUI implements <code className="font-mono text-slate-200">ShopGUI implements InventoryHolder</code>. <code className="font-mono text-slate-200">ShopListener</code> cancels all clicks, drags, and number-key hotbar swaps unconditionally on priority <code className="font-mono text-slate-200">HIGHEST</code>.
              </p>
            </div>
            <div className="bg-[#0b0d14] p-3.5 rounded-lg border border-slate-800">
              <h4 className="font-bold text-cyan-300 mb-1">Concurrent UUID Lock &amp; Cooldown</h4>
              <p className="text-slate-400">
                A thread-safe <code className="font-mono text-slate-200">Set&lt;UUID&gt; activeTransactions</code> prevents the same player from firing concurrent transactions. A 250ms cooldown prevents packet spamming.
              </p>
            </div>
            <div className="bg-[#0b0d14] p-3.5 rounded-lg border border-slate-800">
              <h4 className="font-bold text-cyan-300 mb-1">Profit Loop Guard</h4>
              <p className="text-slate-400">
                Central configuration automatically detects and clamps any item price where <code className="font-mono text-slate-200">sell &gt;= buy</code>, preventing infinite money generation exploits.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Event-Driven Tooltips */}
      <div className="bg-[#141824] p-6 rounded-xl border border-slate-800 shadow space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
          <Zap className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-bold text-white">
            3. Zero-Lag Event-Driven Tooltips (No Repeating Tasks)
          </h3>
        </div>

        <div className="text-sm text-slate-300 space-y-3 leading-relaxed">
          <p>
            The user prompt requested:
            <em className="text-slate-400 block pl-3 border-l-2 border-amber-400 my-1">
              "No repeating 5-second task just to calculate prices. No per-tick inventory scanning. Event-driven design. Cache loaded prices."
            </em>
          </p>
          <p>
            Instead of running a scheduled Bukkit task that loops through every online player's 36 inventory slots every 5 seconds (which causes severe tick lag spikes on 100+ player servers), ArcEdgeShop uses:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-slate-300">
            <li><strong>Event Hooks</strong>: Listens to <code className="font-mono text-cyan-300">InventoryOpenEvent</code> and <code className="font-mono text-cyan-300">EntityPickupItemEvent</code>.</li>
            <li><strong>PersistentDataContainer (PDC) Marker</strong>: When an item's sell value lore is added, a lightweight byte tag (<code className="font-mono text-cyan-300">arcedge_worth_tagged</code>) is written to the item's PDC. When the item is inspected later, the tag check is instant (<code className="font-mono text-slate-200">O(1)</code>), preventing repeated string concatenation and lore rebuilding.</li>
            <li><strong>Thread-Safe Price Cache</strong>: All prices are pre-resolved in a <code className="font-mono text-cyan-300">ConcurrentHashMap&lt;Material, ItemPrice&gt;</code> on reload.</li>
          </ul>
        </div>
      </div>

      {/* Section 4: Dual-File Configuration Architecture */}
      <div className="bg-[#141824] p-6 rounded-xl border border-slate-800 shadow space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
          <Terminal className="w-5 h-5 text-purple-400" />
          <h3 className="text-base font-bold text-white">
            4. Dual-File Separation: config.yml vs. allowedbuy.yml
          </h3>
        </div>

        <div className="text-sm text-slate-300 space-y-3 leading-relaxed">
          <p>
            Server owners need simple, error-free management. By separating <code className="font-mono text-cyan-300">allowedbuy.yml</code> from <code className="font-mono text-cyan-300">config.yml</code>:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-slate-300">
            <li><strong>allowedbuy.yml</strong> contains strictly the list of materials that can be purchased in the <code className="font-mono text-slate-200">/shop</code> GUI. Defaulted to the 10 requested everyday items (Cobblestone, Stone, Oak Log, Iron Ingot, Bread, Cooked Beef, Arrow, Shield, Golden Apple, Diamond). Rare items (Elytra, Nether Star, Beacon) are blocked by default.</li>
            <li><strong>config.yml</strong> holds the central pricing engine, GUI styling, sound effects, security timings, and messages.</li>
            <li>Server admins can freely add or remove shop items in <code className="font-mono text-slate-200">allowedbuy.yml</code> without risking accidental syntax errors in the central pricing or permissions blocks.</li>
          </ul>
        </div>
      </div>

    </div>
  );
};
