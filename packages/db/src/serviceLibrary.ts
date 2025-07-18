export interface ServiceLibraryItem {
  code: string;
  name_pl: string;
  duration_min: number;
  price_eur: number;
  category: string;
  notes?: string;
  package_items?: string[];
}

export const SERVICE_LIBRARY: ServiceLibraryItem[] = [
  // Hair Services
  {
    code: "hair_womens_cut",
    name_pl: "Strzyżenie damskie",
    duration_min: 45,
    price_eur: 35,
    category: "hair",
    notes: "Mycie+strzyżenie+układanie"
  },
  {
    code: "hair_mens_cut",
    name_pl: "Strzyżenie męskie",
    duration_min: 30,
    price_eur: 20,
    category: "hair"
  },
  {
    code: "hair_child_cut",
    name_pl: "Strzyżenie dziecięce",
    duration_min: 30,
    price_eur: 18,
    category: "hair"
  },
  {
    code: "hair_color_full",
    name_pl: "Koloryzacja pełna",
    duration_min: 120,
    price_eur: 70,
    category: "hair"
  },
  {
    code: "hair_color_roots",
    name_pl: "Koloryzacja odrostów",
    duration_min: 90,
    price_eur: 55,
    category: "hair"
  },
  {
    code: "hair_highlights",
    name_pl: "Pasemka / Balayage",
    duration_min: 150,
    price_eur: 120,
    category: "hair"
  },
  {
    code: "hair_toner",
    name_pl: "Toner / Glazura",
    duration_min: 30,
    price_eur: 25,
    category: "hair"
  },
  {
    code: "hair_keratin",
    name_pl: "Keratynowe prostowanie",
    duration_min: 180,
    price_eur: 150,
    category: "hair"
  },
  {
    code: "hair_styling_event",
    name_pl: "Stylizacja okolicznościowa",
    duration_min: 60,
    price_eur: 45,
    category: "hair"
  },

  // Nails Services
  {
    code: "nails_manicure_classic",
    name_pl: "Manicure klasyczny",
    duration_min: 45,
    price_eur: 25,
    category: "nails"
  },
  {
    code: "nails_manicure_hybrid",
    name_pl: "Manicure hybrydowy",
    duration_min: 60,
    price_eur: 30,
    category: "nails"
  },
  {
    code: "nails_gel_extensions",
    name_pl: "Przedłużanie żelowe",
    duration_min: 120,
    price_eur: 55,
    category: "nails"
  },
  {
    code: "nails_pedicure_classic",
    name_pl: "Pedicure klasyczny",
    duration_min: 60,
    price_eur: 35,
    category: "nails"
  },
  {
    code: "nails_pedicure_medic",
    name_pl: "Pedicure medyczny",
    duration_min: 75,
    price_eur: 45,
    category: "nails"
  },
  {
    code: "nails_remove_hybrid",
    name_pl: "Usunięcie hybrydy",
    duration_min: 20,
    price_eur: 10,
    category: "nails"
  },

  // Brows & Lashes
  {
    code: "brow_shape",
    name_pl: "Regulacja brwi",
    duration_min: 20,
    price_eur: 10,
    category: "brows_lashes"
  },
  {
    code: "brow_tint",
    name_pl: "Henna / koloryzacja brwi",
    duration_min: 20,
    price_eur: 12,
    category: "brows_lashes"
  },
  {
    code: "brow_lamination",
    name_pl: "Laminacja brwi",
    duration_min: 45,
    price_eur: 35,
    category: "brows_lashes"
  },
  {
    code: "lash_lift",
    name_pl: "Lifting rzęs",
    duration_min: 60,
    price_eur: 40,
    category: "brows_lashes"
  },
  {
    code: "lash_extensions_classic",
    name_pl: "Przedłużanie rzęs 1:1",
    duration_min: 120,
    price_eur: 60,
    category: "brows_lashes"
  },
  {
    code: "lash_extensions_volume",
    name_pl: "Przedłużanie rzęs objętościowe",
    duration_min: 150,
    price_eur: 75,
    category: "brows_lashes"
  },

  // Skin & Face
  {
    code: "face_basic_clean",
    name_pl: "Oczyszczanie twarzy podstawowe",
    duration_min: 45,
    price_eur: 40,
    category: "skin_face"
  },
  {
    code: "face_deep_clean",
    name_pl: "Głębokie oczyszczanie twarzy",
    duration_min: 60,
    price_eur: 55,
    category: "skin_face"
  },
  {
    code: "face_acid_peel",
    name_pl: "Peeling kwasowy",
    duration_min: 45,
    price_eur: 50,
    category: "skin_face"
  },
  {
    code: "face_microdermabrasion",
    name_pl: "Mikrodermabrazja",
    duration_min: 45,
    price_eur: 50,
    category: "skin_face"
  },
  {
    code: "face_antiaging",
    name_pl: "Zabieg anti-aging",
    duration_min: 60,
    price_eur: 70,
    category: "skin_face"
  },

  // Waxing
  {
    code: "wax_bikini",
    name_pl: "Depilacja bikini",
    duration_min: 30,
    price_eur: 25,
    category: "waxing"
  },
  {
    code: "wax_full_leg",
    name_pl: "Depilacja nóg całych",
    duration_min: 45,
    price_eur: 35,
    category: "waxing"
  },
  {
    code: "wax_half_leg",
    name_pl: "Depilacja nóg (do kolan)",
    duration_min: 30,
    price_eur: 25,
    category: "waxing"
  },
  {
    code: "wax_armpits",
    name_pl: "Depilacja pach",
    duration_min: 15,
    price_eur: 12,
    category: "waxing"
  },
  {
    code: "wax_arm",
    name_pl: "Depilacja rąk",
    duration_min: 20,
    price_eur: 15,
    category: "waxing"
  },

  // Barber
  {
    code: "barber_cut",
    name_pl: "Strzyżenie barberskie",
    duration_min: 30,
    price_eur: 25,
    category: "barber"
  },
  {
    code: "barber_beard_trim",
    name_pl: "Broda / trymowanie",
    duration_min: 20,
    price_eur: 15,
    category: "barber"
  },
  {
    code: "barber_shave",
    name_pl: "Golenie brzytwą",
    duration_min: 30,
    price_eur: 22,
    category: "barber"
  },
  {
    code: "barber_combo",
    name_pl: "Strzyżenie + broda",
    duration_min: 45,
    price_eur: 35,
    category: "barber"
  },

  // Spa
  {
    code: "spa_relax_massage",
    name_pl: "Masaż relaksacyjny",
    duration_min: 60,
    price_eur: 55,
    category: "spa"
  },
  {
    code: "spa_back_massage",
    name_pl: "Masaż pleców",
    duration_min: 30,
    price_eur: 30,
    category: "spa"
  },
  {
    code: "spa_face_massage",
    name_pl: "Masaż twarzy",
    duration_min: 30,
    price_eur: 25,
    category: "spa"
  },
  {
    code: "spa_body_scrub",
    name_pl: "Peeling całego ciała",
    duration_min: 45,
    price_eur: 40,
    category: "spa"
  },

  // Packages
  {
    code: "pack_browlash",
    name_pl: "Pakiet Brwi + Rzęsy",
    duration_min: 75,
    price_eur: 45,
    category: "package",
    package_items: ["brow_shape", "brow_tint", "lash_lift"]
  },
  {
    code: "pack_manicure_pedicure",
    name_pl: "Pakiet Mani + Pedi",
    duration_min: 120,
    price_eur: 55,
    category: "package",
    package_items: ["nails_manicure_hybrid", "nails_pedicure_classic"]
  },
  {
    code: "pack_cut_color",
    name_pl: "Strzyżenie + Koloryzacja",
    duration_min: 165,
    price_eur: 90,
    category: "package",
    package_items: ["hair_womens_cut", "hair_color_full"]
  }
];

export const SERVICE_CATEGORIES = [
  'hair',
  'nails',
  'brows_lashes',
  'skin_face',
  'waxing',
  'barber',
  'spa',
  'package'
] as const;

export type ServiceCategory = typeof SERVICE_CATEGORIES[number];
