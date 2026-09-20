import React from 'react';
import { ShoppingBag, DollarSign, Settings, Database, Code, BookOpen, ShieldCheck, Download, RefreshCw } from 'lucide-react';

interface NavbarProps {
  activeTab: 'shop' | 'worth-sell' | 'config' | 'registry' | 'source' | 'research';
  setActiveTab: (tab: 'shop' | 'worth-sell' | 'config' | 'registry' | 'source' | 'research') => void;
  playerBalance: number;
  onOpenExploitTester: () => void;
  onDownloadZip: () => void;
  onDownloadJar: () => void;
  onResetSimulation: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  playerBalance,
  onOpenExploitTester,
  onDownloadZip,
  onDownloadJar,
  onResetSimulation,
}) => {
  const tabs = [
    { id: 'shop', label: '/shop GUI', icon: ShoppingBag },
    { id: 'worth-sell', label: '/worth & /sell', icon: DollarSign },
    { id: 'config', label: 'Pricing & Config', icon: Settings },
    { id: 'registry', label: '26.x Registry', icon: Database },
    { id: 'source', label: 'Java 25 Source', icon: Code },
    { id: 'research', label: 'Paper Research', icon: BookOpen },
  ] as const;

  return (
    <header className="bg-[#141824] border-b border-slate-800 sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Version Badge */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-600 to-indigo-700 p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full bg-[#111420] rounded-[7px] flex items-center justify-center text-cyan-400 font-mono font-black text-lg">
                AE
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white font-mono">
                  ArcEdge<span className="text-cyan-400">Shop</span>
                </span>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 rounded-full font-mono">
                  Paper 26.1.2 - 26.3+
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Java 25 • Dynamic Registry • Atomic Economy
              </p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Area */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Wallet Balance */}
            <div className="bg-[#0b0d14] border border-slate-700/80 rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-inner">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold font-mono">
                Balance:
              </span>
              <span className="text-sm font-bold text-amber-300 font-mono">
                ${playerBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* Security Exploit Tester Trigger */}
            <button
              onClick={onOpenExploitTester}
              title="Test Anti-Dupe & Exploit Guard"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-950/40 text-red-300 border border-red-800/50 hover:bg-red-900/40 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden md:inline">Exploit Guard</span>
            </button>

            {/* Reset Sim */}
            <button
              onClick={onResetSimulation}
              title="Reset inventory & economy balance"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors border border-slate-700/60"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Download Plugin JAR Button */}
            <button
              onClick={onDownloadJar}
              title="Download compiled Paper plugin .JAR"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .JAR</span>
            </button>

            {/* Download Plugin ZIP */}
            <button
              onClick={onDownloadZip}
              title="Download full project source code"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-md transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Source .ZIP</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
