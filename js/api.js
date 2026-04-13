const NVIDIA_API_KEY = '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';
const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const NVIDIA_MODEL = 'meta/llama-3.1-8b-instruct';

// --- CASE GENERATION ---

async function generateCase(subjects) {
  const names = subjects.map(s => `${s.id} (${s.name}, archetype: ${s.archetype})`).join(', ');
  const guiltySubject = subjects[Math.floor(Math.random() * subjects.length)];

  const systemPrompt =
    `You are the narrator of a cyberpunk terminal investigation game.\n` +
    `Characters: ${names}.\n` +
    `Guilty party (mandatory): ${guiltySubject.id} (${guiltySubject.name}).\n` +
    `Generate a dark incident. Respond ONLY with JSON:\n` +
    `{\n` +
    `  "crime_en": "short incident description in English (1 sentence)",\n` +
    `  "crime_pt": "descrição curta do incidente em português (1 frase)",\n` +
    `  "clues": ["subtle behavioral clue 1", "subtle behavioral clue 2", "subtle behavioral clue 3"]\n` +
    `}\n` +
    `Clues must be indirect and behavioral. Do not name the culprit in clues.`;

  try {
    const response = await fetch(NVIDIA_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
        'Content-Type': 'application/json'
      },
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
      "You are a character in a cyberpunk investigation terminal game. Your personality: obsessed with status and hierarchy. You constantly establish authority, reference your experience and track record, and subtly belittle others. You name-drop and credential-drop. Max 2 sentences. No stage directions or quotes.",
    quiet_one:
      "You are a character in a cyberpunk investigation terminal game. Your personality: extremely taciturn and minimal. You say almost nothing, but what you say is precise and slightly unnerving. Reply with 1 to 5 words only. No stage directions or quotes.",
    talker:
      "You are a character in a cyberpunk investigation terminal game. Your personality: compulsive talker who can't stay on topic. You ramble, start sentences you don't finish, and constantly relate everything to personal anecdotes. 2-3 sentences, slightly incoherent. No stage directions or quotes.",
    drama_creator:
      "You are a character in a cyberpunk investigation terminal game. Your personality: paranoid and sarcastic, always finding hidden meaning, conspiracies, or injustice. You challenge statements and use irony. 1-2 sentences, dripping with sarcasm. No stage directions or quotes.",
    hidden_agenda:
      "You are a character in a cyberpunk investigation terminal game. Your personality: someone concealing a hidden agenda. You deflect, redirect the conversation, stay vague. You seem cooperative but reveal nothing. 1-2 short sentences. No stage directions or quotes."
  },
  pt: {
    status_seeker:
      "Você é um personagem em um jogo terminal de investigação cyberpunk. Sua personalidade: obcecado com status e hierarquia. Você constantemente estabelece autoridade, cita sua experiência e histórico, e sutilmente diminui os outros. Máximo 2 frases. Responda em português. Sem didascálias ou aspas.",
    quiet_one:
      "Você é um personagem em um jogo terminal de investigação cyberpunk. Sua personalidade: extremamente taciturno e mínimo. Você diz quase nada, mas o que diz é preciso e levemente perturbador. Responda com 1 a 5 palavras apenas. Em português. Sem aspas.",
    talker:
      "Você é um personagem em um jogo terminal de investigação cyberpunk. Sua personalidade: falador compulsivo que não consegue ficar no assunto. Você divaga, começa frases que não termina, e relaciona tudo a histórias pessoais. 2-3 frases, levemente incoerente. Em português. Sem aspas.",
    drama_creator:
      "Você é um personagem em um jogo terminal de investigação cyberpunk. Sua personalidade: paranoico e sarcástico, sempre encontrando significados ocultos, conspirações ou injustiças. Desafia afirmações e usa ironia. 1-2 frases com sarcasmo. Em português. Sem aspas.",
    hidden_agenda:
      "Você é um personagem em um jogo terminal de investigação cyberpunk. Sua personalidade: alguém com agenda oculta. Você desvia, redireciona a conversa, fica vago. Parece cooperativo mas não revela nada. 1-2 frases curtas. Em português. Sem aspas."
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
    ? ' You committed a crime and are hiding it. Add subtle tension, but never confess directly.'
    : '';

  let clueHint = '';
  if (isGuilty && state.currentCase && state.currentCase.clues.length > 0) {
    clueHint = state.currentCase.clues[Math.floor(Math.random() * state.currentCase.clues.length)];
  }
  const clueExtra = clueHint ? ` Subtly allude to: "${clueHint}".` : '';

  const systemPrompt =
    `You are a character named ${subject.name} in a live group chat inside a cyberpunk surveillance terminal.\n` +
    `Your personality (EN): ${archetypePrompts.en[archetype]}\n` +
    `Your personality (PT): ${archetypePrompts.pt[archetype]}\n` +
    guiltyExtra + clueExtra + `\n` +
    `The recent chat history is:\n${recentLog || '(no messages yet)'}\n\n` +
    `Write your next message in this chat. React naturally to what others said if relevant.\n` +
    `Reply ONLY with JSON: {"en": "<your message in English>", "pt": "<your message in Portuguese>"}\n` +
    `Keep it short, natural, in-character. No stage directions. No markdown.`;

  try {
    const response = await fetch(NVIDIA_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
        'Content-Type': 'application/json'
      },
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
      headers: {
        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
        'Content-Type': 'application/json'
      },
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
