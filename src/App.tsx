import React, { useState } from 'react';
import { MCItem, InventorySlot, ShopPricingConfig, TransactionLog } from './types';
import { MINECRAFT_ITEMS, DEFAULT_PRICING_CONFIG } from './data/items';
import { PLUGIN_SOURCE_FILES } from './data/pluginFiles';
import { COMPILED_JAR_BASE64 } from './data/compiledJar';
import { Navbar } from './components/Navbar';
import { ShopSimulator } from './components/ShopSimulator';
import { WorthSellTester } from './components/WorthSellTester';
import { ConfigStudio } from './components/ConfigStudio';
import { RegistryExplorer } from './components/RegistryExplorer';
import { SourceCodeViewer } from './components/SourceCodeViewer';
import { ResearchDocs } from './components/ResearchDocs';
import { ExploitTesterModal } from './components/ExploitTesterModal';
import JSZip from 'jszip';

export default function App() {
  const [activeTab, setActiveTab] = useState<'shop' | 'worth-sell' | 'config' | 'registry' | 'source' | 'research'>('shop');
  const [playerBalance, setPlayerBalance] = useState<number>(10000.0);
  const [selectedHandSlot, setSelectedHandSlot] = useState<number>(27); // First slot in Hotbar
  const [pricingConfig, setPricingConfig] = useState<ShopPricingConfig>(DEFAULT_PRICING_CONFIG);
  const [isExploitModalOpen, setIsExploitModalOpen] = useState<boolean>(false);

  // Default allowed items: strictly the 10 everyday useful items requested in prompt
  const [allowedItems, setAllowedItems] = useState<MCItem[]>(() => {
    return MINECRAFT_ITEMS.filter((item) => item.isAllowedBuyDefault);
  });

  // Initial Player Inventory (36 slots: 0-26 main bag, 27-35 hotbar)
  const [inventory, setInventory] = useState<InventorySlot[]>(() => {
    const slots: InventorySlot[] = Array.from({ length: 36 }, (_, i) => ({
      slotIndex: i,
      item: null,
      count: 0,
    }));

    // Seed realistic starting inventory items for immediate /worth and /sell testing
    const diamondItem = MINECRAFT_ITEMS.find((i) => i.id === 'diamond') || null;
    const cobbleItem = MINECRAFT_ITEMS.find((i) => i.id === 'cobblestone') || null;
    const breadItem = MINECRAFT_ITEMS.find((i) => i.id === 'bread') || null;
    const shieldItem = MINECRAFT_ITEMS.find((i) => i.id === 'shield') || null;
    const paleOak = MINECRAFT_ITEMS.find((i) => i.id === 'pale_oak_log') || null;

    slots[27] = { slotIndex: 27, item: diamondItem, count: 16 }; // Slot 1 in Hotbar: 16x Diamonds (matches prompt example!)
    slots[28] = { slotIndex: 28, item: cobbleItem, count: 64 };
    slots[29] = { slotIndex: 29, item: breadItem, count: 24 };
    slots[30] = { slotIndex: 30, item: shieldItem, count: 1 };
    slots[0] = { slotIndex: 0, item: paleOak, count: 8 };

    return slots;
  });

  // Transaction logging
  const [transactionLogs, setTransactionLogs] = useState<TransactionLog[]>([
    {
      id: 'init-1',
      timestamp: new Date().toLocaleTimeString(),
      type: 'RELOAD',
      details: 'Paper 26.1.2 - 26.3+ plugin loaded. 10 allowed items in /shop.',
      amountChange: 0,
      success: true,
    },
  ]);

  const addLog = (
    type: TransactionLog['type'],
    details: string,
    amountChange: number,
    success: boolean
  ) => {
    setTransactionLogs((prev) => [
      {
        id: Math.random().toString(),
        timestamp: new Date().toLocaleTimeString(),
        type,
        details,
        amountChange,
        success,
      },
      ...prev.slice(0, 49),
    ]);
  };

  // Reset simulation to factory state
  const handleResetSimulation = () => {
    setPlayerBalance(10000.0);
    setPricingConfig(DEFAULT_PRICING_CONFIG);
    setAllowedItems(MINECRAFT_ITEMS.filter((item) => item.isAllowedBuyDefault));

    const slots: InventorySlot[] = Array.from({ length: 36 }, (_, i) => ({
      slotIndex: i,
      item: null,
      count: 0,
    }));
    const diamondItem = MINECRAFT_ITEMS.find((i) => i.id === 'diamond') || null;
    const cobbleItem = MINECRAFT_ITEMS.find((i) => i.id === 'cobblestone') || null;
    const breadItem = MINECRAFT_ITEMS.find((i) => i.id === 'bread') || null;
    slots[27] = { slotIndex: 27, item: diamondItem, count: 16 };
    slots[28] = { slotIndex: 28, item: cobbleItem, count: 64 };
    slots[29] = { slotIndex: 29, item: breadItem, count: 24 };
    setInventory(slots);

    addLog('RELOAD', 'Simulation state and wallet reset to defaults.', 0, true);
  };

  // Download complete Java 25 project ZIP
  const handleDownloadZip = async () => {
    try {
      const zip = new JSZip();
      PLUGIN_SOURCE_FILES.forEach((file) => {
        zip.file(file.path, file.content);
      });
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'ArcEdgeShop-Paper26-Java25-Source.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error generating project ZIP:', e);
    }
  };

  // Download production Plugin JAR package (Real compiled bytecode .class files)
  const handleDownloadJar = () => {
    try {
      // Decode base64 to binary byte array for true jar
      const binaryString = window.atob(COMPILED_JAR_BASE64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/java-archive' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'ArcEdgeShop-1.0.0-SNAPSHOT.jar';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error serving compiled JAR:', e);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0f17] text-slate-100 flex flex-col font-sans">
      
      {/* Top Universal Quick-Download Banner */}
      <div className="bg-gradient-to-r from-emerald-950/90 via-[#101e2b] to-cyan-950/90 border-b border-emerald-500/40 px-4 py-2.5 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-bold text-white">ArcEdgeShop v1.0.0 for Paper 26.1.2 – 26.3+</span>
            <span className="text-slate-300 hidden md:inline">• Java 25 • Zero-Tick Lag • Dual config.yml &amp; allowedbuy.yml</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadJar}
              className="px-3 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>⬇ Download ArcEdgeShop.jar</span>
            </button>
            <button
              onClick={handleDownloadZip}
              className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Source .ZIP</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation & App Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        playerBalance={playerBalance}
        onOpenExploitTester={() => setIsExploitModalOpen(true)}
        onDownloadZip={handleDownloadZip}
        onDownloadJar={handleDownloadJar}
        onResetSimulation={handleResetSimulation}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'shop' && (
          <ShopSimulator
            allowedItems={allowedItems}
            inventory={inventory}
            setInventory={setInventory}
            playerBalance={playerBalance}
            setPlayerBalance={setPlayerBalance}
            pricingConfig={pricingConfig}
            transactionLogs={transactionLogs}
            addLog={addLog}
            selectedHandSlot={selectedHandSlot}
            setSelectedHandSlot={setSelectedHandSlot}
            onOpenExploitTester={() => setIsExploitModalOpen(true)}
          />
        )}

        {activeTab === 'worth-sell' && (
          <WorthSellTester
            inventory={inventory}
            setInventory={setInventory}
            playerBalance={playerBalance}
            setPlayerBalance={setPlayerBalance}
            pricingConfig={pricingConfig}
            selectedHandSlot={selectedHandSlot}
            setSelectedHandSlot={setSelectedHandSlot}
            addLog={addLog}
          />
        )}

        {activeTab === 'config' && (
          <ConfigStudio
            pricingConfig={pricingConfig}
            setPricingConfig={setPricingConfig}
            allowedItems={allowedItems}
            setAllowedItems={setAllowedItems}
            onReloadPlugin={() => {
              addLog('RELOAD', 'Reloaded config.yml and allowedbuy.yml', 0, true);
            }}
          />
        )}

        {activeTab === 'registry' && (
          <RegistryExplorer pricingConfig={pricingConfig} />
        )}

        {activeTab === 'source' && (
          <SourceCodeViewer onDownloadZip={handleDownloadZip} />
        )}

        {activeTab === 'research' && (
          <ResearchDocs />
        )}
      </main>

      {/* Exploit Simulator Modal */}
      <ExploitTesterModal
        isOpen={isExploitModalOpen}
        onClose={() => setIsExploitModalOpen(false)}
        addLog={addLog}
      />

      {/* Footer */}
      <footer className="bg-[#090b11] border-t border-slate-800/80 py-4 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            ArcEdgeShop System • Paper 26.1.2 - 26.3+ • Java 25 Toolchain
          </span>
          <span>
            Adventure MiniMessage • Dynamic RegistryAccess • Vault API
          </span>
        </div>
      </footer>

    </div>
  );
}
