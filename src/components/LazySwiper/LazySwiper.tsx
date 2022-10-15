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
    swiperWait = duration,

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
    await sleep(Math.floor(swiperWait))
    setAnimating(false)
  }, [duration, swiperWait])

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

  const getDataIndexByContainerIndex = useCallback((index: number) => {
    return swiperSchedulerRef.current.getDataIndexByContainerIndex(index)
  }, [])

  const canNext = useCallback(async (targetIndex: number, callback: () => void, payload: object) => {
    const swiperScheduler = swiperSchedulerRef.current

    const result = await onBeforeChange({ fromIndex: swiperScheduler.getDataIndex(), toIndex: targetIndex, payload })

    if (result === false) return;
    callback()

  }, [onBeforeChange])


  const nextSection = useCallback((payload: object = {}) => {
    const swiperScheduler = swiperSchedulerRef.current
    const targetIndex = swiperScheduler.getDataIndex() + 1;
    canNext(targetIndex, () => {
      updateSwiperIndexByStep(1)
    }, payload)
  }, [updateSwiperIndexByStep])

  const prevSection = useCallback((payload: object = {}) => {
    const swiperScheduler = swiperSchedulerRef.current
    const targetIndex = swiperScheduler.getDataIndex() - 1;

    canNext(targetIndex, () => {
      updateSwiperIndexByStep(-1)
    }, payload)
  }, [updateSwiperIndexByStep])

  const toSection = useCallback(async (index, payload = {}) => {
    canNext(index, () => {
      swiperSchedulerRef.current.toSection(index)
    }, payload)
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
        vertical={vertical}
        circular={swiperSchedulerRef.current.circular}
        duration={duration}
        onAnimationEnd={handleAnimationFinish}
      >
        {
          source.map((item, index) => {
            if (!item) return
            const isActive = getActiveStatusBySwiperIndex(index)
            const dataIndex = getDataIndexByContainerIndex(index)
            const swiperItemProps = swiperItemExtractor(item, dataIndex) || {}
            const key = keyExtractor(item, dataIndex) || index.toString()
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
