# taro-lazy-swiper
使用taro, 基于微信小程序 swiper 开发的 lazy swiper

## 应用场景
- 大量图片的swiper 滑动预览
- 短视频的无限/有限滑动
- 等等

## 效果
<video id="video" controls>
      <source id="mp4" src="./source/demo.mp4" type="video/mp4">
</video>

## 使用

### 安装
``` shell
npm i taro-lazy-swiper
```
### 引入

```tsx
import LazySwiper, {useLazySwiper} from 'taro-lazy-swiper'
import {View} from "@tarojs/components";

const dataSource = Array(10).fill(0).map((_, i) => {
  return {data: i + 1}
})

const App = () => {

  const [lazySwiper] = useLazySwiper()

  return (
    <View>
      <LazySwiper
        lazySwiper={lazySwiper}
        dataSource={dataSource}
        keyExtractor={(data) => data.toString()}
        renderContent={(data, { isActive }) => {
          return `current: ${data}`
        }}
      />
      <View className='fixed-bar'>
        <Button onClick={() => lazySwiper.prevSection()}>上一个</Button>
        <Button onClick={() => lazySwiper.nextSection()}>下一个</Button>
        <Button onClick={() => lazySwiper.toSection(0)}>回到头</Button>
      </View>
    </View>
  )
}

```


## API

| 属性            | 类型                                                                      | 描述                   |
|---------------|-------------------------------------------------------------------------|----------------------|
| dataSource    | LazySwiperItem<T>[]                                                     | 数据源                  |
| keyExtractor  | (data: T) => string                                                     | key 计算               |
| renderContent | (data: T, info: { isActive: boolean, key: string } ) => React.ReactNode | 每个swiper item 的计算    |
| maxCount      | number                                                                  | 同时渲染的swiper item最大数量 |
| loop          | boolean                                                                 | 是否循环                 |
| duration      | number                                                                  | 切换动画时长               |
| lazySwiper    | LazySwiperExtra                                                         | 对外暴露的连接属性            |



## 共建

### fork 
拉取自己 fork 的项目
```shell
# ssh 方式
git clone git@github.com:[your github user name]/taro-lazy-swiper.git
```

### 启动
```shell
cd taro-lazy-swiper

npm i 

npm run dev:rollup
```
### 业务项目关联组件库

```shell
# taro-lazy-swiper
npm link


# 自己项目
npm link taro-lazy-swiper
```

## 鸣谢
[NervJS/taro](https://github.com/NervJS/taro)

[NervJS/taro-uilib-react](https://github.com/NervJS/taro-uilib-react)

等等...
