import {BaseEventOrig, Swiper, SwiperItem, View} from "@tarojs/components"
import React, {PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState} from "react";
import {SwiperProps} from "@tarojs/components/types/Swiper";
import Taro from "@tarojs/taro";

import SwiperScheduler from "./SwiperScheduler";
import {LazySwiperItem, LazySwiperProps} from "./types";

import {getStepValue, sleep} from "./utils";
import {minCount} from "./constant";

// import './../../styles/components/LazySwiper/LazySwiper.scss'

const ENV_TYPE = Taro.getEnv()

function LazySwiper<T>(props: PropsWithChildren<LazySwiperProps<T>>) {
  const {
    dataSource,
    maxCount = 3,
    renderContent,
    loop,
    keyExtractor,
    lazySwiper,
    duration = 500
  } = props
  const [isAnimating, setAnimating] = useState(false)
  const [swiperIndex, setSwiperIndex] = useState(0)
  const [source, setSource] = useState<LazySwiperItem<T>[]>([])

  const [swiperKey, setSwiperKey] = useState('normal')


  const updateSwiperIndex = useCallback(async (index: number) => {
    setSwiperIndex(index)
    setAnimating(true)

    if (ENV_TYPE === 'WEAPP') {
      await sleep(duration)
    }

    swiperSchedulerRef.current.recompute()
    await sleep(300)
    setAnimating(false)
  }, [duration])

  const swiperSchedulerRef = useRef<SwiperScheduler<LazySwiperItem<T>>>(
    useMemo(() => {
      return new SwiperScheduler({
        dataSource,
        defaultMarkIndex: 0,
        minCount: Math.max(minCount, maxCount),
        loop,
        duration,
        onRestart(index, key) {
          console.error('on - restart', index, key)
          setSwiperIndex(index)
          setSwiperKey(key)
        },
        onSwiperIndexChange(index) {
          console.log('on - onSwiperIndexChange')
          updateSwiperIndex(index)
        },
        onSwiperSourceChange(value) {
          console.log('on - onSwiperSourceChange', value)
          setSource(value)
        }
      })
    }, [dataSource, duration, loop, maxCount, updateSwiperIndex])
  )


  useEffect(() => {
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


  return (
    <View className='lazy-swiper'>
      <Swiper
        style={{
          height: '100vh'
        }}
        key={swiperKey}
        current={swiperIndex}
        onChange={handleChange}
        className='test-h'
        indicatorColor='#999'
        indicatorActiveColor='#333'
        indicatorDots
        vertical
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
