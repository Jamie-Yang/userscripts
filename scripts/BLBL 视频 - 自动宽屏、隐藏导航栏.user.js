// ==UserScript==
// @name         BLBL 视频 - 自动宽屏、隐藏导航栏
// @description  视频播放页增强
// @version      1.0.0
// @namespace    --
// @author       Jamie
// @icon         https://www.google.com/s2/favicons?domain=bilibili.com
// @match        https://www.bilibili.com/video/BV*
// ==/UserScript==

;(function autorun() {
  hideNavBar()
  widePlayer()
})()

// 自动宽屏
function widePlayer() {
  let btnWide
  when(() => (btnWide = document.querySelector('.bpx-player-ctrl-wide'))).then(() => {
    btnWide.click()
  })
}

// 隐藏导航栏
function hideNavBar() {
  document.querySelector('#biliMainHeader').style.display = 'none'
  // 重置默认的滚动偏移
  when(() => document.documentElement.scrollTop, 50).then(() => {
    document.documentElement.scrollTop = 0
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
