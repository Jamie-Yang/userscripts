// ==UserScript==
// @name         BLBL - 视频自动宽屏、隐藏导航栏
// @description  视频播放页体验优化
// @version      1.0.0
// @namespace    --
// @author       Jamie
// @author       Jamie
// @icon         https://www.google.com/s2/favicons?domain=bilibili.com
// @match        https://www.bilibili.com/video/BV*
// @match        https://www.bilibili.com/bangumi/play/*
// ==/UserScript==

;(function start() {
  if (window.location.href.startsWith('https://www.bilibili.com/video/BV')) {
    setupVideo()
  } else if (window.location.href.startsWith('https://www.bilibili.com/bangumi/play/')) {
    setupBangumi()
  }
})()

// 视频播放页
function setupVideo() {
  // 切换宽屏
  triggerWideMode('.bpx-player-ctrl-wide')

  // 隐藏导航栏
  document.querySelector('#biliMainHeader').style.display = 'none'

  // 重置默认的滚动偏移
  when(() => document.documentElement.scrollTop, 50).then(() => {
    document.documentElement.scrollTop = 0
  })
}

// 番剧播放页
function setupBangumi() {
  // 切换宽屏
  triggerWideMode('.squirtle-video-widescreen')
}

// 切换宽屏
function triggerWideMode(wideBtnClass) {
  when(() => !!document.querySelector(wideBtnClass)).then(() => {
    document.querySelector(wideBtnClass).click()
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
      return true
    })()
  })
}
