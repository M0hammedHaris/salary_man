import { type Category } from '@/lib/types/category';

/**
 * Smart category suggestion based on transaction description
 */

export interface CategoryKeywords {
  [key: string]: string[];
}

export const CATEGORY_KEYWORDS: CategoryKeywords = {
  food: [
    "restaurant",
    "food",
    "dinner",
    "lunch",
    "breakfast",
    "cafe",
    "pizza",
    "burger",
    "grocery",
    "groceries",
    "supermarket",
  ],
  transportation: [
    "uber",
    "taxi",
    "gas",
    "fuel",
    "bus",
    "train",
    "metro",
    "parking",
    "toll",
  ],
  shopping: [
    "amazon",
    "flipkart",
    "shop",
    "mall",
    "store",
    "purchase",
    "buy",
  ],
  utilities: [
    "electricity",
    "water",
    "internet",
    "phone",
    "mobile",
    "wifi",
    "bill",
  ],
  entertainment: [
    "movie",
    "cinema",
    "netflix",
    "spotify",
    "game",
    "concert",
    "show",
  ],
  medical: [
    "doctor",
    "hospital",
    "pharmacy",
    "medicine",
    "medical",
    "health",
  ],
  salary: ["salary", "wage", "income", "payment", "payroll"],
};

export function suggestCategory(
  description: string,
  categories: Category[]
): string | null {
  if (!description || description.length < 3) return null;

  const descLower = description.toLowerCase();

  // Find matching category
  for (const [categoryName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => descLower.includes(keyword))) {
      const matchingCategory = categories.find(
        (cat) =>
          cat.name.toLowerCase().includes(categoryName) ||
          categoryName.includes(cat.name.toLowerCase())
      );
      if (matchingCategory) {
        return matchingCategory.id;
      }
    }
  }

  return null;
}

export function findCategoryByName(
  categories: Category[],
  searchTerms: string[]
): Category | null {
  for (const term of searchTerms) {
    // Look for exact match first
    const exactMatch = categories.find(
      (cat) => cat.name.toLowerCase() === term.toLowerCase()
    );
    if (exactMatch) return exactMatch;

    // Then look for contains match
    const containsMatch = categories.find((cat) =>
      cat.name.toLowerCase().includes(term.toLowerCase())
    );
    if (containsMatch) return containsMatch;
  }
  return null;
}
