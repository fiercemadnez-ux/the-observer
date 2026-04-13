// --- AUTO CHAT LOOP ---
let chatLoopTimer = null;
let pendingChatMessage = false;

function startChatLoop() {
  stopChatLoop();
  // First message after 3s, then every 9-14s
  const delay = 4000 + Math.random() * 2000;
  chatLoopTimer = setTimeout(autoChat, delay);
}

function stopChatLoop() {
  if (chatLoopTimer) { clearTimeout(chatLoopTimer); chatLoopTimer = null; }
}

async function autoChat() {
  if (state.caseResolved) return;
  if (pendingChatMessage) {
    chatLoopTimer = setTimeout(autoChat, 3000);
    return;
  }

  pendingChatMessage = true;
  // Pick a random subject (weighted: guilty speaks a bit less)
  const candidates = state.subjects.filter(s => s.status !== 'ally');
  const subject = candidates[Math.floor(Math.random() * candidates.length)] || state.subjects[0];

  const typingId = addTypingIndicator(subject);
  const msg = await generateMessage(subject);
  removeTypingIndicator(typingId);
  state.messages.push(msg);
  pendingChatMessage = false;

  renderMessages();
  showNewMessageBadge();

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
  const archetype = types[Math.floor(Math.random() * types.length)];
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
  const prefixes = ['Voss', 'Kael', 'Mira', 'Dex', 'Nyx', 'Rho', 'Izen', 'Cray', 'Lune', 'Tark'];
  const suffixes = ['_7', '_X', '.null', '.io', '_zero', '_ghost', '.exe', '_9', '_red', '.sys'];
  return prefixes[Math.floor(Math.random() * prefixes.length)] + suffixes[Math.floor(Math.random() * suffixes.length)];
}

async function generateMessage(subject) {
  const subjectHistory = state.messages.filter(m => m.subjectId === subject.id);
  const texts = await generateMessageFromAI(subject, subjectHistory);
  return {
    id: `MSG-${String(state.messages.length + 1).padStart(4, '0')}`,
    subjectId: subject.id,
    texts,  // { en, pt }
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    flagged: Math.random() > 0.8
  };
}

function addSignal(text) {
  state.signals.push({
    text,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  });
  renderSignals();
}

function selectSubject(id) {
  if (state.caseResolved) return;
  state.selectedSubject = id;
  const s = state.subjects.find(sub => sub.id === id);
  addSignal(`${i18n[state.lang].sig_selected}: ${id} (${s ? s.name : '?'})`);
}

// --- REACTIONS ---

async function triggerReactions(action, targetSubject, count = 1) {
  // Pick random OTHER subjects to react
  const reactors = state.subjects
    .filter(s => s.id !== targetSubject.id && s.status !== 'ally')
    .sort(() => Math.random() - 0.5)
    .slice(0, count);

  for (const reactor of reactors) {
    await new Promise(r => setTimeout(r, 1500 + Math.random() * 2000));
    if (state.caseResolved) break;

    const isGuilty = state.currentCase && reactor.id === state.currentCase.guiltyId;
    const targetIsGuilty = state.currentCase && targetSubject.id === state.currentCase.guiltyId;

    const enPrompt =
      `You are ${reactor.name} in a cyberpunk group chat. Archetype: ${archetypePrompts.en[reactor.archetype]}.` +
      (isGuilty ? ' You committed a crime and are hiding it.' : '') +
      ` The observer just ${action} ${targetSubject.name}.` +
      (targetIsGuilty ? ' (You may sense this is getting close to something real.)' : '') +
      ` React naturally in 1 sentence. Stay in character.`;
    const ptPrompt =
      `Você é ${reactor.name} em um chat cyberpunk. Arquétipo: ${archetypePrompts.pt[reactor.archetype]}.` +
      (isGuilty ? ' Você cometeu um crime e está escondendo.' : '') +
      ` O observador acabou de ${action.replace('exposed', 'expor').replace('pressured', 'pressionar').replace('planted doubt about', 'plantar dúvida sobre').replace('isolated', 'isolar')} ${targetSubject.name}.` +
      (targetIsGuilty ? ' (Você pode sentir que isso está chegando perto de algo real.)' : '') +
      ` Reaja naturalmente em 1 frase. Fique no personagem.`;

    const typingId = addTypingIndicator(reactor);
    const texts = await callAI(enPrompt, ptPrompt);
    removeTypingIndicator(typingId);

    state.messages.push({
      id: `MSG-${String(state.messages.length + 1).padStart(4, '0')}`,
      subjectId: reactor.id, texts,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      flagged: false
    });
    renderMessages();
    showNewMessageBadge();
  }
}

// --- ACTIONS ---

