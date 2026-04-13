function isScrolledToBottom(el) {
  return el.scrollHeight - el.scrollTop - el.clientHeight < 40;
}

function scrollToBottom() {
  const container = document.getElementById('messageStream');
  container.scrollTop = container.scrollHeight;
  const badge = document.getElementById('newMsgBadge');
  if (badge) badge.style.display = 'none';
}

function onChatScroll() {
  const container = document.getElementById('messageStream');
  if (isScrolledToBottom(container)) {
    const badge = document.getElementById('newMsgBadge');
    if (badge) badge.style.display = 'none';
  }
}

function renderMessages() {
  const container = document.getElementById('messageStream');
  const shouldScroll = isScrolledToBottom(container);

  container.innerHTML = state.messages.map(msg => {
    const s = state.subjects.find(sub => sub.id === msg.subjectId);
    const text = msg.texts ? (msg.texts[state.lang] || msg.texts.en) : (msg.text || '');
    const isObserver = msg.isObserver;
    const color = isObserver ? 'var(--info)' : (s ? s.color : 'var(--text-dim)');
    const isSelected = s && s.id === state.selectedSubject;
    const isClue = msg.isClue;
    return `
      <div class="message ${isObserver ? 'message-observer' : ''} ${isSelected ? 'message-selected' : ''} ${isClue ? 'message-clue' : ''}" 
           style="border-left-color: ${color}" 
           ${!isObserver ? `onclick="selectSubject('${msg.subjectId}')"` : ''}>
        <div class="message-header">
          <span class="message-id" style="color: ${color}">${isObserver ? '// OBSERVER' : `${msg.subjectId} // ${s ? s.name : '???'}`}</span>
          <span class="message-timestamp">${msg.timestamp}</span>
        </div>
        <div class="message-body">${text}</div>
        ${msg.flagged ? `<div class="message-flag">${i18n[state.lang].flagged}</div>` : ''}
        ${isClue ? `<div class="message-clue-label">▸ SIGNAL DETECTED</div>` : ''}
      </div>`;
  }).join('');

  if (shouldScroll) container.scrollTop = container.scrollHeight;
}

function renderSubjects() {
  const t = i18n[state.lang];
  const container = document.getElementById('subjectBoard');
  container.innerHTML = state.subjects.map(s => {
    const isSelected = s.id === state.selectedSubject;
    return `
      <div class="subject ${isSelected ? 'subject-selected' : ''}" 
           style="border-left: 3px solid ${s.color || 'var(--text-dim)'}" 
           onclick="selectSubject('${s.id}')">
        <div>
          <div style="color: ${s.color || 'var(--text-primary)'}; font-size: 0.78rem">${s.id} // ${s.name}</div>
          <div style="color: var(--text-dim); font-size: 0.65rem; margin-top:2px">${s.archetype.replace(/_/g, ' ').toUpperCase()}</div>
        </div>
        <span class="subject-status status-${s.status}">${t['status_' + s.status]}</span>
      </div>`;
  }).join('');
}

function renderSignals() {
  const container = document.getElementById('signalLog');
  container.innerHTML = state.signals.slice(-10).map(sig =>
    `<div class="signal">[${sig.time}] ${sig.text}</div>`
  ).join('');
  container.scrollTop = container.scrollHeight;
}

function renderRanking() {
  const t = i18n[state.lang];
  const container = document.getElementById('rankingList');
  if (!state.ranking.length) {
    container.innerHTML = `<div style="color:var(--text-dim);font-size:0.75rem">${t.ranking_empty}</div>`;
    return;
  }
  container.innerHTML = [...state.ranking].reverse().map((entry, i) => `
    <div class="ranking-entry ${entry.win ? 'rank-win' : 'rank-loss'}">
      <div class="rank-top">
        <span>${t.ranking_day}${String(entry.day).padStart(3,'0')}</span>
        <span>${entry.win ? '✓' : '✗'} ${entry.accusationCount} ${t.ranking_acc}</span>
      </div>
      <div class="rank-crime">${typeof entry.caseCrime === 'object' ? (entry.caseCrime[state.lang] || entry.caseCrime.en) : entry.caseCrime}</div>
    </div>
  `).join('');
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
  document.getElementById('title-ranking').textContent = t.ranking_title;
  document.getElementById('btn-expose').textContent = t.btnExpose;
  document.getElementById('btn-focus').textContent = t.btnFocus;
  document.getElementById('btn-clear').textContent = t.btnClear;
  document.getElementById('btn-accuse').textContent = t.btnAccuse;
  document.getElementById('footer-version').textContent = t.footer;
  document.getElementById('label-reputation').textContent = t.reputationLabel;
  document.getElementById('label-crime').textContent = t.crime_label;
  document.getElementById('action-hint').textContent = t.action_hint;

  // Update crime description in current language
  if (state.currentCase) {
    document.getElementById('crimeDescription').textContent = state.currentCase.crime[state.lang];
  }

  renderMessages();
  renderSubjects();
  renderSignals();
  renderRanking();
  updateStats();
}
