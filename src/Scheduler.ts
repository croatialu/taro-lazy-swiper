
import { getSafeIndex, getStepValue, getTargetIndex } from "./common/utils";

export interface SchedulerParams {

  /**
   * 数据总量
   */
   dataCount: number

  /**
   * 数据位置索引
   *
   * @default 0
   */
  defaultDataIndex?: number;


  /**
   * 容器最小数量
   * @default 3
   */
   minCount?: number

  /**
   * 是否循环
   * @default false
   */
  loop?: boolean


  onRestart?: (detail: { containerIndex: number, dataIndex: number }) => void

  onContainerIndexChange?: (detail: { containerIndex: number, dataIndex: number }) => void

  onDataIndexChange?: (detail: { containerIndex: number, dataIndex: number }) => void

  onRecompute?: () => void
}

class Scheduler {
  public group: number[] = []
  public loop: boolean;

  public indexMapping: Map<number, number> = new Map()


  private dataIndex: number;
  private containerIndex = 0;

  private dataCount: number;

  private minCount: number;

  private onContainerIndexChange: SchedulerParams['onContainerIndexChange']
  private onDataIndexChange : SchedulerParams['onDataIndexChange']
  private onRecompute : SchedulerParams['onRecompute']
  private onRestart : SchedulerParams['onRestart']

  public constructor(
    {
      dataCount = 0,
      defaultDataIndex = 0,
      minCount = 3,
      loop = false,
      onDataIndexChange,
      onRecompute,
      onRestart,
      onContainerIndexChange
    }: SchedulerParams){
    this.dataCount = dataCount;
    this.dataIndex = defaultDataIndex;
    this.minCount = minCount
    this.loop = loop
    this.onDataIndexChange = onDataIndexChange
    this.onRecompute = onRecompute
    this.onRestart = onRestart
    this.onContainerIndexChange = onContainerIndexChange
  }



  public get maxDataIndex(){
    if (this.dataCount) {
      return this.dataCount - 1
    }

    return this.minCount - 1;
  }

  public get groupSize(){
    if(this.loop){
      return this.minCount;
    }

    if(this.dataCount <= this.minCount) return this.dataCount

    // [开始新增点， 结束新增点]
    const overCount = this.dataCount % this.minCount
    const maxGroupSize = overCount + this.minCount

    const maxCount = this.minMiddleCount + 1;
    const endIndex = this.dataCount - maxCount - 1;

    const increaseCount = overCount - 1;

    const startIndex = endIndex - increaseCount;

    if(this.dataIndex <= startIndex) return this.minCount

    if(this.dataIndex > startIndex && this.dataIndex <= endIndex) {
        return this.dataIndex - startIndex + this.minCount
    }

    return maxGroupSize
  }

  public get maxContainerIndex(){
    if (this.dataCount) {
      return this.groupSize - 1
    }

    return this.minCount - 1;
  }

  private get minMiddleCount() {
    return Math.floor(this.minCount / 2)
  }


  /**
   * 更新数据总量
   * @param count 总量值
   */
  public updateCount(count: number){
    this.dataCount = count
  }


  /**
   * 更新当前数据索引
   * @param index 当前索引值
   */
  public async updateIndex(index: number){
    const preDataIndex = this.dataIndex
    const getIndex = this.loop ? getTargetIndex : getSafeIndex

    this.dataIndex = getIndex(index, this.maxDataIndex);

    this.setContainerIndex(
      this.computeContainerIndex()
    )

    if(preDataIndex !== this.dataIndex)  {
      this.onDataIndexChange?.({containerIndex: this.containerIndex,  dataIndex: this.dataIndex})
    }

    if (!this.loop && Math.abs(this.dataIndex - preDataIndex) > 1) {
      this.onRestart?.({ containerIndex: this.containerIndex, dataIndex: this.dataIndex })
    }

    if (this.loop && Math.abs(getStepValue(preDataIndex, this.dataIndex, this.maxDataIndex)) > 1) {
      this.onRecompute?.()
    }


    return this.dataIndex
  }

