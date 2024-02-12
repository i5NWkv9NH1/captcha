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
type CaptchaOptions = {
  el: HTMLElement
}
export class Captcha {
  public options: CaptchaOptions

  constructor(opts: CaptchaOptions) {
    this.options = opts
  }
}
