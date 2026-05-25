const replacements: Array<[RegExp, string]> = [
  [/\bfluj[oa]?\b/g, "flujo"],
  [/\bflj[oa]?\b/g, "flujo"],
  [/\bflgo\b/g, "flujo"],
  [/\bprose?so\b/g, "proceso"],
  [/\bfactu?r?a?s?\b/g, "factura"],
  [/\bfacr?ut?r?a?s?\b/g, "factura"],
  [/\bfacrura?s?\b/g, "factura"],
  [/\bfoactura?s?\b/g, "factura"],
  [/\bcomprobant[ea]s?\b/g, "factura"],
  [/\bsini?e?s?t?r?o?s?\b/g, "siniestro"],
  [/\bsisnie?t?r?o?s?\b/g, "siniestro"],
  [/\bsisni?e?t?r?o?s?\b/g, "siniestro"],
  [/\bsiniestralidad\b/g, "siniestro"],
  [/\bpoliza?s?\b/g, "poliza"],
  [/\bpolisa?s?\b/g, "poliza"],
  [/\btarifari[oa]s?\b/g, "tarifario"],
  [/\btarif[ao]s?\b/g, "tarifario"],
  [/\btaller?e?s?\b/g, "taller"],
  [/\baudit[ao]r?i?a?s?\b/g, "auditoria"],
  [/\baudtor\b/g, "auditor"],
  [/\baudtoria\b/g, "auditoria"],
  [/\bvalid[eé]s\b/g, "validez"],
  [/\bvalidar?c?i?o?n\b/g, "validacion"],
  [/\bcompara?r?\b/g, "comparar"],
  [/\bduplicad[oa]s?\b/g, "duplicado"],
  [/\bsobre\s*precio?s?\b/g, "sobreprecio"],
  [/\bsobreprecio?s?\b/g, "sobreprecio"],
  [/\bdañ?o?s?\b/g, "dano"],
  [/\bdano?s?\b/g, "dano"],
  [/\berro?r?e?s?\b/g, "error"],
  [/\bortografic[oa]s?\b/g, "ortografico"],
  [/\bexplic[ao]r?\b/g, "explicar"],
  [/\binterpr?etar?\b/g, "interpretar"],
  [/\bpredecir?\b/g, "predecir"],
];

const phraseReplacements: Array<[RegExp, string]> = [
  [/que\s+debo\s+hacer/g, "explicar flujo"],
  [/como\s+empiezo/g, "explicar flujo"],
  [/por\s+donde\s+empiezo/g, "explicar flujo"],
  [/que\s+sigue/g, "explicar flujo"],
  [/flujo\s+de\s+trabajo/g, "explicar flujo"],
  [/reporte\s+del\s+cliente/g, "reporte del cliente"],
  [/factura\s+del\s+taller/g, "factura del taller"],
];

export function normalizeAgentMessage(message: string) {
  let text = message
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[¿?¡!.,;:()[\]{}"'`´]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  for (const [pattern, replacement] of replacements) {
    text = text.replace(pattern, replacement);
  }
  for (const [pattern, replacement] of phraseReplacements) {
    text = text.replace(pattern, replacement);
  }

  return text.replace(/\s+/g, " ").trim();
}

export function likelyMeans(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}
