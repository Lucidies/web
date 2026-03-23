/**
 * VT-Energy Rank Calculator
 *
 * Implements calculateVtEnergyRank (Voltaic Season 4 & 5)
 * which calls calculateSpecializedHarmonicRank with 'vt-energy' mode.
 *
 * Ported from standalone vt-energy-calc.ts for server-side use.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ScenarioData {
  score: number;
  leaderboard_rank: number;
  scenario_rank: number;
  rank_maxes: number[];
  leaderboard_id?: number;
}

interface CategoryData {
  benchmark_progress: number;
  category_rank: number;
  rank_maxes: number[];
  scenarios: Record<string, ScenarioData>;
}

interface RankInfo {
  name: string;
  color: string;
}

interface ApiData {
  benchmark_progress: number;
  overall_rank: number;
  categories: Record<string, CategoryData>;
  ranks: RankInfo[];
}

interface SubcategoryConfig {
  subcategoryName: string;
  scenarioCount: number;
}

interface CategoryConfig {
  categoryName: string;
  subcategories: SubcategoryConfig[];
}

interface DifficultyConfig {
  difficultyName: string;
  rankColors: Record<string, string>;
  categories: CategoryConfig[];
}

interface SubcategoryRankInfo {
  baseRank: number;
  preciseRank: number;
  progressToNext: number;
  isMaxed: boolean;
  scenarioName: string;
  score: number;
}

interface PreciseRankResult {
  baseRank: number;
  preciseRank: number;
  progressToNext: number;
  isMaxed: boolean;
  isValid: boolean;
}

export interface SubcategoryEnergyEntry {
  subcategoryName: string;
  energy: number;
  bestScenario: string;
  score: number;
  preciseRank: number;
}

export interface VtEnergyResult {
  rank: number;
  rankName: string;
  rankColor: string;
  harmonicMean: number;
  thresholds: number[];
  subcategoryEnergies: number[];
  energyDetails: Record<string, Record<string, number>>;
  subcategoryEnergiesFlat: SubcategoryEnergyEntry[];
  expectedSubcategoryCount: number;
  difficultyName: string;
}

// ---------------------------------------------------------------------------
// Difficulty config for Voltaic S5 (9 subcategories × 2 scenarios each)
// ---------------------------------------------------------------------------

const VT_S5_DIFFICULTIES: Record<string, DifficultyConfig> = {
  novice: {
    difficultyName: 'Novice',
    rankColors: {
      Iron: '#999999',
      Bronze: '#FF9900',
      Silver: '#CBD9E6',
      Gold: '#CAB148',
    },
    categories: [
      {
        categoryName: 'Clicking',
        subcategories: [
          { subcategoryName: 'Dynamic', scenarioCount: 2 },
          { subcategoryName: 'Static', scenarioCount: 2 },
          { subcategoryName: 'Linear', scenarioCount: 2 },
        ],
      },
      {
        categoryName: 'Tracking',
        subcategories: [
          { subcategoryName: 'Precise', scenarioCount: 2 },
          { subcategoryName: 'Reactive', scenarioCount: 2 },
          { subcategoryName: 'Control', scenarioCount: 2 },
        ],
      },
      {
        categoryName: 'Switching',
        subcategories: [
          { subcategoryName: 'Speed', scenarioCount: 2 },
          { subcategoryName: 'Evasive', scenarioCount: 2 },
          { subcategoryName: 'Stability', scenarioCount: 2 },
        ],
      },
    ],
  },
  intermediate: {
    difficultyName: 'Intermediate',
    rankColors: {
      Platinum: '#2FCFC2',
      Diamond: '#B9F2FF',
      Jade: '#85FA85',
      Master: '#EC44CA',
    },
    categories: [
      {
        categoryName: 'Clicking',
        subcategories: [
          { subcategoryName: 'Dynamic', scenarioCount: 2 },
          { subcategoryName: 'Static', scenarioCount: 2 },
          { subcategoryName: 'Linear', scenarioCount: 2 },
        ],
      },
      {
        categoryName: 'Tracking',
        subcategories: [
          { subcategoryName: 'Precise', scenarioCount: 2 },
          { subcategoryName: 'Reactive', scenarioCount: 2 },
          { subcategoryName: 'Control', scenarioCount: 2 },
        ],
      },
      {
        categoryName: 'Switching',
        subcategories: [
          { subcategoryName: 'Speed', scenarioCount: 2 },
          { subcategoryName: 'Evasive', scenarioCount: 2 },
          { subcategoryName: 'Stability', scenarioCount: 2 },
        ],
      },
    ],
  },
  advanced: {
    difficultyName: 'Advanced',
    rankColors: {
      Grandmaster: '#FFD700',
      Nova: '#7900FF',
      Astra: '#FF2262',
      Celestial: '#24DDD8',
    },
    categories: [
      {
        categoryName: 'Clicking',
        subcategories: [
          { subcategoryName: 'Dynamic', scenarioCount: 2 },
          { subcategoryName: 'Static', scenarioCount: 2 },
          { subcategoryName: 'Linear', scenarioCount: 2 },
        ],
      },
      {
        categoryName: 'Tracking',
        subcategories: [
          { subcategoryName: 'Precise', scenarioCount: 2 },
          { subcategoryName: 'Reactive', scenarioCount: 2 },
          { subcategoryName: 'Control', scenarioCount: 2 },
        ],
      },
      {
        categoryName: 'Switching',
        subcategories: [
          { subcategoryName: 'Speed', scenarioCount: 2 },
          { subcategoryName: 'Evasive', scenarioCount: 2 },
          { subcategoryName: 'Stability', scenarioCount: 2 },
        ],
      },
    ],
  },
  'elite (unofficial)': {
    difficultyName: 'Elite (Unofficial)',
    rankColors: {
      Nova: '#7900FF',
      Astra: '#FF2262',
      Celestial: '#24DDD8',
      Stellaris: '#979DDA',
      Lunara: '#54418E',
      Solara: '#FCFFA0',
    },
    categories: [
      {
        categoryName: 'Clicking',
        subcategories: [
          { subcategoryName: 'Dynamic', scenarioCount: 2 },
          { subcategoryName: 'Static', scenarioCount: 2 },
          { subcategoryName: 'Linear', scenarioCount: 2 },
        ],
      },
      {
        categoryName: 'Tracking',
        subcategories: [
          { subcategoryName: 'Precise', scenarioCount: 2 },
          { subcategoryName: 'Reactive', scenarioCount: 2 },
          { subcategoryName: 'Control', scenarioCount: 2 },
        ],
      },
      {
        categoryName: 'Switching',
        subcategories: [
          { subcategoryName: 'Speed', scenarioCount: 2 },
          { subcategoryName: 'Evasive', scenarioCount: 2 },
          { subcategoryName: 'Stability', scenarioCount: 2 },
        ],
      },
    ],
  },
};

// Map benchmark IDs to difficulty keys
const BENCHMARK_ID_TO_DIFFICULTY: Record<string, string> = {
  '459': 'novice',
  '458': 'intermediate',
  '460': 'advanced',
  '475': 'elite (unofficial)',
};

// Map tier names (from the API route) to difficulty keys
const TIER_TO_DIFFICULTY: Record<string, string> = {
  novice: 'novice',
  intermediate: 'intermediate',
  advanced: 'advanced',
  elite: 'elite (unofficial)',
};

// ---------------------------------------------------------------------------
// Core helper functions
// ---------------------------------------------------------------------------

function convertApiScore(apiScore: number): number {
  return apiScore / 100;
}

function getVtEnergyThresholds(difficulty: string): number[] {
  const all = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500];
  const ranges: Record<string, [number, number]> = {
    novice: [0, 4],
    intermediate: [4, 8],
    advanced: [8, 12],
    'elite (unofficial)': [9, 15],
  };
  const [start, end] = ranges[difficulty] ?? [0, all.length];
  return all.slice(start, end);
}

function calculatePreciseRankFromScore(score: number, rankMaxes: number[]): PreciseRankResult {
  if (!score || score <= 0 || !rankMaxes?.length) {
    return { baseRank: 0, preciseRank: 0, progressToNext: 0, isMaxed: false, isValid: false };
  }

  let baseRank = 0;
  for (let i = rankMaxes.length - 1; i >= 0; i--) {
    if (score >= rankMaxes[i]) {
      baseRank = i + 1;
      break;
    }
  }

  if (baseRank === 0) {
    return {
      baseRank: 0,
      preciseRank: 0,
      progressToNext: Math.min(score / rankMaxes[0], 0.99),
      isMaxed: false,
      isValid: true,
    };
  }

  if (baseRank === rankMaxes.length) {
    const hi = rankMaxes[rankMaxes.length - 1];
    const hi2 = rankMaxes.length > 1 ? rankMaxes[rankMaxes.length - 2] : 0;
    const diff = hi - hi2 || 1;
    const extra = (score - hi) / diff;
    return {
      baseRank,
      preciseRank: baseRank + extra,
      progressToNext: extra % 1,
      isMaxed: true,
      isValid: true,
    };
  }

  const cur = rankMaxes[baseRank - 1];
  const next = rankMaxes[baseRank];
  const progress = (score - cur) / (next - cur);
  return {
    baseRank,
    preciseRank: baseRank + progress,
    progressToNext: progress,
    isMaxed: false,
    isValid: true,
  };
}

/** Returns ordered scenario names based on the api categories order and the difficultyConfig. */
function getOrderedScenarioNames(apiData: ApiData, difficultyConfig: DifficultyConfig): string[] {
  const apiScenarioNames = apiData.categories
    ? Object.values(apiData.categories).flatMap((cat) => Object.keys(cat.scenarios ?? {}))
    : [];

  const result: string[] = [];
  let idx = 0;
  difficultyConfig.categories.forEach((catCfg) => {
    catCfg.subcategories.forEach((subCfg) => {
      for (let i = 0; i < subCfg.scenarioCount; i++) {
        result.push(
          idx < apiScenarioNames.length
            ? apiScenarioNames[idx]
            : `Unknown_${catCfg.categoryName}_${subCfg.subcategoryName}_${i}`
        );
        idx++;
      }
    });
  });
  return result;
}

