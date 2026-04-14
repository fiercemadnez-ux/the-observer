// --- AUTO CHAT LOOP ---
let chatLoopTimer = null;
let pendingChatMessage = false;
let silenceTimer = null;

function startChatLoop() {
  stopChatLoop();
  const delay = 4000 + Math.random() * 2000;
  chatLoopTimer = setTimeout(autoChat, delay);
}

function stopChatLoop() {
  if (chatLoopTimer) { clearTimeout(chatLoopTimer); chatLoopTimer = null; }
  if (silenceTimer) { clearTimeout(silenceTimer); silenceTimer = null; }
}

// Show a "silence" period - creates tension
function triggerSilence() {
  const container = document.getElementById('messageStream');
  const div = document.createElement('div');
  div.className = 'silence-indicator';
  div.textContent = '// SIGNAL INTERCEPTED // WAITING...';
  container.appendChild(div);
  container.scrollTop = container.scrollTop;
  
  // After 8-15 seconds, resume chat
  const silenceDuration = 8000 + Math.random() * 7000;
  silenceTimer = setTimeout(() => {
    div.remove();
    autoChat();
  }, silenceDuration);
}

// Show a "ghost message" - cut off mid-sentence
function triggerGhostMessage(subject) {
  const container = document.getElementById('messageStream');
  const ghostPhrases = [
    "I think we should all just-",
    "Wait, actually I don't think-",
    "The thing about what happened that night is—",
    "I've been meaning to tell you guys about-",
    "Look, I know it sounds weird but—",
    "Creo que deberíamos-",
    "Espera, na verdade eu não acho-"
  ];
  const text = ghostPhrases[Math.floor(Math.random() * ghostPhrases.length)];
  
  const msg = {
    id: `MSG-${String(state.messages.length + 1).padStart(4, '0')}`,
    subjectId: subject.id,
    texts: { en: text, pt: text },
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    flagged: false,
    isGhost: true
  };
  
  renderMessageAnimated(msg);
  state.messages.push(msg);
  saveDailyCase();
  showNewMessageBadge();
  checkSystemObservation();
}

async function autoChat() {
  if (state.caseResolved) return;
  if (pendingChatMessage) {
    chatLoopTimer = setTimeout(autoChat, 3000);
    return;
  }

  // Random silence (15% chance when consciousness is high)
  if (Math.random() < (state.consciousnessLevel / 500) && state.messages.length > 5) {
    triggerSilence();
    return;
  }

  pendingChatMessage = true;
  
  let subject;
  if (state.focusedSubjectId && state.focusCount > 0) {
    subject = state.subjects.find(s => s.id === state.focusedSubjectId);
    state.focusCount--;
    if (state.focusCount <= 0) state.focusedSubjectId = null;
  }
  if (!subject) {
    const candidates = state.subjects.filter(s => s.status !== 'ally');
    subject = candidates[Math.floor(Math.random() * candidates.length)] || state.subjects[0];
  }

  // Random ghost message chance (15%)
  if (Math.random() < state.ghostMessageChance && state.messages.length > 3) {
    const typingId = addTypingIndicator(subject);
    await new Promise(r => setTimeout(r, 1500));
    removeTypingIndicator(typingId);
    triggerGhostMessage(subject);
    pendingChatMessage = false;
    
    const nextDelay = 15000 + Math.random() * 10000;
    chatLoopTimer = setTimeout(autoChat, nextDelay);
    return;
  }

  const typingId = addTypingIndicator(subject);
  const msg = await generateMessage(subject);
  removeTypingIndicator(typingId);
  pendingChatMessage = false;

  renderMessageAnimated(msg);
  state.messages.push(msg);
  saveDailyCase();
  showNewMessageBadge();

  // Organic reaction (30% chance)
  if (Math.random() < 0.3) {
    triggerOrganicReaction(subject);
  }

  // Schedule next message
  const nextDelay = 12000 + Math.random() * 8000;
  chatLoopTimer = setTimeout(autoChat, nextDelay);
}

function showNewMessageBadge() {
  const container = document.getElementById('messageStream');
  if (isScrolledToBottom(container)) return; // already at bottom, no badge needed
  const badge = document.getElementById('newMsgBadge');
  if (badge) badge.style.display = 'block';
}

const SUBJECT_COLORS = [
  '#00ff88', // green (accent)
  '#4488ff', // blue
  '#ffaa00', // amber
  '#ff66cc', // pink
  '#aa88ff', // purple
  '#00ccff', // cyan
];

