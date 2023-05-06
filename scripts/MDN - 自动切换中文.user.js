// ==UserScript==
// @name         MDN - 自动切换中文语言
// @description  自动将英文版重定向至中文版
// @version      1.0.0
// @namespace    --
// @author       Jamie
// @icon         https://www.google.com/s2/favicons?domain=developer.mozilla.org
// @match        https://developer.mozilla.org/en-US/*
// @match        https://developer.mozilla.org/zh-CN/*
// @run-at       document-start
// ==/UserScript==

;(function start() {
  redirect()
})()

function redirect() {
  const isEn = /en-US/.test(window.location.href)
  const isZh = /zh-CN/.test(window.location.href)
  const isChecked = /checked/.test(window.location.href)

  if (isEn && !isChecked) {
    window.window.location.replace(window.location.href.replace('en-US', 'zh-CN'))
  } else if (isZh && document.querySelector('.main-page-content > h1').innerText === 'Page not found') {
    window.window.location.replace(`${window.location.href.replace('zh-CN', 'en-US')}?checked`)
  }
}
