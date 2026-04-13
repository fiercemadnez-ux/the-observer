function renderMessages() {
  const container = document.getElementById('messageStream');
  container.innerHTML = state.messages.map(msg => {
    const s = state.subjects.find(sub => sub.id === msg.subjectId);
    return `
      <div class="message" onclick="selectSubject('${msg.subjectId}')">
        <div class="message-header">
          <span class="message-id">${msg.subjectId} // ${s ? s.name : '???'}</span>
          <span class="message-timestamp">${msg.timestamp}</span>
        </div>
        <div class="message-body">${msg.text}</div>
        ${msg.flagged ? `<div class="message-flag">${i18n[state.lang].flagged}</div>` : ''}
      </div>`;
  }).join('');
  container.scrollTop = container.scrollHeight;
}

function renderSubjects() {
  const container = document.getElementById('subjectBoard');
  container.innerHTML = state.subjects.map(s => `
    <div class="subject" onclick="selectSubject('${s.id}')">
      <span class="subject-name">${s.id}</span>
      <span class="subject-status status-${s.status}">${i18n[state.lang]['status_' + s.status]}</span>
    </div>`).join('');
}

function renderSignals() {
  const container = document.getElementById('signalLog');
  container.innerHTML = state.signals.slice(-10).map(sig =>
    `<div class="signal">[${sig.time}] ${sig.text}</div>`
  ).join('');
}

function updateStats() {
  const t = i18n[state.lang];
  document.getElementById('dayCounter').textContent = String(state.day).padStart(3, '0');
  let repKey = 'rep_neutral';
  if (state.reputation > 20) repKey = 'rep_respected';
  else if (state.reputation < -20) repKey = 'rep_suspicious';
  document.getElementById('reputation').textContent = t[repKey];
}

function render() {
  const t = i18n[state.lang];
  document.getElementById('label-online').textContent = t.online;
  document.getElementById('label-day').textContent = t.day;
  document.getElementById('terminal-title').textContent = t.terminal;
  document.getElementById('title-analysis').textContent = t.analysis;
  document.getElementById('title-signals').textContent = t.signals;
  document.getElementById('title-actions').textContent = t.actions;
  document.getElementById('btn-expose').textContent = t.btnExpose;
  document.getElementById('btn-pressure').textContent = t.btnPressure;
  document.getElementById('btn-doubt').textContent = t.btnDoubt;
  document.getElementById('btn-isolate').textContent = t.btnIsolate;
  document.getElementById('btn-observe').textContent = t.btnObserve;
  document.getElementById('footer-version').textContent = t.footer;
  document.getElementById('label-reputation').textContent = t.reputationLabel;

  renderMessages();
  renderSubjects();
  renderSignals();
  updateStats();
}
