import { CaptchaCavans } from "./captchaCavans"
import { CaptchaSlider } from "./captchaSlider"

/**
 * @name
  * el 容器 String、Element (必传)
  * vailadeValue: Number 验证容错偏差值 默认5个像素偏差即认为验证通过
  * picList： String[] 图片地址list
  * onSuccess: Function 验证成功时回调
  * onFail: Function 验证失败时回调
  * onStart: Function 开始点击时回调
  * onChange: Function 开始滑动时回调 （获取鼠标运动轨迹可以在这里获取）
  * onEnd: Function 结束滑动时回调
  * vaildResultShowTime: Number （单位ms） 验证结果展示事件 默认1500ms
  * showReload Boolean 是否显示右上角重新加载按钮 (默认true)
  * slideSizeRate: Number 滑块尺寸比率： 滑块实际尺寸 = 容器width * slideSizeRate； 范围 [0.01, 0.3] 默认0.1
 */
export type CaptchaOptions = {
  el: HTMLElement
  vailadeValue: number
  picList: string[]
  onSuccess: (rate: number) => void
  onFail: (rate: number) => void
  onStart: () => void
  onChange: (rate: number, event: Event) => void
  onEnd: () => void
  vaildResultShowTime: number
  showReload: boolean
  slideSizeRate: number
}
export class Captcha {
  public options: CaptchaOptions
  public captchaCavans!: CaptchaCavans | null
  public captchaSlider!: CaptchaSlider | null

  constructor(options: CaptchaOptions) {
    this.options = options
    this.init();
  }


  public reset(options: CaptchaOptions) {
    // 判断options是佛存在？ 存在也使用新的options，不存在则使用旧的options
    if (typeof options === 'object' && options !== null) {
      this.options = this.valideOptions(options)
    }
    // 先销毁
    this.destory()
    // 创建Canvas 和 Slider示例
    this.init()
  }

  private init() {
    this.captchaCavans = new CaptchaCavans({
      el: this.options.el,
      picList: this.options.picList,
      vailadeValue: this.options.vailadeValue,
      showReload: this.options.showReload,
      slideSizeRate: this.options.slideSizeRate
    })

    this.captchaSlider = new CaptchaSlider({
      el: this.options.el,
      onStart: this.options.onStart,
      onEnd: this.options.onEnd,
      onChange: (_, rate, event) => {
        this.options.onChange(rate, event)
        // * 滑动的时候更改图片位置
        this.captchaCavans && this.captchaCavans.moveDraw(rate)
      },
      finish: (_, rate) => {
        const result = this.captchaCavans!.valide()
        if (result) {
          this.captchaSlider!.valideSuccess()
          this.options.onSuccess(rate)
        } else {
          this.captchaSlider!.validefail()
          this.options.onFail(rate)
          setTimeout(() => {
            // 加载下一个图片
            this.loadNextImage()
          }, this.options.vaildResultShowTime)
        }
      }
    })
  }

  // 销毁
  public destory() {
    if (this.captchaSlider) {
      this.captchaSlider.destory()
      this.captchaSlider = null
    }


    if (this.captchaCavans) {
      this.captchaCavans.destory()
      this.captchaCavans = null
    }

  }
  // 重置并加载下一个图片
  public loadNextImage() {
    // 设置下一个图片索引
    this.captchaCavans!.setNextImageIndex()
    // 绘制图片
    this.captchaCavans!.loadImage()
    this.captchaSlider!.reset()
  }

  private valideOptions(options: CaptchaOptions) {
    if (!options.el) {
      throw TypeError(`CaptchaSlider options el param must be [String、 Element]`)
    } else {
      if (typeof options.el === 'string') {
        options.el = document.querySelector(options.el)!
      }
    }
    options.onStart = options.onStart || function () { }
    options.onChange = options.onChange || function () { }
    options.onEnd = options.onEnd || function () { }
    options.onSuccess = options.onSuccess || function () { }
    options.onFail = options.onFail || function () { }
    options.vaildResultShowTime = typeof options.vaildResultShowTime === 'number' ? options.vaildResultShowTime : 1500
    return options
  }

}
