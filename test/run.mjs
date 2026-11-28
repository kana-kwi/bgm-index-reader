import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const code = readFileSync(
  process.env.BGM_IDX_SCRIPT
    ? new URL(process.env.BGM_IDX_SCRIPT, import.meta.url)
    : new URL('../bgm-index-reader.user.js', import.meta.url),
  'utf8'
);
const fixture = readFileSync(new URL('./fixture.html', import.meta.url), 'utf8');
const characterFixture = readFileSync(new URL('./character.html', import.meta.url), 'utf8');
const KEY = 'bgm-index-reader:v1';

function createDomFrom(html, url = 'https://bgm.tv/index/103991', seed = null, fetchImpl = null, username = 'kanakwi') {
  const dom = new JSDOM(html, {
    url,
    runScripts: 'dangerously',
    pretendToBeVisual: true
  });
  const { window } = dom;
  window.matchMedia = () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {}
  });
  window.scrollTo = () => {};
  window.confirm = () => true;
  window.fetch = fetchImpl || undefined;
  window.CHOBITS_USERNAME = username;
  if (seed) window.localStorage.setItem(KEY, JSON.stringify(seed));
  const script = window.document.createElement('script');
  script.textContent = code;
  window.document.body.appendChild(script);
  if (window.document.readyState === 'loading') {
    window.document.dispatchEvent(new window.Event('DOMContentLoaded'));
  }
  return dom;
}

function createDom(url, seed, fetchImpl, username) {
  return createDomFrom(fixture, url, seed, fetchImpl, username);
}

function visibleItems(doc) {
  return [...doc.querySelectorAll('#browserItemList > li.item')].filter((li) => !li.hidden);
}

function change(window, el, value) {
  el.value = value;
  el.dispatchEvent(new window.Event('change', { bubbles: true }));
}

function openSort(doc) {
  doc.getElementById('bgm-idx-sort-btn').click();
  assert.equal(doc.getElementById('bgm-idx-sort-menu').hidden, false, 'sort menu opens');
}
function clickSort(doc, key) {
  const btn = doc.querySelector(`#bgm-idx-sort-menu button[data-sort-key="${key}"]`);
  assert.ok(btn, 'sort item exists: ' + key);
  btn.click();
}
function closeSort(doc) {
  doc.body.click();
}

const dom = createDom();
const { window } = dom;
const doc = window.document;

assert.ok(window.__BGM_IDX_READER__, 'component boots');
assert.ok(doc.getElementById('bgm-idx-toolbar'), 'toolbar exists');
assert.ok(doc.documentElement.classList.contains('bgm-idx-ready'), 'root tokens applied');
assert.ok(doc.getElementById('browserItemList').classList.contains('bgm-idx-on'), 'list enhanced');
assert.ok(!doc.getElementById('browserItemList').classList.contains('bgm-idx-other'), 'own directory');
assert.equal(doc.getElementById('browserTypeSelector').style.display, 'none', 'native selector hidden');
assert.equal(doc.querySelectorAll('#browserItemList > li.item').length, 7, 'item count preserved');

const first = doc.getElementById('item_1');
assert.equal(first.dataset.bgmDate, '2026-10-05', 'date parsed');
assert.equal(first.querySelector('.bgm-idx-date').textContent, '10月5日', 'date split');
assert.ok(first.querySelector('.bgm-idx-staff').textContent.includes('橋本裕之'), 'staff split');
assert.equal(first.dataset.bgmScore, '6.2', 'score parsed');
assert.equal(first.dataset.bgmCount, '167', 'score count parsed');
assert.equal(first.dataset.bgmState, 'doing', 'collect state parsed');
assert.equal(first.dataset.bgmRank, '6183', 'rank parsed');
assert.equal(first.dataset.bgmTitle, '魔法少女育成計画 restart', 'title parsed');
assert.ok(first.dataset.bgmAlias.includes('别名'), 'alias parsed');
assert.ok(first.querySelector('.bgm-idx-alias'), 'alias moved');
assert.ok(first.querySelector('h3 small').classList.contains('bgm-idx-original-alias'), 'original alias hidden');
assert.ok(first.dataset.bgmInfo.includes('2026年10月5日'), 'p.info original text kept in dataset');
assert.equal(first.querySelector('.bgm-idx-score-value').textContent, '6.2', 'animated score rendered');
assert.ok(first.querySelector('.bgm-idx-score-mymark'), 'personal rating marker exists');
assert.equal(first.querySelector('.bgm-idx-watch-count').textContent, '167 人', 'watch count bottom right');
assert.equal(first.querySelector('.bgm-idx-watch-count').hidden, false, 'watch count visible');
assert.equal(first.querySelector('.bgm-idx-score-count'), null, 'count removed from score row');
assert.ok(/grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/.test(code), 'two-column grid');
assert.ok(code.includes('.bgm-idx-score-mymark'), 'personal rating marker style');

const staffBtn = doc.getElementById('bgm-idx-staff');
staffBtn.click();
assert.ok(doc.getElementById('browserItemList').classList.contains('bgm-idx-show-staff'), 'staff toggle on');
assert.ok(doc.querySelector('.bgm-idx-alias'), 'alias available on staff toggle');
staffBtn.click();
assert.ok(!doc.getElementById('browserItemList').classList.contains('bgm-idx-show-staff'), 'staff toggle off');

