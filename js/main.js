async function init() {
  // Restore saved language
  const savedLang = localStorage.getItem('observer_lang');
  if (savedLang && i18n[savedLang]) {
    state.lang = savedLang;
    const select = document.getElementById('langSelect');
    if (select) select.value = savedLang;
  }

  loadRanking();
  await startNewCase();
}

init();
