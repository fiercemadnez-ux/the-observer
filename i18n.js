// Internationalization (i18n) module
const translations = {
  en: {
    status: {
      online: "ONLINE",
      day: "DAY"
    },
    case: {
      defaultTitle: "THE SECURITY LEAK",
      defaultDesc: "Someone in the group is feeding information to the wrong side.",
      objective: "OBJECTIVE: Identify the informant"
    },
    actions: {
      submitAnswer: "▸ SUBMIT ANSWER",
      expose: "▸ EXPOSE selected",
      pressure: "▸ PRESSURE subject",
      plantDoubt: "▸ PLANT doubt",
      isolate: "▸ ISOLATE target",
      observe: "▸ OBSERVE mode"
    },
    terminal: {
      header: "▸ INCOMING TRANSMISSIONS // TERMINAL_07"
    },
    panel: {
      subjects: "Subject Analysis",
      signals: "Signal Log",
      actions: "Actions"
    },
    footer: {
      system: "SYSTEM v0.1.0 // OBSERVATION PROTOCOL ACTIVE",
      reputation: "REPUTATION:",
      help: "[? HELP]"
    },
    tutorial: {
      title: "// OPERATIVE HANDBOOK",
      mission: "YOUR MISSION",
      missionText: "You are an observer at a clandestine terminal. Watch figures enter the system, analyze their speech patterns, and decide when to intervene.",
      howToPlay: "HOW TO PLAY",
      observe: "Observe — Watch messages appear in the terminal. Each figure has a unique speaking pattern.",
      analyze: "Analyze — Click on subjects in the panel to see their status (ALLY, SUSPECT, THREAT, UNKNOWN).",
      collect: "Collect Signals — Look for patterns: who speaks too much, who stays quiet, who seeks status, who lies.",
      act: "Act — Use actions to expose, pressure, plant doubt, or isolate subjects.",
      actionButtons: "ACTION BUTTONS",
      expose: "EXPOSE — Reveal what you know about a subject. Lowers their trust significantly.",
      pressure: "PRESSURE — Push for more information. Makes them defensive.",
      plantDoubt: "PLANT DOUBT — Make them question themselves. Subtle manipulation.",
      isolate: "ISOLATE — Reduce contact with other subjects. Cuts their influence.",
      observe: "OBSERVE — Wait and watch. Adds new subjects to monitor.",
      subjectTypes: "SUBJECT TYPES",
      statusSeeker: "Status Seeker — Wants recognition, talks about achievements",
      quietOne: "Quiet One — Speaks little, observes much",
      talker: "Talker — Fills silence, diverts topics",
      dramaCreator: "Drama Creator — Creates conflict, provokes",
      hiddenAgenda: "Hidden Agenda — Has an angle, dodges questions",
      trueBeliever: "True Believer — Fully committed, absolute language",
      survivor: "Survivor — Just wants to get by, pragmatic",
      manipulator: "Manipulator — Playing everyone, flatters and uses",
      goal: "GOAL",
      goalText: "Build your reputation by correctly identifying who is who. The game doesn't tell you the truth — you have to deduce it.",
      pattern: "You are the only one seeing the pattern behind the smoke."
    },
    solve: {
      title: "// SUBMIT SOLUTION",
      select: "Select the subject you believe is responsible:",
      confirm: "▸ CONFIRM",
      solved: "CASE SOLVED",
      solvedText: "You correctly identified {name} as {objective}.",
      reputationGain: "REPUTATION +50",
      nextCase: "▸ NEXT CASE",
      wrong: "WRONG SUBJECT",
      wrongText: "{name} is not the target.",
      reputationLoss: "REPUTATION -20",
      tryAgain: "▸ TRY AGAIN"
    },
    signals: {
      selected: "Selected subject: {id} ({status})",
      noSubject: "No subject selected",
      exposed: "EXPOSED: {id} - {name}",
      exposedDetail: "Archetype: {archetype} - \"{description}\"",
      pressure: "PRESSURE: {id} - trust reduced",
      doubt: "DOUBT planted: {id}",
      isolated: "ISOLATED: {id} - influence reduced",
      observed: "New subject added to monitoring"
    },
    subjects: {
      ally: "ALLY",
      suspect: "SUSPECT",
      threat: "THREAT",
      unknown: "UNKNOWN"
    },
    reputation: {
      respected: "RESPECTED",
      known: "KNOWN",
      neutral: "NEUTRAL",
      suspicious: "SUSPICIOUS",
      compromised: "COMPROMISED"
    }
  },
  pt: {
    status: {
      online: "ONLINE",
      day: "DIA"
    },
    case: {
      defaultTitle: "O VAZAMENTO DE SEGURANÇA",
      defaultDesc: "Alguém no grupo está passando informações para o lado errado.",
      objective: "OBJETIVO: Identificar o informante"
    },
    actions: {
      submitAnswer: "▸ ENVIAR RESPOSTA",
      expose: "▸ EXPOR selecionado",
      pressure: "▸ PRESSÃO no sujeito",
      plantDoubt: "▸ PLANTAR dúvida",
      isolate: "▸ ISOLAR alvo",
      observe: "▸ MODO OBSERVAÇÃO"
    },
    terminal: {
      header: "▸ TRANSMISSÕES ENTRANDO // TERMINAL_07"
    },
    panel: {
      subjects: "Análise de Sujeitos",
      signals: "Registro de Sinais",
      actions: "Ações"
    },
    footer: {
      system: "SISTEMA v0.1.0 // PROTOCOLO DE OBSERVAÇÃO ATIVO",
      reputation: "REPUTAÇÃO:",
      help: "[? AJUDA]"
    },
    tutorial: {
      title: "// MANUAL DO OPERATIVO",
      mission: "SUA MISSÃO",
      missionText: "Você é um observador em um terminal clandestino. Assista as figuras entrarem no sistema, analise seus padrões de fala e decida quando intervir.",
      howToPlay: "COMO JOGAR",
      observe: "Observar — Assista as mensagens aparecerem no terminal. Cada figura tem um padrão único de fala.",
      analyze: "Analisar — Clique nos sujeitos no painel para ver seu status (ALIADO, SUSPEITO, AMEAÇA, DESCONHECIDO).",
      collect: "Coletar Sinais — Procure padrões: quem fala demais, quem fica quieto, quem busca status, quem mente.",
      act: "Agir — Use ações para expor, pressionar, plantar dúvida ou isolar sujeitos.",
      actionButtons: "BOTÕES DE AÇÃO",
      expose: "EXPOR — Revela o que você sabe sobre um sujeito. Diminui significativamente sua confiança.",
      pressure: "PRESSÃO — Pressiona por mais informação. Os deixa na defensiva.",
      plantDoubt: "PLANTAR DOÚVIDA — Faz eles se questionarem. Manipulação sutil.",
      isolate: "ISOLAR — Reduz contato com outros sujeitos. Diminui sua influência.",
      observe: "OBSERVAR — Espere e assista. Adiciona novos sujeitos para monitorar.",
      subjectTypes: "TIPOS DE SUJEITO",
      statusSeeker: "Buscador de Status — Quer reconhecimento, fala sobre conquistas",
      quietOne: "O Quieto — Fala pouco, observa muito",
      talker: "Tagarela — Enche o silêncio, muda de assunto",
      dramaCreator: "Criador de Drama — Cria conflitos, provoca",
      hiddenAgenda: "Agenda Oculta — Tem uma intenção, desvia perguntas",
      trueBeliever: "Verdadeiro Crença — Totalmente comprometido, linguagem absoluta",
      survivor: "Sobrevivente — Quer apenas passar, pragmático",
      manipulator: "Manipulador — Jogando com todos, bajula e usa",
      goal: "OBJETIVO",
      goalText: "Construa sua reputação corretamente identificando quem é quem. O jogo não te conta a verdade — você precisa deduzir.",
      pattern: "Você é o único que vê o padrão por trás da fumaça."
    },
    solve: {
      title: "// ENVIAR SOLUÇÃO",
      select: "Selecione o sujeito que você acredita ser o responsável:",
      confirm: "▸ CONFIRMAR",
      solved: "CASO RESOLTO",
      solvedText: "Você identificou corretamente {name} como {objective}.",
      reputationGain: "REPUTAÇÃO +50",
      nextCase: "▸ PRÓXIMO CASO",
      wrong: "SUJEITO ERRADO",
      wrongText: "{name} não é o alvo.",
      reputationLoss: "REPUTAÇÃO -20",
      tryAgain: "▸ TENTAR NOVAMENTE"
    },
    signals: {
      selected: "Sujeito selecionado: {id} ({status})",
      noSubject: "Nenhum sujeito selecionado",
      exposed: "EXPOSTO: {id} - {name}",
      exposedDetail: "Arquetipo: {archetype} - \"{description}\"",
      pressure: "PRESSÃO: {id} - confiança reduzida",
      doubt: "DÚVIDA plantada: {id}",
      isolated: "ISOLADO: {id} - influência reduzida",
      observed: "Novo sujeito adicionado ao monitoramento"
    },
    subjects: {
      ally: "ALIADO",
      suspect: "SUSPEITO",
      threat: "AMEAÇA",
      unknown: "DESCONHECIDO"
    },
    reputation: {
      respected: "RESPEITADO",
      known: "CONHECIDO",
      neutral: "NEUTRO",
      suspicious: "SUSPEITO",
      compromised: "COMPROMETIDO"
    }
  }
};

let currentLang = 'en';

// Get translation by path (e.g., 'tutorial.mission')
function t(key, params = {}) {
  const keys = key.split('.');
  let value = translations[currentLang];
  
  for (const k of keys) {
    if (value && value[k]) {
      value = value[k];
    } else {
      return key; // Return key if translation not found
    }
  }
  
  // Replace parameters {name} -> value
  if (typeof value === 'string') {
    for (const [param, val] of Object.entries(params)) {
      value = value.replace(`{${param}}`, val);
    }
  }
  
  return value;
}

// Change language
function changeLanguage(lang) {
  if (translations[lang]) {
    currentLang = lang;
    localStorage.setItem('theObserver_lang', lang);
    updateAllTranslations();
    render();
  }
}

// Load saved language
function loadLanguage() {
  const saved = localStorage.getItem('theObserver_lang');
  if (saved && translations[saved]) {
    currentLang = saved;
    document.getElementById('langSelect').value = saved;
  }
}

// Update all elements with data-i18n attribute
function updateAllTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const text = t(key);
    if (text !== key) {
      el.textContent = text;
    }
  });
}

// Initialize language on load
document.addEventListener('DOMContentLoaded', loadLanguage);