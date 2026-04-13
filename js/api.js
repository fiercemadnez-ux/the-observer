const NVIDIA_API_URL = 'https://observer-proxy.ryanjogavel.workers.dev';

// --- SEEDED PRNG (mulberry32) ---
// Used during case/subject generation so all devices get the same result for the same day.
let _seededRand = null;

function seededRand() {
  if (!_seededRand) return Math.random(); // fallback
  _seededRand ^= _seededRand << 13;
  _seededRand ^= _seededRand >> 17;
  _seededRand ^= _seededRand << 5;
  return ((_seededRand >>> 0) / 0xFFFFFFFF);
}

function strToSeed(str) {
  // Simple djb2 hash
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i);
  return h >>> 0;
}

async function fetchDailySeed() {
  try {
    const res = await fetch('https://observer-proxy.ryanjogavel.workers.dev/daily-seed');
    const data = await res.json();
    _seededRand = strToSeed(data.seed);
  } catch(e) {
    // fallback: use local date
    const today = new Date().toISOString().slice(0, 10);
    _seededRand = strToSeed(today);
  }
}
const NVIDIA_MODEL = 'meta/llama-3.1-8b-instruct';

// Robust JSON parser: tries direct parse, then regex extract, then field extraction
function parseJsonResponse(raw, allowRaw = false) {
  // 1. Try direct parse
  try { return JSON.parse(raw); } catch(e) {}

  // 2. Try extracting first {...} block
  const match = raw.match(/\{[\s\S]*?\}/s) || raw.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch(e) {}
    // 3. Try fixing common issues: unescaped quotes, trailing commas
    try {
      const fixed = match[0]
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']')
        .replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":');
      return JSON.parse(fixed);
    } catch(e) {}
  }

  // 4. Try extracting "en" and "pt" fields manually
  const en = raw.match(/"en"\s*:\s*"([^"]+)"/);
  const pt = raw.match(/"pt"\s*:\s*"([^"]+)"/);
  if (en || pt) {
    return { en: en ? en[1] : '...', pt: pt ? pt[1] : '...' };
  }

  // 5. If allowRaw, return the raw text as both languages (for non-bilingual responses)
  if (allowRaw && raw.length > 0 && raw.length < 500) return raw;

  return null;
}

// --- CASE GENERATION ---

