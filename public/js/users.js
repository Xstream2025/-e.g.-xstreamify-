// /public/js/users.js
document.addEventListener('DOMContentLoaded', () => {
  console.log('[users.js] v3 — picker ready');

  // Select ANY clickable user card: prefer data-* attributes; otherwise
  // fall back to reading the img + text from the card.
  const cards = document.querySelectorAll('.card, .user, .profile, [data-name], [data-avatar]');

  cards.forEach(card => {
    card.addEventListener('click', (e) => {
      e.preventDefault(); // stop the default nav so we can store first

      // Try to read name/avatar from data-attrs; fall back to DOM
      let name =
        card.dataset.name ||
        card.querySelector('.name, h3, h4, figcaption')?.textContent?.trim();

      let avatar =
        card.dataset.avatar ||
        card.querySelector('img')?.getAttribute('src');

      // Normalize avatar to absolute path (/img/...)
      if (avatar) {
        avatar = '/' + avatar.replace(/^\/?/, '');
      }

      // Last-resort defaults (shouldn’t be needed but safe)
      if (!name) name = 'Profile';
      if (!avatar) avatar = '/img/profile1.png';

      const prof = { name, avatar };
      localStorage.setItem('xs_profile', JSON.stringify(prof));
      console.log('[users.js] set xs_profile:', prof);

      // Now go to the library
      window.location.href = '/browse.html';
    });
  });
});
