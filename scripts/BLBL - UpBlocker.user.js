// ==UserScript==
// @name         BLBL - UpBlocker
// @description  屏蔽指定 UP 主视频
// @version      1.0.0
// @namespace    --
// @author       Jamie
// @author       Jamie
// @icon         https://www.google.com/s2/favicons?domain=bilibili.com
// @match        https://www.bilibili.com/v/popular/all*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==

// 数据存储
const store = (function Store() {
  const name = 'BLBL-UP-BLOCKER'

  // 共享数据
  const shared = {
    blocked: [],
  }

  const current = { ...shared, ...GM_getValue(name) }

  return new Proxy(current, {
    set(target, key, value) {
      if (!(key in current)) {
        throw new Error(`[store] 未知设置项 "${key}"`)
      }
      target[key] = value
      GM_setValue(name, target)
      return true
    },

    get(target, key) {
      return target[key]
    },
  })
})()

;(function start() {
  if (window.location.href.startsWith('https://www.bilibili.com/v/popular/all')) {
    setupPopularAll()
  }
})()

function setupPopularAll() {
  console.log('[BLBL-UP-BLOCKER] 当前屏蔽列表：', store.blocked.toString())
  addCss()
  listenCardListLoaded()

  // 监听视频列表加载
  async function listenCardListLoaded() {
    const cardList = await waitSelector('.card-list')

    const process = (list) => {
      ;[].forEach.call(list, (card) => {
        if (!card.classList.contains('video-card')) return

        checkBlock(card)
        addButton(card)
      })
    }
    process(cardList.children)
    onNodesAdded(cardList, process)
  }

  // 屏蔽指定 UP 主视频
  function checkBlock(card) {
    const upName = card.querySelector('.up-name__text').innerText
    if (store.blocked.includes(upName)) {
      doHide(card)
    }
  }

  // 增加屏蔽按钮
  function addButton(card) {
    const container = card.querySelector('.video-card__content')
    if (container.querySelector('.up-blocker-button')) return

    const upName = card.querySelector('.up-name__text').innerText
    const isBlocked = store.blocked.includes(upName)

    const blockButton = createElement('button', { className: 'up-blocker-button', style: { display: 'none' } }, isBlocked ? 'Unblock' : 'Block')
    blockButton.addEventListener('click', () => {
      if (blockButton.innerText === 'Block') {
        doBlock(card)
      } else {
        doUnblock(card)
      }
      blockButton.innerText = blockButton.innerText === 'Block' ? 'Unblock' : 'Block'
    })

    container.addEventListener('mouseenter', () => {
      blockButton.style.display = 'block'
    })
    container.addEventListener('mouseleave', () => {
      blockButton.style.display = 'none'
    })

    container.appendChild(blockButton)
  }

  // 执行屏蔽
  function doBlock(card) {
    const upName = card.querySelector('.up-name__text').innerText
    if (store.blocked.includes(upName)) return

    store.blocked = [...store.blocked, upName]
    doHide(card)
  }

  // 执行取消屏蔽
  function doUnblock(card) {
    const upName = card.querySelector('.up-name__text').innerText
    if (!store.blocked.includes(upName)) return

    store.blocked = store.blocked.filter((name) => name !== upName)
    unHide(card)
  }

  // 显示视频
  function unHide(card) {
    card.style.opacity = 1
    card.style.filter = 'none'
    card.querySelector('.video-card__content img').style.display = 'block'
    card.querySelector('.video-card__content').style.background = '#fff'
  }

  // 隐藏视频
  function doHide(card) {
    card.style.opacity = 0.05
    card.style.filter = 'grayscale(100%)'
    card.querySelector('.video-card__content img').style.display = 'none'
    card.querySelector('.video-card__content').style.background = '#999'
  }

  function addCss() {
    const css = `
    .up-blocker-button {
      position: absolute;
      z-index: 20;
      height: 28px;
      right: 44px;
      bottom: 8px;
      padding: 0 10px;
      color: #fff;
      font-size: 14px;
      cursor: pointer;
      border-radius: 2px;
      background-color: rgba(0, 0, 0, 0.8);
    }`
    GM_addStyle(css)
  }
}

// 监听 HTML 增加子元素
function onNodesAdded(el, callback) {
  const observer = new MutationObserver((mutationsList) => {
    mutationsList.forEach((mutation) => {
      if (mutation.type === 'childList') {
        callback(mutation.addedNodes)
      }
    })
  })
  observer.observe(el, { childList: true })
}

// 创建元素
function createElement(type, props, children) {
  if (type === 'text') return document.createTextNode(props)

  const el = document.createElement(type)

  Object.keys(props).forEach((n) => {
    if (n === 'style') {
      Object.keys(props.style).forEach((x) => {
        el.style[x] = props.style[x]
      })
    } else if (n === 'className') {
      el.className = props[n]
    } else if (n === 'event') {
      Object.keys(props.event).forEach((x) => {
        el.addEventListener(x, props.event[x])
      })
    } else if (n !== undefined) {
      el.setAttribute(n, props[n])
    }
  })

  if (children) {
    if (typeof children === 'string') {
      el.innerHTML = children
    } else {
      children.forEach((child) => {
        if (child == null) return
        el.appendChild(child)
      })
    }
  }

  return el
}

// 等待元素出现，返回元素
function waitSelector(selector, wait = 250, maxWait = 30000) {
  let time = 0
  return new Promise((resolve, reject) => {
    ;(function check() {
      const el = document.querySelector(selector)
      if (el) return resolve(el)
      time += wait
      if (time >= maxWait) return reject(new Error('timeout'))
      setTimeout(check, wait)
      return null
    })()
  })
}