async function generateCase(subjects) {
  const names = subjects.map(s => `${s.id} (${s.name}, archetype: ${s.archetype})`).join(', ');
  const guiltySubject = subjects[Math.floor(seededRand() * subjects.length)];

  // Pick a random setting for this case
  const settings = [
    'a tech startup office',
    'a government research facility',
    'a nightclub or underground venue',
    'a hospital or clinic',
    'a university department',
    'a criminal organization\'s safe house',
    'a news media outlet',
    'a cargo ship crew',
    'a remote research station',
    'a luxury hotel staff',
    'a hacker collective\'s chat server',
    'a small-town police department',
  ];
  const setting = settings[Math.floor(seededRand() * settings.length)];

  const systemPrompt =
    `You are generating a background scenario for a hidden surveillance observation game.\n` +
    `Setting: ${setting}. These people share a group chat and do NOT know they are being monitored.\n` +
    `Characters: ${names}.\n` +
    `The guilty one is ALWAYS: ${guiltySubject.id} (${guiltySubject.name}).\n` +
    `Generate a dark incident relevant to the setting that already happened. Characters chat normally, unaware.\n` +
    `The player observes their behavior to deduce who is guilty.\n` +
    `Respond ONLY with JSON:\n` +
    `{\n` +
    `  "crime_en": "1 sentence describing what happened (relevant to the setting)",\n` +
    `  "crime_pt": "1 frase descrevendo o que aconteceu",\n` +
    `  "setting_en": "name of the setting in English",\n` +
    `  "setting_pt": "nome do cenário em português",\n` +
    `  "clues": ["behavioral clue 1 (NOT naming the culprit)", "behavioral clue 2", "behavioral clue 3"],\n` +
    `  "keywords_en": ["3 to 6 short keywords in English related to the incident"],\n` +
    `  "keywords_pt": ["3 a 6 palavras-chave em português relacionadas ao incidente"]\n` +
    `}\n` +
    `Clues describe subtle behaviors. Keywords are words that hint at guilt when spoken naturally.`;

  try {
    const response = await fetch(NVIDIA_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: NVIDIA_MODEL,
        messages: [{ role: 'user', content: systemPrompt }],
        max_tokens: 300,
        temperature: 0.9,
        stream: false
      })
    });
    if (!response.ok) throw new Error(`API ${response.status}`);
    const data = await response.json();
    const raw = data.choices[0].message.content.trim();
    const parsed = parseJsonResponse(raw, true);
    if (!parsed) throw new Error('No JSON found');
    return {
      crime: { en: parsed.crime_en || 'Unidentified incident.', pt: parsed.crime_pt || 'Incidente não identificado.' },
      setting: { en: parsed.setting_en || 'unknown location', pt: parsed.setting_pt || 'local desconhecido' },
      clues: parsed.clues || [],
      keywords: {
        en: (parsed.keywords_en || parsed.keywords || []).map(k => k.toLowerCase()),
        pt: (parsed.keywords_pt || parsed.keywords_en || parsed.keywords || []).map(k => k.toLowerCase())
      },
      guiltyId: guiltySubject.id,
      guiltyName: guiltySubject.name
    };
  } catch (err) {
    console.warn('Case gen fallback:', err.message);
    return {
      crime: { en: 'Unidentified incident.', pt: 'Incidente não identificado.' },
      setting: { en: 'unknown location', pt: 'local desconhecido' },
      clues: [],
      keywords: { en: [], pt: [] },
      guiltyId: guiltySubject.id,
      guiltyName: guiltySubject.name
    };
  }
}

// --- CHARACTER MESSAGE GENERATION ---

// Archetype personalities — setting-agnostic, injected dynamically with context
const archetypeTraits = {
  en: {
    status_seeker: "obsessed with status and hierarchy. You constantly remind others of your seniority, drop names, reference past achievements, and subtly put others down. Max 2 sentences.",
    quiet_one:     "extremely quiet and minimal. You rarely say anything, but when you do it's blunt and slightly unsettling. 1 to 6 words max.",
    talker:        "can't stop talking, jumps between topics, rambles, brings up unrelated personal stories mid-sentence. 2-3 sentences, slightly scattered.",
    drama_creator: "paranoid and sarcastic, always reading between the lines, suspicious of motives, uses irony. 1-2 sentences.",
    hidden_agenda: "vague, evasive, redirects conversation, appears friendly but never commits to anything. 1-2 short sentences."
  },
  pt: {
    status_seeker: "obcecado com status e hierarquia. Lembra os outros constantemente da sua senioridade, cita nomes, referencia conquistas e sutilmente diminui os outros. Máximo 2 frases.",
    quiet_one:     "extremamente quieto e mínimo. Raramente fala, mas quando fala é direto e levemente perturbador. De 1 a 6 palavras no máximo.",
    talker:        "não consegue parar de falar, pula de assunto, divaga, traz histórias pessoais no meio da conversa. 2-3 frases, meio disperso.",
    drama_creator: "paranoico e sarcástico, sempre lendo nas entrelinhas, desconfia de motivações, usa ironia. 1-2 frases.",
    hidden_agenda: "vago, evasivo, redireciona a conversa, parece amigável mas nunca se compromete com nada. 1-2 frases curtas."
  }
};

// Keep archetypePrompts as alias for any legacy references
const archetypePrompts = { en: {}, pt: {} };
Object.keys(archetypeTraits.en).forEach(k => {
  archetypePrompts.en[k] = archetypeTraits.en[k];
  archetypePrompts.pt[k] = archetypeTraits.pt[k];
});