doc.querySelector('#bgm-idx-view button[data-view="timeline"]').click();
assert.equal(doc.querySelectorAll('#browserItemList > li.bgm-idx-group').length, 6, 'timeline groups');
assert.ok(doc.getElementById('bgm-idx-stats').textContent.includes('共 7 部'), 'stats total');
assert.ok(!/平均|最高|评分 \d+\//.test(doc.getElementById('bgm-idx-stats').textContent), 'stats extras removed');

const row1 = staffBtn.closest('.bgm-idx-row');
const row2 = doc.getElementById('bgm-idx-density').closest('.bgm-idx-row-sub');
assert.ok(row1, 'toolbar first row');
assert.ok(row2, 'density in second row');
assert.equal(staffBtn.nextElementSibling, doc.getElementById('bgm-idx-focus'), 'focus follows staff');

doc.querySelector('#bgm-idx-view button[data-view="list"]').click();
assert.equal(doc.getElementById('browserItemList').getAttribute('data-bgm-view'), 'list', 'list view');
assert.equal(doc.querySelectorAll('#browserItemList > li.bgm-idx-group').length, 0, 'groups removed in list view');

openSort(doc);
clickSort(doc, 'score');
assert.equal(visibleItems(doc)[0].dataset.bgmScore, '8.6', 'score sort descending');
clickSort(doc, 'score');
assert.equal(visibleItems(doc)[0].dataset.bgmScore, '6.2', 'score sort ascending');
closeSort(doc);

openSort(doc);
assert.equal(doc.querySelector('#bgm-idx-sort-menu button[data-sort-key="count"]'), null, 'count sort removed');
closeSort(doc);

openSort(doc);
clickSort(doc, 'default');
assert.equal(visibleItems(doc)[0].id, 'item_1', 'original order restored');
closeSort(doc);

const stateSelect = doc.getElementById('bgm-idx-state');
change(window, stateSelect, 'doing');
assert.equal(visibleItems(doc).length, 4, 'state filter');
assert.ok(doc.querySelector('#bgm-idx-chips .bgm-idx-chip'), 'filter chip rendered');

change(window, stateSelect, 'all');
const scoreSelect = doc.getElementById('bgm-idx-score');
change(window, scoreSelect, '8');
assert.equal(visibleItems(doc).length, 2, 'score filter');

doc.querySelector('.bgm-idx-chip-x[data-filter="score"]').click();
assert.equal(scoreSelect.value, 'all', 'chip removes filter');
assert.equal(visibleItems(doc).length, 7, 'filter reset');

const search = doc.getElementById('bgm-idx-q');
search.value = '薬屋';
search.dispatchEvent(new window.Event('input', { bubbles: true }));
await new Promise((resolve) => setTimeout(resolve, 200));
assert.equal(visibleItems(doc).length, 1, 'search filter');
search.value = '别名';
search.dispatchEvent(new window.Event('input', { bubbles: true }));
await new Promise((resolve) => setTimeout(resolve, 200));
assert.equal(visibleItems(doc).length, 1, 'search matches alias');
search.value = '龍輪';
search.dispatchEvent(new window.Event('input', { bubbles: true }));
await new Promise((resolve) => setTimeout(resolve, 200));
assert.equal(visibleItems(doc).length, 1, 'search matches staff');
search.value = '龙轮';
search.dispatchEvent(new window.Event('input', { bubbles: true }));
await new Promise((resolve) => setTimeout(resolve, 200));
assert.equal(visibleItems(doc).length, 1, 'search trad to simp');
search.value = '魔法 别名';
search.dispatchEvent(new window.Event('input', { bubbles: true }));
await new Promise((resolve) => setTimeout(resolve, 200));
assert.equal(visibleItems(doc).length, 1, 'search supports multiple tokens');
search.blur();
doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
assert.equal(visibleItems(doc).length, 7, 'escape clears search');
doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: '~', bubbles: true }));
assert.ok(doc.documentElement.classList.contains('bgm-idx-focus'), 'tilde toggles focus');
doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
assert.ok(!doc.documentElement.classList.contains('bgm-idx-focus'), 'escape exits focus');

doc.querySelector('#bgm-idx-view button[data-view="grid"]').click();
assert.equal(doc.getElementById('browserItemList').getAttribute('data-bgm-view'), 'grid', 'cover wall view');
assert.equal(doc.querySelectorAll('#browserItemList > li.bgm-idx-group').length, 0, 'no groups in cover wall');
assert.equal(doc.getElementById('browserItemList').dataset.bgmCoverSize, 'medium', 'cover size default');
assert.equal(doc.getElementById('bgm-idx-staff').hidden, true, 'staff hidden in cover wall');
assert.equal(doc.getElementById('bgm-idx-density-wrap').hidden, true, 'density hidden in cover wall');
assert.equal(doc.getElementById('bgm-idx-cover-size-wrap').hidden, false, 'cover size visible');
const coverSize = doc.getElementById('bgm-idx-cover-size');
change(window, coverSize, 'small');
assert.equal(doc.getElementById('browserItemList').dataset.bgmCoverSize, 'small', 'cover size small');
change(window, coverSize, 'large');
assert.equal(doc.getElementById('browserItemList').dataset.bgmCoverSize, 'large', 'cover size large');
change(window, coverSize, 'medium');

doc.querySelector('#bgm-idx-view button[data-view="list"]').click();
assert.equal(doc.getElementById('bgm-idx-staff').hidden, false, 'staff visible outside cover wall');
assert.equal(doc.getElementById('bgm-idx-density-wrap').hidden, false, 'density visible outside cover wall');
assert.equal(doc.getElementById('bgm-idx-cover-size-wrap').hidden, true, 'cover size hidden outside cover wall');

const densitySelect = doc.getElementById('bgm-idx-density');
change(window, densitySelect, 'relaxed');
assert.equal(doc.getElementById('browserItemList').dataset.bgmDensity, 'relaxed', 'density switch');
change(window, densitySelect, 'compact');