function getScenarioData(apiData: ApiData, scenarioName: string): ScenarioData {
  if (!apiData.categories) return { score: 0, leaderboard_rank: 0, scenario_rank: 0, rank_maxes: [] };
  for (const cat of Object.values(apiData.categories)) {
    if (cat.scenarios[scenarioName]) return cat.scenarios[scenarioName];
  }
  return { score: 0, leaderboard_rank: 0, scenario_rank: 0, rank_maxes: [] };
}

function calculateEnergy(
  rankInfo: SubcategoryRankInfo,
  thresholds: number[],
  apiData: ApiData,
  fakeLowerOffset: number,
  fakeUpperCount: number
): number {
  const N = thresholds.length;
  const lastThreshold = thresholds[N - 1];
  const secondLastThreshold = thresholds[N - 2];
  const rankDifference = lastThreshold - secondLastThreshold || 100;
  const fakeUpperThreshold = lastThreshold + rankDifference;

  // Special case: score exists but below rank 1 threshold
  if (rankInfo.baseRank === 0 && rankInfo.preciseRank === 0) {
    const score = rankInfo.score;
    let rankMaxes: number[] = [];
    if (score > 0 && apiData.categories) {
      for (const apiCat of Object.values(apiData.categories)) {
        if (apiCat.scenarios[rankInfo.scenarioName]) {
          rankMaxes = apiCat.scenarios[rankInfo.scenarioName].rank_maxes;
          break;
        }
      }
    }
    if (rankMaxes.length < 2) return 0;

    const lowest = rankMaxes[0];
    const second = rankMaxes[1];
    const threshDiff = second - lowest;
    const fakeLower = lowest - threshDiff;
    const fakeEnergy = thresholds[0] - fakeLowerOffset;
    const firstEnergy = thresholds[0];

    const energy =
      score < fakeLower
        ? (score / fakeLower) * fakeEnergy
        : fakeEnergy + ((score - fakeLower) / (lowest - fakeLower)) * (firstEnergy - fakeEnergy);
    return Math.trunc(energy);
  }

  const fakeLowerThreshold = thresholds[0] - fakeLowerOffset;

  if (rankInfo.preciseRank <= 0) return 0;
  if (rankInfo.preciseRank < 1) {
    return Math.trunc(fakeLowerThreshold + rankInfo.preciseRank * (thresholds[0] - fakeLowerThreshold));
  }
  if (rankInfo.preciseRank < N) {
    const k = Math.floor(rankInfo.preciseRank);
    const fraction = rankInfo.preciseRank - k;
    const lower = k === 0 ? fakeLowerThreshold : thresholds[k - 1];
    const upper = thresholds[k];
    return Math.trunc(lower + fraction * (upper - lower));
  }
  if (rankInfo.preciseRank < N + fakeUpperCount) {
    const fraction = rankInfo.preciseRank - N;
    return Math.trunc(lastThreshold + fraction * (fakeUpperThreshold - lastThreshold));
  }
  return Math.trunc(fakeUpperThreshold);
}

