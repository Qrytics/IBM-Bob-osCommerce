/* CleanCart demo UI. Plain browser JS, no build step. */
(function () {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const el = (tag, attrs = {}, ...children) => {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else node.setAttribute(k, v);
    }
    for (const c of children) node.append(c instanceof Node ? c : document.createTextNode(String(c)));
    return node;
  };
  // Legacy display strings wrap the total in <strong>; show them as plain text.
  const plain = (html) => String(html).replace(/<\/?strong>/g, '');

  async function api(path, body) {
    const res = await fetch(path, body === undefined ? {} : {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  }

  function explainError({ status, data }) {
    if (status === 501) return el('div', { class: 'notice' }, `Not translated yet: ${data.message}`);
    if (status === 400 && data.details) {
      return el('div', { class: 'notice bad' }, 'Invalid request: ', data.details.map((d) => `${d.path || 'body'}: ${d.message}`).join('; '));
    }
    return el('div', { class: 'notice bad' }, `Error ${status}: ${data.message || 'request failed'}`);
  }

  // ---------------------------------------------------------------- equivalence
  async function loadEquivalence() {
    const { data } = await api('/api/v1/equivalence');
    const badge = $('#eq-badge');
    badge.textContent = `${data.passed.toLocaleString()} / ${data.cases.toLocaleString()} legacy cases identical`;
    badge.className = `badge ${data.equivalent ? 'ok' : data.passed === 0 ? 'bad' : ''}`;
    const box = $('#eq-modules');
    box.replaceChildren();
    for (const m of data.modules) {
      const pct = m.total ? Math.round((m.passed / m.total) * 100) : 0;
      const done = m.implemented && m.passed === m.total;
      box.append(el('div', { class: `module ${done ? '' : 'pending'}` },
        el('div', { class: 'name' }, el('span', { text: m.module }), el('span', { class: done ? 'ok' : 'muted', text: done ? '✔' : m.task })),
        el('div', { class: 'meta', text: `${m.passed}/${m.total} cases · ${m.implemented ? 'translated' : 'not translated yet'}` }),
        el('div', { class: 'bar' }, el('span', { style: `width:${pct}%` }))));
    }
  }

  // ---------------------------------------------------------------- compare
  const scenarioIndex = {};

  async function loadScenarios() {
    const { data } = await api('/api/v1/scenarios');
    const select = $('#scenario-select');
    const curated = el('optgroup', { label: 'Curated' });
    const random = el('optgroup', { label: 'Randomly generated' });
    for (const s of data.scenarios) {
      scenarioIndex[s.name] = s;
      (s.curated ? curated : random).append(el('option', { value: s.name, text: s.name }));
    }
    select.append(curated, random);
    select.addEventListener('change', () => compare(select.value));
    const initial = scenarioIndex['ca-qc-compound-inclusive'] ? 'ca-qc-compound-inclusive' : data.scenarios[0]?.name;
    if (initial) {
      select.value = initial;
      compare(initial);
    }
  }

  function totalsTable(legacyLines, modernLines) {
    const rows = legacyLines.map((l, i) => {
      const m = modernLines ? modernLines[i] : null;
      const same = m && plain(m.text) === plain(l.text) && m.title === l.title;
      return el('tr', {},
        el('td', { text: l.title }),
        el('td', { class: 'num', text: plain(l.text) }),
        el('td', { class: 'num', text: m ? plain(m.text) : '—' }),
        el('td', { class: same ? 'ok' : 'bad', text: m ? (same ? '✔' : '✘') : '' }));
    });
    return el('div', { class: 'scroll' }, el('table', {},
      el('thead', {}, el('tr', {}, el('th', { text: 'Line' }), el('th', { class: 'num', text: 'Legacy PHP' }), el('th', { class: 'num', text: 'Modern API' }), el('th', { text: '' }))),
      el('tbody', {}, ...rows)));
  }

  function facts(result) {
    const f = (k, v) => el('div', { class: 'fact' }, el('div', { class: 'k', text: k }), el('div', { class: 'v', text: String(v) }));
    const info = result.orderAfterTotals;
    return el('div', { class: 'facts' },
      f('Cart total (cart page)', result.cart.total),
      f('Order subtotal', info.subtotal),
      f('Tax', info.tax),
      f('Shipping', `${info.shippingMethod || '—'} · ${info.shippingCost}`),
      f('Boxes × weight', `${result.shipment.numBoxes} × ${result.shipment.shippingWeight}`),
      f('Free shipping offered', result.freeShippingOffered),
      f('Order total (raw)', info.total));
  }

  async function compare(name) {
    $('#scenario-desc').textContent = scenarioIndex[name]?.description || '';
    const out = $('#compare-result');
    out.replaceChildren(el('p', { class: 'muted', text: 'Running…' }));
    const res = await api(`/api/v1/scenarios/${encodeURIComponent(name)}/compare`);
    if (res.status !== 200) {
      const legacy = await api(`/api/v1/scenarios/${encodeURIComponent(name)}`);
      out.replaceChildren(explainError(res), totalsTable(legacy.data.expected.orderTotals, null));
      return;
    }
    const { data } = res;
    const verdict = data.identical
      ? el('p', { class: 'ok', text: '✔ Every recorded value is identical to the legacy PHP output.' })
      : el('div', { class: 'notice bad' }, `✘ ${data.differences.length} difference(s): `, data.differences.slice(0, 5).join('; '));
    out.replaceChildren(verdict, totalsTable(data.legacy.orderTotals, data.modern.orderTotals), facts(data.modern),
      el('details', {}, el('summary', { text: 'Raw legacy vs. modern JSON' }),
        el('pre', { text: JSON.stringify({ legacy: data.legacy, modern: data.modern }, null, 2) })));
  }

  // ---------------------------------------------------------------- try it
  let products = [];

  function addLine(productId = 1, qty = 1) {
    const node = $('#line-template').content.firstElementChild.cloneNode(true);
    const select = $('.product', node);
    for (const p of products) {
      const price = p.specialPrice ? `${p.specialPrice} (special)` : p.price;
      select.append(el('option', { value: p.id, text: `${p.name} · ${price}` }));
    }
    select.value = String(productId);
    const renderOptions = () => {
      const span = $('.options', node);
      span.replaceChildren();
      const p = products.find((x) => x.id === Number(select.value));
      for (const o of p.options) {
        const s = el('select', { 'data-option': o.optionId, 'aria-label': o.name });
        s.append(el('option', { value: '', text: `${o.name}: none` }));
        for (const v of o.values) s.append(el('option', { value: v.valueId, text: `${o.name}: ${v.name} (${v.pricePrefix}${Number(v.price)})` }));
        span.append(s);
      }
    };
    select.addEventListener('change', renderOptions);
    renderOptions();
    $('.qty', node).value = qty;
    $('.remove', node).addEventListener('click', () => node.remove());
    $('#cart-lines').append(node);
  }

  function readForm() {
    const form = $('#checkout-form');
    const v = (n) => form.elements[n].value.trim();
    const [countryId, zoneId] = v('delivery').split(':').map(Number);
    const module = v('module');
    const shipping = { module, taxClassId: Number(v('shippingTax')) };
    if (module === 'flat') shipping.cost = v('cost');
    if (module === 'item') Object.assign(shipping, { cost: v('cost'), handling: v('handling') });
    if (module === 'table') Object.assign(shipping, { table: v('table'), mode: v('mode'), handling: v('handling') });
    const settings = { currency: v('currency'), displayPriceWithTax: v('displayPriceWithTax') === 'true' };
    if (v('freeOver')) settings.freeShipping = { enabled: true, over: v('freeOver'), destination: v('freeDest') };
    const items = [...document.querySelectorAll('#cart-lines .line')].map((line) => ({
      productId: Number($('.product', line).value),
      qty: Number($('.qty', line).value),
      attributes: [...line.querySelectorAll('[data-option]')].filter((s) => s.value)
        .map((s) => ({ optionId: Number(s.dataset.option), valueId: Number(s.value) })),
    }));
    return { settings, delivery: { countryId, zoneId }, shipping, items };
  }

  async function submit(e) {
    e.preventDefault();
    const body = readForm();
    const out = $('#try-result');
    const res = await api('/api/v1/checkout/totals', body);
    if (res.status !== 200) {
      out.replaceChildren(explainError(res));
      return;
    }
    const lines = res.data.orderTotals;
    out.replaceChildren(
      el('div', { class: 'scroll' }, el('table', {},
        el('thead', {}, el('tr', {}, el('th', { text: 'Line' }), el('th', { class: 'num', text: 'Display' }), el('th', { class: 'num', text: 'Raw value' }))),
        el('tbody', {}, ...lines.map((l) => el('tr', {}, el('td', { text: l.title }), el('td', { class: 'num', text: plain(l.text) }), el('td', { class: 'num', text: l.value })))))),
      facts(res.data),
      el('details', {}, el('summary', { text: 'Request and response JSON' }),
        el('pre', { text: JSON.stringify({ request: body, response: res.data }, null, 2) })));
  }

  async function initForm() {
    const [{ data: ref }, { data: cat }] = await Promise.all([api('/api/v1/reference'), api('/api/v1/products')]);
    products = cat.products;
    const currency = $('#f-currency');
    for (const c of ref.currencies) currency.append(el('option', { value: c.code, text: `${c.code} (${c.title})` }));
    const delivery = $('#f-delivery');
    for (const country of ref.countries) {
      const group = el('optgroup', { label: country.name });
      const zones = ref.zones.filter((z) => z.countryId === country.id);
      if (!zones.length) group.append(el('option', { value: `${country.id}:0`, text: country.name }));
      for (const z of zones) group.append(el('option', { value: `${country.id}:${z.id}`, text: `${z.name}, ${country.isoCode2}` }));
      delivery.append(group);
    }
    delivery.value = `${ref.store.countryId}:${ref.store.zoneId}`;
    addLine(1, 2);
    addLine(3, 1);
    $('#add-line').addEventListener('click', () => addLine(products[0].id, 1));
    $('#checkout-form').addEventListener('submit', submit);
  }

  loadEquivalence().catch(() => { $('#eq-badge').textContent = 'report unavailable'; });
  loadScenarios();
  initForm();
}());
