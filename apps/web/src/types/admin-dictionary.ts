export type DictionaryItem = {
  id: string;
  label: string;
  /** Eski veri */
  icon?: string;
  /** Lucide ikon anahtarı */
  iconKey?: string;
};

export type AdminDictionaries = {
  mainCategories: DictionaryItem[];
  subCategoriesByMain: Record<string, DictionaryItem[]>;
  includes: DictionaryItem[];
  excludes: DictionaryItem[];
  features: DictionaryItem[];
};
