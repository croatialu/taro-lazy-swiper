import equal from 'fast-deep-equal'

import Scheduler, {SchedulerParams} from './Scheduler';
import {NotUndefined} from "./common/type-utils";

export interface SwiperSchedulerParams<T> {
  /**
   * 最小输出数组长度
   *
   */
  minCount?: number

  dataSource?: T[]

  defaultMarkIndex?: number

  loop?: boolean

  onSwiperRestart?: (detail: {swiperIndex: number, markIndex: number, key: string, source: T[]}) => void

  /**
   * swiperIndex 变更， 传递给swiper 来跳转
   * @param detail
   */
  onSwiperIndexChange?: (detail: {swiperIndex: number, markIndex: number}) => void
  /**
   * swiper 数据变更， 提供给外界重新渲染 swiper items
   * @param source
   */
  onSwiperSourceChange?: (source: T[]) => void

  /**
   * 当前的 数据索引变更， 提供给外面知道现在处于哪一条数据上
   * @param detail
   */
  onMarkIndexChange?: (detail: { markIndex:number }) => void

  /**
   * 当前的 数据索引变更前拦截函数
   */
  onBeforeMarkIndexChange?: (detail: { fromIndex: number, toIndex: number }) => (Promise<boolean | undefined> | (boolean | undefined))
}

class SwiperScheduler<T> extends Scheduler {

  public dataSource: T[]

  public markIndexOfDelay = 0;

  public source: T[] = []

  public onSwiperRestart: SwiperSchedulerParams<T>['onSwiperRestart']

  public onMarkIndexChange: SwiperSchedulerParams<T>['onMarkIndexChange']
  public onSwiperIndexChange: SwiperSchedulerParams<T>['onSwiperIndexChange']
  public onSwiperSourceChange: SwiperSchedulerParams<T>['onSwiperSourceChange']

  public constructor(params: SwiperSchedulerParams<T>) {
    super({
      dataCount: params.dataSource?.length || 0,
      loop: params.loop || false,
      defaultDataIndex: params.defaultMarkIndex,
      minCount: params.minCount || 3,
      onDataIndexChange: (detail) => {
        this.emitMarkIndexChange(detail)
      },
      onRestart: (detail) => {
        this.emitRestart(detail)
      },
      onRecompute: () => this.recompute(),
      onContainerIndexChange: (detail) => {
        this.emitSwiperIndexChange(detail)
      },
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

    // return this.emitRestart({
    //   containerIndex: this.getContainerIndex(),
    //   dataIndex: this.getDataIndex()
    // })
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
      onSwiperRestart,
      onSwiperIndexChange,
      onSwiperSourceChange,
      onMarkIndexChange,
    } = params

    this.dataSource = dataSource
    this.loop = loop
    this.setMarkIndex(defaultMarkIndex)

    this.onSwiperRestart = onSwiperRestart
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

  public async toSection(dataIndex: number) {
    const step = this.getStepOffset(dataIndex)

    if (Math.abs(step) === 1) {
      return this.offsetSection(step)
    }

    const markIndex = await this.setMarkIndex(
      this.getSafeDataIndex(dataIndex)
    )

    const swiperIndex = this.setSwiperIndex(
      this.computeContainerIndex()
    )

    return {
      swiperIndex,
      markIndex
    }
  }

  public async offsetSection(step: number) {

    const markIndex = await this.setMarkIndex(
      this.getDataIndex() + step
    )

    const swiperIndex = this.setSwiperIndex(
      this.computeContainerIndex(step)
    )

    return {
      swiperIndex,
      markIndex
    }
  }


  public emitRestart({containerIndex, dataIndex }: Parameters<NotUndefined<SchedulerParams['onRestart']>>[0]){
    const source = this.recompute()
    this.onSwiperRestart?.({
      swiperIndex: containerIndex,
      markIndex: dataIndex,
      key:Date.now().toString(36).slice(0, 8),
      source
    })

    return source
  }

  public emitSwiperIndexChange({containerIndex, dataIndex }: Parameters<NotUndefined<SchedulerParams['onContainerIndexChange']>>[0]){
    this.onSwiperIndexChange?.({
      swiperIndex: containerIndex,
      markIndex: dataIndex,
    })
  }

  public emitMarkIndexChange({ dataIndex }: Parameters<NotUndefined<SchedulerParams['onDataIndexChange']>>[0]){
    this.onMarkIndexChange?.({
      markIndex: dataIndex
    })
  }

  public recompute(): T[] {
    const result = super.recomputeIndexArr()

    const source = result.map(index => this.dataSource[index])
    this.updateMarkIndexOfDelay()
    
    this.setSource(
      source
    )

    return source
  }

  private setMarkIndex(markIndex: number) {
    return super.updateIndex(markIndex)
  }


  private setSwiperIndex(swiperIndex: number) {
    return super.setContainerIndex(swiperIndex)
  }

  private setSource(source: T[]) {
    if(equal(this.source, source)) return;
    this.source = source


    this.onSwiperSourceChange?.(this.source)
    return this.source
  }



  private updateMarkIndexOfDelay() {
    this.markIndexOfDelay = this.getDataIndex()
  }
}

export default SwiperScheduler