doc.querySelector('#bgm-idx-view button[data-view="timeline"]').click();
openSort(doc);
assert.equal(doc.querySelector('#bgm-idx-sort-menu button[data-sort-key="date"]').hidden, false, 'date sort visible');
assert.equal(doc.querySelector('#bgm-idx-sort-menu button[data-sort-key="score"]').hidden, true, 'score hidden in timeline');
assert.equal(doc.querySelector('#bgm-idx-sort-menu button[data-sort-key="count"]'), null, 'count sort removed in timeline');
clickSort(doc, 'date');
assert.ok(doc.getElementById('bgm-idx-sort-btn').textContent.includes('↓'), 'timeline date toggles descending');
clickSort(doc, 'date');
assert.ok(doc.getElementById('bgm-idx-sort-btn').textContent.includes('↑'), 'timeline date toggles ascending');
closeSort(doc);

const dom2 = createDom('https://bgm.tv/index/103991?bgm-view=list&bgm-density=relaxed&bgm-cover-size=small&bgm-sort=score-asc&bgm-state=doing&bgm-score=7');
const doc2 = dom2.window.document;
assert.equal(doc2.getElementById('browserItemList').getAttribute('data-bgm-view'), 'list', 'url view restored');
assert.equal(doc2.getElementById('browserItemList').dataset.bgmDensity, 'relaxed', 'url density restored');
assert.equal(doc2.getElementById('browserItemList').dataset.bgmCoverSize, 'small', 'url cover size restored');
assert.equal(doc2.getElementById('bgm-idx-sort-btn').textContent, '原顺序', 'url sort ignored');
assert.equal(doc2.getElementById('bgm-idx-state').value, 'all', 'url state filter ignored');
assert.equal(doc2.getElementById('bgm-idx-score').value, 'all', 'url score filter ignored');
assert.equal(doc2.getElementById('bgm-idx-size').value, '20', 'default page size');
assert.equal(visibleItems(doc2).length, 7, 'url filters ignored');

const dom3 = createDom('https://bgm.tv/index/103991', { view: 'list', density: 'relaxed', coverSize: 'large', pageSize: 100, sort: 'score-asc', score: '7', state: 'wish' });
const doc3 = dom3.window.document;
assert.equal(doc3.getElementById('browserItemList').getAttribute('data-bgm-view'), 'list', 'localStorage view restored');
assert.equal(doc3.getElementById('browserItemList').dataset.bgmDensity, 'relaxed', 'localStorage density restored');
assert.equal(doc3.getElementById('browserItemList').dataset.bgmCoverSize, 'large', 'localStorage cover size restored');
assert.equal(doc3.getElementById('bgm-idx-size').value, '20', 'localStorage page size ignored');
assert.equal(doc3.getElementById('bgm-idx-sort-btn').textContent, '原顺序', 'localStorage sort ignored');
assert.equal(doc3.getElementById('bgm-idx-score').value, 'all', 'localStorage score filter ignored');
assert.equal(doc3.getElementById('bgm-idx-state').value, 'all', 'localStorage state filter ignored');

const apiFetch = (url) => {
  if (url.includes('/collections/')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ rate: 7, type: 2 }) });
  return Promise.resolve({ ok: true, json: () => Promise.resolve({ rating: { score: 8.9, total: 555, rank: 123 } }) });
};
const domOther = createDom('https://bgm.tv/index/103991', null, apiFetch, 'tester');
await new Promise((resolve) => setTimeout(resolve, 1000));
const otherDoc = domOther.window.document;
assert.ok(otherDoc.getElementById('browserItemList').classList.contains('bgm-idx-other'), 'other directory mode');
const otherFirst = otherDoc.getElementById('item_1');
assert.equal(otherFirst.dataset.bgmState, 'done', 'other directory uses own state');
assert.equal(otherFirst.querySelector('.bgm-idx-state').textContent, '看过', 'own state badge');
assert.equal(otherFirst.dataset.bgmMyRate, '7', 'personal rating applied');
assert.equal(otherFirst.querySelector('.bgm-idx-myrate').textContent, '7', 'personal rating rendered');
assert.equal(otherFirst.querySelector('.bgm-idx-score').classList.contains('has-myrate'), true, 'personal rating marker active');
const otherApiItem = otherDoc.getElementById('item_4');
assert.equal(otherApiItem.dataset.bgmScore, '8.9', 'api rating applied');
domOther.window.__BGM_IDX_READER_DESTROY__();

const domOwn = createDom('https://bgm.tv/index/103991', null, apiFetch, 'kanakwi');
await new Promise((resolve) => setTimeout(resolve, 700));
const ownDoc = domOwn.window.document;
assert.ok(!ownDoc.getElementById('browserItemList').classList.contains('bgm-idx-other'), 'own directory stays own');
assert.equal(ownDoc.getElementById('item_1').dataset.bgmMyRate, '7', 'own personal rating applied');
domOwn.window.__BGM_IDX_READER_DESTROY__();

