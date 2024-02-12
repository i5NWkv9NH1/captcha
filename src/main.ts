import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'



const initValue = `
var captchaSlider = new Captcha.default({
	el: '.slider-captcha',
	showReload:true,
	vailadeValue: 20,
	vaildResultShowTime: 1000,
	slideSizeRate: 0.1,
	onSuccess () {
		console.log('成功')
	},
	onFail () {
		console.log('失败')
	},
	onChange (rate, event) {
	}
})

Array.from(document.querySelectorAll('.btn')).forEach((el, index) => {
		el.addEventListener('click', function () {
			// 重新加载（没配置项参数）
			if (index === 0) {
				document.querySelector('.slider-captcha-box').style.display = 'block'
				captchaSlider.reset()
			} else if (index === 1) {
				document.querySelector('.slider-captcha-box').style.display = 'block'
				// 重新加载（有配置项参数）
				captchaSlider.reset({
					el: '.slider-captcha',
					picList: [
						'https://t7.baidu.com/it/u=2621658848,3952322712&fm=193&f=GIF'
					]
				})
			} else if (index === 2) {
				// 渲染下一个图片
				captchaSlider && captchaSlider.loadNextImage()
			} else if (index === 3) {
				// 销毁
				captchaSlider.destory()

			}

		})
})

// 点击关闭按钮
document.querySelector('.contraller .icon-guanbicuowu').addEventListener('click', function () {
	document.querySelector('.slider-captcha-box').style.display = 'none'
	captchaSlider.destory()
})
`


self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') {
      return new jsonWorker()
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new cssWorker()
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new htmlWorker()
    }
    if (label === 'typescript' || label === 'javascript') {
      return new tsWorker()
    }
    return new editorWorker()
  }
}

monaco.editor.create(document.getElementById('container')!, {
  value: initValue,
  language: 'javascript',
  lineNumbers: 'off',
  roundedSelection: false,
  scrollBeyondLastLine: false,
  readOnly: false,
  theme: 'vs-dark'
})


createScript(initValue)

function createScript(v: string) {
  // 移除script
  const scripts = document.querySelectorAll('script.runtime')
  Array.from(scripts).forEach(el => {
    el.parentNode!.removeChild(el)
  })


  // 移除slider-captcha 内容
  Array.from(document.querySelectorAll('.slider-captcha')).forEach(el => {
    el.innerHTML = ''
  })

  var script = document.createElement('script')
  script.setAttribute('class', 'runtime')
  script.innerHTML = v
  document.body.appendChild(script)
}
