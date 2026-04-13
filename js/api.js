const NVIDIA_API_URL = 'https://observer-proxy.ryanjogavel.workers.dev';
const NVIDIA_MODEL = 'meta/llama-3.1-8b-instruct';

// --- CASE GENERATION ---

async function generateCase(subjects) {
  const names = subjects.map(s => `${s.id} (${s.name}, archetype: ${s.archetype})`).join(', ');
  const guiltySubject = subjects[Math.floor(Math.random() * subjects.length)];

  const systemPrompt =
    `You are generating a background scenario for a hidden surveillance observation game.\n` +
    `These people work together and are chatting in an internal channel. They do NOT know they are being monitored.\n` +
    `Characters: ${names}.\n` +
    `The guilty one is ALWAYS: ${guiltySubject.id} (${guiltySubject.name}).\n` +
    `Generate a dark workplace incident that already happened. The characters will chat normally, unaware.\n` +
    `The player observes their behavior to figure out who did it.\n` +
    `Respond ONLY with JSON:\n` +
    `{\n` +
    `  "crime_en": "1 sentence describing what happened (workplace incident, leak, sabotage, disappearance, theft, etc)",\n` +
    `  "crime_pt": "1 frase descrevendo o que aconteceu",\n` +
    `  "clues": ["behavioral clue 1 (NOT naming the culprit)", "behavioral clue 2", "behavioral clue 3"]\n` +
    `}\n` +
    `Clues must describe subtle behaviors to watch for — not facts, not confessions. Indirect only.`;

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
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      crime: { en: parsed.crime_en || 'Unidentified incident.', pt: parsed.crime_pt || 'Incidente não identificado.' },
      clues: parsed.clues || [],
      guiltyId: guiltySubject.id,
      guiltyName: guiltySubject.name
    };
  } catch (err) {
    console.warn('Case gen fallback:', err.message);
    return {
      crime: { en: 'Unidentified incident on the network.', pt: 'Incidente não identificado na rede.' },
      clues: [],
      guiltyId: guiltySubject.id,
      guiltyName: guiltySubject.name
    };
  }
}

// --- CHARACTER MESSAGE GENERATION ---

const archetypePrompts = {
  en: {
    status_seeker:
      "You are a person chatting in an internal company messaging channel. You have no idea you're being watched. Your personality: obsessed with status and hierarchy. You constantly remind others of your seniority, drop names, reference past achievements, and subtly put others down. Max 2 sentences. Natural chat tone. No stage directions.",
    quiet_one:
      "You are a person chatting in an internal company messaging channel. You have no idea you're being watched. Your personality: extremely quiet and minimal. You rarely say anything, but when you do it's blunt and slightly unsettling. 1 to 6 words max. Natural chat tone. No stage directions.",
    talker:
      "You are a person chatting in an internal company messaging channel. You have no idea you're being watched. Your personality: can't stop talking, jumps between topics, rambles, brings up unrelated personal stories mid-sentence. 2-3 sentences, slightly scattered. Natural chat tone. No stage directions.",
    drama_creator:
      "You are a person chatting in an internal company messaging channel. You have no idea you're being watched. Your personality: paranoid and sarcastic, always reading between the lines, suspicious of motives, uses irony. 1-2 sentences. Natural chat tone. No stage directions.",
    hidden_agenda:
      "You are a person chatting in an internal company messaging channel. You have no idea you're being watched. Your personality: vague, evasive, redirects conversation, appears friendly but never commits to anything. 1-2 short sentences. Natural chat tone. No stage directions."
  },
  pt: {
    status_seeker:
      "Você é uma pessoa num canal interno de mensagens da empresa. Não sabe que está sendo observado. Sua personalidade: obcecado com status, lembra os outros constantemente da sua senioridade, cita nomes importantes, referencia conquistas passadas e sutilmente diminui os outros. Máximo 2 frases. Tom natural de chat. Sem didascálias.",
    quiet_one:
      "Você é uma pessoa num canal interno de mensagens da empresa. Não sabe que está sendo observado. Sua personalidade: extremamente quieto e mínimo. Raramente fala, mas quando fala é direto e levemente perturbador. De 1 a 6 palavras no máximo. Tom natural de chat. Sem didascálias.",
    talker:
      "Você é uma pessoa num canal interno de mensagens da empresa. Não sabe que está sendo observado. Sua personalidade: não consegue parar de falar, pula de assunto, divaga, traz histórias pessoais no meio da conversa. 2-3 frases, meio disperso. Tom natural de chat. Sem didascálias.",
    drama_creator:
      "Você é uma pessoa num canal interno de mensagens da empresa. Não sabe que está sendo observado. Sua personalidade: paranoico e sarcástico, sempre lendo nas entrelinhas, desconfia de motivações, usa ironia. 1-2 frases. Tom natural de chat. Sem didascálias.",
    hidden_agenda:
      "Você é uma pessoa num canal interno de mensagens da empresa. Não sabe que está sendo observado. Sua personalidade: vago, evasivo, redireciona a conversa, parece amigável mas nunca se compromete com nada. 1-2 frases curtas. Tom natural de chat. Sem didascálias."
  }
};

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

  const systemPrompt =
    `You are ${subject.name}, an employee chatting in your company's internal messaging channel.\n` +
    `You have no idea anyone is monitoring this conversation. Just chat naturally.\n` +
    `Your personality (EN): ${archetypePrompts.en[archetype]}\n` +
    `Your personality (PT): ${archetypePrompts.pt[archetype]}\n` +
    guiltyExtra + clueExtra + `\n` +
    `Recent chat history:\n${recentLog || '(channel just opened)'}\n\n` +
    `Write your next message. React to what others said if relevant, or just say something in character.\n` +
    `Do NOT mention investigations, crimes, or anything that breaks the illusion. Just chat.\n` +
    `Reply ONLY with JSON: {"en": "<message in English>", "pt": "<message in Portuguese>"}\n` +
    `Short, natural, no stage directions, no markdown.`;

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
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON');
    const parsed = JSON.parse(jsonMatch[0]);
    return { en: parsed.en || '...', pt: parsed.pt || '...' };
  } catch (err) {
    console.error('[API ERROR] generateMessageFromAI:', err.message);
    addSignal(`⚠ API error: ${err.message.slice(0, 40)}`);
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
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON');
    const parsed = JSON.parse(jsonMatch[0]);
    return { en: parsed.en || '...', pt: parsed.pt || '...' };
  } catch (err) {
    console.warn('AI fallback:', err.message);
    return { en: '...', pt: '...' };
  }
}
