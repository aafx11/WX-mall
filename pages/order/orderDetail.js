import Toast from '../../miniprogram_npm/@vant/weapp/toast/toast.js';
import Dialog from '../../miniprogram_npm/@vant/weapp/dialog/dialog.js';
const db = wx.cloud.database();
const _ = db.command
const orderDB = db.collection('order')
Page({
  data: {
    order: {},
    address: {},
    productList: [],
    showPayment: false,// 展示支付面板
    showReceipt: false //展示确认收货面板
  },
  onLoad: function (options) {
    this.getOrderDetailData(options.id)
  },
  onReady: function () {

  },
  onShow: function () {

  },
  onUnload: function () {
    console.log('离开路由', wx.getStorageSync('back'))

    let back = wx.getStorageSync('back')
    if (back === 'cart') {
      wx.switchTab({
        url: '../cart/cart'
      })
    } else if (back === 'detail') {

      // let pages = getCurrentPages(); 
      // let prevpage = pages[pages.length - 3]; 
      // console.log('路由对象',prevpage)
      // wx.navigateTo({
      //   url: '../detail/detail?id=' + prevpage.options.id
      // })
      wx.navigateBack({
        delta: 1
      })
    }


    wx.setStorageSync('back', '')
    console.log(wx.getStorageSync('back'))
  },

  // 通过id获取订单详情
  async getOrderDetailData(id) {
    let res = await orderDB.doc(id).get()
    // console.log('订单数据',res)
    let order = res.data
    order.address = JSON.parse(res.data.address)
    order.productList = JSON.parse(res.data.productList)
    this.setData({
      // address:JSON.parse(res.data.address),
      // productList:JSON.parse(res.data.productList)
      order: order
    })
    console.log('订单数据', this.data.order)
  },

  // 取消订单点击事件
  cancelOrder(event) {
    let id = event.currentTarget.dataset.id
    Dialog.confirm({
      title: '取消订单',
      message: '您确定要取消订单吗，取消后无法恢复',
    })
      .then(() => {
        // on confirm
        orderDB.doc(id).update({
          data: {
            state: "5"
          },
          success: res => {
            this.getOrderDetailData(id)

            Toast.success('取消成功');


          }
        })
        console.log('确定')
      })
      .catch(() => {
        // on cancel
        console.log('取消')
      });
  },

  // 打开付款面板
  openPay() {
    this.setData({
      showPayment: true
    })
  },

  // 关闭付款面板
  onClose() {
    this.setData({
      showPayment: false
    })
  },

  // 完成支付点击事件
  clickComfire(event) {
    let id = event.currentTarget.dataset.id
    orderDB.doc(id).update({
      data: {
        state: "2"
      },
      success: res => {

        this.getOrderDetailData(id)
        Toast.success('支付成功');

        this.setData({
          showPayment: false
        })
      }
    })
  },

  // 查看物流点击事件
  clickLogistics(event) {
    console.log('查看物流', event)
    wx.navigateTo({
      url: '../orderList/logistics?id=' + event.currentTarget.dataset.id,
    })
  },

  // 打开确认收货面板点击事件
  openReceipt(event) {
    
    this.setData({
      showReceipt: true
    })
  },

  // 关闭确认收货面板点击事件
  closeReceipt() {
    console.log('关闭了面板')
    this.setData({
      id: 0,
      showReceipt: false
    })
  },

  // 确认收货
  comfireReceipt(event){
    let id = event.currentTarget.dataset.id
    orderDB.doc(id).update({
      data: {
        state: "4"
      },
      success: res => {
        this.setData({
          showReceipt: false,
        })
        this.getOrderDetailData(id)
        Toast.success('收货成功');

      }
    })
  },

  // 删除订单
  deleteOrder(event){
    let id = event.currentTarget.dataset.id
    Dialog.confirm({
      title: '删除订单',
      message: '确认删除订单',
    })
      .then(() => {
        // on confirm
        orderDB.doc(id).remove({
          success:res=>{
            wx.navigateBack({
              delta: 0,
            })
          }
        })
      })
      .catch(() => {
        // on cancel
      });
  },
  
  // 跳转至商品详情
  goodsDetail(event){
    let id = event.currentTarget.dataset.id
    wx.navigateTo({
      url: '../detail/detail?id=' + id,
    })
  }
})