function exposeSubject() {
  if (state.caseResolved) return;
  if (!state.selectedSubject) return addSignal(i18n[state.lang].sig_no_subject);
  const s = state.subjects.find(sub => sub.id === state.selectedSubject);
  s.status = 'suspect';
  addSignal(`${i18n[state.lang].sig_exposed}: ${s.id}`);
  render();
  // Pause auto chat and trigger reactions
  stopChatLoop();
  triggerReactions('exposed', s, 1).then(() => {
    if (!state.caseResolved) startChatLoop();
  });
}

async function pressureSubject() {
  if (state.caseResolved) return;
  if (!state.selectedSubject) return addSignal(i18n[state.lang].sig_no_subject);
  const s = state.subjects.find(sub => sub.id === state.selectedSubject);
  const isGuilty = state.currentCase && s.id === state.currentCase.guiltyId;

  const enPrompt = `You are a character in a cyberpunk investigation game. You are being pressured and confronted. React with discomfort, defensiveness or fear. Archetype: ${s.archetype}.${isGuilty ? ' You committed a crime. Be defensive but do not confess.' : ''} 1-2 sentences.`;
  const ptPrompt = `Você é um personagem em um jogo de investigação cyberpunk. Está sendo pressionado. Reaja com desconforto, defensividade ou medo. Arquétipo: ${s.archetype}.${isGuilty ? ' Você cometeu um crime. Fique na defensiva mas não confesse.' : ''} 1-2 frases.`;

  const typingId = addTypingIndicator(s);
  const texts = await callAI(enPrompt, ptPrompt);
  removeTypingIndicator(typingId);

  state.messages.push({
    id: `MSG-${String(state.messages.length + 1).padStart(4, '0')}`,
    subjectId: s.id, texts,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    flagged: isGuilty && Math.random() > 0.5
  });
  addSignal(i18n[state.lang].sig_pressure);
  render();
  stopChatLoop();
  triggerReactions('pressured', s, 1).then(() => {
    if (!state.caseResolved) startChatLoop();
  });
}

async function plantDoubt() {
  if (state.caseResolved) return;
  if (!state.selectedSubject) return addSignal(i18n[state.lang].sig_no_subject);
  const s = state.subjects.find(sub => sub.id === state.selectedSubject);

  const enPrompt = `You are a character in a cyberpunk investigation game. Someone just planted doubt in your mind. You start questioning your certainty. Archetype: ${s.archetype}. 1-2 hesitant sentences.`;
  const ptPrompt = `Você é um personagem em um jogo de investigação cyberpunk. Alguém plantou uma dúvida na sua cabeça. Você começa a questionar sua certeza. Arquétipo: ${s.archetype}. 1-2 frases hesitantes.`;

  const typingId = addTypingIndicator(s);
  const texts = await callAI(enPrompt, ptPrompt);
  removeTypingIndicator(typingId);

  state.messages.push({
    id: `MSG-${String(state.messages.length + 1).padStart(4, '0')}`,
    subjectId: s.id, texts,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    flagged: false
  });
  addSignal(i18n[state.lang].sig_doubt);
  render();
  stopChatLoop();
  triggerReactions('planted doubt about', s, 1).then(() => {
    if (!state.caseResolved) startChatLoop();
  });
}

function isolateSubject() {
  if (state.caseResolved) return;
  if (!state.selectedSubject) return addSignal(i18n[state.lang].sig_no_subject);
  const s = state.subjects.find(sub => sub.id === state.selectedSubject);
  s.status = 'unknown';
  addSignal(i18n[state.lang].sig_isolating);
  render();
  stopChatLoop();
  triggerReactions('isolated', s, 2).then(() => {
    if (!state.caseResolved) startChatLoop();
  });
}

function probeSubject() {
  if (state.caseResolved) return;
  if (!state.selectedSubject) return addSignal(i18n[state.lang].sig_no_subject);
  const s = state.subjects.find(sub => sub.id === state.selectedSubject);
  showProbeModal(s);
}

function showProbeModal(subject) {
  const modal = document.getElementById('probeModal');
  const title = document.getElementById('probeModalTitle');
  const input = document.getElementById('probeInput');
  const t = i18n[state.lang];
  title.textContent = `${t.probe_target}: ${subject.id} // ${subject.name}`;
  input.value = '';
  input.placeholder = t.probe_placeholder;
  modal.style.display = 'flex';
  input.focus();
  // Store target
  modal.dataset.subjectId = subject.id;
}

