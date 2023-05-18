// ==UserScript==
// @name         BLBL - 动态抽奖自动化
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  打开归纳整理互动抽奖的专栏，右下角「抽」按钮
// @author       Jamie
// @match        https://www.bilibili.com/
// @match        https://www.bilibili.com/read/cv*
// @match        https://t.bilibili.com/*
// @match        https://message.bilibili.com/*
// @match        https://space.bilibili.com/*/dynamic
// @match        https://www.bilibili.com/opus/*
// @match        https://www.bilibili.com/404
// @grant        unsafeWindow
// @grant        GM_openInTab
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_addStyle
// @icon         http://bilibili.com/favicon.ico
// @license      MIT
// ==/UserScript==

const toast = (function toast() {
  const container = document.createElement('div')
  container.className = 'j-toast-container'
  document.body.appendChild(container)

  return function show(text) {
    const el = document.createElement('div')
    el.className = 'j-toast'
    el.innerText = text
    document.querySelector('.j-toast-container').appendChild(el)

    setTimeout(() => {
      el.classList.add('show')
    }, 100)

    setTimeout(() => {
      el.classList.add('hidden')
      el.addEventListener('transitionend', () => {
        el.remove()
      })
    }, 2500)
  }
})()

// 数据存储
const store = (function Store() {
  const name = 'BLBL-LOTTERY-STORE'

  // 设置项
  const settings = {
    auto: false, // 自动抽奖
    collectorId: '5536630', // 归纳整理抽奖专栏的UP主id
    interval: 500, // 抽奖间隔时间
    stepInterval: 500, // 步骤间隔时间
  }

  // 共享数据
  const shared = {
    dynamicId: undefined, // 当前处理动态id
    followGroupId: undefined, // 抽奖关注分组
  }

  const current = { ...settings, ...shared, ...GM_getValue(name) }

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

;(async function run() {
  if (window.location.href === 'https://www.bilibili.com/') {
    setupIndex()
  } else if (window.location.href.startsWith('https://www.bilibili.com/read/cv')) {
    setupReadCV()
  } else if (window.location.href.startsWith('https://www.bilibili.com/opus/')) {
    setupOpus()
  } else if (window.location.href.startsWith('https://space.bilibili.com/')) {
    setupSpace()
  }
})()

// 等待条件成立
function when(conditionFn, wait = 250, maxWait = 30000) {
  let time = 0
  return new Promise((resolve, reject) => {
    ;(function check() {
      if (conditionFn()) return resolve()
      time += wait
      if (time >= maxWait) return reject(new Error('timeout'))
      setTimeout(check, wait)
      return null
    })()
  })
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

// 延时
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
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

// 网络请求，封装 XMLHttpRequest
function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open(options.method || 'GET', url)
    xhr.withCredentials = true
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const res = JSON.parse(xhr.responseText)
        if (res.code === 0) return resolve(res.data)
        return reject(res)
      }
      return reject({ message: xhr.statusText })
    }
    xhr.onerror = () => reject({ message: xhr.statusText })
    xhr.send()
  })
}

// 获取URL参数，使用 new URL()
function getUrlParam(key, url = window.location.href) {
  const urlObj = new URL(url)
  return urlObj.searchParams.get(key)
}

// 获取 Cookie
function getCookie(name) {
  const reg = new RegExp(`(^| )${name}=([^;]*)(;|$)`)
  const arr = document.cookie.match(reg)
  if (arr) return window.decodeURIComponent(arr[2])
  return null
}

// 获取动态链接的动态id
function getDynamicIdFromUrl(url) {
  const matches = url.match(/\d+/g)
  return matches ? matches[0] : null
}

// 配置主页
function setupIndex() {
  // 初始化抽奖按钮
  ;(function initButton() {
    const button = createElement(
      'button',
      {
        class: 'j-index-main-button',
        event: {
          click: startAutoLottery,
        },
      },
      '抽'
    )

    waitSelector('.palette-button-wrap').then((el) => {
      el.appendChild(button)
    })
  })()

  function startAutoLottery() {
    store.auto = true

    // 跳转个人空间动态页，删除之前抽奖转发动态
    window.open(`https://space.bilibili.com/${getUserId()}/dynamic`, '_blank')
  }

  function getUserId() {
    const link = document.querySelector('.header-avatar-wrap--container .header-entry-mini').href
    const matches = link.match(/\d+/g)
    return matches ? matches[0] : undefined
  }
}

