// ==UserScript==
// @name         Bangumi 目录页阅读优化
// @namespace    https://bgm.tv/
// @version      0.1.58
// @description  目录页双列/封面墙、角标布局；收藏与修改收藏使用站点原版
// @match        https://bgm.tv/index/*
// @match        https://bangumi.tv/index/*
// @match        https://chii.in/index/*
// @match        https://bgm.tv/user/*/index*
// @match        https://bangumi.tv/user/*/index*
// @match        https://chii.in/user/*/index*
// @match        https://bgm.tv/subject/*
// @match        https://bangumi.tv/subject/*
// @match        https://chii.in/subject/*
// @match        https://bgm.tv/anime/list/*
// @match        https://bgm.tv/book/list/*
// @match        https://bgm.tv/music/list/*
// @match        https://bgm.tv/game/list/*
// @match        https://bgm.tv/real/list/*
// @match        https://bangumi.tv/anime/list/*
// @match        https://bangumi.tv/book/list/*
// @match        https://bangumi.tv/music/list/*
// @match        https://bangumi.tv/game/list/*
// @match        https://bangumi.tv/real/list/*
// @match        https://chii.in/anime/list/*
// @match        https://chii.in/book/list/*
// @match        https://chii.in/music/list/*
// @match        https://chii.in/game/list/*
// @match        https://chii.in/real/list/*
// @match        https://bgm.tv/anime/browser*
// @match        https://bgm.tv/book/browser*
// @match        https://bgm.tv/music/browser*
// @match        https://bgm.tv/game/browser*
// @match        https://bgm.tv/real/browser*
// @match        https://bangumi.tv/anime/browser*
// @match        https://bangumi.tv/book/browser*
// @match        https://bangumi.tv/music/browser*
// @match        https://bangumi.tv/game/browser*
// @match        https://bangumi.tv/real/browser*
// @match        https://chii.in/anime/browser*
// @match        https://chii.in/book/browser*
// @match        https://chii.in/music/browser*
// @match        https://chii.in/game/browser*
// @match        https://chii.in/real/browser*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  var isDetailPage = /^\/index\/\d+\/?$/.test(location.pathname);
  var isUserIndexPage = /^\/user\/[^/]+\/index(?:\/collect)?\/?$/.test(location.pathname);
  var isSubjectPage = /^\/subject\/\d+\/?$/.test(location.pathname);
  var isCollectionPage = /^\/(anime|book|music|game|real)\/list\/[^/]+(?:\/[a-z_]+)?\/?$/.test(location.pathname);
  var isBrowserPage = /^\/(anime|book|music|game|real)\/browser(?:\/|$)/.test(location.pathname);
  if (!isDetailPage && !isUserIndexPage && !isSubjectPage && !isCollectionPage && !isBrowserPage) return;
  if (window.__BGM_IDX_READER__) return;
  window.__BGM_IDX_READER__ = true;

  var SEL = {
    list: '#browserItemList',
    item: 'li.item',
    title: 'h3 a.l',
    info: 'p.info',
    rate: 'p.rateInfo',
    collect: 'p.collectInfo',
    collectBlock: 'div.collectBlock',
    rank: 'span.rank',
    tools: 'p.tools',
    toolsBar: '#browserTools',
    native: '#browserTypeSelector',
    siteHeader: '#headerNeue2'
  };
  var KEY = 'bgm-index-reader:v1';
  var DEFAULTS = {
    view: 'list',
    density: 'compact',
    coverSize: 'medium',
    sort: 'default',
    pageSize: 20,
    showStaff: false,
    state: 'all',
    score: 'all',
    q: ''
  };
  var CSS = `
html.bgm-idx-ready {
  --idx-space-1: 4px;
  --idx-space-2: 8px;
  --idx-space-3: 12px;
  --idx-space-4: 16px;
  --idx-space-6: 24px;
  --idx-radius-sm: 4px;
  --idx-radius-md: 8px;
  --idx-radius-pill: 999px;
  --idx-dur-fast: 120ms;
  --idx-dur: 180ms;
  --idx-dur-slow: 280ms;
  --idx-ease: cubic-bezier(.2,.8,.2,1);
  --idx-surface-1: #fff;
  --idx-surface-2: #fafafa;
  --idx-surface-3: #f2f3f5;
  --idx-border: rgba(0,0,0,.08);
  --idx-text-1: #1f2328;
  --idx-text-2: #5b6470;
  --idx-text-3: #8a94a0;
  --idx-accent: var(--primary-color, #f09199);
  --idx-score: #d99400;
  --idx-shadow-1: 0 1px 2px rgba(0,0,0,.06);
  --idx-shadow-2: 0 10px 30px rgba(0,0,0,.14);
  --idx-focus: 0 0 0 3px rgba(240,145,153,.35);
  --idx-cover: 64px;
  --idx-sticky-top: 0px;
  --idx-toolbar-height: 0px;
}
html.bgm-idx-ready[data-theme="dark"] {
  --idx-surface-1: #1c1d20;
  --idx-surface-2: #232529;
  --idx-surface-3: #2a2d31;
  --idx-border: rgba(255,255,255,.10);
  --idx-text-1: #eceff3;
  --idx-text-2: #aab3bd;
  --idx-text-3: #7d8792;
  --idx-score: #f0b429;
  --idx-shadow-1: 0 1px 2px rgba(0,0,0,.35);
  --idx-shadow-2: 0 12px 32px rgba(0,0,0,.45);
  --idx-focus: 0 0 0 3px rgba(240,145,153,.45);
}
#bgm-idx-toolbar {
  position: -webkit-sticky;
  position: sticky;
  top: var(--idx-sticky-top);
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 6px;
  box-sizing: border-box;
  margin: var(--idx-space-2) 0 var(--idx-space-3);
  padding: var(--idx-space-2);
  border: 1px solid var(--idx-border);
  border-radius: var(--idx-radius-md);
  background: var(--idx-surface-1);
  background: color-mix(in srgb, var(--idx-surface-1) 92%, transparent);
  color: var(--idx-text-2);
  font-size: 12px;
  line-height: 1.5;
  transition: box-shadow var(--idx-dur-fast) var(--idx-ease);
}
@supports (backdrop-filter: blur(1px)) {
  #bgm-idx-toolbar {
    backdrop-filter: blur(12px);
  }
}
#bgm-idx-toolbar.is-stuck {
  box-shadow: var(--idx-shadow-1);
}
#bgm-idx-toolbar .bgm-idx-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
#bgm-idx-toolbar .bgm-idx-row-sub {
  gap: 8px;
}
#bgm-idx-toolbar .bgm-idx-search {
  flex: 1 1 160px;
  min-width: 130px;
  display: flex;
}
#bgm-idx-toolbar .bgm-idx-search input {
  width: 100%;
  height: 26px;
  box-sizing: border-box;
  padding: 0 8px;
  border: 1px solid var(--idx-border);
  border-radius: var(--idx-radius-sm);
  background: var(--idx-surface-1);
  color: var(--idx-text-1);
  font: inherit;
  font-size: 12px;
  outline: none;
}
#bgm-idx-toolbar .bgm-idx-search input::placeholder {
  color: var(--idx-text-3);
}
#bgm-idx-toolbar .bgm-idx-search input:focus {
  border-color: var(--idx-accent);
  box-shadow: var(--idx-focus);
}
#bgm-idx-toolbar .bgm-idx-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0,0,0,0);
  white-space: nowrap;
  border: 0;
}
#bgm-idx-toolbar .bgm-idx-field {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
#bgm-idx-toolbar .bgm-idx-field > span {
  color: var(--idx-text-3);
  white-space: nowrap;
}
#bgm-idx-toolbar select {
  height: 26px;
  width: 72px;
  max-width: 72px;
  box-sizing: border-box;
  padding: 0 4px;
  border: 1px solid var(--idx-border);
  border-radius: var(--idx-radius-sm);
  background: var(--idx-surface-1);
  color: var(--idx-text-1);
  font: inherit;
  font-size: 11px;
}
#bgm-idx-toolbar select:focus-visible {
  outline: none;
  box-shadow: var(--idx-focus);
}
#bgm-idx-toolbar select:disabled {
  opacity: .45;
  cursor: not-allowed;
}
.bgm-idx-btn {
  height: 26px;
  box-sizing: border-box;
  padding: 0 9px;
  border: 1px solid var(--idx-border);
  border-radius: var(--idx-radius-sm);
  background: var(--idx-surface-1);
  color: var(--idx-text-2);
  font: inherit;
  font-size: 11px;
  line-height: 1;
  cursor: pointer;
  transition: background var(--idx-dur-fast) var(--idx-ease), color var(--idx-dur-fast) var(--idx-ease), transform 80ms var(--idx-ease);
}
.bgm-idx-btn:hover {
  background: var(--idx-surface-2);
  color: var(--idx-text-1);
}
.bgm-idx-btn:active {
  transform: scale(.98);
}
.bgm-idx-btn:focus-visible {
  outline: none;
  box-shadow: var(--idx-focus);
}
.bgm-idx-btn[aria-pressed="true"] {
  border-color: var(--idx-accent);
  color: var(--idx-accent);
}
.bgm-idx-btn:disabled {
  opacity: .45;
  cursor: default;
}
.bgm-idx-segmented {
  position: relative;
  display: inline-flex;
  box-sizing: border-box;
  padding: 2px;
  border: 1px solid var(--idx-border);
  border-radius: var(--idx-radius-pill);
  background: var(--idx-surface-3);
}
.bgm-idx-segmented button {
  position: relative;
  z-index: 1;
  height: 22px;
  padding: 0 9px;
  border: 0;
  border-radius: var(--idx-radius-pill);
  background: transparent;
  color: var(--idx-text-2);
  font: inherit;
  font-size: 11px;
  cursor: pointer;
}
.bgm-idx-segmented button[aria-pressed="true"] {
  color: var(--idx-text-1);
}
.bgm-idx-segmented button:focus-visible {
  outline: none;
  box-shadow: var(--idx-focus);
}
.bgm-idx-segmented .bgm-idx-thumb {
  position: absolute;
  top: 2px;
  bottom: 2px;
  left: 0;
  border-radius: var(--idx-radius-pill);
  background: var(--idx-surface-1);
  box-shadow: var(--idx-shadow-1);
  transition: transform var(--idx-dur) var(--idx-ease), width var(--idx-dur) var(--idx-ease);
}
.bgm-idx-chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}
#bgm-idx-toolbar [hidden],
#bgm-idx-pager[hidden],
#bgm-idx-top[hidden] {
  display: none !important;
}
.bgm-idx-chip {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  height: 22px;
  box-sizing: border-box;
  padding: 0 2px 0 8px;
  border: 1px solid var(--idx-border);
  border-radius: var(--idx-radius-pill);
  background: var(--idx-surface-3);
  color: var(--idx-text-2);
  font-size: 11px;
}
.bgm-idx-chip-x {
  width: 18px;
  height: 18px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--idx-text-3);
  font: inherit;
  line-height: 1;
  cursor: pointer;
}
.bgm-idx-chip-x:hover {
  background: var(--idx-surface-1);
  color: var(--idx-text-1);
}
.bgm-idx-stats {
  margin-left: auto;
  color: var(--idx-text-3);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
#browserItemList.bgm-idx-on {
  display: grid !important;
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  gap: 0 12px !important;
  align-items: stretch !important;
  margin: 0 !important;
  padding: 0 !important;
  list-style: none !important;
}
#browserItemList.bgm-idx-on > li.item {
  position: relative;
  display: grid !important;
  grid-template-columns: var(--idx-cover) minmax(0, 1fr) !important;
  grid-template-rows: auto auto auto auto auto auto !important;
  align-content: start !important;
  gap: 2px 10px !important;
  align-items: start !important;
  min-width: 0 !important;
  max-width: none !important;
  padding: 10px 12px !important;
  border: 0 !important;
  border-bottom: 1px solid var(--idx-border) !important;
  background: transparent !important;
  content-visibility: auto;
  contain-intrinsic-size: auto 136px;
}
#browserItemList.bgm-idx-on > li.item:hover {
  background: var(--idx-surface-2) !important;
}
#browserItemList.bgm-idx-on > li.item::after {
  content: none !important;
  display: none !important;
}
#browserItemList.bgm-idx-on > li.item > a.subjectCover {
  grid-column: 1 !important;
  grid-row: 1 / span 6 !important;
  display: block !important;
  width: var(--idx-cover) !important;
  min-width: 0 !important;
  min-height: 0 !important;
  max-width: var(--idx-cover) !important;
  aspect-ratio: auto !important;
  margin: 0 !important;
  overflow: hidden;
  border-radius: var(--idx-radius-sm);
}
#browserItemList.bgm-idx-on > li.item > a.subjectCover img.cover {
  display: block !important;
  width: 100% !important;
  max-width: 100% !important;
  height: auto !important;
  aspect-ratio: auto !important;
  margin: 0 !important;
  object-fit: cover !important;
  object-position: center top !important;
  border-radius: var(--idx-radius-sm) !important;
  opacity: 1;
  transition: opacity 300ms var(--idx-ease), transform 200ms var(--idx-ease);
}
#browserItemList.bgm-idx-on > li.item > a.subjectCover img.cover.is-loading {
  opacity: 0;
}
#browserItemList.bgm-idx-on > li.item > a.subjectCover img.cover.is-loaded {
  opacity: 1;
}
#browserItemList.bgm-idx-on > li.item:hover > a.subjectCover img.cover {
  transform: scale(1.02);
}
#browserItemList.bgm-idx-on > li.item > div.inner {
  display: contents !important;
  margin: 0 !important;
  padding: 0 !important;
}
#browserItemList.bgm-idx-on > li.item > div.inner > h3 {
  grid-column: 2 !important;
  grid-row: 1 !important;
  min-width: 0;
  margin: 0 !important;
  padding: 0 !important;
  max-height: none !important;
  font-size: 15px !important;
  font-weight: 600 !important;
  line-height: 1.35 !important;
}
#browserItemList.bgm-idx-on > li.item > div.inner > h3 a.l {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: var(--idx-text-1);
  text-decoration: none;
  overflow-wrap: anywhere;
}
#browserItemList.bgm-idx-on > li.item > div.inner > h3 a.l:hover {
  color: var(--idx-accent);
}
#browserItemList.bgm-idx-on > li.item > div.inner > p.info {
  display: block !important;
  grid-column: 2 !important;
  grid-row: 2 !important;
  min-height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  font-size: 12px !important;
  line-height: 1.5 !important;
  color: var(--idx-text-2) !important;
}
#browserItemList.bgm-idx-on .bgm-idx-staff,
#browserItemList.bgm-idx-on .bgm-idx-sep {
  display: none;
}
#browserItemList.bgm-idx-on.bgm-idx-show-staff .bgm-idx-staff,
#browserItemList.bgm-idx-on.bgm-idx-show-staff .bgm-idx-sep {
  display: inline;
}
#browserItemList.bgm-idx-on[data-bgm-view="timeline"] .bgm-idx-date {
  display: none;
}

#browserItemList.bgm-idx-on li.item p.rateInfo {
  display: none !important;
}

#browserItemList.bgm-idx-on li.item .bgm-idx-score {
  grid-column: 2 !important;
  grid-row: 3 !important;
  justify-self: start;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: 11px;
  line-height: 1;
  color: var(--idx-text-3);
  white-space: nowrap;
}
#browserItemList.bgm-idx-on li.item .bgm-idx-score-value {
  font-size: 13px;
  font-weight: 700;
  color: var(--idx-score);
  font-variant-numeric: tabular-nums;
  opacity: 0;
  transform: translateY(2px);
  transition: opacity 300ms var(--idx-ease), transform 300ms var(--idx-ease);
}
#browserItemList.bgm-idx-on li.item .bgm-idx-score.is-ready .bgm-idx-score-value {
  opacity: 1;
  transform: none;
}
#browserItemList.bgm-idx-on li.item .bgm-idx-score.is-empty .bgm-idx-score-value {
  color: var(--idx-text-3);
  font-weight: 400;
}
#browserItemList.bgm-idx-on li.item .bgm-idx-score-bar {
  position: relative;
  width: 56px;
  height: 4px;
  overflow: hidden;
  border-radius: var(--idx-radius-pill);
  background: var(--idx-surface-3);
}
#browserItemList.bgm-idx-on li.item .bgm-idx-score-fill {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  background: var(--idx-score);
  background: linear-gradient(90deg, var(--idx-score), color-mix(in srgb, var(--idx-score) 55%, #fff));
  transform: scaleX(0);
  transform-origin: left center;
  transition: transform 700ms var(--idx-ease);
}
#browserItemList.bgm-idx-on li.item .bgm-idx-score.is-ready .bgm-idx-score-fill {
  transform: scaleX(var(--score-ratio, 0));
}
#browserItemList.bgm-idx-on li.item .bgm-idx-score.is-empty .bgm-idx-score-bar {
  display: none;
}
#browserItemList.bgm-idx-on li.item .bgm-idx-score-count {
  font-size: 10px;
  color: var(--idx-text-3);
}
#browserItemList.bgm-idx-on > li.item > div.inner > div.collectBlock {
  position: relative !important;
  top: auto !important;
  right: auto !important;
  bottom: auto !important;
  left: auto !important;
  grid-column: 2 !important;
  grid-row: 4 !important;
  align-self: start !important;
  justify-self: start;
  margin: 2px 0 0 !important;
  z-index: 2;
}
#browserItemList.bgm-idx-on li.item p.collectInfo {
  display: block !important;
  grid-column: 2 !important;
  grid-row: 5 !important;
  margin: 0 !important;
  padding: 0 !important;
  font-size: 11px !important;
  color: var(--idx-text-3) !important;
}
#browserItemList.bgm-idx-collection li.item p.collectInfo {
  display: none !important;
}
#browserItemList.bgm-idx-on li.item p.tools {
  display: block !important;
  grid-column: 2 !important;
  grid-row: 6 !important;
  margin: 0 !important;
  padding: 0 !important;
  font-size: 11px !important;
  opacity: 0;
  transition: opacity var(--idx-dur-fast) var(--idx-ease);
}
#browserItemList.bgm-idx-on li.item:hover p.tools,
#browserItemList.bgm-idx-on li.item:focus-within p.tools {
  opacity: 1;
}
@media (hover: none) {
  #browserItemList.bgm-idx-on li.item p.tools {
    opacity: 1;
  }
}
#browserItemList.bgm-idx-on li.item span.rank {
  display: none !important;
}
#browserItemList.bgm-idx-on[data-bgm-view="timeline"] > li.item.is-today {
  box-shadow: inset 2px 0 0 var(--idx-accent);
}
#browserItemList.bgm-idx-on > li.bgm-idx-group {
  grid-column: 1 / -1;
  position: -webkit-sticky;
  position: sticky;
  top: calc(var(--idx-sticky-top) + var(--idx-toolbar-height));
  z-index: 4;
  display: flex;
  align-items: center;
  gap: 8px;
  box-sizing: border-box;
  padding: 8px 12px 6px 18px;
  background: var(--idx-surface-1);
  background: color-mix(in srgb, var(--idx-surface-1) 90%, transparent);
  border-bottom: 1px solid var(--idx-border);
  color: var(--idx-text-2);
  font-size: 12px;
  font-weight: 600;
  list-style: none;
}
@supports (backdrop-filter: blur(1px)) {
  #browserItemList.bgm-idx-on > li.bgm-idx-group {
    backdrop-filter: blur(10px);
  }
}
#browserItemList.bgm-idx-on > li.bgm-idx-group::before {
  content: "";
  position: absolute;
  left: 5px;
  top: 50%;
  width: 7px;
  height: 7px;
  margin-top: -3.5px;
  border-radius: 50%;
  background: var(--idx-accent);
}
#browserItemList.bgm-idx-on > li.bgm-idx-group .bgm-idx-group-meta {
  margin-left: auto;
  color: var(--idx-text-3);
  font-weight: 400;
  font-variant-numeric: tabular-nums;
}
#browserItemList.bgm-idx-on > li.bgm-idx-group .bgm-idx-today {
  display: inline-flex;
  align-items: center;
  height: 16px;
  padding: 0 6px;
  border-radius: var(--idx-radius-pill);
  background: var(--idx-accent);
  color: #fff;
  font-size: 10px;
  line-height: 1;
}
#browserItemList.bgm-idx-on > li.item[hidden] {
  display: none !important;
}
#browserItemList.bgm-idx-on > li.bgm-idx-empty {
  grid-column: 1 / -1;
  display: block;
  padding: 28px 12px;
  color: var(--idx-text-3);
  text-align: center;
  list-style: none;
}
#browserItemList.bgm-idx-on > li.bgm-idx-empty .bgm-idx-btn {
  margin-top: 8px;
}
#bgm-idx-pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-sizing: border-box;
  padding: 14px 8px;
  color: var(--idx-text-2);
  font-size: 12px;
}
#bgm-idx-pager .bgm-idx-page-info {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-variant-numeric: tabular-nums;
}
#bgm-idx-page {
  width: 48px;
  height: 24px;
  box-sizing: border-box;
  padding: 0 4px;
  border: 1px solid var(--idx-border);
  border-radius: var(--idx-radius-sm);
  background: var(--idx-surface-1);
  color: var(--idx-text-1);
  font: inherit;
  text-align: center;
}
#bgm-idx-top {
  position: fixed;
  right: 18px;
  bottom: 76px;
  z-index: 21;
  width: 34px;
  height: 34px;
  box-sizing: border-box;
  border: 1px solid var(--idx-border);
  border-radius: 50%;
  background: var(--idx-surface-1);
  color: var(--idx-text-2);
  font: inherit;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  box-shadow: var(--idx-shadow-1);
}
#bgm-idx-top:hover {
  color: var(--idx-accent);
}
#bgm-idx-top:focus-visible {
  outline: none;
  box-shadow: var(--idx-focus);
}
html.bgm-idx-focus #columnSubjectBrowserB,
html.bgm-idx-focus #header,
html.bgm-idx-focus .grp_box,
html.bgm-idx-focus #browserTools {
  display: none !important;
}
html.bgm-idx-focus #columnSubjectBrowserA {
  width: 100% !important;
  float: none !important;
}
html.bgm-idx-focus #browserItemList.bgm-idx-on {
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)) !important;
}
@media (max-width: 720px) {
  #bgm-idx-toolbar {
    position: static;
  }
  #bgm-idx-toolbar .bgm-idx-row {
    gap: 4px;
  }
  #bgm-idx-toolbar .bgm-idx-stats {
    width: 100%;
    margin-left: 0;
    white-space: normal;
  }
  html.bgm-idx-ready {
    --idx-cover: 48px;
  }
  #browserItemList.bgm-idx-on {
    grid-template-columns: minmax(0, 1fr) !important;
  }
  #browserItemList.bgm-idx-on li.item .bgm-idx-score-bar {
    width: 44px;
  }

  html.bgm-idx-focus #browserItemList.bgm-idx-on {
    grid-template-columns: minmax(0, 1fr) !important;
  }
}
#browserItemList.bgm-idx-on li.item .bgm-idx-myrate {
  display: none;
  align-items: center;
  padding: 0 4px;
  border-radius: var(--idx-radius-pill);
  background: transparent;
  color: var(--idx-accent);
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
}
#browserItemList.bgm-idx-on li.item .bgm-idx-score.has-myrate .bgm-idx-myrate {
  display: inline-flex;
}
#browserItemList.bgm-idx-on li.item .bgm-idx-score-mymark {
  position: absolute;
  top: 0;
  bottom: 0;
  left: calc(var(--my-ratio, 0) * 100%);
  width: 2px;
  margin-left: -1px;
  border-radius: 2px;
  background: var(--idx-accent);
  opacity: 0;
  box-shadow: 0 0 0 1px var(--idx-surface-1);
  transition: opacity var(--idx-dur) var(--idx-ease);
}
#browserItemList.bgm-idx-on li.item .bgm-idx-score.has-myrate .bgm-idx-score-mymark {
  opacity: 1;
}
#browserItemList.bgm-idx-on li.item .bgm-idx-watch-count {
  display: none !important;
  position: absolute;
  right: 12px;
  bottom: 8px;
  color: var(--idx-text-3);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
#browserItemList.bgm-idx-on.bgm-idx-show-staff:not([data-bgm-view="grid"]) li.item .bgm-idx-watch-count {
  display: inline-flex !important;
}
#browserItemList.bgm-idx-on li.item .bgm-idx-watch-count[hidden] {
  display: none !important;
}

#browserItemList.bgm-idx-on li.item .bgm-idx-state {
  display: none;
  align-items: center;
  padding: 1px 6px;
  border-radius: var(--idx-radius-pill);
  background: var(--idx-surface-3);
  color: var(--idx-text-2);
  font-size: 10px;
  line-height: 1.6;
  white-space: nowrap;
}
#browserItemList.bgm-idx-on li.item .bgm-idx-state.is-empty {
  display: none !important;
}
#browserItemList.bgm-idx-on[data-bgm-density="relaxed"] {
  --idx-cover: 76px;
}
#browserItemList.bgm-idx-on[data-bgm-density="relaxed"] > li.item {
  padding: 14px 14px !important;
  gap: 3px 12px !important;
  contain-intrinsic-size: auto 150px;
}
#browserItemList.bgm-idx-on[data-bgm-density="relaxed"] > li.item > div.inner > h3 {
  font-size: 16px !important;
}
#browserItemList.bgm-idx-on[data-bgm-view="grid"] {
  grid-template-columns: repeat(auto-fill, minmax(var(--idx-cover-cell, 120px), 1fr)) !important;
  gap: 8px !important;
  padding: 4px 0 !important;
}
#browserItemList.bgm-idx-on[data-bgm-view="grid"][data-bgm-cover-size="small"] {
  --idx-cover-cell: 96px;
}
#browserItemList.bgm-idx-on[data-bgm-view="grid"][data-bgm-cover-size="medium"] {
  --idx-cover-cell: 120px;
}
#browserItemList.bgm-idx-on[data-bgm-view="grid"][data-bgm-cover-size="large"] {
  --idx-cover-cell: 160px;
}
#browserItemList.bgm-idx-on[data-bgm-view="grid"] > li.item {
  display: block !important;
  padding: 0 !important;
  border: 0 !important;
  background: transparent !important;
  position: relative;
  border-radius: 6px;
  content-visibility: auto;
  contain-intrinsic-size: auto 180px;
}
#browserItemList.bgm-idx-on[data-bgm-view="grid"] > li.item > a.subjectCover {
  grid-column: auto !important;
  grid-row: auto !important;
  display: block !important;
  width: 100% !important;
  min-width: 0 !important;
  max-width: 100% !important;
  aspect-ratio: 3 / 4 !important;
  overflow: hidden;
  border-radius: 6px;
  box-shadow: var(--idx-shadow-1);
  transition: transform 180ms var(--idx-ease), box-shadow 180ms var(--idx-ease);
}
#browserItemList.bgm-idx-on[data-bgm-view="grid"] > li.item > a.subjectCover img.cover {
  display: block !important;
  width: 100% !important;
  max-width: 100% !important;
  height: 100% !important;
  aspect-ratio: 3 / 4 !important;
  object-fit: cover !important;
  object-position: center top !important;
}
#browserItemList.bgm-idx-on[data-bgm-view="grid"] > li.item:hover > a.subjectCover {
  transform: translateY(-2px);
  box-shadow: var(--idx-shadow-2);
}
#browserItemList.bgm-idx-on[data-bgm-view="grid"] > li.item > div.inner {
  display: contents !important;
}
#browserItemList.bgm-idx-on[data-bgm-view="grid"] > li.item > div.inner > h3 {
  position: absolute !important;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 3;
  grid-column: auto !important;
  grid-row: auto !important;
  margin: 0 !important;
  padding: 22px 8px 7px !important;
  border-radius: 0 0 6px 6px;
  background: linear-gradient(transparent, rgba(0, 0, 0, .88));
  color: #fff !important;
  font-size: 12px !important;
  line-height: 1.4 !important;
  opacity: 0;
  transform: translateY(4px);
  pointer-events: none;
  transition: opacity var(--idx-dur) var(--idx-ease), transform var(--idx-dur) var(--idx-ease);
}
#browserItemList.bgm-idx-on[data-bgm-view="grid"] > li.item > div.inner > h3 a.l {
  color: #fff !important;
  -webkit-line-clamp: 2;
}
#browserItemList.bgm-idx-on[data-bgm-view="grid"] > li.item:hover > div.inner > h3,
#browserItemList.bgm-idx-on[data-bgm-view="grid"] > li.item:focus-within > div.inner > h3 {
  opacity: 1;
  transform: none;
}
#browserItemList.bgm-idx-on[data-bgm-view="grid"] li.item p.info,
#browserItemList.bgm-idx-on[data-bgm-view="grid"] li.item div.collectBlock,
#browserItemList.bgm-idx-on[data-bgm-view="grid"] li.item p.collectInfo,
#browserItemList.bgm-idx-on[data-bgm-view="grid"] li.item p.tools,
#browserItemList.bgm-idx-on[data-bgm-view="grid"] li.item p.rateInfo,
#browserItemList.bgm-idx-on[data-bgm-view="grid"] li.item span.rank,
#browserItemList.bgm-idx-on[data-bgm-view="grid"] li.item .bgm-idx-alias,
#browserItemList.bgm-idx-on[data-bgm-view="grid"] li.item h3 small {
  display: none !important;
}
#browserItemList.bgm-idx-on[data-bgm-view="grid"] li.item .bgm-idx-score {
  position: absolute !important;
  top: 6px;
  right: 6px;
  grid-column: auto !important;
  grid-row: auto !important;
  z-index: 2;
  display: inline-flex;
  padding: 2px 6px;
  border-radius: var(--idx-radius-pill);
  background: rgba(0, 0, 0, .62);
  color: #fff;
  gap: 4px;
  opacity: 0;
  transform: translateY(-2px);
  pointer-events: none;
  backdrop-filter: blur(6px);
  transition: opacity var(--idx-dur) var(--idx-ease), transform var(--idx-dur) var(--idx-ease);
}
#browserItemList.bgm-idx-on[data-bgm-view="grid"] li.item .bgm-idx-score-value {
  color: #fff !important;
  font-size: 12px;
}
#browserItemList.bgm-idx-on[data-bgm-view="grid"] li.item .bgm-idx-score-bar,
#browserItemList.bgm-idx-on[data-bgm-view="grid"] li.item .bgm-idx-score-count {
  display: none !important;
}
#browserItemList.bgm-idx-on[data-bgm-view="grid"] li.item .bgm-idx-score.has-myrate .bgm-idx-myrate {
  display: inline-flex !important;
  background: rgba(255, 255, 255, .18);
  color: var(--idx-accent) !important;
}
#browserItemList.bgm-idx-on[data-bgm-view="grid"] li.item .bgm-idx-state {
  position: absolute;
  top: 6px;
  left: 6px;
  z-index: 2;
  display: inline-flex;
  background: rgba(0, 0, 0, .62);
  color: #fff;
  opacity: 0;
  transform: translateY(-2px);
  pointer-events: none;
  backdrop-filter: blur(6px);
  transition: opacity var(--idx-dur) var(--idx-ease), transform var(--idx-dur) var(--idx-ease);
}
#browserItemList.bgm-idx-on[data-bgm-view="grid"] li.item .bgm-idx-state.is-empty {
  display: none !important;
}
#browserItemList.bgm-idx-on[data-bgm-view="grid"] > li.bgm-idx-group {
  display: none !important;
}
#browserItemList.bgm-idx-on[data-bgm-view="grid"] li.item > div.inner > *:not(h3) {
  display: none !important;
}
#browserItemList.bgm-idx-on[data-bgm-view="grid"] > li.item:hover > div.inner > h3,
#browserItemList.bgm-idx-on[data-bgm-view="grid"] > li.item:hover .bgm-idx-score,
#browserItemList.bgm-idx-on[data-bgm-view="grid"] > li.item:hover .bgm-idx-state,
#browserItemList.bgm-idx-on[data-bgm-view="grid"] > li.item:focus-within .bgm-idx-score,
#browserItemList.bgm-idx-on[data-bgm-view="grid"] > li.item:focus-within .bgm-idx-state {
  opacity: 1;
  transform: none;
}
html.bgm-idx-focus #browserItemList.bgm-idx-on[data-bgm-view="grid"] {
  grid-template-columns: repeat(auto-fill, minmax(var(--idx-cover-cell, 120px), 1fr)) !important;
}
@media (max-width: 720px) {
  #browserItemList.bgm-idx-on[data-bgm-view="grid"] {
    grid-template-columns: repeat(auto-fill, minmax(var(--idx-cover-cell, 120px), 1fr)) !important;
    gap: 8px !important;
  }
  html.bgm-idx-focus #browserItemList.bgm-idx-on[data-bgm-view="grid"] {
    grid-template-columns: repeat(auto-fill, minmax(var(--idx-cover-cell, 120px), 1fr)) !important;
  }
  #browserItemList.bgm-idx-on[data-bgm-density="relaxed"] {
    --idx-cover: 56px;
  }
}
#browserItemList.bgm-idx-on h3 .ico_subject_type {
  display: none !important;
}
#browserItemList.bgm-idx-on h3 > *:not(.ico_subject_type):not(a.l):not(.bgm-idx-alias) {
  display: none !important;
}
#browserItemList.bgm-idx-on h3 a.l small,
#browserItemList.bgm-idx-on h3 a.l .grey,
#browserItemList.bgm-idx-on h3 a.l .sub,
#browserItemList.bgm-idx-on h3 a.l .subtitle,
#browserItemList.bgm-idx-on h3 a.l .name_cn,
#browserItemList.bgm-idx-on h3 a.l .alias {
  display: none !important;
}
#browserItemList.bgm-idx-on h3 + small,
#browserItemList.bgm-idx-on h3 + .subtitle,
#browserItemList.bgm-idx-on h3 + .alias,
#browserItemList.bgm-idx-on h3 + .name_cn,
#browserItemList.bgm-idx-on h3 + .grey {
  display: none !important;
}
#browserItemList.bgm-idx-on h3 .bgm-idx-original-alias {
  display: none !important;
}
#browserItemList.bgm-idx-on .bgm-idx-alias {
  display: none;
  margin-top: 2px;
  color: var(--idx-text-3);
  font-size: 12px;
  font-weight: 400;
  line-height: 1.4;
  text-align: left;
}
#browserItemList.bgm-idx-on.bgm-idx-show-staff .bgm-idx-alias {
  display: block;
}
#browserItemList.bgm-idx-other li.item p.collectInfo {
  display: none !important;
}
#browserItemList.bgm-idx-other:not([data-bgm-view="grid"]) li.item .bgm-idx-state {
  display: none !important;
}
.bgm-idx-sort {
  position: relative;
  display: inline-flex;
}
#bgm-idx-sort-btn {
  min-width: 64px;
  padding: 0 6px;
  justify-content: center;
}
.bgm-idx-sort-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 60;
  min-width: 118px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  box-sizing: border-box;
  padding: 4px;
  border: 1px solid var(--idx-border);
  border-radius: var(--idx-radius-md);
  background: var(--idx-surface-1);
  box-shadow: var(--idx-shadow-2);
}
.bgm-idx-sort-menu[hidden] {
  display: none !important;
}
.bgm-idx-sort-menu button {
  display: block;
  width: 100%;
  padding: 6px 8px;
  border: 0;
  border-radius: var(--idx-radius-sm);
  background: transparent;
  color: var(--idx-text-2);
  font: inherit;
  font-size: 11px;
  text-align: left;
  cursor: pointer;
}
.bgm-idx-sort-menu button:hover {
  background: var(--idx-surface-2);
  color: var(--idx-text-1);
}
.bgm-idx-sort-menu button[aria-pressed="true"] {
  color: var(--idx-accent);
  font-weight: 600;
}
.bgm-idx-sort-menu button:focus-visible {
  outline: none;
  box-shadow: var(--idx-focus);
}
.bgm-idx-sort-menu button[hidden] {
  display: none !important;
}
#bgm-idx-crt-toolbar {
  margin: 8px 0 10px;
}
.browserCrtList.bgm-idx-crt-on {
  display: grid !important;
  grid-template-columns: repeat(auto-fill, minmax(var(--idx-crt-size, 140px), 1fr)) !important;
  gap: 8px !important;
  margin: 0 !important;
  padding: 0 !important;
}
.browserCrtList.bgm-idx-crt-on[data-bgm-crt-size="small"] {
  --idx-crt-size: 100px;
}
.browserCrtList.bgm-idx-crt-on[data-bgm-crt-size="medium"] {
  --idx-crt-size: 140px;
}
.browserCrtList.bgm-idx-crt-on[data-bgm-crt-size="large"] {
  --idx-crt-size: 180px;
}
.browserCrtList.bgm-idx-crt-on > div[id^="item_character"] {
  position: relative !important;
  display: block !important;
  width: auto !important;
  min-height: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
  float: none !important;
  clear: none !important;
  overflow: hidden;
  border: 0 !important;
  border-radius: 6px;
  background: var(--idx-surface-2) !important;
}
.browserCrtList.bgm-idx-crt-on > div[id^="item_character"]::after {
  content: none !important;
  display: none !important;
}
.browserCrtList.bgm-idx-crt-on > div[id^="item_character"] > a.avatar {
  display: block !important;
  width: 100% !important;
  height: auto !important;
  padding: 0 !important;
  margin: 0 !important;
  float: none !important;
}
.browserCrtList.bgm-idx-crt-on > div[id^="item_character"] > a.avatar img {
  display: block !important;
  width: 100% !important;
  height: auto !important;
  max-width: 100% !important;
  aspect-ratio: 3 / 4;
  object-fit: contain !important;
  border-radius: 6px;
  background: var(--idx-surface-2);
  transition: transform 180ms var(--idx-ease);
}
.browserCrtList.bgm-idx-crt-on > div[id^="item_character"]:hover > a.avatar img {
  transform: scale(1.015);
}
.browserCrtList.bgm-idx-crt-on > div[id^="item_character"] > div {
  position: absolute !important;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  padding: 0 8px 7px !important;
  background: none !important;
  pointer-events: auto;
  opacity: 0;
  transform: translateY(4px);
  transition: opacity var(--idx-dur) var(--idx-ease), transform var(--idx-dur) var(--idx-ease);
}
.browserCrtList.bgm-idx-crt-on > div[id^="item_character"]:hover > div,
.browserCrtList.bgm-idx-crt-on > div[id^="item_character"]:focus-within > div {
  opacity: 1;
  transform: none;
  pointer-events: auto;
}
.browserCrtList.bgm-idx-crt-on > div[id^="item_character"] > div h3 {
  margin: 0 !important;
  padding: 0 !important;
  font-size: 12px !important;
  line-height: 1.4 !important;
}
.browserCrtList.bgm-idx-crt-on > div[id^="item_character"] > div h3 a.l {
  color: #fff !important;
  text-shadow: 0 1px 3px rgba(0, 0, 0, .95), 0 0 10px rgba(0, 0, 0, .75);
}
.bgm-idx-crt-name {
  pointer-events: auto !important;
  cursor: pointer !important;
}
.browserCrtList.bgm-idx-crt-on > div[id^="item_character"] .prsn_info {
  display: none !important;
}
.browserCrtList.bgm-idx-crt-on > div[id^="item_character"] .text,
.browserCrtList.bgm-idx-crt-on > div[id^="item_character"] .tools {
  display: none !important;
}
.bgm-idx-crt-acts {
  position: absolute;
  top: 3px;
  left: 3px;
  right: 3px;
  z-index: 4;
  display: flex;
  justify-content: space-between;
  opacity: 0;
  transform: translateY(-3px);
  pointer-events: none;
  transition: opacity var(--idx-dur-fast) var(--idx-ease), transform var(--idx-dur-fast) var(--idx-ease);
}
.browserCrtList.bgm-idx-crt-on > div[id^="item_character"]:hover .bgm-idx-crt-acts,
.browserCrtList.bgm-idx-crt-on > div[id^="item_character"]:focus-within .bgm-idx-crt-acts {
  opacity: 1;
  transform: none;
  pointer-events: auto;
}
.bgm-idx-crt-act {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: #fff;
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, .55));
  cursor: pointer;
  transition: transform var(--idx-dur-fast) var(--idx-ease), filter var(--idx-dur-fast) var(--idx-ease);
}
.bgm-idx-crt-act:hover {
  transform: scale(1.12);
  filter: drop-shadow(0 1px 4px rgba(0, 0, 0, .75));
}
.bgm-idx-crt-act:focus-visible {
  outline: none;
  box-shadow: var(--idx-focus);
}
.bgm-idx-crt-act svg {
  display: block;
  width: 16px;
  height: 16px;
}
.bgm-idx-crt-heart {
  color: var(--idx-accent);
}
.bgm-idx-crt-comment:hover,
.bgm-idx-crt-heart:hover {
  background: transparent;
}
.bgm-idx-crt-act.is-busy {
  opacity: .5;
  pointer-events: none;
}
.bgm-idx-crt-item.is-leaving {
  opacity: 0 !important;
  transform: scale(.94);
  transition: opacity 220ms var(--idx-ease), transform 220ms var(--idx-ease);
}
.bgm-idx-crt-item.is-dragging {
  opacity: .92;
  box-shadow: var(--idx-shadow-2);
  z-index: 6;
  cursor: grabbing;
}
.browserCrtList.bgm-idx-crt-on > div[id^="item_character"].is-dragging,
.browserCrtList.bgm-idx-crt-on > div[id^="item_character"].is-dragging * {
  pointer-events: none !important;
}
.browserCrtList.bgm-idx-crt-on > div[id^="item_character"].is-dragging {
  position: fixed !important;
  z-index: 100;
  transform: scale(1.03);
  transition: none !important;
}
.bgm-idx-crt-placeholder {
  border: 2px dashed var(--idx-accent);
  border-radius: 6px;
  background: color-mix(in srgb, var(--idx-accent) 10%, transparent);
  box-sizing: border-box;
}
.bgm-idx-crt-item.is-dragging > a.avatar img {
  transform: none !important;
}
html.bgm-idx-dragging,
html.bgm-idx-dragging * {
  cursor: grabbing !important;
  user-select: none !important;
}
.browserCrtList.is-saving {
  opacity: .95;
}
.browserCrtList.bgm-idx-crt-on > div[id^="item_character"][hidden] {
  display: none !important;
}
#columnSubjectBrowserA .browserCrtList.bgm-idx-crt-on.bgm-idx-crt-directory {
  display: grid !important;
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  gap: 10px !important;
  margin: 0 !important;
  padding: 0 !important;
}
#columnSubjectBrowserA .browserCrtList.bgm-idx-crt-on.bgm-idx-crt-directory > div[id^="item_character"] {
  display: grid !important;
  grid-template-columns: 96px minmax(0, 1fr) !important;
  height: 124px !important;
  padding: 0 !important;
  border: 1px solid var(--idx-border) !important;
  border-radius: var(--idx-radius-md, 10px) !important;
  background: var(--idx-surface-1) !important;
  overflow: hidden !important;
}
#columnSubjectBrowserA .browserCrtList.bgm-idx-crt-on.bgm-idx-crt-directory > div[id^="item_character"] > a.avatar {
  grid-column: 1 !important;
  grid-row: 1 !important;
  width: 96px !important;
  height: 124px !important;
  display: block !important;
  margin: 0 !important;
}
#columnSubjectBrowserA .browserCrtList.bgm-idx-crt-on.bgm-idx-crt-directory > div[id^="item_character"] > a.avatar img {
  width: 100% !important;
  height: 100% !important;
  object-fit: contain !important;
  background: var(--idx-surface-2) !important;
  border-radius: 0 !important;
}
#columnSubjectBrowserA .browserCrtList.bgm-idx-crt-on.bgm-idx-crt-directory > div[id^="item_character"] > div.bgm-idx-crt-name {
  grid-column: 2 !important;
  grid-row: 1 !important;
  position: static !important;
  opacity: 1 !important;
  transform: none !important;
  padding: 10px 12px !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: center !important;
  gap: 5px !important;
  background: transparent !important;
  pointer-events: auto !important;
}
#columnSubjectBrowserA .browserCrtList.bgm-idx-crt-on.bgm-idx-crt-directory > div[id^="item_character"] > div h3 {
  margin: 0 !important;
  padding: 0 !important;
  font-size: 14px !important;
  line-height: 1.4 !important;
}
#columnSubjectBrowserA .browserCrtList.bgm-idx-crt-on.bgm-idx-crt-directory > div[id^="item_character"] > div h3 a.l {
  color: var(--idx-text-1) !important;
  text-shadow: none !important;
}
#columnSubjectBrowserA .browserCrtList.bgm-idx-crt-on.bgm-idx-crt-directory > div[id^="item_character"] > div .prsn_info {
  display: block !important;
  font-size: 12px !important;
  color: var(--idx-text-3) !important;
}
#columnSubjectBrowserA .browserCrtList.bgm-idx-crt-on.bgm-idx-crt-directory > div[id^="item_character"] > div .prsn_info .tip {
  color: inherit !important;
}
#columnSubjectBrowserA .browserCrtList.bgm-idx-crt-on.bgm-idx-crt-directory > div[id^="item_character"] .bgm-idx-crt-acts {
  top: auto !important;
  bottom: 8px !important;
  right: 8px !important;
}
@media (max-width: 720px) {
  #columnSubjectBrowserA .browserCrtList.bgm-idx-crt-on.bgm-idx-crt-directory {
    grid-template-columns: 1fr !important;
  }
  #columnSubjectBrowserA .browserCrtList.bgm-idx-crt-on.bgm-idx-crt-directory > div[id^="item_character"] {
    height: 110px !important;
    grid-template-columns: 86px minmax(0, 1fr) !important;
  }
  #columnSubjectBrowserA .browserCrtList.bgm-idx-crt-on.bgm-idx-crt-directory > div[id^="item_character"] > a.avatar {
    width: 86px !important;
    height: 110px !important;
  }
}
#browserItemList.bgm-idx-on > li.bgm-idx-type-sep {
  grid-column: 1 / -1;
  display: flex !important;
  align-items: center;
  gap: 8px;
  padding: 8px 0 2px !important;
  margin: 0 !important;
  list-style: none !important;
  background: none !important;
}
.bgm-idx-type-sep .bgm-idx-type-line {
  flex: 1;
  height: 1px;
  background: var(--idx-accent);
}
.bgm-idx-type-sep .bgm-idx-type-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--idx-accent);
  letter-spacing: .08em;
  white-space: nowrap;
}
#timeline.index-list ul > li.bgm-idx-ui-year {
  display: flex !important;
  align-items: center;
  gap: 8px;
  padding: 10px 0 4px !important;
  margin: 0 !important;
  list-style: none !important;
  border: 0 !important;
  background: none !important;
}
.bgm-idx-ui-year .bgm-idx-ui-year-line {
  flex: 1;
  height: 1px;
  background: var(--idx-border);
}
.bgm-idx-ui-year .bgm-idx-ui-year-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--idx-text-3);
  white-space: nowrap;
}
#timeline.index-list li.index-item {
  position: relative !important;
}
.bgm-idx-ui-file-btn {
  position: absolute;
  right: 8px;
  bottom: 8px;
  padding: 2px 9px;
  border: 1px solid var(--idx-border);
  border-radius: 999px;
  background: var(--idx-surface-1);
  color: var(--idx-text-3);
  font: inherit;
  font-size: 11px;
  line-height: 1.6;
  cursor: pointer;
  opacity: 0;
  transition: opacity var(--idx-dur-fast) var(--idx-ease);
}
#timeline.index-list li.index-item:hover .bgm-idx-ui-file-btn,
.bgm-idx-ui-file-btn:focus-visible {
  opacity: 1;
}
.bgm-idx-ui-menu {
  position: fixed;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  min-width: 180px;
  padding: 4px;
  border: 1px solid var(--idx-border);
  border-radius: 8px;
  background: var(--idx-surface-1);
  box-shadow: var(--idx-shadow-2);
}
.bgm-idx-ui-menu button {
  padding: 6px 10px;
  border: 0;
  border-radius: 5px;
  background: none;
  color: var(--idx-text-1);
  font: inherit;
  font-size: 12px;
  text-align: left;
  cursor: pointer;
}
.bgm-idx-ui-menu button:hover {
  background: var(--idx-surface-2);
}
.bgm-idx-ui-menu .bgm-idx-ui-menu-new {
  color: var(--idx-accent);
}
.bgm-idx-ui-folder {
  display: flex !important;
  align-items: center;
  gap: 8px;
  padding: 14px 0 6px !important;
  margin: 0 !important;
  list-style: none !important;
  border: 0 !important;
  background: none !important;
}
.bgm-idx-ui-folder .bgm-idx-ui-folder-line {
  flex: 1;
  height: 1px;
  background: var(--idx-border);
}
.bgm-idx-ui-folder .bgm-idx-ui-folder-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--idx-text-3);
  white-space: nowrap;
}
.bgm-idx-ui-folder-del {
  padding: 0 4px;
  border: 0;
  background: none;
  color: var(--idx-text-3);
  font-size: 15px;
  line-height: 1;
  cursor: pointer;
}
.bgm-idx-ui-folder-del:hover {
  color: #d9534f;
}
#bgm-idx-ui-folders {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px;
  margin: 0 0 14px;
}
.bgm-idx-ui-folder-empty {
  grid-column: 1 / -1;
  padding: 14px;
  border: 1px dashed var(--idx-border);
  border-radius: 8px;
  color: var(--idx-text-3);
  font-size: 12px;
  text-align: center;
}
.bgm-idx-ui-folder-card {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 12px 14px;
  border: 1px solid var(--idx-border);
  border-radius: 10px;
  background: var(--idx-surface-1);
  cursor: pointer;
  transition: border-color var(--idx-dur-fast) var(--idx-ease), box-shadow var(--idx-dur-fast) var(--idx-ease);
}
.bgm-idx-ui-folder-card:hover {
  border-color: var(--idx-accent);
  box-shadow: var(--idx-shadow-1);
}
.bgm-idx-ui-folder-card.is-active {
  border-color: var(--idx-accent);
  background: color-mix(in srgb, var(--idx-accent) 7%, var(--idx-surface-1));
}
.bgm-idx-ui-folder-card-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
.bgm-idx-ui-folder-card-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--idx-text-1);
}
.bgm-idx-ui-folder-card-count {
  font-size: 11px;
  color: var(--idx-text-3);
  white-space: nowrap;
}
.bgm-idx-ui-folder-card-desc {
  min-height: 32px;
  color: var(--idx-text-3);
  font-size: 12px;
  line-height: 1.5;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.bgm-idx-ui-folder-card-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
#bgm-idx-ui-section {
  margin: 0 0 8px;
}
.bgm-idx-ui-section-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 6px 0;
  border-bottom: 1px solid var(--idx-border);
}
.bgm-idx-ui-section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--idx-text-2);
}
.bgm-idx-ui-section-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.bgm-idx-ui-section-desc {
  padding: 6px 0 0;
  color: var(--idx-text-3);
  font-size: 12px;
  line-height: 1.5;
}
#timeline.index-list li.index-item.is-multi {
  cursor: pointer;
}
#timeline.index-list li.index-item.is-multi a.l {
  pointer-events: none;
}
#timeline.index-list li.index-item.is-multi-selected {
  border-color: var(--idx-accent) !important;
  background: color-mix(in srgb, var(--idx-accent) 8%, var(--idx-surface-1)) !important;
}
.bgm-idx-btn.is-danger {
  color: #c94b4b;
  border-color: color-mix(in srgb, #c94b4b 45%, var(--idx-border));
}
.bgm-idx-subject-sortbar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0 0;
  flex-wrap: wrap;
}
.bgm-idx-subject-sortbar[hidden] {
  display: none !important;
}
.bgm-idx-subject-sortbar #bgm-idx-subject-sort-note {
  color: var(--idx-text-3);
  font-size: 12px;
}
#browserItemList.bgm-idx-on > li.item {
  position: relative;
}
#browserItemList.bgm-idx-on > li.item.is-subj-pick {
  cursor: pointer;
}
#browserItemList.bgm-idx-on > li.item.is-subj-pick a.l {
  pointer-events: none;
}
.bgm-idx-subj-pick {
  position: absolute;
  right: 8px;
  top: 8px;
  z-index: 8;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: var(--idx-accent);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  line-height: 18px;
  text-align: center;
}
#browserItemList.bgm-idx-on > li.item.is-subj-dragging {
  opacity: .45;
}
#browserItemList.bgm-idx-on > li.item .bgm-idx-card-star {
  position: absolute;
  right: 6px;
  top: 6px;
  z-index: 9;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 1px solid var(--idx-border);
  border-radius: 999px;
  background: var(--idx-surface-1);
  color: var(--idx-text-3);
  font-size: 15px;
  line-height: 22px;
  text-align: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity var(--idx-dur-fast) var(--idx-ease);
}
#browserItemList.bgm-idx-on > li.item:hover .bgm-idx-card-star,
#browserItemList.bgm-idx-on > li.item:focus-within .bgm-idx-card-star {
  opacity: 1;
}
#browserItemList.bgm-idx-on > li.item .bgm-idx-card-star.is-done {
  color: var(--idx-accent);
  border-color: var(--idx-accent);
}
#browserItemList.bgm-idx-on.is-star-batch > li.item .bgm-idx-card-star {
  opacity: 1;
}
#browserItemList.bgm-idx-on > li.item.is-star-picked .bgm-idx-card-star {
  background: var(--idx-accent);
  color: #fff;
  border-color: var(--idx-accent);
}
#browserItemList li.bgm-idx-browser-item {
  position: relative;
}
li.bgm-idx-browser-item .bgm-idx-card-star {
  position: absolute;
  right: 8px;
  top: 8px;
  z-index: 9;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 1px solid var(--idx-border);
  border-radius: 999px;
  background: var(--idx-surface-1);
  color: var(--idx-text-3);
  font-size: 15px;
  line-height: 22px;
  text-align: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity var(--idx-dur-fast) var(--idx-ease);
}
li.bgm-idx-browser-item:hover .bgm-idx-card-star {
  opacity: 1;
}
li.bgm-idx-browser-item .bgm-idx-card-star.is-done {
  color: var(--idx-accent);
  border-color: var(--idx-accent);
}
.bgm-idx-star-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
  flex-wrap: wrap;
}
.bgm-idx-star-bar[hidden] {
  display: none !important;
}
.bgm-idx-star-bar #bgm-idx-star-bar-note {
  color: var(--idx-text-3);
  font-size: 12px;
}
.bgm-idx-star-item:disabled {
  opacity: .55;
  cursor: default;
}
@media (hover: none) {
  #browserItemList.bgm-idx-on > li.item .bgm-idx-card-star {
    opacity: 1;
  }
}

#timeline.index-list li.index-item.is-dir-dragging {
  opacity: .45;
}
.bgm-idx-ui-drop-frame {
  position: fixed;
  z-index: 9999;
  box-sizing: border-box;
  pointer-events: none;
  border: 2px dashed var(--idx-accent);
  border-radius: 10px;
  background: color-mix(in srgb, var(--idx-accent) 8%, transparent);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--idx-accent) 22%, transparent);
  transition: left 80ms var(--idx-ease), top 80ms var(--idx-ease), width 80ms var(--idx-ease), height 80ms var(--idx-ease);
}
#timeline.index-list li.index-item.is-sort-pick {
  cursor: pointer;
}
#timeline.index-list li.index-item.is-sort-pick a.l {
  pointer-events: none;
}
.bgm-idx-ui-pick {
  position: absolute;
  right: 8px;
  bottom: 8px;
  z-index: 9;
  width: 16px;
  height: 16px;
  padding: 0;
  border-radius: 3px;
  background: var(--idx-accent);
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  line-height: 16px;
  text-align: center;
  pointer-events: none;
}
.bgm-idx-ui-select {
  position: absolute;
  right: 8px;
  bottom: 8px;
  left: auto;
  top: auto;
  z-index: 5;
  width: 16px;
  height: 16px;
  accent-color: var(--idx-accent);
  cursor: pointer;
}
.bgm-idx-btn.is-primary {
  border-color: transparent;
  background: var(--idx-accent);
  color: #fff;
}
#timeline.index-list li.index-item[hidden] {
  display: none !important;
}
@media (max-width: 720px) {
  .browserCrtList.bgm-idx-crt-on {
    gap: 6px !important;
  }
}
#bgm-idx-star-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-left: 8px;
  padding: 3px 10px;
  border: 1px solid var(--idx-accent);
  border-radius: 999px;
  background: var(--idx-surface-1);
  color: var(--idx-accent);
  font: inherit;
  font-size: 12px;
  line-height: 1.4;
  vertical-align: middle;
  cursor: pointer;
}
#bgm-idx-star-btn:hover {
  background: color-mix(in srgb, var(--idx-accent) 10%, var(--idx-surface-1));
}
#bgm-idx-star-btn.is-inline {
  float: right;
  margin-left: 8px;
  margin-right: 0;
}
#bgm-idx-star-btn.is-done {
  background: var(--idx-accent);
  color: #fff;
}
#bgm-idx-star-btn.is-float {
  position: fixed;
  right: 20px;
  bottom: 120px;
  z-index: 900;
  margin: 0;
  box-shadow: var(--idx-shadow-2);
}
#bgm-idx-star-btn {
  opacity: .45;
  transition: opacity var(--idx-dur-fast) var(--idx-ease);
}
#panelInterestWrapper:hover #bgm-idx-star-btn,
#bgm-idx-star-btn:hover,
#bgm-idx-star-btn:focus-visible {
  opacity: 1;
}
#bgm-idx-star-btn.is-float {
  opacity: 1;
}
#bgm-idx-star-btn.is-done svg {
  fill: currentColor;
}
.bgm-idx-star-mask {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(0, 0, 0, .35);
}
.bgm-idx-star-panel {
  display: flex;
  flex-direction: column;
  gap: 9px;
  width: 380px;
  max-width: 100%;
  max-height: 70vh;
  padding: 14px;
  border: 1px solid var(--idx-border);
  border-radius: 12px;
  background: var(--idx-surface-1);
  box-shadow: var(--idx-shadow-2);
}
.bgm-idx-star-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: var(--idx-text-1);
  font-size: 14px;
  font-weight: 600;
}
.bgm-idx-star-close {
  padding: 0 4px;
  border: 0;
  background: none;
  color: var(--idx-text-3);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
}
.bgm-idx-star-search {
  padding: 7px 10px;
  border: 1px solid var(--idx-border);
  border-radius: 7px;
  background: var(--idx-surface-1);
  color: var(--idx-text-1);
  font: inherit;
  font-size: 13px;
}
.bgm-idx-star-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 60px;
  overflow: auto;
}
.bgm-idx-star-item {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  border: 0;
  border-radius: 6px;
  background: none;
  color: var(--idx-text-1);
  font: inherit;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}
.bgm-idx-star-item:hover {
  background: var(--idx-surface-2);
}
.bgm-idx-star-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 4px;
}
.bgm-idx-star-group-head {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border: 0;
  border-radius: 6px;
  background: var(--idx-surface-2);
  color: var(--idx-text-2);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
}
.bgm-idx-star-group-head:disabled {
  cursor: default;
}
.bgm-idx-star-caret {
  width: 12px;
  color: var(--idx-text-3);
  text-align: center;
}
.bgm-idx-star-group-count {
  margin-left: auto;
  color: var(--idx-text-3);
  font-weight: 400;
}
.bgm-idx-star-item {
  padding-left: 12px;
}
.bgm-idx-star-item.is-selected {
  background: color-mix(in srgb, var(--idx-accent) 9%, var(--idx-surface-1));
}
.bgm-idx-star-item-name {
  flex: 1;
}
.bgm-idx-star-check {
  flex: none;
  width: 14px;
  height: 14px;
  border: 1px solid var(--idx-border);
  border-radius: 3px;
  background: var(--idx-surface-1);
}
.bgm-idx-star-item.is-selected .bgm-idx-star-check {
  border-color: var(--idx-accent);
  background: var(--idx-accent);
}
.bgm-idx-star-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--idx-border);
  color: var(--idx-text-3);
  font-size: 12px;
}
.bgm-idx-star-foot-actions {
  display: flex;
  gap: 6px;
}
.bgm-idx-star-mini,
.bgm-idx-star-submit {
  padding: 4px 10px;
  border: 1px solid var(--idx-border);
  border-radius: 6px;
  background: var(--idx-surface-1);
  color: var(--idx-text-2);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
.bgm-idx-star-submit {
  border-color: transparent;
  background: var(--idx-accent);
  color: #fff;
}
.bgm-idx-star-submit:disabled {
  opacity: .5;
  cursor: not-allowed;
}
.bgm-idx-star-item-count {
  color: var(--idx-text-3);
  font-size: 11px;
  white-space: nowrap;
}
.bgm-idx-star-tip {
  padding: 16px;
  color: var(--idx-text-3);
  font-size: 12px;
  text-align: center;
}
.bgm-idx-star-msg {
  min-height: 16px;
  color: var(--idx-text-3);
  font-size: 12px;
}
.bgm-idx-star-toast {
  position: fixed;
  left: 50%;
  bottom: 40px;
  z-index: 1100;
  padding: 8px 14px;
  border-radius: 8px;
  background: rgba(0, 0, 0, .75);
  color: #fff;
  font-size: 12px;
  transform: translateX(-50%);
}
@media (prefers-reduced-motion: reduce) {
  #browserItemList.bgm-idx-on *,
  #bgm-idx-toolbar *,
  #bgm-idx-pager *,
  #bgm-idx-top {
    transition: none !important;
    animation: none !important;
  }
}
`;

  var CLOUD_PREFS_KEY = 'bgm-index-reader:prefs';
  var cloudPrefsTimer = 0;
  var pendingCloudPrefs = null;
  var state = loadState();
  var page = 1;
  var totalPages = 1;
  var list = null;
  var toolbar = null;
  var owner = '';
  var isOtherDirectory = false;
  var subjectSortPick = false;
  var subjectSortPicked = [];
  var subjectSortOriginal = [];
  var subjectSortSaving = false;
  var collectionStatus = '';
  var collectionState = '';
  var collectionAllLoaded = false;
  var collectionLoading = false;
  var collectionLoadPromise = null;
  var ratingApplyPending = false;
  var collectionPageSize = 20;
  var collectionPageCache = {};
  var collectionPagePromises = {};
  var collectionBaseUrl = '';
  var collectionPrefetchStarted = false;
  var pendingCollectionSort = null;
  var collectionBulkMap = {};
  var collectionBulkLoaded = false;
  var collectionBulkPromise = null;
  var collectionBulkFailed = false;
  var componentMutation = false;
  var collectionSiteSize = 0;
  var collectionChunkLoading = false;
  var collectionInfinite = false;
  var collectionNextSitePage = 1;
  var collectionInfiniteLoading = false;
  var collectionInfiniteBuffer = [];
  var collectionInfiniteRendered = 0;
  var collectionSearchMode = false;
  var collectionSearchPrevPage = 1;
  var showPageState = true;
  var pager = null;
  var topBtn = null;
  var nativeSelector = null;
  var nativeDisplay = '';
  var searchInput = null;
  var statsEl = null;
  var chipsEl = null;
  var segmented = null;
  var ac = new AbortController();
  var searchTimer = 0;
  var refreshTimer = 0;
  var observer = null;

  var RATING_KEY = 'bgm-index-reader:ratings:v1';
  var RATING_TTL = 24 * 60 * 60 * 1000;
  var RATING_MAX = 2000;
  var ratingCache = loadRatingCache();
  var requestedRatings = new Set();
  var ratingQueue = [];
  var ratingActive = 0;
  var ratingRequestCount = 0;
  var ratingApplyTimer = 0;
  var ratingAbort = new AbortController();
  var MY_KEY = 'bgm-index-reader:my:v1';
  var MY_TTL = 24 * 60 * 60 * 1000;
  var MY_MAX = 100;
  var myCache = loadMyCache();
  var myRequested = new Set();
  var myQueue = [];
  var myActive = 0;
  var myRequestCount = 0;
  var myAbort = new AbortController();
  var CHAR_KEY = 'bgm-index-reader:characters:v1';
  var CHAR_TTL = 24 * 60 * 60 * 1000;
  var charCache = loadCharCache();
  var charQueue = [];
  var charActive = 0;
  var charRequested = new Set();
  var charAbort = new AbortController();
  var crtToolbar = null;
  var crtList = null;
  var crtItems = [];
  var crtRender = null;
  var crtFocusBtn = null;
  var crtPending = null;
  var crtSuppressClickUntil = 0;
  var crtSaving = false;
  var crtQueuedSave = null;
  var charBooted = false;
  var charMixed = false;
  var charAc = new AbortController();
  var scrollTicking = false;
  var mixedTypes = false;
  var reduced = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var booted = false;

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function loadState() {
    var s = Object.assign({}, DEFAULTS);
    var localRaw = null;
    try { localRaw = localStorage.getItem(KEY); } catch (e) {}
    var cloudPrefs = loadCloudPrefs();
    if (cloudPrefs && cloudPrefs.list && typeof cloudPrefs.list === 'object') {
      s = Object.assign(s, cloudPrefs.list);
      s.q = '';
    } else {
      try {
        if (localRaw) s = Object.assign(s, JSON.parse(localRaw));
      } catch (e) {}
      if (localRaw) {
        try {
          var migrated = JSON.parse(localRaw) || {};
          saveCloudPrefs({
            list: {
              view: migrated.view,
              density: migrated.density,
              coverSize: migrated.coverSize,
              showStaff: migrated.showStaff,
              state: migrated.state
            }
          });
        } catch (e) {}
      }
    }
    try {
      var p = new URLSearchParams(location.search);
      var view = p.get('bgm-view');
      var density = p.get('bgm-density');
      var coverSize = p.get('bgm-cover-size');
      var sort = p.get('bgm-sort');
      var size = p.get('bgm-size');
      var staff = p.get('bgm-staff');
      var st = p.get('bgm-state');
      var sc = p.get('bgm-score');
      var q = p.get('bgm-q');
      if (view === 'timeline' || view === 'list' || view === 'grid') s.view = view;
      if (density === 'compact' || density === 'relaxed') s.density = density;
      if (coverSize === 'small' || coverSize === 'medium' || coverSize === 'large') s.coverSize = coverSize;
      if (sort === 'default' || sort === 'date-asc' || sort === 'date-desc' || sort === 'score-desc' || sort === 'score-asc' || sort === 'count-desc' || sort === 'count-asc' || sort === 'title-asc' || sort === 'title-desc') s.sort = sort;
      if (size === '20' || size === '50' || size === '100' || size === '0') s.pageSize = +size;
      if (staff === '1') s.showStaff = true;
      if (staff === '0') s.showStaff = false;
      if (st === 'all' || st === 'doing' || st === 'wish' || st === 'done' || st === 'onhold' || st === 'dropped' || st === 'none') s.state = st;
      if (sc === 'all' || sc === '6' || sc === '7' || sc === '8' || sc === '9' || sc === 'none') s.score = sc;
      if (q != null) s.q = q;
    } catch (e) {}
    s.pageSize = DEFAULTS.pageSize;
    s.score = DEFAULTS.score;
    s.state = DEFAULTS.state;
    if (s.view !== 'timeline' && s.view !== 'list' && s.view !== 'grid') s.view = DEFAULTS.view;
    s.sort = s.view === 'timeline' && !isCollectionPage ? 'date-asc' : DEFAULTS.sort;
    if (s.density !== 'compact' && s.density !== 'relaxed') s.density = DEFAULTS.density;
    if (s.coverSize !== 'small' && s.coverSize !== 'medium' && s.coverSize !== 'large') s.coverSize = DEFAULTS.coverSize;
    if (s.sort !== 'default' && s.sort !== 'date-asc' && s.sort !== 'date-desc' && s.sort !== 'score-desc' && s.sort !== 'score-asc' && s.sort !== 'count-desc' && s.sort !== 'count-asc' && s.sort !== 'title-asc' && s.sort !== 'title-desc') s.sort = DEFAULTS.sort;
    s.pageSize = +s.pageSize;
    if (s.pageSize !== 20 && s.pageSize !== 50 && s.pageSize !== 100 && s.pageSize !== 0) s.pageSize = DEFAULTS.pageSize;
    s.showStaff = !!s.showStaff;
    if (s.state !== 'all' && s.state !== 'doing' && s.state !== 'wish' && s.state !== 'done' && s.state !== 'onhold' && s.state !== 'dropped' && s.state !== 'none') s.state = DEFAULTS.state;
    if (s.score !== 'all' && s.score !== '6' && s.score !== '7' && s.score !== '8' && s.score !== '9' && s.score !== 'none') s.score = DEFAULTS.score;
    s.q = s.q == null ? '' : String(s.q);
    return s;
  }

  function saveState() {
    var data = {
      view: state.view,
      density: state.density,
      coverSize: state.coverSize,
      showStaff: state.showStaff
    };
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {}
    scheduleCloudPrefs({ list: data });
  }

  function syncURL() {
    try {
      var u = new URL(location.href);
      var p = u.searchParams;
      if (state.view !== DEFAULTS.view) p.set('bgm-view', state.view); else p.delete('bgm-view');
      if (state.density !== DEFAULTS.density) p.set('bgm-density', state.density); else p.delete('bgm-density');
      if (state.coverSize !== DEFAULTS.coverSize) p.set('bgm-cover-size', state.coverSize); else p.delete('bgm-cover-size');
      p.delete('bgm-sort');
      p.delete('bgm-size');
      if (state.showStaff !== DEFAULTS.showStaff) p.set('bgm-staff', state.showStaff ? '1' : '0'); else p.delete('bgm-staff');
      p.delete('bgm-state');
      p.delete('bgm-score');
      if (state.q) p.set('bgm-q', state.q); else p.delete('bgm-q');
      history.replaceState(null, '', u);
    } catch (e) {}
  }

  function text(el) {
    return el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
  }

  function pad(n) {
    n = String(n);
    return n.length < 2 ? '0' + n : n;
  }

  function todayKey() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function weekdayLabel(key) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
    if (!m) return '';
    var days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return days[new Date(+m[1], +m[2] - 1, +m[3]).getDay()];
  }

  function parseDate(s) {
    var m = /^(\d{4})\s*[年\-\/]\s*(\d{1,2})\s*[月\-\/]\s*(\d{1,2})\s*日?/.exec(s);
    if (m) {
      return {
        key: m[1] + '-' + pad(m[2]) + '-' + pad(m[3]),
        label: (+m[2]) + '月' + (+m[3]) + '日'
      };
    }
    m = /^(\d{4})\s*[年\-\/]\s*(\d{1,2})\s*月?/.exec(s);
    if (m) {
      return {
        key: m[1] + '-' + pad(m[2]),
        label: m[1] + '年' + (+m[2]) + '月'
      };
    }
    m = /^(\d{4})/.exec(s);
    if (m) return { key: m[1], label: m[1] + '年' };
    return { key: '', label: '' };
  }

  function isReduced() {
    return !!(reduced && reduced.matches);
  }

  function closest(el, sel) {
    return el && el.closest ? el.closest(sel) : null;
  }

  function raf(fn) {
    if (window.requestAnimationFrame) {
      window.requestAnimationFrame(fn);
    } else {
      setTimeout(fn, 0);
    }
  }

  function splitInfo(li, dateLabel, staff) {
    var p = $(SEL.info, li);
    if (!p) return;
    if (p.dataset.bgmSplit === '1' && $('.bgm-idx-date', p)) return;
    p.dataset.bgmSplit = '1';
    p.dataset.bgmOriginal = p.textContent;
    p.textContent = '';
    var d = document.createElement('span');
    d.className = 'bgm-idx-date';
    d.textContent = dateLabel || '日期未定';
    p.appendChild(d);
    if (staff) {
      var sep = document.createElement('span');
      sep.className = 'bgm-idx-sep';
      sep.textContent = ' / ';
      p.appendChild(sep);
      var s = document.createElement('span');
      s.className = 'bgm-idx-staff';
      s.textContent = staff;
      p.appendChild(s);
    }
  }

  function readRate(li) {
    var rateText = text($(SEL.rate, li));
    var m = /(\d+(?:\.\d+)?)\s*[\(（]\s*(\d+)/.exec(rateText) || /(\d+(?:\.\d+)?)/.exec(rateText);
    return { score: m ? m[1] : '', count: m && m[2] ? m[2] : '' };
  }

  function readRank(li) {
    var m = text($(SEL.rank, li)).match(/\d+/);
    return m ? m[0] : '';
  }

  function readState(li) {
    var t = (text($(SEL.collect, li)) + ' ' + text($(SEL.collectBlock, li))).trim();
    if (/在看|観てる|观看中/.test(t)) return 'doing';
    if (/看过|観た|看完/.test(t)) return 'done';
    if (/想看|見たい/.test(t)) return 'wish';
    if (/搁置|保留/.test(t)) return 'onhold';
    if (/抛弃|中止/.test(t)) return 'dropped';
    return 'none';
  }

  function refreshItem(li) {
    var rate = readRate(li);
    if (rate.score) {
      li.dataset.bgmScore = rate.score;
      li.dataset.bgmCount = rate.count;
      delete li.dataset.bgmRatingNone;
      delete li.dataset.bgmRatingFailed;
      delete li.dataset.bgmRatingPending;
    }
    var rank = readRank(li);
    if (rank) li.dataset.bgmRank = rank;
    if (showPageState) li.dataset.bgmState = isCollectionPage && collectionState ? collectionState : readState(li);
    renderScore(li);
    renderStateBadge(li);
    renderWatchCount(li);
  }

  function subjectId(li) {
    var m = /^item_(\d+)$/.exec(li.id || '');
    return m ? m[1] : '';
  }

  function loadRatingCache() {
    try {
      var raw = localStorage.getItem(RATING_KEY);
      var data = raw ? JSON.parse(raw) : {};
      var now = Date.now();
      Object.keys(data).forEach(function (id) {
        var item = data[id];
        if (!item || typeof item.ts !== 'number' || now - item.ts > RATING_TTL * 7) delete data[id];
      });
      return data;
    } catch (e) {
      return {};
    }
  }

  function saveRatingCache() {
    try {
      localStorage.setItem(RATING_KEY, JSON.stringify(ratingCache));
    } catch (e) {}
  }

  function renderScore(li) {
    if (!li) return;
    var el = li.querySelector('.bgm-idx-score');
    if (!el) {
      el = document.createElement('div');
      el.className = 'bgm-idx-score';
      var value = document.createElement('span');
      value.className = 'bgm-idx-score-value';
      var bar = document.createElement('span');
      bar.className = 'bgm-idx-score-bar';
      var fill = document.createElement('span');
      fill.className = 'bgm-idx-score-fill';
      var marker = document.createElement('span');
      marker.className = 'bgm-idx-score-mymark';
      bar.appendChild(fill);
      bar.appendChild(marker);
      var my = document.createElement('span');
      my.className = 'bgm-idx-myrate';
      el.appendChild(value);
      el.appendChild(bar);
      el.appendChild(my);
      li.appendChild(el);
    }
    var score = parseFloat(li.dataset.bgmScore);
    var has = !isNaN(score) && score > 0;
    var count = li.dataset.bgmCount || '';
    var myScore = parseFloat(li.dataset.bgmMyRate);
    var hasMy = !isNaN(myScore) && myScore > 0;
    var note = '';
    if (!has) {
      if (li.dataset.bgmRatingNone === '1') note = '暂无评分';
      else if (li.dataset.bgmRatingFailed === '1') note = '评分不可用';
      else if (li.dataset.bgmRatingPending === '1') note = '评分加载中';
    }
    el.classList.toggle('is-empty', !has);
    el.classList.toggle('has-myrate', hasMy);
    el.style.setProperty('--score-ratio', has ? Math.min(1, Math.max(0, score / 10)) : 0);
    el.style.setProperty('--my-ratio', hasMy ? Math.min(1, Math.max(0, myScore / 10)) : 0);
    el.querySelector('.bgm-idx-score-value').textContent = has ? score.toFixed(1) : '—';
    el.querySelector('.bgm-idx-myrate').textContent = hasMy ? myScore.toFixed(0) : '';
    var aria = has ? '评分 ' + score.toFixed(1) + (count ? '，' + count + ' 人评分' : '') : (note || '暂无评分');
    if (hasMy) aria += '，我的评分 ' + myScore.toFixed(0);
    el.setAttribute('aria-label', aria);
    el.title = has ? 'Bangumi 评分 ' + score.toFixed(1) : (note || '暂无评分');
    if (!el.classList.contains('is-ready')) {
      raf(function () {
        el.classList.add('is-ready');
      });
    }
  }

  function renderWatchCount(li) {
    if (!li) return;
    var el = li.querySelector('.bgm-idx-watch-count');
    if (!el) {
      el = document.createElement('span');
      el.className = 'bgm-idx-watch-count';
      li.appendChild(el);
    }
    var count = li.dataset.bgmCount || '';

    var next = count ? count + ' 人' : '';
    if (el.textContent !== next) el.textContent = next;
    el.hidden = !count;
  }

  function applySubjectName(li, data) {
    var cn = data && (data.nameCn || data.name_cn);
    if (!cn || typeof cn !== 'string') return;
    cn = cn.trim();
    if (!cn) return;
    li.dataset.bgmCnName = cn;
    var link = $('h3 a.l', li);
    if (!link) return;
    var current = text(link).trim();
    if (current === cn) return;
    var original = li.dataset.bgmTitle || current;
    link.textContent = cn;
    var h3 = link.closest('h3');
    if (h3) {
      var small = h3.querySelector('small');
      if (!small) {
        small = document.createElement('small');
        small.className = 'grey';
        h3.appendChild(small);
      }
      var smallText = text(small).trim();
      if (!smallText || smallText === current || smallText === cn) {
        small.textContent = original;
      }
    }
    var img = $('img.cover', li);
    if (img && img.getAttribute('data-bgm-alt') === '1') img.setAttribute('alt', cn);
    li.title = cn;
  }

  function applyRating(li, data) {
    var rating = data && data.rating ? data.rating : {};
    var score = typeof rating.score === 'number' ? rating.score : parseFloat(rating.score);
    var total = typeof rating.total === 'number' ? rating.total : parseInt(rating.total, 10);
    delete li.dataset.bgmRatingPending;
    delete li.dataset.bgmRatingFailed;
    if (score > 0) {
      li.dataset.bgmScore = String(score);
      li.dataset.bgmCount = total ? String(total) : '';
      if (rating.rank) li.dataset.bgmRank = String(rating.rank);
      delete li.dataset.bgmRatingNone;
    } else if (!li.dataset.bgmScore) {
      li.dataset.bgmScore = '';
      li.dataset.bgmCount = '';
      li.dataset.bgmRatingNone = '1';
    }
    if (data && ('name' in data || 'nameCn' in data || 'name_cn' in data)) li.dataset.bgmNameLoaded = '1';
    applySubjectName(li, data);
    renderScore(li);
  }

  function applyRatingById(id, data) {
    getItems().forEach(function (li) {
      if (subjectId(li) === id) applyRating(li, data);
    });
  }

  function applyCachedRatings(items) {
    items.forEach(function (li) {
      if (li.dataset.bgmRatingFailed === '1') return;
      var id = subjectId(li);
      var cached = id && ratingCache[id];
      if (cached && Date.now() - cached.ts < RATING_TTL) applyRating(li, cached.data);
    });
  }

  function fetchSiteRating(id) {
    return window.fetch('/subject/' + encodeURIComponent(id), { credentials: 'include' }).then(function (res) {
      if (!res.ok) throw new Error('site http ' + res.status);
      return res.text();
    }).then(function (html) {
      var match = /property="v:average"[^>]*>\s*([\d.]+)/.exec(html);
      return match ? parseFloat(match[1]) || 0 : 0;
    });
  }

  function fetchRating(item) {
    var id = item.id;
    var cached = ratingCache[id];
    var cacheFresh = cached && Date.now() - cached.ts < RATING_TTL;
    var cacheHasName = cached && cached.data && ('name' in cached.data || 'nameCn' in cached.data || 'name_cn' in cached.data);
    if (cacheFresh && cacheHasName) {
      applyRatingById(id, cached.data);
      return Promise.resolve();
    }
    if (!window.fetch) return Promise.resolve();
    return window.fetch('https://api.bgm.tv/v0/subjects/' + encodeURIComponent(id), {
      mode: 'cors',
      credentials: 'omit',
      signal: ratingAbort.signal
    }).then(function (res) {
      if (res && res.ok === false) {
        return fetchSiteRating(id).then(function (score) {
          if (score > 0) return { rating: { score: score, total: 0, rank: 0 } };
          throw new Error('no site score');
        });
      }
      return res.json();
    }).then(function (data) {
      if (ratingAbort.signal.aborted) return;
      if (!data || !data.rating || !(parseFloat(data.rating.score) > 0)) {
        return fetchSiteRating(id).then(function (score) {
          if (score > 0) return { rating: { score: score, total: 0, rank: 0 } };
          return data;
        });
      }
      return data;
    }).then(function (data) {
      if (ratingAbort.signal.aborted) return;
      var payload = {
        rating: data && data.rating ? data.rating : {},
        name: data && data.name ? data.name : '',
        nameCn: data && data.name_cn ? data.name_cn : ''
      };
      ratingCache[id] = { ts: Date.now(), data: payload };
      saveRatingCache();
      applyRatingById(id, payload);
      scheduleRatingApply();
    }).catch(function () {
      if (ratingAbort.signal.aborted) return;
      if (item.tries < 2) {
        item.tries++;
        setTimeout(function () {
          ratingQueue.push(item);
          pumpRatings();
        }, 800 * item.tries);
        return;
      }
      getItems().forEach(function (li) {
        if (subjectId(li) === id) {
          delete li.dataset.bgmRatingPending;
          li.dataset.bgmRatingFailed = '1';
          renderScore(li);
        }
      });
    });
  }

  function pumpRatings() {
    while (ratingActive < 3 && ratingQueue.length) {
      var item = ratingQueue.shift();
      ratingActive++;
      fetchRating(item).then(function () {
        ratingActive--;
        pumpRatings();
      }, function () {
        ratingActive--;
        pumpRatings();
      });
    }
    if (ratingActive === 0 && !ratingQueue.length && ratingApplyPending) {
      ratingApplyPending = false;
      if (booted) applyWithFlip(false);
    }
  }

  function queueMissingRatings(items) {
    if (!window.fetch || !items || !items.length) return;
    items.forEach(function (li) {
      if (li.dataset.bgmRatingBulk === '1') return;
      if (ratingRequestCount >= RATING_MAX) return;
      var needsName = !li.dataset.bgmCnName && li.dataset.bgmNameLoaded !== '1';
      if (!needsName && (li.dataset.bgmScore || li.dataset.bgmRatingNone === '1' || li.dataset.bgmRatingFailed === '1' || li.dataset.bgmRatingPending === '1')) return;
      if (li.dataset.bgmRatingFailed === '1' || li.dataset.bgmRatingPending === '1') return;
      var id = subjectId(li);
      if (!id || requestedRatings.has(id)) return;
      requestedRatings.add(id);
      ratingRequestCount++;
      li.dataset.bgmRatingPending = '1';
      renderScore(li);
      ratingQueue.push({ id: id, tries: 0 });
    });
    pumpRatings();
  }

  function scheduleRatingApply() {
    if (ratingActive > 0 || ratingQueue.length) {
      ratingApplyPending = true;
      return;
    }
    if (ratingApplyTimer) clearTimeout(ratingApplyTimer);
    ratingApplyTimer = setTimeout(function () {
      ratingApplyTimer = 0;
      if (booted) applyWithFlip(false);
    }, 120);
  }

  function currentUsername() {
    var username = '';
    try {
      username = String(window.CHOBITS_USERNAME || '');
    } catch (e) {}
    if (!username) {
      var link = document.querySelector('#dock a[href^="/user/"], #headerNeue2 a[href^="/user/"]');
      if (link) username = link.getAttribute('href').split('/').filter(Boolean).pop();
    }
    return username;
  }

  var CLOUD_USER_INDEX_KEY = 'bgm-index-reader:user-index';
  var USER_INDEX_STORE_KEY = 'bgm-index-reader:user-index:v1';

  function chiiCloudSettings() {
    try {
      if (typeof chiiApp !== 'undefined' && chiiApp && chiiApp.cloud_settings) {
        return chiiApp.cloud_settings;
      }
    } catch (e) {}
    return null;
  }

  function parseStoredJSON(value) {
    if (value == null) return null;
    if (typeof value === 'object') return value;
    try { return JSON.parse(String(value)); } catch (e) { return null; }
  }

  function loadUserIndexFolders() {
    var cloud = chiiCloudSettings();
    if (cloud && typeof cloud.get === 'function') {
      try {
        var data = parseStoredJSON(cloud.get(CLOUD_USER_INDEX_KEY));
        if (data && Array.isArray(data.folders) && data.assign && typeof data.assign === 'object' && !Array.isArray(data.assign)) {
          return { folders: data.folders, assign: data.assign, source: 'cloud' };
        }
      } catch (e) {}
    }
    try {
      var local = JSON.parse(localStorage.getItem(USER_INDEX_STORE_KEY) || '{}') || {};
      if (Array.isArray(local.folders)) {
        return {
          folders: local.folders,
          assign: local.assign && typeof local.assign === 'object' ? local.assign : {},
          source: 'local'
        };
      }
    } catch (e) {}
    return { folders: [], assign: {}, source: 'none' };
  }

  function saveUserIndexFolders(folders, assign) {
    var cloud = chiiCloudSettings();
    if (!cloud || typeof cloud.update !== 'function') return false;
    var patch = {};
    patch[CLOUD_USER_INDEX_KEY] = JSON.stringify({ folders: folders, assign: assign });
    try {
      cloud.update(patch);
      if (typeof cloud.save === 'function') cloud.save();
      return true;
    } catch (e) {}
    return false;
  }

  function loadCloudPrefs() {
    var cloud = chiiCloudSettings();
    if (!cloud || typeof cloud.get !== 'function') return null;
    try {
      var data = parseStoredJSON(cloud.get(CLOUD_PREFS_KEY));
      return data && typeof data === 'object' && !Array.isArray(data) ? data : null;
    } catch (e) {}
    return null;
  }

  function saveCloudPrefs(patch) {
    var cloud = chiiCloudSettings();
    if (!cloud || typeof cloud.update !== 'function') return false;
    try {
      var current = loadCloudPrefs() || {};
      Object.keys(patch).forEach(function (k) {
        current[k] = patch[k];
      });
      var data = {};
      data[CLOUD_PREFS_KEY] = JSON.stringify(current);
      cloud.update(data);
      if (typeof cloud.save === 'function') cloud.save();
      return true;
    } catch (e) {}
    return false;
  }

  function scheduleCloudPrefs(patch) {
    if (!chiiCloudSettings()) return;
    if (!pendingCloudPrefs) pendingCloudPrefs = {};
    Object.keys(patch).forEach(function (k) {
      pendingCloudPrefs[k] = patch[k];
    });
    if (cloudPrefsTimer) clearTimeout(cloudPrefsTimer);
    cloudPrefsTimer = setTimeout(function () {
      cloudPrefsTimer = 0;
      var pending = pendingCloudPrefs;
      pendingCloudPrefs = null;
      if (pending) saveCloudPrefs(pending);
    }, 800);
  }

  window.addEventListener('pagehide', function () {
    if (cloudPrefsTimer) {
      clearTimeout(cloudPrefsTimer);
      cloudPrefsTimer = 0;
    }
    if (pendingCloudPrefs) {
      var pending = pendingCloudPrefs;
      pendingCloudPrefs = null;
      saveCloudPrefs(pending);
    }
  });

  function loadMyCache() {
    try {
      var raw = localStorage.getItem(MY_KEY);
      var data = raw ? JSON.parse(raw) : {};
      var now = Date.now();
      Object.keys(data).forEach(function (id) {
        var item = data[id];
        if (!item || typeof item.ts !== 'number' || now - item.ts > MY_TTL * 7) delete data[id];
      });
      return data;
    } catch (e) {
      return {};
    }
  }

  function saveMyCache() {
    try {
      localStorage.setItem(MY_KEY, JSON.stringify(myCache));
    } catch (e) {}
  }

  function applyMyRating(li, data) {
    var rate = data && (typeof data.rate === 'number' ? data.rate : parseInt(data.rate, 10));
    var type = data && (typeof data.type === 'number' ? data.type : parseInt(data.type, 10));
    delete li.dataset.bgmMyRatePending;

    if (rate > 0) {
      li.dataset.bgmMyRate = String(rate);
      delete li.dataset.bgmMyRateNone;
    } else {
      delete li.dataset.bgmMyRate;
      li.dataset.bgmMyRateNone = '1';
    }
    if (isOtherDirectory) {
      var oldState = li.dataset.bgmState;
      var map = { 1: 'wish', 2: 'done', 3: 'doing', 4: 'onhold', 5: 'dropped' };
      li.dataset.bgmState = type > 0 ? (map[type] || 'none') : 'none';
      if (li.dataset.bgmState !== oldState) {
        renderStateBadge(li);
        scheduleRatingApply();
      }
    }
    renderScore(li);
  }

  function applyMyRatingById(id, data) {
    getItems().forEach(function (li) {
      if (subjectId(li) === id) applyMyRating(li, data);
    });
  }

  function applyCachedMyRatings(items) {
    items.forEach(function (li) {
      if (li.dataset.bgmMyRate || li.dataset.bgmMyRateNone === '1') return;
      var id = subjectId(li);
      var cached = id && myCache[id];
      if (cached && Date.now() - cached.ts < MY_TTL) applyMyRating(li, cached.data);
    });
  }

  function fetchMyRating(item) {
    var id = item.id;
    var username = currentUsername();
    var cached = myCache[id];
    if (cached && Date.now() - cached.ts < MY_TTL) {
      applyMyRatingById(id, cached.data);
      return Promise.resolve();
    }
    if (!username || !window.fetch) return Promise.resolve();
    return window.fetch('https://api.bgm.tv/v0/users/' + encodeURIComponent(username) + '/collections/' + encodeURIComponent(id), {
      mode: 'cors',
      credentials: 'omit',
      signal: myAbort.signal
    }).then(function (res) {
      if (res && res.ok === false) throw new Error('my rating http ' + res.status);
      return res.json();
    }).then(function (data) {
      if (myAbort.signal.aborted) return;
      var rate = data && (typeof data.rate === 'number' ? data.rate : parseInt(data.rate, 10));
      var type = data && (typeof data.type === 'number' ? data.type : parseInt(data.type, 10));
      var payload = { rate: rate > 0 ? rate : 0, type: type > 0 ? type : 0 };
      myCache[id] = { ts: Date.now(), data: payload };
      saveMyCache();
      applyMyRatingById(id, payload);
    }).catch(function () {
      if (myAbort.signal.aborted) return;
      getItems().forEach(function (li) {
        if (subjectId(li) === id) delete li.dataset.bgmMyRatePending;
      });
    });
  }

  function pumpMyRatings() {
    while (myActive < 2 && myQueue.length) {
      var item = myQueue.shift();
      myActive++;
      fetchMyRating(item).then(function () {
        myActive--;
        pumpMyRatings();
      }, function () {
        myActive--;
        pumpMyRatings();
      });
    }
  }

  function queueMyRatings(items) {
    if (!window.fetch || !currentUsername() || !items || !items.length) return;
    var added = 0;
    items.forEach(function (li) {
      if (added >= 40 || myRequestCount >= MY_MAX) return;
      if (li.dataset.bgmMyRate || li.dataset.bgmMyRateNone === '1' || li.dataset.bgmMyRatePending === '1') return;
      var id = subjectId(li);
      if (!id || myRequested.has(id)) return;
      myRequested.add(id);
      myRequestCount++;
      added++;
      li.dataset.bgmMyRatePending = '1';
      myQueue.push({ id: id });
    });
    pumpMyRatings();
  }

  function renderStateBadge(li) {
    if (!li) return;
    var el = li.querySelector('.bgm-idx-state');
    if (!el) {
      el = document.createElement('span');
      el.className = 'bgm-idx-state';
      li.appendChild(el);
    }
    var st = li.dataset.bgmState;
    var has = !!st && st !== 'none';
    el.textContent = has ? stateLabel(st) : '';
    el.dataset.state = has ? st : '';
    el.classList.toggle('is-empty', !has);
  }

  function parseAlias(li, titleEl) {
    if (!titleEl) return '';
    var h3 = titleEl.closest('h3');
    if (!h3) return '';
    var candidates = [];
    Array.prototype.forEach.call(h3.children, function (el) {
      if (el === titleEl || el.classList.contains('ico_subject_type')) return;
      if (text(el)) candidates.push(el);
    });
    $$('small, .subtitle, .alias, .name_cn, .grey, .sub', h3).forEach(function (el) {
      if (candidates.indexOf(el) < 0 && text(el)) candidates.push(el);
    });
    $$('small, .subtitle, .alias, .name_cn, .grey, .sub', titleEl).forEach(function (el) {
      if (candidates.indexOf(el) < 0 && text(el)) candidates.push(el);
    });
    var textParts = [];
    Array.prototype.forEach.call(h3.childNodes, function (node) {
      if (node.nodeType === 3) {
        var t = String(node.nodeValue || '').replace(/\s+/g, ' ').trim();
        if (t) {
          textParts.push(t);
          node.nodeValue = '';
        }
      }
    });
    var inner = h3.parentElement;
    if (inner) {
      $$(':scope > small, :scope > .subtitle, :scope > .alias, :scope > .name_cn, :scope > .grey', inner).forEach(function (el) {
        if (candidates.indexOf(el) < 0 && text(el)) candidates.push(el);
      });
    }
    var aliasText = candidates.map(text).concat(textParts).filter(Boolean).join(' / ');
    if (!aliasText) return '';
    candidates.forEach(function (el) {
      el.classList.add('bgm-idx-original-alias');
    });
    var alias = document.createElement('span');
    alias.className = 'bgm-idx-alias';
    alias.textContent = aliasText;
    h3.appendChild(alias);
    return aliasText;
  }

  function parseItem(li) {
    if (!li || li.classList.contains('bgm-idx-group') || li.classList.contains('bgm-idx-empty')) return;
    if (li.dataset.bgmParsed === '1') return;
    li.dataset.bgmParsed = '1';
    var titleEl = $(SEL.title, li) || $('h3', li);
    var title = text(titleEl);
    var typeIcon = $('.ico_subject_type', li);
    var typeMatch = typeIcon && typeIcon.className.match(/subject_type_(\d+)/);
    li.dataset.bgmType = typeMatch ? typeMatch[1] : '';
    var alias = parseAlias(li, titleEl);
    var infoEl = $(SEL.info, li);
    var info = text(infoEl);
    var parts = info ? info.split(/\s+\/\s+/) : [];
    if (parts.length === 1 && info && info.indexOf('/') >= 0) parts = info.split(/\s*\/\s*/);
    var date = null;
    var dateIndex = -1;
    for (var pi = 0; pi < Math.min(parts.length, 3); pi++) {
      var dateCandidate = parseDate(parts[pi]);
      if (dateCandidate.label) {
        date = dateCandidate;
        dateIndex = pi;
        break;
      }
    }
    if (!date) date = parseDate(parts[0] || '');
    var staff = parts.filter(function (_, idx) { return idx !== dateIndex; }).join(' / ');
    var rate = readRate(li);
    var rank = readRank(li);
    var st = showPageState ? (isCollectionPage && collectionState ? collectionState : readState(li)) : 'none';
    li.dataset.bgmTitle = title || '(无标题)';
    li.dataset.bgmAlias = alias;
    li.dataset.bgmDate = date.key;
    li.dataset.bgmDateLabel = date.label;
    li.dataset.bgmWeekday = weekdayLabel(date.key);
    li.dataset.bgmToday = date.key && date.key === todayKey() ? '1' : '';
    li.dataset.bgmStaff = staff;
    li.dataset.bgmInfo = info;
    li.dataset.bgmScore = rate.score;
    li.dataset.bgmCount = rate.count;
    li.dataset.bgmRank = rank;
    li.dataset.bgmState = st;
    if (li.dataset.bgmToday === '1') li.classList.add('is-today');
    else li.classList.remove('is-today');
    splitInfo(li, date.label, staff);
    var img = $('img.cover', li);
    if (img && title && !img.hasAttribute('alt')) {
      img.setAttribute('alt', title);
      img.dataset.bgmAlt = '1';
    }
    renderScore(li);
    renderStateBadge(li);
    renderWatchCount(li);
  }

  function getItems() {
    if (!list) return [];
    return $$(SEL.item, list).filter(function (li) {
      return li.classList.contains('item');
    });
  }

  var TRAD_MAP = {
    '這':'这','們':'们','來':'来','時':'时','間':'间','國':'国','學':'学','會':'会','說':'说','對':'对','為':'为','與':'与','從':'从','麼':'么','沒':'没','發':'发','現':'现','實':'实','際':'际','樣':'样','總':'总','結':'结','構':'构','讓':'让','覺':'觉','書':'书','畫':'画','電':'电','視':'视','劇':'剧','場':'场','館':'馆','圖':'图','雜':'杂','誌':'志','體':'体','樂':'乐','團':'团','圓':'圆','歲':'岁','數':'数','據':'据','戰':'战','蘭':'兰','龍':'龙','竜':'龙','櫻':'樱','葉':'叶','華':'华','語':'语','談':'谈','論':'论','讀':'读','寫':'写','聽':'听','聲':'声','響':'响','點':'点','線':'线','級':'级','給':'给','經':'经','過':'过','還':'还','進':'进','運':'运','動':'动','當':'当','嗎':'吗','誰':'谁','開':'开','關':'关','門':'门','問':'问','陽':'阳','陰':'阴','雲':'云','風':'风','飛':'飞','鳥':'鸟','魚':'鱼','馬':'马','車':'车','輪':'轮','轉':'转','輕':'轻','遠':'远','邊':'边','裡':'里','著':'着','個':'个','東':'东','兩':'两','嚴':'严','臨':'临','麗':'丽','舉':'举','義':'义','烏':'乌','習':'习','鄉':'乡','買':'买','賣':'卖','費':'费','賀':'贺','資':'资','賽':'赛','贊':'赞','趙':'赵','躍':'跃','軍':'军','農':'农','達':'达','遺':'遗','郵':'邮','鄭':'郑','釋':'释','鐘':'钟','鐵':'铁','長':'长','閉':'闭','閏':'闰','閑':'闲','陳':'陈','陸':'陆','隊':'队','階':'阶','隨':'随','險':'险','隱':'隐','雙':'双','難':'难','靜':'静','頁':'页','頂':'顶','項':'项','順':'顺','須':'须','預':'预','領':'领','頭':'头','題':'题','顏':'颜','願':'愿','類':'类','飯':'饭','飽':'饱','養':'养','駕':'驾','騎':'骑','驚':'惊','髮':'发','鬥':'斗','魯':'鲁','鮮':'鲜','鳴':'鸣','鴨':'鸭','鵝':'鹅','鹽':'盐','麥':'麦','黃':'黄','齊':'齐','齒':'齿','龜':'龟','亞':'亚','產':'产','親':'亲','愛':'爱','牆':'墙','狀':'状','獨':'独','獲':'获','獎':'奖','環':'环','畢':'毕','療':'疗','盡':'尽','監':'监','盤':'盘','眾':'众','礎':'础','禮':'礼','稱':'称','穩':'稳','窮':'穷','竊':'窃','競':'竞','筆':'笔','節':'节','範':'范','築':'筑','簡':'简','籃':'篮','紀':'纪','約':'约','紅':'红','純':'纯','紙':'纸','細':'细','終':'终','組':'组','絕':'绝','統':'统','絲':'丝','綠':'绿','維':'维','網':'网','練':'练','織':'织','繼':'继','續':'续','羅':'罗','聯':'联','職':'职','臟':'脏','舊':'旧','蓮':'莲','藥':'药','蘇':'苏','處':'处','號':'号','蟲':'虫','裝':'装','複':'复','見':'见','觀':'观','觸':'触','計':'计','訊':'讯','記':'记','討':'讨','訓':'训','託':'托','訪':'访','設':'设','許':'许','訴':'诉','診':'诊','註':'注','評':'评','詞':'词','試':'试','詩':'诗','話':'话','該':'该','詳':'详','誇':'夸','認':'认','誠':'诚','誤':'误','課':'课','調':'调','請':'请','諸':'诸','諾':'诺','謀':'谋','謂':'谓','講':'讲','謝':'谢','證':'证','識':'识','譜':'谱','議':'议','護':'护','變':'变','貝':'贝','負':'负','財':'财','貢':'贡','貧':'贫','貨':'货','販':'贩','貪':'贪','責':'责','貴':'贵','貸':'贷','貿':'贸','賓':'宾','賜':'赐','賞':'赏','賠':'赔','賢':'贤','賤':'贱','賦':'赋','質':'质','賬':'账','賭':'赌','賴':'赖','購':'购','贏':'赢','贈':'赠','趕':'赶','軒':'轩','軟':'软','較':'较','載':'载','輔':'辅','輛':'辆','輝':'辉','輸':'输','轄':'辖','辯':'辩','週':'周','適':'适','遲':'迟','選':'选','遷':'迁','邁':'迈','邏':'逻','針':'针','釣':'钓','鈴':'铃','銀':'银','銅':'铜','銘':'铭','鋒':'锋','鋼':'钢','錄':'录','錢':'钱','錦':'锦','錫':'锡','錯':'错','鍵':'键','鑄':'铸','閃':'闪','閱':'阅','闆':'板','陣':'阵','陝':'陕','隸':'隶','隻':'只','雛':'雏','霧':'雾','靈':'灵','霽':'霁','靂':'雳','靄':'霭','靦':'腼','韋':'韦','韌':'韧','韓':'韩','韻':'韵','顛':'颠','颯':'飒','颱':'台','颶':'飓','飄':'飘','颼':'飕','飢':'饥','飲':'饮','飼':'饲','餅':'饼','餃':'饺','餚':'肴','餛':'馄','餓':'饿','餘':'余','饅':'馒','饒':'饶','饞':'馋','駐':'驻','駒':'驹','駝':'驼','駭':'骇','駱':'骆','駿':'骏','騙':'骗','騷':'骚','驟':'骤','驢':'驴','驥':'骥','鬆':'松','鬍':'胡','鬚':'须','鬧':'闹','鬱':'郁','魷':'鱿','鯉':'鲤','鯊':'鲨','鯖':'鲭','鯛':'鲷','鯨':'鲸','鯽':'鲫','鰐':'鳄','鰓':'鳃','鰭':'鳍','鰻':'鳗','鱈':'鳕','鱉':'鳖','鱒':'鳟','鱗':'鳞','鱸':'鲈','鳩':'鸠','鳳':'凤','鳶':'鸢','鴉':'鸦','鴕':'鸵','鴛':'鸳','鴿':'鸽','鵑':'鹃','鵬':'鹏','鵲':'鹊','鶉':'鹑','鶯':'莺','鶴':'鹤','鷗':'鸥','鷹':'鹰','鷺':'鹭','鸚':'鹦','鸞':'鸾','鹹':'咸','鹼':'碱','麵':'面','黴':'霉','齋':'斋','齡':'龄','齦':'龈','齬':'龉','齲':'龋'
  };

  function normalizeSearch(s) {
    var t = String(s || '').toLowerCase();
    try {
      t = t.normalize('NFKC').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    } catch (e) {}
    t = t.replace(/[\s\u3000]+/g, '');
    var out = '';
    for (var i = 0; i < t.length; i++) {
      var c = t.charAt(i);
      out += TRAD_MAP[c] || c;
    }
    return out;
  }

  function searchTokens() {
    return String(state.q || '').toLowerCase().split(/[\s\u3000]+/).filter(Boolean).map(normalizeSearch);
  }

  function matchesSearch(li, tokens) {
    if (!tokens.length) return true;
    var hay = normalizeSearch([
      li.dataset.bgmTitle,
      li.dataset.bgmCnName,
      li.dataset.bgmAlias,
      li.dataset.bgmStaff,
      li.dataset.bgmInfo,
      li.textContent
    ].join(' '));
    for (var i = 0; i < tokens.length; i++) {
      if (hay.indexOf(tokens[i]) < 0) return false;
    }
    return true;
  }

  function visible(li) {
    if (!matchesSearch(li, searchTokens())) return false;
    if (!isCollectionPage && state.state !== 'all' && li.dataset.bgmState !== state.state) return false;
    if (state.score !== 'all') {
      if (state.score === 'none') {
        if (li.dataset.bgmScore) return false;
      } else {
        var score = parseFloat(li.dataset.bgmScore);
        if (!score || score < parseFloat(state.score)) return false;
      }
    }
    return true;
  }

  function sortKey(s) {
    return s === 'default' ? 'default' : String(s).split('-')[0];
  }

  function sortDir(s) {
    return s === 'default' ? '' : String(s).split('-')[1] || 'asc';
  }

  function sortLabel(key) {
    var map = { default: '原顺序', date: '放送日', score: '评分', count: '人数', title: '名称' };
    return map[key] || key;
  }

  function sortText(s) {
    var key = sortKey(s);
    var dir = sortDir(s);
    return sortLabel(key) + (key !== 'default' && dir ? ' ' + (dir === 'asc' ? '↑' : '↓') : '');
  }

  function setSort(key, dir) {
    if (key === 'default') state.sort = 'default';
    else state.sort = key + '-' + (dir === 'asc' ? 'asc' : 'desc');
    page = 1;
    applyWithFlip(true);
  }

  function toggleSort(key) {
    if (!key) return;
    if (state.view === 'timeline' && key !== 'date') return;
    if (state.view === 'timeline') {
      if (isCollectionPage) return;
      var timelineDir = sortKey(state.sort) === 'date' ? sortDir(state.sort) : '';
      setSort('date', timelineDir === 'asc' ? 'desc' : 'asc');
      return;
    }
    if (isCollectionPage) {
      var sortUrl = new URL(location.href);
      sortUrl.searchParams.delete('page');
      if (key === 'default') sortUrl.searchParams.delete('orderby');
      else if (key === 'score') sortUrl.searchParams.set('orderby', 'rate');
      else if (key === 'date') sortUrl.searchParams.set('orderby', 'date');
      else return;
      window.location.href = sortUrl.href;
      return;
    }
    var currentKey = sortKey(state.sort);
    var dir = sortDir(state.sort);
    if (currentKey !== key) {
      setSort(key, key === 'date' ? 'asc' : 'desc');
      return;
    }
    if (key === 'default') return;
    setSort(key, dir === 'asc' ? 'desc' : 'asc');
  }

  function updateSortUI() {
    if (!toolbar) return;
    var key = state.view === 'timeline' ? 'date' : sortKey(state.sort);
    var dir = sortDir(state.sort);
    var btn = $('#bgm-idx-sort-btn', toolbar);
    var menu = $('#bgm-idx-sort-menu', toolbar);
    if (btn) {
      var timelineDir = isCollectionPage ? 'desc' : (dir === 'asc' ? 'asc' : 'desc');
      btn.textContent = state.view === 'timeline'
        ? '放送日 ' + (timelineDir === 'desc' ? '↓' : '↑')
        : sortText(state.sort);
    }
    if (menu) {
      $$('button[data-sort-key]', menu).forEach(function (item) {
        var k = item.dataset.sortKey;
        var hidden = state.view === 'timeline' && k !== 'date';
        item.hidden = hidden;
        item.setAttribute('aria-pressed', k === key ? 'true' : 'false');
        var arrow = '';
        if (k === key && k !== 'default') {
          var arrowDesc = isCollectionPage && state.view === 'timeline' ? true : dir !== 'asc';
          arrow = ' ' + (arrowDesc ? '↓' : '↑');
        }
        item.textContent = sortLabel(k) + arrow;
      });
    }
  }

  function toggleSortMenu(open) {
    if (!toolbar) return;
    var menu = $('#bgm-idx-sort-menu', toolbar);
    var btn = $('#bgm-idx-sort-btn', toolbar);
    if (!menu || !btn) return;
    var show = open === undefined ? menu.hidden : !!open;
    menu.hidden = !show;
    btn.setAttribute('aria-expanded', show ? 'true' : 'false');
  }

  function typeRank(li) {
    var map = { '2': 0, '1': 1, '3': 2, '4': 3, '6': 4 };
    var t = li.dataset.bgmType;
    return map[t] != null ? map[t] : 5;
  }

  function compare(a, b) {
    var key = sortKey(state.sort);
    var dir = sortDir(state.sort) || 'asc';
    if (key !== 'default' && mixedTypes && state.view !== 'timeline') {
      var at = typeRank(a);
      var bt = typeRank(b);
      if (at !== bt) return at - bt;
    }
    if (key === 'default') return (+a.dataset.bgmIndex || 0) - (+b.dataset.bgmIndex || 0);
    if (key === 'date') {
      var ak = a.dataset.bgmDate;
      var bk = b.dataset.bgmDate;
      if (!ak && !bk) return (+a.dataset.bgmIndex || 0) - (+b.dataset.bgmIndex || 0);
      if (!ak) return 1;
      if (!bk) return -1;
      var cmp = dir === 'desc' ? bk.localeCompare(ak) : ak.localeCompare(bk);
      return cmp || ((+a.dataset.bgmIndex || 0) - (+b.dataset.bgmIndex || 0));
    }
    if (key === 'title') {
      var at = a.dataset.bgmCnName || a.dataset.bgmTitle || '';
      var bt = b.dataset.bgmCnName || b.dataset.bgmTitle || '';
      var cmp = at.localeCompare(bt, 'zh-Hans-CN');
      if (cmp === 0) return (+a.dataset.bgmIndex || 0) - (+b.dataset.bgmIndex || 0);
      return dir === 'asc' ? cmp : -cmp;
    }
    var field = key === 'score' ? 'bgmScore' : 'bgmCount';
    var av = key === 'score' ? parseFloat(a.dataset[field]) : parseInt(a.dataset[field], 10);
    var bv = key === 'score' ? parseFloat(b.dataset[field]) : parseInt(b.dataset[field], 10);
    var aHas = !isNaN(av) && av > 0;
    var bHas = !isNaN(bv) && bv > 0;
    if (!aHas && !bHas) return (+a.dataset.bgmIndex || 0) - (+b.dataset.bgmIndex || 0);
    if (!aHas) return 1;
    if (!bHas) return -1;
    if (av === bv) return (+a.dataset.bgmIndex || 0) - (+b.dataset.bgmIndex || 0);
    return dir === 'asc' ? av - bv : bv - av;
  }

  function stateLabel(v) {
    var map = { doing: '在看', wish: '想看', done: '看过', onhold: '搁置', dropped: '抛弃', none: '未收藏' };
    return map[v] || v;
  }

  function scoreLabel(v) {
    return v === 'none' ? '无评分' : '评分 ≥ ' + v;
  }

  function typeLabel(type) {
    var map = { '1': '书籍', '2': '动画', '3': '音乐', '4': '游戏', '6': '三次元' };
    return map[type] || '其他';
  }

  function buildTypeSep(type) {
    var sep = document.createElement('li');
    sep.className = 'bgm-idx-type-sep';
    sep.dataset.bgmType = type || '';
    var line = document.createElement('span');
    line.className = 'bgm-idx-type-line';
    var label = document.createElement('span');
    label.className = 'bgm-idx-type-label';
    label.textContent = typeLabel(type);
    sep.appendChild(line);
    sep.appendChild(label);
    return sep;
  }

  function buildGroup(li, key, current) {
    var group = document.createElement('li');
    group.className = 'bgm-idx-group';
    group.dataset.bgmGroup = key;
    var title = document.createElement('span');
    title.className = 'bgm-idx-group-title';
    var label = li.dataset.bgmDateLabel || '日期未定';
    if (/^\d{4}/.test(key) && !/^\d{4}/.test(label)) {
      label = key.slice(0, 4) + '年' + label;
    }
    title.textContent = label;
    var count = current.filter(function (x) {
      return (x.dataset.bgmDate || '') === key;
    }).length;
    var week = li.dataset.bgmWeekday || '';
    var meta = document.createElement('span');
    meta.className = 'bgm-idx-group-meta';
    meta.textContent = (week ? week + ' · ' : '') + count + ' 部';
    group.appendChild(title);
    if (key && key === todayKey()) {
      var today = document.createElement('span');
      today.className = 'bgm-idx-today';
      today.textContent = '今天';
      group.appendChild(today);
    }
    group.appendChild(meta);
    return group;
  }

  function updatePager(pages) {
    if (!pager) return;
    if (isCollectionPage) {
      pages = (collectionSearchMode || collectionPageSize === 0) ? 1 : collectionChunkPages();
    }
    pager.hidden = pages <= 1;
    var pageInput = $('#bgm-idx-page', pager);
    var pagesEl = $('#bgm-idx-pages', pager);
    if (pageInput) {
      pageInput.max = String(pages);
      pageInput.value = String(page);
    }
    if (pagesEl) pagesEl.textContent = String(pages);
    var prev = $('[data-page="prev"]', pager);
    var next = $('[data-page="next"]', pager);
    var first = $('[data-page="first"]', pager);
    var last = $('[data-page="last"]', pager);
    totalPages = pages;
    if (prev) prev.disabled = page <= 1;
    if (next) next.disabled = page >= pages;
    if (first) first.disabled = page <= 1;
    if (last) last.disabled = page >= pages;
  }

  function updateStats(shown) {
    if (!statsEl) return;
    if (isCollectionPage) {
      statsEl.hidden = true;
      statsEl.textContent = '';
      return;
    }
    var all = getItems();
    var parts = ['共 ' + all.length + ' 部'];
    if (shown.length !== all.length) parts.push('当前 ' + shown.length + ' 部');
    statsEl.hidden = false;
    statsEl.textContent = parts.join(' · ');
  }

  function renderChips() {
    if (!chipsEl) return;
    chipsEl.textContent = '';
    var chips = [];
    if (state.state !== 'all') chips.push({ key: 'state', label: stateLabel(state.state) });
    if (state.score !== 'all') chips.push({ key: 'score', label: scoreLabel(state.score) });
    if (!chips.length) {
      chipsEl.hidden = true;
      return;
    }
    chipsEl.hidden = false;
    chips.forEach(function (item) {
      var chip = document.createElement('span');
      chip.className = 'bgm-idx-chip';
      var label = document.createElement('span');
      label.textContent = item.label;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'bgm-idx-chip-x';
      btn.setAttribute('aria-label', '移除筛选：' + item.label);
      btn.dataset.filter = item.key;
      btn.textContent = '×';
      chip.appendChild(label);
      chip.appendChild(btn);
      chipsEl.appendChild(chip);
    });
  }

  function updateSegmented() {
    if (!segmented) return;
    var buttons = $$('button[data-view]', segmented);
    var active = null;
    buttons.forEach(function (btn) {
      var on = btn.dataset.view === state.view;
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (on) active = btn;
    });
    var thumb = $('.bgm-idx-thumb', segmented);
    if (!thumb || !active) return;
    var width = active.offsetWidth;
    if (!width) return;
    thumb.style.width = width + 'px';
    thumb.style.transform = 'translateX(' + active.offsetLeft + 'px)';
  }

  function syncControls() {
    if (!toolbar) return;
    var size = $('#bgm-idx-size', toolbar);
    var density = $('#bgm-idx-density', toolbar);
    var coverSize = $('#bgm-idx-cover-size', toolbar);
    var st = $('#bgm-idx-state', toolbar);
    var sc = $('#bgm-idx-score', toolbar);
    var staff = $('#bgm-idx-staff', toolbar);
    var focus = $('#bgm-idx-focus', toolbar);
    if (size) size.value = String(state.pageSize);
    if (density) density.value = state.density;
    if (coverSize) coverSize.value = state.coverSize;
    if (st) st.value = state.state;
    if (sc) sc.value = state.score;
    if (staff) {
      staff.hidden = state.view === 'grid';
      staff.setAttribute('aria-pressed', state.showStaff ? 'true' : 'false');
    }
    var densityWrap = $('#bgm-idx-density-wrap', toolbar);
    var coverSizeWrap = $('#bgm-idx-cover-size-wrap', toolbar);
    if (densityWrap) densityWrap.hidden = state.view === 'grid';
    if (coverSizeWrap) coverSizeWrap.hidden = state.view !== 'grid';
    if (focus) focus.setAttribute('aria-pressed', document.documentElement.classList.contains('bgm-idx-focus') ? 'true' : 'false');
    if (searchInput && searchInput.value !== state.q) searchInput.value = state.q;
    updateSortUI();
    updateSegmented();
  }

  function updateFilterAvailability() {
    if (!toolbar) return;
    var items = getItems();
    var hasScore = items.some(function (li) { return !!li.dataset.bgmScore; });
    var hasState = items.some(function (li) { return li.dataset.bgmState && li.dataset.bgmState !== 'none'; });
    var canFetchScore = !!window.fetch && items.some(function (li) { return !!subjectId(li); });
    var canFetchState = isOtherDirectory && !!window.fetch && !!currentUsername() && items.some(function (li) { return !!subjectId(li); });
    var scoreAvailable = hasScore || canFetchScore;
    var stateAvailable = hasState || canFetchState;
    var st = $('#bgm-idx-state', toolbar);
    var sc = $('#bgm-idx-score', toolbar);
    if (st) {
      st.disabled = !stateAvailable;
      st.title = stateAvailable ? '' : '当前页面没有收藏状态数据';
    }
    if (sc) {
      sc.disabled = !scoreAvailable;
      sc.title = scoreAvailable ? '' : '当前页面没有评分数据';
    }
    if (!stateAvailable && state.state !== 'all') state.state = 'all';
    if (!scoreAvailable && state.score !== 'all') state.score = 'all';
  }

  function subjectSortAllowed() {
    if (isCollectionPage) return false;
    if (!owner || !currentUsername() || owner !== currentUsername()) return false;
    if (isOtherDirectory) return false;
    if (!document.getElementById('ModifyRelatedForm')) return false;
    return true;
  }

  function subjectSortProblems() {
    var out = [];
    if (isCollectionPage) {
      out.push('收藏页不支持排序');
      return out;
    }
    if (!owner || !currentUsername() || owner !== currentUsername() || isOtherDirectory) {
      out.push('只允许目录作者本人排序');
      return out;
    }
    if (!document.getElementById('ModifyRelatedForm')) out.push('站点未提供编辑表单（可能未登录或页面未加载）');
    if (state.view !== 'list' && state.view !== 'grid') out.push('当前是时间轴视图（请切到列表或封面）');
    if (state.sort !== 'default') out.push('当前不是原顺序');
    if (String(state.q || '').trim()) out.push('搜索框未清空');
    if (state.state !== 'all') out.push('状态筛选未清除');
    if (state.score !== 'all') out.push('评分筛选未清除');

    return out;
  }

  function subjectSortReady() {
    return subjectSortProblems().length === 0;
  }

  function subjectSortHint() {
    return '排序需要满足：' + subjectSortProblems().join('、');
  }

  function subjectSortRlt(li) {
    return li.getAttribute('attr-index-related');
  }

  function subjectSortContent(li) {
    var t = li.querySelector('.text');
    return t ? t.textContent.trim() : '';
  }

  function subjectSortOrder(li) {
    var a = li.querySelector('p.tools a[order]');
    if (a) {
      var n = parseInt(a.getAttribute('order'), 10);
      if (isFinite(n)) return n;
    }
    var d = parseInt(li.dataset.bgmOrder, 10);
    return isFinite(d) ? d : null;
  }

  function subjectSortCleanup() {
    getItems().forEach(function (li) {
      li.classList.remove('is-subj-pick');
      delete li.dataset.bgmPick;
      var b = li.querySelector('.bgm-idx-subj-pick');
      if (b) b.remove();
    });
  }

  function updateSubjectSortUI() {
    var bar = document.getElementById('bgm-idx-subject-sortbar');
    var note = document.getElementById('bgm-idx-subject-sort-note');
    var save = document.getElementById('bgm-idx-subject-sort-save');
    if (bar) bar.hidden = !subjectSortPick;
    if (note) note.textContent = '批量排序 · 已点 ' + subjectSortPicked.length + ' / ' + getItems().length;
    if (save) save.disabled = subjectSortPicked.length < 2 || subjectSortSaving;
    getItems().forEach(function (li) {
      var at = subjectSortPicked.indexOf(li);
      li.classList.toggle('is-subj-pick', subjectSortPick);
      var b = li.querySelector('.bgm-idx-subj-pick');
      if (at >= 0) {
        if (!b) {
          b = document.createElement('span');
          b.className = 'bgm-idx-subj-pick';
          li.appendChild(b);
        }
        b.textContent = String(at + 1);
        li.dataset.bgmPick = String(at + 1);
      } else {
        if (b) b.remove();
        delete li.dataset.bgmPick;
      }
    });
  }

  function enterSubjectSort() {
    if (!subjectSortReady()) {
      window.alert(subjectSortHint());
      return;
    }
    subjectSortPick = true;
    subjectSortPicked = [];
    subjectSortOriginal = getItems().slice();
    updateSubjectSortUI();
  }

  function exitSubjectSort() {
    subjectSortPick = false;
    subjectSortPicked = [];
    subjectSortOriginal = [];
    subjectSortCleanup();
    updateSubjectSortUI();
  }

  function applySubjectOrder(ordered) {
    var frag = document.createDocumentFragment();
    ordered.forEach(function (li) {
      frag.appendChild(li);
    });
    list.appendChild(frag);
    ordered.forEach(function (li, i) {
      li.dataset.bgmIndex = String(i);
    });
  }

  function saveSubjectOrder(ordered, original) {
    if (subjectSortSaving) return;
    var form = document.getElementById('ModifyRelatedForm');
    if (!form) {
      window.alert('仅目录作者可排序');
      return;
    }
    componentMutation = true;
    applySubjectOrder(ordered);
    var changes = [];
    ordered.forEach(function (li, i) {
      var rlt = subjectSortRlt(li);
      if (!rlt) return;
      var old = subjectSortOrder(li);
      if (old === i + 1) return;
      changes.push({ li: li, rlt: rlt, order: i + 1, oldOrder: old, content: subjectSortContent(li) });
    });
    if (!changes.length) {
      exitSubjectSort();
      applyState();
      return;
    }
    subjectSortSaving = true;
    updateSubjectSortUI();
    var applied = [];
    function restore() {
      subjectSortSaving = false;
      original.forEach(function (li, i) {
        li.dataset.bgmIndex = String(i);
      });
      applySubjectOrder(original);
      exitSubjectSort();
      applyState();
      window.alert('排序保存失败，已恢复原顺序');
    }
    function rollback() {
      var pending = applied.slice().reverse();
      (function nextRollback() {
        var c = pending.shift();
        if (!c) {
          restore();
          return;
        }
        if (c.oldOrder == null) {
          nextRollback();
          return;
        }
        postRelatedModify(form, { rlt: c.rlt, order: c.oldOrder, content: c.content }).then(nextRollback, nextRollback);
      })();
    }
    function nextSave() {
      if (applied.length >= changes.length) {
        subjectSortSaving = false;
        applySubjectOrder(ordered);
        exitSubjectSort();
        applyState();
        return;
      }
      var c = changes[applied.length];
      postRelatedModify(form, c).then(function () {
        applied.push(c);
        c.li.dataset.bgmOrder = String(c.order);
        var link = c.li.querySelector('p.tools a[order]');
        if (link) link.setAttribute('order', String(c.order));
        updateSubjectSortUI();
        nextSave();
      }, rollback);
    }
    nextSave();
  }

  function bindSubjectSort() {
    var button = document.getElementById('bgm-idx-subject-sort');
    if (!button) return;
    button.hidden = !subjectSortAllowed();
    if (!subjectSortAllowed()) return;
    button.addEventListener('click', enterSubjectSort, { signal: ac.signal });
    var save = document.getElementById('bgm-idx-subject-sort-save');
    if (save) save.addEventListener('click', function () {
      var rest = getItems().filter(function (li) {
        return subjectSortPicked.indexOf(li) < 0;
      });
      var ordered = subjectSortPicked.concat(rest);
      saveSubjectOrder(ordered, subjectSortOriginal);
    }, { signal: ac.signal });
    var reset = document.getElementById('bgm-idx-subject-sort-reset');
    if (reset) reset.addEventListener('click', function () {
      subjectSortPicked = [];
      updateSubjectSortUI();
    }, { signal: ac.signal });
    var cancel = document.getElementById('bgm-idx-subject-sort-cancel');
    if (cancel) cancel.addEventListener('click', exitSubjectSort, { signal: ac.signal });
    list.addEventListener('click', function (e) {
      if (!subjectSortPick) return;
      var li = closest(e.target, 'li.item');
      if (!li || !list.contains(li) || li.classList.contains('bgm-idx-group')) return;
      e.preventDefault();
      e.stopPropagation();
      var at = subjectSortPicked.indexOf(li);
      if (at >= 0) subjectSortPicked.splice(at, 1);
      else subjectSortPicked.push(li);
      updateSubjectSortUI();
    }, true);
    var dragLi = null;
    var dragOriginal = null;
    var subjectDragFrame = null;

    function removeSubjectDragFrame() {
      if (subjectDragFrame && subjectDragFrame.parentNode) subjectDragFrame.parentNode.removeChild(subjectDragFrame);
      subjectDragFrame = null;
    }

    function showSubjectDragFrame(rect) {
      if (!subjectDragFrame) {
        subjectDragFrame = document.createElement('div');
        subjectDragFrame.className = 'bgm-idx-ui-drop-frame';
        subjectDragFrame.setAttribute('aria-hidden', 'true');
        document.body.appendChild(subjectDragFrame);
      }
      subjectDragFrame.style.left = rect.left + 'px';
      subjectDragFrame.style.top = rect.top + 'px';
      subjectDragFrame.style.width = rect.width + 'px';
      subjectDragFrame.style.height = rect.height + 'px';
    }

    getItems().forEach(function (li) {
      li.draggable = true;
      $$('a', li).forEach(function (a) { a.draggable = false; });
      li.addEventListener('dragstart', function (e) {
        if (subjectSortPick) {
          e.preventDefault();
          return;
        }
        if (!subjectSortReady()) {
          e.preventDefault();
          window.alert(subjectSortHint());
          return;
        }
        dragLi = li;
        dragOriginal = getItems().slice();
        removeSubjectDragFrame();
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = 'move';
          try { e.dataTransfer.setData('text/plain', li.id); } catch (err) {}
          if (e.dataTransfer.setDragImage) {
            var dr = li.getBoundingClientRect();
            e.dataTransfer.setDragImage(li, Math.max(0, e.clientX - dr.left), Math.max(0, e.clientY - dr.top));
          }
        }
        li.classList.add('is-subj-dragging');
      }, { signal: ac.signal });
      li.addEventListener('dragend', function () {
        li.classList.remove('is-subj-dragging');
        removeSubjectDragFrame();
        getItems().forEach(function (el) {
          el.classList.remove('is-subj-over', 'is-subj-over-after');
        });
      }, { signal: ac.signal });
      li.addEventListener('dragover', function (e) {
        if (!dragLi || dragLi === li) return;
        e.preventDefault();
        getItems().forEach(function (el) {
          el.classList.remove('is-subj-over', 'is-subj-over-after');
        });
        showSubjectDragFrame(li.getBoundingClientRect());
      }, { signal: ac.signal });
      li.addEventListener('dragleave', function () {
        li.classList.remove('is-subj-over', 'is-subj-over-after');
      }, { signal: ac.signal });
      li.addEventListener('drop', function (e) {
        if (!dragLi || dragLi === li) return;
        e.preventDefault();
        var r = li.getBoundingClientRect();
        var after = e.clientY > r.top + r.height / 2;
        li.classList.remove('is-subj-over', 'is-subj-over-after');
        removeSubjectDragFrame();
        list.insertBefore(dragLi, after ? li.nextSibling : li);
        var ordered = getItems();
        var original = dragOriginal;
        dragLi = null;
        dragOriginal = null;
        saveSubjectOrder(ordered, original);
      }, { signal: ac.signal });
    });
  }

  function applyState() {
    componentMutation = true;
    list.setAttribute('data-bgm-view', state.view);
    list.dataset.bgmDensity = state.density;
    list.dataset.bgmCoverSize = state.coverSize;
    list.classList.toggle('bgm-idx-show-staff', !!state.showStaff);
    var all = getItems();
    applyCachedMyRatings(all);
    if (!isCollectionPage) applyCachedRatings(all);
    all.forEach(renderScore);
    all.forEach(renderWatchCount);
    var shown = all.filter(visible).sort(compare);
    var slicePage = isCollectionPage ? 1 : page;
    var effectiveSize = isCollectionPage ? Math.max(1, shown.length) : (state.pageSize === 0 ? Math.max(1, shown.length) : state.pageSize);
    var size = effectiveSize;
    var pages = isCollectionPage ? 1 : Math.max(1, Math.ceil(shown.length / size));
    if (!isCollectionPage) {
      if (page > pages) page = pages;
      if (page < 1) page = 1;
      slicePage = page;
    }
    var current = shown.slice((slicePage - 1) * size, slicePage * size);
    var set = new Set(current);
    all.forEach(function (li) {
      li.hidden = !set.has(li);
    });
    $$('.bgm-idx-group, .bgm-idx-empty, .bgm-idx-type-sep', list).forEach(function (el) {
      el.remove();
    });
    var frag = document.createDocumentFragment();
    if (state.view === 'timeline') {
      var last = null;
      current.forEach(function (li) {
        var key = li.dataset.bgmDate || '';
        if (key !== last) {
          last = key;
          frag.appendChild(buildGroup(li, key, current));
        }
        frag.appendChild(li);
      });
    } else {
      var lastType = null;
      current.forEach(function (li) {
        if (mixedTypes && li.dataset.bgmType !== lastType) {
          lastType = li.dataset.bgmType;
          frag.appendChild(buildTypeSep(lastType));
        }
        frag.appendChild(li);
      });
    }
    list.appendChild(frag);
    if (!shown.length) {
      var empty = document.createElement('li');
      empty.className = 'bgm-idx-empty';
      empty.appendChild(document.createTextNode('没有符合条件的条目'));
      empty.appendChild(document.createElement('br'));
      var clear = document.createElement('button');
      clear.type = 'button';
      clear.className = 'bgm-idx-btn';
      clear.textContent = '清除筛选';
      clear.addEventListener('click', resetFilters, { signal: ac.signal });
      empty.appendChild(clear);
      list.appendChild(empty);
    }
    updatePager(pages);
    updateStats(shown);
    renderChips();
    syncControls();
    if (isCollectionPage) {
      var collectionSizeControl = $('#bgm-idx-size', toolbar);
      if (collectionSizeControl) collectionSizeControl.value = String(collectionPageSize);
    }
    saveState();
    syncURL();
    if (!isCollectionPage) queueMissingRatings(all);
    queueMyRatings(current);
    raf(updateLayoutVars);
    setTimeout(function () { componentMutation = false; }, 0);
  }

  function applyWithFlip(animate) {
    var canAnimate = typeof Element !== 'undefined' && Element.prototype && typeof Element.prototype.animate === 'function';
    if (!animate || isReduced() || !canAnimate) {
      applyState();
      return;
    }
    var items = getItems();
    var before = new Map();
    items.forEach(function (li) {
      if (!li.hidden) before.set(li, li.getBoundingClientRect());
    });
    applyState();
    var count = 0;
    items.forEach(function (li) {
      var a = before.get(li);
      if (!a || li.hidden || count >= 30) return;
      var b = li.getBoundingClientRect();
      var dx = a.left - b.left;
      var dy = a.top - b.top;
      if (!dx && !dy) return;
      count++;
      li.animate(
        [{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'none' }],
        { duration: 280, easing: 'cubic-bezier(.2,.8,.2,1)' }
      );
    });
  }

  function scrollListTop() {
    if (!list) return;
    var top = window.scrollY + list.getBoundingClientRect().top;
    if (toolbar) top -= toolbar.getBoundingClientRect().height + 12;
    window.scrollTo({ top: Math.max(0, top), behavior: isReduced() ? 'auto' : 'smooth' });
  }

  function resetSearch() {
    state.q = '';
    if (searchInput) searchInput.value = '';
    page = 1;
    applyWithFlip(false);
  }

  function resetFilters() {
    state.state = 'all';
    state.score = 'all';
    state.q = '';
    if (searchInput) searchInput.value = '';
    page = 1;
    applyWithFlip(true);
  }

  function setView(view) {
    if (view !== 'timeline' && view !== 'list' && view !== 'grid') return;
    if (state.view === view) return;
    if (view === 'timeline' && isCollectionPage) {
      var u = new URL(location.href);
      var hasDateOrder = (u.searchParams.get('orderby') || '') === 'date';
      u.searchParams.set('bgm-view', 'timeline');
      u.searchParams.set('orderby', 'date');
      if (!hasDateOrder) {
        u.searchParams.delete('page');
        window.location.href = u.href;
        return;
      }
      state.view = 'timeline';
      state.sort = 'default';
      page = 1;
      applyWithFlip(true);
      raf(updateSegmented);
      return;
    }
    state.view = view;
    if (view === 'timeline' && sortKey(state.sort) !== 'date') state.sort = 'date-asc';
    if (view !== 'timeline' && isCollectionPage) {
      try {
        if ((new URL(location.href).searchParams.get('orderby') || '') === 'date') state.sort = 'date-desc';
      } catch (e) {}
    }
    page = 1;
    applyWithFlip(true);
    raf(updateSegmented);
  }

  function toggleFocus() {
    var on = document.documentElement.classList.toggle('bgm-idx-focus');
    syncControls();
    raf(updateLayoutVars);
    if (on) window.scrollTo({ top: 0, behavior: isReduced() ? 'auto' : 'smooth' });
  }

  function updateLayoutVars() {
    var root = document.documentElement;
    var top = 0;
    var header = document.getElementById('headerNeue2');
    if (header) {
      var pos = '';
      try {
        pos = window.getComputedStyle(header).position;
      } catch (e) {}
      if (pos === 'fixed' || pos === 'sticky') {
        top = header.getBoundingClientRect().height;
      }
    }
    root.style.setProperty('--idx-sticky-top', top + 'px');
    var toolbarHeight = 0;
    if (toolbar) {
      var tpos = '';
      try {
        tpos = window.getComputedStyle(toolbar).position;
      } catch (e) {}
      if (tpos === 'sticky' || tpos === 'fixed') toolbarHeight = toolbar.getBoundingClientRect().height;
    }
    root.style.setProperty('--idx-toolbar-height', toolbarHeight + 'px');
  }

  function fadeCovers(root) {
    $$('img.cover', root).forEach(function (img) {
      if (img.dataset.bgmFade === '1') return;
      img.dataset.bgmFade = '1';
      if (img.complete) {
        img.classList.add('is-loaded');
        return;
      }
      img.classList.add('is-loading');
      img.addEventListener('load', function () {
        img.classList.add('is-loaded');
      }, { once: true });
      img.addEventListener('error', function () {
        img.classList.add('is-loaded');
      }, { once: true });
    });
  }

  function buildToolbar() {
    toolbar = document.createElement('div');
    toolbar.id = 'bgm-idx-toolbar';
    toolbar.className = 'bgm-idx-toolbar';
    toolbar.setAttribute('role', 'region');
    toolbar.setAttribute('aria-label', '目录阅读工具');
    toolbar.innerHTML = `
      <div class="bgm-idx-row">
        <label class="bgm-idx-search">
          <span class="bgm-idx-sr">搜索标题</span>
          <input id="bgm-idx-q" type="search" placeholder="搜索标题…" autocomplete="off">
        </label>
        <div id="bgm-idx-view" class="bgm-idx-segmented" role="group" aria-label="视图">
          <span class="bgm-idx-thumb" aria-hidden="true"></span>
          <button type="button" data-view="timeline" aria-pressed="true">时间轴</button>
          <button type="button" data-view="list" aria-pressed="false">列表</button>
          <button type="button" data-view="grid" aria-pressed="false">封面</button>
        </div>
        <label class="bgm-idx-field">
          <span>排序</span>
          <div id="bgm-idx-sort" class="bgm-idx-sort">
            <button type="button" id="bgm-idx-sort-btn" class="bgm-idx-btn" aria-haspopup="true" aria-expanded="false">放送日 ↑</button>
            <div id="bgm-idx-sort-menu" class="bgm-idx-sort-menu" hidden>
              <button type="button" data-sort-key="default">原顺序</button>
              <button type="button" data-sort-key="date">放送日</button>
<button type="button" data-sort-key="score">评分</button>
            </div>
          </div>
        </label>
        <label class="bgm-idx-field">
          <span>每页</span>
          <select id="bgm-idx-size" aria-label="每页条数">
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="0">全部</option>
          </select>
        </label>
        <button type="button" id="bgm-idx-staff" class="bgm-idx-btn" aria-pressed="false">制作信息</button>
        <button type="button" id="bgm-idx-focus" class="bgm-idx-btn" aria-pressed="false" title="专注（快捷键 ~）">专注</button>

      </div>
      <div class="bgm-idx-row bgm-idx-row-sub">
        <label class="bgm-idx-field">
          <span>状态</span>
          <select id="bgm-idx-state" aria-label="收藏状态">
            <option value="all">全部</option>
            <option value="doing">在看</option>
            <option value="wish">想看</option>
            <option value="done">看过</option>
            <option value="onhold">搁置</option>
            <option value="dropped">抛弃</option>
            <option value="none">未收藏</option>
          </select>
        </label>
        <label class="bgm-idx-field">
          <span>评分</span>
          <select id="bgm-idx-score" aria-label="评分区间">
            <option value="all">全部</option>
            <option value="6">≥ 6</option>
            <option value="7">≥ 7</option>
            <option value="8">≥ 8</option>
            <option value="9">≥ 9</option>
            <option value="none">无评分</option>
          </select>
        </label>
<label id="bgm-idx-density-wrap" class="bgm-idx-field">
          <span>密度</span>
          <select id="bgm-idx-density" aria-label="显示密度">
            <option value="compact">紧凑</option>
            <option value="relaxed">舒适</option>
          </select>
        </label>
        <button type="button" id="bgm-idx-batch-star" class="bgm-idx-btn" hidden>☆ 批量收录</button>
        <label id="bgm-idx-cover-size-wrap" class="bgm-idx-field" hidden>
          <span>大小</span>
          <select id="bgm-idx-cover-size" aria-label="封面大小">
            <option value="small">小</option>
            <option value="medium">中</option>
            <option value="large">大</option>
          </select>
        </label>
        <div id="bgm-idx-chips" class="bgm-idx-chips" aria-live="polite" hidden></div>
        <div id="bgm-idx-stats" class="bgm-idx-stats" aria-live="polite"></div>
        <div id="bgm-idx-subject-sortbar" class="bgm-idx-subject-sortbar" hidden>
          <span id="bgm-idx-subject-sort-note"></span>
          <button type="button" id="bgm-idx-subject-sort-save" class="bgm-idx-btn is-primary">保存顺序</button>
          <button type="button" id="bgm-idx-subject-sort-reset" class="bgm-idx-btn">重来</button>
          <button type="button" id="bgm-idx-subject-sort-cancel" class="bgm-idx-btn">取消</button>
        </div>
      </div>
    `;
    var bar = $(SEL.toolsBar);
    if (bar && bar.parentNode) {
      bar.parentNode.insertBefore(toolbar, bar.nextSibling);
    } else if (list && list.parentNode) {
      list.parentNode.insertBefore(toolbar, list);
    }
    var starBar = document.createElement('div');
    starBar.id = 'bgm-idx-star-bar';
    starBar.className = 'bgm-idx-star-bar';
    starBar.hidden = true;
    starBar.innerHTML = '<span id="bgm-idx-star-bar-note"></span>' +
      '<button type="button" id="bgm-idx-star-bar-pick" class="bgm-idx-btn is-primary">选择目录</button>' +
      '<button type="button" id="bgm-idx-star-bar-cancel" class="bgm-idx-btn">取消</button>';
    if (toolbar.parentNode) toolbar.parentNode.insertBefore(starBar, toolbar.nextSibling);
    searchInput = $('#bgm-idx-q', toolbar);
    statsEl = $('#bgm-idx-stats', toolbar);
    chipsEl = $('#bgm-idx-chips', toolbar);
    segmented = $('#bgm-idx-view', toolbar);
  }

  function buildPager() {
    pager = document.createElement('nav');
    pager.id = 'bgm-idx-pager';
    pager.className = 'bgm-idx-pager';
    pager.setAttribute('aria-label', '分页');
    pager.hidden = true;
    pager.innerHTML = `
      <button type="button" class="bgm-idx-btn" data-page="first">首页</button>
      <button type="button" class="bgm-idx-btn" data-page="prev">上一页</button>
      <span class="bgm-idx-page-info">第 <input id="bgm-idx-page" type="number" min="1" value="1" aria-label="页码"> / <span id="bgm-idx-pages">1</span> 页</span>
      <button type="button" class="bgm-idx-btn" data-page="next">下一页</button>
      <button type="button" class="bgm-idx-btn" data-page="last">末页</button>
    `;
    if (list && list.parentNode) {
      list.parentNode.insertBefore(pager, list.nextSibling);
    }
  }

  function buildTopButton() {
    topBtn = document.createElement('button');
    topBtn.type = 'button';
    topBtn.id = 'bgm-idx-top';
    topBtn.className = 'bgm-idx-top';
    topBtn.setAttribute('aria-label', '回到顶部');
    topBtn.textContent = '↑';
    topBtn.hidden = true;
    document.body.appendChild(topBtn);
  }

  function hideNativeSelector() {
    nativeSelector = $(SEL.native);
    if (!nativeSelector) return;
    nativeDisplay = nativeSelector.style.display;
    nativeSelector.style.display = 'none';
    nativeSelector.setAttribute('aria-hidden', 'true');
  }

  function injectStyle() {
    if (document.getElementById('bgm-idx-style')) return;
    var style = document.createElement('style');
    style.id = 'bgm-idx-style';
    style.textContent = CSS;
    (document.head || document.documentElement).appendChild(style);
  }

  function onKey(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var t = e.target;
    if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) {
      if (e.key === 'Escape') t.blur();
      return;
    }
    if (e.key === '/') {
      e.preventDefault();
      if (searchInput) searchInput.focus();
      return;
    }
    if (e.key === '~' || e.key === '`' || e.key === '～') {
      e.preventDefault();
      toggleFocus();
      return;
    }
    if (e.key === '1') {
      e.preventDefault();
      setView('timeline');
      return;
    }
    if (e.key === '2') {
      e.preventDefault();
      setView('list');
      return;
    }
    if (e.key === '3') {
      e.preventDefault();
      setView('grid');
      return;
    }
    if (e.key === 'Escape') {
      if ($('#bgm-idx-sort-menu') && !$('#bgm-idx-sort-menu').hidden) {
        e.preventDefault();
        toggleSortMenu(false);
        return;
      }
      if (document.documentElement.classList.contains('bgm-idx-focus')) {
        e.preventDefault();
        toggleFocus();
        return;
      }
      if (state.q) {
        e.preventDefault();
        resetSearch();
      }
    }
  }

  function onScroll() {
    if (scrollTicking) return;
    scrollTicking = true;
    raf(function () {
      scrollTicking = false;
      if (topBtn) topBtn.hidden = window.scrollY < 600;
      if (toolbar) toolbar.classList.toggle('is-stuck', window.scrollY > 0);
    });
  }

  function bind() {
    var opts = { signal: ac.signal };
    toolbar.addEventListener('input', function (e) {
      if (e.target && e.target.id === 'bgm-idx-q') {
        state.q = e.target.value;
        clearTimeout(searchTimer);
        searchTimer = setTimeout(function () {
          if (isCollectionPage) {
            if (state.q.trim()) {
              renderCollectionSearch(state.q);
              return;
            }
            if (collectionSearchMode) {
              exitCollectionSearch();
              return;
            }
          }
          page = 1;
          applyWithFlip(false);
        }, 150);
      }
    }, opts);
    toolbar.addEventListener('change', function (e) {
      var id = e.target && e.target.id;
      if (!id) return;
      if (id === 'bgm-idx-size') {
        var nextSize = +e.target.value;
        if (isCollectionPage) {
          var oldSize = collectionPageSize;
          var oldPage = page;
          collectionPageSize = nextSize;
          if (collectionSearchMode) {
            if (state.q.trim()) renderCollectionSearch(state.q);
            return;
          }
          if (nextSize === 0) {
            enterCollectionInfinite();
            return;
          }
          collectionInfinite = false;
          if (oldSize === 0) {
            page = Math.max(1, Math.floor(collectionInfiniteRendered / nextSize) + 1);
          } else {
            page = Math.max(1, Math.floor(((oldPage - 1) * oldSize) / nextSize) + 1);
          }
          loadCollectionChunk(page);
          return;
        }
        state.pageSize = nextSize;
        page = 1;
        applyWithFlip(true);
      } else if (id === 'bgm-idx-density') {
        state.density = e.target.value;
        applyWithFlip(true);
      } else if (id === 'bgm-idx-cover-size') {
        state.coverSize = e.target.value;
        applyWithFlip(true);
      } else if (id === 'bgm-idx-state') {
        state.state = e.target.value;
        page = 1;
        applyWithFlip(true);
      } else if (id === 'bgm-idx-score') {
        state.score = e.target.value;
        page = 1;
        applyWithFlip(true);
      }
    }, opts);
    toolbar.addEventListener('click', function (e) {
      var viewBtn = closest(e.target, 'button[data-view]');
      if (viewBtn) {
        setView(viewBtn.dataset.view);
        return;
      }
      if (closest(e.target, '#bgm-idx-sort-btn')) {
        toggleSortMenu();
        return;
      }
      var sortItem = closest(e.target, 'button[data-sort-key]');
      if (sortItem) {
        toggleSort(sortItem.dataset.sortKey);
        return;
      }
      var chipX = closest(e.target, '.bgm-idx-chip-x');
      if (chipX) {
        state[chipX.dataset.filter] = 'all';
        page = 1;
        applyWithFlip(true);
        return;
      }
      if (closest(e.target, '#bgm-idx-staff')) {
        state.showStaff = !state.showStaff;
        applyWithFlip(true);
        return;
      }
      if (closest(e.target, '#bgm-idx-focus')) {
        toggleFocus();
      }
    }, opts);
    pager.addEventListener('click', function (e) {
      var btn = closest(e.target, '[data-page]');
      if (btn) {
        if (isCollectionPage) {
          var targetPage = null;
          if (btn.dataset.page === 'first') targetPage = 1;
          else if (btn.dataset.page === 'last') targetPage = totalPages;
          else if (btn.dataset.page === 'prev') targetPage = page - 1;
          else if (btn.dataset.page === 'next') targetPage = page + 1;
          if (targetPage != null) loadCollectionChunk(targetPage);
          return;
        }
        if (btn.dataset.page === 'first') page = 1;
        else if (btn.dataset.page === 'last') page = totalPages;
        else if (btn.dataset.page === 'prev' && page > 1) page--;
        else if (btn.dataset.page === 'next') page++;
        applyWithFlip(true);
        scrollListTop();
      }
    }, opts);
    pager.addEventListener('change', function (e) {
      if (e.target && e.target.id === 'bgm-idx-page') {
        var v = parseInt(e.target.value, 10);
        if (v >= 1) {
          if (isCollectionPage) {
            loadCollectionChunk(v);
            return;
          }
          page = v;
          applyWithFlip(true);
          scrollListTop();
        }
      }
    }, opts);
    document.addEventListener('keydown', onKey, opts);
    window.addEventListener('scroll', onScroll, { passive: true, signal: ac.signal });
    window.addEventListener('scroll', function () {
      if (isCollectionPage) collectionMaybeLoadMore();
    }, { passive: true, signal: ac.signal });
    window.addEventListener('resize', function () {
      updateLayoutVars();
      updateSegmented();
    }, opts);
    document.addEventListener('click', function (e) {
      if (!closest(e.target, '#bgm-idx-sort')) toggleSortMenu(false);
      if (closest(e.target, '#bgm-idx-top')) {
        window.scrollTo({ top: 0, behavior: isReduced() ? 'auto' : 'smooth' });
      }
    }, opts);
  }

  function loadCharCache() {
    try {
      var raw = localStorage.getItem(CHAR_KEY);
      var data = raw ? JSON.parse(raw) : {};
      var now = Date.now();
      Object.keys(data).forEach(function (id) {
        if (!data[id] || typeof data[id].ts !== 'number' || now - data[id].ts > CHAR_TTL * 7) delete data[id];
      });
      return data;
    } catch (e) {
      return {};
    }
  }

  function saveCharCache() {
    try {
      localStorage.setItem(CHAR_KEY, JSON.stringify(charCache));
    } catch (e) {}
  }

  function applyCharacterData(item, data) {
    var images = data && data.images ? data.images : {};
    var img = $('a.avatar img', item);
    if (img && (images.large || images.medium || images.grid)) {
      if (img.dataset.bgmCrtOriginalSrc == null) img.dataset.bgmCrtOriginalSrc = img.getAttribute('src') || '';
      img.src = images.large || images.medium || images.grid;
      img.setAttribute('loading', 'lazy');
    }
    var name = data && (data.name_cn || data.name);
    var nameLink = $('h3 a.l', item);
    if (name && nameLink && data.name_cn) {
      if (nameLink.dataset.bgmCrtOriginalName == null) nameLink.dataset.bgmCrtOriginalName = nameLink.textContent.trim();
      nameLink.textContent = data.name_cn;
    }
    if (name || nameLink) {
      var finalName = data && data.name_cn ? data.name_cn : (name || text(nameLink));
      item.dataset.bgmCrtName = finalName;
      item.title = finalName;
    }
  }

  function fetchCharacter(item) {
    var id = item.dataset.bgmCrtId;
    if (!id) return Promise.resolve();
    var cached = charCache[id];
    if (cached && Date.now() - cached.ts < CHAR_TTL) {
      applyCharacterData(item, cached.data);
      return Promise.resolve();
    }
    if (!window.fetch) return Promise.resolve();
    return window.fetch('https://api.bgm.tv/v0/characters/' + encodeURIComponent(id), {
      mode: 'cors',
      credentials: 'omit',
      signal: charAbort.signal
    }).then(function (res) {
      if (res && res.ok === false) throw new Error('character http ' + res.status);
      return res.json();
    }).then(function (data) {
      if (charAbort.signal.aborted) return;
      var payload = {
        name: data.name || '',
        name_cn: data.name_cn || '',
        images: data.images || {}
      };
      charCache[id] = { ts: Date.now(), data: payload };
      saveCharCache();
      applyCharacterData(item, payload);
    }).catch(function () {});
  }

  function pumpCharacters() {
    while (charActive < 3 && charQueue.length) {
      var item = charQueue.shift();
      charActive++;
      fetchCharacter(item).then(function () {
        charActive--;
        pumpCharacters();
      }, function () {
        charActive--;
        pumpCharacters();
      });
    }
  }

  function queueCharacter(item) {
    var id = item.dataset.bgmCrtId;
    if (!id || charRequested.has(id)) return;
    charRequested.add(id);
    charQueue.push(item);
    pumpCharacters();
  }

  var CRT_COMMENT_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 8.6 8.6 0 0 1-3.8-.9L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5z"/></svg>';
  var CRT_HEART_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';

  function buildCharacterActions(item) {
    var nameLink = $('h3 a.l', item);
    if (nameLink) {
      nameLink.addEventListener('click', function (e) {
        if (Date.now() < crtSuppressClickUntil) return;
        e.preventDefault();
        e.stopPropagation();
        window.location.href = nameLink.getAttribute('href');
      }, { signal: charAc.signal });
    }
    var eraseLink = $('a.erase_idx_rlt', item);
    var modifyLink = $('a.tb_idx_rlt', item);
    if (!eraseLink && !modifyLink) return;
    var acts = document.createElement('div');
    acts.className = 'bgm-idx-crt-acts';
    if (modifyLink) {
      var commentBtn = document.createElement('button');
      commentBtn.type = 'button';
      commentBtn.className = 'bgm-idx-crt-act bgm-idx-crt-comment';
      commentBtn.title = '修改评价';
      commentBtn.setAttribute('aria-label', '修改评价');
      commentBtn.innerHTML = CRT_COMMENT_ICON;
      commentBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        modifyLink.click();
        if (!modifyLink.classList.contains('thickbox') && typeof window.tb_show === 'function') {
          window.tb_show('修改评价', modifyLink.getAttribute('href'));
        }
      }, { signal: charAc.signal });
      acts.appendChild(commentBtn);
    }
    if (eraseLink) {
      var heartBtn = document.createElement('button');
      heartBtn.type = 'button';
      heartBtn.className = 'bgm-idx-crt-act bgm-idx-crt-heart';
      heartBtn.title = '解除关联';
      heartBtn.setAttribute('aria-label', '解除关联');
      heartBtn.innerHTML = CRT_HEART_ICON;
      heartBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        eraseCharacterRelation(item, heartBtn, eraseLink);
      }, { signal: charAc.signal });
      acts.appendChild(heartBtn);
    }
    item.appendChild(acts);
  }

  function eraseCharacterRelation(item, btn, link) {
    var href = link && link.getAttribute('href');
    if (!href) return;
    var name = item.dataset.bgmCrtName || '这个角色';
    if (!window.confirm('确认解除「' + name + '」与本目录的关联？')) return;
    btn.classList.add('is-busy');
    window.fetch(href + (href.indexOf('?') >= 0 ? '&' : '?') + 'ajax=1', {
      credentials: 'include',
      headers: { 'X-Requested-With': 'XMLHttpRequest' }
    }).then(function (res) {
      if (!res.ok) throw new Error('http ' + res.status);
      if (res.redirected && /\/login/.test(res.url)) throw new Error('login');
      item.classList.add('is-leaving');
      setTimeout(function () {
        item.remove();
        crtItems = crtItems.filter(function (el) { return el !== item; });
        if (crtRender) crtRender();
      }, 220);
    }).catch(function () {
      btn.classList.remove('is-busy');
      window.alert('解除关联失败，请刷新页面后重试');
    });
  }

  function toggleCharacterFocus() {
    var on = document.documentElement.classList.toggle('bgm-idx-focus');
    if (crtFocusBtn) crtFocusBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
  }

  function characterItemsInDom() {
    if (!crtList) return [];
    return Array.prototype.slice.call(crtList.children).filter(function (el) {
      return el.id && /^item_character\d+$/.test(el.id);
    });
  }

  function readCharacterOrder(item) {
    var link = $('a.tb_idx_rlt', item);
    var n = link ? parseInt(link.getAttribute('order'), 10) : NaN;
    return isFinite(n) ? n : null;
  }

  function postRelatedModify(form, payload) {
    var data = new FormData();
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || el.disabled) return;
      if ((el.type === 'checkbox' || el.type === 'radio') && !el.checked) return;
      if (el.name === 'modify_order' || el.name === 'modify_content' || el.name === 'order' || el.name === 'content') return;
      data.append(el.name, el.value);
    });
    data.set('order', String(payload.order));
    data.set('content', payload.content || '');
    data.set('modify_order', String(payload.order));
    data.set('modify_content', payload.content || '');
    return window.fetch('/index/related/' + encodeURIComponent(payload.rlt) + '/modify', {
      method: 'POST',
      body: data,
      credentials: 'include',
      headers: { 'X-Requested-With': 'XMLHttpRequest' }
    }).then(function (res) {
      if (!res.ok) throw new Error('http ' + res.status);
      if (res.redirected && /\/login/.test(res.url)) throw new Error('login');
    });
  }

  function finishCharacterSave() {
    crtSaving = false;
    if (crtList) crtList.classList.remove('is-saving');
    if (crtQueuedSave) {
      var queued = crtQueuedSave;
      crtQueuedSave = null;
      saveCharacterOrder(queued.items, queued.original);
    }
  }

  function saveCharacterOrder(items, originalItems) {
    if (crtSaving) {
      crtQueuedSave = { items: items, original: originalItems };
      return;
    }
    var form = document.getElementById('ModifyRelatedForm');
    if (!form) return;
    var changes = [];
    items.forEach(function (item, i) {
      var link = $('a.tb_idx_rlt', item);
      if (!link) return;
      var oldOrder = readCharacterOrder(item);
      if (oldOrder === i + 1) return;
      changes.push({
        item: item,
        rlt: item.getAttribute('attr-index-related'),
        oldOrder: oldOrder,
        order: i + 1,
        content: text($('.text', item))
      });
    });
    if (!changes.length) return;
    crtSaving = true;
    crtList.classList.add('is-saving');
    var applied = [];
    function restore() {
      finishCharacterSave();
      originalItems.forEach(function (item) {
        crtList.appendChild(item);
      });
      crtItems = originalItems.slice();
      if (crtRender) crtRender();
      window.alert('排序保存失败，已恢复原顺序');
    }
    function rollback() {
      var pending = applied.slice().reverse();
      (function nextRollback() {
        var c = pending.shift();
        if (!c) {
          restore();
          return;
        }
        if (c.oldOrder == null) {
          nextRollback();
          return;
        }
        postRelatedModify(form, { rlt: c.rlt, order: c.oldOrder, content: c.content }).then(nextRollback, nextRollback);
      })();
    }
    function next() {
      if (applied.length >= changes.length) {
        finishCharacterSave();
        return;
      }
      var c = changes[applied.length];
      postRelatedModify(form, c).then(function () {
        applied.push(c);
        var link = $('a.tb_idx_rlt', c.item);
        if (link) link.setAttribute('order', String(c.order));
        next();
      }, rollback);
    }
    next();
  }

  function cancelCharacterPending() {
    if (!crtPending) return;
    if (crtPending.timer) clearTimeout(crtPending.timer);
    crtPending = null;
  }

  function beginCharacterDrag(state) {
    state.dragging = true;
    state.original = characterItemsInDom();
    var rect = state.item.getBoundingClientRect();
    state.offsetX = state.x - rect.left;
    state.offsetY = state.y - rect.top;
    state.placeholder = document.createElement('div');
    state.placeholder.className = 'bgm-idx-crt-placeholder';
    state.placeholder.style.height = rect.height + 'px';
    state.item.parentNode.insertBefore(state.placeholder, state.item);
    try {
      state.item.setPointerCapture(state.pointerId);
    } catch (err) {}
    state.item.style.setProperty('width', rect.width + 'px', 'important');
    state.item.style.setProperty('height', rect.height + 'px', 'important');
    state.item.style.setProperty('left', rect.left + 'px', 'important');
    state.item.style.setProperty('top', rect.top + 'px', 'important');
    state.item.classList.add('is-dragging');
    document.documentElement.classList.add('bgm-idx-dragging');
  }

  function onCharacterPointerDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (!crtList) return;
    if (closest(e.target, '.bgm-idx-crt-act')) return;
    if (closest(e.target, '.bgm-idx-crt-name')) return;
    if (closest(e.target, '.bgm-idx-crt-item h3 a.l')) return;
    var item = closest(e.target, '.bgm-idx-crt-item');
    if (!item || !$('a.tb_idx_rlt', item)) return;
    cancelCharacterPending();
    var state = {
      item: item,
      x: e.clientX,
      y: e.clientY,
      pointerId: e.pointerId,
      timer: 0,
      dragging: false
    };
    state.timer = setTimeout(function () {
      if (crtPending !== state) return;
      state.timer = 0;
      beginCharacterDrag(state);
    }, 380);
    crtPending = state;
  }

  function onCharacterPointerMove(e) {
    var state = crtPending;
    if (!state) return;
    if (!state.dragging) {
      if (Math.abs(e.clientX - state.x) + Math.abs(e.clientY - state.y) > 8) cancelCharacterPending();
      return;
    }
    e.preventDefault();
    state.item.style.setProperty('left', (e.clientX - state.offsetX) + 'px', 'important');
    state.item.style.setProperty('top', (e.clientY - state.offsetY) + 'px', 'important');
    var over = document.elementFromPoint(e.clientX, e.clientY);
    var target = over && closest(over, '.bgm-idx-crt-item');
    if (!target || target === state.item || target.parentNode !== crtList) return;
    var rect = target.getBoundingClientRect();
    var itemRect = state.item.getBoundingClientRect();
    var sameRow = Math.abs(rect.top - itemRect.top) < rect.height * 0.5;
    var before = sameRow ? e.clientX < rect.left + rect.width / 2 : e.clientY < rect.top + rect.height / 2;
    var ph = state.placeholder;
    var isBefore = ph.nextElementSibling === target;
    var isAfter = ph.previousElementSibling === target;
    if (before && !isBefore) crtList.insertBefore(ph, target);
    else if (!before && !isAfter) crtList.insertBefore(ph, target.nextElementSibling);
  }

  function finishCharacterDrag(state, commit) {
    if (state.timer) clearTimeout(state.timer);
    var ph = state.placeholder;
    try {
      state.item.releasePointerCapture(state.pointerId);
    } catch (err) {}
    state.item.classList.remove('is-dragging');
    state.item.style.removeProperty('width');
    state.item.style.removeProperty('height');
    state.item.style.removeProperty('left');
    state.item.style.removeProperty('top');
    document.documentElement.classList.remove('bgm-idx-dragging');
    if (ph && ph.parentNode === crtList) crtList.insertBefore(state.item, ph);
    if (ph) ph.remove();
    state.placeholder = null;
    crtPending = null;
    crtSuppressClickUntil = Date.now() + 120;
    var items = characterItemsInDom();
    var changed = items.some(function (el, i) {
      return el !== state.original[i];
    });
    crtItems = items;
    if (crtRender) crtRender();
    if (commit && changed) saveCharacterOrder(items, state.original);
  }

  function onCharacterPointerUp() {
    var state = crtPending;
    if (!state) return;
    if (!state.dragging) {
      cancelCharacterPending();
      return;
    }
    finishCharacterDrag(state, true);
  }

  function onCharacterPointerCancel() {
    var state = crtPending;
    if (state && state.dragging) finishCharacterDrag(state, false);
    else cancelCharacterPending();
  }

  function onCharacterClickCapture(e) {
    if (Date.now() < crtSuppressClickUntil) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  function enableCharacterDrag() {
    if (!crtList) return;
    crtList.addEventListener('pointerdown', onCharacterPointerDown, { signal: charAc.signal });
    crtList.addEventListener('click', onCharacterClickCapture, { capture: true, signal: charAc.signal });
    document.addEventListener('pointermove', onCharacterPointerMove, { passive: false, signal: charAc.signal });
    document.addEventListener('pointerup', onCharacterPointerUp, { signal: charAc.signal });
    document.addEventListener('pointercancel', onCharacterPointerCancel, { signal: charAc.signal });
  }

  function buildCharacterToolbar(crt, items) {
    crtToolbar = document.createElement('div');
    crtToolbar.id = 'bgm-idx-toolbar';
    crtToolbar.className = 'bgm-idx-toolbar';
    crtToolbar.innerHTML = `
      <div class="bgm-idx-row">
        <label class="bgm-idx-search">
          <span class="bgm-idx-sr">搜索角色</span>
          <input id="bgm-idx-crt-q" type="search" placeholder="搜索角色…" autocomplete="off">
        </label>
        <label class="bgm-idx-field">
          <span>大小</span>
          <select id="bgm-idx-crt-size" aria-label="角色立绘大小">
            <option value="small">小</option>
            <option value="medium" selected>中</option>
            <option value="large">大</option>
          </select>
        </label>
        <button type="button" id="bgm-idx-crt-focus" class="bgm-idx-btn" aria-pressed="false" title="专注（快捷键 ~）">专注</button>
        <div id="bgm-idx-crt-stats" class="bgm-idx-stats" aria-live="polite"></div>
      </div>
    `;
    if (crt && crt.parentNode) crt.parentNode.insertBefore(crtToolbar, crt);
    var search = $('#bgm-idx-crt-q', crtToolbar);
    var size = $('#bgm-idx-crt-size', crtToolbar);
    if (size) size.value = crt.dataset.bgmCrtSize || 'medium';
    var stats = $('#bgm-idx-crt-stats', crtToolbar);
    crtFocusBtn = $('#bgm-idx-crt-focus', crtToolbar);
    if (crtFocusBtn) {
      crtFocusBtn.addEventListener('click', function () {
        toggleCharacterFocus();
      }, { signal: charAc.signal });
    }
    function render() {
      var q = String(search && search.value || '').trim().toLowerCase();
      var tokens = q.split(/[\s\u3000]+/).filter(Boolean).map(normalizeSearch);
      var visible = 0;
      crtItems.forEach(function (item) {
        var nameLink = $('h3 a.l', item);
        var name = normalizeSearch([
          item.dataset.bgmCrtName,
          nameLink && nameLink.dataset.bgmCrtOriginalName,
          text(nameLink)
        ].join(' '));
        var hide = tokens.some(function (t) { return name.indexOf(t) < 0; });
        item.hidden = hide;
        if (!hide) visible++;
      });
      if (stats) stats.textContent = '角色 ' + visible + ' / ' + crtItems.length;
    }
    crtRender = render;
    if (search) {
      search.addEventListener('input', render, { signal: charAc.signal });
    }
    if (size) {
      size.addEventListener('change', function () {
        crt.dataset.bgmCrtSize = size.value;
        try { localStorage.setItem('bgm-index-reader:crt-size:v1', size.value); } catch (e) {}
        saveCloudPrefs({ crtSize: size.value });
      }, { signal: charAc.signal });
    }
    render();
  }

  function bootCharacters(crt, mixed) {
    if (charBooted) return;
    charBooted = true;
    charMixed = !!mixed;
    crtList = crt;
    document.documentElement.classList.add('bgm-idx-ready');
    injectStyle();
    crt.classList.add('bgm-idx-crt-on');
    var crtPrefs = loadCloudPrefs() || {};
    var savedCrtSize = crtPrefs.crtSize || '';
    if (!savedCrtSize) {
      try { savedCrtSize = localStorage.getItem('bgm-index-reader:crt-size:v1') || 'medium'; } catch (e) { savedCrtSize = 'medium'; }
    }
    if (!/^(small|medium|large)$/.test(savedCrtSize)) savedCrtSize = 'medium';
    if (!crtPrefs.crtSize) {
      try { localStorage.setItem('bgm-index-reader:crt-size:v1', savedCrtSize); } catch (e) {}
      saveCloudPrefs({ crtSize: savedCrtSize });
    }
    crt.dataset.bgmCrtSize = savedCrtSize;
    var items = Array.prototype.slice.call(crt.children).filter(function (el) {
      return el.id && /^item_character\d+$/.test(el.id);
    });
    crtItems = items;
    items.forEach(function (item) {
      var id = item.id.replace(/^item_character/, '');
      item.classList.add('bgm-idx-crt-item');
      item.dataset.bgmCrtId = id;
      item.dataset.bgmCrtName = text($('h3 a.l', item));
      item.title = item.dataset.bgmCrtName;
      var nameLayer = null;
      for (var ci = 0; ci < item.children.length; ci++) {
        if (item.children[ci].tagName === 'DIV') {
          nameLayer = item.children[ci];
          break;
        }
      }
      if (nameLayer) {
        nameLayer.classList.add('bgm-idx-crt-name');
      }
      item.addEventListener('click', function (e) {
        if (closest(e.target, '.bgm-idx-crt-act')) return;
        if (Date.now() < crtSuppressClickUntil) return;
        var link = $('h3 a.l', item);
        var href = link && link.getAttribute('href');
        if (!href) return;
        e.preventDefault();
        e.stopPropagation();
        window.location.href = href;
      }, { capture: true, signal: charAc.signal });
      buildCharacterActions(item);
      queueCharacter(item);
    });
    buildCharacterToolbar(crt, items);
    if (crt.querySelector('a.tb_idx_rlt')) enableCharacterDrag();
    if (!mixed) {
      document.addEventListener('keydown', function (e) {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        var t = e.target;
        if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) {
          if (e.key === 'Escape') t.blur();
          return;
        }
        if (e.key === '~' || e.key === '`' || e.key === '～') {
          e.preventDefault();
          toggleCharacterFocus();
          return;
        }
        if (e.key === 'Escape' && document.documentElement.classList.contains('bgm-idx-focus')) {
          e.preventDefault();
          toggleCharacterFocus();
          return;
        }
        if (e.key === '/') {
          var q = $('#bgm-idx-crt-q');
          if (q) {
            e.preventDefault();
            q.focus();
          }
        }
      }, { signal: charAc.signal });
      window.__BGM_IDX_READER_DESTROY__ = destroyCharacters;
    }
  }

  function destroyCharacters() {
    charBooted = false;
    try { charAc.abort(); } catch (e) {}
    charAc = new AbortController();
    try { charAbort.abort(); } catch (e) {}
    charQueue = [];
    crtItems = [];
    crtRender = null;
    crtFocusBtn = null;
    crtPending = null;
    crtSuppressClickUntil = 0;
    document.documentElement.classList.remove('bgm-idx-focus');
    if (crtToolbar) crtToolbar.remove();
    if (!charMixed) {
      var style = document.getElementById('bgm-idx-style');
      if (style) style.remove();
    }
    if (crtList) {
      crtList.classList.remove('bgm-idx-crt-on');
      crtList.removeAttribute('data-bgm-crt-size');
      $$('.bgm-idx-crt-item', crtList).forEach(function (item) {
        item.hidden = false;
        item.classList.remove('bgm-idx-crt-item');
        item.removeAttribute('title');
        var img = $('a.avatar img', item);
        if (img && img.dataset.bgmCrtOriginalSrc != null) {
          img.setAttribute('src', img.dataset.bgmCrtOriginalSrc);
          delete img.dataset.bgmCrtOriginalSrc;
        }
        var nameLink = $('h3 a.l', item);
        if (nameLink && nameLink.dataset.bgmCrtOriginalName != null) {
          nameLink.textContent = nameLink.dataset.bgmCrtOriginalName;
          delete nameLink.dataset.bgmCrtOriginalName;
        }
        Object.keys(item.dataset).forEach(function (k) {
          if (k.indexOf('bgm') === 0) delete item.dataset[k];
        });
      });
    }
    document.documentElement.classList.remove('bgm-idx-ready');
    if (!charMixed) {
      delete window.__BGM_IDX_READER__;
      delete window.__BGM_IDX_READER_DESTROY__;
    }
    charMixed = false;
  }

  function bootUserIndex() {
    var list = $('.index-list > ul') || $('#timeline > ul');
    if (!list) return;
    var items = $$('li.index-item', list);
    if (!items.length) return;
    injectStyle();
    document.documentElement.classList.add('bgm-idx-ready');

    var UI_KEY = USER_INDEX_STORE_KEY;
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(UI_KEY) || '{}') || {}; } catch (e) {}
    var archiveOn = saved.archive !== false;
    var q = saved.q || '';
    var syncedIndex = loadUserIndexFolders();
    var folders = syncedIndex.folders.filter(function (f) {
      return f && f.id && f.name;
    });
    var assign = syncedIndex.assign;
    if (syncedIndex.source === 'local' && (folders.length || Object.keys(assign).length)) {
      saveUserIndexFolders(folders, assign);
    }
    var lastCloudSnapshot = JSON.stringify({ folders: folders, assign: assign });
    var activeFolder = null;
    var selecting = false;
    var multi = false;
    var deleting = false;
    var sortPick = false;
    var sortPicked = [];
    var dragDirId = '';
    var dragFrame = null;
    var dirOrder = Array.isArray(saved.dirOrder) ? saved.dirOrder.slice() : [];
    var selected = new Set();

    items.forEach(function (li, i) {
      var created = '';
      var tips = $$('.tip_j', li);
      if (tips.length) created = text(tips[0]);
      var yearMatch = /^(\d{4})/.exec(created);
      li.dataset.uiIndex = String(i);
      li.dataset.uiTitle = text($('a.l', li));
      li.dataset.uiDesc = text($('span.desc', li));
      li.dataset.uiYear = yearMatch ? yearMatch[1] : '';
      li.dataset.uiCount = text($('.stats .num', li));
      var fileBtn = document.createElement('button');
      fileBtn.type = 'button';
      fileBtn.className = 'bgm-idx-ui-file-btn';
      fileBtn.title = '归档到文件夹';
      fileBtn.textContent = '归档';
      fileBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        openFolderMenu(li, fileBtn);
      }, { signal: ac.signal });
      li.appendChild(fileBtn);
      li.draggable = true;
      $$('a', li).forEach(function (a) { a.draggable = false; });
      li.addEventListener('dragstart', function (e) {
        if (multi || selecting || sortPick) {
          e.preventDefault();
          return;
        }
        dragDirId = dirIdOf(li);
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = 'move';
          try { e.dataTransfer.setData('text/plain', dragDirId); } catch (err) {}
          if (e.dataTransfer.setDragImage) {
            var dr = li.getBoundingClientRect();
            e.dataTransfer.setDragImage(li, Math.max(0, e.clientX - dr.left), Math.max(0, e.clientY - dr.top));
          }
        }
        li.classList.add('is-dir-dragging');
      }, { signal: ac.signal });
      li.addEventListener('dragend', function () {
        li.classList.remove('is-dir-dragging');
        dragDirId = '';
        removeDragFrame();
        items.forEach(function (el) { el.classList.remove('is-dir-over', 'is-dir-over-after'); });
        list.classList.remove('is-dir-over-start');
      }, { signal: ac.signal });
      li.addEventListener('dragover', function (e) {
        if (!dragDirId) return;
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
        showDragFrame(li.getBoundingClientRect());
      }, { signal: ac.signal });
      li.addEventListener('drop', function (e) {
        if (!dragDirId) return;
        e.preventDefault();
        var moving = null;
        items.forEach(function (el) {
          if (dirIdOf(el) === dragDirId) moving = el;
        });
        if (!moving || moving === li) return;
        var rect = li.getBoundingClientRect();
        var after = e.clientY > rect.top + rect.height / 2;
        removeDragFrame();
        items.forEach(function (el) { el.classList.remove('is-dir-over', 'is-dir-over-after'); });
        list.classList.remove('is-dir-over-start');
        list.insertBefore(moving, after ? li.nextSibling : li);
        syncDirOrderFromDom();
      }, { signal: ac.signal });
      li.addEventListener('click', function (e) {
        if (sortPick) {
          e.preventDefault();
          if (closest(e.target, '.bgm-idx-ui-file-btn')) return;
          var sortId = dirIdOf(li);
          var at = sortPicked.indexOf(sortId);
          if (at >= 0) sortPicked.splice(at, 1);
          else sortPicked.push(sortId);
          renderUserIndex();
          return;
        }
        if (!multi) return;
        if (closest(e.target, '.bgm-idx-ui-select')) return;
        if (closest(e.target, '.bgm-idx-ui-file-btn')) return;
        if (closest(e.target, 'a')) e.preventDefault();
        var pickId = dirIdOf(li);
        if (selected.has(pickId)) selected.delete(pickId);
        else selected.add(pickId);
        renderUserIndex();
      }, { signal: ac.signal });
    });

    var toolbar = document.createElement('div');
    toolbar.id = 'bgm-idx-toolbar';
    toolbar.className = 'bgm-idx-toolbar';
    toolbar.innerHTML = `
      <div class="bgm-idx-row">
        <label class="bgm-idx-search">
          <span class="bgm-idx-sr">搜索目录</span>
          <input id="bgm-idx-ui-q" type="search" placeholder="搜索目录名称…" autocomplete="off">
        </label>


        <div id="bgm-idx-ui-stats" class="bgm-idx-stats" aria-live="polite"></div>
      </div>
    `;
    if (list.parentNode) list.parentNode.insertBefore(toolbar, list);
    var folderArea = document.createElement('div');
    folderArea.id = 'bgm-idx-ui-folders';
    folderArea.className = 'bgm-idx-ui-folders';
    var sectionHead = document.createElement('div');
    sectionHead.id = 'bgm-idx-ui-section';
    sectionHead.className = 'bgm-idx-ui-section';
    if (list.parentNode) {
      list.parentNode.insertBefore(folderArea, list);
      list.parentNode.insertBefore(sectionHead, list);
    }

    var search = $('#bgm-idx-ui-q', toolbar);
    var stats = $('#bgm-idx-ui-stats', toolbar);
    if (search) search.value = q;

    function saveUserIndexState() {
      try {
        localStorage.setItem(UI_KEY, JSON.stringify({ q: q, archive: archiveOn, folders: folders, assign: assign, dirOrder: dirOrder }));
      } catch (e) {}
      var snap = JSON.stringify({ folders: folders, assign: assign });
      if (snap !== lastCloudSnapshot) {
        if (saveUserIndexFolders(folders, assign) || !chiiCloudSettings()) {
          lastCloudSnapshot = snap;
        }
      }
    }

    var openMenu = null;

    function folderIdOf(li) {
      var id = assign[li.id.replace(/^item_/, '')];
      for (var i = 0; i < folders.length; i++) {
        if (folders[i].id === id) return id;
      }
      return '';
    }

    function closeFolderMenu() {
      if (openMenu) {
        openMenu.remove();
        openMenu = null;
      }
    }

    function createFolder(target) {
      var name = window.prompt('文件夹名称（例如：季度追番表）', '');
      if (!name || !name.trim()) return;
      var desc = window.prompt('文件夹介绍（可留空）', '');
      if (desc === null) desc = '';
      var folder = { id: 'f' + Date.now(), name: name.trim(), desc: String(desc).trim() };
      folders.push(folder);
      if (target) assign[target.id.replace(/^item_/, '')] = folder.id;
      saveUserIndexState();
      renderUserIndex();
    }

    function openFolderMenu(li, btn) {
      closeFolderMenu();
      var menu = document.createElement('div');
      menu.className = 'bgm-idx-ui-menu';
      folders.forEach(function (f) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = f.name;
        b.addEventListener('click', function () {
          assign[li.id.replace(/^item_/, '')] = f.id;
          saveUserIndexState();
          closeFolderMenu();
          renderUserIndex();
        });
        menu.appendChild(b);
      });
      var none = document.createElement('button');
      none.type = 'button';
      none.textContent = '未归档';
      none.addEventListener('click', function () {
        delete assign[li.id.replace(/^item_/, '')];
        saveUserIndexState();
        closeFolderMenu();
        renderUserIndex();
      });
      menu.appendChild(none);
      var add = document.createElement('button');
      add.type = 'button';
      add.className = 'bgm-idx-ui-menu-new';
      add.textContent = '新建文件夹…';
      add.addEventListener('click', function () {
        closeFolderMenu();
        createFolder(li);
      });
      menu.appendChild(add);
      document.body.appendChild(menu);
      var r = btn.getBoundingClientRect();
      menu.style.left = Math.max(8, Math.min(r.left, window.innerWidth - 220)) + 'px';
      menu.style.top = Math.max(8, r.bottom + 4) + 'px';
      openMenu = menu;
    }

    function folderById(id) {
      for (var i = 0; i < folders.length; i++) {
        if (folders[i].id === id) return folders[i];
      }
      return null;
    }

    function dirIdOf(li) {
      return li.id.replace(/^item_/, '');
    }

    function looseItems() {
      return items.filter(function (li) {
        return !folderIdOf(li);
      });
    }

    function countInFolder(id) {
      var n = 0;
      items.forEach(function (li) {
        if (folderIdOf(li) === id) n++;
      });
      return n;
    }

    function makeBtn(text, primary) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'bgm-idx-btn' + (primary ? ' is-primary' : '');
      b.textContent = text;
      return b;
    }

    function editFolder(folder) {
      var name = window.prompt('文件夹名称', folder.name);
      if (name === null) return;
      if (!name || !name.trim()) return;
      var desc = window.prompt('文件夹介绍（可留空）', folder.desc || '');
      if (desc === null) desc = folder.desc || '';
      folder.name = name.trim();
      folder.desc = String(desc).trim();
      saveUserIndexState();
      renderUserIndex();
    }

    function deleteFolder(folder) {
      if (!window.confirm('删除文件夹「' + folder.name + '」？其中的目录会回到未归档。')) return;
      folders = folders.filter(function (f) {
        return f.id !== folder.id;
      });
      Object.keys(assign).forEach(function (k) {
        if (assign[k] === folder.id) delete assign[k];
      });
      if (activeFolder === folder.id) activeFolder = null;
      selecting = false;
      selected.clear();
      saveUserIndexState();
      renderUserIndex();
    }

    function openFolder(id) {
      activeFolder = id;
      selecting = false;
      selected.clear();
      renderUserIndex();
    }

    function addSelectedToFolder() {
      if (!activeFolder || !selected.size) return;
      selected.forEach(function (id) {
        assign[id] = activeFolder;
      });
      saveUserIndexState();
      selecting = false;
      selected.clear();
      renderUserIndex();
    }

    function enterSortPick() {
      sortPick = true;
      multi = false;
      selecting = false;
      selected.clear();
      sortPicked = [];
      renderUserIndex();
    }

    function removeDragFrame() {
      if (dragFrame && dragFrame.parentNode) dragFrame.parentNode.removeChild(dragFrame);
      dragFrame = null;
    }

    function showDragFrame(rect) {
      if (!dragFrame) {
        dragFrame = document.createElement('div');
        dragFrame.className = 'bgm-idx-ui-drop-frame';
        dragFrame.setAttribute('aria-hidden', 'true');
        document.body.appendChild(dragFrame);
      }
      dragFrame.style.left = rect.left + 'px';
      dragFrame.style.top = rect.top + 'px';
      dragFrame.style.width = rect.width + 'px';
      dragFrame.style.height = rect.height + 'px';
    }

    function syncDirOrderFromDom() {
      dirOrder = Array.prototype.slice.call(list.children).filter(function (el) {
        return el.classList && el.classList.contains('index-item');
      }).map(dirIdOf);
      saveUserIndexState();
      renderUserIndex();
    }

    function enterMulti() {
      multi = true;
      selecting = false;
      selected.clear();
      renderUserIndex();
    }

    function exitMulti() {
      multi = false;
      selected.clear();
      renderUserIndex();
    }

    function selectedItems() {
      return items.filter(function (li) {
        return selected.has(dirIdOf(li));
      });
    }

    function bulkArchiveSelected(targetId) {
      if (!selected.size) return;
      selected.forEach(function (id) {
        if (targetId) assign[id] = targetId;
        else delete assign[id];
      });
      saveUserIndexState();
      exitMulti();
    }

    function createFolderForSelected() {
      if (!selected.size) return;
      var name = window.prompt('文件夹名称（例如：季度追番表）', '');
      if (!name || !name.trim()) return;
      var desc = window.prompt('文件夹介绍（可留空）', '');
      if (desc === null) desc = '';
      var folder = { id: 'f' + Date.now(), name: name.trim(), desc: String(desc).trim() };
      folders.push(folder);
      selected.forEach(function (id) {
        assign[id] = folder.id;
      });
      saveUserIndexState();
      exitMulti();
    }

    function openBulkFolderMenu(btn) {
      closeFolderMenu();
      var menu = document.createElement('div');
      menu.className = 'bgm-idx-ui-menu';
      folders.forEach(function (f) {
        if (activeFolder === f.id) return;
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = f.name;
        b.addEventListener('click', function () {
          bulkArchiveSelected(f.id);
          closeFolderMenu();
        }, { signal: ac.signal });
        menu.appendChild(b);
      });
      if (activeFolder) {
        var none = document.createElement('button');
        none.type = 'button';
        none.textContent = '未归档';
        none.addEventListener('click', function () {
          bulkArchiveSelected(null);
          closeFolderMenu();
        }, { signal: ac.signal });
        menu.appendChild(none);
      }
      var add = document.createElement('button');
      add.type = 'button';
      add.className = 'bgm-idx-ui-menu-new';
      add.textContent = '新建文件夹…';
      add.addEventListener('click', function () {
        closeFolderMenu();
        createFolderForSelected();
      }, { signal: ac.signal });
      menu.appendChild(add);
      document.body.appendChild(menu);
      var r = btn.getBoundingClientRect();
      menu.style.left = Math.max(8, Math.min(r.left, window.innerWidth - 220)) + 'px';
      menu.style.top = Math.max(8, r.bottom + 4) + 'px';
      openMenu = menu;
    }

    async function deleteSiteIndex(id) {
      var page = await fetch('/index/' + id, { credentials: 'same-origin' });
      if (!page.ok) throw new Error('读取目录页失败（' + page.status + '）');
      var html = await page.text();
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var form = doc.querySelector('#eraseIndex form') ||
        doc.querySelector('form[action*="/erase"]') ||
        doc.querySelector('form[action*="eraseIndex"]');
      if (!form) throw new Error('未找到删除表单');
      var action = form.getAttribute('action') || ('/index/' + id);
      var method = (form.getAttribute('method') || 'POST').toUpperCase();
      var data = new FormData();
      Array.prototype.forEach.call(form.elements, function (el) {
        if (!el.name || el.disabled) return;
        if ((el.type === 'checkbox' || el.type === 'radio') && !el.checked) return;
        data.append(el.name, el.value);
      });
      var url = new URL(action, location.origin);
      var opts = { credentials: 'same-origin', method: method };
      if (method === 'GET') {
        data.forEach(function (v, k) {
          url.searchParams.append(k, v);
        });
      } else {
        opts.body = data;
      }
      var res = await fetch(url.href, opts);
      if (!res.ok) throw new Error('删除请求失败（' + res.status + '）');
    }

    function deleteSelected() {
      if (!selected.size || deleting) return;
      var targets = selectedItems();
      var names = targets.map(function (li) {
        return '「' + (li.dataset.uiTitle || dirIdOf(li)) + '」';
      });
      var lines = names.slice(0, 30).join('\n');
      if (names.length > 30) lines += '\n…等 ' + names.length + ' 个';
      var missing = selected.size - targets.length;
      if (missing > 0) lines += '\n另有 ' + missing + ' 个（当前未显示）';
      if (!window.confirm('确定删除以下 ' + selected.size + ' 个站点目录？此操作不可恢复，删除后文件夹中的记录也会消失：\n\n' + lines)) return;
      runDelete(targets);
    }

    async function runDelete(targets) {
      deleting = true;
      var done = [];
      var failed = [];
      for (var i = 0; i < targets.length; i++) {
        var li = targets[i];
        var id = dirIdOf(li);
        if (stats) stats.textContent = '正在删除 ' + (i + 1) + ' / ' + targets.length + '…';
        try {
          await deleteSiteIndex(id);
          done.push(id);
          delete assign[id];
          li.remove();
        } catch (err) {
          failed.push({ title: li.dataset.uiTitle || id, message: (err && err.message) || String(err) });
        }
      }
      var doneSet = new Set(done);
      items = items.filter(function (li) {
        return !doneSet.has(dirIdOf(li));
      });
      deleting = false;
      saveUserIndexState();
      exitMulti();
      renderUserIndex();
      if (failed.length) {
        window.alert('已删除 ' + done.length + ' 个，失败 ' + failed.length + ' 个：\n' + failed.map(function (f) {
          return '「' + f.title + '」' + f.message;
        }).join('\n'));
      } else {
        window.alert('已删除 ' + done.length + ' 个目录。');
      }
    }

    function ensureSelectBox(li) {
      var box = li.querySelector('.bgm-idx-ui-select');
      if (!box) {
        box = document.createElement('input');
        box.type = 'checkbox';
        box.className = 'bgm-idx-ui-select';
        box.setAttribute('aria-label', '选择目录');
        box.addEventListener('change', function () {
          var id = dirIdOf(li);
          if (box.checked) selected.add(id);
          else selected.delete(id);
          renderUserIndex();
        }, { signal: ac.signal });
        li.insertBefore(box, li.firstChild);
      }
      return box;
    }

    function buildFolderCards() {
      folderArea.innerHTML = '';
      if (!folders.length) {
        var empty = document.createElement('div');
        empty.className = 'bgm-idx-ui-folder-empty';
        empty.textContent = '还没有文件夹。点击“新建文件夹”，把同类目录归档到一起。';
        folderArea.appendChild(empty);
        return;
      }
      folders.forEach(function (folder) {
        var card = document.createElement('div');
        card.className = 'bgm-idx-ui-folder-card';
        if (activeFolder === folder.id) card.classList.add('is-active');
        var head = document.createElement('div');
        head.className = 'bgm-idx-ui-folder-card-head';
        var name = document.createElement('span');
        name.className = 'bgm-idx-ui-folder-card-name';
        name.textContent = folder.name;
        var count = document.createElement('span');
        count.className = 'bgm-idx-ui-folder-card-count';
        count.textContent = countInFolder(folder.id) + ' 个目录';
        head.appendChild(name);
        head.appendChild(count);
        var desc = document.createElement('div');
        desc.className = 'bgm-idx-ui-folder-card-desc';
        desc.textContent = folder.desc || '暂无介绍';
        card.appendChild(head);
        card.appendChild(desc);
        card.addEventListener('click', function () {
          if (multi) {
            multi = false;
            selected.clear();
          }
          openFolder(folder.id);
        }, { signal: ac.signal });
        folderArea.appendChild(card);
      });
    }

    function buildSectionHead(visible, active) {
      sectionHead.innerHTML = '';
      var row = document.createElement('div');
      row.className = 'bgm-idx-ui-section-row';
      var title = document.createElement('span');
      title.className = 'bgm-idx-ui-section-title';
      var actions = document.createElement('span');
      actions.className = 'bgm-idx-ui-section-actions';
      var folder = active ? folderById(active) : null;
      if (sortPick) {
        title.textContent = '批量排序 · 已点 ' + sortPicked.length;
        var saveSort = makeBtn('保存顺序', true);
        saveSort.disabled = sortPicked.length < 2;
        saveSort.addEventListener('click', function () {
          var rest = items.filter(function (li) {
            return sortPicked.indexOf(dirIdOf(li)) < 0;
          }).map(dirIdOf);
          dirOrder = sortPicked.concat(rest);
          sortPick = false;
          sortPicked = [];
          saveUserIndexState();
          renderUserIndex();
        }, { signal: ac.signal });
        var resetSort = makeBtn('重来');
        resetSort.addEventListener('click', function () {
          sortPicked = [];
          renderUserIndex();
        }, { signal: ac.signal });
        var cancelSort = makeBtn('取消');
        cancelSort.addEventListener('click', function () {
          sortPick = false;
          sortPicked = [];
          renderUserIndex();
        }, { signal: ac.signal });
        actions.appendChild(saveSort);
        actions.appendChild(resetSort);
        actions.appendChild(cancelSort);
      } else if (multi) {
        title.textContent = (folder ? '多选「' + folder.name + '」' : '多选未归档') + ' · 已选 ' + selected.size;
        var pickAll = makeBtn('全选');
        pickAll.disabled = !visible.length;
        pickAll.addEventListener('click', function () {
          visible.forEach(function (li) {
            selected.add(dirIdOf(li));
          });
          renderUserIndex();
        }, { signal: ac.signal });
        var archive = makeBtn('归档（' + selected.size + '）', true);
        archive.disabled = !selected.size;
        archive.addEventListener('click', function (e) {
          e.stopPropagation();
          openBulkFolderMenu(archive);
        }, { signal: ac.signal });
        var remove = makeBtn('删除（' + selected.size + '）');
        remove.className = 'bgm-idx-btn is-danger';
        remove.disabled = !selected.size || deleting;
        remove.addEventListener('click', function () {
          deleteSelected();
        }, { signal: ac.signal });
        var cancelMulti = makeBtn('取消');
        cancelMulti.addEventListener('click', function () {
          exitMulti();
        }, { signal: ac.signal });
        actions.appendChild(pickAll);
        actions.appendChild(archive);
        actions.appendChild(remove);
        actions.appendChild(cancelMulti);
      } else if (selecting && folder) {
        title.textContent = '选择目录加入「' + folder.name + '」 · 已选 ' + selected.size;
        var all = makeBtn('全选');
        all.addEventListener('click', function () {
          visible.forEach(function (li) {
            selected.add(dirIdOf(li));
          });
          renderUserIndex();
        }, { signal: ac.signal });
        var add = makeBtn('加入（' + selected.size + '）', true);
        add.id = 'bgm-idx-ui-add-selected';
        add.disabled = !selected.size;
        add.addEventListener('click', function () {
          addSelectedToFolder();
        }, { signal: ac.signal });
        var cancel = makeBtn('取消');
        cancel.addEventListener('click', function () {
          selecting = false;
          selected.clear();
          renderUserIndex();
        }, { signal: ac.signal });
        actions.appendChild(all);
        actions.appendChild(add);
        actions.appendChild(cancel);
      } else if (folder) {
        title.textContent = folder.name + ' · ' + countInFolder(folder.id) + ' 个目录';
        var batch = makeBtn('批量添加');
        batch.disabled = !looseItems().length;
        batch.addEventListener('click', function () {
          selecting = true;
          selected.clear();
          renderUserIndex();
        }, { signal: ac.signal });
        var edit = makeBtn('编辑');
        edit.addEventListener('click', function () {
          editFolder(folder);
        }, { signal: ac.signal });
        var del = makeBtn('删除');
        del.addEventListener('click', function () {
          deleteFolder(folder);
        }, { signal: ac.signal });
        var back = makeBtn('返回未归档');
        back.addEventListener('click', function () {
activeFolder = null;
      selecting = false;
      multi = false;
      deleting = false;
      sortPick = false;
      sortPicked = [];
      dirOrder = [];
      dragDirId = '';
      selected.clear();
          renderUserIndex();
        }, { signal: ac.signal });
        var pickFolder = makeBtn('多选');
        pickFolder.disabled = !visible.length;
        pickFolder.addEventListener('click', enterMulti, { signal: ac.signal });
        var sortFolder = makeBtn('批量排序');
        sortFolder.disabled = !visible.length;
        sortFolder.addEventListener('click', enterSortPick, { signal: ac.signal });
        actions.appendChild(batch);
        actions.appendChild(pickFolder);
        actions.appendChild(sortFolder);
        actions.appendChild(edit);
        actions.appendChild(del);
        actions.appendChild(back);
      } else {
        title.textContent = '未归档 · ' + looseItems().length + ' 个目录';
        var create = makeBtn('新建文件夹', true);
        create.addEventListener('click', function () {
          createFolder(null);
        }, { signal: ac.signal });
        var pickLoose = makeBtn('多选');
        pickLoose.disabled = !visible.length;
        pickLoose.addEventListener('click', enterMulti, { signal: ac.signal });
        var sortLoose = makeBtn('批量排序');
        sortLoose.disabled = !visible.length;
        sortLoose.addEventListener('click', enterSortPick, { signal: ac.signal });
        actions.appendChild(create);
        actions.appendChild(pickLoose);
        actions.appendChild(sortLoose);
      }
      row.appendChild(title);
      row.appendChild(actions);
      sectionHead.appendChild(row);
      if (folder && folder.desc && !selecting && !multi) {
        var desc = document.createElement('div');
        desc.className = 'bgm-idx-ui-section-desc';
        desc.textContent = folder.desc;
        sectionHead.appendChild(desc);
      }
      if (selecting && folder) {
        var hint = document.createElement('div');
        hint.className = 'bgm-idx-ui-section-desc';
        hint.textContent = '勾选下方未归档目录，选择完成后点击“加入”。';
        sectionHead.appendChild(hint);
      }
    }

    function renderUserIndex() {
      var tokens = String(q || '').toLowerCase().split(/[\s\u3000]+/).filter(Boolean).map(normalizeSearch);
      function matches(li) {
        var hay = normalizeSearch(li.dataset.uiTitle || '');
        for (var i = 0; i < tokens.length; i++) {
          if (hay.indexOf(tokens[i]) < 0) return false;
        }
        return true;
      }
      var active = activeFolder && folderById(activeFolder) ? activeFolder : null;
      if (!active) activeFolder = null;
      var source;
      if (selecting && active) {
        source = looseItems();
      } else if (active) {
        source = items.filter(function (li) {
          return folderIdOf(li) === active;
        });
      } else if (String(q || '').trim()) {
        source = items;
      } else {
        source = looseItems();
      }
      var visible = source.filter(matches);
      visible.sort(function (a, b) {
        var ai = dirOrder.indexOf(dirIdOf(a));
        var bi = dirOrder.indexOf(dirIdOf(b));
        if (ai < 0 && bi < 0) return 0;
        if (ai < 0) return 1;
        if (bi < 0) return -1;
        return ai - bi;
      });
      var visSet = new Set(visible);
      items.forEach(function (li) {
        li.hidden = !visSet.has(li);
        var box = ensureSelectBox(li);
        var itemId = dirIdOf(li);
        var picked = selected.has(itemId);
        var pickAt = sortPick ? sortPicked.indexOf(itemId) : -1;
        box.hidden = !(visSet.has(li) && (multi || sortPick || (selecting && active && !folderIdOf(li))));
        box.checked = sortPick ? pickAt >= 0 : picked;
        box.style.pointerEvents = sortPick ? 'none' : '';
        li.classList.toggle('is-multi', multi);
        li.classList.toggle('is-multi-selected', multi && picked);
        li.classList.toggle('is-sort-pick', sortPick);
        var badge = li.querySelector('.bgm-idx-ui-pick');
        var pickAt = sortPick ? sortPicked.indexOf(itemId) : -1;
        if (pickAt >= 0) {
          if (!badge) {
            badge = document.createElement('span');
            badge.className = 'bgm-idx-ui-pick';
            li.appendChild(badge);
          }
          badge.textContent = String(pickAt + 1);
        } else if (badge) {
          badge.remove();
        }
        var fileBtn = li.querySelector('.bgm-idx-ui-file-btn');
        if (fileBtn) fileBtn.hidden = !!selecting || multi || sortPick;
      });
      var frag = document.createDocumentFragment();
      visible.forEach(function (li) { frag.appendChild(li); });
      list.appendChild(frag);
      buildFolderCards();
      buildSectionHead(visible, active);
      if (stats) {
        stats.textContent = '目录 ' + items.length + ' · 未归档 ' + looseItems().length +
          (active ? ' · 当前 ' + visible.length : '');
      }
    }

    if (search) {
      search.addEventListener('input', function () {
        q = search.value;
        saveUserIndexState();
        renderUserIndex();
      }, { signal: ac.signal });
    }

    var newFolderBtn = $('#bgm-idx-ui-new-folder', toolbar);
    if (newFolderBtn) {
      newFolderBtn.addEventListener('click', function () {
        createFolder(null);
      }, { signal: ac.signal });
    }
    var multiBtn = $('#bgm-idx-ui-multi', toolbar);
    if (multiBtn) {
      multiBtn.addEventListener('click', enterMulti, { signal: ac.signal });
    }
    var sortBtn = $('#bgm-idx-ui-sort', toolbar);
    if (sortBtn) {
      sortBtn.addEventListener('click', enterSortPick, { signal: ac.signal });
    }
    document.addEventListener('click', function (e) {
      if (!openMenu) return;
      if (openMenu.contains(e.target)) return;
      if (closest(e.target, '.bgm-idx-ui-file-btn')) return;
      closeFolderMenu();
    }, { signal: ac.signal });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (sortPick) {
          sortPick = false;
          sortPicked = [];
          renderUserIndex();
          return;
        }
        if (multi) {
          exitMulti();
          return;
        }
        if (selecting) {
          selecting = false;
          selected.clear();
          renderUserIndex();
          return;
        }
        if (activeFolder) {
          activeFolder = null;
          renderUserIndex();
          return;
        }
        return;
      }
      if (e.key !== '/') return;
      var t = e.target;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      e.preventDefault();
      if (search) search.focus();
    }, { signal: ac.signal });
    renderUserIndex();

    window.__BGM_IDX_READER_DESTROY__ = function () {
      try { ac.abort(); } catch (e) {}
      closeFolderMenu();
      toolbar.remove();
      if (folderArea) folderArea.remove();
      if (sectionHead) sectionHead.remove();
      $$('.bgm-idx-ui-year, .bgm-idx-ui-folder, .bgm-idx-ui-menu', list).forEach(function (el) { el.remove(); });
      $$('.bgm-idx-ui-menu').forEach(function (el) { el.remove(); });
      items.forEach(function (li) {
        li.hidden = false;
        $$('.bgm-idx-ui-file-btn, .bgm-idx-ui-select', li).forEach(function (el) { el.remove(); });
        Object.keys(li.dataset).forEach(function (k) {
          if (k.indexOf('ui') === 0) delete li.dataset[k];
        });
      });
      activeFolder = null;
      selecting = false;
      selected.clear();
      var style = document.getElementById('bgm-idx-style');
      if (style) style.remove();
      document.documentElement.classList.remove('bgm-idx-ready');
      delete window.__BGM_IDX_READER__;
      delete window.__BGM_IDX_READER_DESTROY__;
    };
  }

  function bootSubject() {
    var subjectId = (location.pathname.match(/^\/subject\/(\d+)/) || [])[1];
    if (!subjectId) return;
    var username = currentUsername();
    if (!username) return;
    injectStyle();
    document.documentElement.classList.add('bgm-idx-ready');

    var dialog = null;
    var directories = [];
    var loading = false;
    var dirFolders = [];
    var dirAssign = {};
    var selectedDirs = new Set();
    var collapsedFolders = new Set();
    var visibleDirs = [];
    try {
      var starPrefs = loadCloudPrefs() || {};
      var savedCollapsed = starPrefs.starCollapsed;
      if (!Array.isArray(savedCollapsed)) {
        try {
          savedCollapsed = JSON.parse(localStorage.getItem('bgm-index-reader:star-collapsed:v1') || '[]');
        } catch (e) {
          savedCollapsed = [];
        }
        if (Array.isArray(savedCollapsed) && savedCollapsed.length) {
          saveCloudPrefs({ starCollapsed: savedCollapsed });
        }
      }
      if (Array.isArray(savedCollapsed)) collapsedFolders = new Set(savedCollapsed);
    } catch (e) {}
    var syncedIndex = loadUserIndexFolders();
    dirFolders = syncedIndex.folders.filter(function (f) {
      return f && f.id && f.name;
    });
    dirAssign = syncedIndex.assign;

    var starBtn = document.createElement('button');
    starBtn.type = 'button';
    starBtn.id = 'bgm-idx-star-btn';
    starBtn.className = 'bgm-idx-star-btn';
    starBtn.title = '收录到我的目录';
    starBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.2 1 5.9-5.2-2.7-5.2 2.7 1-5.9-4.3-4.2 5.9-.9z"/></svg>';
    starBtn.setAttribute('aria-label', '收录到我的目录');
    var anchor = document.getElementById('subject_summary') || document.querySelector('.subject_summary');
    var editLink = null;
    var candidates = document.querySelectorAll('a');
    for (var ci = 0; ci < candidates.length; ci++) {
      if (/^(修改|修改收藏|编辑)$/.test(text(candidates[ci]))) {
        editLink = candidates[ci];
        break;
      }
    }
    var deleteLink = null;
    if (editLink && editLink.parentNode) {
      var row = editLink.parentNode;
      var scopes = [row, row.parentNode];
      for (var si = 0; si < scopes.length && !deleteLink; si++) {
        var sc = scopes[si];
        if (!sc || !sc.querySelectorAll) continue;
        var rowLinks = sc.querySelectorAll('a');
        for (var di = 0; di < rowLinks.length; di++) {
          if (/^删除$/.test(text(rowLinks[di]))) {
            deleteLink = rowLinks[di];
            break;
          }
        }
      }
    }
    var interestPanel = document.getElementById('panelInterestWrapper');
    var interestHeading = interestPanel ? interestPanel.querySelector('h2') : null;
    if (interestHeading) {
      interestHeading.appendChild(starBtn);
      starBtn.classList.add('is-inline');
    } else if (deleteLink && deleteLink.parentNode) {
      deleteLink.parentNode.insertBefore(starBtn, deleteLink.nextSibling);
      starBtn.classList.add('is-inline');
    } else if (editLink && editLink.parentNode) {
      editLink.parentNode.appendChild(starBtn);
      starBtn.classList.add('is-inline');
    } else if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(starBtn, anchor.nextSibling);
    } else {
      starBtn.classList.add('is-float');
      document.body.appendChild(starBtn);
    }

    function toast(text) {
      var msg = dialog && dialog.querySelector('.bgm-idx-star-msg');
      if (msg) {
        msg.textContent = text || '';
        return;
      }
      var t = document.createElement('div');
      t.className = 'bgm-idx-star-toast';
      t.textContent = text || '';
      document.body.appendChild(t);
      setTimeout(function () { t.remove(); }, 2200);
    }

    function closeDialog() {
      if (dialog) {
        dialog.remove();
        dialog = null;
      }
      selectedDirs.clear();
    }

    function renderDirectories() {
      if (!dialog) return;
      var list = dialog.querySelector('.bgm-idx-star-list');
      if (!list) return;
      var q = normalizeSearch(dialog.querySelector('#bgm-idx-star-q').value || '');
      var filtered = directories.filter(function (d) {
        return !q || normalizeSearch(d.title).indexOf(q) >= 0;
      });
      visibleDirs = filtered;
      list.innerHTML = '';
      if (!directories.length) {
        list.innerHTML = '<div class="bgm-idx-star-tip">没有找到你创建的目录</div>';
        updateStarFooter();
        return;
      }
      if (!filtered.length) {
        list.innerHTML = '<div class="bgm-idx-star-tip">没有匹配的目录</div>';
        updateStarFooter();
        return;
      }
      function folderOf(d) {
        return dirAssign[d.id] || '';
      }
      function renderGroup(name, groupId, groupItems, collapsible) {
        if (!groupItems.length) return;
        var group = document.createElement('div');
        group.className = 'bgm-idx-star-group';
        var head = document.createElement('button');
        head.type = 'button';
        head.className = 'bgm-idx-star-group-head';
        if (collapsible && collapsedFolders.has(groupId)) head.classList.add('is-collapsed');
        var caret = document.createElement('span');
        caret.className = 'bgm-idx-star-caret';
        caret.textContent = collapsible ? (collapsedFolders.has(groupId) ? '▸' : '▾') : '';
        var label = document.createElement('span');
        label.className = 'bgm-idx-star-group-name';
        label.textContent = name;
        var count = document.createElement('span');
        count.className = 'bgm-idx-star-group-count';
        count.textContent = groupItems.length;
        head.appendChild(caret);
        head.appendChild(label);
        head.appendChild(count);
        if (collapsible) {
          head.addEventListener('click', function () {
            if (collapsedFolders.has(groupId)) collapsedFolders.delete(groupId);
            else collapsedFolders.add(groupId);
            try {
              localStorage.setItem('bgm-index-reader:star-collapsed:v1', JSON.stringify(Array.from(collapsedFolders)));
            } catch (e) {}
            saveCloudPrefs({ starCollapsed: Array.from(collapsedFolders) });
            renderDirectories();
          }, { signal: ac.signal });
        } else {
          head.disabled = true;
        }
        group.appendChild(head);
        if (!collapsible || !collapsedFolders.has(groupId)) {
          groupItems.forEach(function (d) {
            var row = document.createElement('button');
            row.type = 'button';
            row.className = 'bgm-idx-star-item';
            if (selectedDirs.has(d.id)) row.classList.add('is-selected');
            var check = document.createElement('span');
            check.className = 'bgm-idx-star-check';
            var name = document.createElement('span');
            name.className = 'bgm-idx-star-item-name';
            name.textContent = d.title;
            var countText = document.createElement('span');
            countText.className = 'bgm-idx-star-item-count';
            countText.textContent = d.count ? d.count + ' 个' : '';
            row.appendChild(check);
            row.appendChild(name);
            row.appendChild(countText);
            row.addEventListener('click', function () {
              if (selectedDirs.has(d.id)) selectedDirs.delete(d.id);
              else selectedDirs.add(d.id);
              renderDirectories();
            }, { signal: ac.signal });
            group.appendChild(row);
          });
        }
        list.appendChild(group);
      }
      if (dirFolders.length) {
        dirFolders.forEach(function (f) {
          renderGroup(f.name, f.id, filtered.filter(function (d) {
            return folderOf(d) === f.id;
          }), true);
        });
        var loose = filtered.filter(function (d) {
          return !dirFolders.some(function (f) { return f.id === folderOf(d); });
        });
        renderGroup('未归档', '__loose__', loose, true);
      } else {
        renderGroup('全部目录', '__all__', filtered, false);
      }
      updateStarFooter();
    }

    function updateStarFooter() {
      if (!dialog) return;
      var label = dialog.querySelector('#bgm-idx-star-selected');
      var submit = dialog.querySelector('#bgm-idx-star-submit');
      var all = dialog.querySelector('#bgm-idx-star-all');
      if (label) label.textContent = '已选 ' + selectedDirs.size;
      if (submit) {
        submit.disabled = !selectedDirs.size || loading;
        submit.textContent = selectedDirs.size ? '收录（' + selectedDirs.size + '）' : '收录';
      }
      if (all) {
        var allVisible = visibleDirs.length > 0;
        var allSelected = allVisible && visibleDirs.every(function (d) { return selectedDirs.has(d.id); });
        all.textContent = allSelected ? '清空' : '全选';
      }
    }

    function toggleAllVisible() {
      var allSelected = visibleDirs.length > 0 && visibleDirs.every(function (d) { return selectedDirs.has(d.id); });
      if (allSelected) {
        visibleDirs.forEach(function (d) { selectedDirs.delete(d.id); });
      } else {
        visibleDirs.forEach(function (d) { selectedDirs.add(d.id); });
      }
      renderDirectories();
    }

