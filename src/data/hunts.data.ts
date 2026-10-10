import { Hunt, HuntRegion, MonsterModifier, LootRarity, Monster, ProgressionFormulas } from '../config/hunts.types';

// Função auxiliar para criar monstro com modificadores
function createMonster(
  id: string,
  name: string,
  huntLevel: number,
  modifier: MonsterModifier = MonsterModifier.NONE
): Monster {
  const baseHealth = ProgressionFormulas.monsterHealth(huntLevel);
  const baseDamage = ProgressionFormulas.monsterDamage(huntLevel);

  return {
    id,
    name,
    health: ProgressionFormulas.applyHealthModifier(baseHealth, modifier),
    damage: ProgressionFormulas.applyModifier(baseDamage, modifier),
    defense: Math.floor(huntLevel * 0.5),
    speed: 1.0,
    experienceReward: ProgressionFormulas.baseExperience(huntLevel),
    goldReward: ProgressionFormulas.baseGold(huntLevel),
    modifier,
  };
}

// REGIÃO 1: TERRAS INICIAIS (Level 1-100)
const terrasIniciaisHunts: Hunt[] = [
  {
    id: 'hunt_001',
    huntNumber: 1,
    region: HuntRegion.TERRAS_INICIAIS,
    name: 'Floresta Tranquila',
    description: 'Uma floresta pacífica onde você aprende a caçar',
    minLevel: 1,
    recommendedLevel: 1,
    monsters: [
      createMonster('lobo_fraco', 'Lobo Fraco', 1),
      createMonster('coelho_selvagem', 'Coelho Selvagem', 1),
    ],
    lootTables: [
      {
        rarity: LootRarity.COMUM,
        name: 'Pele de Lobo',
        itemType: 'material',
        dropChance: 0.8,
        quantity: { min: 1, max: 3 },
      },
    ],
    experienceMultiplier: 1.0,
    goldMultiplier: 1.0,
    unlockedBy: null,
    specialMechanics: ['tutorial'],
  },
  {
    id: 'hunt_002',
    huntNumber: 2,
    region: HuntRegion.TERRAS_INICIAIS,
    name: 'Caverna Rasa',
    description: 'Uma caverna com morcegos e aranhas pequenas',
    minLevel: 5,
    recommendedLevel: 10,
    monsters: [
      createMonster('morcego_pequeno', 'Morcego Pequeno', 5),
      createMonster('aranha_teia', 'Aranha de Teia', 5),
    ],
    lootTables: [
      {
        rarity: LootRarity.COMUM,
        name: 'Teia de Aranha',
        itemType: 'material',
        dropChance: 0.7,
        quantity: { min: 1, max: 2 },
      },
      {
        rarity: LootRarity.INCOMUM,
        name: 'Cristal Fraco',
        itemType: 'cristal',
        dropChance: 0.15,
        quantity: { min: 1, max: 1 },
        bonusStats: { damage: 2 },
      },
    ],
    experienceMultiplier: 1.2,
    goldMultiplier: 1.1,
    unlockedBy: 'hunt_001',
  },
  {
    id: 'hunt_003',
    huntNumber: 3,
    region: HuntRegion.TERRAS_INICIAIS,
    name: 'Ruínas Abandonadas',
    description: 'Ruínas antigas com esqueletos fracos',
    minLevel: 10,
    recommendedLevel: 15,
    monsters: [
      createMonster('esqueleto_fraco', 'Esqueleto Fraco', 10),
      createMonster('zumbi_antigo', 'Zumbi Antigo', 10),
    ],
    lootTables: [
      {
        rarity: LootRarity.COMUM,
        name: 'Osso Antigo',
        itemType: 'material',
        dropChance: 0.8,
        quantity: { min: 1, max: 3 },
      },
      {
        rarity: LootRarity.RARO,
        name: 'Amuleto Antigo',
        itemType: 'acessorio',
        dropChance: 0.08,
        quantity: { min: 1, max: 1 },
        bonusStats: { defense: 5 },
      },
    ],
    experienceMultiplier: 1.5,
    goldMultiplier: 1.3,
    unlockedBy: 'hunt_002',
    eliteBoss: createMonster('rei_esqueleto', 'Rei Esqueleto', 15, MonsterModifier.ANCESTRAL),
  },
  {
    id: 'hunt_004',
    huntNumber: 4,
    region: HuntRegion.TERRAS_INICIAIS,
    name: 'Pântano Tóxico',
    description: 'Um pântano perigoso com criaturas venenosas',
    minLevel: 15,
    recommendedLevel: 20,
    monsters: [
      createMonster('sapo_gigante', 'Sapo Gigante', 15),
      createMonster('cobra_venenosa', 'Cobra Venenosa', 15),
    ],
    lootTables: [
      {
        rarity: LootRarity.COMUM,
        name: 'Veneno Fraco',
        itemType: 'material',
        dropChance: 0.75,
        quantity: { min: 1, max: 4 },
      },
      {
        rarity: LootRarity.INCOMUM,
        name: 'Antídoto',
        itemType: 'consumivel',
        dropChance: 0.2,
        quantity: { min: 1, max: 2 },
      },
    ],
    experienceMultiplier: 1.6,
    goldMultiplier: 1.4,
    unlockedBy: 'hunt_003',
    specialMechanics: ['poison_damage'],
  },
  {
    id: 'hunt_005',
    huntNumber: 5,
    region: HuntRegion.TERRAS_INICIAIS,
    name: 'Montanhas Rochosas',
    description: 'Montanhas altas com trolls e gigantes de pedra',
    minLevel: 20,
    recommendedLevel: 25,
    monsters: [
      createMonster('troll_fraco', 'Troll Fraco', 20),
      createMonster('gigante_pedra', 'Gigante de Pedra', 20),
    ],
    lootTables: [
      {
        rarity: LootRarity.COMUM,
        name: 'Pedra Polida',
        itemType: 'material',
        dropChance: 0.8,
        quantity: { min: 1, max: 3 },
      },
      {
        rarity: LootRarity.RARO,
        name: 'Machado de Pedra',
        itemType: 'arma',
        dropChance: 0.1,
        quantity: { min: 1, max: 1 },
        bonusStats: { damage: 8 },
      },
    ],
    experienceMultiplier: 1.7,
    goldMultiplier: 1.5,
    unlockedBy: 'hunt_004',
  },
  {
    id: 'hunt_006',
    huntNumber: 6,
    region: HuntRegion.TERRAS_INICIAIS,
    name: 'Floresta Escura',
    description: 'Floresta densa e assustadora',
    minLevel: 25,
    recommendedLevel: 35,
    monsters: [
      createMonster('lobo_negro', 'Lobo Negro', 25, MonsterModifier.FRENETICO),
      createMonster('urso_selvagem', 'Urso Selvagem', 25),
    ],
    lootTables: [
      {
        rarity: LootRarity.INCOMUM,
        name: 'Pele de Urso',
        itemType: 'material',
        dropChance: 0.7,
        quantity: { min: 1, max: 2 },
      },
    ],
    experienceMultiplier: 1.8,
    goldMultiplier: 1.6,
    unlockedBy: 'hunt_005',
  },
  {
    id: 'hunt_007',
    huntNumber: 7,
    region: HuntRegion.TERRAS_INICIAIS,
    name: 'Templo Desacralizado',
    description: 'Um templo antigo profanado por magia escura',
    minLevel: 30,
    recommendedLevel: 40,
    monsters: [
      createMonster('sacerdote_sombrio', 'Sacerdote Sombrio', 30),
      createMonster('golem_maldito', 'Golem Maldito', 30, MonsterModifier.BLINDADO),
    ],
    lootTables: [
      {
        rarity: LootRarity.RARO,
        name: 'Artefato Maldito',
        itemType: 'artefato',
        dropChance: 0.15,
        quantity: { min: 1, max: 1 },
        bonusStats: { damage: 12 },
      },
    ],
    experienceMultiplier: 2.0,
    goldMultiplier: 1.7,
    unlockedBy: 'hunt_006',
    specialMechanics: ['curse'],
  },
  {
    id: 'hunt_008',
    huntNumber: 8,
    region: HuntRegion.TERRAS_INICIAIS,
    name: 'Caverna Vermelha',
    description: 'Caverna profunda com criaturas ígenas',
    minLevel: 35,
    recommendedLevel: 45,
    monsters: [
      createMonster('golem_fogo', 'Golem de Fogo', 35),
      createMonster('salamandra', 'Salamandra', 35),
    ],
    lootTables: [
      {
        rarity: LootRarity.INCOMUM,
        name: 'Cristal de Fogo',
        itemType: 'cristal',
        dropChance: 0.4,
        quantity: { min: 1, max: 2 },
      },
    ],
    experienceMultiplier: 2.1,
    goldMultiplier: 1.8,
    unlockedBy: 'hunt_007',
    specialMechanics: ['fire_damage'],
  },
  {
    id: 'hunt_009',
    huntNumber: 9,
    region: HuntRegion.TERRAS_INICIAIS,
    name: 'Pico da Perdição',
    description: 'Uma montanha perigosa no topo das Terras Iniciais',
    minLevel: 40,
    recommendedLevel: 50,
    monsters: [
      createMonster('harpia', 'Harpia', 40),
      createMonster('dragao_jovem', 'Dragão Jovem', 40, MonsterModifier.FRENETICO),
    ],
    lootTables: [
      {
        rarity: LootRarity.EPICO,
        name: 'Escama de Dragão',
        itemType: 'material',
        dropChance: 0.2,
        quantity: { min: 1, max: 1 },
        bonusStats: { defense: 15 },
      },
    ],
    experienceMultiplier: 2.3,
    goldMultiplier: 2.0,
    unlockedBy: 'hunt_008',
    eliteBoss: createMonster('senhor_vento', 'Senhor do Vento', 50, MonsterModifier.ANCESTRAL),
  },
  {
    id: 'hunt_010',
    huntNumber: 10,
    region: HuntRegion.TERRAS_INICIAIS,
    name: 'Castelo Esquecido',
    description: 'O castelo final das Terras Iniciais - entrada para novos reinos',
    minLevel: 50,
    recommendedLevel: 60,
    monsters: [
      createMonster('cavaleiro_negro', 'Cavaleiro Negro', 50),
      createMonster('mago_corrupto', 'Mago Corrupto', 50, MonsterModifier.CORRUPTO),
    ],
    lootTables: [
      {
        rarity: LootRarity.LENDARIO,
        name: 'Coroa Esquecida',
        itemType: 'acessorio',
        dropChance: 0.1,
        quantity: { min: 1, max: 1 },
        bonusStats: { damage: 20, defense: 10 },
      },
    ],
    experienceMultiplier: 2.5,
    goldMultiplier: 2.2,
    unlockedBy: 'hunt_009',
    eliteBoss: createMonster('rei_das_terras', 'Rei das Terras Iniciais', 70, MonsterModifier.ANCESTRAL),
    collectionBonus: {
      itemsRequired: 10,
      bonusPercentage: 5,
    },
  },
];

export const huntsDatabase = {
  [HuntRegion.TERRAS_INICIAIS]: terrasIniciaisHunts,
  // REGIÕES 2-10 SERÃO ADICIONADAS NO PRÓXIMO COMMIT
  // Total de 100 hunts planejadas
};

export const allHunts = terrasIniciaisHunts;
// Quando todas as 10 regiões forem adicionadas:
// export const allHunts = Object.values(huntsDatabase).flat();
