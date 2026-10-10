// Sistema de 100 Hunts + Progressão Infinita
// Estrutura de dados para hunts, monstros, loot e progressão

export enum HuntRegion {
  TERRAS_INICIAIS = 'terras_iniciais',
  REINOS_SELVAGENS = 'reinos_selvagens',
  ABISMO_SOMBRIO = 'abismo_sombrio',
  IMPERIO_DRACONICO = 'imperio_draconico',
  INFERNO_ETERNO = 'inferno_eterno',
  REINO_GLACIAL = 'reino_glacial',
  DIMENSAO_ARCANA = 'dimensao_arcana',
  MUNDOS_CORROMPIDOS = 'mundos_corrompidos',
  PLANO_CELESTIAL = 'plano_celestial',
  VAZIO_INFINITO = 'vazio_infinito',
}

export enum MonsterModifier {
  NONE = 'none',
  FRENETICO = 'frenetico', // +50% dano, -20% defesa
  BLINDADO = 'blindado', // +30% vida, +40% defesa
  VAMPIRICO = 'vampirico', // +20% vida roubada por ataque
  ANCESTRAL = 'ancestral', // +100% vida, +50% dano, habilidades especiais
  CORRUPTO = 'corrupto', // +40% dano, causa debuffs
  CONGELANTE = 'congelante', // -30% velocidade do player, +20% dano
  ESPECTRAL = 'espectral', // 20% chance de não receber dano
}

export enum LootRarity {
  COMUM = 'comum',
  INCOMUM = 'incomum',
  RARO = 'raro',
  EPICO = 'epico',
  LENDARIO = 'lendario',
  MITICO = 'mitico',
}

export interface Monster {
  id: string;
  name: string;
  health: number;
  damage: number;
  defense: number;
  speed: number; // Velocidade de ataque (1.0 = normal)
  experienceReward: number; // XP base
  goldReward: number; // Ouro base
  modifier: MonsterModifier;
  abilities?: string[]; // Habilidades especiais
}

export interface LootTable {
  rarity: LootRarity;
  name: string;
  itemType: string;
  dropChance: number; // 0 a 1 (0% a 100%)
  quantity: { min: number; max: number };
  bonusStats?: {
    damage?: number;
    defense?: number;
    health?: number;
  };
}

export interface Hunt {
  id: string;
  huntNumber: number; // 1 a 100
  region: HuntRegion;
  name: string;
  description: string;
  minLevel: number;
  recommendedLevel: number;
  monsters: Monster[];
  lootTables: LootTable[];
  experienceMultiplier: number; // Multiplicador base
  goldMultiplier: number; // Multiplicador base
  unlockedBy: string | null; // ID da hunt anterior (null = desbloqueada por padrão)
  eliteBoss?: Monster; // Boss de elite opcional
  collectionBonus?: {
    itemsRequired: number;
    bonusPercentage: number; // Bônus permanente por colecionar
  };
  specialMechanics?: string[]; // Mecânicas únicas da hunt
}

export interface InfiniteFloor {
  floorNumber: number;
  level: number;
  healthMultiplier: number;
  damageMultiplier: number;
  experienceMultiplier: number;
  goldMultiplier: number;
  modifierChance: number; // Chance de ter modificador (aumenta a cada andar)
  recommendedPower: number; // Poder recomendado do player
}

export interface PlayerProgress {
  huntsCompleted: number[]; // Array de IDs de hunts desbloqueadas
  currentHunt: string; // Hunt atual
  collectedMonsters: { [monsterId: string]: number }; // Contagem de derrotas
  infiniteFloor: number; // Andar atual nos infinitos
  totalKills: number; // Total de kills
  offlineEarnings: {
    experience: number;
    gold: number;
    lastCalculated: Date;
  };
}

export interface HuntStatistics {
  huntId: string;
  monstersDefeated: number;
  experienceGained: number;
  goldGained: number;
  itemsLooted: number;
  averageTimePerKill: number; // Em segundos
  profitabilityScore: number; // XP/min ou Gold/min
  lastHunted: Date;
}

