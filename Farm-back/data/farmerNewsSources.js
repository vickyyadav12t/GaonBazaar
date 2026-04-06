/**
 * Curated official India agriculture entry points (hybrid news model).
 * Groq only explains how farmers might use these — it does not fetch live page content.
 * Keep URLs on government or clearly official domains only.
 */
const FARMER_NEWS_SOURCES = [
  {
    id: "farmer-gov-in",
    titleEn: "National Farmers' Portal",
    titleHi: "राष्ट्रीय किसान पोर्टल",
    url: "https://www.farmer.gov.in/",
    orgEn: "DAC&FW, Government of India",
    orgHi: "कृषि एवं किसान कल्याण विभाग, भारत सरकार",
    category: "portals",
    categoryLabelEn: "Government portal",
    categoryLabelHi: "सरकारी पोर्टल",
    descriptionEn:
      "Central farmer corner with links to schemes, advisories, and related services (verify current pages on site).",
    descriptionHi:
      "योजनाओं, सलाह और सेवाओं के लिंक वाला केंद्रीय किसान कॉर्नर (साइट पर वर्तमान पृष्ठ जाँचें)।",
  },
  {
    id: "mkisan",
    titleEn: "mKisan — advisories & farmer services",
    titleHi: "एम-किसान — सलाह व सेवाएँ",
    url: "https://mkisan.gov.in/",
    orgEn: "Ministry of Agriculture & Farmers Welfare",
    orgHi: "कृषि एवं किसान कल्याण मंत्रालय",
    category: "extension",
    categoryLabelEn: "Advisories",
    categoryLabelHi: "सलाह",
    descriptionEn:
      "Government channel for crop advisories, SMS/mobile services, and related farmer-facing information.",
    descriptionHi: "फसल सलाह, एसएमएस/मोबाइल सेवाओं और किसान-केंद्रित जानकारी के लिए सरकारी चैनल।",
  },
  {
    id: "pm-kisan",
    titleEn: "PM-KISAN — official scheme portal",
    titleHi: "पीएम-किसान — आधिकारिक पोर्टल",
    url: "https://pmkisan.gov.in/",
    orgEn: "Government of India",
    orgHi: "भारत सरकार",
    category: "schemes",
    categoryLabelEn: "Scheme",
    categoryLabelHi: "योजना",
    descriptionEn:
      "Official portal for PM-KISAN beneficiary information and registration-related guidance (always confirm eligibility on site).",
    descriptionHi:
      "पीएम-किसान लाभार्थी जानकारी व पंजीकरण संबंधी मार्गदर्शन का आधिकारिक पोर्टल (पात्रता साइट पर ही पुष्टि करें)।",
  },
  {
    id: "enam",
    titleEn: "e-NAM — National Agriculture Market",
    titleHi: "ई-नाम — राष्ट्रीय कृषि बाज़ार",
    url: "https://www.enam.gov.in/",
    orgEn: "SFAC / Government initiative",
    orgHi: "एसएफएसी / सरकारी पहल",
    category: "markets",
    categoryLabelEn: "Markets",
    categoryLabelHi: "बाज़ार",
    descriptionEn:
      "National digital mandi integration initiative; useful to understand online trade flows and mandi connectivity (details on official site).",
    descriptionHi:
      "राष्ट्रीय डिजिटल मंडी एकीकरण; ऑनलाइन व्यापार और मंडी जुड़ाव समझने के लिए (विवरण आधिकारिक साइट पर)।",
  },
  {
    id: "agriculture-ministry",
    titleEn: "Ministry of Agriculture & Farmers Welfare",
    titleHi: "कृषि एवं किसान कल्याण मंत्रालय",
    url: "https://agriculture.gov.in/",
    orgEn: "Government of India",
    orgHi: "भारत सरकार",
    category: "policy",
    categoryLabelEn: "Policy & notices",
    categoryLabelHi: "नीति व सूचनाएँ",
    descriptionEn:
      "Central ministry homepage for policies, major schemes, and official announcements (cross-check dates and circulars here).",
    descriptionHi:
      "नीतियों, प्रमुख योजनाओं और आधिकारिक घोषणाओं के लिए केंद्रीय मंत्रालय मुखपृष्ठ (तिथि व परिपत्र यहीं जाँचें)।",
  },
  {
    id: "soil-health",
    titleEn: "Soil Health Card — official access",
    titleHi: "मृदा स्वास्थ्य कार्ड — आधिकारिक पहुँच",
    url: "https://soilhealth.dac.gov.in/",
    orgEn: "DAC&FW",
    orgHi: "कृषि एवं किसान कल्याण विभाग",
    category: "soil",
    categoryLabelEn: "Soil & nutrients",
    categoryLabelHi: "मिट्टी व पोषक",
    descriptionEn:
      "Official soil health programme entry points; use for understanding soil testing and card-related services.",
    descriptionHi: "मृदा परीक्षण व कार्ड संबंधी सेवाओं के लिए आधिकारिक मृदा स्वास्थ्य कार्यक्रम प्रवेश बिंदु।",
  },
  {
    id: "agmarknet",
    titleEn: "AGMARKNET — market prices (reference)",
    titleHi: "एगमार्कनेट — बाज़ार भाव (संदर्भ)",
    url: "https://agmarknet.gov.in/",
    orgEn: "DAC&FW / NIC",
    orgHi: "कृषि विभाग / एनआईसी",
    category: "markets",
    categoryLabelEn: "Prices (reference)",
    categoryLabelHi: "भाव (संदर्भ)",
    descriptionEn:
      "Wholesale price and arrival information network; reference only — local mandi rates may differ.",
    descriptionHi:
      "थोक भाव व आवक की जानकारी; केवल संदर्भ — स्थानीय मंडी भाव अलग हो सकते हैं।",
  },
  {
    id: "agromet-imd",
    titleEn: "IMD Agrometeorological advisories",
    titleHi: "आईएमडी कृषि मौसम सलाह",
    url: "https://agromet.imd.gov.in/",
    orgEn: "India Meteorological Department",
    orgHi: "भारत मौसम विज्ञान विभाग",
    category: "weather",
    categoryLabelEn: "Weather (reference)",
    categoryLabelHi: "मौसम (संदर्भ)",
    descriptionEn:
      "District-level agromet bulletins for planning; not a substitute for local extension or emergency alerts.",
    descriptionHi:
      "योजना के लिए जिला स्तर की एग्रोमेट बुलेटिन; स्थानीय विस्तार या आपात अलर्ट का विकल्प नहीं।",
  },
];

module.exports = { FARMER_NEWS_SOURCES };
