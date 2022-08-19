import {SwiperItemProps} from "@tarojs/components/types/SwiperItem";
import {CSSProperties} from "react";

export interface LazySwiperItem<T> extends SwiperItemProps {
  data: T,
}

export interface LazySwiperItemConfig<T> extends LazySwiperItem<T> {
  isActive: boolean
}

export interface LazySwiperProps<T> {
  className?: string
  style?: CSSProperties

  /**
   * 默认数据索引
   * @default 0
   */
  defaultIndex?: number

  dataSource: LazySwiperItem<T>[]
  keyExtractor?: (data: T) => string
  renderContent?: (data: T, options: { key: string, isActive: boolean }) => React.ReactNode


  /**
   * 滑动方向是否为纵向
   * @default false
   */
  vertical?: boolean

  /**
   * 同时渲染的swiper item最大数量
   * @default 3
   */
  maxCount?: number

  /**
   * 是否循环
   * @default true
   */
  loop?: boolean


  /**
   * 切换动画时长
   * @default 300
   */
  duration?: number

  lazySwiper?: LazySwiperExtra

  onBeforeChange: (detail: { fromIndex: number, toIndex: number }) => (Promise<boolean | undefined> | (boolean | undefined))

  onChange: (detail: { current: number }) => void

  onAfterChanger: (detail: { prevIndex: number, current: number }) => void

}

export interface LazySwiperExtra {
  nextSection: () => void
  prevSection: () => void
  toSection: (index: number) => void
}
