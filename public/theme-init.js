(function () {
  var theme = localStorage.getItem('theme') || 'light';
  document.documentElement.classList.add(theme);
  document.documentElement.setAttribute('class', theme);
})();
