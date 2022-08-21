import Scheduler from '../src/Scheduler'

interface TestResultValue {
  output: number[]
  containerIndex: number
}

interface TestInputParams {
  dataCount: number,
  minCount: number,
  loop?: boolean
}


const noLoopInfo = new Map<TestInputParams, Record<string, TestResultValue>>([
  [
    { dataCount: 2, minCount: 3 },
    {
      0: { output: [0, 1], containerIndex: 0 },
      1: { output: [0, 1], containerIndex: 1 },
      3: { output: [0, 1], containerIndex: 1 },
    }
  ],
  [
    { dataCount: 3, minCount: 3 },
    {
      0: { output: [0, 1, 2], containerIndex: 0 },
      1: { output: [0, 1, 2], containerIndex: 1 },
      2: { output: [0, 1, 2], containerIndex: 2 },
      3: { output: [0, 1, 2], containerIndex: 2 },
    }
  ],
  [
    { dataCount: 4, minCount: 3 },
    {
      0: { output: [0, 1, 2], containerIndex: 0 },
      1: { output: [0, 1, 2], containerIndex: 1 },
      2: { output: [0, 1, 2, 3], containerIndex: 2 },
      3: { output: [0, 1, 2, 3], containerIndex: 3 },
    }
  ],
  [
    { dataCount: 5, minCount: 3 },
    {
      0: { output: [0, 1, 2], containerIndex: 0 },
      1: { output: [0, 1, 2], containerIndex: 1 },
      2: { output: [0, 1, 2, 3], containerIndex: 2 },
      3: { output: [0, 1, 2, 3, 4], containerIndex: 3 },
      4: { output: [0, 1, 2, 3, 4], containerIndex: 4 },
    }
  ],
  [
    { dataCount: 6, minCount: 3 },
    {
      0: { output: [0, 1, 2], containerIndex: 0 },
      1: { output: [0, 1, 2], containerIndex: 1 },
      2: { output: [3, 1, 2], containerIndex: 2 },
      3: { output: [3, 4, 2], containerIndex: 0 },
      4: { output: [3, 4, 5], containerIndex: 1 },
      5: { output: [3, 4, 5], containerIndex: 2 },
    }
  ],
  [
    { dataCount: 7, minCount: 3 },
    {
      0: { output: [0, 1, 2], containerIndex: 0 },
      1: { output: [0, 1, 2], containerIndex: 1 },
      2: { output: [3, 1, 2], containerIndex: 2 },
      3: { output: [3, 4, 2], containerIndex: 0 },
      4: { output: [3, 4, 5], containerIndex: 1 },
      5: { output: [3, 4, 5, 6], containerIndex: 2 },
      6: { output: [3, 4, 5, 6], containerIndex: 3 },
    }
  ],
  [
    { dataCount: 8, minCount: 3 },
    {
      0: { output: [0, 1, 2], containerIndex: 0 },
      1: { output: [0, 1, 2], containerIndex: 1 },
      2: { output: [3, 1, 2], containerIndex: 2 },
      3: { output: [3, 4, 2], containerIndex: 0 },
      4: { output: [3, 4, 5], containerIndex: 1 },
      5: { output: [3, 4, 5, 6], containerIndex: 2 },
      6: { output: [3, 4, 5, 6, 7], containerIndex: 3 },
      7: { output: [3, 4, 5, 6, 7], containerIndex: 4 },
    }
  ],
  [
    { dataCount: 9, minCount: 3 },
    {
      0: { output: [0, 1, 2], containerIndex: 0 },
      1: { output: [0, 1, 2], containerIndex: 1 },
      2: { output: [3, 1, 2], containerIndex: 2 },
      3: { output: [3, 4, 2], containerIndex: 0 },
      4: { output: [3, 4, 5], containerIndex: 1 },
      5: { output: [6, 4, 5], containerIndex: 2 },
      6: { output: [6, 7, 5], containerIndex: 0 },
      7: { output: [6, 7, 8], containerIndex: 1 },
      8: { output: [6, 7, 8], containerIndex: 2 },
    }
  ],
  [
    { dataCount: 10, minCount: 3 },
    {
      0: { output: [0, 1, 2], containerIndex: 0, },
      1: { output: [0, 1, 2], containerIndex: 1, },
      2: { output: [3, 1, 2], containerIndex: 2, },
      3: { output: [3, 4, 2], containerIndex: 0, },
      4: { output: [3, 4, 5], containerIndex: 1, },
      5: { output: [6, 4, 5], containerIndex: 2, },
      6: { output: [6, 7, 5], containerIndex: 0, },
      7: { output: [6, 7, 8], containerIndex: 1, },
      8: { output: [6, 7, 8, 9], containerIndex: 2, },
      9: { output: [6, 7, 8, 9], containerIndex: 3, },
    }
  ],
  [
    { dataCount: 11, minCount: 3 },
    {
      0: { output: [0, 1, 2], containerIndex: 0, },
      1: { output: [0, 1, 2], containerIndex: 1, },
      2: { output: [3, 1, 2], containerIndex: 2, },
      3: { output: [3, 4, 2], containerIndex: 0, },
      4: { output: [3, 4, 5], containerIndex: 1, },
      5: { output: [6, 4, 5], containerIndex: 2, },
      6: { output: [6, 7, 5], containerIndex: 0, },
      7: { output: [6, 7, 8], containerIndex: 1, },
      8: { output: [6, 7, 8, 9], containerIndex: 2, },
      9: { output: [6, 7, 8, 9, 10], containerIndex: 3, },
      10: { output: [6, 7, 8, 9, 10], containerIndex: 4, },
    }
  ],
  [
    { dataCount: 12, minCount: 3 },
    {
      0: { output: [0, 1, 2], containerIndex: 0, },
      1: { output: [0, 1, 2], containerIndex: 1, },
      2: { output: [3, 1, 2], containerIndex: 2, },
      3: { output: [3, 4, 2], containerIndex: 0, },
      4: { output: [3, 4, 5], containerIndex: 1, },
      5: { output: [6, 4, 5], containerIndex: 2, },
      6: { output: [6, 7, 5], containerIndex: 0, },
      7: { output: [6, 7, 8], containerIndex: 1, },
      8: { output: [9, 7, 8], containerIndex: 2, },
      9: { output: [9, 10, 8], containerIndex: 0, },
      10: { output: [9, 10, 11], containerIndex: 1, },
      11: { output: [9, 10, 11], containerIndex: 2, },
    }
  ],


  // minCount = 5
  [
    { dataCount: 2, minCount: 5 },
    {
      0: { output: [0, 1], containerIndex: 0 },
      1: { output: [0, 1], containerIndex: 1 },
      3: { output: [0, 1], containerIndex: 1 },
    }
  ],
  [
    { dataCount: 3, minCount: 5 },
    {
      0: { output: [0, 1, 2], containerIndex: 0 },
      1: { output: [0, 1, 2], containerIndex: 1 },
      2: { output: [0, 1, 2], containerIndex: 2 },
      3: { output: [0, 1, 2], containerIndex: 2 },
    }
  ],
  [
    { dataCount: 4, minCount: 5 },
    {
      0: { output: [0, 1, 2, 3], containerIndex: 0 },
      1: { output: [0, 1, 2, 3], containerIndex: 1 },
      2: { output: [0, 1, 2, 3], containerIndex: 2 },
      3: { output: [0, 1, 2, 3], containerIndex: 3 },
    }
  ],
  [
    { dataCount: 5, minCount: 5 },
    {
      0: { output: [0, 1, 2, 3, 4], containerIndex: 0 },
      1: { output: [0, 1, 2, 3, 4], containerIndex: 1 },
      2: { output: [0, 1, 2, 3, 4], containerIndex: 2 },
      3: { output: [0, 1, 2, 3, 4], containerIndex: 3 },
      4: { output: [0, 1, 2, 3, 4], containerIndex: 4 },
    }
  ],
  [
    { dataCount: 6, minCount: 5 },
    {
      0: { output: [0, 1, 2, 3, 4], containerIndex: 0 },
      1: { output: [0, 1, 2, 3, 4], containerIndex: 1 },
      2: { output: [0, 1, 2, 3, 4], containerIndex: 2 },
      3: { output: [0, 1, 2, 3, 4, 5], containerIndex: 3 },
      4: { output: [0, 1, 2, 3, 4, 5], containerIndex: 4 },
      5: { output: [0, 1, 2, 3, 4, 5], containerIndex: 5 },
    }
  ],
  [
    { dataCount: 7, minCount: 5 },
    {
      0: { output: [0, 1, 2, 3, 4], containerIndex: 0 },
      1: { output: [0, 1, 2, 3, 4], containerIndex: 1 },
      2: { output: [0, 1, 2, 3, 4], containerIndex: 2 },
      3: { output: [0, 1, 2, 3, 4, 5], containerIndex: 3 },
      4: { output: [0, 1, 2, 3, 4, 5, 6], containerIndex: 4 },
      5: { output: [0, 1, 2, 3, 4, 5, 6], containerIndex: 5 },
      6: { output: [0, 1, 2, 3, 4, 5, 6], containerIndex: 6 },
    }
  ],
  [
    { dataCount: 8, minCount: 5 },
    {
      0: { output: [0, 1, 2, 3, 4], containerIndex: 0 },
      1: { output: [0, 1, 2, 3, 4], containerIndex: 1 },
      2: { output: [0, 1, 2, 3, 4], containerIndex: 2 },
      3: { output: [0, 1, 2, 3, 4, 5], containerIndex: 3 },
      4: { output: [0, 1, 2, 3, 4, 5, 6], containerIndex: 4 },
      5: { output: [0, 1, 2, 3, 4, 5, 6, 7], containerIndex: 5 },
      6: { output: [0, 1, 2, 3, 4, 5, 6, 7], containerIndex: 6 },
      7: { output: [0, 1, 2, 3, 4, 5, 6, 7], containerIndex: 7 },
    }
  ],
  [
    { dataCount: 9, minCount: 5 },
    {
      0: { output: [0, 1, 2, 3, 4], containerIndex: 0 },
      1: { output: [0, 1, 2, 3, 4], containerIndex: 1 },
      2: { output: [0, 1, 2, 3, 4], containerIndex: 2 },
      3: { output: [0, 1, 2, 3, 4, 5], containerIndex: 3 },
      4: { output: [0, 1, 2, 3, 4, 5, 6], containerIndex: 4 },
      5: { output: [0, 1, 2, 3, 4, 5, 6, 7], containerIndex: 5 },
      6: { output: [0, 1, 2, 3, 4, 5, 6, 7, 8], containerIndex: 6 },
      7: { output: [0, 1, 2, 3, 4, 5, 6, 7, 8], containerIndex: 7 },
      8: { output: [0, 1, 2, 3, 4, 5, 6, 7, 8], containerIndex: 8 },
    }
  ],
  [
    { dataCount: 10, minCount: 5 },
    {
      0: { output: [0, 1, 2, 3, 4], containerIndex: 0 },
      1: { output: [0, 1, 2, 3, 4], containerIndex: 1 },
      2: { output: [0, 1, 2, 3, 4], containerIndex: 2 },
      3: { output: [5, 1, 2, 3, 4], containerIndex: 3 },
      4: { output: [5, 6, 2, 3, 4], containerIndex: 4 },
      5: { output: [5, 6, 7, 3, 4], containerIndex: 0 },
      6: { output: [5, 6, 7, 8, 4], containerIndex: 1 },
      7: { output: [5, 6, 7, 8, 9], containerIndex: 2 },
      8: { output: [5, 6, 7, 8, 9], containerIndex: 3 },
      9: { output: [5, 6, 7, 8, 9], containerIndex: 4 },
    }
  ],
  [
    { dataCount: 11, minCount: 5 },
    {
      0: { output: [0, 1, 2, 3, 4], containerIndex: 0 },
      1: { output: [0, 1, 2, 3, 4], containerIndex: 1 },
      2: { output: [0, 1, 2, 3, 4], containerIndex: 2 },
      3: { output: [5, 1, 2, 3, 4], containerIndex: 3 },
      4: { output: [5, 6, 2, 3, 4], containerIndex: 4 },
      5: { output: [5, 6, 7, 3, 4], containerIndex: 0 },
      6: { output: [5, 6, 7, 8, 4], containerIndex: 1 },
      7: { output: [5, 6, 7, 8, 9], containerIndex: 2 },
      8: { output: [5, 6, 7, 8, 9, 10], containerIndex: 3 },
      9: { output: [5, 6, 7, 8, 9, 10], containerIndex: 4 },
      10: { output: [5, 6, 7, 8, 9, 10], containerIndex: 5 },
    }
  ],
  [
    { dataCount: 12, minCount: 5 },
    {
      0: { output: [0, 1, 2, 3, 4], containerIndex: 0 },
      1: { output: [0, 1, 2, 3, 4], containerIndex: 1 },
      2: { output: [0, 1, 2, 3, 4], containerIndex: 2 },
      3: { output: [5, 1, 2, 3, 4], containerIndex: 3 },
      4: { output: [5, 6, 2, 3, 4], containerIndex: 4 },
      5: { output: [5, 6, 7, 3, 4], containerIndex: 0 },
      6: { output: [5, 6, 7, 8, 4], containerIndex: 1 },
      7: { output: [5, 6, 7, 8, 9], containerIndex: 2 },
      8: { output: [5, 6, 7, 8, 9, 10], containerIndex: 3 },
      9: { output: [5, 6, 7, 8, 9, 10, 11], containerIndex: 4 },
      10: { output: [5, 6, 7, 8, 9, 10, 11], containerIndex: 5 },
      11: { output: [5, 6, 7, 8, 9, 10, 11], containerIndex: 6 },
    }
  ],
  [
    { dataCount: 13, minCount: 5 },
    {
      0: { output: [0, 1, 2, 3, 4], containerIndex: 0 },
      1: { output: [0, 1, 2, 3, 4], containerIndex: 1 },
      2: { output: [0, 1, 2, 3, 4], containerIndex: 2 },
      3: { output: [5, 1, 2, 3, 4], containerIndex: 3 },
      4: { output: [5, 6, 2, 3, 4], containerIndex: 4 },
      5: { output: [5, 6, 7, 3, 4], containerIndex: 0 },
      6: { output: [5, 6, 7, 8, 4], containerIndex: 1 },
      7: { output: [5, 6, 7, 8, 9], containerIndex: 2 },
      8: { output: [5, 6, 7, 8, 9, 10], containerIndex: 3 },
      9: { output: [5, 6, 7, 8, 9, 10, 11], containerIndex: 4 },
      10: { output: [5, 6, 7, 8, 9, 10, 11, 12], containerIndex: 5 },
      11: { output: [5, 6, 7, 8, 9, 10, 11, 12], containerIndex: 6 },
      12: { output: [5, 6, 7, 8, 9, 10, 11, 12], containerIndex: 7 },
    }
  ],
  [
    { dataCount: 14, minCount: 5 },
    {
      0: { output: [0, 1, 2, 3, 4], containerIndex: 0 },
      1: { output: [0, 1, 2, 3, 4], containerIndex: 1 },
      2: { output: [0, 1, 2, 3, 4], containerIndex: 2 },
      3: { output: [5, 1, 2, 3, 4], containerIndex: 3 },
      4: { output: [5, 6, 2, 3, 4], containerIndex: 4 },
      5: { output: [5, 6, 7, 3, 4], containerIndex: 0 },
      6: { output: [5, 6, 7, 8, 4], containerIndex: 1 },
      7: { output: [5, 6, 7, 8, 9], containerIndex: 2 },
      8: { output: [5, 6, 7, 8, 9, 10], containerIndex: 3 },
      9: { output: [5, 6, 7, 8, 9, 10, 11], containerIndex: 4 },
      10: { output: [5, 6, 7, 8, 9, 10, 11, 12], containerIndex: 5 },
      11: { output: [5, 6, 7, 8, 9, 10, 11, 12, 13], containerIndex: 6 },
      12: { output: [5, 6, 7, 8, 9, 10, 11, 12, 13], containerIndex: 7 },
      13: { output: [5, 6, 7, 8, 9, 10, 11, 12, 13], containerIndex: 8 },
    }
  ],
  [
    { dataCount: 15, minCount: 5 },
    {
      0: { output: [0, 1, 2, 3, 4], containerIndex: 0 },
      1: { output: [0, 1, 2, 3, 4], containerIndex: 1 },
      2: { output: [0, 1, 2, 3, 4], containerIndex: 2 },
      3: { output: [5, 1, 2, 3, 4], containerIndex: 3 },
      4: { output: [5, 6, 2, 3, 4], containerIndex: 4 },
      5: { output: [5, 6, 7, 3, 4], containerIndex: 0 },
      6: { output: [5, 6, 7, 8, 4], containerIndex: 1 },
      7: { output: [5, 6, 7, 8, 9], containerIndex: 2 },
      8: { output: [10, 6, 7, 8, 9], containerIndex: 3 },
      9: { output: [10, 11, 7, 8, 9], containerIndex: 4 },
      10: { output: [10, 11, 12, 8, 9], containerIndex: 0 },
      11: { output: [10, 11, 12, 13, 9], containerIndex: 1 },
      12: { output: [10, 11, 12, 13, 14], containerIndex: 2 },
      13: { output: [10, 11, 12, 13, 14], containerIndex: 3 },
      14: { output: [10, 11, 12, 13, 14], containerIndex: 4 },
    }
  ],
]);





function createTest({ dataCount, minCount, loop }: TestInputParams, testMapping: Record<string, TestResultValue>){

  describe(`dataCount = ${dataCount} & minCount = ${minCount}`, () => {
    const scheduler = new Scheduler({
      dataCount,
      minCount,
      loop
    })


    Object.keys(testMapping).forEach(key => {
      const dataIndex = Number(key)
      const item: TestResultValue = testMapping[key]

     // eslint-disable-next-line max-nested-callbacks
      test(`when dataIndex is ${dataIndex},  containerIndex: ${item.containerIndex}  and output: ${JSON.stringify(item.output)}`, () => {
        scheduler.updateIndex(dataIndex)
        scheduler.recomputeIndexArr()
        expect(scheduler.groupSize).toBe(item.output.length)
        expect(scheduler.containerIndex).toBe(item.containerIndex)
        expect(scheduler.group).toEqual(item.output)
      })

    })


  })

}


describe('非循环模式', () => {

  for(let [key, value] of noLoopInfo) {
    createTest({...key, loop: false}, value)
  }


})



