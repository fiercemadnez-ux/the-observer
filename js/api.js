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

// Tipos de responsabilidade em vez de apenas "culpa"
const RESPONSIBILITY_TYPES = {
  executor: {
    en: "Executor",
    pt: "Executor",
    desc_en: "Directly performed the action",
    desc_pt: "Realizou a ação diretamente"
  },
  instigator: {
    en: "Instigator",
    pt: "Instigador",
    desc_en: "Made someone else do it",
    desc_pt: "Feito alguém fazer"
  },
  facilitator: {
    en: "Facilitator",
    pt: "Facilitador",
    desc_en: "Made the action possible",
    desc_pt: "Tornou a ação possível"
  },
  accomplice: {
    en: "Accomplice",
    pt: "Cúmplice",
    desc_en: "Knew and let it happen",
    desc_pt: "Soube e deixou acontecer"
  },
  instrument: {
    en: "Instrument",
    pt: "Instrumento",
    desc_en: "Was used without knowing",
    desc_pt: "Foi usado sem saber"
  }
};

// Modelos de caso mais pesados (tensão social real)
const CASE_TEMPLATES = {
  scapegoat: {
    en: "Scapegoat",
    pt: "Bode Expiatório",
    desc_en: "An incident occurred, but the group wants to blame a specific person for political reasons.",
    desc_pt: "Um incidente ocorreu, mas o grupo quer culpar uma pessoa específica por motivos políticos."
  },
  exclusion: {
    en: "Gradual Exclusion",
    pt: "Exclusão Gradual",
    desc_en: "Someone was gradually isolated, and the incident is the culmination.",
    desc_pt: "Alguém foi gradualmente isolado, e o incidente é a culminação."
  },
  manipulation: {
    en: "Narrative Manipulation",
    pt: "Manipulação Narrativa",
    desc_en: "One person shaped the group's narrative, everyone repeats the same version.",
    desc_pt: "Uma pessoa moldou a narrativa do grupo, todos repetem a mesma versão."
  },
  silence: {
    en: "Complicit Silence",
    pt: "Silêncio Cúmplice",
    desc_en: "Everyone knew about something, nobody spoke, the incident happened.",
    desc_pt: "Todos sabiam de algo, ninguém falou, o incidente aconteceu."
  },
  reputation_destruction: {
    en: "Reputation Destruction",
    pt: "Destruição de Reputação",
    desc_en: "Someone planted false information about another person.",
    desc_pt: "Alguém plantou informações falsas sobre outra pessoa."
  },
  pressure: {
    en: "Induced Pressure",
    pt: "Pressão Induzida",
    desc_en: "Someone forced another person to do something they didn't want to.",
    desc_pt: "Alguém forçou outra pessoa a fazer algo que não queria."
  },
  cover_up: {
    en: "Cover-Up",
    pt: "Encobrimento",
    desc_en: "The truth was hidden to protect someone or something.",
    desc_pt: "A verdade foi ocultada para proteger alguém ou algo."
  }
};

