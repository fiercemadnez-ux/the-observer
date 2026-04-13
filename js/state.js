const messageTemplates = {
  status_seeker: {
    en: ["I've been doing this longer than most.", "My track record speaks for itself."],
    pt: ["Faço isso há mais tempo que a maioria.", "Meu histórico fala por si só."]
  },
  quiet_one: {
    en: ["...", "Interesting.", "Tell me more."],
    pt: ["...", "Interessante.", "Me conte mais."]
  },
  talker: {
    en: ["So anyway, what I was saying is...", "This reminds me of when I..."],
    pt: ["Mas enfim, o que eu estava dizendo...", "Isso me lembra de quando eu..."]
  },
  drama_creator: {
    en: ["Sure, I'm SURE that's what happened.", "How convenient."],
    pt: ["Claro, tenho CERTEZA que foi isso.", "Que conveniente."]
  },
  hidden_agenda: {
    en: ["Let's focus on the main topic.", "We should discuss this in private."],
    pt: ["Vamos focar no tópico principal.", "Deveríamos discutir isso em privado."]
  }
};

const state = {
  lang: 'en',
  day: 1,
  reputation: 0,
  subjects: [],
  messages: [],
  signals: [],
  selectedSubject: null
};
