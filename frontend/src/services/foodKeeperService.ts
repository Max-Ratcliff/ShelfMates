/**
 * Service for USDA FoodKeeper database integration
 * Provides accurate shelf life data for food items
 */

interface FoodKeeperProduct {
  id: number;
  name: string;
  name_subtitle?: string;
  category_id: number;
  subcategory_id?: number;
  keywords?: string;
  pantry_min?: number;
  pantry_max?: number;
  pantry_metric?: string;
  pantry_tips?: string;
  dop_pantry_min?: number;
  dop_pantry_max?: number;
  dop_pantry_metric?: string;
  dop_pantry_tips?: string;
  refrigerate_min?: number;
  refrigerate_max?: number;
  refrigerate_metric?: string;
  refrigerate_tips?: string;
  dop_refrigerate_min?: number;
  dop_refrigerate_max?: number;
  dop_refrigerate_metric?: string;
  dop_refrigerate_tips?: string;
  freeze_min?: number;
  freeze_max?: number;
  freeze_metric?: string;
  freeze_tips?: string;
}

interface FoodKeeperSheet {
  name: string;
  data: any[][];
}

interface FoodKeeperData {
  fileName: string;
  sheets: FoodKeeperSheet[];
}

let cachedData: FoodKeeperProduct[] | null = null;
let fetchPromise: Promise<FoodKeeperProduct[]> | null = null;

/**
 * Fetches the USDA FoodKeeper database
 * Uses caching to avoid multiple requests
 */
async function fetchFoodKeeperData(): Promise<FoodKeeperProduct[]> {
  // Return cached data if available
  if (cachedData) {
    return cachedData;
  }

  // Return existing fetch promise if already fetching
  if (fetchPromise) {
    return fetchPromise;
  }

  // Start new fetch
  fetchPromise = (async () => {
    try {
      console.log('Fetching USDA FoodKeeper database...');
      const response = await fetch('/foodkeeper.json');

      if (!response.ok) {
        throw new Error('Failed to fetch FoodKeeper data');
      }

      const data: FoodKeeperData = await response.json();

      // Find the Product sheet
      const productSheet = data.sheets.find(sheet => sheet.name === 'Product');

      if (!productSheet) {
        console.error('Product sheet not found in FoodKeeper data');
        cachedData = [];
        return [];
      }

      // Each row is an array of single-key objects, merge them into one object
      const products: FoodKeeperProduct[] = productSheet.data.map((row: any[]) => {
        const merged: any = {};
        row.forEach((obj: any) => {
          Object.assign(merged, obj);
        });

        // Map capitalized field names to snake_case
        return {
          id: merged.ID,
          name: merged.Name || '',
          name_subtitle: merged.Name_subtitle,
          category_id: merged.Category_ID,
          subcategory_id: merged.Subcategory_ID,
          keywords: merged.Keywords,
          pantry_min: merged.Pantry_Min,
          pantry_max: merged.Pantry_Max,
          pantry_metric: merged.Pantry_Metric,
          pantry_tips: merged.Pantry_tips,
          dop_pantry_min: merged.DOP_Pantry_Min,
          dop_pantry_max: merged.DOP_Pantry_Max,
          dop_pantry_metric: merged.DOP_Pantry_Metric,
          dop_pantry_tips: merged.DOP_Pantry_tips,
          refrigerate_min: merged.Refrigerate_Min,
          refrigerate_max: merged.Refrigerate_Max,
          refrigerate_metric: merged.Refrigerate_Metric,
          refrigerate_tips: merged.Refrigerate_tips,
          dop_refrigerate_min: merged.DOP_Refrigerate_Min,
          dop_refrigerate_max: merged.DOP_Refrigerate_Max,
          dop_refrigerate_metric: merged.DOP_Refrigerate_Metric,
          dop_refrigerate_tips: merged.DOP_Refrigerate_tips,
          freeze_min: merged.Freeze_Min,
          freeze_max: merged.Freeze_Max,
          freeze_metric: merged.Freeze_Metric,
          freeze_tips: merged.Freeze_Tips,
        } as FoodKeeperProduct;
      });

      cachedData = products;
      console.log(`Loaded ${products.length} products from FoodKeeper`);

      return products;
    } catch (error) {
      console.error('Error fetching FoodKeeper data:', error);
      fetchPromise = null; // Reset so it can be retried
      return [];
    }
  })();

  return fetchPromise;
}

/**
 * Normalizes text for fuzzy matching
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculates similarity score between two strings (0-1)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeText(str1);
  const s2 = normalizeText(str2);

  // Exact match
  if (s1 === s2) return 1.0;

  // Contains match
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;

  // Word overlap
  const words1 = s1.split(' ');
  const words2 = s2.split(' ');
  const commonWords = words1.filter(word => words2.includes(word));

  if (commonWords.length > 0) {
    return 0.5 + (commonWords.length / Math.max(words1.length, words2.length)) * 0.3;
  }

  return 0;
}

/**
 * Searches FoodKeeper database for matching products
 * @param productName - The product name to search for
 * @param category - Optional category to narrow search
 * @returns Best matching product or null
 */
