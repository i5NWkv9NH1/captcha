export type CaptchaCavansOptions = {
  el: HTMLElement | null
  picList: string[]
  vailadeValue: number
  showReload: boolean
  slideSizeRate: any
}


export class CaptchaCavans {
  public context!: CanvasRenderingContext2D | null
  public canvasEl!: HTMLCanvasElement | null
  public imgEl!: HTMLImageElement | null

  public styleEl!: HTMLStyleElement
  public canvasWrapperEl!: HTMLDivElement
  public loadingWrapperEl!: HTMLDivElement
  public reloadWrapperEl!: HTMLDivElement


  public rectRate: number
  public key: string
  public scale: number[]
  public deg: number
  public slideWidth: number
  public slidHeight: number
  public r: number
  public jx: number
  public kx: number
  public targetSlidePosition: number[]
  public slideX: number
  public imageIndex: number

  public VAILIDE_VALUE: number
  public showReload: boolean
  public slideSizeRate: number

  // * events
  public onClick!: () => void

  public options: CaptchaCavansOptions
  constructor(options: CaptchaCavansOptions) {
    // *主canvas元素
    this.canvasEl = null
    // *主画布context对象
    this.context = null
    // *canvas画布的 纵横比
    this.rectRate = 3 / 5
    // *唯一key
    this.key = ''
    // *图片要在画布上铺满，所需要在横纵方向上缩放的倍数
    this.scale = [1, 1] // *比如 600 * 300 的图片，要在 300 * 180的画布上显示，需要缩放倍数 scale = [300 / 600, 180 / 300]

    // *滑块的圆心和边框连线的夹角度数
    this.deg = 45
    // *滑块正方形的宽度 画布宽度的 1 / 10
    this.slideWidth = 50
    // *滑块正方形的高度 （不包含漏出在外面的圆的部分）
    this.slidHeight = 50
    // *计算出内圆的半径 计算公式 r = slideWidth * (2 / 5) / 2
    this.r = 10
    // *计算出圆与边框相交的长度的一半 计算公式 jx = Math.cos(deg / 180 * Math.PI) * r
    this.jx = Math.cos(this.deg / 180 * Math.PI) * this.r
    // *从相交的边线与原点之间的最小距离 计算公式 kx = Math.sin(deg / 180 * Math.PI) * r
    this.kx = Math.sin(this.deg / 180 * Math.PI) * this.r
    // *目标滑块绘制的坐标
    this.targetSlidePosition = [0, 0]
    // *滑动滑块时 滑块水平方向的横坐标
    this.slideX = 0
    // *当前正在使用的image图片的索引
    this.imageIndex = 0
    // *img对象
    this.imgEl = null
    // *校验成功的值 目标元素和触发元素横向坐标的差值 小于等于 VAILIDE_VALUE 时，我们判断为成功
    this.VAILIDE_VALUE = 5
    // *是否显示右上角reload图标
    this.showReload = true
    // *滑块尺寸比率： 滑块实际尺寸 = 容器width * slideSizeRate； 范围 [0.01, 0.3] 默认0.1
    this.slideSizeRate = 0.1


    //#region el
    if (!options.el) {
      throw TypeError(``)
    } else {
      if (typeof options.el === 'string') {
        options.el = document.querySelector(options.el)
      }
    }
    //#endregion

    //#region pics
    if (!Array.isArray(options.picList) || options.picList.length <= 0) {
      options.picList = [
        'http://121.5.230.70/images/home.jpg',
        'http://121.5.230.70/images/article_default.jpg'
      ]
    }
    //#endregion

    if (typeof options.vailadeValue === 'number') {
      this.VAILIDE_VALUE = options.vailadeValue
    }

    if (typeof options.showReload === 'boolean') {
      this.showReload = options.showReload
    }

    if (typeof options.slideSizeRate === 'number') {
      if (options.slideSizeRate < 0.01 || options.slideSizeRate > 0.3) {
        throw TypeError(`CaptchaSlider options slideSizeRate param range is 0.01 ~ 0.3`)
      }
      this.slideSizeRate = options.slideSizeRate
    }

    this.options = options
    this.init()
  }


  public init() {
    this.key = this.createKey()
    this.createElement()
    this.initValue()
    // 加载图片并且绘制图像
    this.loadImage()
    // 绑定事件
    this.bindingEvents()
  }

  public createElement() {
    if (!this.options.el) {
      throw Error('')
    }

    this.createStyle()

    const canvasWrapperEl = document.createElement('div')
    canvasWrapperEl.setAttribute('class', 'captcha_canvas_wrapper')
    canvasWrapperEl.setAttribute('captcha-canvas', this.key)
    canvasWrapperEl.setAttribute('style', 'position: relative; border-radius: 6px; overflow: hidden; margin-bottom: 10px; font-size: 0px;')

    const canvas = document.createElement('canvas')
    canvas.setAttribute('captcha-canvas', this.key)
    canvas.setAttribute('style', 'border-radius: 6px;')

    const { width } = this.options.el?.getBoundingClientRect()
    canvas.width = width
    canvas.height = width * this.rectRate

    this.canvasEl = canvas
    this.context = canvas.getContext('2d') as CanvasRenderingContext2D

    if (this.showReload) {
      const reloadWrapperEl = this.createReloadElement()
      canvasWrapperEl.appendChild(reloadWrapperEl)
    }

    const loadingEl = this.createLoadingElement()
    canvasWrapperEl.appendChild(canvas)
    canvasWrapperEl.appendChild(loadingEl)
    this.canvasWrapperEl = canvasWrapperEl
    this.options.el.appendChild(canvasWrapperEl)
  }

