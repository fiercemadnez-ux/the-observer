// THE OBSERVER - Game Logic

// Game State
const state = {
  day: 1,
  reputation: 0,
  subjects: [],
  messages: [],
  signals: [],
  selectedSubject: null,
  currentCase: null,
  caseSolved: false
};

// Case definitions
const cases = [
  {
    id: 'CASE-001',
    title: 'THE SECURITY LEAK',
    description: 'Someone in the group is feeding information to the wrong side.',
    objective: 'Identify the informant',
    targetType: 'hidden_agenda',
    hint: 'They dodge questions and want to discuss things privately.'
  },
  {
    id: 'CASE-002',
    title: 'THE POWER GRAB',
    description: 'Someone is trying to take control of the operation.',
    objective: 'Identify the power seeker',
    targetType: 'status_seeker',
    hint: 'They boast about their experience and want recognition.'
  },
  {
    id: 'CASE-003',
    title: 'THE AGENT PROVOCATEUR',
    description: 'Someone is stirring up conflict to destabilize the group.',
    objective: 'Identify the troublemaker',
    targetType: 'drama_creator',
    hint: 'They create drama and question others\' motives.'
  },
  {
    id: 'CASE-004',
    title: 'THE DOUBLE AGENT',
    description: 'Someone is playing both sides.',
    objective: 'Identify the manipulator',
    targetType: 'manipulator',
    hint: 'They flatter others and try to get private information.'
  },
  {
    id: 'CASE-005',
    title: 'THE TRUE BELIEVER',
    description: 'Someone is dangerously committed to the cause.',
    objective: 'Identify the radical',
    targetType: 'true_believer',
    hint: 'They use absolute language and want unity at all costs.'
  }
];

// Name banks
const firstNames = [
  'Alex', 'Morgan', 'Casey', 'Jordan', 'Riley', 'Taylor',
  'Quinn', 'Skyler', 'Reese', 'Dakota', 'Avery', 'Phoenix',
  'Blake', 'Cameron', 'Drew', 'Ellis', 'Finley', 'Harper'
];

const lastNames = [
  'Chen', 'Kim', 'Patel', 'Nguyen', 'Morales', 'Singh',
  'Williams', 'Garcia', 'Martinez', 'Johnson', 'Lee', 'Brown',
  'Wilson', 'Davis', 'Miller', 'Taylor', 'Anderson', 'Thomas'
];

// Archetypes
const archetypes = [
  { type: 'status_seeker', description: 'Wants recognition', signals: ['MENTION', 'BOAST', 'COMPARE'] },
  { type: 'quiet_one', description: 'Speaks little, watches much', signals: ['SILENCE', 'OBSERVE', 'WAIT'] },
  { type: 'talker', description: 'Fills silence with words', signals: ['TALK', 'DIVERT', 'AVOID'] },
  { type: 'drama_creator', description: 'Creates conflict for fun', signals: ['PROVOKE', 'EXAGGERATE', 'TEASE'] },
  { type: 'hidden_agenda', description: 'Working an angle', signals: ['CLOSE_TOPIC', 'DODGE', 'SHIFT'] },
  { type: 'true_believer', description: 'Fully committed to cause', signals: ['ABSOLUTE', 'REPEAT', 'ATTACK'] },
  { type: 'survivor', description: 'Just wants to get by', signals: ['AGREE', 'FADE', 'PRAGMATIC'] },
  { type: 'manipulator', description: 'Playing everyone', signals: ['FLATTER', 'DIVERT', 'USE'] }
];

// Message templates by archetype
const messageTemplates = {
  status_seeker: [
    "I've been doing this longer than most of you.",
    "People usually come to ME for advice.",
    "My track record speaks for itself.",
    "Let me explain how things actually work here..."
  ],
  quiet_one: ["...", "I see.", "Interesting.", "Tell me more."],
  talker: [
    "So anyway, what I was saying is...",
    "This reminds me of when I...",
    "The craziest thing happened to me last week...",
    "But seriously, have you guys tried..."
  ],
  drama_creator: [
    "Oh, that's interesting. Tell that to the people from yesterday.",
    "Sure, I'm SURE that's what happened.",
    "Some people have all the luck, huh?",
    "How convenient that you're saying that now."
  ],
  hidden_agenda: [
    "Anyway, let's focus on the main topic.",
    "I think we're getting distracted here.",
    "What does this have to do with our objectives?",
    "We should discuss this in private later."
  ],
  true_believer: [
    "This is the only way forward.",
    "Those who don't understand are part of the problem.",
    "We need to be united in this.",
    "The truth is clear to anyone willing to see."
  ],
  survivor: [
    "Whatever works, I guess.",
    "I'm just trying to get through the day.",
    "As long as no one gets hurt, right?",
    "Let's all just get along here."
  ],
  manipulator: [
    "That's a really interesting perspective. Who taught you that?",
    "I think you might be right about some things.",
    "Between you and me, I think we should...",
    "You're much smarter than the others here."
  ]
};

