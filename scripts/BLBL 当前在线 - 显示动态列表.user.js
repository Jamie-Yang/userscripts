// ==UserScript==
// @name         BLBL 当前在线 - 显示动态列表
// @description  当前在线页展示动态列表
// @version      1.0.0
// @namespace    --
// @author       Jamie
// @icon         https://www.google.com/s2/favicons?domain=bilibili.com
// @match        https://www.bilibili.com/video/online.html
// ==/UserScript==

;(function autorun() {
  show()
})()

function show() {
  const html = `
    <div style="position: fixed; top: 240px; right: 150px; width: 382px; height: 80vh; z-index: 1000; padding: 5px 0px; border-radius: 5px; overflow: hidden">
      <iframe src="https://t.bilibili.com/pages/nav/index_new#/video" frameborder="0" style="width: 100%; height: 100%" id="theFrame"></iframe>
    </div>`

  document.body.insertAdjacentHTML('beforeend', html)

  let container
  when(() => {
    try {
      container = document.getElementById('theFrame').contentWindow.document.querySelector('#app .container')
      return !!container
    } catch (e) {
      return false
    }
  }).then(() => {
    container.style.maxHeight = '80vh'
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
