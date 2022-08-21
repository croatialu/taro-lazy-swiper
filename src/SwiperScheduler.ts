import equal from 'fast-deep-equal'

import {getSafeIndex, getStepValue} from "./common/utils";
import Scheduler from './Scheduler';

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

class SwiperScheduler<T> extends Scheduler {

  public dataSource: T[]

  public markIndexOfDelay = 0;

  public source: T[] = []

  public onRestart: SwiperSchedulerParams<T>['onRestart']
  public onMarkIndexChange: SwiperSchedulerParams<T>['onMarkIndexChange']
  public onSwiperIndexChange: SwiperSchedulerParams<T>['onSwiperIndexChange']
  public onBeforeSwiperIndexChange: SwiperSchedulerParams<T>['onBeforeSwiperIndexChange']
  public onSwiperSourceChange: SwiperSchedulerParams<T>['onSwiperSourceChange']

  public constructor(params: SwiperSchedulerParams<T>) {
    super({
      dataCount: params.dataSource?.length || 0,
      loop: params.loop || false,
      defaultDataIndex: params.defaultMarkIndex,
      minCount: params.minCount || 3
    })
    this.setup(params)
  }

  public get circular() {
    if (this.loop) return true
    // 使用 markIndexOfDelay 的原因是：如果使用 markIndex 及时更新，会导致swiper组件props变更，动画消失
    return this.markIndexOfDelay !== 0 && this.markIndexOfDelay !== this.maxDataIndex
  }


  public updateDataSource(value: T[]) {
    if(equal(value, this.dataSource)) return this.dataSource

    this.dataSource = value
    this.updateCount(this.dataSource.length)
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
      dataSource = [],
      defaultMarkIndex = 0,
      loop = false,
      onRestart,
      onSwiperIndexChange,
      onSwiperSourceChange,
      onMarkIndexChange,
    } = params

    this.dataSource = dataSource
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


    return this.markIndexOfDelay === targetMarkIndex
  }

  public toSection(dataIndex: number) {
    const step = getStepValue(this.dataIndex, dataIndex, this.maxDataIndex, this.loop)

    if (Math.abs(step) === 1) {
      return this.offsetSection(step)
    }

    this.setMarkIndex(
      getSafeIndex(dataIndex, this.maxDataIndex)
    )

    this.setSwiperIndex(
      this.computeContainerIndex()
    )

    return {
      swiperIndex: this.containerIndex,
      markIndex: this.dataIndex
    }
  }

  public offsetSection(step: number) {

    this.setMarkIndex(
      this.dataIndex + step
    )

    this.setSwiperIndex(
      this.computeContainerIndex(step)
    )

    return {
      swiperIndex: this.containerIndex,
      markIndex: this.dataIndex
    }
  }


  public emitRestart(){
    this.recompute()
    this.onRestart?.({
      swiperIndex: this.containerIndex,
      markIndex: this.dataIndex,
      key:Date.now().toString(36).slice(0, 8),
      source: this.source
    })
  }

  public emitSwiperIndexChange(){
    this.onSwiperIndexChange?.({
      swiperIndex: this.containerIndex,
      markIndex: this.dataIndex,
    })
  }

  public emitMarkIndexChange(){
    this.onMarkIndexChange?.({
      markIndex: this.dataIndex
    })
  }

  public recompute(): T[] {
    const result = super.recomputeIndexArr()

    const source = result.map(index => this.dataSource[index])


    console.log({
      maxMarkIndex: this.maxDataIndex,
      maxSwiperIndex: this.maxContainerIndex,
      source: source,
    }, 'recompute')

    this.setSource(
      source
    )

    this.updateMarkIndexOfDelay()

    return source
  }

  private setMarkIndex(markIndex: number) {
    return super.updateIndex(markIndex, {
      onDataIndexChange: () => this.emitMarkIndexChange(),
      onRestart: () => this.emitRestart(),
      onRecompute: () => this.recompute()
    })
  }


  private setSwiperIndex(swiperIndex: number) {
    const preSwiperIndex = this.containerIndex

    super.setContainerIndex(swiperIndex)

    if (preSwiperIndex !== this.containerIndex) {
      this.emitSwiperIndexChange()
    }

    return this.containerIndex
  }

  private setSource(source: T[]) {
    if(equal(this.source, source)) return;
    this.source = source


    this.onSwiperSourceChange?.(this.source)
    return this.source
  }



  private updateMarkIndexOfDelay() {
    this.markIndexOfDelay = this.dataIndex
  }
}

export default SwiperScheduler