// Conversation responses
const conversationResponses = {
  status_seeker: {
    status_seeker: "I respect your experience, but I've been here longer.",
    quiet_one: "Why so quiet? Afraid to share your thoughts?",
    talker: "Can you get to the point?",
    drama_creator: "I know what you're doing.",
    hidden_agenda: "Let's cut the nonsense.",
    true_believer: "I appreciate conviction, but leadership matters.",
    survivor: "Just following orders won't get you anywhere.",
    manipulator: "Flattery won't work on me."
  },
  quiet_one: {
    status_seeker: "...",
    quiet_one: "*nods*",
    talker: "Keep talking. I'm listening.",
    drama_creator: "Is there a point to this?",
    hidden_agenda: "*eyes narrow*",
    true_believer: "I understand your conviction.",
    survivor: "We all have our reasons.",
    manipulator: "*remains silent*"
  },
  talker: {
    status_seeker: "Actually, I was saying...",
    quiet_one: "Come on, say something!",
    talker: "That reminds me of... wait, what were we talking about?",
    drama_creator: "Okay okay, let's calm down...",
    hidden_agenda: "We're getting off track.",
    true_believer: "I mean, I get where you're coming from...",
    survivor: "Yeah, let's just all get along, okay?",
    manipulator: "You're so smart."
  },
  drama_creator: {
    status_seeker: "Oh wow, look at Mr. Important over here.",
    quiet_one: "Cat got your tongue?",
    talker: "Boring story.",
    drama_creator: "Oh we're both here for the drama?",
    hidden_agenda: "What are you hiding?",
    true_believer: "How noble.",
    survivor: "Boring. Just go along with it.",
    manipulator: "Oh, playing the nice card now?"
  },
  hidden_agenda: {
    status_seeker: "Let's stay focused on the actual work.",
    quiet_one: "You observe a lot. Too much, maybe.",
    talker: "We're getting off track.",
    drama_creator: "Not interested in your games.",
    hidden_agenda: "We understand each other.",
    true_believer: "I appreciate your clarity, but there's more at play here.",
    survivor: "Smart. The less you know, the safer you are.",
    manipulator: "I know your type."
  },
  true_believer: {
    status_seeker: "Leadership is earned, not claimed.",
    quiet_one: "Wise words are better than many words.",
    talker: "Words are cheap. Actions matter.",
    drama_creator: "You're spreading division.",
    hidden_agenda: "I see your hesitation. That's concerning.",
    true_believer: "We are united in purpose.",
    survivor: "Survival alone isn't enough.",
    manipulator: "Your words are hollow."
  },
  survivor: {
    status_seeker: "Sure, whatever you say, boss.",
    quiet_one: "You seem like you know how to stay under the radar.",
    talker: "Getting tired of talking.",
    drama_creator: "Can we please not make things complicated?",
    hidden_agenda: "I don't want to know what you're planning.",
    true_believer: "I respect the conviction.",
    survivor: "Same situation, different day.",
    manipulator: "I'll play along."
  },
  manipulator: {
    status_seeker: "You're so experienced. I'm sure you have much to teach me.",
    quiet_one: "You're the observant type, aren't you?",
    talker: "You have such interesting stories!",
    drama_creator: "I love the energy here!",
    hidden_agenda: "We should talk privately.",
    true_believer: "Your conviction is inspiring.",
    survivor: "You're practical. I appreciate that.",
    manipulator: "*slight smile* We understand each other."
  }
};

// Conversation topics
const conversationTopics = [
  "the new security measures",
  "who to trust",
  "the meeting last night",
  "a suspicious delivery",
  "the missing files",
  "the new arrivals",
  "the boss's orders",
  "a leak in the system",
  "tonight's operation",
  "the surveillance"
];

