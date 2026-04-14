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
  pendingChatMessage = false;

  renderMessageAnimated(msg);
  state.messages.push(msg);
  saveDailyCase();
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
  
  // Add surveillance action
  const surveillanceActions = [
    "checked phone", "looked around", "shifted weight", "tapped fingers",
    "crossed arms", "glanced at door", "fidgeted", "stood still",
    "looked down", "laughed nervously", "checked watch", "nodded",
    "sighed", "looked away", "scratched head"
  ];
  const isNervous = Math.random() > 0.6;
  const action = isNervous 
    ? surveillanceActions[Math.floor(Math.random() * surveillanceActions.length)] + " ←nervous"
    : surveillanceActions[Math.floor(Math.random() * surveillanceActions.length)];
  addSurveillanceEntry(subject.id, action);
  
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
    saveCaseTimestamp();
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
  saveCaseTimestamp();
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
  saveDailyCase();

  // Start autonomous chat loop
  startChatLoop();
}

// --- RANKING PERSISTENCE ---
// TODO: enable persistence when out of testing
function saveRanking() {}
function loadRanking() {}

// --- DAILY CASE PERSISTENCE ---

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function saveDailyCase() {
  try {
    const snapshot = {
      date: todayKey(),
      subjects: state.subjects,
      currentCase: state.currentCase,
      messages: state.messages,
      day: state.day,
      reputation: state.reputation,
      accusationCount: state.accusationCount,
      caseResolved: state.caseResolved
    };
    localStorage.setItem('observer_daily', JSON.stringify(snapshot));
  } catch(e) {}
}

function loadDailyCase() {
  try {
    const raw = localStorage.getItem('observer_daily');
    if (!raw) return false;
    const snap = JSON.parse(raw);
    if (snap.date !== todayKey()) return false;
    // Restore state
    state.subjects       = snap.subjects || [];
    state.currentCase    = snap.currentCase || null;
    state.messages       = snap.messages || [];
    state.day            = snap.day || 1;
    state.reputation     = snap.reputation || 0;
    state.accusationCount= snap.accusationCount || 0;
    state.caseResolved   = snap.caseResolved || false;
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