/** Picks the best scenario per subcategory using energy tie-breaking. */
function getSubcategoryHighestRanks(
  apiData: ApiData,
  difficultyConfig: DifficultyConfig,
  thresholds: number[],
  fakeLowerOffset: number,
  fakeUpperCount: number
): {
  subcategoryRanks: Record<string, Record<string, SubcategoryRankInfo>>;
  hasUnrankedSubcategory: boolean;
} {
  if (!apiData.categories) return { subcategoryRanks: {}, hasUnrankedSubcategory: true };

  const scenarioNames = getOrderedScenarioNames(apiData, difficultyConfig);
  const subcategoryRanks: Record<string, Record<string, SubcategoryRankInfo>> = {};
  let scenarioIndex = 0;
  let hasUnrankedSubcategory = false;

  difficultyConfig.categories.forEach((catCfg) => {
    const catName = catCfg.categoryName;
    subcategoryRanks[catName] = {};

    catCfg.subcategories.forEach((subCfg) => {
      const subName = subCfg.subcategoryName;
      let highestPreciseRank = -1;
      let best: SubcategoryRankInfo = {
        baseRank: 0,
        preciseRank: 0,
        progressToNext: 0,
        isMaxed: false,
        scenarioName: '',
        score: 0,
      };

      for (let i = 0; i < subCfg.scenarioCount && scenarioIndex < scenarioNames.length; i++) {
        const sName = scenarioNames[scenarioIndex];
        const sData = getScenarioData(apiData, sName);

        if (sData && sData.score !== 0) {
          const actualScore = convertApiScore(sData.score);
          const rInfo = calculatePreciseRankFromScore(actualScore, sData.rank_maxes);

          let isBetter = false;
          if (highestPreciseRank === -1) {
            isBetter = true;
          } else if (rInfo.baseRank > 0 && best.baseRank === 0) {
            isBetter = true;
          } else if (rInfo.baseRank > 0 && best.baseRank > 0) {
            isBetter = rInfo.preciseRank > best.preciseRank;
          } else if (rInfo.baseRank === 0 && best.baseRank === 0) {
            const cur = calculateEnergy(
              { ...rInfo, scenarioName: sName, score: actualScore },
              thresholds,
              apiData,
              fakeLowerOffset,
              fakeUpperCount
            );
            const prev = calculateEnergy(best, thresholds, apiData, fakeLowerOffset, fakeUpperCount);
            isBetter = cur > prev;
          }

          if (isBetter) {
            highestPreciseRank = rInfo.preciseRank;
            best = {
              baseRank: rInfo.baseRank,
              preciseRank: rInfo.preciseRank,
              progressToNext: rInfo.progressToNext,
              isMaxed: rInfo.isMaxed,
              scenarioName: sName,
              score: actualScore,
            };
          }
        }
        scenarioIndex++;
      }

      if (highestPreciseRank === -1 || best.baseRank === 0) hasUnrankedSubcategory = true;
      subcategoryRanks[catName][subName] = best;
    });
  });

  return { subcategoryRanks, hasUnrankedSubcategory };
}