// 配置专栏页面：抽奖按钮，抽奖链接解析
function setupReadCV() {
  start()

  // 专栏页样式
  function addStyle() {
    const style = `
    .lottery-button {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 62px;
      height: 62px;
      margin-bottom: 4px;
      background: #fff;
      border: 0;
      color: #505050;
      cursor: pointer;
    }
    .lottery-button:hover {
      color: #00a1d6;
    }
    .lottery-button .label {
      font-size: 28px;
      line-height: 1;
    }
    .lottery-button .count {
      font-size: 12px;
      margin-top: 4px;
      line-height: 1;
    }
    
    .lottery-link-status {
      display: inline-flex;
      align-items: center;
      margin: 0 4px;
      padding: 4px 5px;
      border-width: 1px;
      border-style: solid;
      border-radius: 6px;
      font-size: 13px;
      line-height: 1;
      vertical-align: text-bottom;
      user-select: none;
      cursor: pointer;
      color: #666;
      background: #fafafa;
      border-color: #d9d9d9;
    }
    .lottery-link-status input {
      margin: 0;
    }
    .lottery-link-status span {
      margin-left: 4px;
    }
    .lottery-link-status.execute-include {
      color: #0958d9;
      background: #e6f4ff;
      border-color: #91caff;
    }
    .lottery-link-status.status-waiting {
      color: #d46b08;
      background: #fff7e6;
      border-color: #ffd591;
    }
    .lottery-link-status.status-running {
      color: #0958d9;
      background: #e6f4ff;
      border-color: #91caff;
    }
    .lottery-link-status.status-done {
      color: #389e0d;
      background: #f6ffed;
      border-color: #b7eb8f;
    }
    .lottery-link-status.status-fail {
      color: #cf1322;
      background: #fff1f0;
      border-color: #ffa39e;
    }

    .lottery-link-status.status-running {
      color: #0958d9;
      background: #e6f4ff;
      border-color: #91caff;
    }
    .lottery-link-status.status-done {
      color: #389e0d;
      background: #f6ffed;
      border-color: #b7eb8f;
    }
    .lottery-link-status.status-fail {
      color: #cf1322;
      background: #fff1f0;
      border-color: #ffa39e;
    }
    `

    GM_addStyle(style)
  }

  function start() {
    waitSelector('.side-toolbar').then(() => {
      addStyle()
      initLotteryButton()
      markLotteryLink()
      updateLotteryButtonCount()
    })
  }

  // 初始化抽奖按钮
  function initLotteryButton() {
    const html = `
    <button class="lottery-button" id="lottery-button">
      <span class="label">抽</span>
      <span class="count" id="lottery-button-count">0</span>
    </button>`

    document.querySelector('.side-toolbar').insertAdjacentHTML('afterbegin', html)
    document.querySelector('#lottery-button').addEventListener('click', startLottery)
  }

  // 更新抽奖按钮上的数量
  function updateLotteryButtonCount() {
    const count = document.querySelectorAll('.article-content .lottery-link-status input:checked').length
    document.querySelector('#lottery-button-count').innerText = count
  }

  // 标记抽奖链接，在链接后插入一个勾选框
  function markLotteryLink() {
    const links = document.querySelectorAll('.article-content a[href^="https://t.bilibili.com/"], .article-content a[href^="https://www.bilibili.com/opus/"]')

    links.forEach((link) => {
      const checkbox = createLotteryCheckbox(link)
      link.insertAdjacentElement('afterend', checkbox)
    })
  }

  // 创建抽奖勾选框
  function createLotteryCheckbox(link) {
    const checkbox = createElement('input', {
      type: 'checkbox',
      'data-dynamic-id': getDynamicIdFromUrl(link.href),
      event: {
        change() {
          // 切换状态
          this.parentNode.classList.toggle('execute-include')
          this.parentNode.querySelector('span').innerText = this.checked ? '已选择' : '未选择'

          updateLotteryButtonCount()
        },
      },
    })
    const label = createElement('label', { className: 'lottery-link-status' }, [checkbox, createElement('span', {}, '未选择')])
    return label
  }

  // 变更checkbox的抽奖状态：等待、进行中、已完成、失败
  function changeCheckboxStatus(checkbox, status) {
    const textMap = {
      waiting: '待抽奖',
      running: '抽奖中',
      done: '抽奖完成',
      fail: '抽奖失败',
    }
    checkbox.parentNode.querySelector('span').innerText = textMap[status]
    checkbox.parentNode.className = `lottery-link-status status-${status}`
  }

  // 拼接动态链接
  function makeDynamicUrl(id) {
    return `https://www.bilibili.com/opus/${id}?auto=true`
  }

  // 开始抽奖
  function startLottery() {
    const checkboxes = document.querySelectorAll('.article-content .lottery-link-status input')

    checkboxes.forEach((checkbox) => {
      checkbox.disabled = true
      if (checkbox.checked) {
        changeCheckboxStatus(checkbox, 'waiting')
      }
    })

    document.addEventListener('visibilitychange', visibilitychangeHandler, false)

    // createFollowGroup().then(executeNext)
    executeNext()
  }

  // 执行下一个抽奖
  function executeNext() {
    const checkbox = document.querySelector(`.article-content .lottery-link-status.status-waiting input`)
    if (!checkbox) {
      finishLottery()
      return
    }
    const id = checkbox.getAttribute('data-dynamic-id')

    changeCheckboxStatus(checkbox, 'running')

    GM_openInTab(makeDynamicUrl(id), { active: true, setParent: true })
  }

  // 标记上一个抽奖为已完成
  function markPreviousDone() {
    const preDynamicId = GM_getValue('BIBI_LOTTERY_DYNAMIC_ID')
    if (preDynamicId) {
      GM_deleteValue('BIBI_LOTTERY_DYNAMIC_ID')
    }
    const checkbox = document.querySelector(`.article-content .lottery-link-status.status-running input[data-dynamic-id="${preDynamicId}"]`)
    if (checkbox) {
      changeCheckboxStatus(checkbox, 'done')
    }
  }

  // 监听页面可见性变化
  function visibilitychangeHandler() {
    if (document.visibilityState === 'visible') {
      markPreviousDone()
      setTimeout(executeNext, store.interval)
    }
  }

  function finishLottery() {
    // 移除事件监听
    document.removeEventListener('visibilitychange', visibilitychangeHandler, false)
  }

  // 创建抽奖关注分组
  function createFollowGroup(groupName = '抽奖') {
    return request(`https://api.bilibili.com/x/relation/tag/create?tag=${groupName}&jsonp=jsonp&csrf=${getCookie('bili_jct')}`, {
      method: 'POST',
    })
      .then((data) => {
        const { tagid } = data
        if (tagid == null) throw new Error('[createFollowGroup] 创建抽奖关注分组 失败')
        console.log(`[createFollowGroup] 抽奖关注分组: ${tagid}`)
        store.followGroupId = tagid
      })
      .catch((err) => {
        if (err?.code === 22106) {
          console.log(`[createFollowGroup] 抽奖关注分组已存在`)
          return Promise.resolve()
        }
        console.log('[createFollowGroup] 创建抽奖关注分组 失败')
        throw err
      })
  }
}

