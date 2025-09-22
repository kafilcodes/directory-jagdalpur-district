export type AdSlotConfig =
  | { type: "adsense"; slotId: string; minHeight?: number }
  | { type: "admanager"; adUnitPath: string; sizes: number[][]; divId: string; minHeight?: number }

export const adSlots: Record<string, AdSlotConfig> = {
  "homepage-top-banner": { type: "adsense", slotId: "0000000000", minHeight: 250 },
  "search-inline-1": {
    type: "admanager",
    adUnitPath: "/1234567/search/inline-1",
    sizes: [[300, 250], [336, 280], [320, 100]],
    divId: "gpt-search-inline-1",
    minHeight: 250,
  },
}
