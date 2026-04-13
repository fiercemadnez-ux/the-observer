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
  // Pick subject: respect FOCUS if set, otherwise random (excluding cleared)
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

  const typingId = addTypingIndicator(subject);
  const msg = await generateMessage(subject);
  removeTypingIndicator(typingId);
  state.messages.push(msg);
  pendingChatMessage = false;

  renderMessages();
  showNewMessageBadge();

  // 30% chance another subject reacts organically
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
  const first = ['Marcus', 'Nadia', 'Eliot', 'Soren', 'Petra', 'Jules', 'Damian', 'Irina',
                 'Theo', 'Camille', 'Riku', 'Vera', 'Otto', 'Lena', 'Samir', 'Anya',
                 'Felix', 'Mara', 'Dorian', 'Zoe', 'Ivan', 'Cleo', 'Hugo', 'Nora'];
  const last  = ['Voss', 'Keller', 'Marsh', 'Reyes', 'Fontaine', 'Drake', 'Novak', 'Cross',
                 'Hahn', 'Steele', 'Okafor', 'Reinhart', 'Mori', 'Crane', 'Bekker', 'Lund'];
  return first[Math.floor(Math.random() * first.length)] + ' ' + last[Math.floor(Math.random() * last.length)];
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

    const enPrompt =
      `You are ${reactor.name}, an employee in your company's internal chat. You have no idea anyone is watching.` +
      ` Personality: ${archetypePrompts.en[reactor.archetype]}` +
      (isGuilty ? ' You are hiding something serious and feel internal pressure.' : '') +
      ` ${triggerSubject.name} just said: "${lastText}". React naturally in 1 sentence. Do NOT mention investigations or crimes.`;
    const ptPrompt =
      `Você é ${reactor.name}, funcionário no chat interno da empresa. Não sabe que está sendo observado.` +
      ` Personalidade: ${archetypePrompts.pt[reactor.archetype]}` +
      (isGuilty ? ' Você está escondendo algo sério e sente pressão interna.' : '') +
      ` ${triggerSubject.name} acabou de dizer: "${lastText}". Reaja naturalmente em 1 frase. Não mencione investigações ou crimes.`;

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
  // MARK as suspect
  if (state.caseResolved) return;
  if (!state.selectedSubject) return addSignal(i18n[state.lang].sig_no_subject);
  const s = state.subjects.find(sub => sub.id === state.selectedSubject);
  s.status = 'suspect';
  addSignal(`${i18n[state.lang].sig_marked}: ${s.id} // ${s.name}`);
  render();
}

function focusSubject() {
  // FOCUS — next 2 autochat messages will be from this subject
  if (state.caseResolved) return;
  if (!state.selectedSubject) return addSignal(i18n[state.lang].sig_no_subject);
  const s = state.subjects.find(sub => sub.id === state.selectedSubject);
  state.focusedSubjectId = s.id;
  state.focusCount = 2;
  addSignal(`${i18n[state.lang].sig_focused}: ${s.id} // ${s.name}`);
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
    termTitle.textContent = `▸ ${caseData.setting[state.lang].toUpperCase()} // CHANNEL_${String(state.day).padStart(2,'0')}`;
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
  try { localStorage.setItem('observer_lang', lang); } catch(e) {}
  render();
}