const charFetch = (url) => {
  if (url.includes('/index/related/')) {
    return Promise.resolve({ ok: true, redirected: false, url, text: () => Promise.resolve('') });
  }
  const isIka = url.includes('100857');
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      name: isIka ? '雪平一果' : 'ユイ',
      name_cn: isIka ? '一果' : '结衣',
      images: { large: isIka ? 'https://example.com/ika.jpg' : 'https://example.com/yui.jpg' }
    })
  });
};
const domChar = createDomFrom(characterFixture, 'https://bgm.tv/index/72490?cat=character', null, charFetch, 'kanakwi');
await new Promise((resolve) => setTimeout(resolve, 900));
const charDoc = domChar.window.document;
const crt = charDoc.querySelector('.browserCrtList');
assert.ok(charDoc.getElementById('bgm-idx-toolbar'), 'character toolbar exists');
assert.ok(crt.classList.contains('bgm-idx-crt-on'), 'character cover wall enabled');
assert.equal(crt.querySelectorAll('.bgm-idx-crt-item').length, 2, 'character items found');
assert.equal(charDoc.getElementById('item_character100857').querySelector('h3 a.l').textContent, '一果', 'character chinese name');
assert.equal(charDoc.getElementById('item_character100857').querySelector('a.avatar img').getAttribute('src'), 'https://example.com/ika.jpg', 'character full image');
const firstChar = charDoc.getElementById('item_character100857');
const secondChar = charDoc.getElementById('item_character17647');
assert.equal(firstChar.querySelectorAll('.bgm-idx-crt-act').length, 2, 'character manage actions injected');
assert.equal(secondChar.querySelectorAll('.bgm-idx-crt-act').length, 0, 'character without manage links has no actions');
const crtFocus = charDoc.getElementById('bgm-idx-crt-focus');
assert.ok(crtFocus, 'character focus button exists');
crtFocus.click();
assert.ok(charDoc.documentElement.classList.contains('bgm-idx-focus'), 'character focus on');
assert.equal(crtFocus.getAttribute('aria-pressed'), 'true', 'character focus pressed');
crtFocus.click();
assert.ok(!charDoc.documentElement.classList.contains('bgm-idx-focus'), 'character focus off');
const crtSize = charDoc.getElementById('bgm-idx-crt-size');
assert.ok(crtSize, 'character size control');
change(domChar.window, crtSize, 'small');
assert.equal(crt.dataset.bgmCrtSize, 'small', 'character size control');
const crtSearch = charDoc.getElementById('bgm-idx-crt-q');
crtSearch.value = '一果';
crtSearch.dispatchEvent(new domChar.window.Event('input', { bubbles: true }));
assert.equal([...crt.querySelectorAll('.bgm-idx-crt-item')].filter((el) => !el.hidden).length, 1, 'character search');
crtSearch.value = '';
crtSearch.dispatchEvent(new domChar.window.Event('input', { bubbles: true }));
assert.equal([...crt.querySelectorAll('.bgm-idx-crt-item')].filter((el) => !el.hidden).length, 2, 'character search reset');
firstChar.querySelector('.bgm-idx-crt-heart').click();
await new Promise((resolve) => setTimeout(resolve, 350));
assert.equal(charDoc.getElementById('item_character100857'), null, 'character relation erased');
assert.equal(charDoc.querySelectorAll('.bgm-idx-crt-item').length, 1, 'character item removed');
assert.ok(charDoc.getElementById('bgm-idx-crt-stats').textContent.includes('1 / 1'), 'character stats updated');
domChar.window.__BGM_IDX_READER_DESTROY__();
assert.ok(!charDoc.documentElement.classList.contains('bgm-idx-focus'), 'character focus reset');
assert.equal(charDoc.getElementById('bgm-idx-toolbar'), null, 'character toolbar removed');

const personFixture = readFileSync(new URL('./person.html', import.meta.url), 'utf8');
const domPerson = createDomFrom(personFixture, 'https://bgm.tv/index/72490?cat=person', null, null, 'kanakwi');
await new Promise((resolve) => setTimeout(resolve, 600));
const personDoc = domPerson.window.document;
const personCrt = personDoc.querySelector('.browserCrtList');
assert.ok(personCrt.classList.contains('bgm-idx-person-on'), 'person directory layout enabled');
assert.ok(!personCrt.classList.contains('bgm-idx-crt-on'), 'person directory not treated as character wall');
assert.equal(personDoc.querySelectorAll('.bgm-idx-person-list').length, 1, 'person items grouped');
assert.equal(personDoc.querySelectorAll('.bgm-idx-person-list > div[id^="item_person"]').length, 2, 'person items wrapped');
assert.equal(personDoc.getElementById('bgm-idx-toolbar'), null, 'person directory has no character toolbar');
assert.equal(personDoc.getElementById('bgm-idx-crt-size'), null, 'person directory has no size control');
assert.equal(personDoc.getElementById('bgm-idx-crt-q'), null, 'person directory has no character search');
assert.ok(personDoc.getElementById('bgm-idx-person-toolbar'), 'person toolbar exists');
const personQ = personDoc.getElementById('bgm-idx-prsn-q');
assert.ok(personQ, 'person search exists');
const personDensity = personDoc.getElementById('bgm-idx-prsn-density');
assert.ok(personDensity, 'person density control exists');
assert.equal(personCrt.dataset.bgmPrsnDensity, 'compact', 'person compact by default');
change(domPerson.window, personDensity, 'relaxed');
assert.equal(personCrt.dataset.bgmPrsnDensity, 'relaxed', 'person density relaxed');
const personFocus = personDoc.getElementById('bgm-idx-prsn-focus');
assert.ok(personFocus, 'person focus button exists');
personFocus.click();
assert.ok(personDoc.documentElement.classList.contains('bgm-idx-focus'), 'person focus on');
assert.equal(personFocus.getAttribute('aria-pressed'), 'true', 'person focus pressed');
personFocus.click();
assert.ok(!personDoc.documentElement.classList.contains('bgm-idx-focus'), 'person focus off');
personQ.value = '人物甲';
personQ.dispatchEvent(new domPerson.window.Event('input', { bubbles: true }));
assert.ok(personDoc.getElementById('item_person2').hidden, 'person search hides non-match');
assert.ok(!personDoc.getElementById('item_person1').hidden, 'person search keeps match');
assert.ok(personDoc.getElementById('bgm-idx-prsn-stats').textContent.includes('1 / 2'), 'person search stats');
personQ.value = '';
personQ.dispatchEvent(new domPerson.window.Event('input', { bubbles: true }));
assert.ok(!personDoc.getElementById('item_person2').hidden, 'person search reset');
assert.ok(personDoc.documentElement.classList.contains('bgm-idx-ready'), 'person directory tokens applied');
domPerson.window.__BGM_IDX_READER_DESTROY__();
assert.ok(!personCrt.classList.contains('bgm-idx-person-on'), 'person directory layout removed');
assert.equal(personDoc.getElementById('bgm-idx-person-toolbar'), null, 'person toolbar removed');
assert.equal(personDoc.querySelectorAll('.bgm-idx-person-list').length, 0, 'person wrap removed');
assert.ok(!personDoc.documentElement.classList.contains('bgm-idx-focus'), 'person focus reset');
assert.ok(!personDoc.documentElement.classList.contains('bgm-idx-ready'), 'person directory tokens removed');

