// UI strings for the demo landing page, keyed by display language.
// Display language is chosen from the brand's first locale (or overridden by ?lang=).

export type DemoLang = "en" | "fr" | "ar";

export type DemoStrings = {
  badge: string;
  title1: string;
  title2: string;
  title3: string;
  subtitle: string;
  ctaPrimary: string;
  ctaVoice: string;
  statDealers: string;
  statResponse: string;
  statLanguages: string;
  whyTitle: string;
  whySub: string;
  feature1Title: string;
  feature1: string;
  feature2Title: string;
  feature2: string;
  feature3Title: string;
  feature3: string;
  feature4Title: string;
  feature4: string;
  feature5Title: string;
  feature5: string;
  feature6Title: string;
  feature6: string;
  rangeEyebrow: (n: number) => string;
  rangeTitle: (n: number, brand: string) => string;
  rangeCta: string;
  modelDiscuss: string;
  finalEyebrow: string;
  finalTitle: string;
  finalSub: string;
  finalHint: string;
  modelFeaturedLabel: string;
  modelFromLabel: string;
  speech: string;
  navOfficial: string;
  navTagline: string;
  agentRole: (brand: string) => string;
};

export const DEMO_I18N: Record<DemoLang, DemoStrings> = {
  en: {
    badge: "AI Sales Concierge · Powered by Rihla",
    title1: "Chat, configure,",
    title2: "and book your",
    title3: "in minutes.",
    subtitle:
      "Rihla, your AI advisor, understands your needs, recommends the right model, simulates financing and books a test drive at your nearest dealer — chat or voice, available 24/7 in your language.",
    ctaPrimary: "Start the conversation",
    ctaVoice: "Or talk to Rihla",
    statDealers: "Dealers",
    statResponse: "Response",
    statLanguages: "Languages",
    whyTitle: "Why Rihla",
    whySub: "An experience that turns curiosity into a qualified lead.",
    feature1Title: "Chat or voice",
    feature1: "Customers pick their channel — instant message or natural voice call — and Rihla adapts.",
    feature2Title: "Multilingual",
    feature2: "French, Arabic, Darija, English — Rihla replies in the customer's language, no foreign accent.",
    feature3Title: "Lead in 6 turns",
    feature3: "Greeting to test-drive booking in 3 to 6 exchanges. Qualified leads sent to the dealership.",
    feature4Title: "AI recommendation",
    feature4: "Understands usage, budget, family size — proposes the right model, not a catalog.",
    feature5Title: "Built-in configurator",
    feature5: "Colors, trims, options — Rihla configures the vehicle live during the conversation.",
    feature6Title: "Compliant & secure",
    feature6: "Data hosted in-region. CRM export. GDPR-ready. CMI-ready for the booking deposit.",
    rangeEyebrow: (n) => `${n} models in the lineup`,
    rangeTitle: (n, brand) => `${n} ${brand} models to discover with Rihla.`,
    rangeCta: "View official site",
    modelDiscuss: "Discuss this model",
    finalEyebrow: "Ready to try?",
    finalTitle: "Talk to Rihla now.",
    finalSub: "Click the floating button at the bottom-right. Pick your language, your channel — Rihla does the rest.",
    finalHint: "Click the Rihla avatar at bottom-right",
    modelFeaturedLabel: "Featured model",
    modelFromLabel: "From",
    speech: "“Hello! What's the car for — city, family, or something specific?”",
    navOfficial: "Official site",
    navTagline: "Stellantis Demo · Powered by Rihla",
    agentRole: (brand) => `Advisor · ${brand}`,
  },
  fr: {
    badge: "Concierge IA · Propulsé par Rihla",
    title1: "Discutez, configurez,",
    title2: "et réservez votre",
    title3: "en quelques minutes.",
    subtitle:
      "Rihla, votre conseillère IA, comprend vos besoins, vous recommande le bon modèle, simule le financement et organise un essai chez le concessionnaire le plus proche — par chat ou en appel vocal, disponible 24/7 dans la langue qui vous convient.",
    ctaPrimary: "Démarrer la conversation",
    ctaVoice: "Ou parlez à Rihla",
    statDealers: "Concessionnaires",
    statResponse: "Réponse",
    statLanguages: "Langues",
    whyTitle: "Pourquoi Rihla",
    whySub: "Une expérience qui transforme la curiosité en lead qualifié.",
    feature1Title: "Chat ou voix",
    feature1: "Le client choisit son canal — message instantané ou appel vocal naturel — et Rihla s'adapte.",
    feature2Title: "Multilingue natif",
    feature2: "Français, arabe, darija, anglais — Rihla répond dans la langue du client, sans accent étranger.",
    feature3Title: "Lead en 6 tours",
    feature3: "De l'accueil au rendez-vous d'essai en 3 à 6 échanges. Lead qualifié envoyé au concessionnaire.",
    feature4Title: "Recommandation IA",
    feature4: "Comprend usage, budget, taille de famille, et propose le bon modèle — pas un catalogue.",
    feature5Title: "Configurateur intégré",
    feature5: "Couleurs, finitions, options — Rihla configure le véhicule pendant la conversation.",
    feature6Title: "Conforme & sécurisé",
    feature6: "Données stockées en région. Export CRM. RGPD-ready. CMI-ready pour l'acompte.",
    rangeEyebrow: (n) => `La gamme · ${n} modèles`,
    rangeTitle: (n, brand) => `${n} modèles ${brand} à découvrir avec Rihla.`,
    rangeCta: "Voir le site officiel",
    modelDiscuss: "Discuter de ce modèle",
    finalEyebrow: "Prêt à essayer ?",
    finalTitle: "Discutez avec Rihla maintenant.",
    finalSub: "Cliquez sur le bouton flottant en bas à droite. Choisissez votre langue, votre canal — Rihla fait le reste.",
    finalHint: "Cliquez sur l'avatar Rihla en bas à droite",
    modelFeaturedLabel: "Modèle mis en avant",
    modelFromLabel: "À partir de",
    speech: "« Bonjour ! Pour quel usage cherchez-vous votre voiture ? »",
    navOfficial: "Site officiel",
    navTagline: "Stellantis Demo · Propulsé par Rihla",
    agentRole: (brand) => `Conseillère · ${brand}`,
  },
  ar: {
    badge: "مستشارة المبيعات الذكية · بواسطة رحلة",
    title1: "تحدّث، خصّص،",
    title2: "واحجز",
    title3: "في دقائق.",
    subtitle:
      "رحلة، مستشارتك الذكية، تفهم احتياجاتك، تنصحك بالموديل المناسب، تحاكي التمويل وتنظّم تجربة قيادة لدى أقرب وكيل — كتابةً أو صوتياً، متاحة على مدار الساعة بلغتك.",
    ctaPrimary: "ابدأ المحادثة",
    ctaVoice: "أو تحدّث مع رحلة",
    statDealers: "وكلاء",
    statResponse: "الرد",
    statLanguages: "اللغات",
    whyTitle: "لماذا رحلة",
    whySub: "تجربة تحوّل الاهتمام إلى عميل مؤهل.",
    feature1Title: "كتابة أو صوت",
    feature1: "يختار العميل قناته — رسالة فورية أو مكالمة طبيعية — ورحلة تتكيّف.",
    feature2Title: "متعددة اللغات",
    feature2: "عربية، إنجليزية، فرنسية، دارجة — رحلة تردّ بلغة العميل دون لكنة أجنبية.",
    feature3Title: "عميل مؤهل في 6 خطوات",
    feature3: "من الترحيب إلى حجز التجربة في 3 إلى 6 تبادلات. العميل المؤهل يُرسل للوكيل.",
    feature4Title: "توصية ذكية",
    feature4: "تفهم الاستعمال، الميزانية، حجم العائلة — تقترح الموديل الصحيح، لا قائمة كاملة.",
    feature5Title: "مخصِّص مدمج",
    feature5: "ألوان، فئات، خيارات — رحلة تخصّص السيارة أثناء المحادثة.",
    feature6Title: "متوافقة وآمنة",
    feature6: "بيانات مستضافة محلياً. تصدير CRM. جاهزة GDPR. جاهزة CMI للعربون.",
    rangeEyebrow: (n) => `الموديلات · ${n}`,
    rangeTitle: (n, brand) => `${n} موديلات ${brand} لاكتشافها مع رحلة.`,
    rangeCta: "زر الموقع الرسمي",
    modelDiscuss: "ناقش هذا الموديل",
    finalEyebrow: "جاهز للتجربة ؟",
    finalTitle: "تحدّث مع رحلة الآن.",
    finalSub: "اضغط على الزر العائم في الأسفل. اختر لغتك وقناتك — رحلة تتكفل بالباقي.",
    finalHint: "اضغط على صورة رحلة في الأسفل",
    modelFeaturedLabel: "الموديل المميّز",
    modelFromLabel: "ابتداءً من",
    speech: "« أهلاً ! ما الاستعمال الذي تبحث عنه ؟ »",
    navOfficial: "الموقع الرسمي",
    navTagline: "عرض Stellantis · بواسطة رحلة",
    agentRole: (brand) => `مستشارة · ${brand}`,
  },
};

export function pickDemoLang(brandLocales: string[]): DemoLang {
  // Default display language driven by the brand's primary locale.
  const first = brandLocales[0] ?? "fr-MA";
  if (first.startsWith("ar")) return "ar";
  if (first.startsWith("en")) return "en";
  return "fr";
}
