async function init() {
  // Restore saved language BEFORE anything renders
  try {
    const savedLang = localStorage.getItem('observer_lang');
    if (savedLang && i18n[savedLang]) {
      state.lang = savedLang;
    }
  } catch(e) {}

  // Set select to match state (after DOM ready)
  const select = document.getElementById('langSelect');
  if (select) select.value = state.lang;

  loadRanking();

  // Try to restore today's case before generating a new one
  if (loadDailyCase()) {
    // Restored — show the UI without generating anything new
    document.getElementById('caseInfo').style.display = 'block';
    const termTitle = document.getElementById('terminal-title');
    if (termTitle && state.currentCase && state.currentCase.setting) {
      termTitle.textContent = `\u25b8 ${state.currentCase.setting[state.lang].toUpperCase()} // CHANNEL_${String(state.caseCount).padStart(2,'0')}`;
    }
    render();
    if (!state.caseResolved) {
      startChatLoop();
    }
    return;
  }

  const remaining = 0; // Cooldown disabled
  if (false) // Cooldown disabled {
    showCooldownScreen(remaining);
  } else {
    await fetchDailySeed();
    await startNewCase();
  }
}

// Wait for DOM before init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
