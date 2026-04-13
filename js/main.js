async function init() {
  // Generate initial subjects and fetch AI messages in parallel
  const subjects = [];
  for (let i = 0; i < 4; i++) {
    const s = generateSubject();
    state.subjects.push(s);
    subjects.push(s);
  }
  renderSubjects();

  // Show typing indicators for all, then populate messages
  const typingIds = subjects.map(s => addTypingIndicator(s.id));

  const messages = await Promise.all(subjects.map(s => generateMessage(s)));

  typingIds.forEach(id => removeTypingIndicator(id));
  messages.forEach(m => state.messages.push(m));

  render();
}

init();