const mixedFixture = characterFixture.replace(
  '<h2 class="subtitle">角色</h2>',
  '<h2 class="subtitle">动画</h2><ul id="browserItemList" class="browserFull"><li id="item_1" class="item"><div class="inner"><h3><a href="/subject/1" class="l">动画条目</a></h3><p class="info">2026年10月5日 / 导演</p></div></li></ul><h2 class="subtitle">角色</h2>'
);
const domMixed = createDomFrom(mixedFixture, 'https://bgm.tv/index/72490', null, charFetch, 'kanakwi');
await new Promise((resolve) => setTimeout(resolve, 900));
const mixedDoc = domMixed.window.document;
const mixedCrt = mixedDoc.querySelector('.browserCrtList');
assert.ok(mixedDoc.getElementById('browserItemList').classList.contains('bgm-idx-on'), 'mixed list enhanced');
assert.ok(mixedCrt.classList.contains('bgm-idx-crt-on'), 'mixed character wall enhanced');
assert.equal(mixedDoc.querySelectorAll('#bgm-idx-toolbar').length, 2, 'mixed toolbars coexist');
domMixed.window.__BGM_IDX_READER_DESTROY__();
assert.ok(!mixedCrt.classList.contains('bgm-idx-crt-on'), 'mixed character wall destroyed');
assert.ok(!mixedDoc.documentElement.classList.contains('bgm-idx-ready'), 'mixed tokens removed');



window.__BGM_IDX_READER_DESTROY__();
assert.equal(doc.getElementById('bgm-idx-toolbar'), null, 'toolbar removed');
assert.notEqual(doc.getElementById('browserTypeSelector').style.display, 'none', 'native selector restored');
assert.ok(doc.getElementById('item_1').querySelector('p.info').textContent.includes('2026年10月5日'), 'p.info restored');
assert.equal(doc.querySelectorAll('#browserItemList .bgm-idx-score').length, 0, 'score elements removed');
assert.equal(doc.querySelectorAll('#browserItemList .bgm-idx-state').length, 0, 'state badges removed');
assert.equal(doc.querySelectorAll('#browserItemList .bgm-idx-alias').length, 0, 'alias elements removed');
assert.ok(!doc.querySelector('#item_1 h3 small').classList.contains('bgm-idx-original-alias'), 'original alias restored');
assert.equal(doc.getElementById('browserItemList').getAttribute('data-bgm-density'), null, 'density attribute removed');
assert.equal(doc.getElementById('browserItemList').getAttribute('data-bgm-cover-size'), null, 'cover size attribute removed');
assert.equal(doc.querySelectorAll('#browserItemList > li.item').length, 7, 'items preserved after destroy');
assert.equal(doc.querySelector('#browserItemList > li.item').id, 'item_1', 'original order restored');
assert.ok(!doc.documentElement.classList.contains('bgm-idx-ready'), 'root tokens removed');

