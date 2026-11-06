/* «Затмение» – интерактив сайта «Черное Солнце». Без библиотек и без сервера. */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const body = document.body;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const store = { get(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (_) { return null; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} } };
  const ico = (n) => `<svg class="e-i" aria-hidden="true"><use href="#i-${n}"/></svg>`;

  // ---------- шапка и появление
  const bar = $("[data-e-bar]");
  const onBar = () => bar && bar.classList.toggle("is-scrolled", scrollY > 10);
  addEventListener("scroll", onBar, { passive: true }); onBar();
  const rvs = $$(".e-rv");
  if ("IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -6% 0px", threshold: .01 });
    rvs.forEach((el) => io.observe(el));
  } else rvs.forEach((el) => el.classList.add("is-in"));

  // ---------- затмение на первом экране
  const hero = $("[data-e-hero]"), ecl = $("[data-e-eclipse]");
  if (hero && ecl) {
    let intro = reduce ? 1 : 0, t0 = performance.now(), ticking = false;
    const ease = (x) => 1 - Math.pow(1 - x, 3);
    const paint = () => {
      ticking = false;
      const sp = Math.min(1, Math.max(0, scrollY / (hero.offsetHeight || 1)));
      const e = Math.min(1, intro + sp * .55);
      const flare = Math.max(0, 1 - Math.abs(e - .955) / .045);
      hero.style.setProperty("--e", e.toFixed(3)); hero.style.setProperty("--sp", sp.toFixed(3));
      ecl.style.setProperty("--flare", flare.toFixed(3));
    };
    const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(paint); } };
    if (!reduce) {
      const run = (t) => { const k = Math.min(1, (t - t0 - 250) / 2600); intro = .86 * ease(Math.max(0, k)); paint(); if (k < 1) requestAnimationFrame(run); };
      requestAnimationFrame(run);
      addEventListener("scroll", req, { passive: true });
    } else paint();
  }

  // ---------- часы работы: «открыто / закрыто» по времени Тюмени
  const hours = JSON.parse(body.dataset.eHours || "null");
  if (hours) {
    const wd = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
    const now = new Date(Date.now() + (hours.tz * 60 + new Date().getTimezoneOffset()) * 60000);
    const h = now.getHours() + now.getMinutes() / 60, day = now.getDay();
    const open = hours.days.includes(day) && h >= hours.open && h < hours.close;
    let txt;
    if (open) txt = "Сейчас открыто, до " + hours.close + ":00";
    else {
      let k = 0; if (hours.days.includes(day) && h < hours.open) k = 0; else { k = 1; while (!hours.days.includes((day + k) % 7) && k < 7) k++; }
      txt = "Сейчас закрыто · откроется " + (k === 0 ? "сегодня" : k === 1 ? "завтра" : "в " + wd[(day + k) % 7]) + " в " + hours.open + ":00";
    }
    const pill = $("[data-e-status]");
    if (pill) { pill.hidden = false; pill.classList.toggle("is-open", open); $("span", pill).textContent = txt; }
    const sm = $("[data-e-status-sm]"); if (sm) sm.textContent = txt;
  }

  // ---------- общий выбор услуг: карточки, схема, переключатель, шумомер, форма
  const form = $("[data-e-form]");
  const checks = form ? $$("input[name=svc]", form) : [];
  const nameOf = Object.fromEntries(checks.map((c) => [c.value, c.dataset.name]));
  const short = Object.fromEntries(checks.map((c) => [c.value, c.nextElementSibling.textContent]));
  const picked = new Set();
  const draft = store.get("e-draft-36") || {};
  (draft.svc || []).forEach((id) => nameOf[id] && picked.add(id));
  const sync = () => {
    $$("[data-e-svc]").forEach((el) => {
      const on = picked.has(el.dataset.eSvc);
      if (el.classList.contains("e-z")) el.classList.toggle("is-on", on);
      el.setAttribute("aria-pressed", String(on));
    });
    checks.forEach((c) => (c.checked = picked.has(c.value)));
    const list = $("[data-e-picked]");
    if (list) list.innerHTML = picked.size ? [...picked].map((id) => `<li>${nameOf[id]}<button type="button" data-e-del="${id}" aria-label="Убрать: ${nameOf[id]}">${ico("close")}</button></li>`).join("") : `<li class="e-empty">Пока ничего не выбрано</li>`;
    const cnt = $("[data-e-count]"); if (cnt) cnt.textContent = "выбрано: " + picked.size;
    const n = $("[data-e-start-n]"); if (n) { n.hidden = !picked.size; n.textContent = picked.size; }
    if (picked.size) { const err = $("[data-e-err=svc]"); if (err) err.hidden = true; }
    compose();
  };
  const toggle = (id) => { if (!nameOf[id]) return; picked.has(id) ? picked.delete(id) : picked.add(id); sync(); };
  document.addEventListener("click", (e) => {
    const del = e.target.closest("[data-e-del]"); if (del) { picked.delete(del.dataset.eDel); sync(); return; }
    const t = e.target.closest("[data-e-svc]"); if (t && !t.matches("input")) toggle(t.dataset.eSvc);
  });
  document.addEventListener("keydown", (e) => {
    const z = e.target.closest && e.target.closest(".e-z");
    if (z && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); toggle(z.dataset.eSvc); }
  });
  checks.forEach((c) => c.addEventListener("change", () => { c.checked ? picked.add(c.value) : picked.delete(c.value); sync(); }));

  // слои схемы
  const stage = $("[data-e-scheme]");
  $$("[data-e-layer]").forEach((b) => b.addEventListener("click", () => {
    stage.dataset.layer = b.dataset.eLayer;
    $$("[data-e-layer]").forEach((x) => x.setAttribute("aria-selected", String(x === b)));
  }));

  // подсветка услуг под курсором
  const svcSec = $(".e-services");
  if (svcSec && matchMedia("(hover: hover)").matches) svcSec.addEventListener("pointermove", (e) => {
    const r = svcSec.getBoundingClientRect(); svcSec.style.setProperty("--mx", (e.clientX - r.left) + "px"); svcSec.style.setProperty("--my", (e.clientY - r.top) + "px");
  });

  // ---------- закон о тонировке: общий ответ для переключателя и теста
  const verdict = (zone, v) => {
    if (zone === "rear") return ["ok", "Можно", "Для задних боковых и заднего стекла ограничений по светопропусканию нет, если есть два наружных зеркала."];
    if (v < 70) return ["no", "Нельзя по закону", "Лобовое и передние боковые должны пропускать не менее 70% света (ТР ТС 018/2011). Штраф – 500 ₽."];
    return ["warn", "Можно, если итог не ниже 70%", "Заводское стекло тоже затемняет: со светлой атермальной плёнкой итог проверяют на готовом стекле."];
  };
  const paintVerdict = (box, [k, t, p]) => { box.classList.remove("is-ok", "is-no", "is-warn"); box.classList.add("is-" + k); $("b", box).textContent = t; $("p", box).textContent = p; };

  // ---------- переключатель затемнения
  const tintBox = $("[data-e-tint]");
  if (tintBox) {
    const st = { rear: 15, front: 80, wind: 80 }; let zone = "rear";
    const SV = { rear: ["t-rear", "Задняя полусфера"], front: ["t-front", "Передние боковые"], wind: ["t-wind", "Лобовое стекло"] };
    const op = (v) => Math.min(.97, Math.pow(1 - v / 100, .85) * .97);
    const addBtn = $("[data-e-tint-add]"), vbox = $("[data-e-verdict]");
    const draw = () => {
      $$(".e-tint__f", tintBox).forEach((p) => { p.style.fillOpacity = op(st[p.dataset.eTintZone]).toFixed(2); p.classList.toggle("is-sel", p.dataset.eTintZone === zone); });
      $$("[data-e-zone]").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.eZone === zone)));
      $$("[data-e-vlt]").forEach((b) => b.setAttribute("aria-checked", String(+b.dataset.eVlt === st[zone])));
      paintVerdict(vbox, verdict(zone, st[zone]));
      addBtn.dataset.eSvc = SV[zone][0]; $("[data-e-tint-add-label]", addBtn).textContent = SV[zone][1];
      addBtn.setAttribute("aria-pressed", String(picked.has(SV[zone][0])));
    };
    $$("[data-e-zone]").forEach((b) => b.addEventListener("click", () => { zone = b.dataset.eZone; draw(); }));
    $$("[data-e-vlt]").forEach((b) => b.addEventListener("click", () => { st[zone] = +b.dataset.eVlt; draw(); }));
    draw();
  }

  // ---------- тест «Можно ли так тонировать?»
  const law = $("[data-e-law]");
  if (law) {
    let z = null, v = null; const out = $("[data-e-law-out]", law);
    const upd = () => {
      $$("[data-e-law-zone]", law).forEach((b) => b.setAttribute("aria-checked", String(b.dataset.eLawZone === z)));
      $$("[data-e-law-vlt]", law).forEach((b) => b.setAttribute("aria-checked", String(+b.dataset.eLawVlt === v)));
      if (z && v != null) paintVerdict(out, verdict(z, v));
      else if (z || v != null) { out.classList.remove("is-ok", "is-no", "is-warn"); $("b", out).textContent = z ? "Теперь выберите плёнку" : "Теперь выберите стекло"; $("p", out).textContent = "Ответ появится здесь."; }
    };
    $$("[data-e-law-zone]", law).forEach((b) => b.addEventListener("click", () => { z = b.dataset.eLawZone; upd(); }));
    $$("[data-e-law-vlt]", law).forEach((b) => b.addEventListener("click", () => { v = +b.dataset.eLawVlt; upd(); }));
  }

  // ---------- До / После
  const ba = $("[data-e-ba]");
  if (ba) {
    const range = $(".e-ba__range", ba);
    const set = (x) => ba.style.setProperty("--x", x + "%");
    range.addEventListener("input", () => set(range.value));
    $$("[data-e-ba-tab]").forEach((b) => b.addEventListener("click", () => {
      const i = b.dataset.eBaTab;
      $$("[data-e-ba-tab]").forEach((x) => x.setAttribute("aria-selected", String(x === b)));
      $$("[data-e-ba-pair]").forEach((p) => (p.hidden = p.dataset.eBaPair !== i));
      $$("[data-e-ba-cap]").forEach((p) => (p.hidden = p.dataset.eBaCap !== i));
      range.value = 50; set(50);
    }));
    // подсказка: ползунок сам качнётся один раз
    if (!reduce && "IntersectionObserver" in window) {
      const io = new IntersectionObserver((es) => { if (!es[0].isIntersecting) return; io.disconnect();
        const t0 = performance.now(); const run = (t) => { const k = Math.min(1, (t - t0) / 1800); const x = 50 + Math.sin(k * Math.PI * 2) * 22 * (1 - k); set(x.toFixed(1)); range.value = x; if (k < 1) requestAnimationFrame(run); }; requestAnimationFrame(run);
      }, { threshold: .5 });
      io.observe(ba);
    }
  }

  // ---------- шумомер: звуковая иллюстрация
  const meter = $("[data-e-noise]");
  if (meter) {
    const bars = $$(".e-meter__bars i", meter), lvlEl = $(".e-meter__lvl", meter), playBtn = $("[data-e-noise-play]", meter);
    const LV = { 60: .52, 90: .7, 110: .88 }, GAIN = { 60: .22, 90: .36, 110: .52 }, CUT = { 60: 900, 90: 1400, 110: 2100 };
    let ctx = null, src, lp, gain, an, data, playing = false, visible = false, raf = 0;
    const level = () => LV[meter.dataset.speed] * (meter.dataset.mode === "after" ? .52 : 1);
    const params = () => {
      const L = level(); meter.style.setProperty("--lvl", Math.round(L * 100));
      lvlEl.textContent = L > .66 ? "громко" : L > .42 ? "заметно" : "тихо";
      if (ctx) { const a = meter.dataset.mode === "after"; const t = ctx.currentTime;
        gain.gain.setTargetAtTime(GAIN[meter.dataset.speed] * (a ? .32 : 1), t, .25); lp.frequency.setTargetAtTime(CUT[meter.dataset.speed] * (a ? .32 : 1), t, .25); }
    };
    const start = async () => {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
        ctx = new AC(); const len = ctx.sampleRate * 3, buf = ctx.createBuffer(1, len, ctx.sampleRate), ch = buf.getChannelData(0);
        let last = 0; for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + .02 * w) / 1.02; ch[i] = last * 3.2; }
        src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
        lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.Q.value = .7;
        gain = ctx.createGain(); gain.gain.value = 0;
        an = ctx.createAnalyser(); an.fftSize = 128; data = new Uint8Array(an.frequencyBinCount);
        src.connect(lp).connect(gain).connect(an).connect(ctx.destination); src.start();
      }
      await ctx.resume(); playing = true; playBtn.setAttribute("aria-pressed", "true"); params(); loop();
    };
    const stop = () => { if (ctx) ctx.suspend(); playing = false; playBtn.setAttribute("aria-pressed", "false"); };
    playBtn.addEventListener("click", () => (playing ? stop() : start()));
    const seg = (attr, key) => $$(`[${attr}]`, meter).forEach((b) => b.addEventListener("click", () => {
      meter.dataset[key] = b.getAttribute(attr); $$(`[${attr}]`, meter).forEach((x) => x.setAttribute("aria-checked", String(x === b))); params();
    }));
    seg("data-e-noise-mode", "mode"); seg("data-e-noise-speed", "speed");
    const loop = () => {
      cancelAnimationFrame(raf); if (!visible && !playing) return;
      const t = performance.now() / 1000, L = level();
      if (playing && an) { an.getByteFrequencyData(data); bars.forEach((b, i) => b.style.setProperty("--h", Math.max(.04, (data[Math.min(data.length - 1, Math.floor(i * 1.4))] / 255) * 1.35).toFixed(2))); }
      else bars.forEach((b, i) => b.style.setProperty("--h", (L * (.35 + .4 * Math.abs(Math.sin(t * 2.1 + i * .55)) + .25 * Math.abs(Math.sin(t * 3.7 + i * 1.3))) * (1 - i / 50)).toFixed(2)));
      if (!reduce) raf = requestAnimationFrame(loop);
    };
    if ("IntersectionObserver" in window) new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible) loop(); else if (playing) stop(); }).observe(meter);
    params(); loop();
  }

  // ---------- P-R-N-D
  const gear = $(".e-gear");
  if (gear) {
    const keys = $$("[data-e-gear]", gear); let cur = 0, auto = !reduce, timer = 0, vis = false;
    const go = (i) => { cur = i; gear.style.setProperty("--k", i); keys.forEach((k, j) => k.setAttribute("aria-selected", String(j === i))); $$("[data-e-gear-panel]").forEach((p) => (p.hidden = +p.dataset.eGearPanel !== i)); };
    keys.forEach((k, i) => { k.addEventListener("click", () => { auto = false; go(i); }); k.addEventListener("keydown", (e) => { if (["ArrowDown", "ArrowRight"].includes(e.key)) { e.preventDefault(); auto = false; go((cur + 1) % keys.length); keys[cur].focus(); } if (["ArrowUp", "ArrowLeft"].includes(e.key)) { e.preventDefault(); auto = false; go((cur + keys.length - 1) % keys.length); keys[cur].focus(); } }); });
    const tick = () => { clearTimeout(timer); if (auto && vis) timer = setTimeout(() => { if (auto && vis) { go((cur + 1) % keys.length); tick(); } }, 4200); };
    if ("IntersectionObserver" in window) new IntersectionObserver((es) => { vis = es[0].isIntersecting; tick(); }, { threshold: .4 }).observe(gear);
  }

  // ---------- галерея: фильтр и просмотр
  const items = $$("[data-e-lb]");
  $$("[data-e-cat]").forEach((b) => b.addEventListener("click", () => {
    const c = b.dataset.eCat; $$("[data-e-cat]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    items.forEach((it) => it.classList.toggle("is-hidden", c !== "all" && it.dataset.cat !== c));
  }));
  const lb = $("[data-e-lbox]");
  if (lb && items.length) {
    const img = $("img", lb), cap = $("figcaption", lb), num = $("[data-e-lb-n]", lb); let list = [], i = 0;
    const show = (k) => { i = (k + list.length) % list.length; const it = list[i], src = $("img", it); img.src = src.currentSrc || src.src; img.alt = src.alt; cap.textContent = src.alt; num.textContent = (i + 1) + " / " + list.length; };
    items.forEach((it) => it.addEventListener("click", () => { list = items.filter((x) => !x.classList.contains("is-hidden")); show(list.indexOf(it)); if (lb.showModal) lb.showModal(); else lb.setAttribute("open", ""); }));
    const close = () => (lb.close ? lb.close() : lb.removeAttribute("open"));
    $("[data-e-lb-close]", lb).addEventListener("click", close);
    $("[data-e-lb-prev]", lb).addEventListener("click", () => show(i - 1));
    $("[data-e-lb-next]", lb).addEventListener("click", () => show(i + 1));
    lb.addEventListener("click", (e) => { if (e.target === lb || e.target.tagName === "FIGURE") close(); });
    lb.addEventListener("keydown", (e) => { if (e.key === "ArrowLeft") show(i - 1); if (e.key === "ArrowRight") show(i + 1); });
    let x0 = null; lb.addEventListener("pointerdown", (e) => (x0 = e.clientX)); lb.addEventListener("pointerup", (e) => { if (x0 == null) return; const dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 50) show(i + (dx < 0 ? 1 : -1)); });
  }

  // ---------- спидометры рейтинга
  const gauges = $$("[data-e-gauge]");
  const fmt = (v) => v.toFixed(1).replace(".", ",");
  const fire = (g) => { const v = +g.dataset.eGauge, num = $("[data-e-count]", g); g.style.setProperty("--v", v);
    if (reduce) { num.textContent = fmt(v); return; } const t0 = performance.now(); const run = (t) => { const k = Math.min(1, (t - t0) / 1600); num.textContent = fmt(v * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(run); }; requestAnimationFrame(run); };
  if ("IntersectionObserver" in window) { const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { fire(e.target); io.unobserve(e.target); } }), { threshold: .4 }); gauges.forEach((g) => io.observe(g)); } else gauges.forEach(fire);

  // ---------- запись
  let message = "";
  function compose() {
    if (!form) return;
    const v = (n) => (form.elements[n] && form.elements[n].value || "").trim();
    const day = $("[data-e-days] input:checked"), time = $("[data-e-times] input:checked");
    const car = [v("car"), v("body") && v("body").toLowerCase()].filter(Boolean).join(", ");
    const lines = ["Здравствуйте! Хочу записаться в «Черное Солнце»."];
    lines.push("Услуги: " + (picked.size ? [...picked].map((id) => nameOf[id]).join("; ") : "уточню"));
    if (car) lines.push("Машина: " + car);
    lines.push("Когда удобно: " + (day ? day.dataset.full : "уточню") + (time && time.value ? ", " + time.value : ", любое время"));
    if (v("name")) lines.push("Меня зовут " + v("name") + ".");
    if (v("note")) lines.push("Комментарий: " + v("note"));
    message = lines.join("\n");
    const out = $("[data-e-msg]"); if (out) out.textContent = message;
    store.set("e-draft-36", { svc: [...picked], car: v("car"), body: v("body"), name: v("name"), note: v("note") });
  }
  if (form && hours) {
    ["car", "body", "name", "note"].forEach((n) => { if (draft[n] && form.elements[n]) form.elements[n].value = draft[n]; });
    const daysBox = $("[data-e-days]"), timesBox = $("[data-e-times]");
    const wd = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"], mon = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
    const now = new Date(Date.now() + (hours.tz * 60 + new Date().getTimezoneOffset()) * 60000);
    const slots = []; for (let h = hours.open; h < hours.close; h++) slots.push(h + ":00");
    let made = 0;
    for (let i = 0; made < 10 && i < 21; i++) {
      const d = new Date(now); d.setDate(now.getDate() + i);
      if (!hours.days.includes(d.getDay())) continue;
      if (i === 0 && now.getHours() >= hours.close - 2) continue;
      const label = i === 0 ? "Сегодня" : i === 1 ? "Завтра" : wd[d.getDay()] + ", " + d.getDate() + " " + mon[d.getMonth()];
      const full = (i < 2 ? label.toLowerCase() + ", " : "") + wd[d.getDay()] + " " + d.getDate() + " " + mon[d.getMonth()];
      daysBox.insertAdjacentHTML("beforeend", `<label class="e-chip"><input type="radio" name="day" value="${i}" data-full="${full}"${made === 0 ? " checked" : ""}><span>${label}</span></label>`);
      made++;
    }
    const drawTimes = () => {
      const d = $("input:checked", daysBox); const today = d && d.value === "0"; const nowH = now.getHours() + now.getMinutes() / 60;
      timesBox.innerHTML = `<label class="e-chip"><input type="radio" name="time" value="" checked><span>Любое время</span></label>` + slots.map((t) => { const past = today && parseInt(t, 10) <= nowH + 1; return `<label class="e-chip"><input type="radio" name="time" value="${t}"${past ? " disabled" : ""}><span>${t}</span></label>`; }).join("");
    };
    daysBox.addEventListener("change", () => { drawTimes(); compose(); });
    form.addEventListener("input", compose); form.addEventListener("change", (e) => { if (e.target.name !== "svc") compose(); });
    drawTimes();

    const copy = async (t) => { try { await navigator.clipboard.writeText(t); return true; } catch (_) { const ta = document.createElement("textarea"); ta.value = t; ta.style.cssText = "position:fixed;opacity:0"; document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand("copy"); } catch (_) {} ta.remove(); return ok; } };
    $$("[data-e-send]", form).forEach((b) => b.addEventListener("click", async () => {
      if (!picked.size) { const err = $("[data-e-err=svc]"); err.hidden = false; err.closest("fieldset").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" }); return; }
      compose(); const ok = await copy(message);
      const note = $("[data-e-copied]"); note.hidden = false; note.textContent = ok ? "Текст скопирован – вставьте его в чат и отправьте." : "Скопируйте текст сообщения выше и вставьте его в чат.";
      setTimeout(() => (note.hidden = true), 6000);
      window.open(b.dataset.eSend === "tg" ? body.dataset.eTg : body.dataset.eVk, "_blank", "noopener");
    }));

    // фары загораются у кнопок отправки
    const lamps = $("[data-e-lamps]");
    if (lamps) {
      $$(".e-send > *", form).forEach((b) => { ["pointerenter", "focus"].forEach((ev) => b.addEventListener(ev, () => lamps.classList.add("is-on"))); ["pointerleave", "blur"].forEach((ev) => b.addEventListener(ev, () => lamps.classList.remove("is-on"))); });
      if (matchMedia("(hover: none)").matches && "IntersectionObserver" in window) new IntersectionObserver((es) => lamps.classList.toggle("is-on", es[0].isIntersecting), { threshold: .9 }).observe(lamps);
    }
  }
  sync();

  // ---------- кнопка START и звонок прячутся у формы записи
  const startBtn = $("[data-e-start]"), call = $(".e-call"), zap = $("#zapis");
  if (zap && "IntersectionObserver" in window) new IntersectionObserver((es) => { const on = es[0].isIntersecting; startBtn && startBtn.classList.toggle("is-away", on); call && call.classList.toggle("is-away", on); }, { threshold: .15 }).observe(zap);

  // ---------- карта: только с подтверждённым адресом
  const mapBox = $("[data-e-map]");
  if (mapBox && mapBox.dataset.confirmed === "1" && mapBox.dataset.lat && mapBox.dataset.lon) {
    const { lat, lon } = mapBox.dataset;
    // карту грузим, когда блок дошёл до экрана; только тогда же запускаем таймер «не загрузилась»
    const src = `https://yandex.ru/map-widget/v1/?ll=${lon}%2C${lat}&z=16&pt=${lon}%2C${lat}%2Cpm2orgl&l=map`;
    const fail = (fr) => { if (fr) fr.remove(); mapBox.classList.remove("is-live"); $("[data-e-map-title]", mapBox).textContent = "Карта не загрузилась"; $("[data-e-map-text]", mapBox).textContent = "Откройте адрес в 2ГИС или позвоните – подскажем, как проехать."; };
    const mount = async () => {
      // виджет может быть заблокирован (сеть, блокировщик): сначала проверяем, что Яндекс отвечает
      try { const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 8000); await fetch(src, { mode: "no-cors", signal: ctl.signal }); clearTimeout(t); } catch (_) { fail(); return; }
      const fr = document.createElement("iframe");
      fr.title = "Карта Яндекса: " + mapBox.dataset.title; fr.allowFullscreen = true; fr.src = src;
      let done = false;
      fr.addEventListener("load", () => { done = true; mapBox.classList.add("is-live"); });
      setTimeout(() => { if (!done) fail(fr); }, 9000);
      mapBox.appendChild(fr);
    };
    if ("IntersectionObserver" in window) { const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { io.disconnect(); mount(); } }, { rootMargin: "300px 0px" }); io.observe(mapBox); } else mount();
  }
})();