let currentTopic = conversationTopics[0];
let lastConversationTime = 0;

// Generate a random subject
function generateSubject() {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const archetype = archetypes[Math.floor(Math.random() * archetypes.length)];
  const trust = Math.floor(Math.random() * 100);
  let status = 'unknown';
  if (trust > 70) status = 'ally';
  else if (trust < 30) status = 'threat';
  else if (trust > 40 && trust < 60) status = 'suspect';

  return {
    id: `SUB-${String(state.subjects.length + 1).padStart(3, '0')}`,
    name: `${firstName} ${lastName}`,
    archetype: archetype.type,
    trust: trust,
    status: status,
    description: archetype.description,
    messages: []
  };
}

// Generate initial message for a subject
function generateMessage(subject) {
  const templates = messageTemplates[subject.archetype] || messageTemplates.talker;
  const text = templates[Math.floor(Math.random() * templates.length)];

  return {
    id: `MSG-${String(state.messages.length + 1).padStart(4, '0')}`,
    subjectId: subject.id,
    text: text,
    timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    flagged: Math.random() > 0.8
  };
}

// Initialize the game
function init() {
  const saved = localStorage.getItem('theObserver_save');
  if (saved) {
    try {
      const loaded = JSON.parse(saved);
      Object.assign(state, loaded);
    } catch (e) {
      console.error('Failed to load save:', e);
    }
  } else {
    for (let i = 0; i < 4; i++) {
      const subject = generateSubject();
      state.subjects.push(subject);
      const msgCount = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < msgCount; j++) {
        const msg = generateMessage(subject);
        state.messages.push(msg);
      }
    }
    loadCase();
  }

  loadLanguage();
  render();

  setInterval(triggerConversation, 8000);
}

// Trigger a conversation between two subjects
function triggerConversation() {
  if (state.subjects.length < 2) return;

  const now = Date.now();
  if (now - lastConversationTime < 5000) return;
  lastConversationTime = now;

  if (Math.random() < 0.2) {
    currentTopic = conversationTopics[Math.floor(Math.random() * conversationTopics.length)];
  }

  const idx1 = Math.floor(Math.random() * state.subjects.length);
  let idx2 = Math.floor(Math.random() * state.subjects.length);
  while (idx2 === idx1) {
    idx2 = Math.floor(Math.random() * state.subjects.length);
  }

  const subject1 = state.subjects[idx1];
  const subject2 = state.subjects[idx2];

  const responses = conversationResponses[subject1.archetype];
  if (!responses) return;

  let response = responses[subject2.archetype] || "I see.";

  const msg = {
    id: `MSG-${String(state.messages.length + 1).padStart(4, '0')}`,
    subjectId: subject1.id,
    text: `[TO ${subject2.id}] ${response}`,
    timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    flagged: false,
    conversation: true
  };

  state.messages.push(msg);
  addSignal(`Conversation: ${subject1.id} → ${subject2.id}`);

  render();
}

// Render the UI
function render() {
  renderMessages();
  renderSubjects();
  renderSignals();
  updateStats();
  updateAllTranslations();
  save();
}

function renderMessages() {
  const container = document.getElementById('messageStream');
  if (!container) return;

  const wasAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;

  container.innerHTML = state.messages.slice(-30).map(msg => {
    const subject = state.subjects.find(s => s.id === msg.subjectId);
    return `
      <div class="message ${msg.conversation ? 'conversation' : ''}" onclick="selectSubject('${msg.subjectId}')">
        <div class="message-header">
          <span class="message-id">${msg.subjectId} // ${subject ? subject.name : 'UNKNOWN'}</span>
          <span class="message-timestamp">${msg.timestamp}</span>
        </div>
        <div class="message-body">${msg.text}</div>
        ${msg.flagged ? '<div class="message-flag">FLAGGED</div>' : ''}
      </div>
    `;
  }).join('');

  if (wasAtBottom) {
    container.scrollTop = container.scrollHeight;
  }
}

function renderSubjects() {
  const container = document.getElementById('subjectBoard');
  if (!container) return;

  container.innerHTML = state.subjects.map(subject => `
    <div class="subject" onclick="selectSubject('${subject.id}')">
      <span class="subject-name">${subject.id}</span>
      <span class="subject-status status-${subject.status}">${t('subjects.' + subject.status)}</span>
    </div>
  `).join('');
}