const userIndexHtml = `<!DOCTYPE html><html><body>
<script>
window.__cloud = {};
window.chiiApp = { cloud_settings: {
  get: function (key) { return window.__cloud[key]; },
  update: function (patch) { Object.keys(patch).forEach(function (k) { window.__cloud[k] = patch[k]; }); },
  save: function () { window.__cloud.__saved = true; }
} };
</script>
<div id="timeline" class="index-list"><ul>
<li id="item_1" class="clearit tml_item index-item"><span class="info"><span class="stats tip rr"><span class="ico_subject_type num subject_type_2 ll"><span class="num">10</span></span></span><a href="/index/1" class="l">2026年10月新番</a> 创建 <span class="tip_j">2026-9-24 15:02</span><span class="desc">追番表</span></span></li>
<li id="item_2" class="clearit tml_item index-item"><span class="info"><span class="stats tip rr"><span class="ico_subject_type num subject_type_2 ll"><span class="num">14</span></span></span><a href="/index/2" class="l">2025年10月新番</a> 创建 <span class="tip_j">2025-9-29 03:50</span><span class="desc">旧番表</span></span></li>
</ul></div></body></html>`;
const domUser = createDomFrom(userIndexHtml, 'https://bgm.tv/user/kanakwi/index');
const userDoc = domUser.window.document;
assert.ok(userDoc.getElementById('bgm-idx-toolbar'), 'user index toolbar');
const uiSearch = userDoc.getElementById('bgm-idx-ui-q');
uiSearch.value = '2026';
uiSearch.dispatchEvent(new domUser.window.Event('input', { bubbles: true }));
assert.equal([...userDoc.querySelectorAll('li.index-item')].filter((li) => !li.hidden).length, 1, 'user index search');
uiSearch.value = '';
uiSearch.dispatchEvent(new domUser.window.Event('input', { bubbles: true }));
let promptAnswers = ['季度追番表', '记录每季新番'];
domUser.window.prompt = () => promptAnswers.shift() || '';
const newFolderBtn = [...userDoc.querySelectorAll('.bgm-idx-ui-section-actions button')].find((b) => b.textContent === '新建文件夹');
assert.ok(newFolderBtn, 'user index new folder button');
newFolderBtn.click();
assert.equal(userDoc.querySelectorAll('.bgm-idx-ui-folder-card').length, 1, 'user index folder created');
assert.ok(userDoc.querySelector('.bgm-idx-ui-folder-card-name').textContent.includes('季度追番表'), 'user index folder name');
assert.ok(userDoc.querySelector('.bgm-idx-ui-folder-card-desc').textContent.includes('记录每季新番'), 'user index folder desc');
userDoc.querySelector('.bgm-idx-ui-folder-card').click();
assert.ok(userDoc.querySelector('.bgm-idx-ui-section-title').textContent.includes('季度追番表'), 'user index folder view');
assert.deepEqual(
  [...userDoc.querySelectorAll('.bgm-idx-ui-section-actions button')].map((b) => b.textContent),
  ['批量添加', '批量排序', '多选', '编辑', '删除', '返回未归档'],
  'folder actions order'
);
const batchBtn = [...userDoc.querySelectorAll('.bgm-idx-ui-section-actions button')].find((b) => b.textContent.includes('批量添加'));
assert.ok(batchBtn, 'user index batch button');
batchBtn.click();
const box1 = userDoc.querySelector('#item_1 .bgm-idx-ui-select');
assert.ok(box1 && !box1.hidden, 'user index select box');
box1.click();
assert.ok(userDoc.getElementById('bgm-idx-ui-add-selected'), 'user index add selected');
userDoc.getElementById('bgm-idx-ui-add-selected').click();
assert.ok(userDoc.querySelector('.bgm-idx-ui-section-title').textContent.includes('1 个目录'), 'user index batch added');
assert.equal(userDoc.getElementById('item_1').hidden, false, 'user index folder item visible');
assert.equal(userDoc.getElementById('item_2').hidden, true, 'user index loose item hidden in folder view');
const cloudData = domUser.window.__cloud['bgm-index-reader:user-index'];
assert.ok(cloudData && cloudData.includes('季度追番表'), 'user index cloud saved');
assert.ok(domUser.window.__cloud.__saved, 'user index cloud save called');
const restoredHtml = userIndexHtml.replace('window.__cloud = {};', 'window.__cloud = {"bgm-index-reader:user-index":' + JSON.stringify(cloudData) + '};');
const domRestored = createDomFrom(restoredHtml, 'https://bgm.tv/user/kanakwi/index');
const restoredDoc = domRestored.window.document;
assert.equal(restoredDoc.querySelectorAll('.bgm-idx-ui-folder-card').length, 1, 'user index cloud restored');
assert.ok(restoredDoc.querySelector('.bgm-idx-ui-folder-card-name').textContent.includes('季度追番表'), 'user index cloud folder name');
domRestored.window.__BGM_IDX_READER_DESTROY__();
const backBtn = [...userDoc.querySelectorAll('.bgm-idx-ui-section-actions button')].find((b) => b.textContent.includes('返回未归档'));
backBtn.click();
assert.equal(userDoc.getElementById('item_2').hidden, false, 'user index back to loose');
assert.deepEqual(
  [...userDoc.querySelectorAll('.bgm-idx-ui-section-actions button')].map((b) => b.textContent),
  ['新建文件夹', '批量排序', '多选'],
  'loose actions order'
);
domUser.window.__BGM_IDX_READER_DESTROY__();
assert.equal(userDoc.getElementById('bgm-idx-toolbar'), null, 'user index toolbar removed');

const subjectHtml = `<!DOCTYPE html><html><body><div id="dock"><a href="/user/kanakwi">kanakwi</a></div><div id="subject_summary">summary</div></body></html>`;
let lastSubjectPost = null;
const subjectFetch = (url, opts) => {
  if (url.includes('/user/kanakwi/index') && url.includes('add_related=')) {
    return Promise.resolve({
      ok: true,
      text: () => Promise.resolve('<a href="/index/1/add_related?add_related=123&amp;cat=0&amp;gh=abc&amp;referer=ajax">季度追番表</a>')
    });
  }
  if (url.includes('/user/kanakwi/index')) {
    return Promise.resolve({
      ok: true,
      text: () => Promise.resolve('<ul><li class="index-item"><a class="l" href="/index/1">季度追番表</a><span class="stats"><span class="num">8</span></span></li></ul>')
    });
  }
  if (url.indexOf('/index/1/add_related') === 0) {
    lastSubjectPost = { url, opts };
    return Promise.resolve({ ok: true, redirected: false, url });
  }
  return Promise.resolve({ ok: true, text: () => Promise.resolve('') });
};
const domSub = createDomFrom(subjectHtml, 'https://bgm.tv/subject/123', null, subjectFetch, 'kanakwi');
await new Promise((resolve) => setTimeout(resolve, 100));
const subDoc = domSub.window.document;
const star = subDoc.getElementById('bgm-idx-star-btn');
assert.ok(star, 'subject star button');
star.click();
await new Promise((resolve) => setTimeout(resolve, 120));
const starItem = subDoc.querySelector('.bgm-idx-star-item');
assert.ok(starItem, 'subject directory list');
starItem.click();
await new Promise((resolve) => setTimeout(resolve, 60));
const subjectSubmit = subDoc.getElementById('bgm-idx-star-submit');
assert.ok(subjectSubmit && !subjectSubmit.disabled, 'subject submit enabled');
subjectSubmit.click();
await new Promise((resolve) => setTimeout(resolve, 300));
assert.ok(lastSubjectPost, 'subject add request');
assert.ok(lastSubjectPost.url.indexOf('/index/1/add_related') === 0, 'subject add url');
assert.ok(lastSubjectPost.url.includes('add_related=123'), 'subject id in add url');
domSub.window.__BGM_IDX_READER_DESTROY__();

