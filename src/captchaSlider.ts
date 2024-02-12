import { createKey } from "./createKey"

export type CaptchaSliderOptions = {
  el: HTMLDivElement | HTMLElement
  // TODO: return type
  finish: (slider: CaptchaSlider, rate: number) => any
  onStart?: (event: Event) => void
  onChange?: (slider: CaptchaSlider, rate: number, event: Event) => void
  onEnd?: (rate: number, event: Event) => void
}


export enum State {
  // ? 空闲
  IDLE = `idle`,
  // ? 正在发生
  PROCES = `proces`,
  // ? 成功
  SUCCESS = `success`,
  // ? 失败
  FAIL = `fail`,
}

export class CaptchaSlider {
  public styleEl!: HTMLStyleElement
  // * 滑块元素
  public slideBlockEl!: HTMLDivElement
  // * 滑块父元素
  public slideWrapperEl!: HTMLDivElement
  // * 已经滑动的元素
  public slideMovedEl!: HTMLDivElement
  // * 验证成功的元素
  public slideTipEl!: HTMLDivElement
  // * 验证成功的元素
  public validateSucEl!: HTMLDivElement
  // * 是否在滑块元素上按下了鼠标左键
  public isMouseDown: boolean = false


  public state: State
  public key: string
  // * 滑块滑动百分比
  public rate: number


  // * events
  public onTouchStart!: (event: Event) => void
  public onTouchMove!: (event: TouchEvent) => void
  public onTouchEnd!: (event: Event) => void

  public onMouseDown!: (event: Event) => void
  public onMouseMove!: (event: Event) => void
  public onMouseUp!: (event: Event) => void


  public options: CaptchaSliderOptions

  constructor(options: CaptchaSliderOptions) {
    this.isMouseDown = false
    this.key = ''
    this.rate = 0
    this.state = State.IDLE

    if (!options.el) {
      throw TypeError(`CaptchaSlider options el param must be [String、 Element]`)
    } else {
      if (typeof options.el === 'string') {
        options.el = document.querySelector(options.el)!
      }
    }

    this.options = options
    this.init()
  }

  public init() {
    this.key = createKey()
    this.createElement()
    this.createStyles()
  }

  public createElement() {
    const html = `
    <!-- 已经移动的距离 -->
    <div class="captcha_slide_moved" captcha-slider="${this.key}"></div>
    <!-- 滑块 -->
    <div class="captcha_slide_block" captcha-slider="${this.key}">
      <i class="captcha-slider-iconfont icon-youfanyeyouhua captcha_slide_block_right"></i>
      <i class="captcha-slider-iconfont icon-guanbicuowu captcha_slide_block_fail"></i>
    </div>
    <div class="captcha_slide_tip" captcha-slider="${this.key}">向右滑动滑块完成验证</div>
    <div class="captcha_slide_valide_success" captcha-slider="${this.key}">
    <i class="captcha-slider-iconfont icon-duihao captcha_slide_success"></i>
    验证成功</div>
  `
    const wrapperEl = document.createElement('div')
    wrapperEl.setAttribute('class', `captcha_slide_wrapper`)
    wrapperEl.setAttribute('style', `width: ${this.options.el.offsetWidth}px`)
    wrapperEl.setAttribute('captcha-slider', this.key)
    wrapperEl.innerHTML = html
    this.options.el.appendChild(wrapperEl)
  }

  public bidingEvents() {
    this.slideBlockEl = document.querySelector(`.captcha_slide_block[captcha-slider="${this.key}"]`)!
    this.slideWrapperEl = document.querySelector(`.captcha_slide_wrapper[captcha-slider="${this.key}"]`)!
    this.slideMovedEl = document.querySelector(`.captcha_slide_moved[captcha-slider="${this.key}"]`)!
    this.validateSucEl = document.querySelector(`.captcha_slide_valide_success[captcha-slider="${this.key}"]`)!
    this.slideTipEl = document.querySelector(`.captcha_slide_tip[captcha-slider="${this.key}"]`)!

    if (typeof document['ontouchstart'] !== undefined) {
      this.mobileBindingEvents()
    } else {
      this.pcBindingEvents()
    }
  }

