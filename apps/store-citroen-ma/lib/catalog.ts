export type ModelTrim = {
  slug: string;
  name: string;
  priceFrom: number;
  engine: string;
  horsepower: number;
  transmission: string;
  highlights: string[];
  /** Distinguishing equipment highlights vs lower trims */
  added?: string[];
};

export type ModelSpecs = {
  dimensions: {
    length: number;       // mm
    width: number;        // mm
    height: number;       // mm
    wheelbase: number;    // mm
    trunk: number;        // litres
    trunkMax?: number;    // litres with seats folded
    weight: number;       // kg kerb weight
    turningCircle?: number; // metres
  };
  performance: {
    topSpeed: number;         // km/h
    acceleration: number;     // 0–100 km/h seconds
    consumption: number;      // L/100km WLTP combined
    co2: number;              // g/km WLTP
    electricRange?: number;   // km WLTP (PHEV/EV)
    fuelTank?: number;        // litres
  };
  interior: {
    touchscreen: string;
    digitalCluster?: string;
    seats: number;
    upholstery: string;
    sound?: string;
  };
  safety: string[];
  connectivity: string[];
  warranty: {
    vehicleYears: number;
    batteryYears?: number;
    assistanceYears?: number;
    paintYears?: number;
  };
};

export type ModelColor = {
  id: string;
  name: string;
  hex: string;
  /** Optional secondary hex for bi-tone roof */
  roofHex?: string;
  /** Upcharge from the base trim in MAD */
  upcharge: number;
  /** Path to swatch chip PNG (40px round) */
  swatch?: string;
  /** Paths to 3–5 angles of the car in this colour, full-bleed studio render */
  renders: string[];
};

export type CatalogModel = {
  slug: string;
  name: string;
  shortName: string;
  tagline: { fr: string; ar: string; en: string };
  bodyType: "hatchback" | "suv" | "van" | "ev";
  fuelType: "petrol" | "diesel" | "hybrid" | "electric";
  seats: number;
  priceFrom: number;
  /** Primary brand colour accent for backgrounds (matches the hero render) */
  accentHex: string;
  /** Large desktop hero for the model detail page */
  heroImage?: string;
  /** Mobile-optimised version */
  heroImageMobile?: string;
  /** Cinematic lifestyle images */
  lifestyle?: { src: string; caption: string }[];
  /** Trim-level product shots (studio) */
  trimShots?: Record<string, string>;
  /** Colour options (at least one) */
  colors: ModelColor[];
  trims: ModelTrim[];
  /** Full technical specs (optional for now; add as available) */
  specs?: ModelSpecs;
};

const mad = (n: number) => n;