function addToIndex(indexId) {
      var dir = null;
      for (var di = 0; di < directories.length; di++) {
        if (directories[di].id === indexId) {
          dir = directories[di];
          break;
        }
      }
      if (dir && dir.url) {
        return window.fetch(dir.url, { credentials: 'include' }).then(function (res) {
          if (!res.ok) throw new Error('http ' + res.status);
          if (res.redirected && /\/login/.test(res.url)) throw new Error('login');
        });
      }
      return window.fetch('/index/' + indexId, { credentials: 'include' })
        .then(function (res) { return res.text(); })
        .then(function (html) {
          var doc = new DOMParser().parseFromString(html, 'text/html');
          var form = doc.querySelector('#newIndexRelated form') || doc.querySelector('form[action*="/index/related"]');
          var action = '/index/related/add';
          var method = 'POST';
          var data = new FormData();
          var subjectField = 'related_subject[]';
          if (form) {
            action = form.getAttribute('action') || action;
            method = (form.getAttribute('method') || 'POST').toUpperCase();
            Array.prototype.forEach.call(form.elements, function (el) {
              if (!el.name || el.disabled) return;
              if (/^(submit|button|reset|file)$/.test(el.type)) return;
              if ((el.type === 'checkbox' || el.type === 'radio') && !el.checked) return;
              if (el.name === 'related_subject[]' || el.name === 'related_subject') {
                subjectField = el.name;
                return;
              }
              data.append(el.name, el.value);
            });
            if (!data.get('index_id')) data.append('index_id', indexId);
            data.set(subjectField, subjectId);
          } else {
            var erase = doc.querySelector('a.erase_idx_rlt[href*="gh="]');
            var gh = erase ? /[?&]gh=([^&]+)/.exec(erase.getAttribute('href') || '') : null;
            data.append('index_id', indexId);
            data.append('related_subject[]', subjectId);
            if (gh) data.append('gh', decodeURIComponent(gh[1]));
          }
          return window.fetch(action, {
            method: method,
            body: data,
            credentials: 'include',
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
          });
        })
        .then(function (res) {
          if (!res.ok) throw new Error('http ' + res.status);
          if (res.redirected && /\/login/.test(res.url)) throw new Error('login');
        });
    }

    function submitSelected() {
      if (loading || !selectedDirs.size) return;
      loading = true;
      updateStarFooter();
      toast('正在收录…');
      var ids = Array.from(selectedDirs);
      var ok = 0;
      var fail = 0;
      (function next() {
        if (!ids.length) {
          loading = false;
          updateStarFooter();
          if (ok > 0) {
            starBtn.classList.add('is-done');
            if (fail) {
              toast('成功 ' + ok + ' 个，失败 ' + fail + ' 个');
            } else {
              toast('已收录到 ' + ok + ' 个目录');
              setTimeout(closeDialog, 900);
            }
          } else {
            toast('添加失败，请稍后重试');
          }
          return;
        }
        var id = ids.shift();
        addToIndex(id).then(function () {
          ok++;
          next();
        }, function () {
          fail++;
          next();
        });
      })();
    }
              function openDialog() {
      if (dialog) return;
      var synced = loadUserIndexFolders();
      dirFolders = synced.folders.filter(function (f) {
        return f && f.id && f.name;
      });
      dirAssign = synced.assign;
      var starPrefsNow = loadCloudPrefs() || {};
      if (Array.isArray(starPrefsNow.starCollapsed)) {
        collapsedFolders = new Set(starPrefsNow.starCollapsed);
      }
      selectedDirs.clear();
      dialog = document.createElement('div');
      dialog.className = 'bgm-idx-star-mask';
      dialog.innerHTML = `
        <div class="bgm-idx-star-panel" role="dialog" aria-label="收录到目录">
          <div class="bgm-idx-star-head">
            <span>收录到目录</span>
            <button type="button" class="bgm-idx-star-close" aria-label="关闭">×</button>
          </div>
          <input id="bgm-idx-star-q" class="bgm-idx-star-search" type="search" placeholder="搜索目录名称…" autocomplete="off">
          <div class="bgm-idx-star-list"><div class="bgm-idx-star-tip">加载中…</div></div>
          <div class="bgm-idx-star-foot">
            <span id="bgm-idx-star-selected">已选 0</span>
            <span class="bgm-idx-star-foot-actions">
              <button type="button" id="bgm-idx-star-all" class="bgm-idx-star-mini">全选</button>
              <button type="button" id="bgm-idx-star-submit" class="bgm-idx-star-submit" disabled>收录</button>
            </span>
          </div>
          <div class="bgm-idx-star-msg" aria-live="polite"></div>
        </div>
      `;
      document.body.appendChild(dialog);
      var q = dialog.querySelector('#bgm-idx-star-q');
      var close = dialog.querySelector('.bgm-idx-star-close');
      var allBtn = dialog.querySelector('#bgm-idx-star-all');
      var submitBtn = dialog.querySelector('#bgm-idx-star-submit');
      q.addEventListener('input', renderDirectories, { signal: ac.signal });
      close.addEventListener('click', closeDialog, { signal: ac.signal });
      allBtn.addEventListener('click', toggleAllVisible, { signal: ac.signal });
      submitBtn.addEventListener('click', submitSelected, { signal: ac.signal });
      updateStarFooter();
      dialog.addEventListener('click', function (e) {
        if (e.target === dialog) closeDialog();
      }, { signal: ac.signal });
      if (directories.length) {
        renderDirectories();
      } else {
        var userUrl = '/user/' + encodeURIComponent(username) + '/index';
        var addUrl = userUrl + '?ajax=1&add_related=' + encodeURIComponent(subjectId) + '&related_cat=0&keepThis=false';
        Promise.all([
          window.fetch(userUrl, { credentials: 'include' }).then(function (r) { return r.text(); }).catch(function () { return ''; }),
          window.fetch(addUrl, { credentials: 'include' }).then(function (r) { return r.text(); }).catch(function () { return ''; })
        ]).then(function (results) {
          var userDoc = new DOMParser().parseFromString(results[0], 'text/html');
          var addDoc = new DOMParser().parseFromString(results[1], 'text/html');
          var urlById = {};
          addDoc.querySelectorAll('a[href*="add_related="]').forEach(function (a) {
            var href = a.getAttribute('href') || '';
            var m = /\/index\/(\d+)\/add_related/.exec(href);
            if (m) urlById[m[1]] = href;
          });
          var seen = {};
          userDoc.querySelectorAll('li.index-item a.l[href^="/index/"]').forEach(function (a) {
            var m = /\/index\/(\d+)/.exec(a.getAttribute('href') || '');
            if (!m || seen[m[1]]) return;
            seen[m[1]] = 1;
            var li = a.closest('li');
            var num = li ? li.querySelector('.stats .num') : null;
            directories.push({
              id: m[1],
              title: a.textContent.trim(),
              count: num ? num.textContent.trim() : '',
              url: urlById[m[1]] || ''
            });
          });
          if (!directories.length) {
            addDoc.querySelectorAll('a[href*="add_related="]').forEach(function (a) {
              var href = a.getAttribute('href') || '';
              var m = /\/index\/(\d+)\/add_related/.exec(href);
              if (!m || seen[m[1]]) return;
              seen[m[1]] = 1;
              directories.push({
                id: m[1],
                title: a.textContent.trim(),
                count: '',
                url: href
              });
            });
          }
          renderDirectories();
        }).catch(function () {
          var list = dialog && dialog.querySelector('.bgm-idx-star-list');
          if (list) list.innerHTML = '<div class="bgm-idx-star-tip">目录加载失败</div>';
        });
      }
    }

    starBtn.addEventListener('click', openDialog, { signal: ac.signal });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeDialog();
    }, { signal: ac.signal });
    window.__BGM_IDX_READER_DESTROY__ = function () {
      try { ac.abort(); } catch (e) {}
      closeDialog();
      starBtn.remove();
      var style = document.getElementById('bgm-idx-style');
      if (style) style.remove();
      document.documentElement.classList.remove('bgm-idx-ready');
      delete window.__BGM_IDX_READER__;
      delete window.__BGM_IDX_READER_DESTROY__;
    };
  }

  function collectionPageCount() {
    var pageInner = $('.page_inner');
    if (!pageInner) return 1;
    var max = 1;
    $$('a[href*="page="]', pageInner).forEach(function (a) {
      var m = /[?&]page=(\d+)/.exec(a.getAttribute('href') || '');
      if (m) max = Math.max(max, parseInt(m[1], 10));
    });
    var current = $('.p_cur', pageInner);
    if (current) {
      var n = parseInt(text(current).trim(), 10);
      if (!isNaN(n)) max = Math.max(max, n);
    }
    return max;
  }

  function parseCollectionPageHtml(html) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var ul = doc.querySelector('#browserItemList');
    var items = [];
    if (ul) {
      Array.prototype.slice.call(ul.children).forEach(function (el) {
        if (el.classList && el.classList.contains('item')) {
          items.push(document.importNode(el, true));
        }
      });
    }
    return items;
  }

  function getCollectionPageItems(pageNumber) {
    if (collectionPageCache[pageNumber]) return Promise.resolve(collectionPageCache[pageNumber]);
    if (collectionPagePromises[pageNumber]) return collectionPagePromises[pageNumber];
    var cacheKey = 'bgm-idx-collection-page:' + encodeURIComponent(collectionBaseUrl || location.href) + '#' + pageNumber;
    try {
      var stored = JSON.parse(sessionStorage.getItem(cacheKey) || 'null');
      if (stored && stored.html && Date.now() - stored.ts < 30 * 60 * 1000) {
        var cachedItems = parseCollectionPageHtml(stored.html);
        collectionPageCache[pageNumber] = cachedItems;
        return Promise.resolve(cachedItems);
      }
    } catch (e) {}
    var u = new URL(collectionBaseUrl || location.href);
    u.searchParams.delete('page');
    if (pageNumber > 1) u.searchParams.set('page', String(pageNumber));
    var promise = window.fetch(u.href, { credentials: 'include' }).then(function (res) {
      if (!res.ok) throw new Error('http ' + res.status);
      return res.text();
    }).then(function (html) {
      try { sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), html: html })); } catch (e) {}
      var items = parseCollectionPageHtml(html);
      collectionPageCache[pageNumber] = items;
      return items;
    }).catch(function (err) {
      delete collectionPagePromises[pageNumber];
      throw err;
    });
    collectionPagePromises[pageNumber] = promise;
    return promise;
  }

  function prefetchCollectionPages() {
    if (!isCollectionPage || collectionPrefetchStarted) return;
    collectionPrefetchStarted = true;
    var total = collectionPageCount();
    if (total <= 1) return;
    var chain = Promise.resolve();
    for (var pi = 1; pi <= total; pi++) {
      (function (pageNumber) {
        chain = chain.then(function () {
          return new Promise(function (resolve) { setTimeout(resolve, 80); });
        }).then(function () {
          return getCollectionPageItems(pageNumber).catch(function () {});
        });
      })(pi);
    }
  }

  function collectionSubjectType() {
    var m = /^\/(anime|book|music|game|real)\//.exec(location.pathname);
    var map = { anime: 2, book: 1, music: 3, game: 4, real: 6 };
    return m ? map[m[1]] : 0;
  }

  function applyCollectionBulk(force) {
    if (!isCollectionPage || !collectionBulkMap || !Object.keys(collectionBulkMap).length) return;
    var viewer = currentUsername();
    var own = !!owner && owner === viewer;
    getItems().forEach(function (li) {
      var id = subjectId(li);
      var d = id && collectionBulkMap[id];
      if (!d) return;
      li.dataset.bgmRatingBulk = '1';
      li.dataset.bgmNameLoaded = '1';
      delete li.dataset.bgmRatingPending;
      delete li.dataset.bgmRatingFailed;
      if (isCollectionPage) {
        var score = own ? d.score : (d.rate > 0 ? d.rate : 0);
        if (score > 0) {
          li.dataset.bgmScore = String(score);
          delete li.dataset.bgmRatingNone;
        } else {
          li.dataset.bgmScore = '';
          li.dataset.bgmRatingNone = '1';
        }
        li.dataset.bgmCount = own && score > 0 && d.collectionTotal ? String(d.collectionTotal) : '';
        applySubjectName(li, { name: d.name, nameCn: d.nameCn });
        renderScore(li);
        return;
      }
      if (d.score > 0) {
        li.dataset.bgmScore = String(d.score);
        li.dataset.bgmCount = d.collectionTotal ? String(d.collectionTotal) : '';
        if (d.rank) li.dataset.bgmRank = String(d.rank);
        delete li.dataset.bgmRatingNone;
      } else {
        li.dataset.bgmScore = '';
        li.dataset.bgmCount = '';
        li.dataset.bgmRatingNone = '1';
      }
      applySubjectName(li, { name: d.name, nameCn: d.nameCn });
      if (own) {
        if (d.rate > 0) {
          li.dataset.bgmMyRate = String(d.rate);
          delete li.dataset.bgmMyRateNone;
        } else {
          delete li.dataset.bgmMyRate;
          li.dataset.bgmMyRateNone = '1';
        }
        var stateMap = { 1: 'wish', 2: 'done', 3: 'doing', 4: 'onhold', 5: 'dropped' };
        li.dataset.bgmState = d.type > 0 ? (stateMap[d.type] || 'none') : 'none';
        renderStateBadge(li);
      }
      renderScore(li);
    });
    if (booted && (force || collectionBulkLoaded)) applyWithFlip(false);
  }

  function loadCollectionBulk() {
    if (!isCollectionPage || collectionBulkLoaded || collectionBulkPromise) return;
    var subjectType = collectionSubjectType();
    if (!owner || !subjectType || !window.fetch) return;
    var cacheKey = 'bgm-idx-collection-bulk-v2:' + owner + ':' + subjectType;
    try {
      var cached = JSON.parse(sessionStorage.getItem(cacheKey) || 'null');
      if (cached && cached.ts && Date.now() - cached.ts < 30 * 60 * 1000 && cached.map) {
        collectionBulkMap = cached.map;
        collectionBulkLoaded = true;
        applyCollectionBulk();
        return;
      }
    } catch (e) {}
    collectionBulkPromise = (function () {
      var limit = 100;
      var offset = 0;
      var map = {};
      function fetchNext() {
        var url = 'https://api.bgm.tv/v0/users/' + encodeURIComponent(owner) +
          '/collections?subject_type=' + subjectType + '&type=0&limit=' + limit + '&offset=' + offset;
        return window.fetch(url, { credentials: 'omit' }).then(function (res) {
          if (!res.ok) throw new Error('bulk http ' + res.status);
          return res.json();
        }).then(function (data) {
          var rows = data && data.data ? data.data : [];
          rows.forEach(function (item) {
            var subject = item && item.subject ? item.subject : null;
            if (!subject || !subject.id) return;
            map[subject.id] = {
              score: subject.score || 0,
              rank: subject.rank || 0,
              name: subject.name || '',
              nameCn: subject.name_cn || '',
              image: subject.images && (subject.images.large || subject.images.medium || subject.images.grid) || '',
              date: subject.date || '',
              collectionTotal: subject.collection_total || 0,
              rate: item.rate || 0,
              type: item.type || 0
            };
          });
          offset += limit;
          var total = data && typeof data.total === 'number' ? data.total : offset;
          if (rows.length) {
            collectionBulkMap = map;
            applyCollectionBulk(false);
          }
          if (offset < total && rows.length) return fetchNext();
          collectionBulkMap = map;
          collectionBulkLoaded = true;
          try { sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), map: map })); } catch (e) {}
          applyCollectionBulk(true);
        });
      }
      return fetchNext();
    })();
    collectionBulkPromise.catch(function () {
      collectionBulkPromise = null;
      collectionBulkFailed = true;
      if (booted) applyWithFlip(false);
    });
  }

  function collectionChunkPages() {
    var sitePages = collectionPageCount();
    var siteSize = collectionSiteSize || 24;
    return Math.max(1, Math.ceil(sitePages * siteSize / collectionPageSize));
  }

  function loadCollectionChunk(targetPage) {
    if (!isCollectionPage || collectionChunkLoading) return;
    var pagesTotal = collectionChunkPages();
    targetPage = Math.max(1, Math.min(pagesTotal, targetPage));
    var start = (targetPage - 1) * collectionPageSize;
    var end = start + collectionPageSize;
    var siteSize = collectionSiteSize || 24;
    var siteStart = Math.floor(start / siteSize) + 1;
    var siteEnd = Math.ceil(end / siteSize);
    var promises = [];
    for (var n = siteStart; n <= siteEnd; n++) promises.push(getCollectionPageItems(n));
    collectionChunkLoading = true;
    Promise.all(promises).then(function (results) {
      var flat = [];
      results.forEach(function (arr) {
        if (arr && arr.length) flat = flat.concat(arr);
      });
      var offset = start - (siteStart - 1) * siteSize;
      var chunk = flat.slice(offset, offset + collectionPageSize);
      if (!chunk.length) {
        collectionChunkLoading = false;
        if (targetPage > 1) {
          page = targetPage - 1;
          applyState();
        }
        return;
      }
      var frag = document.createDocumentFragment();
      chunk.forEach(function (li) { frag.appendChild(li.cloneNode(true)); });
      getItems().forEach(function (li) { li.remove(); });
      list.appendChild(frag);
      page = targetPage;
      getItems().forEach(function (li, idx) {
        li.dataset.bgmIndex = String(idx);
        parseItem(li);
      });
      applyCollectionBulk();
      fadeCovers(list);
      applyState();
      collectionChunkLoading = false;
      if (targetPage > 1) scrollListTop();
    }).catch(function () {
      collectionChunkLoading = false;
    });
  }

  function collectionInfiniteFill(min, done) {
    var total = collectionPageCount();
    if (collectionInfiniteBuffer.length >= min || collectionNextSitePage > total) {
      done();
      return;
    }
    var sitePage = collectionNextSitePage++;
    getCollectionPageItems(sitePage).then(function (items) {
      if (items && items.length) collectionInfiniteBuffer = collectionInfiniteBuffer.concat(items);
      collectionInfiniteFill(min, done);
    }).catch(function () {
      collectionInfiniteFill(min, done);
    });
  }

  function collectionInfiniteAppendChunk(done) {
    if (!isCollectionPage || collectionPageSize !== 0 || collectionSearchMode || collectionInfiniteLoading) return;
    collectionInfiniteLoading = true;
    collectionInfiniteFill(30, function () {
      var chunk = collectionInfiniteBuffer.splice(0, 30);
      if (!chunk.length) {
        collectionInfiniteLoading = false;
        if (done) done();
        return;
      }
      var frag = document.createDocumentFragment();
      var added = [];
      chunk.forEach(function (li) {
        var node = li.cloneNode(true);
        frag.appendChild(node);
        added.push(node);
      });
      list.appendChild(frag);
      var baseIndex = getItems().length - added.length;
      added.forEach(function (li, idx) {
        li.dataset.bgmIndex = String(baseIndex + idx);
        parseItem(li);
      });
      collectionInfiniteRendered += added.length;
      applyCollectionBulk();
      fadeCovers(list);
      if (state.q || state.state !== 'all' || state.score !== 'all') {
        applyState();
      }
      queueMissingRatings(added);
      queueMyRatings(added);
      collectionInfiniteLoading = false;
      if (done) setTimeout(done, 120);
    });
  }

  function collectionMaybeLoadMore() {
    if (!isCollectionPage || collectionPageSize !== 0 || collectionSearchMode || collectionInfiniteLoading) return;
    if (collectionNextSitePage > collectionPageCount() && !collectionInfiniteBuffer.length) return;
    var bottom = list.getBoundingClientRect().bottom;
    if (bottom < window.innerHeight + 700) {
      collectionInfiniteAppendChunk(collectionMaybeLoadMore);
    }
  }

  function enterCollectionInfinite() {
    collectionInfinite = true;
    collectionSearchMode = false;
    page = 1;
    collectionNextSitePage = 1;
    collectionInfiniteBuffer = [];
    collectionInfiniteRendered = 0;
    collectionInfiniteLoading = false;
    if (pager) pager.hidden = true;
    getItems().forEach(function (li) { li.remove(); });
    collectionInfiniteAppendChunk(collectionMaybeLoadMore);
  }

  function collectionStatusType() {
    var map = { wish: 1, collect: 2, do: 3, doing: 3, on_hold: 4, dropped: 5 };
    return map[collectionStatus] || 0;
  }

  function buildCollectionResultCard(id, d) {
    var li = document.createElement('li');
    li.className = 'item';
    li.id = 'item_' + id;
    var cover = document.createElement('a');
    cover.className = 'subjectCover cover ll coverPortrait';
    cover.href = '/subject/' + id;
    var imageWrap = document.createElement('span');
    imageWrap.className = 'image';
    var img = document.createElement('img');
    img.className = 'cover';
    img.setAttribute('src', d.image || '');
    img.setAttribute('alt', d.nameCn || d.name || '');
    img.setAttribute('loading', 'lazy');
    imageWrap.appendChild(img);
    cover.appendChild(imageWrap);
    var inner = document.createElement('div');
    inner.className = 'inner';
    var h3 = document.createElement('h3');
    var link = document.createElement('a');
    link.className = 'l';
    link.href = '/subject/' + id;
    link.textContent = d.nameCn || d.name || '';
    h3.appendChild(link);
    if (d.nameCn && d.name) {
      var small = document.createElement('small');
      small.className = 'grey';
      small.textContent = d.name;
      h3.appendChild(small);
    }
    var info = document.createElement('p');
    info.className = 'info tip';
    info.textContent = d.date || '';
    inner.appendChild(h3);
    inner.appendChild(info);
    li.appendChild(cover);
    li.appendChild(inner);
    return li;
  }

  function exitCollectionSearch() {
    collectionSearchMode = false;
    if (collectionPageSize === 0) {
      enterCollectionInfinite();
    } else {
      page = collectionSearchPrevPage || 1;
      loadCollectionChunk(page);
    }
  }

  function renderCollectionSearch(q) {
    if (!isCollectionPage) {
      page = 1;
      applyWithFlip(false);
      return;
    }
    if (!collectionBulkLoaded && !collectionBulkFailed) {
      loadCollectionBulk();
      if (collectionBulkPromise) {
        collectionBulkPromise.then(function () {
          if (state.q.trim()) renderCollectionSearch(state.q);
        }, function () {
          if (state.q.trim()) {
            page = 1;
            applyWithFlip(false);
          }
        });
      }
      return;
    }
    if (collectionBulkFailed) {
      page = 1;
      applyWithFlip(false);
      return;
    }
    var tokens = String(q || '').toLowerCase().split(/[\s\u3000]+/).filter(Boolean).map(normalizeSearch);
    if (!tokens.length) {
      if (collectionSearchMode) exitCollectionSearch();
      return;
    }
    if (!collectionSearchMode) {
      collectionSearchPrevPage = page;
      collectionSearchMode = true;
    }
    var statusType = collectionStatusType();
    var frag = document.createDocumentFragment();
    var matched = 0;
    Object.keys(collectionBulkMap).forEach(function (id) {
      var d = collectionBulkMap[id];
      if (!d) return;
      if (statusType && d.type !== statusType) return;
      var hay = normalizeSearch((d.name || '') + ' ' + (d.nameCn || ''));
      for (var i = 0; i < tokens.length; i++) {
        if (hay.indexOf(tokens[i]) < 0) return;
      }
      frag.appendChild(buildCollectionResultCard(id, d));
      matched++;
    });
    getItems().forEach(function (li) { li.remove(); });
    list.appendChild(frag);
    getItems().forEach(function (li, idx) {
      li.dataset.bgmIndex = String(idx);
      parseItem(li);
    });
    if (pager) pager.hidden = true;
    applyCollectionBulk();
    applyState();
  }

  function ensureAllCollectionPages() {
    if (!isCollectionPage || collectionAllLoaded) return Promise.resolve(true);
    if (collectionLoadPromise) return collectionLoadPromise;
    var total = collectionPageCount();
    if (total <= 1) {
      collectionAllLoaded = true;
      return Promise.resolve(true);
    }
    collectionLoading = true;
    if (statsEl) statsEl.textContent = '加载全部收藏… 0/' + total;
    var parts = new Array(total);
    var loaded = 0;
    var nextPage = 1;
    function pageWorker() {
      if (nextPage > total) return Promise.resolve();
      var pageNumber = nextPage++;
      return getCollectionPageItems(pageNumber).then(function (items) {
        parts[pageNumber - 1] = items;
        loaded++;
        if (statsEl) statsEl.textContent = '加载全部收藏… ' + loaded + '/' + total;
        return pageWorker();
      });
    }
    collectionLoadPromise = Promise.all([pageWorker(), pageWorker(), pageWorker()]).then(function () {
      var flat = [];
      parts.forEach(function (arr) {
        if (arr && arr.length) flat = flat.concat(arr);
      });
      if (!flat.length) throw new Error('empty');
      getItems().forEach(function (li) { li.remove(); });
      var frag = document.createDocumentFragment();
      flat.forEach(function (li) { frag.appendChild(li); });
      list.appendChild(frag);
      var multi = document.getElementById('multipage');
      if (multi) multi.style.display = 'none';
      collectionAllLoaded = true;
      collectionLoading = false;
      collectionLoadPromise = null;
      collectionPageCache = {};
      collectionPagePromises = {};
      getItems().forEach(function (li, idx) {
        li.dataset.bgmIndex = String(idx);
        parseItem(li);
      });
      var typeSet = {};
      getItems().forEach(function (li) {
        if (li.dataset.bgmType) typeSet[li.dataset.bgmType] = 1;
      });
      mixedTypes = Object.keys(typeSet).length > 1;
      applyCollectionBulk();
      fadeCovers(list);
      applyState();
      if (pendingCollectionSort) {
        var pendingSortKey = pendingCollectionSort;
        pendingCollectionSort = null;
        setTimeout(function () { toggleSort(pendingSortKey); }, 0);
      }
      return true;
    }).catch(function () {
      collectionLoading = false;
      collectionLoadPromise = null;
      pendingCollectionSort = null;
      if (statsEl) statsEl.textContent = '全部收藏加载失败，仅显示当前页';
      return false;
    });
    return collectionLoadPromise;
  }

  var starDirsCache = { ts: 0, dirs: [] };
  var starStateCache = {};

  function starToast(text) {
    var t = document.createElement('div');
    t.className = 'bgm-idx-star-toast';
    t.textContent = text || '';
    document.body.appendChild(t);
    setTimeout(function () {
      if (t.parentNode) t.parentNode.removeChild(t);
    }, 2200);
  }

  function starLoadDirs(username) {
    if (starDirsCache.dirs.length && Date.now() - starDirsCache.ts < 5 * 60 * 1000) {
      return Promise.resolve(starDirsCache.dirs);
    }
    return window.fetch('/user/' + encodeURIComponent(username) + '/index', { credentials: 'include' })
      .then(function (res) { return res.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var seen = {};
        var dirs = [];
        doc.querySelectorAll('li.index-item a.l[href^="/index/"]').forEach(function (a) {
          var m = /\/index\/(\d+)/.exec(a.getAttribute('href') || '');
          if (!m || seen[m[1]]) return;
          seen[m[1]] = 1;
          var li = a.closest('li');
          var num = li ? li.querySelector('.stats .num') : null;
          dirs.push({ id: m[1], title: a.textContent.trim(), count: num ? num.textContent.trim() : '' });
        });
        starDirsCache = { ts: Date.now(), dirs: dirs };
        return dirs;
      });
  }

  function starLoadAddable(username, subjectId) {
    var url = '/user/' + encodeURIComponent(username) + '/index?ajax=1&add_related=' +
      encodeURIComponent(subjectId) + '&related_cat=0&keepThis=false';
    return window.fetch(url, { credentials: 'include' })
      .then(function (res) { return res.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var map = {};
        doc.querySelectorAll('a[href*="add_related="]').forEach(function (a) {
          var href = a.getAttribute('href') || '';
          var m = /\/index\/(\d+)\/add_related/.exec(href);
          if (m) map[m[1]] = href;
        });
        return map;
      });
  }

  function starSubjectState(username, subjectId, force) {
    var key = username + ':' + subjectId;
    var cached = starStateCache[key];
    if (!force && cached && Date.now() - cached.ts < 60 * 1000) return Promise.resolve(cached);
    return Promise.all([starLoadDirs(username), starLoadAddable(username, subjectId)])
      .then(function (parts) {
        var state = { ts: Date.now(), dirs: parts[0], addable: parts[1], done: false };
        state.done = state.dirs.some(function (d) { return !state.addable[d.id]; });
        starStateCache[key] = state;
        return state;
      });
  }

  function openStarPicker(subjectIds, onDone) {
    var username = currentUsername();
    var ids = [];
    (subjectIds || []).forEach(function (id) {
      id = String(id || '');
      if (/^\d+$/.test(id) && ids.indexOf(id) < 0) ids.push(id);
    });
    if (!username || !ids.length) return;
    Promise.all(ids.map(function (id) { return starSubjectState(username, id); }))
      .then(function (states) {
        var dirs = states[0].dirs;
        if (!dirs.length) {
          starToast('还没有自己的目录，请先在 Bangumi 创建目录');
          return;
        }
        var selected = new Set();
        var loading = false;
        var syncedIndex = loadUserIndexFolders();
        var dirFolders = (syncedIndex.folders || []).filter(function (f) { return f && f.id && f.name; });
        var dirAssign = syncedIndex.assign || {};
        var collapsed = new Set();
        try {
          var prefs = loadCloudPrefs() || {};
          var savedCollapsed = prefs.starCollapsed;
          if (!Array.isArray(savedCollapsed)) {
            savedCollapsed = JSON.parse(localStorage.getItem('bgm-index-reader:star-collapsed:v1') || '[]');
          }
          if (Array.isArray(savedCollapsed)) collapsed = new Set(savedCollapsed);
        } catch (e) {}
        function persistCollapsed() {
          var arr = Array.from(collapsed);
          try {
            localStorage.setItem('bgm-index-reader:star-collapsed:v1', JSON.stringify(arr));
          } catch (e) {}
          try {
            saveCloudPrefs({ starCollapsed: arr });
          } catch (e) {}
        }
        var dialog = document.createElement('div');
        dialog.className = 'bgm-idx-star-mask';
        dialog.innerHTML = '<div class="bgm-idx-star-panel" role="dialog" aria-label="收录到目录">' +
          '<div class="bgm-idx-star-head"><span>收录到目录（' + ids.length + ' 个条目）</span>' +
          '<button type="button" class="bgm-idx-star-close" aria-label="关闭">×</button></div>' +
          '<input class="bgm-idx-star-search" type="search" placeholder="搜索目录名称…" autocomplete="off">' +
          '<div class="bgm-idx-star-list"></div>' +
          '<div class="bgm-idx-star-foot"><span class="bgm-idx-star-selected">已选 0</span>' +
          '<span class="bgm-idx-star-foot-actions"><button type="button" class="bgm-idx-star-mini">全选</button>' +
          '<button type="button" class="bgm-idx-star-submit" disabled>收录</button></span></div>' +
          '<div class="bgm-idx-star-msg" aria-live="polite"></div></div>';
        document.body.appendChild(dialog);
        var list = dialog.querySelector('.bgm-idx-star-list');
        var search = dialog.querySelector('.bgm-idx-star-search');
        var submit = dialog.querySelector('.bgm-idx-star-submit');
        var all = dialog.querySelector('.bgm-idx-star-mini');
        var selectedLabel = dialog.querySelector('.bgm-idx-star-selected');
        var msg = dialog.querySelector('.bgm-idx-star-msg');
        var q = '';
        function usable(d) {
          for (var i = 0; i < ids.length; i++) {
            if (states[i].addable[d.id]) return true;
          }
          return false;
        }
        function visibleDirs() {
          return dirs.filter(function (d) {
            return !q || normalizeSearch(d.title).indexOf(q) >= 0;
          });
        }
        function footer() {
          selectedLabel.textContent = '已选 ' + selected.size;
          submit.disabled = loading || !selected.size;
          submit.textContent = selected.size ? '收录（' + selected.size + '）' : '收录';
          var vs = visibleDirs();
          var allSelected = vs.length > 0 && vs.every(function (d) { return !usable(d) || selected.has(d.id); });
          all.textContent = allSelected ? '清空' : '全选';
        }
        function render() {
          list.innerHTML = '';
          var vs = visibleDirs();
          if (!vs.length) {
            list.innerHTML = '<div class="bgm-idx-star-tip">没有匹配的目录</div>';
            footer();
            return;
          }
          function folderOf(d) {
            return dirAssign[d.id] || '';
          }
          function makeRow(d) {
            var row = document.createElement('button');
            row.type = 'button';
            row.className = 'bgm-idx-star-item';
            if (selected.has(d.id)) row.classList.add('is-selected');
            var check = document.createElement('span');
            check.className = 'bgm-idx-star-check';
            var name = document.createElement('span');
            name.className = 'bgm-idx-star-item-name';
            name.textContent = d.title;
            var count = document.createElement('span');
            count.className = 'bgm-idx-star-item-count';
            count.textContent = d.count ? d.count + ' 个' : '';
            row.appendChild(check);
            row.appendChild(name);
            row.appendChild(count);
            if (!usable(d)) {
              row.disabled = true;
              count.textContent = '已收录';
            } else {
              row.addEventListener('click', function () {
                if (selected.has(d.id)) selected.delete(d.id);
                else selected.add(d.id);
                render();
              });
            }
            return row;
          }
          function renderGroup(groupName, groupId, groupItems, collapsible) {
            if (!groupItems.length) return;
            var group = document.createElement('div');
            group.className = 'bgm-idx-star-group';
            var head = document.createElement('button');
            head.type = 'button';
            head.className = 'bgm-idx-star-group-head';
            if (collapsible && collapsed.has(groupId)) head.classList.add('is-collapsed');
            var caret = document.createElement('span');
            caret.className = 'bgm-idx-star-caret';
            caret.textContent = collapsible ? (collapsed.has(groupId) ? '▸' : '▾') : '';
            var label = document.createElement('span');
            label.className = 'bgm-idx-star-group-name';
            label.textContent = groupName;
            var count = document.createElement('span');
            count.className = 'bgm-idx-star-group-count';
            count.textContent = groupItems.length;
            head.appendChild(caret);
            head.appendChild(label);
            head.appendChild(count);
            if (collapsible) {
              head.addEventListener('click', function () {
                if (collapsed.has(groupId)) collapsed.delete(groupId);
                else collapsed.add(groupId);
                persistCollapsed();
                render();
              });
            } else {
              head.disabled = true;
            }
            group.appendChild(head);
            if (!collapsible || !collapsed.has(groupId)) {
              groupItems.forEach(function (d) {
                group.appendChild(makeRow(d));
              });
            }
            list.appendChild(group);
          }
          if (dirFolders.length) {
            dirFolders.forEach(function (f) {
              renderGroup(f.name, f.id, vs.filter(function (d) { return folderOf(d) === f.id; }), true);
            });
            var loose = vs.filter(function (d) {
              return !dirFolders.some(function (f) { return f.id === folderOf(d); });
            });
            renderGroup('未归档', '__loose__', loose, true);
          } else {
            vs.forEach(function (d) {
              list.appendChild(makeRow(d));
            });
          }
          footer();
        }
        function close() {
          if (dialog && dialog.parentNode) dialog.parentNode.removeChild(dialog);
          dialog = null;
          document.removeEventListener('keydown', onKey);
        }
        function onKey(e) {
          if (e.key === 'Escape') close();
        }
        function submitSelected() {
          if (loading || !selected.size) return;
          var pairs = [];
          ids.forEach(function (id, i) {
            selected.forEach(function (dirId) {
              var href = states[i].addable[dirId];
              if (href) pairs.push({ subjectId: id, href: href });
            });
          });
          if (!pairs.length) {
            msg.textContent = '所选目录里都已包含这些条目';
            return;
          }
          loading = true;
          footer();
          msg.textContent = '正在收录…';
          var ok = 0;
          var fail = 0;
          (function next() {
            if (!pairs.length) {
              loading = false;
              footer();
              ids.forEach(function (id) { delete starStateCache[username + ':' + id]; });
              if (ok) {
                msg.textContent = fail ? '成功 ' + ok + ' 个，失败 ' + fail + ' 个' : '已收录 ' + ok + ' 项';
                if (typeof onDone === 'function') onDone();
                if (!fail) setTimeout(close, 900);
              } else {
                msg.textContent = '收录失败，请稍后重试';
              }
              return;
            }
            var item = pairs.shift();
            window.fetch(item.href, { credentials: 'include' }).then(function (res) {
              if (!res.ok || (res.redirected && /\/login/.test(res.url))) throw new Error('failed');
              ok++;
              next();
            }, function () {
              fail++;
              next();
            });
          })();
        }
        search.addEventListener('input', function () {
          q = normalizeSearch(search.value || '');
          render();
        });
        dialog.querySelector('.bgm-idx-star-close').addEventListener('click', close);
        dialog.addEventListener('click', function (e) { if (e.target === dialog) close(); });
        all.addEventListener('click', function () {
          var vs = visibleDirs();
          var usableVisible = vs.filter(usable);
          var allSelected = usableVisible.length > 0 && usableVisible.every(function (d) { return selected.has(d.id); });
          if (allSelected) usableVisible.forEach(function (d) { selected.delete(d.id); });
          else usableVisible.forEach(function (d) { selected.add(d.id); });
          render();
        });
        submit.addEventListener('click', submitSelected);
        document.addEventListener('keydown', onKey);
        render();
      })
      .catch(function () {
        starToast('目录加载失败，请确认已登录');
      });
  }

  function bootBrowserStars() {
    var list = document.getElementById('browserItemList');
    if (!list) return;
    var username = currentUsername();
    if (!username) return;
    var items = Array.prototype.slice.call(list.querySelectorAll(':scope > li.item'));
    if (!items.length) return;
    injectStyle();
    var queue = [];
    var active = 0;
    function pump() {
      while (active < 3 && queue.length) {
        var fn = queue.shift();
        active++;
        Promise.resolve().then(fn).then(finish, finish);
      }
    }
    function finish() {
      active--;
      pump();
    }
    function enqueue(fn) {
      queue.push(fn);
      pump();
    }
    function subjectIdOf(li) {
      var m = /^item_(\d+)/.exec(li.id || '');
      if (m) return m[1];
      var a = li.querySelector('a[href*="/subject/"]');
      var n = a ? /\/subject\/(\d+)/.exec(a.getAttribute('href') || '') : null;
      return n ? n[1] : '';
    }
    function refresh(li, id) {
      enqueue(function () {
        return starSubjectState(username, id).then(function (state) {
          var b = li.querySelector('.bgm-idx-card-star');
          if (!b) return;
          b.textContent = state.done ? '★' : '☆';
          b.classList.toggle('is-done', !!state.done);
        }).catch(function () {});
      });
    }
    items.forEach(function (li) {
      if (li.querySelector('.bgm-idx-card-star')) return;
      var id = subjectIdOf(li);
      if (!id) return;
      li.classList.add('bgm-idx-browser-item');
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'bgm-idx-card-star';
      b.title = '收录到我的目录';
      b.textContent = '☆';
      b.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        openStarPicker([id], function () {
          refresh(li, id);
        });
      }, { signal: ac.signal });
      li.appendChild(b);
      refresh(li, id);
    });
    window.__BGM_IDX_READER_DESTROY__ = function () {
      Array.prototype.forEach.call(list.querySelectorAll('.bgm-idx-card-star'), function (b) { b.remove(); });
      var style = document.getElementById('bgm-idx-style');
      if (style) style.remove();
      delete window.__BGM_IDX_READER__;
      delete window.__BGM_IDX_READER_DESTROY__;
    };
  }

  function boot() {
    if (booted) return;
    list = $(SEL.list);
    if (!list) {
      var crtList = $('.browserCrtList');
      if (crtList) {
        if (isDetailPage) crtList.classList.add('bgm-idx-crt-directory');
        bootCharacters(crtList);
        return;
      }
      delete window.__BGM_IDX_READER__;
      return;
    }
    var collectionMatch = isCollectionPage ? location.pathname.match(/^\/(anime|book|music|game|real)\/list\/([^/]+)(?:\/([a-z_]+))?\/?$/) : null;
    var ownerLink = $('.grp_box a.avatar[href^="/user/"]') || $('.grp_box a[href^="/user/"]');
    if (collectionMatch) {
      owner = decodeURIComponent(collectionMatch[2]);
      collectionStatus = collectionMatch[3] || '';
      var collectionStateMap = { wish: 'wish', doing: 'doing', collect: 'done', on_hold: 'onhold', dropped: 'dropped' };
      collectionState = collectionStateMap[collectionStatus] || '';
      collectionBaseUrl = new URL(location.href);
      collectionBaseUrl.searchParams.delete('page');
      collectionBaseUrl = collectionBaseUrl.href;
      var collectionPager = document.getElementById('multipage');
      if (collectionPager) collectionPager.style.display = 'none';
      var collectionOrderby = '';
      try { collectionOrderby = new URLSearchParams(location.search).get('orderby') || ''; } catch (e) {}
      if (state.view !== 'timeline') {
        if (collectionOrderby === 'rate') state.sort = 'score-desc';
        else if (collectionOrderby === 'date') state.sort = 'date-desc';
        else state.sort = 'default';
      }
    } else {
      owner = ownerLink ? ownerLink.getAttribute('href').split('/').filter(Boolean).pop() : '';
    }
    var viewer = currentUsername();
    showPageState = !owner || !viewer || owner === viewer;
    isOtherDirectory = !!owner && !!viewer && owner !== viewer;
    booted = true;
    document.documentElement.classList.add('bgm-idx-ready');
    list.classList.add('bgm-idx-on');
    list.classList.toggle('bgm-idx-other', isOtherDirectory);
    list.classList.toggle('bgm-idx-collection', isCollectionPage);
    injectStyle();
    buildToolbar();
    if (isCollectionPage) {
      var stateSelect = $('#bgm-idx-state', toolbar);
      if (stateSelect) {
        var stateField = stateSelect.closest('.bgm-idx-field');
        if (stateField) stateField.hidden = true;
      }
      var sortSelect = $('#bgm-idx-sort', toolbar);
      if (sortSelect) {
        var sortField = sortSelect.closest('.bgm-idx-field');
        if (sortField) sortField.hidden = false;
      }
      var countSort = $('#bgm-idx-sort-menu button[data-sort-key="count"]', toolbar);
      if (countSort) countSort.hidden = true;
      var collectionSize = $('#bgm-idx-size', toolbar);
      if (collectionSize) {

        collectionSize.value = String(collectionPageSize);
        var collectionSizeField = collectionSize.closest('.bgm-idx-field');
        if (collectionSizeField) collectionSizeField.hidden = false;
      }
      if (searchInput) searchInput.placeholder = '搜索本页收藏…';
      var toolsBar = $(SEL.toolsBar);
      var toolsFilters = toolsBar ? $('.filters', toolsBar) : null;
      if (toolsFilters) toolsFilters.style.display = 'none';
    }
    buildPager();
    buildTopButton();
    hideNativeSelector();
    getItems().forEach(function (li, i) {
      li.dataset.bgmIndex = String(i);
      parseItem(li);
    });
    var typeSet = {};
    getItems().forEach(function (li) {
      if (li.dataset.bgmType) typeSet[li.dataset.bgmType] = 1;
    });
    mixedTypes = Object.keys(typeSet).length > 1;
    updateFilterAvailability();
    fadeCovers(list);
    function setupDirectoryStars() {
      if (!isOtherDirectory || isCollectionPage) return;
      var username = currentUsername();
      if (!username) return;
      var batchBtn = document.getElementById('bgm-idx-batch-star');
      var starBar = document.getElementById('bgm-idx-star-bar');
      var note = document.getElementById('bgm-idx-star-bar-note');
      var pickBtn = document.getElementById('bgm-idx-star-bar-pick');
      var cancelBtn = document.getElementById('bgm-idx-star-bar-cancel');
      if (!batchBtn || !starBar) return;
      batchBtn.hidden = false;
      var starBatch = false;
      var starPicked = new Set();
      var queue = [];
      var active = 0;
      function pump() {
        while (active < 3 && queue.length) {
          var fn = queue.shift();
          active++;
          Promise.resolve().then(fn).then(finish, finish);
        }
      }
      function finish() {
        active--;
        pump();
      }
      function enqueue(fn) {
        queue.push(fn);
        pump();
      }
      function subjectIdOf(li) {
        return (li.id || '').replace(/^item_/, '');
      }
      function setStar(li, isDone) {
        var b = li.querySelector('.bgm-idx-card-star');
        if (!b) return;
        b.textContent = isDone ? '★' : '☆';
        b.classList.toggle('is-done', !!isDone);
      }
      function refreshStar(li, force) {
        var id = subjectIdOf(li);
        if (!id) return;
        enqueue(function () {
          return starSubjectState(username, id, force).then(function (state) {
            setStar(li, state.done);
          }).catch(function () {});
        });
      }
      function ensureStar(li) {
        if (li.querySelector('.bgm-idx-card-star')) return;
        var id = subjectIdOf(li);
        if (!id) return;
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'bgm-idx-card-star';
        b.title = '收录到我的目录';
        b.textContent = '☆';
        b.addEventListener('click', function (e) {
          if (starBatch) return;
          e.preventDefault();
          e.stopPropagation();
          openStarPicker([id], function () {
            refreshStar(li, true);
          });
        }, { signal: ac.signal });
        li.appendChild(b);
        refreshStar(li);
      }
      function updateBar() {
        list.classList.toggle('is-star-batch', starBatch);
        if (note) note.textContent = '批量收录 · 已选 ' + starPicked.size;
        if (pickBtn) pickBtn.disabled = !starPicked.size;
        getItems().forEach(function (li) {
          li.classList.toggle('is-star-picked', starPicked.has(subjectIdOf(li)));
        });
      }
      function exitBatch() {
        starBatch = false;
        starPicked.clear();
        starBar.hidden = true;
        batchBtn.textContent = '☆ 批量收录';
        updateBar();
      }
      function enterBatch() {
        starBatch = true;
        starPicked.clear();
        starBar.hidden = false;
        batchBtn.textContent = '★ 批量收录';
        updateBar();
      }
      batchBtn.addEventListener('click', function () {
        if (starBatch) exitBatch();
        else enterBatch();
      }, { signal: ac.signal });
      if (pickBtn) pickBtn.addEventListener('click', function () {
        if (!starPicked.size) return;
        var ids = Array.from(starPicked);
        openStarPicker(ids, function () {
          exitBatch();
          ids.forEach(function (id) {
            delete starStateCache[username + ':' + id];
          });
          getItems().forEach(function (li) {
            if (ids.indexOf(subjectIdOf(li)) >= 0) refreshStar(li, true);
          });
        });
      }, { signal: ac.signal });
      if (cancelBtn) cancelBtn.addEventListener('click', exitBatch, { signal: ac.signal });
      list.addEventListener('click', function (e) {
        if (!starBatch) return;
        var li = closest(e.target, 'li.item');
        if (!li || li.classList.contains('bgm-idx-group')) return;
        e.preventDefault();
        e.stopPropagation();
        var id = subjectIdOf(li);
        if (!id) return;
        if (starPicked.has(id)) starPicked.delete(id);
        else starPicked.add(id);
        updateBar();
      }, true);
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && starBatch) exitBatch();
      }, { signal: ac.signal });
      getItems().forEach(ensureStar);
      updateBar();
    }

    applyState();
    bind();
    bindSubjectSort();
    setupDirectoryStars();

    if (window.MutationObserver) {
      observer = new MutationObserver(function (records) {
        if (collectionLoading || componentMutation) return;
        var hit = records.some(function (r) {
          var nodes = Array.prototype.slice.call(r.addedNodes || []).concat(Array.prototype.slice.call(r.removedNodes || []));
          return nodes.some(function (node) {
            if (!node || node.nodeType !== 1) return false;
            if (node.classList && node.classList.contains('item')) return true;
            return !!(node.querySelector && node.querySelector('li.item'));
          });
        });
        if (!hit) return;
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(function () {
          getItems().forEach(function (li) {
            if (!li.dataset.bgmParsed) {
              if (!li.dataset.bgmIndex) li.dataset.bgmIndex = String(getItems().length);
              parseItem(li);
            } else {
              refreshItem(li);
            }
          });
          applyWithFlip(false);
        }, 200);
      });
      observer.observe(list, { childList: true });
    }
    raf(function () {
      updateSegmented();
      updateLayoutVars();
    });
    if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
      document.fonts.ready.then(function () {
        updateSegmented();
        updateLayoutVars();
      });
    }
    var crtSection = $('.browserCrtList');
    if (crtSection) {
      if (isDetailPage) crtSection.classList.add('bgm-idx-crt-directory');
      bootCharacters(crtSection, true);
    }
