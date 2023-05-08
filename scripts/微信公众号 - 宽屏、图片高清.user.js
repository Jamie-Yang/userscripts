// ==UserScript==
// @name         微信公众号文章宽屏
// @description  微信公众号文章宽屏，提升阅读体验
// @version      1.0.0
// @namespace    --
// @author       Jamie
// @icon         https://www.google.com/s2/favicons?domain=mp.weixin.qq.com
// @match        https://mp.weixin.qq.com/s*
// @grant        GM_addStyle
// ==/UserScript==

;(function start() {
  highQualityImage()
  wideScreen()
})()

function highQualityImage() {
  setTimeout(() => {
    document.querySelectorAll('img').forEach((img) => {
      const dataSrc = img.dataset.src
      if (!dataSrc) return

      img.src = dataSrc.replace('/640', '/')
    })
  }, 1000)
}

function wideScreen() {
  const css = `@media screen and (min-width:750px) {
      :root { --inject-page-width:min(90vw, 1050px) }
      .inject-widescreen-loose-js { --inject-page-width:90vw }
      .rich_media_area_primary_inner { margin-left:auto; margin-right:auto; max-width:var(--inject-page-width) !important }
      #js_pc_qr_code .qr_code_pc { opacity:.1; position:fixed; right:3vw; top:25vh }
      #js_pc_qr_code .qr_code_pc:hover { opacity:1 }
    }`

  GM_addStyle(css)
}