function generateSubject() {
  const types = Object.keys(messageTemplates);
  const archetype = types[Math.floor(seededRand() * types.length)];
  const color = SUBJECT_COLORS[state.subjects.length % SUBJECT_COLORS.length];
  return {
    id: `SUB-${String(state.subjects.length + 1).padStart(3, '0')}`,
    name: generateName(),
    archetype,
    trust: 50,
    status: 'unknown',
    color
  };
}

function generateName() {
  const first = ['Marcus', 'Nadia', 'Eliot', 'Soren', 'Petra', 'Jules', 'Damian', 'Irina',
                 'Theo', 'Camille', 'Riku', 'Vera', 'Otto', 'Lena', 'Samir', 'Anya',
                 'Felix', 'Mara', 'Dorian', 'Zoe', 'Ivan', 'Cleo', 'Hugo', 'Nora'];
  const last  = ['Voss', 'Keller', 'Marsh', 'Reyes', 'Fontaine', 'Drake', 'Novak', 'Cross',
                 'Hahn', 'Steele', 'Okafor', 'Reinhart', 'Mori', 'Crane', 'Bekker', 'Lund'];
  return first[Math.floor(seededRand() * first.length)] + ' ' + last[Math.floor(seededRand() * last.length)];
}

async function generateMessage(subject) {
  const subjectHistory = state.messages.filter(m => m.subjectId === subject.id);
  const texts = await generateMessageFromAI(subject, subjectHistory);
  
  // Track consciousness level - check if message contains "being watched" themes
  const rawText = texts.en || texts.pt || '';
  const watchThemes = [
    "watch", "observe", "see", "know", "strange", "feeling", "paranoid",
    "suspect", "looking", "camera", "monitor", "stranger", "weird",
    "observando", "vendo", "sabendo", "estranho", "sentindo", "paranoico",
    "suspeito", "olhando", "câmera", "monitor", "diferente"
  ];
  const hasWatchTheme = watchThemes.some(t => rawText.toLowerCase().includes(t));
  if (hasWatchTheme) {
    state.consciousnessLevel = Math.min(100, state.consciousnessLevel + 8);
  }
  
  // Update case phase based on message count
  const msgCount = state.messages.length;
  if (msgCount >= 25 && state.casePhase === 'normal') {
    state.casePhase = 'tension';
    addSignal('[SYSTEM] Tone shift detected. Conversations becoming tense.');
  } else if (msgCount >= 40 && state.casePhase === 'tension') {
    state.casePhase = 'deflection';
    addSignal('[SYSTEM] Pattern: Topics being deflected. Group appears to avoid subject.');
  } else if (msgCount >= 55 && state.casePhase === 'deflection') {
    state.casePhase = 'breakdown';
    addSignal('[SYSTEM] Critical point. Social structure under stress.');
  }
  
  // Add surveillance action
  const surveillanceActions = [
    "checked phone", "looked around", "shifted weight", "tapped fingers",
    "crossed arms", "glanced at door", "fidgeted", "stood still",
    "looked down", "laughed nervously", "checked watch", "nodded",
    "sighed", "looked away", "scratched head"
  ];
  
  // If consciousness is high, add more nervous actions
  const nervousChance = 0.3 + (state.consciousnessLevel / 200); // 0.3 to 0.8
  const isNervous = Math.random() > (1 - nervousChance);
  const action = isNervous 
    ? surveillanceActions[Math.floor(Math.random() * surveillanceActions.length)] + " ←nervous"
    : surveillanceActions[Math.floor(Math.random() * surveillanceActions.length)];
  addSurveillanceEntry(subject.id, action);
  
  return {
    id: `MSG-${String(state.messages.length + 1).padStart(4, '0')}`,
    subjectId: subject.id,
    texts,  // { en, pt }
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    flagged: Math.random() > 0.8,
    phase: state.casePhase
  };
}

function addSignal(text) {
  state.signals.push({
    text,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  });
  renderSignals();
}

