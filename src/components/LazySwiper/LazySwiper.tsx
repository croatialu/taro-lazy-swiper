import {BaseEventOrig, Swiper, SwiperItem, View} from "@tarojs/components"
import React, {PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState} from "react";
import {SwiperProps} from "@tarojs/components/types/Swiper";
import Taro from "@tarojs/taro";

import SwiperScheduler from "./SwiperScheduler";
import {LazySwiperItem, LazySwiperProps} from "./types";

import {getStepValue, sleep} from "./utils";
import {minCount} from "./constant";
import useDeepCompareEffect from "../../hooks/useDeepCompareEffect";
import useMemoizedFn from "../../hooks/useMemoizedFn";

const ENV_TYPE = Taro.getEnv()

function LazySwiper<T>(props: PropsWithChildren<LazySwiperProps<T>>) {
  const {
    className = '',
    style,
    vertical,
    defaultIndex = 0,
    dataSource,
    maxCount = 3,
    renderContent,
    loop,
    keyExtractor,
    lazySwiper,
    duration = 500,
    onChange,
  } = props
  const [isAnimating, setAnimating] = useState(false)
  const [swiperIndex, setSwiperIndex] = useState(0)
  const [source, setSource] = useState<LazySwiperItem<T>[]>([])

  const [swiperKey, setSwiperKey] = useState('normal')


  const propsChangeEvent = useMemoizedFn((index: number) => {
    onChange?.({ current: index })
  })

  const updateSwiperIndex = useCallback(async (index: number) => {
    setSwiperIndex(index)
    setAnimating(true)

    if (ENV_TYPE === 'WEAPP') {
      await sleep(duration)
    }

    swiperSchedulerRef.current.recompute()
    await sleep(Math.floor(duration / 3))
    setAnimating(false)
  }, [duration])

  const swiperSchedulerRef = useRef<SwiperScheduler<LazySwiperItem<T>>>(
    useMemo(() => {
      return new SwiperScheduler({
        defaultMarkIndex: defaultIndex,
        minCount: Math.max(minCount, maxCount),
        loop,
        onRestart({swiperIndex: sIndex, key}) {
          console.error('on - onRestart')
          setSwiperIndex(sIndex)
          setSwiperKey(key)
        },
        onSwiperIndexChange({ swiperIndex: sIndex }) {
          console.log(sIndex, 'on - onSwiperIndexChange')
          updateSwiperIndex(sIndex)
        },
        onSwiperSourceChange(value) {
          console.log('on - onSwiperSourceChange', value)
          setSource(value)
        },
        onMarkIndexChange({ markIndex }){
          console.log('on - onMarkIndexChange')
          propsChangeEvent(markIndex)
        }
      })
    }, [defaultIndex, maxCount, loop, updateSwiperIndex, propsChangeEvent])
  )

  useDeepCompareEffect(() => {
    console.log('dataSource - changed')

    setSource(
      swiperSchedulerRef.current.updateDataSource(dataSource)
    )
  }, [dataSource])


  const updateSwiperIndexByStep = useCallback(async (step,) => {
    const swiperScheduler = swiperSchedulerRef.current
    swiperScheduler.offsetSection(step)
  }, [])

  const handleChange = useCallback((event: BaseEventOrig<SwiperProps.onChangeEventDeatil>) => {
    const eventIndex = event.detail.current

    if (swiperIndex === eventIndex) return;

    const step = getStepValue(swiperIndex, eventIndex, source.length - 1)
    updateSwiperIndexByStep(step)
  }, [source.length, swiperIndex, updateSwiperIndexByStep])


  const getActiveStatusBySwiperIndex = useCallback((index: number) => {
    return swiperSchedulerRef.current.getActiveStatusBySwiperIndex(index)
  }, [])

  const nextSection = useCallback(() => {
    updateSwiperIndexByStep(1)
  }, [updateSwiperIndexByStep])

  const prevSection = useCallback(() => {
    updateSwiperIndexByStep(-1)
  }, [updateSwiperIndexByStep])

  const toSection = useCallback((index) => {
    swiperSchedulerRef.current.toSection(index)
  }, [])


  useEffect(() => {
    if (!lazySwiper) return;
    Object.assign(lazySwiper, {
      nextSection,
      prevSection,
      toSection
    })
  }, [lazySwiper, nextSection, prevSection, toSection])


  console.log({
    source,
    swiperKey,
    swiperIndex,

  }, 'lazySwiper')

  return (
    <View className={`lazy-swiper ${className}`} style={style}>
      <Swiper
        key={swiperKey}
        current={swiperIndex}
        onChange={handleChange}
        indicatorColor='#999'
        indicatorActiveColor='#333'
        indicatorDots
        vertical={vertical}
        circular={swiperSchedulerRef.current.circular}
        duration={duration}
      >
        {
          source.map((item, index) => {
            if (!item) return
            const {data, ...otherProps} = item
            const isActive = getActiveStatusBySwiperIndex(index)
            const key = keyExtractor?.(data) || index.toString()
            return (
              <SwiperItem key={key} {...otherProps} >
                {renderContent?.(data, {key, isActive})}
              </SwiperItem>
            )
          })
        }
      </Swiper>
      {
        isAnimating ? (
          <View className='mask' />
        ) : null
      }
    </View>
  )

}

export default LazySwiper