function calculateHarmonicMean(values: number[], expectedCount: number): number {
  if (values.length !== expectedCount || values.some((v) => v === 0)) return 0;
  return values.length / values.reduce((sum, v) => sum + 1 / v, 0);
}

// ---------------------------------------------------------------------------
// Main VT-Energy calculation
// ---------------------------------------------------------------------------

function calculateVtEnergyRankInternal(apiData: ApiData, difficultyConfig: DifficultyConfig): VtEnergyResult {
  const difficultyName = difficultyConfig.difficultyName.toLowerCase();
  const isNovice = difficultyName === 'novice';
  const thresholds = getVtEnergyThresholds(difficultyName);
  const fakeLowerOffset = isNovice ? 0 : 100;
  const fakeUpperCount = 1;

  const filterSubcategories = (sub: { subcategoryName: string }): boolean =>
    !sub.subcategoryName.toLowerCase().includes('strafe');

  const isAdvanced = difficultyName === 'advanced';
  const maxEnergy: number | undefined = isAdvanced ? 1200 : undefined;

  const { subcategoryRanks } = getSubcategoryHighestRanks(
    apiData,
    difficultyConfig,
    thresholds,
    fakeLowerOffset,
    fakeUpperCount
  );

  const subcategoryEnergies: number[] = [];
  const energyDetails: Record<string, Record<string, number>> = {};
  const subcategoryEnergiesFlat: SubcategoryEnergyEntry[] = [];

  Object.entries(subcategoryRanks).forEach(([catName, subcategories]) => {
    energyDetails[catName] = {};
    Object.entries(subcategories).forEach(([subName, rankInfo]) => {
      if (!filterSubcategories({ subcategoryName: subName })) return;
      let energy = calculateEnergy(rankInfo, thresholds, apiData, fakeLowerOffset, fakeUpperCount);
      if (typeof maxEnergy === 'number' && energy > maxEnergy) energy = maxEnergy;
      energyDetails[catName][subName] = energy;
      subcategoryEnergies.push(energy);
      subcategoryEnergiesFlat.push({
        subcategoryName: subName,
        energy,
        bestScenario: rankInfo.scenarioName,
        score: rankInfo.score,
        preciseRank: +rankInfo.preciseRank.toFixed(4),
      });
    });
  });

  const expectedSubcategoryCount = difficultyConfig.categories.reduce(
    (sum, cat) => sum + cat.subcategories.filter(filterSubcategories).length,
    0
  );

  const validForHarmonic = subcategoryEnergies.filter((e) => e > 0);
  // Calculate harmonic mean even with partial completion (use valid subcategories only)
  const harmonicMean =
    validForHarmonic.length > 0
      ? Math.round(calculateHarmonicMean(validForHarmonic, validForHarmonic.length) * 10) / 10
      : 0;

  let rank = 0;
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (harmonicMean >= thresholds[i]) {
      rank = i + 1;
      break;
    }
  }

  // Determine rank name and color from the difficulty config
  const rankNames = Object.keys(difficultyConfig.rankColors);
  const rankColors = Object.values(difficultyConfig.rankColors);
  const rankName = rank > 0 && rank <= rankNames.length ? rankNames[rank - 1] : 'Unranked';
  const rankColor = rank > 0 && rank <= rankColors.length ? rankColors[rank - 1] : '#6b7280';

  return {
    rank,
    rankName,
    rankColor,
    harmonicMean,
    thresholds,
    subcategoryEnergies,
    energyDetails,
    subcategoryEnergiesFlat,
    expectedSubcategoryCount,
    difficultyName: difficultyConfig.difficultyName,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Calculate VT-Energy rank for a given benchmark tier.
 *
 * @param apiData - Raw benchmark progress data from the KoVaaK's API
 * @param tier - Tier name: 'novice' | 'intermediate' | 'advanced' | 'elite'
 * @returns VtEnergyResult or null if the tier/config is unknown
 */
export function calculateVtEnergyForTier(
  apiData: ApiData,
  tier: string
): VtEnergyResult | null {
  const difficultyKey = TIER_TO_DIFFICULTY[tier.toLowerCase()];
  if (!difficultyKey) return null;

  const difficultyConfig = VT_S5_DIFFICULTIES[difficultyKey];
  if (!difficultyConfig) return null;

  return calculateVtEnergyRankInternal(apiData, difficultyConfig);
}

/**
 * Calculate VT-Energy rank using a benchmark ID.
 *
 * @param apiData - Raw benchmark progress data from the KoVaaK's API
 * @param benchmarkId - Benchmark ID string (e.g. '459', '458', '427', '475')
 * @returns VtEnergyResult or null if the benchmark ID is unknown
 */
export function calculateVtEnergyForBenchmarkId(
  apiData: ApiData,
  benchmarkId: string
): VtEnergyResult | null {
  const difficultyKey = BENCHMARK_ID_TO_DIFFICULTY[benchmarkId];
  if (!difficultyKey) return null;

  const difficultyConfig = VT_S5_DIFFICULTIES[difficultyKey];
  if (!difficultyConfig) return null;

  return calculateVtEnergyRankInternal(apiData, difficultyConfig);
}

/**
 * Get the best VT-Energy result across all tiers.
 * Prefers ranked results over unranked; among same-ranked-status, picks highest energy.
 */
export function getBestVtEnergyResult(
  allResults: Record<string, VtEnergyResult | null>
): VtEnergyResult | null {
  let best: VtEnergyResult | null = null;

  for (const result of Object.values(allResults)) {
    if (!result) continue;
    if (!best) {
      best = result;
      continue;
    }
    const bestIsRanked = best.rank > 0;
    const resultIsRanked = result.rank > 0;
    // Prefer ranked over unranked
    if (resultIsRanked && !bestIsRanked) {
      best = result;
    } else if (resultIsRanked === bestIsRanked && result.harmonicMean > best.harmonicMean) {
      // Among same status (both ranked or both unranked), pick higher energy
      best = result;
    }
  }

  return best;
}