export const catalog: CatalogModel[] = [
  // ────────── C3 Aircross ──────────
  {
    slug: "c3-aircross",
    name: "Citroën C3 Aircross",
    shortName: "C3 Aircross",
    tagline: {
      fr: "Le SUV compact qui redéfinit l'Advanced Comfort®.",
      ar: "سيارة الدفع الرباعي المدمجة التي تعيد تعريف الراحة المتقدمة.",
      en: "The compact SUV that redefines Advanced Comfort®.",
    },
    bodyType: "suv",
    fuelType: "hybrid",
    seats: 5,
    priceFrom: mad(234900),
    accentHex: "#c4332f",
    heroImage: "/models/c3-aircross/colors/elixir-red/03.png",
    colors: [
      {
        id: "elixir-red",
        name: "Rouge Elixir · Toit bi-ton Noir Perla Nera",
        hex: "#B1322C",
        roofHex: "#0E0E0E",
        upcharge: 4000,
        swatch: "/models/c3-aircross/swatches/elixir-red.png",
        renders: [
          "/models/c3-aircross/colors/elixir-red/01.png",
          "/models/c3-aircross/colors/elixir-red/02.png",
          "/models/c3-aircross/colors/elixir-red/03.png",
          "/models/c3-aircross/colors/elixir-red/04.png",
          "/models/c3-aircross/colors/elixir-red/05.png",
        ],
      },
      {
        id: "monte-carlo-blue",
        name: "Bleu Monte Carlo (Opaque)",
        hex: "#1F3A63",
        upcharge: 4000,
        swatch: "/models/c3-aircross/swatches/monte-carlo-blue.png",
        renders: [
          "/models/c3-aircross/colors/monte-carlo-blue/01.png",
          "/models/c3-aircross/colors/monte-carlo-blue/02.png",
          "/models/c3-aircross/colors/monte-carlo-blue/03.png",
          "/models/c3-aircross/colors/monte-carlo-blue/04.png",
          "/models/c3-aircross/colors/monte-carlo-blue/05.png",
        ],
      },
      {
        id: "monte-carlo-blue-bi",
        name: "Bleu Monte Carlo · Toit bi-ton Noir Perla Nera",
        hex: "#1F3A63",
        roofHex: "#0E0E0E",
        upcharge: 4000,
        swatch: "/models/c3-aircross/swatches/monte-carlo-blue-bi.png",
        renders: [
          "/models/c3-aircross/colors/monte-carlo-blue-bi/01.png",
          "/models/c3-aircross/colors/monte-carlo-blue-bi/02.png",
          "/models/c3-aircross/colors/monte-carlo-blue-bi/03.png",
          "/models/c3-aircross/colors/monte-carlo-blue-bi/04.png",
          "/models/c3-aircross/colors/monte-carlo-blue-bi/05.png",
        ],
      },
      {
        id: "mercury-grey",
        name: "Gris Mercury (Métallisé)",
        hex: "#6F7479",
        upcharge: 4000,
        swatch: "/models/c3-aircross/swatches/mercury-grey.png",
        renders: [
          "/models/c3-aircross/colors/mercury-grey/01.png",
          "/models/c3-aircross/colors/mercury-grey/02.png",
          "/models/c3-aircross/colors/mercury-grey/03.png",
          "/models/c3-aircross/colors/mercury-grey/04.png",
          "/models/c3-aircross/colors/mercury-grey/05.png",
        ],
      },
      {
        id: "mercury-grey-bi",
        name: "Gris Mercury · Toit bi-ton Noir Perla Nera",
        hex: "#6F7479",
        roofHex: "#0E0E0E",
        upcharge: 4000,
        renders: [
          "/models/c3-aircross/colors/mercury-grey-bi/01.png",
          "/models/c3-aircross/colors/mercury-grey-bi/02.png",
          "/models/c3-aircross/colors/mercury-grey-bi/03.png",
          "/models/c3-aircross/colors/mercury-grey-bi/04.png",
          "/models/c3-aircross/colors/mercury-grey-bi/05.png",
        ],
      },
      {
        id: "perla-nera",
        name: "Noir Perla Nera (Nacré)",
        hex: "#0A0A0A",
        upcharge: 4000,
        swatch: "/models/c3-aircross/swatches/perla-nera.png",
        renders: [
          "/models/c3-aircross/colors/perla-nera/01.png",
          "/models/c3-aircross/colors/perla-nera/02.png",
          "/models/c3-aircross/colors/perla-nera/03.png",
          "/models/c3-aircross/colors/perla-nera/04.png",
          "/models/c3-aircross/colors/perla-nera/05.png",
        ],
      },
      {
        id: "perla-nera-bi",
        name: "Noir Perla Nera · Toit bi-ton Blanc Opale",
        hex: "#0A0A0A",
        roofHex: "#F4F3EE",
        upcharge: 4000,
        renders: [
          "/models/c3-aircross/colors/perla-nera-bi/01.png",
          "/models/c3-aircross/colors/perla-nera-bi/02.png",
          "/models/c3-aircross/colors/perla-nera-bi/03.png",
          "/models/c3-aircross/colors/perla-nera-bi/04.png",
          "/models/c3-aircross/colors/perla-nera-bi/05.png",
        ],
      },
      {
        id: "polar-white",
        name: "Blanc Banquise (Opaque)",
        hex: "#F4F3EE",
        upcharge: 4000,
        swatch: "/models/c3-aircross/swatches/polar-white.png",
        renders: [
          "/models/c3-aircross/colors/polar-white/01.png",
          "/models/c3-aircross/colors/polar-white/02.png",
          "/models/c3-aircross/colors/polar-white/03.png",
          "/models/c3-aircross/colors/polar-white/04.png",
          "/models/c3-aircross/colors/polar-white/05.png",
        ],
      },
      {
        id: "polar-white-bi",
        name: "Blanc Banquise · Toit bi-ton Noir Perla Nera",
        hex: "#F4F3EE",
        roofHex: "#0E0E0E",
        upcharge: 4000,
        renders: [
          "/models/c3-aircross/colors/polar-white-bi/01.png",
          "/models/c3-aircross/colors/polar-white-bi/02.png",
          "/models/c3-aircross/colors/polar-white-bi/03.png",
          "/models/c3-aircross/colors/polar-white-bi/04.png",
          "/models/c3-aircross/colors/polar-white-bi/05.png",
        ],
      },
      {
        id: "green-bt",
        name: "Vert Montana · Toit bi-ton Blanc Opale",
        hex: "#414F2C",
        roofHex: "#F4F3EE",
        upcharge: 4000,
        swatch: "/models/c3-aircross/swatches/green-bt.png",
        renders: [
          "/models/c3-aircross/colors/green-bt/01.png",
          "/models/c3-aircross/colors/green-bt/02.png",
          "/models/c3-aircross/colors/green-bt/03.png",
          "/models/c3-aircross/colors/green-bt/04.png",
          "/models/c3-aircross/colors/green-bt/05.png",
        ],
      },
    ],
    lifestyle: [
      { src: "/models/c3-aircross/features/advanced-comfort.jpg", caption: "Advanced Comfort® — suspensions et sièges brevetés" },
      { src: "/models/c3-aircross/features/connected-services.jpg", caption: "Services connectés, CarPlay & Android Auto sans fil" },
      { src: "/models/c3-aircross/features/panoramic-roof.jpg", caption: "Toit panoramique, pour lever les yeux" },
      { src: "/models/c3-aircross/features/c-zen.jpg", caption: "C-Zen Lounge — plus d'espace, moins de bruit" },
      { src: "/models/c3-aircross/features/engine-petrol.jpg", caption: "PureTech — efficacité marocaine" },
      { src: "/models/c3-aircross/features/engine-hybrid.jpg", caption: "Hybrid 48V — jusqu'à 15 % de carburant en moins en ville" },
    ],
    trims: [
      {
        slug: "plus-mhev",
        name: "Plus MHEV",
        priceFrom: mad(234900),
        engine: "1.2 PureTech Hybrid 48V",
        horsepower: 136,
        transmission: "EAT6 automatique",
        highlights: [
          "Advanced Comfort®",
          "Écran 10,25\" tactile",
          "Climatisation automatique",
          "Freinage automatique d'urgence",
          "Caméra de recul",
          "Toit panoramique optionnel",
        ],
        added: [
          "Head-up display numérique",
          "6 airbags + détection d'angle mort",
          "Régulateur adaptatif",
          "Apple CarPlay & Android Auto sans fil",
        ],
      },
    ],
    specs: {
      dimensions: {
        length: 4395,
        width: 1795,
        height: 1660,
        wheelbase: 2670,
        trunk: 460,
        trunkMax: 1600,
        weight: 1303,
        turningCircle: 10.8,
      },
      performance: {
        topSpeed: 193,
        acceleration: 9.5,
        consumption: 5.2,
        co2: 117,
        fuelTank: 44,
      },
      interior: {
        touchscreen: "Écran tactile 10,25\"",
        digitalCluster: "Combiné numérique Head-Up Display",
        seats: 5,
        upholstery: "Tissu Advanced Comfort® Alcinéa",
        sound: "6 haut-parleurs Hi-Fi",
      },
      safety: [
        "Freinage automatique d'urgence (AEBS)",
        "Alerte de franchissement de ligne",
        "Reconnaissance des panneaux",
        "Surveillance d'angle mort",
        "Régulateur adaptatif",
        "Caméra de recul + radars avant/arrière",
        "6 airbags",
        "ESP + ABS + AFU",
      ],
      connectivity: [
        "Apple CarPlay & Android Auto sans fil",
        "Citroën Connect Services + 1 an gratuit",
        "Navigation connectée 3D TomTom",
        "Recharge à induction",
        "4 ports USB-C",
        "Commandes vocales « Hey Citroën »",
      ],
      warranty: {
        vehicleYears: 2,
        paintYears: 3,
        assistanceYears: 2,
      },
    },
  },

  // ────────── C5 Aircross ──────────
  {
    slug: "c5-aircross",
    name: "Citroën C5 Aircross",
    shortName: "C5 Aircross",
    tagline: {
      fr: "Le SUV familial signature. Confort maximal, style affirmé.",
      ar: "سيارة الدفع الرباعي العائلية المميزة. راحة قصوى وأناقة واثقة.",
      en: "The signature family SUV. Peak comfort, confident style.",
    },
    bodyType: "suv",
    fuelType: "hybrid",
    seats: 5,
    priceFrom: mad(295900),
    accentHex: "#1a355e",
    heroImage: "/models/c5-aircross/hero/hero-desktop.jpg",
    heroImageMobile: "/models/c5-aircross/hero/hero-mobile.jpg",
    colors: [
      {
        id: "monte-carlo-blue",
        name: "Bleu Monte Carlo",
        hex: "#1F3A63",
        upcharge: 0,
        renders: ["/models/c5-aircross/hero/thumb.jpg"],
      },
    ],
    lifestyle: [
      { src: "/models/c5-aircross/lifestyle/style.jpg", caption: "Style affirmé" },
      { src: "/models/c5-aircross/lifestyle/comfort.jpg", caption: "Advanced Comfort® de nouvelle génération" },
      { src: "/models/c5-aircross/lifestyle/phev.jpg", caption: "Hybride rechargeable — jusqu'à 55 km en électrique" },
      { src: "/models/c5-aircross/lifestyle/engines.jpg", caption: "Motorisations — essence, hybride, 100% électrique à venir" },
      { src: "/models/c5-aircross/lifestyle/c-series.jpg", caption: "Série C — finition exclusive" },
      { src: "/models/c5-aircross/lifestyle/services.jpg", caption: "Services connectés Citroën" },
      { src: "/models/c5-aircross/lifestyle/offers.jpg", caption: "Offres Citroën Maroc" },
    ],
    trims: [
      {
        slug: "plus",
        name: "Plus",
        priceFrom: mad(295900),
        engine: "1.6 PureTech + Hybrid PHEV",
        horsepower: 180,
        transmission: "e-EAT8 automatique",
        highlights: [
          "Hybride rechargeable 55 km d'autonomie électrique",
          "Sièges Advanced Comfort® cuir",
          "Écran HD 13\" tactile",
          "Assistance à la conduite niveau 2",
          "Toit panoramique",
        ],
        added: [
          "Recharge rapide Mode 3 (7,4 kW)",
          "Câble Type 2 + Mode 3 fournis",
          "Mode tout électrique Zéro Émission",
          "Climatisation tri-zone",
        ],
      },
    ],
    specs: {
      dimensions: {
        length: 4650,
        width: 1860,
        height: 1695,
        wheelbase: 2730,
        trunk: 580,
        trunkMax: 1630,
        weight: 1810,
        turningCircle: 11.8,
      },
      performance: {
        topSpeed: 225,
        acceleration: 8.7,
        consumption: 1.4,
        co2: 32,
        electricRange: 55,
        fuelTank: 43,
      },
      interior: {
        touchscreen: "Écran tactile HD 13\"",
        digitalCluster: "Combiné 100 % numérique 7\" configurable",
        seats: 5,
        upholstery: "Cuir nappa Advanced Comfort®",
        sound: "Système audio Hi-Fi 6 haut-parleurs",
      },
      safety: [
        "Highway Driver Assist (niveau 2)",
        "Freinage automatique d'urgence nuit/jour",
        "Détection d'angle mort active",
        "Alerte de somnolence",
        "Reconnaissance élargie de panneaux",
        "Park Assist — stationnement automatique",
        "Vision 360° (4 caméras HD)",
        "8 airbags",
      ],
      connectivity: [
        "Apple CarPlay & Android Auto sans fil",
        "Citroën Connect Services + 3 ans",
        "Mises à jour logicielles à distance (OTA)",
        "Navigation 3D temps réel",
        "Recharge à induction ventilée",
        "App My Citroën — pilotage de la charge",
      ],
      warranty: {
        vehicleYears: 2,
        batteryYears: 8,
        paintYears: 3,
        assistanceYears: 2,
      },
    },
  },

  // ────────── Berlingo ──────────
  {
    slug: "berlingo",
    name: "Citroën Berlingo",
    shortName: "Berlingo",
    tagline: {
      fr: "L'espace de vie sur roues. Modularité XXL, esprit de famille.",
      ar: "مساحة حياة متنقلة. مرونة XXL، روح عائلية.",
      en: "Living space on wheels. XXL modularity, family-first.",
    },
    bodyType: "van",
    fuelType: "diesel",
    seats: 7,
    priceFrom: mad(195900),
    accentHex: "#aa5e2a",
    heroImage: "/models/berlingo/hero/hero-desktop.jpg",
    heroImageMobile: "/models/berlingo/hero/hero-mobile.jpg",
    colors: [
      {
        id: "kargo-blue",
        name: "Bleu Kargo",
        hex: "#2F4C66",
        upcharge: 0,
        renders: ["/models/berlingo/trims/plus.png"],
      },
    ],
    trimShots: {
      plus: "/models/berlingo/trims/plus.png",
      max: "/models/berlingo/trims/max.png",
      xtr: "/models/berlingo/trims/xtr.png",
    },
    lifestyle: [
      { src: "/models/berlingo/features/design.jpg", caption: "Design affirmé, personnalité utilitaire" },
      { src: "/models/berlingo/features/comfort.jpg", caption: "Confort à toutes les places" },
      { src: "/models/berlingo/features/connectivity.jpg", caption: "Connectivité complète" },
      { src: "/models/berlingo/features/space.jpg", caption: "Habitabilité XXL — 7 places, 806 L de coffre" },
      { src: "/models/berlingo/features/gallery.jpg", caption: "Portes coulissantes, ouvertures arrières en bec de canard" },
    ],
    trims: [
      {
        slug: "plus",
        name: "Plus",
        priceFrom: mad(195900),
        engine: "1.5 BlueHDi",
        horsepower: 100,
        transmission: "Manuelle 6 vitesses",
        highlights: ["7 places", "Portes latérales coulissantes", "Climatisation manuelle", "Radar de recul"],
      },
      {
        slug: "max",
        name: "Max",
        priceFrom: mad(199900),
        engine: "1.5 BlueHDi",
        horsepower: 100,
        transmission: "Manuelle 6 vitesses",
        highlights: ["Climatisation automatique", "Écran tactile 8\"", "Caméra de recul", "Régulateur de vitesse"],
      },
      {
        slug: "xtr",
        name: "XTR",
        priceFrom: mad(238900),
        engine: "1.5 BlueHDi",
        horsepower: 100,
        transmission: "Automatique EAT8",
        highlights: [
          "Look baroudeur avec protections extérieures",
          "Jantes 17\" diamantées",
          "Grip Control",
          "Barres de toit",
          "Sellerie spécifique XTR",
        ],
        added: [
          "Transmission automatique EAT8 (vs manuelle sur Plus/Max)",
          "Mode Hill Assist Descent Control",
          "Projecteurs LED intégraux",
          "Sellerie mixte TEP / tissu XTR",
        ],
      },
    ],
    specs: {
      dimensions: {
        length: 4403,
        width: 1848,
        height: 1812,
        wheelbase: 2785,
        trunk: 775,
        trunkMax: 3000,
        weight: 1495,
        turningCircle: 11.4,
      },
      performance: {
        topSpeed: 173,
        acceleration: 13.0,
        consumption: 4.8,
        co2: 126,
        fuelTank: 50,
      },
      interior: {
        touchscreen: "Écran tactile 8\" (10\" sur XTR)",
        digitalCluster: "Combiné analogique + écran TFT 3,5\"",
        seats: 5,
        upholstery: "Tissu Modutop® (sellerie XTR spécifique)",
        sound: "Système audio 6 haut-parleurs",
      },
      safety: [
        "Freinage automatique d'urgence",
        "Alerte de franchissement de ligne",
        "Détection d'angle mort (Max/XTR)",
        "Régulateur/limiteur de vitesse",
        "Radar de recul + caméra",
        "6 airbags",
        "Isofix 3 places arrière",
        "Grip Control 6 modes (XTR)",
      ],
      connectivity: [
        "Apple CarPlay & Android Auto (filaire)",
        "Bluetooth + double USB-C",
        "Citroën Connect Nav (Max/XTR)",
        "Prise 12 V coffre — parfaite pour le camping",
        "Barres de toit modulaires 100 kg (XTR)",
      ],
      warranty: {
        vehicleYears: 2,
        paintYears: 3,
        assistanceYears: 2,
      },
    },
  },
];

export function getModelBySlug(slug: string): CatalogModel | undefined {
  return catalog.find((m) => m.slug === slug);
}

export function formatMAD(amount: number): string {
  return new Intl.NumberFormat("fr-MA", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(amount);
}