  public pcBindingEvents() {
    this.onMouseDown = (event) => {
      const target = event.target as HTMLElement
      this.rate = 0

      // 点击的是滑块元素并且状态是空闲状态
      if ((target.isSameNode(this.slideBlockEl) || target.parentNode!.isSameNode(this.slideBlockEl)) && this.state === State.IDLE) {
        this.state = State.PROCES
        this.isMouseDown = true
        // 将比例向外传递
        this.options.onStart && this.options.onStart(event)
      }
    }
    this.onMouseMove = (event) => {
      if (this.isMouseDown) {
        const rect = this.slideWrapperEl.getBoundingClientRect()
        let moveX = (event as DragEvent).clientX - rect.left
        // 将移动距离设置到一个合理的范围内
        moveX = Math.min(Math.max(0, moveX), rect.width)
        // 滑动百分比 0 ~ 1
        this.rate = moveX / rect.width
        this.setSlideBlockPostion()
        // 将比例向外传递
        this.options.onChange && this.options.onChange(this, this.rate, event)
      }
    }
    this.onMouseUp = (event) => {
      if (this.isMouseDown) {
        // 完成时，向外传递完成的信息
        if (this.options.finish) {
          const result = this.options.finish(this, this.rate)
          // 验证结果是否成功
          if (result) {
            this.valideSuccess()
          } else {
            this.validefail()
          }
        }
        this.validefail()
        this.options.onEnd && this.options.onEnd(this.rate, event)
      }
      this.isMouseDown = false
    }
    document.addEventListener('mouseup', this.onMouseUp)
    document.addEventListener('mousemove', this.onMouseMove)
    document.addEventListener('mousedown', this.onMouseDown)
  }

  public mobileBindingEvents() {
    this.onTouchStart = (event: Event) => {
      const target = (event.target as HTMLElement)

      this.rate = 0
      // 点击的是滑块元素并且状态是空闲状态
      if ((target.isSameNode(this.slideBlockEl) || target.parentNode!.isSameNode(this.slideBlockEl)) && this.state === State.IDLE) {
        this.state = State.PROCES
        this.isMouseDown = true
        this.options.onStart && this.options.onStart(event)
      }
    }
    document.addEventListener('touchstart', this.onTouchStart)

    this.onTouchMove = (event: TouchEvent) => {
      if (this.isMouseDown) {
        const rect = this.slideWrapperEl!.getBoundingClientRect()
        let moveX = event.changedTouches[0].clientX - rect.left
        // 将移动距离设置到一个合理的范围内
        moveX = Math.min(Math.max(0, moveX), rect.width)
        // 滑动百分比 0 ~ 1
        this.rate = moveX / rect.width
        this.setSlideBlockPostion()

        // 将比例向外传递
        this.options.onChange && this.options.onChange(this, this.rate, event)
      }
    }
    document.addEventListener('touchmove', this.onTouchMove)

    // touchend
    this.onTouchEnd = (event) => {
      if (this.isMouseDown) {
        // 完成时，向外传递完成的信息
        if (this.options.finish) {
          const result = this.options.finish(this, this.rate)
          // 验证结果是否成功
          if (result) {
            this.valideSuccess()
          } else {
            this.validefail()
          }
        }
        this.validefail()
        this.options.onEnd && this.options.onEnd(this.rate, event)
      }
      this.isMouseDown = false
    }
    document.addEventListener('touchend', this.onTouchEnd)
  }

  // 验证成功
  public valideSuccess() {
    this.state = State.SUCCESS
    this.slideBlockEl.style.display = 'none'
    this.slideMovedEl.style.display = 'none'
    this.slideTipEl.style.display = 'none'
    this.validateSucEl.style.display = 'flex'
  }

  // 验证失败
  public validefail() {
    this.state = State.FAIL
    this.slideBlockEl.classList.add('fail')
    this.slideMovedEl.classList.add('fail')
  }


  public reset() {
    this.state = State.IDLE
    this.slideBlockEl.classList.remove('fail')
    this.slideMovedEl.classList.remove('fail')

    this.slideBlockEl.style.display = 'flex'
    this.slideMovedEl.style.display = 'flex'
    this.slideTipEl.style.display = 'flex'
    this.validateSucEl.style.display = 'none'

    this.rate = 0
    this.setSlideBlockPostion()
  }

  // * 销毁实例
  public destory() {
    // 解绑事件
    this.unbindingEvents()
    // 初始化值
    this.reset()
    // 移除元素
    if (this.slideWrapperEl && this.slideWrapperEl.parentNode) {
      this.slideWrapperEl.parentNode.removeChild(this.slideWrapperEl)
    }
    if (this.styleEl && this.styleEl.parentNode) {
      this.styleEl.parentNode.removeChild(this.styleEl)
    }
  }

  public unbindingEvents() {
    if (typeof document['ontouchstart'] !== 'undefined') {
      // * mobile
      document.removeEventListener('touchstart', this.onTouchStart)
      document.removeEventListener('touchmove', this.onTouchMove)
      document.removeEventListener('touchend', this.onTouchEnd)
    } else {
      // * pc
      document.removeEventListener('mousedown', this.onMouseDown)
      document.removeEventListener('mousemove', this.onMouseMove)
      document.removeEventListener('mouseup', this.onMouseUp)
    }
  }


