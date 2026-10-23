(function () {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const WEEK = ['일', '월', '화', '수', '목', '금', '토'];

  /* ===== 단체관람 예약 ===== */
  const cal = $('[data-cal]');
  if (cal) {
    const SLOTS = [
      { name: '1회차', time: '10:00 – 11:00', start: '10:00', cap: 40 },
      { name: '2회차', time: '11:30 – 12:30', start: '11:30', cap: 40 },
      { name: '3회차', time: '14:00 – 15:00', start: '14:00', cap: 40 },
      { name: '4회차', time: '15:30 – 16:30', start: '15:30', cap: 40 }
    ];
    const MIN = 10;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    const state = { view: new Date(first), date: null, slot: null, count: 20 };

    // 데모용 잔여석: 날짜·회차마다 고정된 값
    const seatsLeft = (d, i) => {
      if (d.getDay() === 5 && d.getDate() <= 21) return 0;
      const n = (d.getDate() * 7 + i * 13 + d.getMonth() * 3) % 41;
      return i === 3 && d.getDate() % 3 === 0 ? 0 : n;
    };
    const isFull = (d) => SLOTS.every((_, i) => seatsLeft(d, i) === 0);
    const fmt = (d) => `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()} (${WEEK[d.getDay()]})`;

    const steps = $$('[data-steps] li');
    const panels = $$('[data-step]');
    const nextBtn = $('.btn-next');
    const title = $('[data-cal-title]');
    const prevM = $('[data-cal-prev]');
    const nextM = $('[data-cal-next]');
    const slotsEl = $('[data-slots]');
    const slotEmpty = $('[data-slot-empty]');
    const countOut = $('[data-count]');
    const minus = $('[data-count-minus]');
    const plus = $('[data-count-plus]');
    const hint = $('[data-count-hint]');

    const maxCount = () => (state.date && state.slot !== null ? seatsLeft(state.date, state.slot) : 40);

    const renderSummary = () => {
      $$('[data-sum-date]').forEach((el) => (el.textContent = state.date ? fmt(state.date) : '-'));
      $$('[data-sum-slot]').forEach((el) => (el.textContent = state.slot !== null ? `${SLOTS[state.slot].name} · ${SLOTS[state.slot].start}` : '-'));
      $$('[data-sum-count]').forEach((el) => (el.textContent = `${state.count}명`));
      if (document.activeElement !== countOut) countOut.value = state.count;
      const max = maxCount();
      countOut.max = max;
      minus.disabled = state.count <= MIN;
      plus.disabled = state.count >= max;
      hint.textContent = state.slot !== null ? `10명 이상, 최대 ${max}명까지 신청할 수 있어요` : '10명 이상부터 신청할 수 있어요';
      nextBtn.disabled = !(state.date && state.slot !== null && state.count >= MIN && state.count <= max);
    };

    const renderSlots = () => {
      slotsEl.innerHTML = '';
      slotEmpty.hidden = !!state.date;
      if (!state.date) return;
      SLOTS.forEach((s, i) => {
        const left = seatsLeft(state.date, i);
        const ok = left >= MIN;
        const sel = state.slot === i;
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'slot';
        b.setAttribute('role', 'radio');
        b.setAttribute('aria-checked', String(sel));
        b.disabled = !ok;
        b.innerHTML = `<span class="l"><b>${s.name}</b><small>${s.time}</small><span class="seats">잔여 <i>${left}</i>명</span></span><span class="badge">${sel ? '선택됨' : ok ? '예약 가능' : '마감'}</span>`;
        b.addEventListener('click', () => {
          state.slot = i;
          state.count = Math.min(Math.max(state.count, MIN), left);
          renderSlots();
          renderSummary();
          slotsEl.querySelectorAll('.slot')[i].focus();
        });
        slotsEl.appendChild(b);
      });
    };

    const renderCal = () => {
      const y = state.view.getFullYear();
      const m = state.view.getMonth();
      title.textContent = `${y}년 ${m + 1}월`;
      prevM.disabled = state.view <= first;
      const limit = new Date(first.getFullYear(), first.getMonth() + 3, 1);
      nextM.disabled = new Date(y, m + 1, 1) >= limit;
      cal.innerHTML = '';
      const lead = new Date(y, m, 1).getDay();
      for (let i = 0; i < lead; i++) cal.appendChild(document.createElement('span'));
      const last = new Date(y, m + 1, 0).getDate();
      for (let day = 1; day <= last; day++) {
        const d = new Date(y, m, day);
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'd';
        const past = d <= today;
        const off = d.getDay() === 1;
        const full = !past && !off && isFull(d);
        let label = `${m + 1}월 ${day}일 ${WEEK[d.getDay()]}요일`;
        if (past) { b.classList.add('past'); label += ', 선택 불가'; }
        else if (off) { b.classList.add('off'); label += ', 휴관일'; }
        else if (full) { b.classList.add('full'); label += ', 예약 마감'; }
        if (d.getTime() === today.getTime()) b.classList.add('today');
        b.disabled = past || off || full;
        const sel = state.date && d.getTime() === state.date.getTime();
        b.setAttribute('aria-pressed', String(!!sel));
        b.setAttribute('aria-label', label);
        b.innerHTML = `<span>${day}</span>`;
        b.addEventListener('click', () => {
          state.date = d;
          state.slot = null;
          renderCal();
          renderSlots();
          renderSummary();
        });
        cal.appendChild(b);
      }
    };

    prevM.addEventListener('click', () => { state.view.setMonth(state.view.getMonth() - 1); renderCal(); });
    nextM.addEventListener('click', () => { state.view.setMonth(state.view.getMonth() + 1); renderCal(); });
    minus.addEventListener('click', () => { state.count = Math.max(MIN, state.count - 1); renderSummary(); });
    plus.addEventListener('click', () => { state.count = Math.min(maxCount(), state.count + 1); renderSummary(); });
    // 키보드로 인원 직접 입력
    countOut.addEventListener('input', () => {
      const v = parseInt(countOut.value, 10);
      if (Number.isNaN(v)) return;
      state.count = Math.min(Math.max(v, 0), maxCount());
      renderSummary();
    });
    const fixCount = () => {
      const v = parseInt(countOut.value, 10);
      state.count = Math.min(Math.max(Number.isNaN(v) ? MIN : v, MIN), maxCount());
      countOut.value = state.count;
      renderSummary();
    };
    countOut.addEventListener('change', fixCount);
    countOut.addEventListener('blur', fixCount);
    countOut.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); countOut.blur(); } });
    countOut.addEventListener('focus', () => countOut.select());

    const goStep = (n) => {
      panels.forEach((p) => (p.hidden = Number(p.dataset.step) !== n));
      steps.forEach((li, i) => {
        li.classList.toggle('is-on', i === n - 1);
        li.classList.toggle('is-done', i < n - 1);
        if (i === n - 1) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
      });
      const target = $(`[data-step="${n}"]`);
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 140, behavior: 'smooth' });
      const focusEl = n === 3 ? target : target.querySelector('input, button');
      if (focusEl) focusEl.focus({ preventScroll: true });
    };
    $$('[data-go-step]').forEach((b) => b.addEventListener('click', () => goStep(Number(b.dataset.goStep))));

    const form = $('.g-form');
    const err = $('[data-form-error]');
    const clearError = (e) => {
      if (e.target.getAttribute('aria-invalid') === 'true') e.target.setAttribute('aria-invalid', 'false');
      if (!$('[aria-invalid="true"]', form)) err.hidden = true;
    };
    form.addEventListener('input', clearError);
    form.addEventListener('change', clearError);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fields = $$('[required]', form);
      let firstBad = null;
      fields.forEach((f) => {
        const bad = f.type === 'checkbox' ? !f.checked : !f.value.trim() || !f.checkValidity();
        f.setAttribute('aria-invalid', String(bad));
        if (bad && !firstBad) firstBad = f;
      });
      err.hidden = !firstBad;
      if (firstBad) { firstBad.focus(); return; }
      $('[data-done-org]').textContent = form.org.value.trim();
      $('[data-done-when]').textContent = `${fmt(state.date)} ${SLOTS[state.slot].start}`;
      goStep(3);
    });
    $('[data-restart]').addEventListener('click', () => {
      form.reset();
      Object.assign(state, { date: null, slot: null, count: 20, view: new Date(first) });
      renderCal(); renderSlots(); renderSummary();
      goStep(1);
    });

    renderCal();
    renderSlots();
    renderSummary();
  }

  /* ===== 관람 안내: 오늘 운영 여부 ===== */
  const todayEl = $('[data-today-state]');
  if (todayEl) {
    const now = new Date();
    const closed = now.getDay() === 1;
    todayEl.textContent = `${now.getMonth() + 1}월 ${now.getDate()}일 ${closed ? '휴관' : '정상 운영'}`;
    todayEl.classList.toggle('is-closed', closed);
  }

  /* ===== 자주 묻는 질문 분류 ===== */
  const faqList = $('[data-faq-list]');
  if (faqList) {
    const items = $$('.faq', faqList);
    const cats = $$('[data-faq-cat]');
    cats.forEach((b) => b.addEventListener('click', () => {
      const cat = b.dataset.faqCat;
      cats.forEach((c) => c.setAttribute('aria-pressed', String(c === b)));
      items.forEach((d) => (d.hidden = cat !== 'all' && d.dataset.cat !== cat));
    }));
  }

  /* ===== 공지사항 목록 ===== */
  const bdRows = $('[data-bd-rows]');
  if (bdRows) {
    const rows = $$('tr', bdRows);
    const count = $('[data-bd-count]');
    const empty = $('[data-bd-empty]');
    const field = $('[data-bd-field]');
    const query = $('[data-bd-query]');
    const cats = $$('[data-bd-cat]');
    let cat = 'all';

    const apply = () => {
      const q = query.value.trim();
      let shown = 0;
      rows.forEach((tr) => {
        const title = $('.t', tr).textContent;
        const text = field.value === 'all' ? `${title} ${tr.dataset.cat}` : title;
        const ok = (cat === 'all' || tr.dataset.cat === cat) && (!q || text.includes(q));
        tr.hidden = !ok;
        if (ok) shown++;
      });
      // 분류·검색이 없을 때는 전체 게시물 수, 있을 때는 이 페이지에서 찾은 수
      count.textContent = cat === 'all' && !q ? count.dataset.all : shown;
      empty.hidden = shown > 0;
    };
    cats.forEach((b) => b.addEventListener('click', () => {
      cat = b.dataset.bdCat;
      cats.forEach((c) => c.setAttribute('aria-pressed', String(c === b)));
      apply();
    }));
    $('[data-bd-search]').addEventListener('submit', (e) => { e.preventDefault(); apply(); });
    query.addEventListener('search', apply);
  }

  /* ===== 오시는 길: 주소 복사 ===== */
  $$('[data-copy]').forEach((btn) => {
    const label = $('[data-copy-label]', btn);
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        label.textContent = '복사했어요';
      } catch (e) {
        label.textContent = '복사 실패';
      }
      btn.classList.add('is-done');
      setTimeout(() => { label.textContent = '주소 복사'; btn.classList.remove('is-done'); }, 2000);
    });
  });

  /* ===== 교육프로그램 필터 ===== */
  const list = $('[data-programs]');
  if (list) {
    const items = $$('.pg', list);
    const filters = { target: 'all', status: 'all' };
    const search = $('[data-search]');
    const total = $('[data-total]');
    const empty = $('[data-empty]');
    let sort = 'new';

    const apply = () => {
      const q = search.value.trim();
      let shown = 0;
      items.forEach((li) => {
        const t = li.dataset.target;
        const okT = filters.target === 'all' || t === 'all' || t === filters.target;
        const okS = filters.status === 'all' || li.dataset.status === filters.status;
        const okQ = !q || li.textContent.includes(q);
        li.hidden = !(okT && okS && okQ);
        if (!li.hidden) shown++;
      });
      const sorted = [...items].sort((a, b) =>
        sort === 'new' ? b.dataset.order - a.dataset.order : a.dataset.deadline - b.dataset.deadline);
      sorted.forEach((li) => list.appendChild(li));
      total.textContent = shown;
      empty.hidden = shown > 0;
    };
    $$('[data-filter]').forEach((chip) => chip.addEventListener('click', () => {
      const key = chip.dataset.filter;
      filters[key] = chip.dataset.value;
      $$(`[data-filter="${key}"]`).forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
      apply();
    }));
    $$('[data-sort]').forEach((b) => b.addEventListener('click', () => {
      sort = b.dataset.sort;
      $$('[data-sort]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      apply();
    }));
    search.addEventListener('input', apply);
  }

  /* ===== 체험 게임 ===== */
  const board = $('[data-board]');
  if (board) {
    const FACTS = {
      skull: ['머리뼈', '커다란 머리뼈 안에는 뇌와 함께 씹는 데 쓰는 큰 어금니가 자리해요.'],
      tusk: ['엄니', '매머드의 엄니는 길게 자란 앞니로, 길이가 최대 4m에 이르기도 해요.'],
      spine: ['척추', '등을 따라 길게 이어진 뼈로, 무거운 몸을 지탱해 줘요.'],
      ribs: ['갈비뼈', '심장과 폐 같은 중요한 장기를 감싸서 보호해요.'],
      pelvis: ['골반', '몸통과 뒷다리를 이어 주는 튼튼한 뼈예요.'],
      front: ['앞다리', '기둥처럼 곧은 앞다리뼈가 커다란 몸무게를 받쳐 줘요.'],
      back: ['뒷다리', '뒷다리뼈는 앞다리와 함께 몸을 받치고 걸을 수 있게 해 줘요.'],
      tail: ['꼬리', '매머드의 꼬리는 추위에 열을 덜 빼앗기도록 짧은 편이었어요.']
    };
    const pieces = $$('[data-piece]');
    const slots = $$('[data-slot]', board);
    const factT = $('[data-fact-title]');
    const factD = $('[data-fact-desc]');
    const doneEl = $('[data-done-count]');
    const bar = $('[data-bar]');
    const sideCount = $('[data-side-count]');
    const guide = $('[data-guide]');
    const complete = $('[data-complete]');
    let selected = null;

    const showFact = (id) => { factT.textContent = FACTS[id][0]; factD.textContent = FACTS[id][1]; };
    const select = (id) => {
      selected = id;
      pieces.forEach((p) => {
        if (p.classList.contains('done')) return;
        const on = p.dataset.piece === id;
        p.setAttribute('aria-pressed', String(on));
        $('small', p).textContent = on ? '선택됨' : '남은 조각';
      });
      if (id) {
        showFact(id);
        guide.textContent = `‘${FACTS[id][0]}’ 조각을 놓을 점선 자리를 고르세요`;
      }
    };
    const progress = () => {
      const n = $$('.slot.placed', board).length;
      doneEl.textContent = n;
      bar.setAttribute('aria-valuenow', n);
      $('span', bar).style.width = `${(n / 8) * 100}%`;
      sideCount.textContent = `8개 중 ${n}개 완료`;
      complete.hidden = n < 8;
      if (n === 8) {
        guide.textContent = '매머드 골격 완성!';
        $('button', complete).focus();
      }
    };
    const flash = (slot, cls) => {
      slot.classList.add(cls);
      setTimeout(() => slot.classList.remove(cls), 600);
    };
    // 틀렸을 때 아기 매머드가 건네는 귀여운 말
    const OOPS = [
      ['뿌우~ 괜찮아!', '틀려도 괜찮아. 다시 해 보자!']
    ];
    const oopsEl = $('[data-oops]');
    let oopsTimer = null;
    let lastOops = -1;
    const josa = (w) => { const c = w.charCodeAt(w.length - 1) - 0xac00; return c >= 0 && c % 28 ? '은' : '는'; };
    const showOops = (id) => {
      if (!oopsEl) return;
      let i;
      do { i = Math.floor(Math.random() * OOPS.length); } while (i === lastOops && OOPS.length > 1);
      lastOops = i;
      const name = FACTS[id][0];
      const [title, line] = OOPS[i];
      $('[data-oops-title]', oopsEl).textContent = title;
      $('[data-oops-line]', oopsEl).textContent = line.replace('{p}는', name + josa(name)).replace('{p}', name);
      oopsEl.hidden = false;
      oopsEl.classList.remove('is-on');
      void oopsEl.offsetWidth;
      oopsEl.classList.add('is-on');
      clearTimeout(oopsTimer);
      oopsTimer = setTimeout(() => { oopsEl.classList.remove('is-on'); oopsEl.hidden = true; }, 3000);
    };
    const tryPlace = (slot, id) => {
      if (!slot || !id || slot.classList.contains('placed')) return;
      if (slot.dataset.slot !== id) {
        flash(slot, 'wrong');
        guide.textContent = '그 자리가 아니에요. 다시 찾아보세요!';
        showOops(id);
        return;
      }
      slot.classList.add('placed');
      slot.removeAttribute('tabindex');
      slot.setAttribute('aria-label', `${FACTS[id][0]} 맞춤`);
      const btn = pieces.find((p) => p.dataset.piece === id);
      btn.classList.add('done');
      btn.removeAttribute('aria-pressed');
      btn.disabled = true;
      $('small', btn).textContent = '완료';
      selected = null;
      guide.textContent = '잘했어요! 다음 조각을 골라 보세요';
      progress();
    };

    pieces.forEach((p) => p.addEventListener('click', () => {
      if (dragMoved) return;
      select(selected === p.dataset.piece ? null : p.dataset.piece);
    }));
    slots.forEach((s) => {
      s.addEventListener('click', () => tryPlace(s, selected));
      s.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tryPlace(s, selected); }
      });
    });

    let ghost = null;
    let dragId = null;
    let dragMoved = false;
    let start = null;
    let over = null;
    const slotAt = (x, y) => {
      if (ghost) ghost.style.display = 'none';
      const el = document.elementFromPoint(x, y);
      if (ghost) ghost.style.display = '';
      const hit = el ? el.closest('[data-slot]') : null;
      if (hit) return hit;
      const pad = 24;
      const near = slots
        .filter((s) => !s.classList.contains('placed'))
        .map((s) => ({ s, r: s.getBoundingClientRect() }))
        .filter(({ r }) => x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad)
        .sort((a, b) => a.r.width * a.r.height - b.r.width * b.r.height);
      return near.length ? near[0].s : null;
    };
    pieces.forEach((p) => {
      p.addEventListener('pointerdown', (e) => {
        if (p.disabled) return;
        dragId = p.dataset.piece;
        dragMoved = false;
        start = { x: e.clientX, y: e.clientY };
        p.setPointerCapture(e.pointerId);
      });
      p.addEventListener('pointermove', (e) => {
        if (!dragId) return;
        if (!dragMoved && Math.hypot(e.clientX - start.x, e.clientY - start.y) < 6) return;
        if (!dragMoved) {
          dragMoved = true;
          select(dragId);
          ghost = document.createElement('div');
          ghost.className = 'drag-ghost';
          ghost.innerHTML = $('.th', p).innerHTML;
          document.body.appendChild(ghost);
        }
        ghost.style.transform = `translate(${e.clientX - 32}px, ${e.clientY - 32}px)`;
        const s = slotAt(e.clientX, e.clientY);
        if (over && over !== s) over.classList.remove('is-over');
        over = s && !s.classList.contains('placed') ? s : null;
        if (over) over.classList.add('is-over');
      });
      const end = (e) => {
        if (!dragId) return;
        if (dragMoved) {
          const s = slotAt(e.clientX, e.clientY);
          if (over) over.classList.remove('is-over');
          tryPlace(s, dragId);
          ghost && ghost.remove();
          ghost = null;
          setTimeout(() => (dragMoved = false), 0);
        }
        dragId = null;
        over = null;
      };
      p.addEventListener('pointerup', end);
      p.addEventListener('pointercancel', end);
    });

    $('[data-hint]').addEventListener('click', () => {
      const id = selected || (pieces.find((p) => !p.classList.contains('done')) || {}).dataset?.piece;
      if (!id) return;
      if (!selected) select(id);
      const s = slots.find((x) => x.dataset.slot === id);
      s.classList.remove('hint');
      void s.getBoundingClientRect();
      s.classList.add('hint');
      setTimeout(() => s.classList.remove('hint'), 3000);
    });
    const reset = () => {
      slots.forEach((s) => {
        s.classList.remove('placed');
        s.setAttribute('tabindex', '0');
        s.setAttribute('aria-label', `${FACTS[s.dataset.slot][0]} 자리`);
      });
      pieces.forEach((p) => { p.classList.remove('done'); p.disabled = false; });
      select(null);
      factT.textContent = '조각을 골라 보세요';
      factD.textContent = '뼈조각 목록에서 조각을 누르거나 끌면 설명이 나와요.';
      guide.textContent = '조각을 끌어서 점선 자리에 놓으세요';
      progress();
    };
    $$('[data-reset]').forEach((b) => b.addEventListener('click', reset));
    progress();
  }
})();