  public createLoadingElement(): HTMLElement {
    // * parent
    const loadingWrapperEl = document.createElement('div')
    loadingWrapperEl.setAttribute('class', 'captcha_canvas_loading_box')
    loadingWrapperEl.setAttribute('captcha-canvas', this.key)
    loadingWrapperEl.setAttribute('style', 'position: absolute; left: 0; top: 0; width: 100%; height: 100%; z-index: -1; background-color: #dddddd; display: flex; justify-content:center; align-items: center;')
    // * content
    const loadingEl = document.createElement('i')
    loadingEl.setAttribute('class', 'captcha-slider-iconfont icon-loading captcha_canvas_loading')
    loadingEl.setAttribute('style', 'color: #ffffff; font-size: 38px; animation: captcha_loading infinite 2s linear;')

    loadingWrapperEl.appendChild(loadingEl)
    this.loadingWrapperEl = loadingWrapperEl

    return loadingWrapperEl
  }
  public createReloadElement(): HTMLElement {
    const reloadWrapperEl = document.createElement('div')
    reloadWrapperEl.setAttribute('class', 'captcha_canvas_reload_box')
    reloadWrapperEl.setAttribute('captcha-canvas', this.key)
    reloadWrapperEl.setAttribute('style', 'position: absolute; right: 0; top: 0; padding: 10px; display: flex; justify-content:center; align-items: center; cursor: pointer;')

    const reloadEl = document.createElement('i')
    reloadEl.setAttribute('class', 'captcha-slider-iconfont icon-shuaxin')
    reloadEl.setAttribute('style', 'color: #ffffff; font-size: 20px;')
    reloadWrapperEl.appendChild(reloadEl)
    this.reloadWrapperEl = reloadWrapperEl

    return reloadWrapperEl
  }


  public bindingEvents() {
    if (!this.showReload) return
    const reloadEl = document.querySelector(`.captcha_canvas_reload_box[captcha-canvas="${this.key}"]`)
    this.onClick = () => {
      this.loadImage()
    }
    reloadEl!.addEventListener('click', this.onClick)
  }

  public loadImage() {
    this.canvasEl!.style.opacity = '0'
    this.imgEl = new Image()
    this.imgEl.src = this.options.picList[this.imageIndex]
    this.imgEl.onload = () => {
      // 设置滑动滑块的初始位置
      this.slideX = 0
      // 随机生成滑块的位置
      this.getRandomPosition()
      // 初始化绘制图像
      this.initDraw()
      // 显示canvas
      this.canvasEl!.style.opacity = '1'
    }
    this.imgEl.onerror = () => {
      this.loadingWrapperEl.innerHTML = `
				<span style="color: #999; font-size: 14px;">图片加载失败</span>
			`
    }
  }

  public initDraw() {
    // 设置滑动滑块的初始位置
    this.slideX = 0
    // 随机生成滑块的位置
    this.getRandomPosition()
    // 绘制图像
    this.draw()
  }

  // 移动绘制 rate是移动比率 0~1
  public moveDraw(rate: number) {
    const width = this.canvasEl!.width - (this.slideWidth + this.kx + this.r)
    this.slideX = width * rate
    this.draw()
  }
  public getRandomPosition(): number[] {
    // 画布的宽高
    const { width, height } = this.canvasEl!
    // 滑块的宽高
    const sWidth = this.slideWidth + this.kx + this.r
    const sHeight = this.slidHeight
    // 横向范围
    const x = Math.random() * (width - 2 * sWidth - 30) + sWidth + 30  // [this.slideWidth + 30, this.canvas.width - this.slideWidth)
    const y = Math.random() * (height - sHeight) // [0, this.canvas.height - this.slidHeight)
    this.targetSlidePosition = [x, y]
    return [x, y]
  }

  // 画图像、 画目标滑块、 画滑动滑块
  public draw() {
    if (!this.context) return
    if (!this.canvasEl) return
    if (!this.imgEl) return
    this.context.clearRect(0, 0, this.canvasEl.width, this.canvasEl.height)
    this.scale = [this.canvasEl.width / this.imgEl.width, this.canvasEl.height / this.imgEl.height]
    this.context.drawImage(this.imgEl, 0, 0, this.canvasEl.width, this.canvasEl.height)
    // 获取随机位置
    const [x, y] = this.targetSlidePosition
    // 画目标位置的滑块
    this.drawSlider(this.context, x, y)
    this.context.fillStyle = 'rgba(255,255,255, .2)'
    this.context.fill()

    // 创建canvas 滑块, 并将img图像设置到canvas上
    const canvas = this.drawTargetSlider(x, y)
    this.context.drawImage(canvas, this.slideX, y)
  }

