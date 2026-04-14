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

// --- TYPING EFFECT ---
// Renders a single new message with a letter-by-letter typing animation.
// Used for live messages (autoChat + reactions). Static restore uses renderMessages().
function renderMessageAnimated(msg) {
  const container = document.getElementById('messageStream');
  const shouldScroll = isScrolledToBottom(container);

  const s = state.subjects.find(sub => sub.id === msg.subjectId);
  const isObserver = msg.isObserver;
  const color = isObserver ? 'var(--info)' : (s ? s.color : 'var(--text-dim)');
  const isSelected = s && s.id === state.selectedSubject;

  const div = document.createElement('div');
  div.className = `message${isObserver ? ' message-observer' : ''}${isSelected ? ' message-selected' : ''}`;
  div.style.borderLeftColor = color;
  if (!isObserver) div.onclick = () => selectSubject(msg.subjectId);

  const headerLabel = isObserver ? '// OBSERVER' : `${msg.subjectId} // ${s ? s.name : '???'}`;
  div.innerHTML = `
    <div class="message-header">
      <span class="message-id" style="color: ${color}">${headerLabel}</span>
      <span class="message-timestamp">${msg.timestamp}</span>
    </div>
    <div class="message-body" id="typingBody_${msg.id}"></div>
    ${msg.flagged ? `<div class="message-flag">${i18n[state.lang].flagged}</div>` : ''}
  `;
  container.appendChild(div);
  if (shouldScroll) container.scrollTop = container.scrollHeight;

  // Animate typing
  const rawText = msg.texts ? (msg.texts[state.lang] || msg.texts.en) : (msg.text || '');
  const bodyEl = div.querySelector(`#typingBody_${msg.id}`);
  let i = 0;
  const speed = Math.max(18, Math.min(40, Math.floor(1800 / rawText.length)));
  const ticker = setInterval(() => {
    i++;
    // Build highlighted partial text
    const partial = rawText.slice(0, i);
    bodyEl.innerHTML = applyKeywordHighlights(partial);
    if (shouldScroll || isScrolledToBottom(container)) container.scrollTop = container.scrollHeight;
    if (i >= rawText.length) {
      clearInterval(ticker);
      // Update msg.id element via full renderMessages to sync clues/flags after complete
    }
  }, speed);
}

function applyKeywordHighlights(text) {
  const keywords = state.currentCase && state.currentCase.keywords
    ? (state.currentCase.keywords[state.lang] || state.currentCase.keywords.en || [])
    : [];
  let out = text;
  keywords.forEach(kw => {
    if (!kw) return;
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    out = out.replace(regex, '<mark class="kw-highlight">$1</mark>');
  });
  return out;
}

function renderMessages() {
  const container = document.getElementById('messageStream');
  const shouldScroll = isScrolledToBottom(container);

  container.innerHTML = state.messages.map(msg => {
    const s = state.subjects.find(sub => sub.id === msg.subjectId);
    const rawText = msg.texts ? (msg.texts[state.lang] || msg.texts.en) : (msg.text || '');
    const text = applyKeywordHighlights(rawText);
    const isObserver = msg.isObserver;
    const isGhost = msg.isGhost;
    const color = isObserver ? 'var(--info)' : (s ? s.color : 'var(--text-dim)');
    const isSelected = s && s.id === state.selectedSubject;
    const isClue = msg.isClue;

    return `
      <div class="message ${isObserver ? 'message-observer' : ''} ${isSelected ? 'message-selected' : ''} ${isClue ? 'message-clue' : ''} ${isGhost ? 'message-ghost' : ''}" 
           style="border-left-color: ${color}" 
           ${!isObserver && !isGhost ? `onclick="selectSubject('${msg.subjectId}')"` : ''}>
        <div class="message-header">
          <span class="message-id" style="color: ${color}">${isObserver ? '// OBSERVER' : (isGhost ? '// SIGNAL LOST' : `${msg.subjectId} // ${s ? s.name : '???'}`)}</span>
          <span class="message-timestamp">${msg.timestamp}</span>
        </div>
        <div class="message-body">${text}</div>
        ${msg.flagged && !isGhost ? `<div class="message-flag">${i18n[state.lang].flagged}</div>` : ''}
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

function renderSurveillance() {
  const container = document.getElementById('surveillanceLog');
  if (!state.surveillanceLog.length) {
    container.innerHTML = '<div style="color:var(--text-dim);font-size:0.7rem">No activity recorded</div>';
    return;
  }
  container.innerHTML = state.surveillanceLog.slice(-15).map(entry => {
    const subject = state.subjects.find(s => s.id === entry.subjectId);
    const subjectName = subject ? subject.name : entry.subjectId;
    return `<div class="surveillance-entry"><span class="surv-subject">${subjectName}:</span> <span class="surv-action">${entry.action}</span></div>`;
  }).join('');
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
  const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setText('dayCounter', String(state.caseCount).padStart(3, '0'));
  
  // Reputation tiers
  let repKey = 'rep_neutral';
  if (state.reputation > 20) repKey = 'rep_respected';
  else if (state.reputation < -20) repKey = 'rep_suspicious';
  setText('reputation', t[repKey]);
  
  // Add trust level indicator to reputation display
  const repEl = document.getElementById('reputation');
  if (repEl) {
    repEl.title = `Trust Level: ${state.trustLevel}%`;
    if (state.trustLevel > 70) {
      repEl.style.color = 'var(--accent)';
    } else if (state.trustLevel < 30) {
      repEl.style.color = 'var(--danger)';
    } else {
      repEl.style.color = '';
    }
  }
}

function render() {
  const t = i18n[state.lang];
  const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setText('btn-expose', t.btnExpose);
  setText('btn-focus', t.btnFocus);
  setText('btn-clear', t.btnClear);
  setText('btn-accuse', t.btnAccuse);
  setText('footer-version', t.footer);
  setText('label-reputation', t.reputationLabel);
  setText('label-crime', t.crime_label);
  setText('action-hint', t.action_hint);
  setText('title-ranking', t.ranking_title);
  setText('title-analysis', t.analysis);
  setText('title-signals', t.signals);
  setText('title-actions', t.actions);
  setText('terminal-title', t.terminal);
  setText('label-online', t.online);
  setText('label-day', t.day);
  setText('label-consciousness', t.consciousness || 'AWARENESS');
  setText('title-interpretations', t.interp_title || 'Interpretations');
  setText('interp-hint', t.interp_hint || 'What do you see in this person?');

  // Update consciousness meter
  const consciousnessBar = document.getElementById('consciousnessLevel');
  if (consciousnessBar) {
    consciousnessBar.style.width = `${state.consciousnessLevel}%`;
    // Change color based on level
    if (state.consciousnessLevel < 30) {
      consciousnessBar.style.backgroundColor = 'var(--accent)';
    } else if (state.consciousnessLevel < 70) {
      consciousnessBar.style.backgroundColor = 'var(--warning)';
    } else {
      consciousnessBar.style.backgroundColor = 'var(--danger)';
    }
  }

  // Update crime description and keywords
  if (state.currentCase) {
    setText('crimeDescription', state.currentCase.crime[state.lang]);
    const kwBar = document.getElementById('keywordBar');
    const kws = state.currentCase.keywords
      ? (state.currentCase.keywords[state.lang] || state.currentCase.keywords.en || [])
      : [];
    if (kwBar && kws.length) {
      kwBar.innerHTML = kws.map(k => `<span class="kw-tag">${k}</span>`).join('');
    }
  }

  renderMessages();
  renderSubjects();
  renderSignals();
  renderSurveillance();
  renderRanking();
  updateStats();
}
