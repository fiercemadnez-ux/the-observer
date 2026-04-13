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

  const remaining = getCooldownRemaining();
  if (remaining > 0) {
    showCooldownScreen(remaining);
  } else {
    await startNewCase();
  }
}

// Wait for DOM before init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
