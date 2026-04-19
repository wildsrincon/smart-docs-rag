export type LanguageCode = 'en' | 'es'

export function detectLanguage(text: string): LanguageCode {
  if (!text || text.trim().length < 3) return 'en'

  const spanishChars = /[\u00e1\u00e9\u00ed\u00f3\u00fa\u00f1\u00fc\u00c1\u00c9\u00cd\u00d3\u00da\u00d1\u00dc]/
  if (spanishChars.test(text)) return 'es'

  const spanishWords = /\b(el|la|los|las|un|una|de|en|es|que|por|para|con|como|pero|más|este|esta|ese|esa|yo|tú|él|ella|nosotros|ellos|su|mi|tu|del|al|se|me|te|le|lo|ya|no|sí|muy|bien|también|hola|gracias|por favor)\b/i
  if (spanishWords.test(text)) return 'es'

  return 'en'
}
