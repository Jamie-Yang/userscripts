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
  const el = createElement(
    'div',
    {
      style: {
        position: 'fixed',
        top: '240px',
        right: '150px',
        width: '382px',
        height: '80vh',
        zIndex: '1000',
        padding: '5px 0px',
        borderRadius: '5px',
        overflow: 'hidden',
      },
    },
    [
      createElement('iframe', {
        src: 'https://t.bilibili.com/pages/nav/index_new#/video',
        id: 'theFrame',
        style: { width: '100%', height: '100%', border: '0' },
      }),
    ]
  )

  document.body.appendChild(el)

  let container = undefined
  when(function () {
    try {
      container = document.getElementById('theFrame').contentWindow.document.querySelector('#app .container')
      return !!container
    } catch (e) {
      return false
    }
  }).then(function () {
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
    })()
  })
}

function createElement(type, props, children) {
  var elem = null

  if (type === 'text') {
    return document.createTextNode(props)
  } else {
    elem = document.createElement(type)
  }

  for (var n in props) {
    if (n === 'style') {
      for (var x in props.style) {
        elem.style[x] = props.style[x]
      }
    } else if (n === 'className') {
      elem.className = props[n]
    } else if (n === 'event') {
      for (var _x in props.event) {
        elem.addEventListener(_x, props.event[_x])
      }
    } else {
      props[n] !== undefined && elem.setAttribute(n, props[n])
    }
  }

  if (children) {
    if (typeof children === 'string') {
      elem.innerHTML = children
    } else {
      for (var i = 0; i < children.length; i++) {
        if (children[i] != null) {
          elem.appendChild(children[i])
        }
      }
    }
  }

  return elem
}