if (isCollectionPage) {
      collectionSiteSize = getItems().length || 24;
      loadCollectionBulk();
      if (state.q.trim()) renderCollectionSearch(state.q);
      else if (collectionPageSize !== collectionSiteSize) loadCollectionChunk(1);
    }
    window.__BGM_IDX_READER_DESTROY__ = destroy;
  }

  function destroy() {
    if (charBooted) destroyCharacters();
    booted = false;
    try {
      ac.abort();
    } catch (e) {}
    try {
      ratingAbort.abort();
    } catch (e) {}
    try {
      myAbort.abort();
    } catch (e) {}
    if (searchTimer) clearTimeout(searchTimer);
    if (refreshTimer) clearTimeout(refreshTimer);
    if (ratingApplyTimer) clearTimeout(ratingApplyTimer);
    ratingQueue = [];
    myQueue = [];
    if (observer) observer.disconnect();

    if (toolbar) toolbar.remove();
    if (pager) pager.remove();
    if (topBtn) topBtn.remove();
    var style = document.getElementById('bgm-idx-style');
    if (style) style.remove();
    if (nativeSelector) {
      nativeSelector.style.display = nativeDisplay;
      nativeSelector.removeAttribute('aria-hidden');
    }
    document.documentElement.classList.remove('bgm-idx-focus');
    document.documentElement.classList.remove('bgm-idx-ready');
    document.documentElement.style.removeProperty('--idx-sticky-top');
    document.documentElement.style.removeProperty('--idx-toolbar-height');
    if (list) {
      $$('.bgm-idx-group, .bgm-idx-empty', list).forEach(function (el) {
        el.remove();
      });
      var items = getItems();
      var indexed = items.map(function (li, i) {
        return { li: li, index: +(li.dataset.bgmIndex || i) };
      });
      indexed.sort(function (a, b) {
        return a.index - b.index;
      });
      indexed.forEach(function (item) {
        var li = item.li;
        li.hidden = false;
        li.classList.remove('is-today');
        $$('.bgm-idx-score', li).forEach(function (el) {
          el.remove();
        });
        $$('.bgm-idx-state', li).forEach(function (el) {
          el.remove();
        });
        $$('.bgm-idx-watch-count', li).forEach(function (el) {
          el.remove();
        });
        $$('.bgm-idx-alias', li).forEach(function (el) {
          el.remove();
        });
        $$('.bgm-idx-original-alias', li).forEach(function (el) {
          el.classList.remove('bgm-idx-original-alias');
        });
        var p = $(SEL.info, li);
        if (p && p.dataset.bgmOriginal != null) {
          p.textContent = p.dataset.bgmOriginal;
          delete p.dataset.bgmSplit;
          delete p.dataset.bgmOriginal;
        }
        var img = $('img.cover', li);
        if (img) {
          img.classList.remove('is-loading', 'is-loaded');
          delete img.dataset.bgmFade;
          if (img.dataset.bgmAlt === '1') {
            img.removeAttribute('alt');
            delete img.dataset.bgmAlt;
          }
        }
        Object.keys(li.dataset).forEach(function (k) {
          if (k.indexOf('bgm') === 0) delete li.dataset[k];
        });
        list.appendChild(li);
      });
      list.classList.remove('bgm-idx-on', 'bgm-idx-show-staff', 'bgm-idx-other');
      list.removeAttribute('data-bgm-view');
      list.removeAttribute('data-bgm-density');
      list.removeAttribute('data-bgm-cover-size');
    }
    delete window.__BGM_IDX_READER__;
    delete window.__BGM_IDX_READER_DESTROY__;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      if (isUserIndexPage) bootUserIndex();
      else if (isSubjectPage) bootSubject();
      else if (isBrowserPage) bootBrowserStars();
      else boot();
    }, { once: true });
  } else {
    if (isUserIndexPage) bootUserIndex();
    else if (isSubjectPage) bootSubject();
    else if (isBrowserPage) bootBrowserStars();
    else boot();
  }
})();