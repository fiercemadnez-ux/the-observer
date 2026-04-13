function generateSubject() {
  const types = Object.keys(messageTemplates);
  const archetype = types[Math.floor(Math.random() * types.length)];
  return {
    id: `SUB-${String(state.subjects.length + 1).padStart(3, '0')}`,
    name: generateName(),
    archetype,
    trust: 50,
    status: 'unknown'
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

// --- ACTIONS ---

function exposeSubject() {
  if (state.caseResolved) return;
  if (!state.selectedSubject) return addSignal(i18n[state.lang].sig_no_subject);
  const s = state.subjects.find(sub => sub.id === state.selectedSubject);
  s.status = 'suspect';
  addSignal(`${i18n[state.lang].sig_exposed}: ${s.id}`);
  render();
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
}

function isolateSubject() {
  if (state.caseResolved) return;
  if (!state.selectedSubject) return addSignal(i18n[state.lang].sig_no_subject);
  const s = state.subjects.find(sub => sub.id === state.selectedSubject);
  s.status = 'unknown';
  addSignal(i18n[state.lang].sig_isolating);
  render();
}

async function probeSubject() {
  if (state.caseResolved) return;
  if (!state.selectedSubject) return addSignal(i18n[state.lang].sig_no_subject);
  const s = state.subjects.find(sub => sub.id === state.selectedSubject);
  const typingId = addTypingIndicator(s);
  const msg = await generateMessage(s);
  removeTypingIndicator(typingId);
  state.messages.push(msg);
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
    body.innerHTML = `
      <div style="margin-bottom:10px; color: var(--text-secondary); font-size:0.8rem">${t.crime_label}: ${state.currentCase.crime}</div>
      <div style="color: var(--accent)">${t.result_guilty_label}: ${accused.id} // ${accused.name}</div>
      <div style="margin-top:10px; color: var(--text-dim); font-size:0.75rem">${t.result_day_label} ${String(state.day).padStart(3,'0')} — ${t.result_acc_label}: ${state.accusationCount}</div>
    `;
  }

  nextBtn.textContent = t.next_day;
  overlay.style.display = 'flex';
}

// --- NEXT DAY ---

async function nextDay() {
  document.getElementById('resultOverlay').style.display = 'none';
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

  // Generate initial messages in parallel
  const typingIds = state.subjects.map(s => addTypingIndicator(s));
  const messages = await Promise.all(state.subjects.map(s => generateMessage(s)));
  typingIds.forEach(id => removeTypingIndicator(id));
  messages.forEach(m => state.messages.push(m));
  render();
}

// --- RANKING PERSISTENCE ---

function saveRanking() {
  try { localStorage.setItem('observer_ranking', JSON.stringify(state.ranking)); } catch(e) {}
}

function loadRanking() {
  try {
    const saved = localStorage.getItem('observer_ranking');
    if (saved) state.ranking = JSON.parse(saved);
  } catch(e) {}
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
  render();
}