async function generateMessageFromAI(subject) {
  const archetype = subject.archetype;
  const isGuilty = state.currentCase && subject.id === state.currentCase.guiltyId;

  // Build recent chat log (all subjects, last 8 messages)
  const recentLog = state.messages.slice(-8).map(msg => {
    const speaker = state.subjects.find(s => s.id === msg.subjectId);
    const text = msg.texts ? msg.texts.en : (msg.text || '');
    return `${speaker ? speaker.name : msg.subjectId}: ${text}`;
  }).join('\n');

  const guiltyExtra = isGuilty
    ? ' You are hiding something serious and are under internal stress. You might be slightly defensive, avoid certain topics, or overcompensate with normalcy. Never mention what you did.'
    : '';

  let clueHint = '';
  if (isGuilty && state.currentCase && state.currentCase.clues.length > 0) {
    clueHint = state.currentCase.clues[Math.floor(Math.random() * state.currentCase.clues.length)];
  }
  const clueExtra = clueHint ? ` Subtly allude to: "${clueHint}".` : '';

  // Build case context with real setting
  const settingEN = state.currentCase && state.currentCase.setting ? state.currentCase.setting.en : 'a shared space';
  const settingPT = state.currentCase && state.currentCase.setting ? state.currentCase.setting.pt : 'um espaço compartilhado';
  const crimeEN   = state.currentCase ? state.currentCase.crime.en : '';
  const crimePT   = state.currentCase ? state.currentCase.crime.pt : '';

  const systemPrompt =
    `You are ${subject.name}, someone in ${settingEN}. You are chatting in the group's shared channel.\n` +
    `You have NO idea anyone is monitoring this conversation. Behave naturally for your environment.\n` +
    `Your speech, references, and concerns should fit the context of ${settingEN}.\n` +
    (crimeEN ? `Something happened recently that everyone here knows about: "${crimeEN}". It may come up, or not.\n` : '') +
    `Your personality: ${archetypeTraits.en[archetype]}\n` +
    guiltyExtra + clueExtra + `\n` +
    `Recent chat history:\n${recentLog || '(channel just opened)'}\n\n` +
    `Write your next message as this person. Mix topics — react to others, bring up something from your world, or comment on the recent event.\n` +
    `YOUR RESPONSE MUST BE ONLY THIS JSON, nothing else, no explanation, no prefix:\n` +
    `{"en": "message in English", "pt": "mensagem em português"}`;

  try {
    const response = await fetch(NVIDIA_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: NVIDIA_MODEL,
        messages: [{ role: 'user', content: systemPrompt }],
        max_tokens: 150,
        temperature: 0.95,
        stream: false
      })
    });
    if (!response.ok) throw new Error(`API ${response.status}`);
    const data = await response.json();
    const raw = data.choices[0].message.content.trim();
    const result = parseJsonResponse(raw);
    if (!result) throw new Error('No JSON');
    return result;
  } catch (err) {
    console.error('[API ERROR] generateMessageFromAI:', err.message);
    const enTemplates = messageTemplates[archetype].en;
    const ptTemplates = messageTemplates[archetype].pt;
    const i = Math.floor(Math.random() * enTemplates.length);
    return { en: enTemplates[i], pt: ptTemplates[i] };
  }
}

// Generic one-shot AI call — returns bilingual {en, pt}
async function callAI(systemPromptEN, systemPromptPT) {
  const prompt =
    systemPromptEN + '\n---\n' + systemPromptPT +
    '\nReply ONLY with JSON: {"en": "<english>", "pt": "<portuguese>"}. No markdown.';
  try {
    const response = await fetch(NVIDIA_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: NVIDIA_MODEL,
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: 'Respond with JSON only.' }
        ],
        max_tokens: 150,
        temperature: 0.95,
        stream: false
      })
    });
    if (!response.ok) throw new Error(`API ${response.status}`);
    const data = await response.json();
    const raw = data.choices[0].message.content.trim();
    const result = parseJsonResponse(raw);
    if (!result) throw new Error('No JSON');
    return result;
  } catch (err) {
    console.warn('AI fallback callAI:', err.message);
    return { en: '...', pt: '...' };
  }
}
