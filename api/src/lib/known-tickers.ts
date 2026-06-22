/**
 * Curated ticker overrides for companies that the public APIs (Yahoo, Alpha
 * Vantage, OpenFIGI, etc.) routinely fail to resolve from a fuzzy company
 * name. This is Layer 0 in the ticker-lookup fan-out and survives all
 * upstream outages.
 *
 * Keys are matched after normalising the input via normalizeCompanyName().
 * Matching is substring-based on either the key OR any synonym.
 */

export interface CuratedTicker {
  ticker: string;
  name: string;
  exchange: string;
  region: "US" | "ZA" | "EU" | "GLOBAL";
  /** Alternate names / common typos that should match this entry. */
  synonyms?: string[];
}

export const KNOWN_TICKERS: CuratedTicker[] = [
  // ── South Africa (JSE) ─────────────────────────────────────────────────
  { ticker: "AGL.JO", name: "Anglo American plc", exchange: "JSE", region: "ZA", synonyms: ["anglo american", "anglo america", "anglo"] },
  { ticker: "AMS.JO", name: "Anglo American Platinum", exchange: "JSE", region: "ZA", synonyms: ["amplats", "anglo platinum"] },
  { ticker: "ANG.JO", name: "AngloGold Ashanti", exchange: "JSE", region: "ZA", synonyms: ["anglogold", "ashanti"] },
  { ticker: "BHG.JO", name: "BHP Group", exchange: "JSE", region: "ZA", synonyms: ["bhp", "bhp billiton"] },
  { ticker: "SBK.JO", name: "Standard Bank Group", exchange: "JSE", region: "ZA", synonyms: ["standard bank", "stanbank"] },
  { ticker: "FSR.JO", name: "FirstRand", exchange: "JSE", region: "ZA", synonyms: ["firstrand", "first rand"] },
  { ticker: "ABG.JO", name: "Absa Group", exchange: "JSE", region: "ZA", synonyms: ["absa", "barclays africa"] },
  { ticker: "NED.JO", name: "Nedbank Group", exchange: "JSE", region: "ZA", synonyms: ["nedbank"] },
  { ticker: "CPI.JO", name: "Capitec Bank Holdings", exchange: "JSE", region: "ZA", synonyms: ["capitec"] },
  { ticker: "INL.JO", name: "Investec Limited", exchange: "JSE", region: "ZA", synonyms: ["investec"] },
  { ticker: "OMU.JO", name: "Old Mutual", exchange: "JSE", region: "ZA", synonyms: ["old mutual"] },
  { ticker: "SLM.JO", name: "Sanlam", exchange: "JSE", region: "ZA", synonyms: ["sanlam"] },
  { ticker: "DSY.JO", name: "Discovery Limited", exchange: "JSE", region: "ZA", synonyms: ["discovery", "discovery health"] },
  { ticker: "NPN.JO", name: "Naspers", exchange: "JSE", region: "ZA", synonyms: ["naspers"] },
  { ticker: "PRX.JO", name: "Prosus", exchange: "JSE", region: "ZA", synonyms: ["prosus"] },
  { ticker: "MTN.JO", name: "MTN Group", exchange: "JSE", region: "ZA", synonyms: ["mtn"] },
  { ticker: "VOD.JO", name: "Vodacom Group", exchange: "JSE", region: "ZA", synonyms: ["vodacom"] },
  { ticker: "SOL.JO", name: "Sasol", exchange: "JSE", region: "ZA", synonyms: ["sasol"] },
  { ticker: "SHP.JO", name: "Shoprite Holdings", exchange: "JSE", region: "ZA", synonyms: ["shoprite", "shoprite checkers", "checkers"] },
  { ticker: "WHL.JO", name: "Woolworths Holdings", exchange: "JSE", region: "ZA", synonyms: ["woolworths sa", "woolworths holdings"] },
  { ticker: "MRP.JO", name: "Mr Price Group", exchange: "JSE", region: "ZA", synonyms: ["mr price", "mister price"] },
  { ticker: "PIK.JO", name: "Pick n Pay Stores", exchange: "JSE", region: "ZA", synonyms: ["pick n pay", "pick and pay", "picknpay"] },
  { ticker: "TBS.JO", name: "Tiger Brands", exchange: "JSE", region: "ZA", synonyms: ["tiger brands"] },
  { ticker: "APN.JO", name: "Aspen Pharmacare", exchange: "JSE", region: "ZA", synonyms: ["aspen", "aspen pharmacare"] },
  { ticker: "BVT.JO", name: "Bidvest Group", exchange: "JSE", region: "ZA", synonyms: ["bidvest"] },
  { ticker: "SSW.JO", name: "Sibanye-Stillwater", exchange: "JSE", region: "ZA", synonyms: ["sibanye", "sibanye stillwater", "stillwater"] },
  { ticker: "GFI.JO", name: "Gold Fields", exchange: "JSE", region: "ZA", synonyms: ["gold fields", "goldfields"] },
  { ticker: "IMP.JO", name: "Impala Platinum Holdings", exchange: "JSE", region: "ZA", synonyms: ["implats", "impala"] },
  { ticker: "MNP.JO", name: "Mondi", exchange: "JSE", region: "ZA", synonyms: ["mondi"] },
  { ticker: "REI.JO", name: "Reinet Investments", exchange: "JSE", region: "ZA", synonyms: ["reinet"] },
  { ticker: "CFR.JO", name: "Compagnie Financiere Richemont", exchange: "JSE", region: "ZA", synonyms: ["richemont"] },
  { ticker: "ARI.JO", name: "African Rainbow Minerals", exchange: "JSE", region: "ZA", synonyms: ["african rainbow", "arm", "african rainbow minerals"] },
  { ticker: "AFH.JO", name: "Alexander Forbes", exchange: "JSE", region: "ZA", synonyms: ["alexander forbes", "alexforbes"] },
  { ticker: "PMR.JO", name: "Premier Group", exchange: "JSE", region: "ZA", synonyms: ["premier fmcg", "premier group", "premier"] },
  { ticker: "SUI.JO", name: "Sun International", exchange: "JSE", region: "ZA", synonyms: ["sun international", "suninternational"] },
  { ticker: "SPP.JO", name: "The SPAR Group", exchange: "JSE", region: "ZA", synonyms: ["spar", "spar group", "the spar group"] },
  { ticker: "TKG.JO", name: "Telkom SA", exchange: "JSE", region: "ZA", synonyms: ["telkom", "telkom sa"] },
  // ── Global tech (commonly typed) ───────────────────────────────────────
  { ticker: "MSFT", name: "Microsoft Corporation", exchange: "NASDAQ", region: "US", synonyms: ["microsoft", "msft"] },
  { ticker: "GOOGL", name: "Alphabet Inc.", exchange: "NASDAQ", region: "US", synonyms: ["alphabet", "google"] },
  { ticker: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", region: "US", synonyms: ["apple"] },
  { ticker: "AMZN", name: "Amazon.com Inc.", exchange: "NASDAQ", region: "US", synonyms: ["amazon"] },
  { ticker: "META", name: "Meta Platforms", exchange: "NASDAQ", region: "US", synonyms: ["meta", "facebook"] },
  { ticker: "NVDA", name: "NVIDIA Corporation", exchange: "NASDAQ", region: "US", synonyms: ["nvidia"] },
];

/**
 * Resolve a curated ticker by normalised company name.
 * Returns ALL matches (a name like "anglo" can match multiple Anglo American
 * entries) so the caller can rank/dedupe.
 */
export function findCuratedTickers(normalisedName: string): CuratedTicker[] {
  if (!normalisedName) return [];
  const q = normalisedName.toLowerCase().trim();
  if (!q) return [];

  const matches: CuratedTicker[] = [];
  for (const entry of KNOWN_TICKERS) {
    const candidates = [entry.name.toLowerCase(), ...(entry.synonyms || []).map((s) => s.toLowerCase())];
    for (const c of candidates) {
      if (c.includes(q) || q.includes(c)) {
        matches.push(entry);
        break;
      }
    }
  }
  return matches;
}