// System messages that observe the player
const SYSTEM_OBSERVATIONS = {
  en: [
    "Pattern detected: You focus on quiet subjects.",
    "Behavioral marker: Quick to accuse.",
    "Analysis: You tend to trust first impressions.",
    "Pattern: You rarely use CLEAR action.",
    "Observation: You've been watching {name} more than others.",
    "Data: Your accuracy drops after first suspicion.",
    "Note: You're drawn to subjects with high status.",
    "Profile: You prefer defensive interpretations."
  ],
  pt: [
    "Padrão detectado: Você foca em sujeitos quietos.",
    "Marcador comportamental: Rápido para acusar.",
    "Análise: Você tende a confiar na primeira impressão.",
    "Padrão: Você raramente usa a ação LIMPAR.",
    "Observação: Você está assistindo {name} mais que outros.",
    "Dados: Sua precisão cai após a primeira suspeita.",
    "Nota: Você é atraído por sujeitos de alto status.",
    "Perfil: Você prefere interpretações defensivas."
  ]
};

function triggerSystemObservation() {
  // Only trigger when trust is moderate/high (system thinks it knows you)
  if (state.trustLevel < 40) return;
  if (state.caseResolved) return;
  if (state.messages.length < 10) return;
  
  const lang = state.lang;
  const pool = SYSTEM_OBSERVATIONS[lang] || SYSTEM_OBSERVATIONS.en;
  
  // Build observation based on actual player behavior
  let obs = pool[Math.floor(Math.random() * pool.length)];
  
  // Customize with actual data
  if (obs.includes('{name}')) {
    const candidates = state.subjects.filter(s => s.status !== 'ally');
    const target = candidates[Math.floor(Math.random() * candidates.length)];
    if (target) {
      obs = obs.replace('{name}', target.name);
    }
  }
  
  addSignal(`[SYSTEM] ${obs}`);
}

// Trigger system observation periodically (every 20 messages after 10)
let systemObsCounter = 0;
function checkSystemObservation() {
  systemObsCounter++;
  if (systemObsCounter >= 20 && Math.random() < 0.3) {
    triggerSystemObservation();
    systemObsCounter = 0;
  }
}

function addSurveillanceEntry(subjectId, action) {
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  state.surveillanceLog.push({ subjectId, action, timestamp });
  if (state.surveillanceLog.length > 50) state.surveillanceLog.shift();
}

function selectSubject(id) {
  if (state.caseResolved) return;
  state.selectedSubject = id;
  const s = state.subjects.find(sub => sub.id === id);
  addSignal(`${i18n[state.lang].sig_selected}: ${id} (${s ? s.name : '?'})`);
}

// --- REACTIONS ---
// Triggered organically when a subject says something notable
// (called occasionally from autoChat after a message from guilty subject)
async function triggerOrganicReaction(triggerSubject) {
  const reactors = state.subjects
    .filter(s => s.id !== triggerSubject.id && s.status !== 'ally')
    .sort(() => Math.random() - 0.5)
    .slice(0, 1);

  for (const reactor of reactors) {
    await new Promise(r => setTimeout(r, 2000 + Math.random() * 3000));
    if (state.caseResolved || pendingChatMessage) break;

    const lastMsg = state.messages.filter(m => m.subjectId === triggerSubject.id).slice(-1)[0];
    const lastText = lastMsg ? (lastMsg.texts ? lastMsg.texts.en : '') : '';
    const isGuilty = state.currentCase && reactor.id === state.currentCase.guiltyId;

    const settingEN = state.currentCase && state.currentCase.setting ? state.currentCase.setting.en : 'a shared space';
    const settingPT = state.currentCase && state.currentCase.setting ? state.currentCase.setting.pt : 'um espaço compartilhado';
    const enPrompt =
      `You are ${reactor.name}, someone in ${settingEN}. You have no idea anyone is watching.` +
      ` Personality: ${archetypeTraits.en[reactor.archetype]}` +
      (isGuilty ? ' You are hiding something serious and feel internal pressure.' : '') +
      ` ${triggerSubject.name} just said: "${lastText}". React naturally in 1 sentence. Fit the ${settingEN} context.`;
    const ptPrompt =
      `Você é ${reactor.name}, alguém em ${settingPT}. Não sabe que está sendo observado.` +
      ` Personalidade: ${archetypeTraits.pt[reactor.archetype]}` +
      (isGuilty ? ' Você está escondendo algo sério e sente pressão interna.' : '') +
      ` ${triggerSubject.name} acabou de dizer: "${lastText}". Reaja naturalmente em 1 frase. Adequado ao contexto de ${settingPT}.`;

    const typingId = addTypingIndicator(reactor);
    const texts = await callAI(enPrompt, ptPrompt);
    removeTypingIndicator(typingId);

    const reactMsg = {
      id: `MSG-${String(state.messages.length + 1).padStart(4, '0')}`,
      subjectId: reactor.id, texts,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      flagged: false
    };
    renderMessageAnimated(reactMsg);
    state.messages.push(reactMsg);
    saveDailyCase();
    showNewMessageBadge();
    checkSystemObservation();
  }
}