async function submitProbe() {
  const modal = document.getElementById('probeModal');
  const input = document.getElementById('probeInput');
  const question = input.value.trim();
  if (!question) return;

  const subjectId = modal.dataset.subjectId;
  const s = state.subjects.find(sub => sub.id === subjectId);
  closeProbeModal();

  if (!s) return;

  const isGuilty = state.currentCase && s.id === state.currentCase.guiltyId;
  const lang = state.lang;

  // Add the player's question as a system message
  state.messages.push({
    id: `MSG-${String(state.messages.length + 1).padStart(4, '0')}`,
    subjectId: 'OBSERVER',
    texts: { en: `[TO ${s.name}]: ${question}`, pt: `[PARA ${s.name}]: ${question}` },
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    flagged: false,
    isObserver: true
  });
  renderMessages();

  const enPrompt =
    `You are ${s.name} in a cyberpunk group chat. Archetype: ${archetypePrompts.en[s.archetype]}` +
    (isGuilty ? ' You committed a crime and are hiding it.' : '') +
    ` Someone just directly asked you: "${question}". Respond in character. 1-3 sentences.`;
  const ptPrompt =
    `Você é ${s.name} em um chat cyberpunk. Arquétipo: ${archetypePrompts.pt[s.archetype]}` +
    (isGuilty ? ' Você cometeu um crime e está escondendo.' : '') +
    ` Alguém acabou de te perguntar diretamente: "${question}". Responda no personagem. 1-3 frases.`;

  const typingId = addTypingIndicator(s);
  const texts = await callAI(enPrompt, ptPrompt);
  removeTypingIndicator(typingId);

  state.messages.push({
    id: `MSG-${String(state.messages.length + 1).padStart(4, '0')}`,
    subjectId: s.id, texts,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    flagged: isGuilty && Math.random() > 0.5
  });
  addSignal(`${i18n[lang].sig_probed}: ${s.id}`);
  render();
  // Occasionally another subject reacts to the interrogation
  if (Math.random() > 0.4) {
    stopChatLoop();
    triggerReactions(`directly questioned ${s.name} asking: "${question}"`, s, 1).then(() => {
      if (!state.caseResolved) startChatLoop();
    });
  }
}

function closeProbeModal() {
  document.getElementById('probeModal').style.display = 'none';
}

// --- ACCUSATION ---

function accuseSubject() {
  if (state.caseResolved) return;
  if (!state.selectedSubject) return addSignal(i18n[state.lang].sig_no_subject);

  state.accusationCount++;
  const accused = state.subjects.find(s => s.id === state.selectedSubject);
  const isCorrect = state.currentCase && accused.id === state.currentCase.guiltyId;

  if (isCorrect) {
    accused.status = 'threat';
    state.caseResolved = true;
    state.reputation += 10;
    state.ranking.push({
      day: state.day,
      win: true,
      accusationCount: state.accusationCount,
      guiltyName: state.currentCase.guiltyName,
      caseCrime: state.currentCase.crime  // { en, pt }
    });
    saveRanking();
    render();
    showResult(true, accused);
  } else {
    accused.status = 'ally';
    state.reputation -= 5;
    addSignal(i18n[state.lang].sig_wrong_accusation);
    render();
  }
}

function showResult(win, accused) {
  const t = i18n[state.lang];
  const overlay = document.getElementById('resultOverlay');
  const title = document.getElementById('resultTitle');
  const body = document.getElementById('resultBody');
  const nextBtn = document.getElementById('nextDayBtn');

  title.textContent = win ? t.result_win : t.result_loss;
  title.style.color = win ? 'var(--accent)' : 'var(--danger)';

  if (win) {
    // Mark clue messages in the chat
    revealClues();

    const clueCount = state.messages.filter(m => m.isClue).length;
    body.innerHTML = `
      <div style="margin-bottom:10px; color: var(--text-secondary); font-size:0.8rem">${t.crime_label}: ${state.currentCase.crime[state.lang]}</div>
      <div style="color: var(--accent); margin-bottom:8px">${t.result_guilty_label}: ${accused.id} // ${accused.name}</div>
      ${clueCount > 0 ? `<div style="color: var(--warning); font-size:0.75rem; margin-bottom:8px">▸ ${clueCount} signal${clueCount > 1 ? 's' : ''} detected in the transcript</div>` : ''}
      <div style="color: var(--text-dim); font-size:0.75rem">${t.result_day_label} ${String(state.day).padStart(3,'0')} — ${t.result_acc_label}: ${state.accusationCount}</div>
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

async function nextDay() {
  document.getElementById('resultOverlay').style.display = 'none';
  stopChatLoop();
  state.day++;
  state.subjects = [];
  state.messages = [];
  state.signals = [];
  state.selectedSubject = null;
  state.caseActive = false;
  state.caseResolved = false;
  state.currentCase = null;
  state.accusationCount = 0;

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

  // Start autonomous chat loop
  startChatLoop();
}

// --- RANKING PERSISTENCE ---
// TODO: enable persistence when out of testing
function saveRanking() {}
function loadRanking() {}

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
  render();
}
