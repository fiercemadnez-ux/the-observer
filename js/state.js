const messageTemplates = {
  status_seeker: {
    en: [
      "I've been doing this longer than most.",
      "My track record speaks for itself.",
      "I was handling situations like this before half of you were even connected.",
      "With all due respect, I have clearance levels you haven't seen yet.",
      "I've closed eleven cases. How many have you closed?",
      "Not to brag, but my methodology is what they teach now.",
      "I know exactly what this is. I've seen it before.",
      "Trust me on this one. I've earned that much."
    ],
    pt: [
      "Faço isso há mais tempo que a maioria.",
      "Meu histórico fala por si só.",
      "Estava lidando com situações assim antes de metade de vocês estarem conectados.",
      "Com todo o respeito, eu tenho autorizações que vocês ainda não viram.",
      "Fechei onze casos. Quantos vocês fecharam?",
      "Sem querer me vangloriar, mas minha metodologia é o que ensinam agora.",
      "Eu sei exatamente o que é isso. Já vi antes.",
      "Confiem em mim nisso. Já mereci pelo menos isso."
    ]
  },
  quiet_one: {
    en: [
      "...",
      "Interesting.",
      "Tell me more.",
      "I noticed.",
      "You sure about that?",
      "Hm.",
      "Keep talking.",
      "That's one way to see it.",
      "I've been watching.",
      "Not yet."
    ],
    pt: [
      "...",
      "Interessante.",
      "Me conte mais.",
      "Eu notei.",
      "Tem certeza disso?",
      "Hm.",
      "Continue falando.",
      "É uma forma de ver.",
      "Estou observando.",
      "Ainda não."
    ]
  },
  talker: {
    en: [
      "So anyway, what I was saying is...",
      "This reminds me of when I was on the eastern corridor job, right, and there was this guy who—",
      "Wait, where was I? Oh yeah, so the thing is, the thing about all this is—",
      "You know what's funny? And I mean this sincerely, it's actually kind of funny when you think about it—",
      "I told them. I literally said those exact words. Nobody listens and then suddenly it's a problem.",
      "Not to go off topic but has anyone else noticed how the ventilation in sector 7 smells weird lately?",
      "So I was thinking, and bear with me here, what if the whole thing is actually about something else entirely?",
      "My cousin worked a case like this once. Well, not exactly like this. Actually nothing like this, but still."
    ],
    pt: [
      "Mas enfim, o que eu estava dizendo...",
      "Isso me lembra de quando eu trabalhei no corredor leste, sabe, tinha esse cara que—",
      "Espera, onde eu estava? Ah sim, então a questão é, a questão sobre tudo isso é—",
      "Sabe o que é engraçado? E falo isso com sinceridade, é meio engraçado quando você pensa bem—",
      "Eu avisei. Falei exatamente essas palavras. Ninguém escuta e aí de repente vira problema.",
      "Sem querer sair do assunto mas alguém mais notou que a ventilação do setor 7 tá cheirando estranho?",
      "Então eu tava pensando, vai por mim, e se tudo isso na verdade for sobre outra coisa completamente?",
      "Meu primo trabalhou num caso assim uma vez. Bem, não exatamente assim. Na verdade nada parecido, mas mesmo assim."
    ]
  },
  drama_creator: {
    en: [
      "Sure, I'm SURE that's what happened.",
      "How convenient.",
      "Nobody finds it suspicious that this happened right now? Really?",
      "Oh I'm sure it's just a coincidence. Everything always is, right?",
      "The pattern is obvious if you're willing to look.",
      "Someone in this room knows more than they're saying.",
      "This is exactly what they want us to think.",
      "I've seen this playbook before. Don't fall for it."
    ],
    pt: [
      "Claro, tenho CERTEZA que foi isso.",
      "Que conveniente.",
      "Ninguém acha suspeito que isso aconteceu exatamente agora? Sério?",
      "Ah, tenho certeza que é só coincidência. Sempre é, né?",
      "O padrão é óbvio pra quem quiser olhar.",
      "Alguém nessa sala sabe mais do que está dizendo.",
      "É exatamente isso que eles querem que a gente pense.",
      "Já vi esse roteiro antes. Não caiam nisso."
    ]
  },
  hidden_agenda: {
    en: [
      "Let's focus on the main topic.",
      "We should discuss this in private.",
      "I'd rather not get into specifics here.",
      "That's... not really relevant to what we're doing.",
      "I'll explain later. Not here.",
      "Some things are better left unsaid in an open channel.",
      "My involvement was minimal. Let's leave it at that.",
      "I don't see how that's connected. Can we move on?"
    ],
    pt: [
      "Vamos focar no tópico principal.",
      "Deveríamos discutir isso em privado.",
      "Prefiro não entrar em detalhes aqui.",
      "Isso... não é bem relevante pro que estamos fazendo.",
      "Eu explico depois. Não aqui.",
      "Algumas coisas são melhor deixadas sem dizer num canal aberto.",
      "Meu envolvimento foi mínimo. Deixa assim.",
      "Não vejo como isso está conectado. Podemos continuar?"
    ]
  }
};

const state = {
  lang: 'en',
  day: 1,
  reputation: 0,
  subjects: [],
  messages: [],
  signals: [],
  selectedSubject: null,
  caseActive: false,
  caseResolved: false,
  currentCase: null,   // { crime, guiltyId, guiltyName }
  accusationCount: 0,
  ranking: []          // [{ day, win, accusationCount, guiltyName, caseCrime }]
};
