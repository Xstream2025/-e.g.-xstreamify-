/* Generates a cloud of floating “DVDs” behind the sign-in form.
   Zero dependencies. Safe to run before/after other scripts. */

(function () {
  const root = document.getElementById('dvd-bg');
  if (!root) return;

  // A small poster set to start. Replace/add any URLs you want.
  // (These are public poster thumbs; you can swap later to your library posters.)
  const posters = [
    "https://image.tmdb.org/t/p/w342/or1gBugydmjToAQwA9wyA9dGzAK.jpg",  // Braveheart
    "https://image.tmdb.org/t/p/w342/velWPhVMQeQKcxggNEU8YmIo52R.jpg",  // The Dark Knight
    "https://image.tmdb.org/t/p/w342/pu4Z3RxZQZQ6Q0imeISFRCGDpa2.jpg",  // Interstellar
    "https://image.tmdb.org/t/p/w342/yPisjyLweCl1tbgwgtzBCNCBle.jpg",   // Gladiator
    "https://image.tmdb.org/t/p/w342/ceG9VzoRAVGwivFU403Wc3AHRys.jpg",  // Inception
    "https://image.tmdb.org/t/p/w342/1RZJ1JpN96CB2TFBgqsSVqSdz8S.jpg",  // John Wick
    "https://image.tmdb.org/t/p/w342/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg",  // The Lion King
    "https://image.tmdb.org/t/p/w342/yTNg4XNrMQ4K7G2J4M4XqC6A5tk.jpg",  // Dune
    "https://image.tmdb.org/t/p/w342/jZ4QFQ0t1Ik5dUvNbKQWPiQXWyo.jpg",  // Spider-Verse
    "https://image.tmdb.org/t/p/w342/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg"   // The Matrix
  ];

  const W = window.innerWidth;
  const H = window.innerHeight;
  const COUNT = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--dvd-count')) || 26;
  const MIN = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--dvd-min')) || 90;
  const MAX = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--dvd-max')) || 180;

  function rand(a, b) { return Math.random() * (b - a) + a; }
  function rpx(limit) { return Math.floor(rand(-limit * 0.15, limit * 0.85)) + "px"; }
  function pick(arr){ return arr[Math.floor(Math.random() * arr.length)]; }

  for (let i = 0; i < COUNT; i++) {
    const el = document.createElement('div');
    el.className = 'dvd';

    const size = Math.floor(rand(MIN, MAX));
    el.style.setProperty('--size', `${size}px`);
    el.style.backgroundImage = `url("${pick(posters)}")`;

    // two random points and rotations to drift between
    el.style.setProperty('--x1', rpx(W));
    el.style.setProperty('--y1', rpx(H));
    el.style.setProperty('--x2', rpx(W));
    el.style.setProperty('--y2', rpx(H));
    el.style.setProperty('--r1', `${rand(-20, 20)}deg`);
    el.style.setProperty('--r2', `${rand(-80, 80)}deg`);

    // duration varies so they look organic
    el.style.setProperty('--dur', rand(16, 34) + 's');

    root.appendChild(el);
  }

  // Keep coverage when window resizes (optional simple refresh)
  let t;
  window.addEventListener('resize', () => {
    clearTimeout(t);
    t = setTimeout(() => {
      location.reload();
    }, 300);
  });
})();