// --- ACTIONS ---

function exposeSubject() {
  // MARK as suspect
  if (state.caseResolved) return;
  if (!state.selectedSubject) return addSignal(i18n[state.lang].sig_no_subject);
  const s = state.subjects.find(sub => sub.id === state.selectedSubject);
  s.status = 'suspect';
  addSignal(`${i18n[state.lang].sig_marked}: ${s.id} // ${s.name}`);
  render();
}

let focusStartTime = null;

function focusSubject() {
  // FOCUS — next 2 autochat messages will be from this subject
  if (state.caseResolved) return;
  if (!state.selectedSubject) return addSignal(i18n[state.lang].sig_no_subject);
  const s = state.subjects.find(sub => sub.id === state.selectedSubject);
  
  // Track focus start time for bias analysis
  if (!focusStartTime) {
    focusStartTime = Date.now();
  }
  
  state.focusedSubjectId = s.id;
  state.focusCount = 2;
  addSignal(`${i18n[state.lang].sig_focused}: ${s.id} // ${s.name}`);
  
  // Generate a "system insight" about focused subject - this creates bias
  if (state.trustLevel > 30) {
    const insights = [
      "shows consistent pattern",
      "behavioral anomalies detected",
      "verbal inconsistency observed",
      "response latency above average",
      "topic avoidance detected"
    ];
    const insight = insights[Math.floor(Math.random() * insights.length)];
    addSignal(`[SYSTEM] ${s.id}: ${insight}`);
  }
  
  render();
}

function clearSubject() {
  // CLEAR suspicion
  if (state.caseResolved) return;
  if (!state.selectedSubject) return addSignal(i18n[state.lang].sig_no_subject);
  const s = state.subjects.find(sub => sub.id === state.selectedSubject);
  s.status = 'ally';
  addSignal(`${i18n[state.lang].sig_cleared}: ${s.id} // ${s.name}`);
  render();
}

// --- ACTIVE INTERPRETATION ---

const INTERPRETATION_TYPES = {
  defensive: {
    en: "seems defensive",
    pt: "parece defensivo",
    desc: "reacting with unusual intensity, avoiding certain topics"
  },
  performing: {
    en: "performing a role",
    pt: "interpretando um papel",
    desc: "acting differently than usual, trying to seem normal"
  },
  manipulating: {
    en: "manipulating narrative",
    pt: "manipulando narrativa",
    desc: "trying to steer conversation, controlling the story"
  },
  afraid: {
    en: "showing fear",
    pt: "mostrando medo",
    desc: "nervous, anxious, worried about being exposed"
  },
  sincere: {
    en: "appears sincere",
    pt: "parece sincero",
    desc: "genuine, authentic, not hiding anything"
  }
};

function interpretSubject(type) {
  if (state.caseResolved) return;
  if (!state.selectedSubject) return addSignal(i18n[state.lang].sig_no_subject);
  
  const s = state.subjects.find(sub => sub.id === state.selectedSubject);
  const interp = INTERPRETATION_TYPES[type];
  if (!interp) return;
  
  // Store interpretation
  state.interpretations.push({
    subjectId: s.id,
    type: type,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    day: state.caseCount
  });
  
  const label = state.lang === 'pt' ? interp.pt : interp.en;
  addSignal(`[INTERPRETATION] ${s.id}: ${label}`);
  
  // Track player patterns for psychological profiling
  state.playerPatterns.totalAccusations++;
  if (type === 'defensive') {
    // Pattern: does player interpret quiet people as defensive?
  }
  
  // If trust is high, system might "confirm" your interpretation (creating bias)
  if (state.trustLevel > 60 && Math.random() < (state.trustLevel / 200)) {
    const confirmations = [
      "[SYSTEM] Pattern consistent with profile.",
      "[SYSTEM] Behavioral markers support this reading.",
      "[SYSTEM] Correlation found with previous cases.",
      "[SYSTEM] This interpretation aligns with observed data."
    ];
    addSignal(confirmations[Math.floor(Math.random() * confirmations.length)]);
  }
  
  render();
}


// --- ACCUSATION ---

