(function () {
  'use strict';
  var R = window.RADAR;
  if (!R) return;
  var $ = function (id) { return document.getElementById(id); };
  var rows = R.rows;
  var bySlug = {};
  var kindOrder = {};
  var chainNames = {};
  var state = { view: 'board', kind: '', chain: '', house: false, q: '', sort: 'implied', dir: 'desc', slug: '', basket: [] };
  rows.forEach(function (r) { bySlug[r.slug] = r; });
  R.kinds.forEach(function (k, i) { kindOrder[k.kind] = i; });

  var PALETTE = ['#e8a33d', '#6e9bc5', '#d0503b', '#a3b274', '#c9b47e', '#8ea89a', '#d8c6a0', '#b98b6a'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var SORT_DIR = { rank: 'asc', name: 'asc', kind: 'asc', tvl: 'desc', growth: 'desc', age: 'desc', implied: 'desc' };
  var SOURCE_LABEL = { kind: 'kind median', 'kind-haircut': 'kind median, group cap', group: 'group median', fallback: 'group fallback' };
  var ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

  function esc(value) { return String(value).replace(/[&<>"']/g, function (ch) { return ESC[ch]; }); }
  function trimZero(text) { return text.replace(/\.0$/, ''); }
  function usd(n) {
    if (typeof n !== 'number' || !isFinite(n)) return '—';
    var abs = Math.abs(n);
    if (abs >= 1e9) return '$' + trimZero((n / 1e9).toFixed(1)) + 'B';
    if (abs >= 1e6) return '$' + trimZero((n / 1e6).toFixed(1)) + 'M';
    if (abs >= 1e3) return '$' + trimZero((n / 1e3).toFixed(1)) + 'K';
    return '$' + Math.round(n);
  }
  function pct(n) {
    if (typeof n !== 'number' || !isFinite(n)) return '—';
    return (n > 0 ? '+' : '') + n.toFixed(1) + '%';
  }
  function ageText(days) {
    if (days === null || days === undefined) return 'Unknown';
    if (days < 60) return days + ' days';
    if (days < 730) return trimZero((days / 365).toFixed(1)) + ' yr';
    return Math.round(days / 365) + ' yr';
  }
  function chainShort(chains) {
    if (!chains || chains.length === 0) return '—';
    var first = chains.slice(0, 2).join(', ');
    return chains.length > 2 ? first + ' +' + (chains.length - 2) : first;
  }
  function growthClass(n) { return typeof n !== 'number' ? 'flat' : n > 0 ? 'up' : n < 0 ? 'down' : 'flat'; }
  function colorOf(kind) { var i = kindOrder[kind]; return PALETTE[(i === undefined ? 0 : i) % PALETTE.length]; }
  function multText(n) { return n.toFixed(3) + '×'; }
  function pad(n) { return String(n).padStart(2, '0'); }
  function money2(n) { return '$' + (Math.round(n * 100) / 100).toFixed(2); }
  function basketHas(slug) { return state.basket.indexOf(slug) >= 0; }
  function basketRows() { return state.basket.map(function (slug) { return bySlug[slug]; }).filter(Boolean); }
  function storeBasket() {
    try { localStorage.setItem('prelaunch-atlas-basket', state.basket.join(',')); } catch (err) { /* private mode */ }
  }
  function loadBasket() {
    try {
      return (localStorage.getItem('prelaunch-atlas-basket') || '').split(',').filter(function (slug) { return bySlug[slug]; });
    } catch (err) { return []; }
  }
  function toggleBasket(slug) {
    if (!bySlug[slug]) return;
    var i = state.basket.indexOf(slug);
    if (i >= 0) state.basket.splice(i, 1);
    else state.basket.push(slug);
    storeBasket();
    refresh({ scroll: 'keep' });
  }

  function seedArt() {
    var ticks = '';
    for (var x = 52; x <= 268; x += 12) ticks += '<path d="M' + x + ' 152 l-3 7"/>';
    return '<svg class="seed-art" viewBox="0 0 320 200" aria-hidden="true" focusable="false">' +
      '<g fill="none" stroke="#1b3a2c" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M44 148 H276" stroke-width="1.7"/>' +
      '<g stroke-width="1" opacity="0.4">' + ticks + '</g>' +
      '<g stroke-width="0.9" opacity="0.5">' +
      '<path d="M160 149 C157 158 152 166 148 174"/><path d="M160 149 C163 159 168 167 173 175"/>' +
      '<path d="M108 149 C106 156 103 161 100 166"/><path d="M108 149 C110 156 113 161 116 166"/>' +
      '<path d="M214 149 C212 156 209 161 206 166"/><path d="M214 149 C216 156 219 161 222 166"/>' +
      '</g>' +
      '<path d="M108 148 C106 134 109 120 107 108"/>' +
      '<path d="M108 128 C97 125 91 116 94 108 C102 111 107 119 108 128 Z" fill="var(--packet)"/>' +
      '<path d="M108 119 C119 116 124 108 121 101 C113 104 109 111 108 119 Z" fill="var(--packet)"/>' +
      '<circle cx="107" cy="103" r="5" fill="var(--packet)"/>' +
      '<path d="M160 148 C157 128 162 104 160 82"/>' +
      '<path d="M160 116 C145 112 138 100 141 90 C151 93 158 104 160 116 Z" fill="var(--packet)"/>' +
      '<path d="M160 104 C175 100 182 88 179 78 C169 81 162 92 160 104 Z" fill="var(--packet)"/>' +
      '<circle cx="160" cy="77" r="7" fill="var(--packet)"/>' +
      '<path d="M214 148 C216 136 212 124 214 114"/>' +
      '<path d="M214 130 C203 127 198 118 200 111 C208 114 212 121 214 130 Z" fill="var(--packet)"/>' +
      '<path d="M214 121 C225 118 230 110 228 103 C220 106 216 113 214 121 Z" fill="var(--packet)"/>' +
      '<circle cx="213" cy="108" r="5.5" fill="var(--packet)"/>' +
      '<g transform="translate(246 54)" opacity="0.8"><circle r="9"/><path d="M0 -18 V-13 M0 13 V18 M-18 0 H-13 M13 0 H18 M-13 -13 l3.5 3.5 M9.5 9.5 l3.5 3.5 M-13 13 l3.5 -3.5 M9.5 -9.5 l3.5 -3.5" stroke-width="1.2"/></g>' +
      '</g></svg>';
  }

  function packetHTML(row, linked) {
    var color = colorOf(row.kind);
    var open = linked
      ? '<a class="packet" href="?view=detail&slug=' + encodeURIComponent(row.slug) + '" style="--packet:' + color + '">'
      : '<div class="packet packet-static" style="--packet:' + color + '">';
    var close = linked ? '</a>' : '</div>';
    return open +
      '<div class="packet-band"></div>' +
      '<div class="packet-inner">' +
      '<div class="packet-top"><span>Lot ' + pad(row.rank) + '</span><span class="stamp' + (row.watchlist ? '' : ' early') + '">' + (row.watchlist ? 'House selection' : 'Field trial') + '</span></div>' +
      '<p class="packet-name">' + esc(row.name) + '</p>' +
      '<p class="packet-kind">' + esc(row.kind) + '</p>' +
      '<div class="packet-yield"><span>Expected yield · implied</span><strong>' + usd(row.implied_value_usd) + '</strong><small>if a token launches</small></div>' +
      seedArt() +
      '<div class="packet-foot"><span>' + esc(chainShort(row.chains)) + '</span><span class="open">' + (linked ? 'Open the plate' : 'Plate ' + pad(row.rank)) + '</span></div>' +
      '</div>' + close;
  }

  function rowHTML(row) {
    var stamp = '<span class="stamp' + (row.watchlist ? '' : ' early') + '">' + (row.watchlist ? 'House' : 'Field trial') + '</span>';
    var added = basketHas(row.slug);
    return '<tr>' +
      '<td class="col-lot"><span class="lot">' + row.rank + '</span></td>' +
      '<td class="col-name"><a class="row-name" href="?view=detail&slug=' + encodeURIComponent(row.slug) + '">' + esc(row.name) + '</a><span class="row-slug">' + esc(row.slug) + stamp + '</span></td>' +
      '<td class="col-kind"><span class="kind-cell"><i class="kind-dot" style="background:' + colorOf(row.kind) + '"></i>' + esc(row.kind) + '</span></td>' +
      '<td class="col-chains"><span class="chains-cell">' + esc(chainShort(row.chains)) + '</span></td>' +
      '<td class="col-tvl num tvl">' + usd(row.tvl_usd) + '</td>' +
      '<td class="col-vigor num growth ' + growthClass(row.change_7d) + '">' + pct(row.change_7d) + '</td>' +
      '<td class="col-age num age">' + ageText(row.age_days) + '</td>' +
      '<td class="col-yield num"><span class="yield">' + usd(row.implied_value_usd) + '<small>implied</small></span></td>' +
      '<td class="col-farm"><span class="farm-actions"><a class="farm-link" href="?view=detail&slug=' + encodeURIComponent(row.slug) + '" data-scroll="plan">Plan</a><button type="button" class="basket-add' + (added ? ' is-in' : '') + '" data-add="' + esc(row.slug) + '" aria-pressed="' + (added ? 'true' : 'false') + '" aria-label="' + (added ? 'Remove ' + esc(row.name) + ' from' : 'Add ' + esc(row.name) + ' to') + ' the seed order">' + (added ? '✓' : '+') + '</button></span></td>' +
      '</tr>';
  }

  function liveHTML(row, i) {
    var kind = row.category || 'Uncategorised';
    return '<tr>' +
      '<td class="col-lot num">' + (i + 1) + '</td>' +
      '<td class="col-name"><span class="row-name">' + esc(row.name) + '</span><span class="row-slug">' + esc(row.slug) + '</span></td>' +
      '<td class="col-kind"><span class="kind-cell">' + esc(kind) + '</span></td>' +
      '<td class="col-chains"><span class="chains-cell">' + esc(chainShort(row.chains)) + '</span></td>' +
      '<td class="col-tvl num tvl">' + usd(row.tvl_usd) + '</td>' +
      '<td class="col-tvl num tvl">' + usd(row.mcap_usd) + '</td>' +
      '<td class="col-vigor num growth ' + growthClass(row.change_7d) + '">' + pct(row.change_7d) + '</td>' +
      '</tr>';
  }

  function factor(label, reading, value) {
    return '<div class="factor"><span class="factor-label">' + esc(label) + '</span><span class="factor-reading">' + esc(reading) + '</span><span class="factor-mult">' + esc(value) + '</span></div>';
  }

  function render() {
    var view = state.view;
    document.body.setAttribute('data-view', view);
    $('top').hidden = view !== 'board' && view !== 'live';
    $('ledger').hidden = view !== 'board' && view !== 'live' && view !== 'screened';
    $('filters').hidden = view !== 'board';
    $('result-count').hidden = view !== 'board';
    $('board-wrap').hidden = view !== 'board';
    $('empty-board').hidden = true;
    $('live-panel').hidden = view !== 'live';
    $('screened-panel').hidden = view !== 'screened';
    $('detail').hidden = view !== 'detail';
    $('method').hidden = view !== 'method';
    if (view === 'board') renderBoard();
    else if (view === 'live') renderLive();
    else if (view === 'screened') renderScreened();
    else if (view === 'detail') renderDetail();
    else renderMethod();
    syncTabs();
    renderBasket();
    var row = view === 'detail' ? bySlug[state.slug] : null;
    document.title = view === 'detail' && row ? row.name + ' — Prelaunch Atlas'
      : view === 'method' ? 'How the yield is built — Prelaunch Atlas'
      : view === 'live' ? 'Live tokens — Prelaunch Atlas'
      : view === 'screened' ? 'Screened out — Prelaunch Atlas'
      : 'Prelaunch Atlas — protocols before their token';
  }

  function renderBoard() {
    var q = state.q.trim().toLowerCase();
    var shown = rows.filter(function (row) {
      if (state.kind && row.kind !== state.kind) return false;
      if (state.chain && row.chains.indexOf(state.chain) < 0) return false;
      if (state.house && !row.watchlist) return false;
      if (q && (row.name + ' ' + row.slug + ' ' + row.kind + ' ' + row.group).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    shown = sortRows(shown);
    $('board-body').innerHTML = shown.map(rowHTML).join('');
    var has = shown.length > 0;
    $('board-wrap').hidden = !has;
    $('empty-board').hidden = has;
    var active = [];
    if (state.house) active.push('house selection');
    if (state.kind) active.push('kind: ' + state.kind);
    if (state.chain) active.push('chain: ' + state.chain);
    if (q) active.push('search: “' + state.q.trim() + '”');
    $('result-count').innerHTML = 'Showing <b>' + shown.length + '</b> of ' + rows.length + ' varieties · ' + (active.length ? esc(active.join(' · ')) : 'house selection and field trials');
    var ths = $('board-table').querySelectorAll('thead th');
    Array.prototype.forEach.call(ths, function (th) { th.removeAttribute('aria-sort'); });
    var activeBtn = $('board-table').querySelector('thead [data-sort="' + state.sort + '"]');
    if (activeBtn) activeBtn.parentNode.setAttribute('aria-sort', state.dir === 'asc' ? 'ascending' : 'descending');
  }

  function sortRows(list) {
    var key = state.sort;
    var dir = state.dir === 'asc' ? 1 : -1;
    return list.slice().sort(function (a, b) {
      var av, bv;
      if (key === 'name') return a.name.localeCompare(b.name) * dir || a.rank - b.rank;
      if (key === 'kind') return a.kind.localeCompare(b.kind) * dir || a.rank - b.rank;
      if (key === 'rank') return (a.rank - b.rank) * dir;
      if (key === 'tvl') { av = a.tvl_usd; bv = b.tvl_usd; }
      else if (key === 'growth') { av = a.change_7d === null ? -1e9 : a.change_7d; bv = b.change_7d === null ? -1e9 : b.change_7d; }
      else if (key === 'age') { av = a.age_days === null ? -1 : a.age_days; bv = b.age_days === null ? -1 : b.age_days; }
      else { av = a.implied_value_usd; bv = b.implied_value_usd; }
      return (av - bv) * dir || a.rank - b.rank;
    });
  }

  function renderLive() {
    var body = $('live-body');
    if (body.childElementCount === 0) body.innerHTML = R.live.map(liveHTML).join('');
    $('live-count').textContent = 'Showing ' + R.live_shown + ' of ' + R.live_size + ' live protocols · largest market cap first';
  }

  function renderScreened() {
    var list = R.screened || [];
    var body = $('screened-body');
    if (body.childElementCount === 0) {
      body.innerHTML = list.map(function (row) {
        return '<tr>' +
          '<td class="col-name"><span class="row-name">' + esc(row.name) + '</span><span class="row-slug">' + esc(row.slug) + '</span></td>' +
          '<td class="col-kind"><span class="kind-cell">' + esc(row.category || 'Uncategorised') + '</span></td>' +
          '<td class="col-chains"><span class="chains-cell">' + esc(chainShort(row.chains)) + '</span></td>' +
          '<td class="col-tvl num tvl">' + usd(row.tvl_usd) + '</td>' +
          '<td class="col-why"><span class="reason">' + esc(row.reason) + '</span></td>' +
          '</tr>';
      }).join('');
    }
    $('screened-count').innerHTML = 'Showing <b>' + list.length + '</b> pre-token protocols set aside · <b>' + R.board_size + '</b> ranked · <b>' + R.pre_size + '</b> on record';
  }

  function renderBasket() {
    var list = basketRows();
    var bar = $('basket-bar');
    var has = list.length > 0;
    bar.hidden = !has;
    document.body.classList.toggle('has-basket', has);
    if (!has) { $('basket-drawer').hidden = true; return; }
    var capital = 0, gas = 0, setup = 0, hold = 0, implied = 0;
    list.forEach(function (row) {
      capital += row.capital_usd || 0;
      gas += row.gas_usd || 0;
      setup += row.setup_minutes || 0;
      hold = Math.max(hold, row.hold_days || 0);
      implied += row.implied_value_usd || 0;
    });
    $('basket-count').textContent = list.length + (list.length === 1 ? ' lot' : ' lots');
    $('basket-capital').textContent = usd(capital);
    $('basket-gas').textContent = money2(gas);
    $('basket-hold').textContent = hold ? hold + ' days' : '—';
    $('basket-setup').textContent = setup + ' min';
    $('basket-implied').textContent = usd(implied);
    $('basket-cover').textContent = capital > 0 ? Math.round(implied / capital).toLocaleString('en-US') + '×' : '—';
    if (!$('basket-drawer').hidden) renderBasketList(list);
  }

  function renderBasketList(list) {
    $('basket-list').innerHTML = list.map(function (row) {
      return '<div class="basket-line"><div><span class="basket-lot">Lot ' + pad(row.rank) + '</span><strong>' + esc(row.name) + '</strong><small>' + esc(row.kind) + ' · ' + usd(row.capital_usd) + ' capital · ' + money2(row.gas_usd) + ' gas · ' + row.hold_days + ' days</small></div><button type="button" class="basket-remove" data-remove="' + esc(row.slug) + '" aria-label="Remove ' + esc(row.name) + '">Remove</button></div>';
    }).join('');
  }

  function readinessHTML(row) {
    var aboveFloor = row.tvl_usd >= R.floor_usd;
    var age = row.age_days;
    var ageState = age === null ? 'No date' : age >= 730 ? 'Long' : age >= 365 ? 'Building' : 'New';
    var ageTone = age !== null && age >= 365 ? 'is-met' : 'is-watch';
    var growth = row.change_7d;
    var growthState = growth === null ? 'No 7D' : growth > 0 ? 'Up' : growth < 0 ? 'Down' : 'Flat';
    var growthTone = growth !== null && growth > 0 ? 'is-met' : 'is-watch';
    var chainState = row.chains.length > 1 ? 'Multi' : row.chains.length === 1 ? 'Single' : 'No chain';
    var chainTone = row.chains.length > 1 ? 'is-met' : 'is-watch';
    var multipleState = row.multiple_n >= 4 ? 'Full' : row.multiple_n > 0 ? 'Thin' : 'Fallback';
    var multipleTone = row.multiple_n >= 4 ? 'is-met' : 'is-watch';
    var multipleBody = row.multiple_n === 0
      ? multText(row.multiple) + ' · no live comparable.'
      : multText(row.multiple) + ' · ' + row.multiple_n + ' live ' + (row.multiple_n === 1 ? 'comparable' : 'comparables') + '.';
    function item(tone, state, title, body) {
      return '<li><span class="check-mark ' + tone + '">' + state + '</span><div class="check-body"><strong>' + title + '</strong><span>' + body + '</span></div></li>';
    }
    return '<aside class="readiness" aria-labelledby="readiness-title">' +
      '<h2 id="readiness-title">Launch readiness</h2>' +
      '<p class="readiness-intro">Six snapshot signals, then three checks the radar cannot make for you.</p>' +
      '<div class="readiness-part"><h3>From the snapshot</h3><ul class="readiness-list">' +
      item('is-met', 'Met', 'No token on record', 'gecko_id and symbol are null.') +
      item(aboveFloor ? 'is-met' : 'is-watch', aboveFloor ? 'Above' : 'Below', 'TVL against the floor', usd(row.tvl_usd) + ' TVL · floor ' + usd(R.floor_usd) + '.') +
      item(ageTone, ageState, 'Years in field', age === null ? 'No start date recorded.' : ageText(age) + ' · ' + age.toLocaleString('en-US') + ' days.') +
      item(growthTone, growthState, 'Vigor · 7D', growth === null ? 'No seven-day change reported.' : pct(growth) + ' over seven days.') +
      item(chainTone, chainState, 'In the field', row.chains.length ? row.chains.length + ' chains · ' + esc(chainShort(row.chains)) + '.' : 'No chain recorded.') +
      item(multipleTone, multipleState, 'Kind multiple', multipleBody) +
      '</ul></div>' +
      '<div class="readiness-part"><h3>Check yourself</h3><ul class="readiness-list">' +
      item('is-manual', 'Manual', 'Points or claim page', 'Official page; read the terms and snapshot dates.') +
      item('is-manual', 'Manual', 'Contract and address', 'Match docs and a block explorer.') +
      item('is-manual', 'Manual', 'Wallet hygiene', 'Fresh wallet; seed offline; revoke approvals.') +
      '</ul></div>' +
      '<p class="readiness-note">Snapshot signals are the record’s own, not a score. Manual items are not checked. No item predicts a token or eligibility.</p>' +
      '</aside>';
  }

  function renderDetail() {
    var row = bySlug[state.slug];
    if (!row) { state.view = 'board'; render(); return; }
    var color = colorOf(row.kind);
    var v0 = row.tvl_usd;
    var v1 = v0 * row.multiple;
    var v2 = v1 * row.growth_mult;
    var v3 = v2 * row.maturity_mult;
    var v4 = v3 * row.distribution_mult;
    var src = SOURCE_LABEL[row.multiple_source] || row.multiple_source;
    var stamp = row.watchlist ? 'House selection' : 'Field trial';
    var added = basketHas(row.slug);
    var top = '<div class="detail-top"><span>Plate ' + pad(row.rank) + ' of ' + R.board_size + ' · ' + stamp + '</span><a class="back" href="?view=board">Back to the ledger</a></div>';
    var record = '<article class="detail-record" aria-labelledby="detail-name">' +
      '<p class="detail-kind"><i class="kind-dot" style="background:' + color + '"></i>' + esc(row.kind) + ' · ' + esc(row.group) + '</p>' +
      '<h1 class="detail-name" id="detail-name">' + esc(row.name) + '</h1>' +
      '<p class="detail-slug">' + esc(row.slug) + ' · no token on record</p>' +
      '<div class="detail-yield"><span>Expected yield · implied</span><strong>' + usd(row.implied_value_usd) + '</strong><small>if a token launches</small></div>' +
      '<button type="button" class="basket-toggle' + (added ? ' is-in' : '') + '" data-add="' + esc(row.slug) + '" aria-pressed="' + (added ? 'true' : 'false') + '">' + (added ? 'In the seed order' : 'Add to the seed order') + '</button>' +
      '<dl class="record">' +
      '<div><dt>Acreage · TVL</dt><dd>' + usd(row.tvl_usd) + '</dd></div>' +
      '<div><dt>Vigor · 7D</dt><dd><span class="growth ' + growthClass(row.change_7d) + '">' + pct(row.change_7d) + '</span></dd></div>' +
      '<div><dt>Years in field</dt><dd>' + ageText(row.age_days) + (row.age_days !== null ? ' · ' + row.age_days.toLocaleString('en-US') + ' days' : '') + '</dd></div>' +
      '<div><dt>In the field</dt><dd>' + esc(row.chains.length ? row.chains.join(', ') : 'not recorded') + '</dd></div>' +
      '<div><dt>Kind multiple</dt><dd>' + multText(row.multiple) + ' · ' + esc(src) + '</dd></div>' +
      '<div><dt>House selection</dt><dd>' + (row.watchlist ? 'Yes' : 'No · field trial') + '</dd></div>' +
      '</dl>' +
      '<div class="waterfall"><h2>Expected yield, step by step <span>the arithmetic</span></h2>' +
      factor('Acreage · TVL', usd(row.tvl_usd), usd(v0)) +
      factor('Kind multiple', multText(row.multiple) + ' · ' + row.multiple_n + ' live', usd(v1)) +
      factor('Vigor · 7D', pct(row.change_7d), usd(v2)) +
      factor('Years in field', ageText(row.age_days), usd(v3)) +
      factor('Distribution', row.chains.length + (row.chains.length === 1 ? ' chain' : ' chains'), usd(v4)) +
      '<div class="waterfall-total"><span>Implied value</span><strong>' + usd(row.implied_value_usd) + '</strong></div>' +
      '<p class="formula-line">TVL × kind multiple × vigor × years in field × distribution. Rounded to the nearest dollar.</p>' +
      '</div>' +
      '</article>';
    var side = '<div class="plate-side">' + packetHTML(row, false) +
      '<div class="comparables"><p class="comparables-title">The kind multiple</p><p>' + esc(row.multiple_basis) + '</p></div>' +
      readinessHTML(row) +
      '</div>';
    var plan = '<div class="plan-column" id="plan"><h2>Sowing notes <span>farm plan</span></h2><ol class="plan">' +
      row.farm_plan.map(function (step, i) {
        return '<li class="step"><span class="step-no">' + (i + 1) + '</span><div><p class="step-text">' + esc(step.text) + '</p><p class="step-meta"><span><b>Cost</b>' + esc(step.cost) + '</span><span><b>Time</b>' + esc(step.time) + '</span></p></div></li>';
      }).join('') +
      '</ol><p class="plan-note">Written for one person with a small balance. No step promises a token or an airdrop; never pay to claim and never share a seed phrase.</p></div>';
    $('detail').innerHTML = top + '<div class="detail-grid">' + side + record + plan + '</div>';
  }

  function renderMethod() {
    var body = $('kinds-body');
    if (body.childElementCount === 0) {
      body.innerHTML = R.kinds.map(function (k) {
        return '<tr><td class="col-name"><span class="kind-cell"><i class="kind-dot" style="background:' + colorOf(k.kind) + '"></i>' + esc(k.kind) + '</span></td><td class="col-kind">' + esc(k.group) + '</td><td class="col-tvl num">' + k.n + '</td><td class="col-tvl num">' + (k.median === null ? '—' : multText(k.median)) + '</td><td class="col-yield num used">' + multText(k.value) + '</td><td class="col-farm basis-cell">' + esc(k.basis) + '</td></tr>';
      }).join('');
    }
  }

  function syncTabs() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-view-link]'), function (a) {
      a.setAttribute('aria-selected', a.getAttribute('data-view-link') === state.view ? 'true' : 'false');
    });
  }

  function syncStatic() {
    $('deck-pre').textContent = R.pre_size;
    $('deck-board').textContent = R.board_size;
    $('deck-watch').textContent = R.watchlist_size;
    $('deck-early').textContent = R.early_size;
    $('deck-screened').textContent = R.screened_size;
    $('stat-watch').textContent = R.watchlist_size;
    $('stat-pre').textContent = R.pre_size;
    $('stat-live').textContent = R.live_size;
    $('tab-board').textContent = R.board_size;
    $('tab-live').textContent = R.live_size;
    $('tab-screened').textContent = R.screened_size;
  }

  function syncControls() {
    $('kind-filter').value = state.kind;
    $('chain-filter').value = state.chain;
    $('house-filter').checked = state.house;
    var search = $('search-filter');
    if (document.activeElement !== search && search.value !== state.q) search.value = state.q;
    syncTabs();
  }

  function fillFilters() {
    var kindFilter = $('kind-filter');
    R.kinds.forEach(function (k) {
      var option = document.createElement('option');
      option.value = k.kind;
      option.textContent = k.kind;
      kindFilter.appendChild(option);
    });
    var counts = {};
    rows.forEach(function (row) { row.chains.forEach(function (chain) { counts[chain] = (counts[chain] || 0) + 1; }); });
    var names = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a] || a.localeCompare(b); });
    var chainFilter = $('chain-filter');
    names.forEach(function (name) {
      chainNames[name] = true;
      var option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      chainFilter.appendChild(option);
    });
  }

  function readParams(params) {
    var view = params.get('view');
    if (view !== 'board' && view !== 'live' && view !== 'detail' && view !== 'method' && view !== 'screened') view = 'board';
    var sort = params.get('sort');
    if (SORT_DIR[sort] === undefined) sort = 'implied';
    var dir = params.get('dir');
    if (dir !== 'asc' && dir !== 'desc') dir = SORT_DIR[sort];
    var rawBasket = params.get('basket');
    var basket = rawBasket === null ? null : rawBasket.split(',').filter(function (slug) { return bySlug[slug]; });
    return {
      view: view,
      kind: params.get('kind') || '',
      chain: params.get('chain') || '',
      house: params.get('house') === '1',
      q: (params.get('q') || '').slice(0, 100),
      sort: sort,
      dir: dir,
      slug: view === 'detail' ? (params.get('slug') || (rows[0] ? rows[0].slug : '')) : '',
      basket: basket
    };
  }

  function writeParams() {
    var params = new URLSearchParams();
    params.set('view', state.view);
    if (state.view === 'detail') params.set('slug', state.slug);
    if (state.view === 'board') {
      if (state.kind) params.set('kind', state.kind);
      if (state.chain) params.set('chain', state.chain);
      if (state.house) params.set('house', '1');
      if (state.q) params.set('q', state.q);
      if (state.sort !== 'implied' || state.dir !== 'desc') {
        params.set('sort', state.sort);
        params.set('dir', state.dir);
      }
    }
    if (state.basket.length) params.set('basket', state.basket.join(','));
    return '?' + params.toString();
  }

  function normalize() {
    if (state.kind && kindOrder[state.kind] === undefined) state.kind = '';
    if (state.chain && !chainNames[state.chain]) state.chain = '';
    if (state.view === 'detail' && !bySlug[state.slug] && rows.length > 0) state.slug = rows[0].slug;
    if (!Array.isArray(state.basket)) state.basket = [];
    state.basket = state.basket.filter(function (slug, i, list) { return bySlug[slug] && list.indexOf(slug) === i; });
  }

  function writeURL(opts) {
    if (opts.history === false) return;
    var url = writeParams();
    if (opts.push) history.pushState(null, '', url);
    else history.replaceState(null, '', url);
  }

  function scrollTo(where) {
    if (where === 'top') window.scrollTo(0, 0);
    else if (where === 'plan') { var plan = $('plan'); if (plan) plan.scrollIntoView({ block: 'start' }); }
    else if (where === 'ledger') { var ledger = $('ledger'); if (ledger) ledger.scrollIntoView({ block: 'start' }); }
  }

  function refresh(opts) {
    opts = opts || {};
    render();
    syncControls();
    writeURL(opts);
    scrollTo(opts.scroll);
  }

  function clearFilters() {
    state.kind = '';
    state.chain = '';
    state.house = false;
    state.q = '';
    refresh({ scroll: 'keep' });
  }

  function bindEvents() {
    $('filters').addEventListener('submit', function (event) { event.preventDefault(); });
    $('kind-filter').addEventListener('change', function (event) { state.kind = event.target.value; refresh({ scroll: 'keep' }); });
    $('chain-filter').addEventListener('change', function (event) { state.chain = event.target.value; refresh({ scroll: 'keep' }); });
    $('house-filter').addEventListener('change', function (event) { state.house = event.target.checked; refresh({ scroll: 'keep' }); });
    $('search-filter').addEventListener('input', function (event) { state.q = event.target.value; refresh({ scroll: 'keep' }); });
    $('reset-filters').addEventListener('click', function (event) { event.preventDefault(); clearFilters(); });
    $('basket-clear').addEventListener('click', function () { state.basket = []; storeBasket(); refresh({ scroll: 'keep' }); });
    $('basket-review').addEventListener('click', function () { $('basket-drawer').hidden = false; renderBasketList(basketRows()); });
    $('basket-close').addEventListener('click', function () { $('basket-drawer').hidden = true; });
    document.addEventListener('keydown', function (event) { if (event.key === 'Escape') $('basket-drawer').hidden = true; });
    Array.prototype.forEach.call(document.querySelectorAll('#board-table thead [data-sort]'), function (button) {
      button.addEventListener('click', function () {
        var key = button.getAttribute('data-sort');
        if (SORT_DIR[key] === undefined) return;
        if (state.sort === key) state.dir = state.dir === 'asc' ? 'desc' : 'asc';
        else { state.sort = key; state.dir = SORT_DIR[key]; }
        refresh({ scroll: 'keep' });
      });
    });
    document.addEventListener('click', function (event) {
      var el = event.target;
      if (!el || el.nodeType !== 1) return;
      var reset = el.closest('[data-reset]');
      if (reset) { event.preventDefault(); clearFilters(); return; }
      var add = el.closest('[data-add]');
      if (add) { event.preventDefault(); toggleBasket(add.getAttribute('data-add')); return; }
      var remove = el.closest('[data-remove]');
      if (remove) { event.preventDefault(); toggleBasket(remove.getAttribute('data-remove')); return; }
      var link = el.closest('a[href]');
      if (!link) return;
      var href = link.getAttribute('href');
      if (!href || href.charAt(0) !== '?') return;
      var url;
      try { url = new URL(href, location.href); } catch (err) { return; }
      if (url.origin !== location.origin) return;
      event.preventDefault();
      var prev = state.view;
      var oldBasket = state.basket.slice();
      var hasBasketParam = url.searchParams.has('basket');
      state = readParams(url.searchParams);
      if (!hasBasketParam) state.basket = oldBasket;
      normalize();
      var where = 'keep';
      if (state.view === 'detail') where = link.getAttribute('data-scroll') === 'plan' ? 'plan' : 'top';
      else if (state.view === 'method') where = 'top';
      else if (prev === 'detail' || prev === 'method') where = 'ledger';
      refresh({ push: true, scroll: where });
    });
    window.addEventListener('popstate', function () {
      var prev = state.view;
      state = readParams(new URLSearchParams(location.search));
      if (state.basket === null) state.basket = loadBasket();
      normalize();
      var where = state.view === 'detail' || state.view === 'method' ? 'top' : (prev === 'detail' || prev === 'method') ? 'ledger' : 'keep';
      refresh({ history: false, scroll: where });
    });
  }

  fillFilters();
  syncStatic();
  $('cover-plate').innerHTML = packetHTML(rows[0], true);
  bindEvents();
  state = readParams(new URLSearchParams(location.search));
  if (state.basket === null) state.basket = loadBasket();
  normalize();
  render();
  syncControls();
  history.replaceState(null, '', writeParams());
})();
