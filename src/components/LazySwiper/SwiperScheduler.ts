import equal from 'fast-deep-equal'

import {getSafeIndex, getStepValue, getTargetIndex} from "./utils";

export interface SwiperSchedulerParams<T> {
  /**
   * 最小输出数组长度
   *
   */
  minCount?: number

  dataSource?: T[]

  defaultMarkIndex?: number

  loop?: boolean

  onRestart?: (detail: {swiperIndex: number, markIndex: number, key: string, source: T[]}) => void

  onSwiperIndexChange?: (detail: {swiperIndex: number, markIndex: number}) => void
  onBeforeSwiperIndexChange?: () => void
  onSwiperSourceChange?: (source: T[]) => void
  onMarkIndexChange?: (detail: { markIndex:number }) => void
}

class SwiperScheduler<T> {

  dataSource: T[]

  minCount: number;
  swiperIndex = 0;

  markIndex = 0;

  markIndexOfDelay = 0;

  loop = true

  source: T[] = []
  /**
   * 当前的索引映射： swiperIndex: markIndex
   */
  indexMapping = new Map<number, number>()


  onRestart: SwiperSchedulerParams<T>['onRestart']


  onMarkIndexChange: SwiperSchedulerParams<T>['onMarkIndexChange']

  onSwiperIndexChange: SwiperSchedulerParams<T>['onSwiperIndexChange']
  onBeforeSwiperIndexChange: SwiperSchedulerParams<T>['onBeforeSwiperIndexChange']

  onSwiperSourceChange: SwiperSchedulerParams<T>['onSwiperSourceChange']

  constructor(params: SwiperSchedulerParams<T>) {

    this.setup(params)
  }

  get maxSwiperIndex() {

    if (this.source.length) {
      return this.source.length - 1
    }

    return this.minCount - 1;
  }

  get maxMarkIndex() {
    return Math.max(this.dataSource.length - 1, 0)
  }

  get minMiddleCount() {
    return Math.floor(this.minCount / 2)
  }

  get circular() {
    if (this.loop) return true
    // 使用 markIndexOfDelay 的原因是：如果使用 markIndex 及时更新，会导致swiper组件props变更，动画消失
    return this.markIndexOfDelay !== 0 && this.markIndexOfDelay !== this.maxMarkIndex
  }

  private get isFirstGroup() {
    return this.swiperIndex === this.markIndex && this.markIndex <= this.minMiddleCount
  }

  private get isLastGroup() {
    return this.maxMarkIndex - this.markIndex <= Math.max(this.minMiddleCount, 2)
  }

  computeSwiperIndex(step?: number) {
    if (this.loop) {
      return getTargetIndex(this.swiperIndex + (step || 0), this.maxSwiperIndex)
    }

    let localSwiperIndex = this.markIndex % this.minCount
    if (this.maxMarkIndex - this.markIndex <= this.minMiddleCount) {
      localSwiperIndex += this.minCount
    }

    console.log({
      localSwiperIndex,
      maxMarkIndex: this.maxMarkIndex,
      markIndex: this.markIndex
    }, 'localSwiperIndex')

    return localSwiperIndex
  }

  getIndexMapping() {

    if (!this.loop) {
      if (this.isFirstGroup) return this.getFirstGroupIndexMapping()
      if (this.isLastGroup) return this.getLastGroupIndexMapping()
    }

    const map = new Map<number, number>()
    map.set(this.swiperIndex, getTargetIndex(this.markIndex, this.maxMarkIndex))
    Array(this.minMiddleCount).fill(null).forEach((_, _index) => {
      const count = _index + 1;
      // 计算前后位置
      const prevSwiperIndex = getTargetIndex(this.swiperIndex - count, this.maxSwiperIndex)
      const nextSwiperIndex = getTargetIndex(this.swiperIndex + count, this.maxSwiperIndex)

      const prevMarkIndex = getTargetIndex(this.markIndex - count, this.maxMarkIndex)
      const nextMarkIndex = getTargetIndex(this.markIndex + count, this.maxMarkIndex)

      map.set(prevSwiperIndex, prevMarkIndex)
      map.set(nextSwiperIndex, nextMarkIndex)
    })

    return map
  }

  public updateDataSource(value: T[]) {
    if(equal(value, this.dataSource)) return this.dataSource

    this.dataSource = value
    // this.emitRestart()
    return this.recompute()
  }


  public nextSection() {
    return this.offsetSection(1)
  }

  public prevSection() {
    return this.offsetSection(-1)
  }

  public setup(params: Partial<SwiperSchedulerParams<T>>) {
    const {
      minCount = 3,
      dataSource = [],
      defaultMarkIndex = 0,
      loop = false,
      onRestart,
      onSwiperIndexChange,
      onSwiperSourceChange,
      onMarkIndexChange,
    } = params

    this.dataSource = dataSource
    this.minCount = minCount;
    this.loop = loop
    this.setMarkIndex(defaultMarkIndex)

    this.onRestart = onRestart
    this.onSwiperIndexChange = onSwiperIndexChange
    this.onSwiperSourceChange = onSwiperSourceChange
    this.onMarkIndexChange = onMarkIndexChange

    this.recompute()
  }


