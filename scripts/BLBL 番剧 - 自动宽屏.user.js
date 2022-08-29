// ==UserScript==
// @name         BLBL 番剧 - 自动宽屏
// @description  BLBL 番剧页自动宽屏
// @version      1.0.0
// @namespace    --
// @author       Jamie
// @icon         https://www.google.com/s2/favicons?domain=bilibili.com
// @match        https://www.bilibili.com/bangumi/play/*
// ==/UserScript==

;(function autorun() {
  widePlayer()
})()

// 自动宽屏
function widePlayer() {
  let btnWide
  when(() => (btnWide = document.querySelector('.squirtle-video-widescreen'))).then(() => {
    btnWide.click()
  })
}

function when(conditionFn, wait = 250, maxWait = 30000) {
  let time = 0
  return new Promise((resolve, reject) => {
    ;(function check() {
      if (conditionFn()) return resolve()
      time += wait
      if (time >= maxWait) return reject(new Error('timeout'))
      setTimeout(check, wait)
    })()
  })
}
