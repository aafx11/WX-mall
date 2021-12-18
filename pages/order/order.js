import Toast from '../../miniprogram_npm/@vant/weapp/toast/toast.js';
const db = wx.cloud.database();
const _ = db.command
const orderDB = db.collection('order')


Page({
  data: {
    orderData: [],
    address: [],
    select_address: {},
    totalPrice: 0,
    message: '',
    openId: 0,
    hasAddress: false,
    show: false,

  },

  // 获取订单的商品列表信息
  getOrderData(from) {
    let order;
    let totalPrice = 0;

    if (from == 'cart') {
      let cart = wx.getStorageSync('cart') || []
      if (cart.length == 0) {
        return
      }
      order = cart.filter((item) => {
        return item.selected == true
      })
      console.log('购物车获取', order)
    }

    if (from == 'buy') {
      order = wx.getStorageSync('purchase') || []
      if (order.length == 0) {
        return
      }
      console.log('立即购买', order)
    }

    this.setData({
      orderData: order
    })
    console.log('订单数据', order)

    for (let i in order) {
      totalPrice = (order[i].number * parseFloat(order[i].price)) + totalPrice
    }
    console.log('总金额', parseFloat(order[0].price) * order[0].number)
    this.setData({
      totalPrice: totalPrice.toFixed([2])
    })
    return order
  },

  onLoad: function (options) {


    let from = options.from
    // 获取订单数据
    this.getOrderData(from)

    // 第一次加载 获取默认地址
    this.getDefaultAddress()

    // 获取用户openid
    this.getOpenIdData();
  },


  onReady: function () {

  },

  onShow: function () {
    // 获取被选中的地址
    this.getSelectedAddress()
  },

  // 跳转至地址选择页面
  pushToSelectAddress() {
    wx.navigateTo({
      url: '/pages/address/address?from=order',
    })
  },

  // 获取默认地址
  getDefaultAddress() {
    let address = wx.getStorageSync('address') || []
    if (address.length == 0) {
      this.setData({
        address: address,
        select_address: {},
        hasAddress: false
      })
      console.log('没有缓存地址', this.data.select_address)

      return
    }
    let select_address = address.filter((item) => {
      return item.isDefault == true
    })
    if (select_address.length == 0) {
      this.setData({
        select_address: {},
        hasAddress: false

      })
      console.log('没有默认地址', this.data.select_address)

      return
    }

    console.log('有缓存地址', this.data.select_address)

    this.setData({
      select_address: select_address[0],
      hasAddress: true

    })
    return
  },

  // 获取选中的地址
  getSelectedAddress() {
    let address = wx.getStorageSync('address') || []
    if (address.length == 0) {
      this.setData({
        address: address,
        select_address: {},
        hasAddress: false

      })
      console.log('没有缓存地址', this.data.select_address)


      return
    }
    let select_address = address.filter((item) => {
      return item.selected == true
    })

    console.log('选中的地址', select_address)
    if (select_address.length == 0) {
      this.setData({
        select_address: {},
        hasAddress: false

      })

      console.log('没有选中地址', this.data.select_address)

      return
    } else {
      console.log('有选中地址', select_address)

      this.setData({
        select_address: select_address[0],
        hasAddress: true
      })
    }
  },

  // 获取用户openid
  getOpenIdData() {
    wx.cloud.callFunction({
      name: 'getOpenid',
      success: res => {
        console.log('openid', res.result.openid)
        this.setData({
          openId: res.result.openid
        })
      }
    })
  },
  // 展示订单付款点击事件 
  showPopup() {
    // 检查是否有填地址
    let { select_address } = this.data;
    if (JSON.stringify(select_address) === '{}') {
      Toast('请选择地址');
      console.log('地址为空')
      return
    } else {
      console.log('地址不为空', select_address)
    }

    this.setData({ show: true });
  },

  // 创建订单
  createOrder() {
    let { orderData, select_address, totalPrice, message, openId } = this.data
    let order = {
      openId: 0,
      order_number: 0,
      created: 0,
      productList: 0,
      totalPrice: 0,
      state: 0,
      address: 0,
      message: ''
    }
    // 用户openid
    order.openId = openId

    // 订单编号
    let myDate = new Date();
    let year = myDate.getFullYear() + '';
    let month = (myDate.getMonth() + 1) + '';
    let day = myDate.getDate() + '';
    let ran = Math.floor(Math.random() * 10000 + 1) + '';
    order.order_number = `${year}${month}${day}${ran}`

    // 订单创建时间
    let hours = myDate.getHours()
    let min = myDate.getMinutes();
    order.created = `${year}-${month}-${day} ${hours}:${min}`
    order.productList = JSON.stringify(orderData)
    // order.productList = orderData


    //总金额
    order.totalPrice = totalPrice

    // 收货人地址
    order.address = JSON.stringify(select_address)

    // 给卖家的留言
    order.message = message
    return order
  },

  // 取消支付,生成未付款订单
  onClose() {
    let order = this.createOrder();
    order.state = "1"

    db.collection('order').add({
      data: order,
      success: res => {
        console.log('成功', res)

        // 获取数据库中新建的订单，对购物车进行删减
        db.collection('order').doc(res._id).get({
          success: res => {
            let productList = JSON.parse(res.data.productList)
            console.log('产品订单', productList)

            let cart = wx.getStorageSync('cart')
            console.log('购物车缓存', cart)

            let newCart = cart.filter((item1) => {
              return (productList.findIndex((item2) => {
                return item1._id == item2._id
              }) == -1)
            })

            wx.setStorageSync('cart', newCart)
            console.log('新购物车', newCart)
          }
        })

        wx.navigateTo({
          url: './orderDetail?id=' + res._id,
        })
      },
      fail: res => {
        console.log('失败', res)

      }
    })
    console.log('订单', order)
  },

  // 完成支付点击事件
  clickComfire() {
    let order = this.createOrder();
    order.state = "2"

    db.collection('order').add({
      data: order,
      success: res => {
        console.log('成功', res)

        // 获取数据库中新建的订单，对购物车进行删减
        db.collection('order').doc(res._id).get({
          success: res => {
            let productList = JSON.parse(res.data.productList)
            console.log('产品订单', productList)

            let cart = wx.getStorageSync('cart')
            console.log('购物车缓存', cart)

            let newCart = cart.filter((item1) => {
              return (productList.findIndex((item2) => {
                return item1._id == item2._id
              }) == -1)
            })

            wx.setStorageSync('cart', newCart)
            console.log('新购物车', newCart)
          }
        })
        wx.navigateTo({
          url: './orderDetail?id=' + res._id,
        })
      },
      fail: res => {
        console.log('失败', res)

      }
    })
  }


})