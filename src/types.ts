export type ItemCategory = 'combat' | 'building' | 'food' | 'tools' | 'resources' | 'modern_26' | 'rare';

export interface MCItem {
  id: string;
  materialName: string;
  displayName: string;
  category: ItemCategory;
  versionAdded: string; // e.g. "Vanilla", "1.21", "26.1", "26.2", "26.3"
  isAllowedBuyDefault: boolean;
  isRestricted: boolean;
  manualBuy?: number;
  manualSell?: number;
  maxStackSize: number;
  iconSvg?: string;
  description: string;
}

export interface InventorySlot {
  slotIndex: number;
  item: MCItem | null;
  count: number;
}

export interface ShopPricingConfig {
  defaultBuyPrice: number;
  defaultSellPrice: number;
  sellPriceRatio: number;
  manualPrices: Record<string, { buy: number; sell: number }>;
}

export interface PluginFile {
  path: string;
  name: string;
  language: string;
  category: 'build' | 'config' | 'source' | 'docs';
  content: string;
  description: string;
}

export interface TransactionLog {
  id: string;
  timestamp: string;
  type: 'BUY' | 'SELL' | 'EXPLOIT_BLOCKED' | 'WORTH_CHECK' | 'RELOAD';
  details: string;
  amountChange: number;
  success: boolean;
}