async function generateCase(subjects) {
  const names = subjects.map(s => `${s.id} (${s.name}, archetype: ${s.archetype})`).join(', ');
  const guiltySubject = subjects[Math.floor(seededRand() * subjects.length)];

  // Pick random responsibility type
  const respTypes = Object.keys(RESPONSIBILITY_TYPES);
  const responsibilityType = respTypes[Math.floor(seededRand() * respTypes.length)];
  
  // Pick random case template
  const templateKeys = Object.keys(CASE_TEMPLATES);
  const templateKey = templateKeys[Math.floor(seededRand() * templateKeys.length)];
  const template = CASE_TEMPLATES[templateKey];

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

  const t = i18n[state.lang] || { en: {}, pt: {} };
  const templateDesc = state.lang === 'pt' ? template.desc_pt : template.desc_en;
  const respDesc = state.lang === 'pt' 
    ? RESPONSIBILITY_TYPES[responsibilityType].desc_pt 
    : RESPONSIBILITY_TYPES[responsibilityType].desc_en;

  // Build prompt based on language
  let prompt;
  if (state.lang === 'pt') {
    prompt = `Você é gerador de cenários para um jogo de vigilância oculta.\n` +
      `Cenário: ${setting}.\n` +
      `Personagens: ${names}.\n` +
      `Tipo de Caso: ${template.pt} - ${templateDesc}\n` +
      `Tipo de Responsabilidade: ${RESPONSIBILITY_TYPES[responsibilityType].pt} (${respDesc}).\n` +
      `A pessoa responsável é: ${guiltySubject.id} (${guiltySubject.name}).\n` +
      `Gere um incidente escuro que se encaixa no tipo de caso. É sobre DINÂMICA SOCIAL, não apenas um ato isolado.\n` +
      `O jogador observa o comportamento para deduzir quem é RESPONSÁVEL, não apenas "quem fez".\n` +
      ` Responda APENAS com JSON:\n` +
      `{\n` +
      `  "crime_en": "1 frase em INGLÊS descrevendo o incidente social",\n` +
      `  "crime_pt": "1 frase em PORTUGUÊS descrevendo o incidente social (foco na tensão)",\n` +
      `  "setting_en": "nome do cenário em inglês",\n` +
      `  "setting_pt": "nome do cenário em português",\n` +
      `  "clues": ["pista comportamental 1 (NÃO nomeando o responsável)", "pista 2", "pista 3"],\n` +
      `  "keywords_en": ["3 a 6 palavras-chave em INGLÊS relacionadas ao incidente"],\n` +
      `  "keywords_pt": ["3 a 6 palavras-chave em PORTUGUÊS relacionadas ao incidente"],\n` +
      `  "contradiction": "uma afirmação que contradiz a versão de outra pessoa",\n` +
      `  "deflection": "uma tentativa de mudar o assunto ou encerrar o tópico cedo"\n` +
      `}\n` +
      `Pistas descrevem comportamentos sutis. Palavras-chave indicam o incidente quando faladas naturalmente. Inclua contradição e deflexão.`;
  } else {
    prompt = `You are generating a background scenario for a hidden surveillance observation game.\n` +
      `Setting: ${setting}. These people share a group chat and do NOT know they are being monitored.\n` +
      `Characters: ${names}.\n` +
      `Case Type: ${template.en} - ${templateDesc}\n` +
      `Responsibility Type: ${RESPONSIBILITY_TYPES[responsibilityType].en} (${respDesc}).\n` +
      `The responsible person is: ${guiltySubject.id} (${guiltySubject.name}).\n` +
      `Generate a dark incident that fits the case type. It's about SOCIAL DYNAMICS, not just an isolated act.\n` +
      `The player observes behavior to deduce who is RESPONSIBLE, not just "who did it".\n` +
      `Respond ONLY with JSON:\n` +
      `{\n` +
      `  "crime_en": "1 sentence describing the social incident (focus on tension, not just action)",\n` +
      `  "crime_pt": "1 sentence in PORTUGUESE describing the incident",\n` +
      `  "setting_en": "name of the setting in English",\n` +
      `  "setting_pt": "name of the setting in Portuguese",\n` +
      `  "clues": ["behavioral clue 1 (NOT naming who is responsible)", "behavioral clue 2", "behavioral clue 3"],\n` +
      `  "keywords_en": ["3 to 6 short keywords in English related to the incident"],\n` +
      `  "keywords_pt": ["3 to 6 short keywords in Portuguese related to the incident"],\n` +
      `  "contradiction": "a statement or behavior that contradicts another person's version",\n` +
      `  "deflection": "an attempt to change the subject or close the topic early"\n` +
      `}\n` +
      `Clues describe subtle behaviors. Keywords hint at the incident when spoken naturally. Include a contradiction between characters and a deflection attempt.`;
  }

  try {
    const response = await fetch(NVIDIA_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: NVIDIA_MODEL,
        messages: [{ role: 'user', content: prompt }],
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
      guiltyName: guiltySubject.name,
      responsibilityType: responsibilityType,
      caseTemplate: templateKey,
      contradiction: parsed.contradiction || '',
      deflection: parsed.deflection || ''
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

  const lang = state.lang;
  const isBR = lang === 'pt';
  const settingLabel = isBR ? settingPT : settingEN;
  const crimeLabel   = isBR ? crimePT   : crimeEN;
  const archTraits   = isBR ? archetypeTraits.pt[archetype] : archetypeTraits.en[archetype];
  const guiltyExtraLocal = isBR
    ? ' Você está escondendo algo sério e está sob pressão interna. Pode ser levemente defensivo, evitar certos tópicos ou compensar com normalidade. Nunca mencione o que fez.'
    : guiltyExtra;
  const clueExtraLocal = clueHint
    ? (isBR ? ` Aluda sutilmente a: "${clueHint}".` : ` Subtly allude to: "${clueHint}".`)
    : '';

  const systemContext = isBR
    ? `Você é ${subject.name}. Você está num canal de grupo em ${settingLabel}. Sua personalidade: ${archTraits}` +
      (guiltyExtraLocal ? ` ${guiltyExtraLocal}` : '') +
      (crimeLabel ? ` Contexto: ${crimeLabel}.` : '')
    : `You are ${subject.name}. You are in a group chat in ${settingLabel}. Personality: ${archTraits}` +
      (guiltyExtra ? ` ${guiltyExtra}` : '') +
      (crimeLabel ? ` Context: ${crimeLabel}.` : '');

  const userInstruction = isBR
    ? `IMPORTANTE: Você deve responder em português brasileiro. SEM inglês.\n\nHistórico do chat:\n${recentLog || '(ninguém falou ainda)'}\n\n` +
      `Escreva UMA mensagem NOVA como ${subject.name}, em português brasileiro. NADA em inglês.` +
      (clueExtraLocal ? ` ${clueExtraLocal}` : '') +
      ` Responda apenas com a mensagem, sem explicar.`
    : `Chat history:\n${recentLog || '(nobody has spoken yet)'}\n\n` +
      `Write ONE NEW message as ${subject.name}, in English.` +
      (clueExtra ? ` ${clueExtra}` : '') +
      ` DO NOT repeat or quote any message above. Respond ONLY with the message text.`;

  try {
    const response = await fetch(NVIDIA_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: NVIDIA_MODEL,
        messages: [
          { role: 'system', content: systemContext },
          { role: 'user',   content: userInstruction }
        ],
        max_tokens: 120,
        temperature: 0.95,
        stream: false
      })
    });
    if (!response.ok) throw new Error(`API ${response.status}`);
    const data = await response.json();
    let raw = data.choices[0].message.content.trim();
    if (!raw) throw new Error('Empty response');
    
    // Check if response is in correct language, if not use fallback
    const isPortuguese = /^[a-zA-Zà-ÿÀ-ÿ].*$/i.test(raw) && 
      (raw.match(/[áéíóúàèìòùãẽĩõũâêîôûäëïöü]/i) || 
       /^(o|a|um|uma|eu|ele|ela|de|da|do|para|com|em|no|na|que|e|é|está|essa|esse|isso)/i.test(raw.toLowerCase()));
    
    // Simple heuristic: if mostly Portuguese characters, treat as PT
    const ptChars = (raw.match(/[áéíóúàèìòùãẽĩõũâêîôûç]/gi) || []).length;
    const enChars = (raw.match(/[qwertyuiop]/gi) || []).length;
    const looksLikePT = ptChars > enChars || (ptChars > 3 && enChars < 3);
    
    // If AI responded in wrong language, use fallback
    if ((isBR && !looksLikePT) || (!isBR && looksLikePT && ptChars > 5)) {
      console.warn('[LANG] AI responded in wrong language, using fallback');
      const templates = messageTemplates[archetype][lang] || messageTemplates[archetype].en;
      const i = Math.floor(Math.random() * templates.length);
      raw = templates[i];
    }
    
    // Double check: if still looks wrong (too many English words), force fallback
    const enWordCount = (raw.toLowerCase().match(/\b(i|me|my|the|is|to|for|that|this|with|have|was|are|be|it|you|we|they|just|like|so|but|not|do|does|did)\b/g) || []).length;
    if (isBR && enWordCount > 2) {
      const templates = messageTemplates[archetype].pt || messageTemplates[archetype].en;
      raw = templates[Math.floor(Math.random() * templates.length)];
      console.warn('[LANG] Forced PT fallback due to English words');
    }
    
    return { en: isBR ? raw : raw, pt: isBR ? raw : raw, [lang]: raw };
  } catch (err) {
    console.error('[API ERROR] generateMessageFromAI:', err.message);
    const templates = messageTemplates[archetype][lang] || messageTemplates[archetype].en;
    const i = Math.floor(Math.random() * templates.length);
    const text = templates[i];
    return { en: text, pt: text };
  }
}

// Generic one-shot AI call — uses current language, returns {en, pt} compatible object
async function callAI(systemPromptEN, systemPromptPT) {
  const lang = state.lang;
  const prompt = lang === 'pt' ? systemPromptPT : systemPromptEN;
  const instruction = lang === 'pt'
    ? 'Responda APENAS com o texto da mensagem em português, sem JSON.'
    : 'Respond ONLY with the message text in English, no JSON.';
  try {
    const response = await fetch(NVIDIA_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: NVIDIA_MODEL,
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: instruction }
        ],
        max_tokens: 150,
        temperature: 0.95,
        stream: false
      })
    });
    if (!response.ok) throw new Error(`API ${response.status}`);
    const data = await response.json();
    const raw = data.choices[0].message.content.trim();
    if (!raw) throw new Error('Empty');
    return { en: raw, pt: raw, [lang]: raw };
  } catch (err) {
    console.warn('AI fallback callAI:', err.message);
    return { en: '...', pt: '...' };
  }
}