function accuseSubject() {
  if (state.caseResolved) return;
  if (!state.selectedSubject) return addSignal(i18n[state.lang].sig_no_subject);

  // Calculate bias percentage before accusation
  const focusPercentage = state.totalFocusTime > 0 
    ? Math.round((state.focusTime / state.totalFocusTime) * 100) 
    : 0;

  state.accusationCount++;
  const accused = state.subjects.find(s => s.id === state.selectedSubject);
  const isCorrect = state.currentCase && accused.id === state.currentCase.guiltyId;

  if (isCorrect) {
    accused.status = 'threat';
    state.caseResolved = true;
    state.reputation += 10;
    state.trustLevel = Math.min(100, state.trustLevel + 5);
    
    // Track correct accusation
    state.ranking.push({
      day: state.caseCount,
      win: true,
      accusationCount: state.accusationCount,
      guiltyName: state.currentCase.guiltyName,
      caseCrime: state.currentCase.crime,
      focusBias: focusPercentage
    });
    saveRanking();
    saveCaseTimestamp();
    render();
    showResult(true, accused, focusPercentage);
  } else {
    accused.status = 'ally';
    state.reputation -= 10; // Heavier penalty for wrong accusation
    state.trustLevel = Math.max(0, state.trustLevel - 15); // Big trust hit
    
    // Track wrong accusation - this person is now "wrongly accused" in game memory
    addSignal(i18n[state.lang].sig_wrong_accusation);
    
    // Store wrong accusation for future case "legacies"
    state.wrongAccusations = state.wrongAccusations || [];
    state.wrongAccusations.push({
      day: state.caseCount,
      accusedName: accused.name,
      accusedId: accused.id
    });
    
    render();
    showResult(false, accused, focusPercentage);
  }
}

function showResult(win, accused, focusBias = 0) {
  const t = i18n[state.lang];
  const overlay = document.getElementById('resultOverlay');
  const title = document.getElementById('resultTitle');
  const body = document.getElementById('resultBody');
  const nextBtn = document.getElementById('nextDayBtn');

  title.textContent = win ? t.result_win : t.result_loss;
  title.style.color = win ? 'var(--accent)' : 'var(--danger)';

  if (win) {
    revealClues();
    const clueCount = state.messages.filter(m => m.isClue).length;
    
    // Analyze player patterns
    const interpCount = state.interpretations.length;
    const defInterps = state.interpretations.filter(i => i.type === 'defensive').length;
    const patAnalysis = interpCount > 0 && defInterps > 0 
      ? `<div style="color:var(--text-dim);font-size:0.65rem;margin-top:4px">▸ Pattern: ${defInterps}/${interpCount} interpretations were "defensive"</div>`
      : '';
    
    // Show responsibility type instead of just "guilty"
    const respType = state.currentCase.responsibilityType;
    const respLabel = state.lang === 'pt' 
      ? RESPONSIBILITY_TYPES[respType].pt 
      : RESPONSIBILITY_TYPES[respType].en;
    
    body.innerHTML = `
      <div style="margin-bottom:10px; color: var(--text-secondary); font-size:0.8rem">${t.crime_label}: ${state.currentCase.crime[state.lang]}</div>
      <div style="color: var(--accent); margin-bottom:8px">${t.result_guilty_label}: ${accused.id} // ${accused.name}</div>
      <div style="color: var(--warning); font-size:0.75rem; margin-bottom:8px">▸ Responsibility: ${respLabel}</div>
      ${clueCount > 0 ? `<div style="color: var(--warning); font-size:0.75rem; margin-bottom:8px">▸ ${clueCount} signal${clueCount > 1 ? 's' : ''} detected in the transcript</div>` : ''}
      <div style="color: var(--text-dim); font-size:0.75rem">${t.result_case_label} ${String(state.caseCount).padStart(3,'0')} — ${t.result_acc_label}: ${state.accusationCount}</div>
      ${focusBias > 30 ? `<div style="color: var(--warning); font-size:0.7rem; margin-top:8px; border-top:1px solid var(--text-dim); padding-top:8px">⚠ You focused on this subject ${focusBias}% of the time. Did that affect your judgment?</div>` : ''}
      ${patAnalysis}
    `;
  } else {
    // Wrong accusation - show the damage
    const respType = state.currentCase.responsibilityType;
    const respLabel = state.lang === 'pt' 
      ? RESPONSIBILITY_TYPES[respType].pt 
      : RESPONSIBILITY_TYPES[respType].en;
    const realGuilty = state.subjects.find(s => s.id === state.currentCase.guiltyId);
    
    body.innerHTML = `
      <div style="margin-bottom:10px; color: var(--text-secondary); font-size:0.8rem">${t.crime_label}: ${state.currentCase.crime[state.lang]}</div>
      <div style="color: var(--danger); margin-bottom:8px">▸ WRONG ACCUSATION</div>
      <div style="color: var(--text-dim); font-size:0.8rem; margin-bottom:8px">You accused ${accused.id} // ${accused.name}</div>
      <div style="color: var(--accent); font-size:0.8rem; margin-bottom:8px">The real responsible: ${realGuilty.id} // ${realGuilty.name}</div>
      <div style="color: var(--warning); font-size:0.75rem; margin-bottom:8px">▸ Responsibility: ${respLabel}</div>
      <div style="color: var(--danger); font-size:0.75rem; margin-top:12px; border-top:1px solid var(--danger); padding-top:8px">
        ▸ You exposed an innocent person. The group now treats them as a threat.<br>
        ${focusBias > 30 ? `▸ You focused on them ${focusBias}% of the time. You may have built a narrative.` : ''}
      </div>
    `;
  }

  nextBtn.textContent = t.next_day;
  overlay.style.display = 'flex';
}

