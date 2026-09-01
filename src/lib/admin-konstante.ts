// Заједничке константе за админ сесију. Овај фајл нема ниједан import —
// намјерно, да га може користити и `proxy.ts` (који трчи прије сваке странице,
// у окружењу гдје нема Node алата попут `crypto`).

export const KOLACIC = "admin_sesija";
export const TRAJANJE_SEKUNDI = 7 * 24 * 60 * 60; // 7 дана