// 配置动态页面：点赞、转发、关注、添加到分组
function setupOpus() {
  start()

  function start() {
    if (getUrlParam('auto') !== 'true') {
      // 非自动抽奖，不继续执行
      return
    }

    waitSelector('.side-toolbar__action.like') // 页面加载完成
      .then(checkLiked) // 检查是否已点赞
      .then(() => sleep(store.stepInterval))
      .then(triggerLikeButton) // 触发点赞按钮
      .then(() => sleep(store.stepInterval))
      .then(getUpperId) // 获取 UP主 id
      .then(followUpper) // 关注 UP主
      // .then(() => sleep(store.stepInterval))
      // .then(addUpperToGroup) // 添加 UP主到抽奖分组
      .then(() => sleep(store.stepInterval))
      .then(triggerForwardButton) // 触发转发按钮
      // .then(() => sleep(store.stepInterval))
      // .then(pasteForwardComment) // 粘贴转发评论
      .then(() => sleep(store.stepInterval))
      .then(triggerEmojiButton) // 触发表情按钮
      .then(() => sleep(store.stepInterval))
      .then(triggerPublishButton) // 触发发布按钮
      .then(() => {
        console.log('抽奖完成')

        GM_setValue('BIBI_LOTTERY_DYNAMIC_ID', getDynamicIdFromUrl(window.location.href))

        setTimeout(window.close, store.interval)
      })
      .catch((err) => {
        console.log('抽奖失败', err)

        setTimeout(window.close, store.interval)
      })
  }

  // 检查是否已点赞，如果已点赞则表示已经处理过
  function checkLiked() {
    return new Promise((resolve, reject) => {
      if (document.querySelector('.side-toolbar__action.like.is-active') != null) {
        reject(new Error('已点赞，即将关闭页面'))
      }
      resolve('ok')
    })
  }

  // 触发点赞按钮
  function triggerLikeButton() {
    document.querySelector('.side-toolbar__action.like').click()
  }

  // 获取 UP主 id
  function getUpperId() {
    const dynamicId = getDynamicIdFromUrl(window.location.href)

    return request(`https://api.bilibili.com/x/polymer/web-dynamic/v1/detail?timezone_offset=-480&id=${dynamicId}`)
      .then((data) => {
        const mid = data?.item?.modules?.module_author?.mid
        if (mid == null) throw new Error('[getUpperId] 获取 UP主 id 失败')
        console.log(`[getUpperId] UP主 id: ${mid}`)
        return mid
      })
      .catch((err) => {
        console.log('[getUpperId] 获取 UP主 id 失败')
        throw err
      })
  }

  // 关注 UP主
  function followUpper(upperId) {
    return request(`https://api.bilibili.com/x/relation/modify?act=1&fid=${upperId}&spmid=444.42&re_src=0&csrf=${getCookie('bili_jct')}`, {
      method: 'POST',
    })
      .then(() => {
        console.log('[followUpper] 关注 UP主 成功')
        return upperId
      })
      .catch((err) => {
        console.log('[followUpper] 关注 UP主 失败')
        throw err
      })
  }

  // 添加到[抽奖]分组
  function addUpperToGroup(upperId) {
    return request(`https://api.bilibili.com/x/relation/tags/addUsers?cross_domain=true&fids=${upperId}&tagids=${store.followGroupId}&csrf=${getCookie('bili_jct')}`, {
      method: 'POST',
    })
      .then(() => {
        console.log('[addUpperToGroup] 关注分组 成功')
      })
      .catch((err) => {
        console.log('[addUpperToGroup] 关注分组 失败')
        throw err
      })
  }

  // 触发转发按钮
  async function triggerForwardButton() {
    document.querySelector('.side-toolbar__action.forward').click()
    await waitSelector('.bili-rich-textarea__inner')
  }

  // 粘贴转发评论内容
  async function pasteForwardComment() {
    const textarea = document.querySelector('.bili-rich-textarea__inner')
    const comment = getForwardComment()
    const inputEvent = new InputEvent('input', { inputType: 'insertText', data: comment, dataTransfer: null, isComposing: false })
    textarea.dispatchEvent(inputEvent)
    await sleep(500) // 等待输入完成，避免输入失效
  }

  // 获取随机转发评论内容
  function getForwardComment() {
    const CommentDict = ['UPUP', '支持UP', '中中', '好奖啊', '冲冲冲', '来个好运气', '好耶']
    return CommentDict[Math.floor(Math.random() * CommentDict.length)]
  }

  // 触发表情按钮，输入两次欢呼表情
  async function triggerEmojiButton() {
    const emojiButton = document.querySelector('.bili-dyn-share-publishing__tools__item.emoji')
    emojiButton.click()

    const cheerEmoji = await waitSelector('.bili-emoji__list__item.small:nth-child(14)')
    cheerEmoji().click()
    await sleep(500)
    cheerEmoji().click()
  }

  // 触发发布按钮
  async function triggerPublishButton() {
    const publishButton = document.querySelector('.bili-dyn-share-publishing__action.launcher')
    publishButton.click()

    await waitSelector('.bili-dyn-share__done')
  }
}

