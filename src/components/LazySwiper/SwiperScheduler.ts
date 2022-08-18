import {getSafeIndex, getStepValue, getTargetIndex, sleep} from "./utils";

/**
 * 有 originArray: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
 *
 * 有 containerIndex 为输出数据核心数的索引（其他数据以此索引的位置为中心去分配索引位置）
 * 有 dataIndex 为 源数据 索引
 * 有 minLen 为 输出数组的 最小长度
 *
 *  已知
 *    0 <= containerIndex < output.len, 且 containerIndex <= dataIndex, 且 containerIndex % minLen === dataIndex % minLen;
 *  且 minLen 为奇数， 3 <= minLen < 10
 *  且 minLen <= output.len <= 2minLen - 1 （当最后一组数量不足 minLen 时，合并到上一组）
 *
 *
 *  containerIndex = 0 && dataIndex = 0 && minLen = 5 时
 * 输出：[1, 2, 3, 4, 5]
 * containerIndex = 1 && dataIndex = 1 && minLen = 5 时
 * 输出：[1, 2, 3, 4, 5]
 * containerIndex = 2 && dataIndex = 2 && minLen = 5 时
 * 输出：[1, 2, 3, 4, 5]
 * containerIndex = 3 && dataIndex = 3 && minLen = 5 时
 * 输出：[6, 2, 3, 4, 5]
 * containerIndex = 4 && dataIndex = 4 && minLen = 5 时
 * 输出：[6, 7, 3, 4, 5]
 * containerIndex = 0 && dataIndex = 5 && minLen = 5 时
 * 输出：[6, 7, 8, 4, 5]
 * containerIndex = 1 && dataIndex = 6 && minLen = 5 时
 * 输出：[6, 7, 8, 9, 5]
 * containerIndex = 2 && dataIndex = 7 && minLen = 5 时
 * 输出：[6, 7, 8, 9, 10]
 * containerIndex = 3 && dataIndex = 8 && minLen = 5 时
 * 输出：[6, 7, 8, 9, 10, 11]
 * containerIndex = 4 && dataIndex = 9 && minLen = 5 时
 * 输出：[6, 7, 8, 9, 10, 11, 12]
 * containerIndex = 5 && dataIndex = 10 && minLen = 5 时
 * 输出：[6, 7, 8, 9, 10, 11, 12, 13]
 * containerIndex = 6 && dataIndex = 11 && minLen = 5 时
 * 输出：[6, 7, 8, 9, 10, 11, 12, 13]
 * containerIndex = 7 && dataIndex = 12 && minLen = 5 时
 * 输出：[6, 7, 8, 9, 10, 11, 12, 13]
 */


interface SwiperSchedulerParams<T> {
  /**
   * 最小输出数组长度
   *
   */
  minCount?: number

  dataSource: T[]

  defaultMarkIndex?: number

  loop?: boolean

  onRestart?: (swiperIndex: number, key: string) => void

  onSwiperIndexChange?: (swiperIndex: number, markIndex: number) => void

  onSwiperSourceChange?: (source: T[]) => void

  duration?: number
}

class SwiperScheduler<T> {

  dataSource: T[]

  minCount: number;
  swiperIndex = 0;

  markIndex = 0;

  markIndexOfDelay = 0;

  step = 0;

  loop = true

  duration = 500

  source: T[] = []
  /**
   * 当前的索引映射： swiperIndex: markIndex
   */
  indexMapping = new Map<number, number>()


  onRestart: SwiperSchedulerParams<T>['onRestart']

