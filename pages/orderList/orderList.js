import Toast from '../../miniprogram_npm/@vant/weapp/toast/toast.js';
import Dialog from '../../miniprogram_npm/@vant/weapp/dialog/dialog.js';
const db = wx.cloud.database();
const _ = db.command
const orderDB = db.collection('order')

Page({
  data: {
    isEmpty: true,
    isLoading: true,
    tabIndex: 0,
    orderList: [],
    page: 0,
    hasMoreData: true,
    showReceipt: false,// 确认收货面板
    imageList: [],// 确认收货面板的图片
    id: 0,// 确认收货的订单id
    showPayment:false,// 打开付款面板
    totalPrice:0
  },
  onLoad: function (options) {
    if (options.type) {
      this.setData({
        tabIndex: options.type
      })
    } else {
      this.setData({
        tabIndex: 0
      })
    }

    this.getOrderList(this.data.tabIndex)
  },
  onReady: function () {

  },
  onShow: function () {
    this.setData({
      // page:0,
      hasMoreData:true
    })
    this.getOrderList(this.data.tabIndex)
  },
  onReachBottom: function () {
    this.setData({
      page: ++this.data.page
    })
    this.getOrderList(this.data.tabIndex)
  },

  // 将订单的商品列表从json转化成对象
  getProductList(list) {
    for (let i in list) {
      list[i].productList = JSON.parse(list[i].productList)
    }
  },

  // 通过用户的openid以及订单状态获取订单列表数据
  getOrderList(state) {

    console.log('参数', state)
    if (!this.data.hasMoreData) {
      return;
    }
    Toast.loading({
      message: '加载中...',
      forbidClick: true,
    });

    const LIMIT = 5
    let { page, orderList } = this.data
    wx.cloud.callFunction({
      name: 'getOpenid',
      success: res => {
        let openid = res.result.openid
        if (state == 0) {
          orderDB.where({
            openId: openid
          }).limit(LIMIT).skip(LIMIT * page).orderBy('created', 'desc').get().then(res => {
            console.log('全部订单列表', res)

            this.getProductList(res.data)
            if (page == 0) {
              this.setData({
                orderList: res.data
              })
            } else {
              this.setData({
                orderList: [...orderList, ...res.data]
              })
            }
            if (res.data.length == 0) {
              this.setData({
                hasMoreData: false
              })
              return
            }
            Toast.clear();

          })
        } else {
          orderDB.where({
            openId: openid,
            state: state
          }).limit(LIMIT).skip(LIMIT * page).orderBy('created', 'desc').get().then(res => {
            console.log('分类订单列表', res)

            this.getProductList(res.data)
            if (page == 0) {
              this.setData({
                orderList: res.data
              })
            } else {
              this.setData({
                orderList: [...orderList, ...res.data]
              })
            }
            if (res.data.length == 0) {
              this.setData({
                hasMoreData: false
              })
              return
            }
            Toast.clear();

          })
        }

      }
    })
  },

  // 切换标签页点击事件
  onChange(event) {
    console.log('标签', event)
    this.setData({
      page: 0,
      tabIndex: event.detail.name,
      hasMoreData: true
    })
    this.getOrderList(this.data.tabIndex)
  },

  // 跳转至订单详情
  pushToOrderDetail(event) {
    console.log('跳转', event)
    let id = event.currentTarget.dataset.id
    wx.navigateTo({
      url: '../order/orderDetail?id=' + id,
    })
  },

  // 打开确认收货面板点击事件
  openReceipt(event) {
    console.log('获取数据', event)
    let { image, id } = event.currentTarget.dataset
    // let {imageList} = this.data
    this.setData({
      id: id
    })

    // let imageData=[];
    // for(let i in image){
    //   if(i<=2){
    //     imageData.push(image[i].color_image)
    //   }
    // }
    this.setData({
      imageList: image
    })

    this.setData({
      showReceipt: true
    })

    console.log('图片列表', this.data.imageList)



  },
  // 关闭确认收货面板点击事件
  closeReceipt() {
    console.log('关闭了面板')
    this.setData({
      id: 0,
      showReceipt: false
    })
  },

  // 确认收货点击事件
  comfireReceipt(event) {
    let { id } = this.data
    orderDB.doc(id).update({
      data: {
        state: "4"
      },
      success: res => {
        console.log('确认收货了', res)
        this.setData({
          page: 0,
          hasMoreData: true
        })
        this.setData({
          showReceipt: false,
        })
        this.getOrderList(this.data.tabIndex)

        Toast.success('收货成功');
      }
    })
  },

  // 取消订单点击事件
  cancelOrder(event) {
    console.log('取消订单参数', event)
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
            this.setData({
              page: 0,
              hasMoreData: true
            })
            this.getOrderList(this.data.tabIndex)
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

  // 删除订单点击事件
  deleteOrder(event){
    console.log('删除订单参数', event)
    let id = event.currentTarget.dataset.id

    Dialog.confirm({
      title: '删除订单',
      message: '确认删除订单',
    })
      .then(() => {
        // on confirm
        orderDB.doc(id).remove({
          success:res=>{
            this.setData({
              page: 0,
              hasMoreData: true
            })
            this.getOrderList(this.data.tabIndex)
            Toast.success('删除成功');
          }
        })
      })
      .catch(() => {
        // on cancel
      });
  },

  // 查看物流点击事件
  clickLogistics(event){
    console.log('查看物流',event)
    wx.navigateTo({
      url: './logistics?id=' + event.currentTarget.dataset.id,
    })
  },

  // 打开付款面板
  openPayment(event){
    let id = event.currentTarget.dataset.id
    this.setData({
      id:id
    })
    orderDB.doc(id).get().then(res=>{
      console.log('付款',res)
      this.setData({
        totalPrice:res.data.totalPrice
      })
    })


    this.setData({
      showPayment:true
    })
  },

  // 关闭付款面板
  onClose(){
    this.setData({
      showPayment:false,
      id:0
    })
  },

  // 完成支付点击事件
  clickComfire(){
    let {id} = this.data
    orderDB.doc(id).update({
      data:{
        state:"2"
      },
      success:res=>{
        this.setData({
          page: 0,
          hasMoreData: true
        })
        this.getOrderList(this.data.tabIndex)
        Toast.success('支付成功');
        this.setData({
          showPayment:false
        })
      }
    })
  }
})