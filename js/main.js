function init() {
  for (let i = 0; i < 4; i++) {
    const s = generateSubject();
    state.subjects.push(s);
    state.messages.push(generateMessage(s));
  }
  render();
}

init();
