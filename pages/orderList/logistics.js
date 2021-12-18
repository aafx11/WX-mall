const db = wx.cloud.database();
const _ = db.command
const orderDB = db.collection('order')

Page({
  data: {
    address: {},
    number: 0,
    steps: [
      {
        text: '【城市】物流状态1',
        desc: '描述信息',
        // inactiveIcon: 'location-o',
        // activeIcon: 'success',
      },
      {
        text: '【城市】物流状态',
        desc: '描述信息',
      },
      {
        text: '快件已发货',
        desc: '描述信息',
      },
    ],
  },
  onLoad: function (options) {
    console.log(options)
    this.getOrderDetail(options.id)
  },
  onReady: function () {

  },
  onShow: function () {

  },

  // 通过订单id获取订单详情
  async getOrderDetail(id) {
    let { steps } = this.data
    let res = await orderDB.doc(id).get()
    console.log('订单信息', res)
    for (let i in steps) {
      steps[i].desc=`${res.data.created}`
    }
    this.setData({
      steps:steps,
      address: JSON.parse(res.data.address),
      number: Math.floor(Math.random() * 10000000000 + 1)
    })
  }
})