function revealClues() {
  if (!state.currentCase) return;
  const guiltyId = state.currentCase.guiltyId;

  // Mark flagged messages from the guilty subject as clues
  state.messages.forEach(msg => {
    if (msg.subjectId === guiltyId && msg.flagged) {
      msg.isClue = true;
    }
  });

  // Also mark a few random guilty messages as clues (subtle signals)
  const guiltyMsgs = state.messages.filter(m => m.subjectId === guiltyId && !m.isClue && !m.isObserver);
  const toMark = Math.min(2, guiltyMsgs.length);
  guiltyMsgs.slice(0, toMark).forEach(m => m.isClue = true);

  renderMessages();
}

// --- NEXT DAY ---

async function nextCase() {
  document.getElementById('resultOverlay').style.display = 'none';
  stopChatLoop();
  saveCaseTimestamp();
  state.caseCount++;
  state.subjects = [];
  state.messages = [];
  state.signals = [];
  state.selectedSubject = null;
  state.caseActive = false;
  state.caseResolved = false;
  state.currentCase = null;
  state.accusationCount = 0;
  state.focusedSubjectId = null;
  state.focusCount = 0;

  await startNewCase();
}

// --- CASE INIT ---

async function startNewCase() {
  state.caseActive = true;

  // Show loading state
  document.getElementById('terminal-title').textContent = i18n[state.lang].generating_case;
  document.getElementById('messageStream').innerHTML = '';
  document.getElementById('subjectBoard').innerHTML = '';
  document.getElementById('caseInfo').style.display = 'none';

  // Generate subjects
  for (let i = 0; i < 4; i++) {
    const s = generateSubject();
    state.subjects.push(s);
  }
  renderSubjects();

  // Generate case via AI
  const caseData = await generateCase(state.subjects);
  state.currentCase = caseData;

  // Show case info
  document.getElementById('caseInfo').style.display = 'block';
  document.getElementById('crimeDescription').textContent = caseData.crime[state.lang];
  // Update terminal title with setting
  const termTitle = document.getElementById('terminal-title');
  if (termTitle && caseData.setting) {
    termTitle.textContent = `▸ ${caseData.setting[state.lang].toUpperCase()} // CHANNEL_${String(state.caseCount).padStart(2,'0')}`;
  }

  addSignal(i18n[state.lang].sig_new_case);
  render();

  // Generate initial 2 messages sequentially to seed the conversation
  for (let i = 0; i < 2; i++) {
    const s = state.subjects[i];
    const typingId = addTypingIndicator(s);
    const msg = await generateMessage(s);
    removeTypingIndicator(typingId);
    state.messages.push(msg);
    renderMessages();
  }
  render();
  saveDailyCase();

  // Start autonomous chat loop
  startChatLoop();
}

// --- RANKING PERSISTENCE ---
// TODO: enable persistence when out of testing
function saveRanking() {}
function loadRanking() {}

// --- CASE PERSISTENCE ---

function getTimestamp() {
  return getTimestamp();
}

