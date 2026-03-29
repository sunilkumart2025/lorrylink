const DEFAULT_SUGGESTIONS = [
  'How do I find a load?',
  'How do I post my truck?',
  'Show wallet help',
  'How does KYC work?',
];

const HELP_RESPONSE = {
  text: 'I can help with loads, posting your truck, bookings, wallet questions, KYC, ratings, navigation, membership plans, language settings, and safety guidance.',
  suggestions: DEFAULT_SUGGESTIONS,
};

const INTENTS = [
  {
    name: 'greeting',
    keywords: ['hello', 'hi', 'hey', 'namaste', 'swagat', 'good morning', 'good evening'],
    response: {
      text: 'Namaste! I am LinkAI, your LoadLink assistant. Ask me about finding loads, posting your truck, payments, KYC, bookings, or membership plans.',
      suggestions: DEFAULT_SUGGESTIONS,
    },
  },
  {
    name: 'help',
    keywords: ['help', 'what can you do', 'options', 'menu', 'support', 'madad'],
    response: HELP_RESPONSE,
  },
  {
    name: 'profile',
    keywords: ['profile', 'account', 'driver profile', 'edit profile', 'home city'],
    response: {
      text: 'Open Profile to update your personal details, home city, KYC progress, and membership status. Keeping profile details current improves trust and route matching quality.',
      suggestions: ['How does KYC work?', 'Show membership plans', 'How do ratings work?'],
    },
  },
  {
    name: 'find_load',
    keywords: ['find load', 'load', 'matches', 'match', 'freight market', 'available loads', 'shipment'],
    response: {
      text: 'To find a load, open Home and tap Freight Market or go to the Market tab. Review pickup, drop, rate, and distance, then tap Accept Load when the trip fits your route.',
      suggestions: ['How do I post my truck?', 'How do bookings work?', 'How do I improve my rating?'],
    },
  },
  {
    name: 'post_truck',
    keywords: ['post truck', 'post my truck', 'empty truck', 'post empty truck', 'availability', 'truck post'],
    response: {
      text: 'To post your truck, open the Post Truck flow from Home. Add your current position, destination, vehicle type, available tons, and departure timing, then tap Find Optimal Loads.',
      suggestions: ['How do I find a load?', 'How do combo trips work?', 'What is home route?'],
    },
  },
  {
    name: 'bookings',
    keywords: ['booking', 'bookings', 'active trip', 'my loads', 'delivery status', 'trip status'],
    response: {
      text: 'Open Bookings to track requested, in-progress, and completed loads. Use Navigate during the trip, and use Reached Destination when the receiver gives you the OTP to close delivery.',
      suggestions: ['How does navigation work?', 'Show wallet help', 'How do ratings work?'],
    },
  },
  {
    name: 'wallet',
    keywords: ['wallet', 'payment', 'payout', 'balance', 'money', 'earnings', 'paise', 'cash'],
    response: {
      text: 'Wallet shows your earnings, advances, and payout history. Completed deliveries sync into wallet after the booking is closed successfully.',
      suggestions: ['How do bookings work?', 'How do I improve my rating?', 'Show membership plans'],
    },
  },
  {
    name: 'kyc',
    keywords: ['kyc', 'verify', 'verification', 'aadhaar', 'dl', 'license', 'rc', 'profile verification'],
    response: {
      text: 'Open Profile to check your KYC progress. Verified documents improve trust score and unlock better access to premium freight and membership benefits.',
      suggestions: ['How do ratings work?', 'Show membership plans', 'How do I change language?'],
    },
  },
  {
    name: 'rating',
    keywords: ['rating', 'ratings', 'review', 'reviews', 'stars', 'trust score'],
    response: {
      text: 'High ratings help you get better visibility for premium loads. After delivery, complete the trip properly and encourage the shipper to submit a review.',
      suggestions: ['How do bookings work?', 'How do I find a load?', 'Show wallet help'],
    },
  },
  {
    name: 'combo',
    keywords: ['combo', 'multi leg', 'multileg', 'double load', 'chain loads'],
    response: {
      text: 'Combo trips link multiple loads on one route so you reduce empty return distance. Open Combo Trips to compare chained route opportunities and improve revenue per kilometer.',
      suggestions: ['How do I post my truck?', 'What is home route?', 'How do I calculate detour profit?'],
    },
  },
  {
    name: 'detour',
    keywords: ['detour', 'profit', 'detour profit', 'extra km', 'diesel cost'],
    response: {
      text: 'A simple detour check is: extra earning minus extra kilometers times diesel cost. A detour is usually worth it when the net gain stays clearly positive after fuel, tolls, and delay risk.',
      suggestions: ['How do combo trips work?', 'How do I find a load?', 'Show wallet help'],
    },
  },
  {
    name: 'home_route',
    keywords: ['home route', 'return home', 'return load', 'backhaul', 'home city'],
    response: {
      text: 'Home Route highlights loads that bring you closer to your home city. It is useful after a delivery when you want to reduce dead mileage on the return leg.',
      suggestions: ['How do combo trips work?', 'How do I post my truck?', 'How do I find a load?'],
    },
  },
  {
    name: 'membership',
    keywords: ['membership', 'subscription', 'plan', 'plans', 'starter', 'silver', 'gold', 'platinum', 'fleet'],
    response: {
      text: 'LoadLink membership plans unlock different levels of visibility and support. Starter covers essentials, while Silver, Gold, Platinum, and Fleet add stronger matching, support, and operating benefits.',
      suggestions: ['How does KYC work?', 'How do ratings work?', 'How do I find a load?'],
    },
  },
  {
    name: 'network_insights',
    keywords: ['network', 'market insights', 'heatmap', 'fuel', 'fuel banner', 'demand map'],
    response: {
      text: 'Use the Network or Market view to understand demand clusters and route opportunity. Fuel and route intelligence help you judge whether the next load or detour is worth taking.',
      suggestions: ['How do I calculate detour profit?', 'How do combo trips work?', 'How do I find a load?'],
    },
  },
  {
    name: 'navigation',
    keywords: ['navigation', 'navigate', 'route', 'live tracking', 'gps', 'map'],
    response: {
      text: 'Use Navigate from an active booking to open the live route screen. That view helps with route guidance, tracking, and the final delivery handoff flow.',
      suggestions: ['How do bookings work?', 'What should I do in an emergency?', 'How do I post my truck?'],
    },
  },
  {
    name: 'language_theme',
    keywords: ['language', 'theme', 'dark mode', 'light mode', 'hindi', 'tamil', 'english'],
    response: {
      text: 'You can switch language and theme from the controls in the driver header or sidebar. The app supports English, Hindi, and Tamil.',
      suggestions: ['How does KYC work?', 'Show membership plans', 'How do I find a load?'],
    },
  },
  {
    name: 'vault_docs',
    keywords: ['vault', 'documents', 'docs', 'proof', 'invoice', 'upload proof'],
    response: {
      text: 'Vault stores important trip and profile documents like proofs, invoices, and verification records. Use it whenever you need to upload or review trip paperwork.',
      suggestions: ['How does KYC work?', 'How do bookings work?', 'Show wallet help'],
    },
  },
  {
    name: 'safety',
    keywords: ['safety', 'emergency', 'accident', 'breakdown', 'police', 'hazard'],
    response: {
      text: 'Prioritize safety first. Secure the vehicle, share your live location when needed, and report route incidents through the app so other drivers can stay informed.',
      suggestions: ['How does navigation work?', 'How do bookings work?', 'Help'],
    },
  },
  {
    name: 'support_contact',
    keywords: ['contact support', 'call support', 'customer support', 'support team', 'agent', 'human help'],
    response: {
      text: 'I can handle basic app guidance, but for account-specific or urgent operational issues you should use the support path inside the app or your emergency help option if the issue is safety-related.',
      suggestions: ['Help', 'How does KYC work?', 'What should I do in an emergency?'],
    },
  },
  {
    name: 'farewell',
    keywords: ['bye', 'goodbye', 'thanks', 'thank you', 'ok thanks'],
    response: {
      text: 'Anytime. Come back if you want help with loads, bookings, payouts, KYC, or route decisions.',
      suggestions: DEFAULT_SUGGESTIONS,
    },
  },
];

function normalizeInput(text) {
  return text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
}

function getIntentScore(input, words, keywords) {
  return keywords.reduce((score, keyword) => {
    const matches = keyword.includes(' ')
      ? input.includes(keyword)
      : words.has(keyword);

    if (!matches) return score;
    return score + (keyword.includes(' ') ? 3 : 2);
  }, 0);
}

export function getAssistantReply(rawText) {
  const input = normalizeInput(rawText);

  if (!input) {
    return HELP_RESPONSE;
  }

  let bestIntent = null;
  let bestScore = 0;
  const words = new Set(input.split(' '));

  for (const intent of INTENTS) {
    const score = getIntentScore(input, words, intent.keywords);
    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent;
    }
  }

  if (bestIntent && bestScore > 0) {
    return bestIntent.response;
  }

  return {
    text: "I didn't fully catch that, but I can help with most basic app tasks like finding loads, posting your truck, bookings, payouts, KYC, membership, navigation, and safety guidance.",
    suggestions: DEFAULT_SUGGESTIONS,
  };
}

export { DEFAULT_SUGGESTIONS };