  /**
 * 画滑块
 * context 要画的context
 * x: 开始横坐标位置
 * y: 开始纵坐标位置
 */
  public drawSlider(context: CanvasRenderingContext2D, x: number, y: number) {
    const { slideWidth: w, slidHeight: h, jx, kx, r } = this
    context.beginPath()
    // 左下角
    context.moveTo(x, y + h)
    context.lineTo(x + (w / 2 - jx), y + h)
    context.arc(x + w / 2, y + h - kx, r, (3 / 4) * Math.PI, (1 / 4) * Math.PI)
    context.lineTo(x + w, y + h)
    context.lineTo(x + w, y + h - (w / 2 - jx))
    context.arc(x + w + jx, y + h / 2, r, (3 / 4) * Math.PI, (5 / 4) * Math.PI, true)
    context.lineTo(x + w, y)
    context.lineTo(x, y)
    context.closePath()
    context.strokeStyle = 'rgba(255,255,255, .8)'
    context.stroke()
  }
  /*
  * 创建触发滑块
  * w 滑块宽度
  * h 滑块高度
  * deg 夹角角度
  * sx 裁剪位置x（缩放后的位置，也就是canvas的图片位置）
  * sx 裁剪位置y（缩放后的位置，也就是canvas的图片位置）
  * scale 缩放比例 [横向缩放比例，纵向缩放比例]
  */
  public drawTargetSlider(sx: number, sy: number) {
    const { slideWidth: w, slidHeight: h, kx, r, scale } = this
    const canvas = document.createElement('canvas')
    canvas.width = w + kx + r
    canvas.height = h
    const context = canvas.getContext('2d')!
    this.drawSlider(context, 0, 0)
    context.clip()

    // 计算出在img上截取的位置以及宽高
    context.drawImage(this.imgEl!, sx / scale[0], sy / scale[1], canvas.width / scale[0], canvas.height / scale[1], 0, 0, canvas.width, canvas.height)
    // 画边缘线
    context.strokeStyle = 'rgba(255,255,255, .8)'
    context.stroke()
    return canvas
  }

  // 校验结果是否成功
  public valide() {
    const v = Math.abs(this.slideX - this.targetSlidePosition[0])
    // 成功
    if (v <= this.VAILIDE_VALUE) {
      this.slideX = this.targetSlidePosition[0]
      this.draw()
      return true
    } else {
      // this.setNextImageIndex()
      return false
      // 失败
      // setTimeout(() => {
      // 	this.imageIndex = this.imageIndex + 1 >= this.options.picList.length ? 0 : this.imageIndex + 1
      // 	this.initDraw()
      // 	reject(false)
      // }, 2000)
    }
  }


  public destory() {
    if (this.showReload) {
      // 解绑事件
      const reloadEl = document.querySelector(`.captcha_canvas_reload_box[captcha-canvas="${this.key}"]`) as HTMLDivElement
      reloadEl.removeEventListener('click', this.onClick)
    }
    // 初始化一些数据
    this.initValue()
    // 移除元素
    this.canvasWrapperEl && this.canvasWrapperEl.parentNode!.removeChild(this.canvasWrapperEl)
    this.styleEl && this.styleEl.parentNode!.removeChild(this.styleEl)
  }

  // 初始化一些数据
  public initValue() {
    this.slideX = 0
    this.imageIndex = 0
    // 设置滑块的宽高
    this.slideWidth = this.slidHeight = this.canvasEl!.width * this.slideSizeRate
    // 计算出内圆的半径 计算公式 r = slideWidth * (2 / 5) / 2
    this.r = this.slideWidth * (2 / 5) / 2
    // 计算出圆与边框相交的长度的一半 计算公式 jx = Math.cos(deg / 180 * Math.PI) * r
    this.jx = Math.cos(this.deg / 180 * Math.PI) * this.r
    // 从相交的边线与原点之间的最小距离 计算公式 kx = Math.sin(deg / 180 * Math.PI) * r
    this.kx = Math.sin(this.deg / 180 * Math.PI) * this.r
  }


  public setNextImageIndex() {
    this.imageIndex = this.imageIndex + 1 >= this.options.picList.length ? 0 : this.imageIndex + 1
  }

  public createKey() {
    const getHex = () => Number.parseInt(String(Math.random() * 256)).toString(16).padStart(2, '0')
    return `${getHex()}${getHex()}${getHex()}-${Date.now()}`
  }

  public createStyle() {
    const style = document.createElement('style')
    style.setAttribute('captcha-canvas', this.key)
    style.innerHTML = `
			@keyframes captcha_loading {
				0% {
					transform: rotate(0deg);
				}
				100% {
					transform: rotate(360deg);
				}
			}
		`
    this.styleEl = style
    document.head.appendChild(style)
  }
}