function renderSignals() {
  const container = document.getElementById('signalLog');
  if (!container) return;

  container.innerHTML = state.signals.slice(-10).map((signal, i) => `
    <div class="signal ${i === state.signals.length - 1 ? 'new' : ''}">[${signal.time}] ${signal.text}</div>
  `).join('');
}

function updateStats() {
  const dayCounter = document.getElementById('dayCounter');
  const reputation = document.getElementById('reputation');

  if (dayCounter) dayCounter.textContent = String(state.day).padStart(3, '0');
  if (reputation) {
    let repText = t('reputation.neutral');
    if (state.reputation > 20) repText = t('reputation.respected');
    else if (state.reputation > 0) repText = t('reputation.known');
    else if (state.reputation > -20) repText = t('reputation.neutral');
    else if (state.reputation > -40) repText = t('reputation.suspicious');
    else repText = t('reputation.compromised');
    reputation.textContent = repText;
  }
}

function selectSubject(subjectId) {
  state.selectedSubject = subjectId;
  const subject = state.subjects.find(s => s.id === subjectId);
  addSignal(t('signals.selected', { id: subjectId, status: subject?.status }));
}

function addSignal(text) {
  state.signals.push({
    text: text,
    time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  });
  if (state.signals.length > 50) state.signals.shift();
}

function save() {
  localStorage.setItem('theObserver_save', JSON.stringify(state));
}

function showTutorial() {
  const body = document.getElementById('tutorialBody');
  if (!body) return;

  body.innerHTML = `
    <h3>▸ ${t('tutorial.mission')}</h3>
    <p>${t('tutorial.missionText')}</p>

    <h3>▸ ${t('tutorial.howToPlay')}</h3>
    <ol>
      <li>${t('tutorial.observe')}</li>
      <li>${t('tutorial.analyze')}</li>
      <li>${t('tutorial.collect')}</li>
      <li>${t('tutorial.act')}</li>
    </ol>

    <h3>▸ ${t('tutorial.actionButtons')}</h3>
    <ul>
      <li><strong>${t('actions.expose')}</strong> — ${t('tutorial.expose')}</li>
      <li><strong>${t('actions.pressure')}</strong> — ${t('tutorial.pressure')}</li>
      <li><strong>${t('actions.plantDoubt')}</strong> — ${t('tutorial.plantDoubt')}</li>
      <li><strong>${t('actions.isolate')}</strong> — ${t('tutorial.isolate')}</li>
      <li><strong>${t('actions.observe')}</strong> — ${t('tutorial.observe')}</li>
    </ul>

    <h3>▸ ${t('tutorial.subjectTypes')}</h3>
    <ul>
      <li><strong>${t('tutorial.statusSeeker')}</strong></li>
      <li><strong>${t('tutorial.quietOne')}</strong></li>
      <li><strong>${t('tutorial.talker')}</strong></li>
      <li><strong>${t('tutorial.dramaCreator')}</strong></li>
      <li><strong>${t('tutorial.hiddenAgenda')}</strong></li>
      <li><strong>${t('tutorial.trueBeliever')}</strong></li>
      <li><strong>${t('tutorial.survivor')}</strong></li>
      <li><strong>${t('tutorial.manipulator')}</strong></li>
    </ul>

    <h3>▸ ${t('tutorial.goal')}</h3>
    <p>${t('tutorial.goalText')}</p>
    <p><em>${t('tutorial.pattern')}</em></p>
  `;

  document.getElementById('tutorialModal').style.display = 'flex';
}

function hideTutorial() {
  document.getElementById('tutorialModal').style.display = 'none';
}

// Case management
function loadCase() {
  const caseIndex = Math.floor(Math.random() * cases.length);
  state.currentCase = cases[caseIndex];
  state.caseSolved = false;

  document.getElementById('caseId').textContent = state.currentCase.id;
  document.getElementById('caseTitle').textContent = state.currentCase.title;
  document.getElementById('caseDescription').textContent = state.currentCase.description;
  document.getElementById('caseObjective').textContent = 'OBJECTIVE: ' + state.currentCase.objective;

  addSignal(`New case loaded: ${state.currentCase.id}`);
  addSignal(`Hint: ${state.currentCase.hint}`);
}

