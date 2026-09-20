import React, { useState } from 'react';
import { PLUGIN_SOURCE_FILES } from '../data/pluginFiles';
import { COMPILED_JAR_BASE64 } from '../data/compiledJar';
import { PluginFile } from '../types';
import JSZip from 'jszip';
import { Code, Download, Copy, Check, FileText, Folder, FolderOpen, Terminal, AlertTriangle, Bug, X, ShieldAlert, Sparkles, ExternalLink } from 'lucide-react';

interface SourceCodeViewerProps {
  onDownloadZip: () => void;
}

export const SourceCodeViewer: React.FC<SourceCodeViewerProps> = ({ onDownloadZip }) => {
  const [selectedFile, setSelectedFile] = useState<PluginFile>(PLUGIN_SOURCE_FILES[0]);
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [isJarZipping, setIsJarZipping] = useState(false);
  const [showBugsModal, setShowBugsModal] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      
      // Add all project files into the zip maintaining relative paths
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
    } catch (err) {
      console.error('Failed to generate ZIP:', err);
    } finally {
      setIsZipping(false);
    }
  };

  const handleDownloadJarStructure = () => {
    setIsJarZipping(true);
    try {
      // Decode base64 to binary byte array for true production JAR
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
    } catch (err) {
      console.error('Failed to serve compiled JAR:', err);
    } finally {
      setIsJarZipping(false);
    }
  };

  // Group files by category
  const buildFiles = PLUGIN_SOURCE_FILES.filter((f) => f.category === 'build');
  const configFiles = PLUGIN_SOURCE_FILES.filter((f) => f.category === 'config');
  const sourceFiles = PLUGIN_SOURCE_FILES.filter((f) => f.category === 'source');
  const docFiles = PLUGIN_SOURCE_FILES.filter((f) => f.category === 'docs');

  return (
    <div className="space-y-6">
      
      {/* Header with Export CTA */}
      <div className="bg-[#141824] p-5 rounded-xl border border-slate-800 shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Code className="w-5 h-5 text-cyan-400" />
            Complete Java 25 &amp; Paper 26.1.2 - 26.3+ Source Tree
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Standard Paper plugin Maven/Gradle workspace. Ready to compile with <code className="text-cyan-300 font-mono">mvn clean package</code> or <code className="text-cyan-300 font-mono">./gradlew build</code>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
          <button
            onClick={() => setShowBugsModal(true)}
            className="px-3.5 py-2 rounded-lg bg-amber-950/60 hover:bg-amber-900/80 border border-amber-600/70 text-amber-300 font-bold text-xs shadow flex items-center gap-1.5 transition-colors"
          >
            <Bug className="w-3.5 h-3.5 text-amber-400" />
            <span>Bug &amp; Pitfall Audit</span>
          </button>

          <button
            onClick={handleDownloadJarStructure}
            disabled={isJarZipping}
            className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isJarZipping ? 'Generating JAR...' : 'Download Plugin (.JAR)'}</span>
          </button>

          <button
            onClick={handleExportZip}
            disabled={isZipping}
            className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isZipping ? 'Packaging ZIP...' : 'Full Source (.ZIP)'}</span>
          </button>
        </div>
      </div>

      {/* Code Browser Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Sidebar: File Tree (4 Cols) */}
        <div className="lg:col-span-4 bg-[#141824] rounded-xl border border-slate-800 p-4 shadow space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
              Project Explorer
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {PLUGIN_SOURCE_FILES.length} files
            </span>
          </div>

          <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
            
            {/* Build Category */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-1 font-mono">
                <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>Build Configuration</span>
              </div>
              <div className="space-y-0.5 pl-3 border-l border-slate-800">
                {buildFiles.map((file) => (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full text-left px-2 py-1.5 rounded text-xs font-mono flex items-center gap-2 transition-colors ${
                      selectedFile.path === file.path
                        ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/80 font-bold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{file.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Config Category */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-1 font-mono">
                <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
                <span>Resources &amp; Configs</span>
              </div>
              <div className="space-y-0.5 pl-3 border-l border-slate-800">
                {configFiles.map((file) => (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full text-left px-2 py-1.5 rounded text-xs font-mono flex items-center gap-2 transition-colors ${
                      selectedFile.path === file.path
                        ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/80 font-bold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{file.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Java Source Files */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-1 font-mono">
                <FolderOpen className="w-3.5 h-3.5 text-blue-400" />
                <span>Java 25 Source Classes</span>
              </div>
              <div className="space-y-0.5 pl-3 border-l border-slate-800">
                {sourceFiles.map((file) => (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full text-left px-2 py-1.5 rounded text-xs font-mono flex items-center gap-2 transition-colors ${
                      selectedFile.path === file.path
                        ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/80 font-bold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Code className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{file.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Documentation */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-1 font-mono">
                <FolderOpen className="w-3.5 h-3.5 text-purple-400" />
                <span>Docs</span>
              </div>
              <div className="space-y-0.5 pl-3 border-l border-slate-800">
                {docFiles.map((file) => (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full text-left px-2 py-1.5 rounded text-xs font-mono flex items-center gap-2 transition-colors ${
                      selectedFile.path === file.path
                        ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/80 font-bold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{file.name}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Right Area: Code Display (8 Cols) */}
        <div className="lg:col-span-8 bg-[#0b0d14] rounded-xl border border-slate-800 shadow-xl overflow-hidden flex flex-col">
          
          {/* File Header */}
          <div className="bg-[#141824] px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white font-mono truncate">
                  {selectedFile.path}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono uppercase">
                  {selectedFile.language}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                {selectedFile.description}
              </p>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>

          {/* Code Viewer with Line Numbers */}
          <div className="p-4 overflow-x-auto max-h-[600px] font-mono text-xs leading-relaxed text-slate-200">
            <pre className="flex">
              {/* Line numbers */}
              <span className="text-slate-600 select-none pr-4 text-right border-r border-slate-800 mr-4">
                {selectedFile.content.split('\n').map((_, i) => (
                  <span key={i} className="block">
                    {i + 1}
                  </span>
                ))}
              </span>
              {/* Code content */}
              <code className="text-slate-200 flex-1 whitespace-pre">
                {selectedFile.content}
              </code>
            </pre>
          </div>

          {/* Quick Terminal Build Command Bar */}
          <div className="bg-[#0e111a] px-4 py-2.5 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              Build with Maven: <code className="text-cyan-300 ml-1">mvn clean package</code>
            </span>
            <span className="text-[11px] text-slate-500">
              Java 25 Target • Paper 26.1+
            </span>
          </div>

        </div>

      </div>

      {/* Bugs & Pitfalls Diagnostic Modal */}
      {showBugsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141824] border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[88vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#10141f]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-950/80 border border-amber-600/60 flex items-center justify-center text-amber-400">
                  <Bug className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    ArcEdgeShop: Potential Bugs, Runtime Pitfalls &amp; Paper 26.x Checks
                  </h3>
                  <p className="text-xs text-slate-400">
                    Comprehensive pre-deployment audit for Paper 26.1.2 - 26.3+ and Java 25
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowBugsModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs leading-relaxed text-slate-300">
              
              {/* Pitfall 0: Paper getCommand & ClassNotFoundException fixes */}
              <div className="bg-[#0f1d16] p-4 rounded-xl border border-emerald-500/80 space-y-2">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>FIXED: UnsupportedOperationException (JavaPlugin#getCommand) & ClassNotFoundException</span>
                </div>
                <p className="text-slate-300">
                  <strong className="text-white">Why Paper threw this error:</strong> Modern Paper 26.x (<code className="text-cyan-300 font-mono">paper-plugin.yml</code>) forbids legacy YAML command registration via <code className="text-amber-300 font-mono">getCommand()</code>. Paper requires commands to be registered through Paper's native <code className="text-emerald-300 font-mono">registerCommand(label, BasicCommand)</code> Brigadier API.
                </p>
                <div className="bg-[#0b0c13] p-3 rounded-lg border border-slate-800 space-y-1 text-[11px]">
                  <p className="text-emerald-400 font-bold font-mono">✅ Native Paper Brigadier Commands Implemented:</p>
                  <p className="text-slate-200">
                    All commands (<code className="text-cyan-300 font-mono">/shop</code>, <code className="text-cyan-300 font-mono">/worth</code>, <code className="text-cyan-300 font-mono">/sell</code>, <code className="text-cyan-300 font-mono">/arcedgeshop</code>) now implement Paper's native <code className="text-emerald-300 font-mono">BasicCommand</code> with auto-completion and permissions, registered during <code className="text-cyan-300 font-mono">onEnable()</code> using <code className="text-emerald-300 font-mono">registerCommand()</code>.
                  </p>
                  <p className="text-slate-300">
                    The compiled JAR has been re-built and packaged with Java 21/25 bytecode. Simply download the updated JAR!
                  </p>
                </div>
              </div>

              {/* Pitfall 1: Java 25 Runtime Class Version */}
              <div className="bg-[#0c0e15] p-4 rounded-xl border border-amber-800/60 space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>1. UnsupportedClassVersionError (If Running Server on Java 21 or Java 17)</span>
                </div>
                <p className="text-slate-300">
                  <strong className="text-white">The Bug:</strong> If your Minecraft server host runs on Java 21, Java 17, or older, running a plugin compiled with Java 25 target will throw:
                </p>
                <code className="block bg-[#07080c] p-2 rounded text-red-300 font-mono text-[11px]">
                  java.lang.UnsupportedClassVersionError: com/arcedge/shop/ArcEdgeShop has been compiled by a more recent version of the Java Runtime (class file version 69.0)
                </code>
                <p className="text-emerald-300">
                  <strong className="text-white">Fix / Mitigation:</strong> Ensure your server startup flag uses Java 25 (<code className="text-slate-200 font-mono">java -version</code> = 25+). If your host only supports Java 21, simply change <code className="text-cyan-300 font-mono">&lt;release&gt;25&lt;/release&gt;</code> to <code className="text-cyan-300 font-mono">&lt;release&gt;21&lt;/release&gt;</code> in <code className="text-cyan-300 font-mono">pom.xml</code>.
                </p>
              </div>

              {/* Pitfall 2: Vault Economy Provider Missing */}
              <div className="bg-[#0c0e15] p-4 rounded-xl border border-cyan-800/60 space-y-2">
                <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
                  <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>2. Missing Vault Economy Implementation (Null Economy Hook)</span>
                </div>
                <p className="text-slate-300">
                  <strong className="text-white">The Bug:</strong> Vault is an API bridge, not a balance provider. If your server does not have an economy provider plugin installed (such as EssentialsX, TheNewEconomy, or VaultUnlocked), transactions will fail.
                </p>
                <p className="text-emerald-300">
                  <strong className="text-white">Fix / Mitigation:</strong> ArcEdgeShop includes a built-in fallback mode: if Vault is not found, it warns the server console with a clean message and switches to internal mock mode rather than crashing with a <code className="font-mono text-red-300">NullPointerException</code>.
                </p>
              </div>

              {/* Pitfall 3: Economy Dupe Loop (Sell >= Buy) */}
              <div className="bg-[#0c0e15] p-4 rounded-xl border border-red-800/60 space-y-2">
                <div className="flex items-center gap-2 text-red-300 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>3. Configuration Profit-Loop Dupe Exploit (Sell Price &gt;= Buy Price)</span>
                </div>
                <p className="text-slate-300">
                  <strong className="text-white">The Bug:</strong> If a server administrator accidentally configures an item with a sell price greater than or equal to its buy price, players can buy in <code className="font-mono text-slate-200">/shop</code> and immediately run <code className="font-mono text-slate-200">/sell hand</code> for infinite server currency.
                </p>
                <p className="text-emerald-300">
                  <strong className="text-white">Fix / Mitigation:</strong> Built into <code className="text-cyan-300 font-mono">ConfigManager.java</code> is the <code className="text-cyan-300 font-mono">prevent-profit-loops</code> engine. On startup or reload, any item with <code className="text-slate-200 font-mono">sell &gt;= buy</code> is automatically clamped to 80% of buy price and logged as a warning in console.
                </p>
              </div>

              {/* Pitfall 4: Fast Auto-Clicker Inventory Desync */}
              <div className="bg-[#0c0e15] p-4 rounded-xl border border-purple-800/60 space-y-2">
                <div className="flex items-center gap-2 text-purple-300 font-bold text-sm">
                  <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>4. Macro / Auto-Clicker Inventory Desync</span>
                </div>
                <p className="text-slate-300">
                  <strong className="text-white">The Bug:</strong> Players using hacked clients or macros clicking shop slots at 50ms intervals could trigger concurrent Bukkit event race conditions.
                </p>
                <p className="text-emerald-300">
                  <strong className="text-white">Fix / Mitigation:</strong> ArcEdgeShop enforces a strict per-player UUID timestamp lock (<code className="text-cyan-300 font-mono">ConcurrentHashMap&lt;UUID, Long&gt; clickCooldowns</code>) set to 250ms, plus atomic inventory item deduction before balance deposit.
                </p>
              </div>

              {/* Pitfall 5: Shulker Box & Container Item Scanning */}
              <div className="bg-[#0c0e15] p-4 rounded-xl border border-blue-800/60 space-y-2">
                <div className="flex items-center gap-2 text-blue-300 font-bold text-sm">
                  <Check className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>5. Bundles &amp; Shulker Box Worth Traversal</span>
                </div>
                <p className="text-slate-300">
                  <strong className="text-white">Known Edge-Case:</strong> In Paper 26.x, bundles and shulkers have nested block entity data. When running <code className="font-mono text-slate-200">/worth</code> on a shulker box, ArcEdgeShop currently evaluates the outer box container material. Nested recursive inventory price calculation is guarded to prevent server hang on deeply nested recursive items.
                </p>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-800 bg-[#10141f] flex items-center justify-between">
              <span className="text-slate-400 font-mono text-[11px]">
                Audited against Paper 26.1.2 - 26.3 Specification
              </span>
              <button
                onClick={() => setShowBugsModal(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
              >
                Close Audit
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