  public setSlideBlockPostion() {
    // 滑块宽度
    const slideBlockWidth = this.slideBlockEl.offsetWidth
    // 父容器的宽度
    const slideWrapperWidth = this.slideWrapperEl.offsetWidth - 2
    // 容器左边的距离 [0, slideWrapperWidth - slideBlockWidth]
    const left = (slideWrapperWidth - slideBlockWidth) * this.rate
    this.slideMovedEl.style.width = left + slideBlockWidth / 2 + 'px'
    this.slideBlockEl.style.left = left + 'px'
  }


  // 创建样式
  public createStyles() {
    const styleEl = document.createElement('style')
    styleEl.innerHTML = `
					@font-face {
					  font-family: "captcha-slider-iconfont"; /* Project id 3734199 */
					  src: url('//at.alicdn.com/t/c/font_3734199_5kjacpterpd.woff2?t=1666878445141') format('woff2'),
					       url('//at.alicdn.com/t/c/font_3734199_5kjacpterpd.woff?t=1666878445141') format('woff'),
					       url('//at.alicdn.com/t/c/font_3734199_5kjacpterpd.ttf?t=1666878445141') format('truetype');
					}

					.captcha-slider-iconfont {
					  font-family: "captcha-slider-iconfont" !important;
					  font-size: 16px;
					  font-style: normal;
					  -webkit-font-smoothing: antialiased;
					  -moz-osx-font-smoothing: grayscale;
					}

					.icon-shuaxin:before {
					  content: "\\e62a";
					}

					.icon-loading:before {
					  content: "\\e644";
					}

					.icon-duihao:before {
					  content: "\\eaf1";
					}

					.icon-guanbicuowu:before {
					  content: "\\e62f";
					}

					.icon-youfanyeyouhua:before {
					  content: "\\e76e";
					}

					.icon-shuaxin1:before {
					  content: "\\e692";
					}
				   .captcha_slide_wrapper {
						width: 220px;
						height: 38px;
						border: 1px solid #13cbb9;
						border-radius: 6px;
						background-color: #F3F7FA;
						/*display: flex;*/
						position: relative;
						user-select: none;
					}
					.captcha_slide_block {
						width: 38px;
						border-radius: 6px;
						height: 38px;
						background-color: #13cbb9;
						position: absolute;
						left: 0;
						top: 0;
						display: flex;
						align-items: center;
						justify-content: center;
						color: #ffffff;
						cursor: pointer;
					}
					.captcha_slide_block_right {
						font-size: 18px;
					}
					.captcha_slide_block_fail {
						font-size: 18px;
						display: none;
					}
					.captcha_slide_block.fail {
						background-color: #f15858;
					}
					.captcha_slide_block.fail .captcha_slide_block_right {
						display: none;
					}
					.captcha_slide_block.fail .captcha_slide_block_success {
						display: none;
					}
					.captcha_slide_block.fail .captcha_slide_block_fail {
						display: block;
					}

					.captcha_slide_success {
						margin-right: 10px;
					}

					.captcha_slide_moved {
						background-color: #1ee1ce;
						width: 0;
						height: 38px;
						position: absolute;
						left: 0;
						top: 0;
					}
					.captcha_slide_moved.fail {
						background-color: #f79f9f;
					}
					.captcha_slide_tip {
						font-size: 14px;
						color: #999;
						width: 100%;
						height: 100%;
						display: flex;
						align-items: center;
						justify-content: center;

					    /* 这里可以随意加样式 */
					    background: #999 linear-gradient(
					        -135deg,
					        transparent 0%,
					        transparent 25%,
					        #13cbb9 25%, /* 这两个值是滑动条的颜色 */
					        #13cbb9 60%, /* 默认是绿色 自己更改即可 */
					        transparent 60%,
					        transparent
				        );
					    background-size: 60px 60px;
					    background-repeat: no-repeat;
					    -webkit-background-clip: text;
					    -webkit-text-fill-color: transparent;
					    animation: scratchy 3s linear infinite;

					}
					.captcha_slide_valide_success {
						font-size: 14px;
						color: #13cbb9;
						width: 100%;
						height: 100%;
						display: flex;
						align-items: center;
						justify-content: center;
						background-color: #F3F7FA;
						display: none;
					}

					@keyframes scratchy {
					    0% {
					        background-position: -100% 0;
					    }
					    100% {
					        background-position: 130% 0;
					    }
					}
				`
    this.styleEl = styleEl
    document.head.appendChild(styleEl)
  }
}