const collectionHtml = `<!DOCTYPE html><html><body>
<div id="dock"><a href="/user/kanakwi">kanakwi</a></div>
<div id="browserTools" class="clearit"><div class="filters">按 <a href="?orderby=rate">评价</a> <a href="?orderby=date">发售日</a> 排序</div><ul id="browserTypeSelector"><li><a id="full_selector" class="active">列表</a></li></ul></div>
<ul id="browserItemList" class="browserFull browser-list"><li id="item_5649" class="item odd clearit"><a href="/subject/5649" class="subjectCover cover ll coverPortrait"><span class="image"><img class="cover" src="https://example.com/cover.jpg"></span></a><div class="inner"><h3><a class="l">生徒会役員共</a><small class="grey">妄想学生会</small></h3><p class="info tip">13话 / 2010年7月3日 / 金泽洪充 / 古田</p><p class="collectInfo"><span class="tip_j">2026-10-15</span></p></div></li></ul>

</body></html>`;
const collectionFetch = (url) => {
  if (url.includes('/v0/subjects/5649')) {
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ name: '生徒会役員共', name_cn: '妄想学生会', rating: { score: 7.8, total: 321 } }) });
  }
  if (url.includes('/v0/users/kanakwi/collections/5649')) {
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ rate: 8, type: 1 }) });
  }
  if (url.includes('/v0/users/kanakwi/collections?')) {
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ total: 1, data: [{ subject_id: 5649, rate: 8, type: 1, subject: { id: 5649, name: '生徒会役員共', name_cn: '妄想学生会', date: '2010-07-03', score: 7.8, rank: 1000, collection_total: 321, images: { large: 'https://example.com/cover.jpg' } } }] }) });
  }
  return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
};
const domColl = createDomFrom(collectionHtml, 'https://bgm.tv/anime/list/kanakwi/wish', null, collectionFetch, 'kanakwi');
await new Promise((resolve) => setTimeout(resolve, 700));
const collDoc = domColl.window.document;
const collList = collDoc.getElementById('browserItemList');
const collItem = collDoc.getElementById('item_5649');
assert.ok(collList.classList.contains('bgm-idx-on'), 'collection list enhanced');
assert.ok(collItem.dataset.bgmDate.startsWith('2010-07'), 'collection date parsed');
assert.equal(collItem.dataset.bgmState, 'wish', 'collection state');
assert.equal(collItem.dataset.bgmScore, '7.8', 'own collection site score shown');
assert.equal(collItem.dataset.bgmCount, '321', 'own collection site count shown');
assert.equal(collItem.dataset.bgmMyRate, '8', 'visitor personal rating kept');
assert.equal(collItem.querySelector('.bgm-idx-myrate').textContent, '8', 'personal rating rendered');
assert.ok(collDoc.getElementById('bgm-idx-toolbar'), 'collection toolbar');
assert.ok(collDoc.getElementById('bgm-idx-state').closest('.bgm-idx-field').hidden, 'collection state filter hidden');
assert.equal(collDoc.querySelector('#bgm-idx-sort').closest('.bgm-idx-field').hidden, false, 'collection component sort visible');
assert.equal(collDoc.getElementById('bgm-idx-size').closest('.bgm-idx-field').hidden, false, 'collection page size visible');
assert.equal(collDoc.querySelector('#browserTools .filters').style.display, 'none', 'collection native sort hidden');
assert.equal(collItem.querySelector('h3 a.l').textContent, '妄想学生会', 'collection chinese title');
assert.equal(collItem.querySelector('h3 small').textContent, '生徒会役員共', 'collection japanese alias');
assert.equal(collItem.dataset.bgmCnName, '妄想学生会', 'collection cn name cached');
assert.ok(collDoc.getElementById('bgm-idx-pager').hidden, 'collection pager hidden');
assert.ok(collDoc.getElementById('bgm-idx-stats').hidden, 'collection stats hidden');
assert.ok(collList.classList.contains('bgm-idx-collection'), 'collection class');
assert.ok([...collDoc.querySelectorAll('style')].some((s) => s.textContent.includes('#browserItemList.bgm-idx-collection li.item p.collectInfo')), 'collection collectInfo hidden by style');
domColl.window.__BGM_IDX_READER_DESTROY__();

const otherCollectionHtml = collectionHtml.replace(/\/user\/kanakwi/g, '/user/steeto');
const otherCollectionFetch = (url) => {
  if (url.includes('/v0/users/steeto/collections?')) {
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ total: 1, data: [{ subject_id: 5649, rate: 6, type: 2, subject: { id: 5649, name: '生徒会役員共', name_cn: '妄想学生会', date: '2010-07-03', score: 7.8, rank: 1000, collection_total: 321, images: { large: 'https://example.com/cover.jpg' } } }] }) });
  }
  if (url.includes('/v0/users/kanakwi/collections/5649')) {
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ rate: 8, type: 3 }) });
  }
  return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
};
const domOtherColl = createDomFrom(otherCollectionHtml, 'https://bgm.tv/anime/list/steeto/collect', null, otherCollectionFetch, 'kanakwi');
await new Promise((resolve) => setTimeout(resolve, 700));
const otherCollDoc = domOtherColl.window.document;
const otherCollItem = otherCollDoc.getElementById('item_5649');
assert.equal(otherCollItem.dataset.bgmScore, '6', 'other collection owner rate shown');
assert.equal(otherCollItem.dataset.bgmMyRate, '8', 'own rating kept on other collection');
assert.equal(otherCollItem.querySelector('.bgm-idx-myrate').textContent, '8', 'own rating rendered on other collection');
domOtherColl.window.__BGM_IDX_READER_DESTROY__();