  public recomputeIndexArr() {
    if (!this.dataCount) return []

    this.setContainerIndex(
      this.computeContainerIndex()
    )


    this.setGroup(
      this.computeGroup()
    )

    return this.group
  }

  public computeContainerIndex(step?: number) {
    if (this.loop) {
      return getTargetIndex(this.containerIndex + (step || 0), this.maxContainerIndex)
    }

    if(this.dataCount <= this.minCount * 2 - 1) return this.dataIndex

    const overCount = this.dataCount % this.minCount;

    const lastGroupStartDataIndex = this.dataCount - overCount - this.minCount;

    if(this.dataIndex <= lastGroupStartDataIndex) return this.dataIndex % this.minCount

    return this.dataIndex - lastGroupStartDataIndex
  }

  public setContainerIndex(index: number){
    const preContainerIndex = this.containerIndex
    this.containerIndex = index

    if(preContainerIndex !== index) {
      this.onContainerIndexChange?.({ containerIndex: this.containerIndex, dataIndex: this.dataIndex })
    }

    return this.containerIndex
  }

  public getStepOffset(targetIndex: number){
    return getStepValue(this.dataIndex, targetIndex, this.maxDataIndex, this.loop)
  }

  public getSafeDataIndex(dataIndex: number){
    return getSafeIndex(dataIndex, this.maxDataIndex)
  }

  public getDataIndexByStep(){

  }

  public getDataIndex(){
    return this.dataIndex
  }

  /**
   * 非 `loop` 模式时， 特殊处理第一组数据
   * @private
   */
   private getFirstGroupIndexMapping() {
    return new Map(
      Array(
        Math.min(this.minCount, this.dataCount)
        ).fill(null).map((_, v) => [v, v])
      )
  }

  /**
   * 非 `loop` 模式时， 特殊处理最后一组数据
   * @returns
   */
  private getLastGroupIndexMapping() {
    if(this.dataCount <= this.minCount) {
      return new Map(
        Array(this.dataCount).fill(null).map((_, i) => [i, i])
      )
    }

    const overCount = this.dataCount % this.minCount

    const groupSize = this.groupSize

    const lastGroupStartDataIndex = this.dataCount - overCount - this.minCount;

    const map = new Map<number, number>()
    for (let i = 0; i < groupSize; i++) {
      const tempMarkIndex = lastGroupStartDataIndex + i;

      map.set(i, tempMarkIndex)
    }

    return map
  }

  private get isFirstGroup() {
    return this.dataIndex <= this.minMiddleCount
  }

  private get isLastGroup() {
    // 开始超出minCount 就是最后一页了

    if(this.dataCount % this.minCount === 0) {
      return this.dataIndex >= this.maxDataIndex - this.minMiddleCount
    }

    return this.groupSize > this.minCount
  }

  private getIndexMapping() {

    if (!this.loop) {
      if (this.isFirstGroup) return this.getFirstGroupIndexMapping()
      if (this.isLastGroup) return this.getLastGroupIndexMapping()
    }

    const map = new Map<number, number>()
    map.set(this.containerIndex, getTargetIndex(this.dataIndex, this.maxDataIndex))
    Array(this.minMiddleCount).fill(null).forEach((_, _index) => {
      const count = _index + 1;
      // 计算前后位置
      const prevSwiperIndex = getTargetIndex(this.containerIndex - count, this.maxContainerIndex)
      const nextSwiperIndex = getTargetIndex(this.containerIndex + count, this.maxContainerIndex)

      const prevMarkIndex = getTargetIndex(this.dataIndex - count, this.maxDataIndex)
      const nextMarkIndex = getTargetIndex(this.dataIndex + count, this.maxDataIndex)

      map.set(prevSwiperIndex, prevMarkIndex)
      map.set(nextSwiperIndex, nextMarkIndex)
    })

    return map
  }




  private computeGroup() {

    this.indexMapping = this.getIndexMapping()

    const arr: number[] = []
    for (const [key, value] of this.indexMapping) {
      arr[key] = value
    }

    return arr
  }



  private setGroup(group: number[]){
    this.group = group
  }


}



export default Scheduler
