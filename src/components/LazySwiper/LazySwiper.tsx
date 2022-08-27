import { BaseEventOrig, Swiper, SwiperItem, View } from "@tarojs/components"
import React, { PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SwiperProps } from "@tarojs/components/types/Swiper";
import Taro from "@tarojs/taro";

import SwiperScheduler from "../../SwiperScheduler";
import { LazySwiperProps } from "./types";

import { getStepValue, sleep } from "../../common/utils";
import { minCount } from "./constant";
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
    loop = false,
    lazySwiper,
    duration = 500,

    swiperItemExtractor: _swiperItemExtractor,
    renderContent: _renderContent,
    keyExtractor: _keyExtractor,
    onChange: _onChange,
    onBeforeChange: _onBeforeChange,
    onAnimationFinish: _onAnimationFinish
  } = props
  const [isAnimating, setAnimating] = useState(false)
  const [swiperIndex, setSwiperIndex] = useState(0)
  const [source, setSource] = useState<T[]>([])

  const [swiperKey, setSwiperKey] = useState('normal')


  const renderContent = useMemoizedFn(_renderContent)
  const keyExtractor = useMemoizedFn(_keyExtractor)
  const onChange = useMemoizedFn(_onChange)
  const onBeforeChange = useMemoizedFn(_onBeforeChange)
  const onAnimationFinish = useMemoizedFn(_onAnimationFinish)
  const swiperItemExtractor = useMemoizedFn(_swiperItemExtractor)

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

  const swiperSchedulerRef = useRef<SwiperScheduler<T>>(
    useMemo(() => {
      return new SwiperScheduler({
        defaultMarkIndex: defaultIndex,
        minCount: Math.max(minCount, maxCount),
        loop,
        onSwiperRestart({ swiperIndex: sIndex, key }) {
          setSwiperIndex(sIndex)
          setSwiperKey(key)
        },
        onSwiperIndexChange({ swiperIndex: sIndex }) {
          updateSwiperIndex(sIndex)
        },
        onSwiperSourceChange(value) {
          setSource(value)
        },
        onMarkIndexChange({ markIndex }) {
          onChange({ current: markIndex })
        },
      })
    }, [defaultIndex, maxCount, loop, updateSwiperIndex, onChange])
  )

  useDeepCompareEffect(() => {
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

  const handleAnimationFinish = useCallback(() => {
    const swiperScheduler = swiperSchedulerRef.current

    onAnimationFinish?.({ current: swiperScheduler.getDataIndex() })
  }, [onAnimationFinish])

  const getActiveStatusBySwiperIndex = useCallback((index: number) => {
    return swiperSchedulerRef.current.getActiveStatusBySwiperIndex(index)
  }, [])

  const canNext = useCallback(async (targetIndex: number, callback: () => void) => {
    const swiperScheduler = swiperSchedulerRef.current

    const result = await onBeforeChange({ fromIndex: swiperScheduler.getDataIndex(), toIndex: targetIndex })

    if (result === false) return;
    callback()

  }, [onBeforeChange])

  const canNextWithStep = useCallback(async (step: number, callback: (targetIndex: number) => void) => {
    const swiperScheduler = swiperSchedulerRef.current

    const targetIndex = swiperScheduler.getDataIndex() + step;

    return canNext(targetIndex, () => callback(targetIndex))
  }, [canNext])

  const nextSection = useCallback(() => {

    canNextWithStep(1, () => {
      updateSwiperIndexByStep(1)
    })
  }, [canNextWithStep, updateSwiperIndexByStep])

  const prevSection = useCallback(() => {
    canNextWithStep(-1, () => {
      updateSwiperIndexByStep(-1)
    })
  }, [canNextWithStep, updateSwiperIndexByStep])

  const toSection = useCallback(async (index) => {
    canNext(index, () => {
      swiperSchedulerRef.current.toSection(index)
    })
  }, [canNext])


  useEffect(() => {
    if (!lazySwiper) return;
    Object.assign(lazySwiper, {
      nextSection,
      prevSection,
      toSection
    })
  }, [lazySwiper, nextSection, prevSection, toSection])

  return (
    <View className={`lazy-swiper ${className}`} style={style}>
      <Swiper
        className='swiper'
        key={swiperKey}
        current={swiperIndex}
        onChange={handleChange}
        indicatorColor='#999'
        indicatorActiveColor='#333'
        indicatorDots
        vertical={vertical}
        circular={swiperSchedulerRef.current.circular}
        duration={duration}
        onAnimationEnd={handleAnimationFinish}
      >
        {
          source.map((item, index) => {
            if (!item) return
            const isActive = getActiveStatusBySwiperIndex(index)
            const swiperItemProps = swiperItemExtractor(item) || {}
            const key = keyExtractor(item) || index.toString()
            return (
              <SwiperItem {...swiperItemProps} key={key}>
                {renderContent(item, { key, isActive })}
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
