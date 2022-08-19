import { useCallback, useRef } from "react"

const useMemoizedFn = <T extends (...args: any[]) => any>(fn: T): T => {
  const ref = useRef<Function>(fn)

  ref.current = fn

  // @ts-ignore
  return useCallback((...params) => {
    const f = ref.current

    return f(...params)
  }, [])
}

export default useMemoizedFn
