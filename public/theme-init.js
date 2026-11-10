// Aplica o tema salvo antes da primeira pintura, para não piscar a tela.
// Arquivo externo (e não inline) porque a CSP só permite scripts do próprio app.
(function () {
  try {
    var prefs = JSON.parse(localStorage.getItem('pdf.prefs') || '{}');
    if (prefs.theme === 'light' || prefs.theme === 'dark') {
      document.documentElement.dataset.theme = prefs.theme;
    }
  } catch {
    // Sem localStorage: segue o tema do sistema.
  }
})();