function showSolveModal() {
  const container = document.getElementById('subjectSelect');
  if (!container) return;

  container.innerHTML = state.subjects.map(s => `
    <button class="subject-select-btn" onclick="selectForSolve('${s.id}', this)">
      ${s.id} // ${s.name} - ${s.description}
    </button>
  `).join('');
  state.selectedForSolve = null;
  document.getElementById('solveModal').style.display = 'flex';
}

function hideSolveModal() {
  document.getElementById('solveModal').style.display = 'none';
}

function selectForSolve(subjectId, btn) {
  state.selectedForSolve = subjectId;
  document.querySelectorAll('.subject-select-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
}

function submitSolution() {
  if (!state.selectedForSolve) {
    addSignal(t('signals.noSubject'));
    return;
  }

  const subject = state.subjects.find(s => s.id === state.selectedForSolve);
  const isCorrect = subject.archetype === state.currentCase.targetType;

  if (isCorrect) {
    state.reputation += 50;
    state.caseSolved = true;
    document.getElementById('solveModalBody').innerHTML = `
      <div class="success-message">
        <h2>▸ ${t('solve.solved')}</h2>
        <p>${t('solve.solvedText', { name: subject.name, objective: state.currentCase.objective.toLowerCase() })}</p>
        <p>${t('solve.reputationGain')}</p>
        <button class="solve-btn" onclick="nextCase()">${t('solve.nextCase')}</button>
      </div>
    `;
    addSignal(`CASE SOLVED: ${state.currentCase.id}`);
  } else {
    state.reputation -= 20;
    document.getElementById('solveModalBody').innerHTML = `
      <div class="success-message">
        <h2 style="color:var(--danger)">▸ ${t('solve.wrong')}</h2>
        <p>${t('solve.wrongText', { name: subject.name })}</p>
        <p>${t('solve.reputationLoss')}</p>
        <p style="margin-top:20px">Hint: ${state.currentCase.hint}</p>
        <button class="solve-btn" style="width:100%;margin-top:20px;" onclick="hideSolveModal();showSolveModal();">${t('solve.tryAgain')}</button>
      </div>
    `;
    addSignal(`Wrong solution for ${state.currentCase.id}`);
  }

  render();
}

function nextCase() {
  state.day++;
  loadCase();
  hideSolveModal();
  render();
}

// Actions
function exposeSubject() {
  if (!state.selectedSubject) {
    addSignal(t('signals.noSubject'));
    return;
  }
  const subject = state.subjects.find(s => s.id === state.selectedSubject);
  subject.status = 'suspect';
  subject.trust -= 30;
  addSignal(t('signals.exposed', { id: subject.id, name: subject.name }));
  addSignal(t('signals.exposedDetail', { archetype: subject.archetype, description: subject.description }));
  save();
  render();
}

function pressureSubject() {
  if (!state.selectedSubject) {
    addSignal(t('signals.noSubject'));
    return;
  }
  const subject = state.subjects.find(s => s.id === state.selectedSubject);
  subject.trust -= 15;
  addSignal(t('signals.pressure', { id: subject.id }));
  save();
  render();
}

function plantDoubt() {
  if (!state.selectedSubject) {
    addSignal(t('signals.noSubject'));
    return;
  }
  const subject = state.subjects.find(s => s.id === state.selectedSubject);
  subject.trust -= 10;
  addSignal(t('signals.doubt', { id: subject.id }));
  save();
  render();
}

function isolateSubject() {
  if (!state.selectedSubject) {
    addSignal(t('signals.noSubject'));
    return;
  }
  const subject = state.subjects.find(s => s.id === state.selectedSubject);
  subject.trust -= 20;
  addSignal(t('signals.isolated', { id: subject.id }));
  save();
  render();
}

function observeMore() {
  const newSubject = generateSubject();
  state.subjects.push(newSubject);
  const msg = generateMessage(newSubject);
  state.messages.push(msg);
  addSignal(t('signals.observed'));
  save();
  render();
}

// Close modal on outside click
document.addEventListener('click', function(e) {
  const modal = document.getElementById('tutorialModal');
  if (e.target === modal) {
    hideTutorial();
  }
});

// Start the game when DOM is ready
document.addEventListener('DOMContentLoaded', init);