  onSwiperIndexChange: SwiperSchedulerParams<T>['onSwiperIndexChange']

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
    return this.dataSource.length - 1
  }

  get minMiddleCount() {
    // 最小为2
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
    console.log(localSwiperIndex, 'localSwiperIndex')

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
    this.dataSource = value
    return this.recompute() || []
  }


  public nextSection() {
    return this.offsetSection(1)
  }

  public nextSectionAsync() {
    return this.offsetSectionAsync(1)
  }

  public prevSection() {
    return this.offsetSection(-1)
  }

  public prevSectionAsync() {
    return this.offsetSectionAsync(-1)
  }

  public setup(params: Partial<SwiperSchedulerParams<T>>) {
    const {
      minCount = 3,
      dataSource = [],
      defaultMarkIndex = 0,
      loop = false,
      duration = 300,
      onRestart,
      onSwiperIndexChange,
      onSwiperSourceChange
    } = params

    this.dataSource = dataSource
    this.minCount = minCount;
    this.loop = loop
    this.setMarkIndex(defaultMarkIndex)

    this.onRestart = onRestart
    this.onSwiperIndexChange = onSwiperIndexChange
    this.onSwiperSourceChange = onSwiperSourceChange

    this.duration = duration

    this.recompute()
  }


  /**
   * 判断当前swiperIndex是否是active状态
   * @param index
   */
  public getActiveStatusBySwiperIndex(index: number) {
    const targetMarkIndex = this.indexMapping.get(index);
    return this.markIndexOfDelay === targetMarkIndex
  }

  public recompute() {
    if (!this.dataSource.length) return []
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

    console.log(step, 'toSection')
    //
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

  public async offsetSectionAsync(step: number) {
    const result = this.offsetSection(step)
    await sleep(this.duration)
    return result
  }

  private setMarkIndex(markIndex: number) {
    const preMarkIndex = this.markIndex
    const getIndex = this.loop ? getTargetIndex : getSafeIndex
    this.markIndex = getIndex(markIndex, this.maxMarkIndex)

    if (!this.loop && Math.abs(this.markIndex - preMarkIndex) > 1) {
      // 先计算出数据源， 方便后续的 swiperIndex 计算
      this.recompute()

      this.onRestart?.(
        this.swiperIndex,
        Date.now().toString(36).slice(0, 8)
      )
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
      this.onSwiperIndexChange?.(this.swiperIndex, this.markIndex)
    }

    return this.swiperIndex
  }

  private setSource(source: T[]) {
    this.source = source
    this.onSwiperSourceChange?.(this.source)
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
    console.log({
      lastGroupMaxCount,
      groupSize,
      swiperIndex: this.swiperIndex,
      minMiddleCount: this.minMiddleCount
    }, 'lastGroupMaxCount')

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
//
// const options = [
//   {
//     markIndex: 0,
//     minCount: 5,
//     containerIndex: 0,
//     output: [1, 2, 3, 4, 5]
//   },
//   {
//     markIndex: 1,
//     minCount: 5,
//     containerIndex: 1,
//     output: [1, 2, 3, 4, 5]
//   },
//   {
//     markIndex: 2,
//     minCount: 5,
//     containerIndex: 2,
//     output: [1, 2, 3, 4, 5]
//   },
//   {
//     markIndex: 3,
//     minCount: 5,
//     containerIndex: 3,
//     output: [6, 2, 3, 4, 5]
//   },
//   {
//     markIndex: 4,
//     minCount: 5,
//     containerIndex: 4,
//     output: [6, 7, 3, 4, 5]
//   },
//   {
//     markIndex: 5,
//     minCount: 5,
//     containerIndex: 0,
//     output: [6, 7, 8, 4, 5]
//   },
//   {
//     markIndex: 6,
//     minCount: 5,
//     containerIndex: 1,
//     output: [6, 7, 8, 9, 5]
//   },
//   {
//     markIndex: 7,
//     minCount: 5,
//     containerIndex: 2,
//     output: [6, 7, 8, 9, 10]
//   },
//   {
//     markIndex: 8,
//     minCount: 5,
//     containerIndex: 3,
//     output: [6, 7, 8, 9, 10, 11]
//   },
//   {
//     markIndex: 9,
//     minCount: 5,
//     containerIndex: 4,
//     output: [6, 7, 8, 9, 10, 11, 12]
//   },
//   {
//     markIndex: 10,
//     minCount: 5,
//     containerIndex: 5,
//     output: [6, 7, 8, 9, 10, 11, 12, 13]
//   },
//   {
//     markIndex: 11,
//     minCount: 5,
//     containerIndex: 6,
//     output: [6, 7, 8, 9, 10, 11, 12, 13]
//   },
//   {
//     markIndex: 12,
//     minCount: 5,
//     containerIndex: 7,
//     output: [6, 7, 8, 9, 10, 11, 12, 13]
//   },
// ].map(v => ({...v, output: v.output.map(String)}))


// const markIndex = 11
// swiperScheduler.setMarkIndex(markIndex)
//
// console.log(options.find(v => v.markIndex === markIndex)?.containerIndex === swiperScheduler.swiperIndex, '2333')


// console.log(options.reduce((result, item) => {
//   result[item.markIndex] = item.containerIndex
//   return result
// }, {} as any))

// options.every(item => {
//   const result = swiperScheduler.setMarkIndex(item.markIndex)
//   if (JSON.stringify(result) !== JSON.stringify(item.output)) {
//     console.log(item, result, 'options - test')
//     return false
//   }
//
//   return true
// })


// const source = swiperScheduler.setMarkIndex(9)
// console.log('===========================')
