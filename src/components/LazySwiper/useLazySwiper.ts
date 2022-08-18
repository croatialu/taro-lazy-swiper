import {useRef} from "react"
import {LazySwiperExtra} from "./types";

const useLazySwiper = () => {

  const ref = useRef<LazySwiperExtra>({
    nextSection() {
    },
    prevSection() {
    },
    toSection() {

    }
  })

  return [ref.current] as const
}

export default useLazySwiper