  /**
   * 判断当前swiperIndex是否是active状态
   * @param index
   */
  public getActiveStatusBySwiperIndex(index: number) {
    const targetMarkIndex = this.indexMapping.get(index);

    console.log(this.indexMapping, index, this.markIndexOfDelay, 'indexMapping')

    return this.markIndexOfDelay === targetMarkIndex
  }

  public recompute() {
    if (!this.dataSource.length) return []
    console.log(this.dataSource, '233333')

    this.setSwiperIndex(
      this.computeSwiperIndex()
    )
    this.setSource(
      this.computeSource()
    )
    this.updateMarkIndexOfDelay()

    return this.source
  }

  public toSection(markIndex: number) {
    const step = getStepValue(this.markIndex, markIndex, this.maxMarkIndex, this.loop)

    if (Math.abs(step) === 1) {
      return this.offsetSection(step)
    }

    this.setMarkIndex(
      getSafeIndex(markIndex, this.maxMarkIndex)
    )

    this.setSwiperIndex(
      this.computeSwiperIndex()
    )

    return {
      swiperIndex: this.swiperIndex,
      markIndex: this.markIndex
    }
  }

  public offsetSection(step: number) {

    this.setMarkIndex(
      this.markIndex + step
    )

    this.setSwiperIndex(
      this.computeSwiperIndex(step)
    )

    return {
      swiperIndex: this.swiperIndex,
      markIndex: this.markIndex
    }
  }


  emitRestart(){
    this.onRestart?.({
      swiperIndex: this.swiperIndex,
      markIndex: this.markIndex,
      key:Date.now().toString(36).slice(0, 8),
      source: this.source
    })
  }

  emitSwiperIndexChange(){
    this.onSwiperIndexChange?.({
      swiperIndex: this.swiperIndex,
      markIndex: this.markIndex,
    })
  }

  emitMarkIndexChange(){
    console.log('emitMarkIndexChange')
    this.onMarkIndexChange?.({
      markIndex: this.markIndex
    })
  }

  private setMarkIndex(markIndex: number) {
    const preMarkIndex = this.markIndex
    const getIndex = this.loop ? getTargetIndex : getSafeIndex
    this.markIndex = getIndex(markIndex, this.maxMarkIndex);

    if(preMarkIndex !== this.markIndex)  this.emitMarkIndexChange()

    if (!this.loop && Math.abs(this.markIndex - preMarkIndex) > 1) {
      // 先计算出数据源， 方便后续的 swiperIndex 计算
      this.recompute()

      this.emitRestart()
    }

    if (this.loop && Math.abs(getStepValue(preMarkIndex, this.markIndex, this.maxMarkIndex)) > 1) {
      this.recompute()
    }


    return this.markIndex
  }


  private setSwiperIndex(swiperIndex: number) {
    const preSwiperIndex = this.swiperIndex
    this.swiperIndex = swiperIndex

    if (preSwiperIndex !== this.swiperIndex) {
      this.emitSwiperIndexChange()
    }

    return this.swiperIndex
  }

  private setSource(source: T[]) {
    if(equal(this.source, source)) return;
    this.source = source

    this.onSwiperSourceChange?.(this.source)
    return this.source
  }

  /**
   * 非 `loop` 模式时， 特殊处理第一组数据
   * @private
   */
  private getFirstGroupIndexMapping() {
    console.log('getFirstGroupIndexMapping')
    return new Map(Array(this.minCount).fill(null).map((_, v) => [v, v]))
  }

  private getLastGroupIndexMapping() {
    console.log('getLastGroupIndexMapping')

    const lastGroupMaxCount = this.dataSource.length % this.minCount + this.minCount
    const lastGroupMaxIndex = lastGroupMaxCount - 1;


    const groupSize = Math.min(this.swiperIndex + this.minMiddleCount, lastGroupMaxIndex) + 1;

    const startIndex = this.maxMarkIndex - lastGroupMaxIndex

    const map = new Map<number, number>()
    for (let i = 0; i < groupSize; i++) {
      const tempMarkIndex = startIndex + i;
      map.set(i, tempMarkIndex)
    }

    return map
  }

  private computeSource() {
    const indexMapping = this.getIndexMapping()

    this.indexMapping = indexMapping

    const arr: number[] = []
    for (const [key, value] of indexMapping) {
      arr[key] = value
    }

    return arr.map(index => this.dataSource[index])
  }

  private updateMarkIndexOfDelay() {
    this.markIndexOfDelay = this.markIndex
  }
}

export default SwiperScheduler
