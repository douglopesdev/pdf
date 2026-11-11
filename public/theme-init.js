// Aplica o tema salvo antes da primeira pintura, para não piscar a tela.
// Arquivo externo (e não inline) porque a CSP só permite scripts do próprio app.
// Mantenha os nomes iguais aos de src/lib/theme.ts (THEMES e COLOR_TOKENS).
(function () {
  var THEMES = ['light', 'dark', 'pink', 'blue', 'green', 'purple', 'orange', 'custom'];
  var TOKENS = [
    'bg',
    'surface',
    'ink',
    'muted',
    'line',
    'line-strong',
    'btn',
    'btn-ink',
    'ok',
    'ok-bg',
    'danger',
    'scrim',
  ];
  try {
    var prefs = JSON.parse(localStorage.getItem('pdf.prefs') || '{}');
    if (THEMES.indexOf(prefs.theme) < 0) return;
    var root = document.documentElement;
    root.dataset.theme = prefs.theme;

    if (prefs.theme === 'custom' && prefs.custom) {
      TOKENS.forEach(function (token) {
        var color = prefs.custom[token];
        if (typeof color !== 'string' || !/^#[0-9a-f]{6}$/i.test(color)) return;
        root.style.setProperty(
          '--' + token,
          token === 'scrim' ? 'color-mix(in srgb, ' + color + ' 50%, transparent)' : color,
        );
      });
    }
  } catch {
    // Sem localStorage: segue o tema do sistema.
  }
})();
