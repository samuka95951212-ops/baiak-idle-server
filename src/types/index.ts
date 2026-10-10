export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  is_active: boolean;
  is_verified: boolean;
  verification_token?: string;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Player {
  id: string;
  user_id: string;
  character_name: string;
  level: number;
  experience: number;
  gold: number;
  gems: number;
  energy: number;
  max_energy: number;
  last_energy_update: Date;
  total_damage_dealt: number;
  total_harvested: number;
  total_playtime: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  last_action: Date;
}

export enum ItemType {
  POTION = 'potion',
  ARROW = 'arrow',
  RUNE = 'rune',
  EQUIPMENT = 'equipment',
}

export enum ItemRarity {
  COMMON = 'common',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

export interface ItemType_DB {
  id: string;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  description: string;
  base_effect: number;
  max_quantity: number;
  is_infinite: boolean;
  created_at: Date;
}

export enum ActionType {
  HARVEST = 'harvest',
  ATTACK = 'attack',
  UPGRADE = 'upgrade',
  ITEM_USE = 'item_use',
}

export interface ActionLog {
  id: string;
  player_id: string;
  action_type: ActionType;
  action_data: Record<string, any>;
  reward_gold: number;
  reward_experience: number;
  result: 'success' | 'failed' | 'pending';
  created_at: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: Record<string, any> };
  timestamp: Date;
  requestId: string;
}

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public errorCode?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}