const ownNoRateFetch = (url) => {
  if (url.includes('/v0/users/kanakwi/collections?')) {
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ total: 1, data: [{ subject_id: 5649, rate: 0, type: 2, subject: { id: 5649, name: '生徒会役員共', name_cn: '妄想学生会', date: '2010-07-03', score: 8.4, rank: 100, collection_total: 999, images: { large: 'https://example.com/cover.jpg' } } }] }) });
  }
  if (url.includes('/v0/users/kanakwi/collections/5649')) {
    return Promise.resolve({ ok: false, status: 404 });
  }
  return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
};
const domOwnNoRate = createDomFrom(collectionHtml, 'https://bgm.tv/anime/list/kanakwi/wish', null, ownNoRateFetch, 'kanakwi');
await new Promise((resolve) => setTimeout(resolve, 700));
const ownNoRateItem = domOwnNoRate.window.document.getElementById('item_5649');
assert.equal(ownNoRateItem.dataset.bgmScore, '8.4', 'own unrated falls back to site score');
assert.equal(ownNoRateItem.dataset.bgmCount, '999', 'own unrated shows site count');
assert.equal(ownNoRateItem.dataset.bgmMyRate, undefined, 'own unrated has no my rate');
domOwnNoRate.window.__BGM_IDX_READER_DESTROY__();

const otherNoRateFetch = (url) => {
  if (url.includes('/v0/users/steeto/collections?')) {
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ total: 1, data: [{ subject_id: 5649, rate: 0, type: 2, subject: { id: 5649, name: '生徒会役員共', name_cn: '妄想学生会', date: '2010-07-03', score: 8.4, rank: 100, collection_total: 999, images: { large: 'https://example.com/cover.jpg' } } }] }) });
  }
  if (url.includes('/v0/users/kanakwi/collections/5649')) {
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ rate: 8, type: 3 }) });
  }
  return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
};
const domOtherNoRate = createDomFrom(otherCollectionHtml, 'https://bgm.tv/anime/list/steeto/collect', null, otherNoRateFetch, 'kanakwi');
await new Promise((resolve) => setTimeout(resolve, 700));
const otherNoRateItem = domOtherNoRate.window.document.getElementById('item_5649');
assert.equal(otherNoRateItem.dataset.bgmScore, '', 'other unrated hides site score');
assert.equal(otherNoRateItem.dataset.bgmMyRate, '8', 'own rating still shown when owner unrated');
domOtherNoRate.window.__BGM_IDX_READER_DESTROY__();

const sortFixture = fixture.replace('</body>', '<form id="ModifyRelatedForm"></form></body>');
const domSort = createDomFrom(sortFixture, 'https://bgm.tv/index/103991', null, null, 'kanakwi');
await new Promise((resolve) => setTimeout(resolve, 300));
const sortDoc = domSort.window.document;
const sortBtn = sortDoc.getElementById('bgm-idx-subject-sort');
assert.ok(sortBtn, 'subject sort button exists');
assert.equal(sortBtn.hidden, false, 'subject sort button visible for owner');
assert.equal(sortDoc.getElementById('item_1').draggable, true, 'subject drag bound');
sortDoc.querySelector('#bgm-idx-view button[data-view="list"]').click();
await new Promise((resolve) => setTimeout(resolve, 100));
sortBtn.click();
assert.equal(sortDoc.getElementById('bgm-idx-subject-sortbar').hidden, false, 'subject sortbar shown');
assert.equal(sortDoc.getElementById('item_1').classList.contains('is-subj-pick'), true, 'subject pick mode');
sortDoc.getElementById('item_1').click();
assert.ok(sortDoc.querySelector('#item_1 .bgm-idx-subj-pick'), 'subject pick badge shown');
assert.ok(sortDoc.getElementById('bgm-idx-subject-sort-note').textContent.includes('1'), 'subject pick count');
sortDoc.getElementById('bgm-idx-subject-sort-cancel').click();
assert.equal(sortDoc.getElementById('bgm-idx-subject-sortbar').hidden, true, 'subject sort cancelled');
domSort.window.__BGM_IDX_READER_DESTROY__();

const domStarBatch = createDomFrom(fixture, 'https://bgm.tv/index/103991', null, null, 'steeto');
await new Promise((resolve) => setTimeout(resolve, 300));
const starDoc = domStarBatch.window.document;
const starBatchBtn = starDoc.getElementById('bgm-idx-batch-star');
assert.ok(starBatchBtn, 'batch star button exists');
assert.equal(starBatchBtn.hidden, false, 'batch star visible on other directory');
const starBar = starDoc.getElementById('bgm-idx-star-bar');
assert.ok(starBar, 'star bar exists');
assert.ok(starBar.closest('#bgm-idx-toolbar'), 'star bar inside toolbar');
assert.equal(starBar.hidden, true, 'star bar hidden initially');
starBatchBtn.click();
assert.equal(starBar.hidden, false, 'star bar shown in batch mode');
assert.ok(starDoc.querySelector('#bgm-idx-toolbar #bgm-idx-star-bar-pick'), 'pick button inside toolbar');
assert.ok(starDoc.querySelector('#bgm-idx-toolbar #bgm-idx-star-bar-cancel'), 'cancel button inside toolbar');
starDoc.getElementById('bgm-idx-star-bar-cancel').click();
assert.equal(starBar.hidden, true, 'star bar hidden after cancel');
domStarBatch.window.__BGM_IDX_READER_DESTROY__();

console.log('all tests passed');