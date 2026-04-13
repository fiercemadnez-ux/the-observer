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

function generateMessage(subject) {
  const templates = messageTemplates[subject.archetype][state.lang];
  return {
    id: `MSG-${String(state.messages.length + 1).padStart(4, '0')}`,
    subjectId: subject.id,
    text: templates[Math.floor(Math.random() * templates.length)],
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

function pressureSubject() {
  if (!state.selectedSubject) return addSignal(i18n[state.lang].sig_no_subject);
  const s = state.subjects.find(sub => sub.id === state.selectedSubject);
  state.messages.push({ ...generateMessage(s), text: i18n[state.lang].msg_pressure_def });
  addSignal(i18n[state.lang].sig_pressure);
  render();
}

function plantDoubt() {
  if (!state.selectedSubject) return addSignal(i18n[state.lang].sig_no_subject);
  const s = state.subjects.find(sub => sub.id === state.selectedSubject);
  state.messages.push({ ...generateMessage(s), text: i18n[state.lang].msg_doubt_def });
  addSignal(i18n[state.lang].sig_doubt);
  render();
}

function isolateSubject() {
  if (!state.selectedSubject) return addSignal(i18n[state.lang].sig_no_subject);
  addSignal(i18n[state.lang].sig_isolating);
  render();
}

function observeMore() {
  const s = generateSubject();
  state.subjects.push(s);
  state.messages.push(generateMessage(s));
  addSignal(i18n[state.lang].sig_new_sub);
  render();
}

function changeLanguage(lang) {
  state.lang = lang;
  render();
}
