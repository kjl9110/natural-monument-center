(function () {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 메인 비주얼 영상 */
  const heroVideo = $('[data-hero-video]');
  const heroToggle = $('[data-hero-toggle]');
  if (heroVideo && heroToggle) {
    const label = $('[data-hero-label]', heroToggle);
    const sync = () => {
      const paused = heroVideo.paused;
      heroToggle.setAttribute('aria-pressed', String(paused));
      label.textContent = paused ? '배경 영상 재생' : '배경 영상 일시정지';
    };
    heroToggle.addEventListener('click', () => (heroVideo.paused ? heroVideo.play() : heroVideo.pause()));
    heroVideo.addEventListener('play', sync);
    heroVideo.addEventListener('pause', sync);
    // 애니메이션 줄이기 설정이면 멈춘 상태로 시작
    if (reduceMotion) heroVideo.pause();
    sync();
  }

  /* 오늘 운영 정보 · 휴관일 */
  const today = new Date();
  const week = ['일', '월', '화', '수', '목', '금', '토'];
  const month = today.getMonth() + 1;
  const isWinter = month >= 11 || month <= 2;
  const hours = isWinter ? '10:00 ~ 17:00' : '09:30 ~ 17:30';
  const lastEntry = isWinter ? '16:30' : '17:00';
  const isClosed = today.getDay() === 1;

  $$('[data-hours]').forEach((el) => (el.textContent = hours));
  $$('[data-last-entry]').forEach((el) => (el.textContent = lastEntry));
  const dateEl = $('[data-today-date]');
  if (dateEl) dateEl.textContent = `${month}. ${today.getDate()} (${week[today.getDay()]})`;
  const stateEl = $('[data-today-state]');
  if (stateEl) {
    stateEl.textContent = isClosed ? '오늘 휴관' : '오늘 정상운영';
    stateEl.classList.toggle('is-closed', isClosed);
  }

  const daysEl = $('[data-closed-days]');
  if (daysEl) {
    $('[data-closed-month]').textContent = `${month}월 휴관일`;
    const y = today.getFullYear();
    const last = new Date(y, month, 0).getDate();
    const mondays = [];
    for (let d = 1; d <= last; d++) {
      if (new Date(y, month - 1, d).getDay() === 1) mondays.push(d);
    }
    let nextMarked = false;
    daysEl.innerHTML = mondays.map((d) => {
      let cls = '';
      if (d < today.getDate()) cls = 'is-past';
      else if (!nextMarked) { cls = 'is-next'; nextMarked = true; }
      const label = cls === 'is-next' ? `${d}일, 다가오는 휴관일` : `${d}일`;
      return `<li class="${cls}" aria-label="${label}">${d}</li>`;
    }).join('');
  }

  /* 홍보 배너 슬라이더 */
  const promo = $('[data-slider]');
  if (promo) {
    const track = $('[data-track]', promo);
    const slides = $$('li', track);
    const tabs = $$('[data-promo-tabs] [role="tab"]');
    let index = 0;

    const go = (i) => {
      index = (i + slides.length) % slides.length;
      track.style.transform = `translateX(${-index * 100}%)`;
      slides.forEach((s, n) => {
        s.setAttribute('aria-hidden', String(n !== index));
        $$('a', s).forEach((a) => (a.tabIndex = n === index ? 0 : -1));
      });
      tabs.forEach((t, n) => t.setAttribute('aria-selected', String(n === index)));
    };
    $('[data-prev]', promo).addEventListener('click', () => go(index - 1));
    $('[data-next]', promo).addEventListener('click', () => go(index + 1));
    tabs.forEach((t) => t.addEventListener('click', () => go(Number(t.dataset.go))));

    let startX = null;
    promo.addEventListener('pointerdown', (e) => (startX = e.clientX));
    promo.addEventListener('pointerup', (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
      startX = null;
    });
    go(0);
  }

  /* 공지·소식 롤링 */
  $$('[data-roll]').forEach((roll) => {
    const items = $$('[data-roll-list] li', roll);
    let index = 0;
    let timer = null;
    const show = (i) => {
      index = (i + items.length) % items.length;
      items.forEach((li, n) => {
        li.style.transform = `translateY(${-index * 100}%)`;
        li.setAttribute('aria-hidden', String(n !== index));
        $('a', li).tabIndex = n === index ? 0 : -1;
      });
    };
    const start = () => {
      if (reduceMotion || items.length < 2) return;
      stop();
      timer = setInterval(() => show(index + 1), 4000);
    };
    const stop = () => clearInterval(timer);
    $('[data-roll-prev]', roll).addEventListener('click', () => show(index - 1));
    $('[data-roll-next]', roll).addEventListener('click', () => show(index + 1));
    roll.addEventListener('mouseenter', stop);
    roll.addEventListener('mouseleave', start);
    roll.addEventListener('focusin', stop);
    roll.addEventListener('focusout', start);
    show(0);
    start();
  });

  /* 전시관 안내도 */
  const zones = [
    { title: '동물 전시존', desc: '식물 전시존 다음엔 천연기념물 ‘동물’ 전시존이 기다리고 있어요.', img: 'images/동물전시존.jpg', alt: '반달가슴곰과 황새, 두루미 등 천연기념물 동물 표본 전시' },
    { title: '지질 전시존', desc: '오랜 시간 땅이 만든 암석과 화석, 지질 유산을 살펴봐요.', img: 'images/지질전시존.jpg', alt: '격자 벽에 걸린 커다란 공룡 발자국 화석 판' },
    { title: '천연보호구역', desc: '자연 그대로 보호되는 지역의 생태를 소개해요.', img: 'images/천연보호구역.jpg', alt: '천연보호구역과 명승 사진 수백 장으로 채운 미디어 월' },
    { title: '식물 전시존', desc: '노거수 등 천연기념물 식물 이야기를 담았어요.', img: 'images/식물전시존.png', alt: '천장까지 가지를 뻗은 노거수 모형과 식물 사진 전시' },
    { title: '명승', desc: '경치가 뛰어난 자연 명승지를 사진과 영상으로 만나요.', img: 'images/명승.jpg', alt: '제주 서귀포 정방폭포 등 명승 사진이 펼쳐진 미디어 월', pos: '70% 50%' },
    { title: '한반도의 자연유산', desc: '한반도 곳곳의 자연유산을 한눈에 살펴봐요.', img: 'images/웅장한매머드.jpg', alt: '털매머드 골격 표본과 화석 전시장' }
  ];
  const map = $('[data-map]');
  if (map) {
    const hits = $$('[data-zone]', map);
    const media = $('[data-zone-media]');
    const title = $('[data-zone-title]');
    const desc = $('[data-zone-desc]');
    let current = 0;
    const setZone = (i) => {
      current = (i + zones.length) % zones.length;
      const z = zones[current];
      title.textContent = z.title;
      desc.textContent = z.desc;
      media.innerHTML = `<img src="${z.img}" alt="${z.alt}"${z.pos ? ` style="object-position:${z.pos}"` : ''}>`;
      hits.forEach((h, n) => h.setAttribute('aria-pressed', String(n === current)));
    };
    hits.forEach((h) => h.addEventListener('click', () => setZone(Number(h.dataset.zone))));
    $('[data-zone-prev]').addEventListener('click', () => setZone(current - 1));
    $('[data-zone-next]').addEventListener('click', () => setZone(current + 1));
  }

  /* 소식·행사 카드 */
  const news = [
    { cat: '공지', title: '추석 명절 연휴 천연기념물센터 운영 안내', img: 'images/notice-chuseok.jpg', pos: '50% 30%' },
    { cat: '행사', title: '2022년 자연유산 체험사례 공모전 수상작 (고학년 부문)', img: 'images/event-contest.jpg', pos: '50% 50%', fit: 'contain' },
    { cat: '교육', title: '별도의 신청 없이 전시실 내 상주하고 있는 ‘자연유산알림이’를 통해 들으실 수 있습니다.', img: 'images/edu-guide.jpg', pos: '50% 50%' },
    { cat: '행사', title: '2022년 자연유산 체험사례 공모전 수상작 (저학년 부문)', img: 'images/event-contest.jpg', pos: '50% 50%', fit: 'contain' },
    { cat: '행사', title: '기획전시 「지질유산 연구, 3人3色」', img: 'images/exhibit-geo.jpg', pos: '50% 20%' },
    { cat: '공지', title: '2024년 천연기념물센터 가을소식지', img: 'images/newsletter.jpg', pos: '50% 50%' },
    { cat: '교육', title: '매머드 뼈조각 맞추기 체험 게임', img: 'images/game-board.png', pos: '30% 50%' },
    { cat: '공지', title: '천연기념물센터 털매머드 전시공간 관람 제한 안내', img: 'images/sub2-7-img01_2.jpg', pos: '50% 25%' }
  ];
  const list = $('[data-news-list]');
  if (list) {
    const count = $('[data-news-count]');
    const tabs = $$('[data-news-tabs] [role="tab"]');
    const leaf = '<svg class="leaf" viewBox="0 0 34 34" aria-hidden="true"><path d="M4 30C4 16 14 5 30 4c-1 15-11 26-26 26z"/><path d="M6 28C13 20 20 13 28 6" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/></svg>';
    let cat = 'all';
    let page = 0;
    const perPage = () => (window.innerWidth > 1200 ? 4 : 2);

    const render = () => {
      const items = news.filter((n) => cat === 'all' || n.cat === cat);
      const size = perPage();
      const pages = Math.max(1, Math.ceil(items.length / size));
      page = Math.min(page, pages - 1);
      list.innerHTML = items.slice(page * size, page * size + size).map((n) => `
        <li class="news-card"><a href="#">
          <img src="${n.img}" alt="" loading="lazy" style="object-position:${n.pos}${n.fit ? `;object-fit:${n.fit};background:#fff` : ''}">
          <span class="news-cat">[${n.cat}]</span>
          <strong class="news-tit">${n.title}</strong>${leaf}
        </a></li>`).join('');
      count.textContent = `${page + 1} / ${pages}`;
    };
    tabs.forEach((t) => t.addEventListener('click', () => {
      cat = t.dataset.cat;
      page = 0;
      tabs.forEach((b) => b.setAttribute('aria-selected', String(b === t)));
      render();
    }));
    $('[data-news-prev]').addEventListener('click', () => {
      const pages = Math.ceil(news.filter((n) => cat === 'all' || n.cat === cat).length / perPage());
      page = (page - 1 + pages) % pages;
      render();
    });
    $('[data-news-next]').addEventListener('click', () => {
      const pages = Math.ceil(news.filter((n) => cat === 'all' || n.cat === cat).length / perPage());
      page = (page + 1) % pages;
      render();
    });
    let lastSize = perPage();
    window.addEventListener('resize', () => {
      if (perPage() !== lastSize) { lastSize = perPage(); render(); }
    });
    render();
  }
})();
