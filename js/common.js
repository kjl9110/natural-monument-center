(function () {
  const header = document.getElementById('header');
  const gnb = header.querySelector('.gnb');

  const openGnb = () => header.classList.add('is-open');
  const closeGnb = () => header.classList.remove('is-open');
  gnb.addEventListener('mouseenter', openGnb);
  header.addEventListener('mouseleave', closeGnb);
  gnb.addEventListener('focusin', openGnb);
  gnb.addEventListener('focusout', (e) => {
    if (!gnb.contains(e.relatedTarget)) closeGnb();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeGnb();
  });

  const menuBtn = header.querySelector('.btn-menu');
  const mobileMenu = document.getElementById('mobileMenu');
  const mmNav = mobileMenu.querySelector('.mm-nav');
  const mmClose = mobileMenu.querySelector('.mm-close');
  mmNav.appendChild(gnb.querySelector('.gnb-list').cloneNode(true));

  const setMobile = (open) => {
    mobileMenu.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
    (open ? mmClose : menuBtn).focus();
  };
  menuBtn.addEventListener('click', () => setMobile(true));
  mmClose.addEventListener('click', () => setMobile(false));
  mobileMenu.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setMobile(false);
  });
  window.matchMedia('(min-width: 1025px)').addEventListener('change', (mq) => {
    if (mq.matches && !mobileMenu.hidden) setMobile(false);
  });

  const familyBtn = document.querySelector('.family-btn');
  const familyList = document.getElementById('familyList');
  if (familyBtn) {
    familyBtn.addEventListener('click', () => {
      const open = familyBtn.getAttribute('aria-expanded') !== 'true';
      familyBtn.setAttribute('aria-expanded', String(open));
      familyList.hidden = !open;
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.family')) {
        familyBtn.setAttribute('aria-expanded', 'false');
        familyList.hidden = true;
      }
    });
  }

  /* 모바일 하위 탭: 현재 탭이 보이도록 가로 스크롤 */
  document.querySelectorAll('.sub-tabs ul').forEach((ul) => {
    const cur = ul.querySelector('[aria-current="page"]');
    if (cur && ul.scrollWidth > ul.clientWidth) {
      const li = cur.closest('li');
      const off = li.getBoundingClientRect().left - ul.getBoundingClientRect().left + ul.scrollLeft;
      ul.scrollLeft = off - (ul.clientWidth - li.offsetWidth) / 2;
    }
  });
  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  document.querySelectorAll('[role="tablist"]').forEach((list) => {
    const tabs = [...list.querySelectorAll('[role="tab"]')];
    if (!tabs[0] || !tabs[0].hasAttribute('aria-controls')) return;

    const select = (tab) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
    };
    tabs.forEach((t) => {
      t.tabIndex = t.getAttribute('aria-selected') === 'true' ? 0 : -1;
      t.addEventListener('click', () => select(t));
    });
    list.addEventListener('keydown', (e) => {
      const i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      let next = null;
      if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
      if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
      if (next) {
        e.preventDefault();
        next.focus();
        select(next);
      }
    });
  });
})();
