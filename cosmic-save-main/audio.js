const audioFiles = {
  menuClick: new Audio('assets/audio/menu_click.mp3'),
  pause: new Audio('assets/audio/pause.mp3'),
  upgradeBuy: new Audio('assets/audio/upgrade_buy.mp3'),
  powerup: new Audio('assets/audio/powerup.mp3'),
  bossfight: new Audio('assets/audio/bossfight.mp3'),
  flightBg: new Audio('assets/audio/flight_bg.mp3'),
  gameOver: new Audio('assets/audio/game_over.mp3'),
  menuBg: new Audio('assets/audio/menu_bg.mp3')
};

// Log para verificar carregamento dos arquivos
Object.keys(audioFiles).forEach(key => {
  audioFiles[key].addEventListener('loadeddata', () => {
    console.log(`Áudio ${key} carregado com sucesso. Duração: ${audioFiles[key].duration}s`);
  });
  audioFiles[key].addEventListener('error', (e) => {
    console.error(`Erro ao carregar áudio ${key}:`, e);
  });
});

// Configurar volume
Object.values(audioFiles).forEach(audio => {
  audio.volume = 0.5; // Volume padrão para efeitos
});
audioFiles.menuClick.volume = 1.0; // Volume aumentado para menuClick
audioFiles.flightBg.volume = 0.3; // Volume mais baixo para música de fundo
audioFiles.menuBg.volume = 0.3;
audioFiles.bossfight.volume = 0.4; // Volume intermediário para bossfight
audioFiles.gameOver.volume = 0.4;

// Configurar loop para músicas de fundo
audioFiles.flightBg.loop = true;
audioFiles.menuBg.loop = true;
audioFiles.bossfight.loop = true; // Loop para bossfight
audioFiles.gameOver.loop = false; // Game over não repete

// Função para tocar um som (efeitos únicos)
function playSound(soundName) {
  const audio = audioFiles[soundName];
  if (audio) {
    console.log(`Tocando som: ${soundName}`);
    audio.currentTime = 0; // Reinicia o som
    audio.play().catch(error => console.error(`Erro ao tocar som ${soundName}:`, error));
  } else {
    console.error(`Som ${soundName} não encontrado`);
  }
}

// Função para tocar música de fundo
function playBackgroundMusic(soundName) {
  stopAllBackgroundMusic(); // Para qualquer música anterior
  const audio = audioFiles[soundName];
  if (audio) {
    console.log(`Tocando música de fundo: ${soundName}`);
    audio.play().catch(error => console.error(`Erro ao tocar música ${soundName}:`, error));
  }
}

// Função para parar todas as músicas de fundo
function stopAllBackgroundMusic() {
  [audioFiles.flightBg, audioFiles.menuBg, audioFiles.bossfight, audioFiles.gameOver].forEach(audio => {
    audio.pause();
    audio.currentTime = 0;
  });
}

// Função para pausar todos os sons
function pauseAllSounds() {
  Object.values(audioFiles).forEach(audio => {
    audio.pause();
    audio.currentTime = 0;
  });
}

// Função para tocar som do menu com música de fundo no primeiro clique
let musicPlayed = false;
function playMenuSound(buttonName) {
  console.log(`Botão ${buttonName} clicado`);
  playSound('menuClick');
  if (!musicPlayed) {
    console.log('Tocando música de fundo menuBg');
    playBackgroundMusic('menuBg');
    musicPlayed = true;
  }
}