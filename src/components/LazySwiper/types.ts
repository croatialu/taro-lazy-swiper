import {SwiperItemProps} from "@tarojs/components/types/SwiperItem";

export interface LazySwiperItem<T> extends SwiperItemProps {
  data: T,
}

export interface LazySwiperItemConfig<T> extends LazySwiperItem<T> {
  isActive: boolean
}

export interface LazySwiperProps<T> {
  dataSource: LazySwiperItem<T>[]
  keyExtractor?: (data: T) => string
  renderContent?: (data: T, options: { key: string, isActive: boolean }) => React.ReactNode

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
}

export interface LazySwiperExtra {
  nextSection: () => void
  prevSection: () => void
  toSection: (index: number) => void
}