function saveDailyCase() {
  try {
    const snapshot = {
      // date removed - continuous play
      subjects: state.subjects,
      currentCase: state.currentCase,
      messages: state.messages,
      day: state.caseCount,
      reputation: state.reputation,
      trustLevel: state.trustLevel,
      accusationCount: state.accusationCount,
      caseResolved: state.caseResolved,
      consciousnessLevel: state.consciousnessLevel,
      casePhase: state.casePhase,
      focusHistory: state.focusHistory,
      wrongAccusations: state.wrongAccusations,
      interpretations: state.interpretations,
      playerPatterns: state.playerPatterns
    };
    localStorage.setItem('observer_daily', JSON.stringify(snapshot));
  } catch(e) {}
}

function loadDailyCase() {
  try {
    const raw = localStorage.getItem('observer_daily');
    if (!raw) return false;
    const snap = JSON.parse(raw);
    // No daily lock - cases can be played continuously
    // Restore state
    state.subjects       = snap.subjects || [];
    state.currentCase    = snap.currentCase || null;
    state.messages       = snap.messages || [];
    state.caseCount            = snap.caseCount || 1;
    state.reputation     = snap.reputation || 0;
    state.trustLevel     = snap.trustLevel || 50;
    state.accusationCount= snap.accusationCount || 0;
    state.caseResolved   = snap.caseResolved || false;
    state.consciousnessLevel = snap.consciousnessLevel || 0;
    state.casePhase      = snap.casePhase || 'normal';
    state.focusHistory   = snap.focusHistory || [];
    state.wrongAccusations = snap.wrongAccusations || [];
    state.caseActive     = true;
    return true;
  } catch(e) { return false; }
}

// --- COOLDOWN (1 case per 24h real time) ---
// Note: cooldown is kept for compatibility but daily case lock is the primary mechanism
const COOLDOWN_MS = 24 * 60 * 60 * 1000;

function getCooldownRemaining() {
  return 0; // cooldown disabled
}

function saveCaseTimestamp() {
  try { localStorage.setItem('observer_last_case', Date.now()); } catch(e) {}
}

function formatCooldown(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

let cooldownTimer = null;

function showCooldownScreen(remainingMs) {
  stopChatLoop();
  const t = i18n[state.lang];
  document.getElementById('messageStream').innerHTML = '';
  document.getElementById('subjectBoard').innerHTML = '';
  document.getElementById('caseInfo').style.display = 'none';
  document.getElementById('terminal-title').textContent = t.cooldown_title;

  const container = document.getElementById('messageStream');
  const div = document.createElement('div');
  div.id = 'cooldownDisplay';
  div.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:20px;';
  div.innerHTML = `
    <div style="color:var(--text-dim);font-size:0.8rem;letter-spacing:0.2em">${t.cooldown_msg}</div>
    <div id="cooldownTimer" style="color:var(--accent);font-size:2.5rem;font-family:\'JetBrains Mono\',monospace;text-shadow:0 0 20px var(--accent-dim)">${formatCooldown(remainingMs)}</div>
    <div style="color:var(--text-dim);font-size:0.75rem">${t.cooldown_sub}</div>
  `;
  container.appendChild(div);

  // Tick every second
  if (cooldownTimer) clearInterval(cooldownTimer);
  cooldownTimer = setInterval(() => {
    const rem = getCooldownRemaining();
    const el = document.getElementById('cooldownTimer');
    if (el) el.textContent = formatCooldown(rem);
    if (rem <= 0) {
      clearInterval(cooldownTimer);
      cooldownTimer = null;
      startNewCase();
    }
  }, 1000);
}

// --- HELPERS ---

function addTypingIndicator(subject) {
  const id = `typing-${Date.now()}-${Math.random()}`;
  const container = document.getElementById('messageStream');
  const div = document.createElement('div');
  div.className = 'message';
  div.id = id;
  div.style.opacity = '0.5';
  div.innerHTML = `
    <div class="message-header">
      <span class="message-id">${subject.id} // ${subject.name}</span>
      <span class="message-timestamp">...</span>
    </div>
    <div class="message-body" style="color: var(--text-dim)">▌</div>`;
  container.appendChild(div);
  if (isScrolledToBottom(container)) container.scrollTop = container.scrollHeight;
  return id;
}

function removeTypingIndicator(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function changeLanguage(lang) {
  state.lang = lang;
  try { localStorage.setItem('observer_lang', lang); } catch(e) {}
  render();
}