export async function searchFoodKeeperProduct(
  productName: string,
  category?: string
): Promise<FoodKeeperProduct | null> {
  const products = await fetchFoodKeeperData();

  if (products.length === 0) {
    return null;
  }

  console.log('Searching FoodKeeper for:', productName);

  // Skip FoodKeeper for condiments and shelf-stable packaged goods
  const productLower = productName.toLowerCase();
  const isCondiment = productLower.includes('sauce') ||
                      productLower.includes('ketchup') ||
                      productLower.includes('mustard') ||
                      productLower.includes('mayo') ||
                      productLower.includes('dressing') ||
                      productLower.includes('condiment') ||
                      productLower.includes('spread') ||
                      productLower.includes('syrup');

  // Also skip if the product name is too generic (single word under 6 chars)
  const words = productName.trim().split(/\s+/);
  const isTooGeneric = words.length === 1 && productName.length < 6;

  if (isCondiment || isTooGeneric) {
    console.log('Skipping FoodKeeper search: product is a condiment or too generic');
    return null;
  }

  // Search by name and keywords
  let bestMatch: { product: FoodKeeperProduct; score: number } | null = null;

  for (const product of products) {
    let score = 0;

    // Match against product name (highest priority)
    const nameScore = calculateSimilarity(productName, product.name);
    score = Math.max(score, nameScore);

    // Match against name_subtitle
    if (product.name_subtitle) {
      const subtitleScore = calculateSimilarity(productName, product.name_subtitle);
      score = Math.max(score, subtitleScore);
    }

    // Match against keywords (but apply penalty for keyword-only matches)
    if (product.keywords) {
      const keywords = product.keywords.split(',');
      for (const keyword of keywords) {
        const keywordScore = calculateSimilarity(productName, keyword.trim());
        // Reduce keyword match scores to avoid false positives
        // Keywords are less reliable than name matches
        const adjustedKeywordScore = keywordScore * 0.7;
        score = Math.max(score, adjustedKeywordScore);
      }
    }

    // Boost score if category matches
    if (category && product.name.toLowerCase().includes(category.toLowerCase())) {
      score += 0.1;
    }

    // Update best match (require minimum 0.6 score for name matches, 0.75 for keyword matches)
    const minScore = nameScore > 0.5 ? 0.6 : 0.75;
    if (score >= minScore && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { product, score };
    }
  }

  if (bestMatch) {
    console.log(`Found FoodKeeper match: ${bestMatch.product.name} (score: ${bestMatch.score.toFixed(2)})`);
    return bestMatch.product;
  }

  console.log('No FoodKeeper match found');
  return null;
}

/**
 * Gets shelf life in days from FoodKeeper product
 * Prioritizes refrigerated storage for opened items
 */
export function getShelfLifeDays(product: FoodKeeperProduct): number {
  // Priority: DOP (Date of Purchase) Refrigerate > Refrigerate > Pantry

  // Check DOP refrigerate (after opening, refrigerated)
  if (product.dop_refrigerate_max && product.dop_refrigerate_metric) {
    const days = convertToDays(product.dop_refrigerate_max, product.dop_refrigerate_metric);
    if (days > 0) return days;
  }

  // Check regular refrigerate (unopened, refrigerated)
  if (product.refrigerate_max && product.refrigerate_metric) {
    const days = convertToDays(product.refrigerate_max, product.refrigerate_metric);
    if (days > 0) return days;
  }

  // Check pantry (shelf-stable)
  if (product.pantry_max && product.pantry_metric) {
    const days = convertToDays(product.pantry_max, product.pantry_metric);
    if (days > 0) return days;
  }

  // Check DOP pantry
  if (product.dop_pantry_max && product.dop_pantry_metric) {
    const days = convertToDays(product.dop_pantry_max, product.dop_pantry_metric);
    if (days > 0) return days;
  }

  return 0; // No shelf life data
}

/**
 * Converts shelf life to days based on metric
 */
function convertToDays(value: number, metric: string): number {
  const metricLower = metric.toLowerCase();

  if (metricLower.includes('day')) return value;
  if (metricLower.includes('week')) return value * 7;
  if (metricLower.includes('month')) return value * 30;
  if (metricLower.includes('year')) return value * 365;

  return value; // Assume days if unknown
}

/**
 * Gets storage tips from FoodKeeper product
 */
export function getStorageTips(product: FoodKeeperProduct): string | null {
  return (
    product.dop_refrigerate_tips ||
    product.refrigerate_tips ||
    product.dop_pantry_tips ||
    product.pantry_tips ||
    null
  );
}