// 配置空间页面：删除已开奖的转发动态、取关 UP主
async function setupSpace() {
  const userId = await getUserId()
  if (!window.location.href.includes(userId)) return

  const start = () => scrollUntilNoMore().then(deleteDynamic)

  // 自动执行流程
  if (store.auto) {
    start()
  }

  function getUserId() {
    return waitSelector('.header-avatar-wrap--container .header-entry-mini').then((el) => {
      const link = el.href
      const matches = link.match(/\d+/g)
      return matches ? matches[0] : undefined
    })
  }

  function addStyle() {
    const style = `
    .start-button {
      position: fixed;
      right: 20px;
      bottom: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 30px;
      padding: 0 10px;
      margin-bottom: 4px;
      background: #fff;
      border: 0;
      border-radius: 6px;
      line-height: 30px;
      font-size: 14px;
      color: #222;
      cursor: pointer;
    }
    .start-button:hover {
      color: #00a1d6;
    }
    `

    GM_addStyle(style)
  }

  // 初始化抽奖按钮
  function initButton() {
    const button = createElement('button', { class: 'start-button', event: { click: start } }, '删除已开奖')

    document.body.appendChild(button)
  }

  // 滚动页面，直到存在 .bili-dyn-list-no-more 元素
  async function scrollUntilNoMore() {
    const noMoreElement = document.querySelector('.bili-dyn-list-no-more')
    if (noMoreElement != null) return

    window.scrollTo(0, document.documentElement.scrollHeight)
    await sleep(500)
    await scrollUntilNoMore()
  }

  async function deleteDynamic() {
    // 官方互动抽奖动态列表
    const lotteryDynamicList = Array.from(document.querySelectorAll('.bili-dyn-list__item'))
      .filter((item) => item.querySelector('.bili-dyn-content__orig.reference .bili-rich-text-module.lottery') != null)
      .reverse()

    toast(`共有 ${lotteryDynamicList.length} 条动态`)
    await sleep(500)

    // eslint-disable-next-line no-restricted-syntax
    for (const [index, item] of lotteryDynamicList.entries()) {
      toast(`[${index + 1}/${lotteryDynamicList.length}] 开始检查开奖`)
      item.scrollIntoView({ behavior: 'smooth' })
      await sleep(500)

      // 打开互动抽奖详情弹窗
      const lottery = item.querySelector('.bili-dyn-content__orig.reference .bili-rich-text-module.lottery')
      lottery.click()

      // 等待互动抽奖详情弹窗打开，抽奖结果展示出来
      await when(() => !!document.querySelector('.bili-popup__content__browser')?.contentDocument?.querySelector('.result-list'))
      await sleep(500)

      const hasWinner = document.querySelector('.bili-popup__content__browser')?.contentDocument?.querySelector('.prize-winner-block')
      toast(`[${index + 1}/${lotteryDynamicList.length}] ${hasWinner ? '已开奖' : '未开奖，跳过'}`)

      if (hasWinner) {
        const userName = document.querySelector('#h-name').innerText
        const usernameList = document.querySelector('.bili-popup__content__browser')?.contentDocument?.querySelectorAll('.result-user .user-name')
        const isWinner = !![].find.call(usernameList, (el) => el.innerText === userName)
        console.log('是否中奖', isWinner)

        if (isWinner) {
          toast('🎉🎉🎉🎉🎉🎉🎉🎉 恭喜你中奖了')
          continue
        }
      }

      const popupCloseButton = document.querySelector('.bili-popup__header__close')
      popupCloseButton.click()
      document.body.removeChild(document.querySelector('.bili-popup'))

      // 未开奖，跳过
      if (!hasWinner) {
        if (index === lotteryDynamicList.length - 1) {
          toast('检查开奖完成 ✅')
          await sleep(1000)
          handleFinish()
        }
        await sleep(500)
        continue
      }

      // 取关UP主，触发鼠标移入事件，展示UP主信息弹窗
      const upper = item.querySelector('.dyn-orig-author__name')
      upper.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
      upper.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))

      // UP主信息弹窗展示
      await when(() => document.querySelector('.bili-user-profile')?.style?.display === '')

      const followButton = document.querySelector('.bili-user-profile-view__info__button.follow') // 关注按钮
      if (followButton.classList.contains('checked')) {
        // 已关注，取消关注
        followButton.click()

        toast(`[${index + 1}/${lotteryDynamicList.length}] UP主已取关`)
      }

      // 触发关闭UP主信息弹窗
      upper.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }))

      // 删除动态
      const deleteButton = item.querySelector('[data-type="THREE_POINT_DELETE"]')
      deleteButton.click()

      const confirmButton = await waitSelector('.bili-modal__button.confirm')
      confirmButton.click()

      toast(`[${index + 1}/${lotteryDynamicList.length}] 删除动态成功`)
      await sleep(500)

      if (index === lotteryDynamicList.length - 1) {
        toast('删除开奖完成')
        await sleep(1000)
        handleFinish()
        return
      }
    }
  }

  function handleFinish() {
    if (store.auto) {
      window.close()
    }
  }

  addStyle()
  initButton()
}

;(function addCommonStyle() {
  const style = `
    .j-toast-container {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 999999;
    }
    .j-toast {
      box-sizing: border-box;
      height: 40px;
      padding: 0 20px;
      background-color: rgba(0, 0, 0, .8);
      color: #fff;
      border-radius: 4px;
      font-size: 14px;
      line-height: 40px;
      overflow: hidden;
      margin-top: 5px;
      transform: translateX(120%);
    }
    .j-toast.show {
      transform: translateX(0);
      transition: .3s;
    }
    .j-toast.hidden {
      opacity: 0;
      margin-top: -40px;
      transition: .6s;
    }
    
    .j-index-main-button {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 40px;
      height: 40px;
      border-radius: 8px;
      padding: 7px 12px;
      font-size: 16px;
      color: #18191c;
      border: 1px solid #e3e5e7;
      background-color: #ffffff;
      margin-top: 12px;
      transform-origin: center;
      transition: .2s;
      cursor: pointer;
    }
    .j-index-main-button:hover {
      background-color: #e3e5e7;
    }
  `

  GM_addStyle(style)
})()
