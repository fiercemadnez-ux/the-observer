function generateSubject() {
  const types = Object.keys(messageTemplates);
  const archetype = types[Math.floor(Math.random() * types.length)];
  return {
    id: `SUB-${String(state.subjects.length + 1).padStart(3, '0')}`,
    name: "User_" + Math.floor(Math.random() * 999),
    archetype,
    trust: 50,
    status: 'unknown'
  };
}

async function generateMessage(subject) {
  // Get recent messages from this subject for context
  const subjectHistory = state.messages.filter(m => m.subjectId === subject.id);
  const text = await generateMessageFromAI(subject, subjectHistory);

  return {
    id: `MSG-${String(state.messages.length + 1).padStart(4, '0')}`,
    subjectId: subject.id,
    text,
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
  state.selectedSubject = id;
  addSignal(`${i18n[state.lang].sig_selected}: ${id}`);
}

function exposeSubject() {
  if (!state.selectedSubject) return addSignal(i18n[state.lang].sig_no_subject);
  const s = state.subjects.find(sub => sub.id === state.selectedSubject);
  s.status = 'suspect';
  addSignal(`${i18n[state.lang].sig_exposed}: ${s.id}`);
  render();
}

async function pressureSubject() {
  if (!state.selectedSubject) return addSignal(i18n[state.lang].sig_no_subject);
  const s = state.subjects.find(sub => sub.id === state.selectedSubject);

  const lang = state.lang;
  const systemPrompt = lang === 'pt'
    ? `Você está sendo pressionado e confrontado. Reaja com desconforto, defensividade ou medo. Fique no personagem: ${s.archetype}. 1-2 frases. Em português.`
    : `You are being pressured and confronted. React with discomfort, defensiveness or fear. Stay in character: ${s.archetype}. 1-2 sentences.`;

  const typingId = addTypingIndicator(s.id);
  const text = await callAI(systemPrompt);
  removeTypingIndicator(typingId);

  state.messages.push({
    id: `MSG-${String(state.messages.length + 1).padStart(4, '0')}`,
    subjectId: s.id,
    text,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    flagged: false
  });
  addSignal(i18n[lang].sig_pressure);
  render();
}

async function plantDoubt() {
  if (!state.selectedSubject) return addSignal(i18n[state.lang].sig_no_subject);
  const s = state.subjects.find(sub => sub.id === state.selectedSubject);

  const lang = state.lang;
  const systemPrompt = lang === 'pt'
    ? `Alguém plantou uma dúvida na sua cabeça. Você começa a questionar sua certeza. Fique no personagem: ${s.archetype}. 1-2 frases hesitantes. Em português.`
    : `Someone just planted doubt in your mind. You start questioning your certainty. Stay in character: ${s.archetype}. 1-2 hesitant sentences.`;

  const typingId = addTypingIndicator(s.id);
  const text = await callAI(systemPrompt);
  removeTypingIndicator(typingId);

  state.messages.push({
    id: `MSG-${String(state.messages.length + 1).padStart(4, '0')}`,
    subjectId: s.id,
    text,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    flagged: false
  });
  addSignal(i18n[lang].sig_doubt);
  render();
}

function isolateSubject() {
  if (!state.selectedSubject) return addSignal(i18n[state.lang].sig_no_subject);
  addSignal(i18n[state.lang].sig_isolating);
  render();
}

async function observeMore() {
  const s = generateSubject();
  state.subjects.push(s);
  addSignal(i18n[state.lang].sig_new_sub);
  renderSubjects();

  const typingId = addTypingIndicator(s.id);
  const msg = await generateMessage(s);
  removeTypingIndicator(typingId);

  state.messages.push(msg);
  render();
}

// Helper: call AI with a one-shot system prompt
async function callAI(systemPrompt) {
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
          { role: 'system', content: systemPrompt },
          { role: 'user', content: state.lang === 'pt' ? 'Responda.' : 'Respond.' }
        ],
        max_tokens: 100,
        temperature: 0.95,
        stream: false
      })
    });
    if (!response.ok) throw new Error(`API ${response.status}`);
    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (err) {
    console.warn('AI fallback:', err.message);
    return state.lang === 'pt' ? '...' : '...';
  }
}

// Typing indicator helpers
function addTypingIndicator(subjectId) {
  const id = `typing-${Date.now()}`;
  const container = document.getElementById('messageStream');
  const s = state.subjects.find(sub => sub.id === subjectId);
  const div = document.createElement('div');
  div.className = 'message';
  div.id = id;
  div.style.opacity = '0.5';
  div.innerHTML = `
    <div class="message-header">
      <span class="message-id">${subjectId} // ${s ? s.name : '???'}</span>
      <span class="message-timestamp">...</span>
    </div>
    <div class="message-body" style="color: var(--text-dim)">▌</div>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
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