// Fórmulas de progressão
export const ProgressionFormulas = {
  // Experiência necessária para próximo nível
  experienceForLevel: (level: number): number => {
    return Math.floor(100 * Math.pow(1.15, level - 1));
  },

  // Vida base do monstro por nível de hunt
  monsterHealth: (huntLevel: number): number => {
    return Math.floor(50 * Math.pow(1.12, huntLevel / 10));
  },

  // Dano base do monstro por nível de hunt
  monsterDamage: (huntLevel: number): number => {
    return Math.floor(5 * Math.pow(1.1, huntLevel / 10));
  },

  // Experiência base por kill
  baseExperience: (huntLevel: number): number => {
    return Math.floor(10 * Math.pow(1.08, huntLevel / 10));
  },

  // Ouro base por kill
  baseGold: (huntLevel: number): number => {
    return Math.floor(5 * Math.pow(1.07, huntLevel / 10));
  },

  // Multiplicador de dano com modificadores
  applyModifier: (baseDamage: number, modifier: MonsterModifier): number => {
    const modifiers: { [key in MonsterModifier]: number } = {
      [MonsterModifier.NONE]: 1.0,
      [MonsterModifier.FRENETICO]: 1.5,
      [MonsterModifier.BLINDADO]: 0.8,
      [MonsterModifier.VAMPIRICO]: 1.2,
      [MonsterModifier.ANCESTRAL]: 1.5,
      [MonsterModifier.CORRUPTO]: 1.4,
      [MonsterModifier.CONGELANTE]: 1.2,
      [MonsterModifier.ESPECTRAL]: 1.1,
    };
    return Math.floor(baseDamage * (modifiers[modifier] || 1.0));
  },

  // Multiplicador de vida com modificadores
  applyHealthModifier: (baseHealth: number, modifier: MonsterModifier): number => {
    const modifiers: { [key in MonsterModifier]: number } = {
      [MonsterModifier.NONE]: 1.0,
      [MonsterModifier.FRENETICO]: 0.8,
      [MonsterModifier.BLINDADO]: 1.3,
      [MonsterModifier.VAMPIRICO]: 1.1,
      [MonsterModifier.ANCESTRAL]: 2.0,
      [MonsterModifier.CORRUPTO]: 1.15,
      [MonsterModifier.CONGELANTE]: 1.05,
      [MonsterModifier.ESPECTRAL]: 1.2,
    };
    return Math.floor(baseHealth * (modifiers[modifier] || 1.0));
  },

  // Cálculo do andar infinito
  infiniteFloorStats: (floorNumber: number): InfiniteFloor => {
    const baseLevel = 100000; // Nível base dos infinitos
    return {
      floorNumber,
      level: baseLevel + floorNumber * 100,
      healthMultiplier: Math.pow(1.05, floorNumber),
      damageMultiplier: Math.pow(1.04, floorNumber),
      experienceMultiplier: Math.pow(1.03, floorNumber),
      goldMultiplier: Math.pow(1.03, floorNumber),
      modifierChance: Math.min(0.9, 0.1 + floorNumber * 0.005),
      recommendedPower: baseLevel + floorNumber * 100,
    };
  },

  // Ganho offline (máximo 8 horas)
  calculateOfflineEarnings: (
    lastHunt: string,
    timeOfflineMinutes: number,
    playerPower: number
  ): { experience: number; gold: number } => {
    const maxOfflineMinutes = 8 * 60; // 8 horas
    const actualMinutes = Math.min(timeOfflineMinutes, maxOfflineMinutes);

    // Ganho reduzido offline (50% do normal)
    const experiencePerMinute = playerPower * 0.5;
    const goldPerMinute = playerPower * 0.3;

    return {
      experience: Math.floor(experiencePerMinute * actualMinutes),
      gold: Math.floor(goldPerMinute * actualMinutes),
    };
  },

  // Proteção contra exploits: verificar se o ganho é realista
  validateEarnings: (
    playerPower: number,
    timeMinutes: number,
    claimedXp: number,
    claimedGold: number
  ): boolean => {
    const maxXpPerMin = playerPower * 1.5; // Margem de 50%
    const maxGoldPerMin = playerPower * 0.9;

    const expectedXp = maxXpPerMin * timeMinutes * 1.1; // 10% de tolerância
    const expectedGold = maxGoldPerMin * timeMinutes * 1.1;

    return claimedXp <= expectedXp && claimedGold <= expectedGold;
  },
};
