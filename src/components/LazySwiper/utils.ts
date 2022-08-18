export const compose = (...fns: Function[]) => {
  return (value: any) => {
    return [...fns].reverse().reduce((result, fn) => {
      return fn(result)
    }, value)
  }
}

export const pipe = (...fns: Function[]) => {
  return (value: any) => {
    return [...fns].reduce((result, fn) => {
      return fn(result)
    }, value)
  }
}

export const getSafeIndex = (index: number, maxIndex: number, minIndex = 0) => {
  return pipe(
    (value) => Math.max(value, minIndex),
    (value) => Math.min(value, maxIndex)
  )(index)
}

export const getTargetIndex = (toIndex: number, maxIndex: number, minIndex = 0) => {
  if (toIndex > maxIndex) return (toIndex % maxIndex) - 1
  if (toIndex < minIndex) return maxIndex + (toIndex % maxIndex) + 1

  return toIndex
}

export const getStepValue = (fromIndex: number, toIndex: number, maxIndex = 1, loop = true) => {
  if (fromIndex === toIndex) return 0
  
  if (loop) {
    if (fromIndex === 0 && toIndex === maxIndex) return -1;
    if (toIndex === 0 && fromIndex === maxIndex) return 1;
  }


  return toIndex - fromIndex
}

export const sleep = (timeout = 300) => {
  return new Promise(r => {
    setTimeout(r, timeout)
  })
}
