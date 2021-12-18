import Toast from '../../miniprogram_npm/@vant/weapp/toast/toast.js';

const db = wx.cloud.database();
const _ = db.command
const product_stock = db.collection('product_stock')
const goods_info = db.collection('goods_info')

Page({

  data: {
    cartData: [],
    recommendedData: [],
    totalPrice: 0,
    hasLogin: false,
    isEdit: false,
    isSelectAll: false,
    isEmpty: true,

  },

  // 跳转到分类页面
  pushToSort() {
    wx.switchTab({
      url: '../sort/sort',
    })
  },

  // 获取购物车数据
  getCartData() {
    // let cart = wx.getStorageSync('cart') || []
    // console.log('缓存中购物车数据', cart)
    // if (cart.length == 0) {
    //   return;
    // }

    wx.getStorage({
      key: 'cart',
      success: (res) => {
        console.log('成功', res)
        this.checkCart(res.data)
      },
      fail: (res) => {
        console.log('失败', res)
        wx.setStorage({
          key: "cart",
          data: [],
          success: (res) => {
            let arr = []
            this.checkCart(arr)
          }
        })
      }
    })


  },
  // 操作后的购物车数据与数据库的库存做对比
  checkCart(cart) {
    console.log('执行checkCart', cart)
    // Toast.loading({
    //   message: '加载中...',
    //   forbidClick: true,
    // });
    let newCart = []
    // 1.判断购物车是否为空

    if (cart.length == 0) {
      this.setData({
        isEmpty: true,
        cartData: cart
      },
        () => {
          wx.setStorage({
            key: "cart",
            data: cart
          }).then(() => {
            Toast.clear();
            // return;
          })
        }
      )
      // wx.setStorageSync('cart', cart)



    } else {
      Toast.loading({
        message: '加载中...',
        forbidClick: true,
      });
      this.setData({ isEmpty: false })

      for (let i in cart) {

        newCart.push(new Promise((resolve, reject) => {
          product_stock.doc(cart[i]._id).get().then(newStock => {
            // 获取库存，更新购物车
            let stockData = newStock.data

            console.log('新库存' + i, stockData)

            if (stockData.stock == 0) {
              // 库存为0,从购物车中删除
              cart.splice(i, 1)
              reject('库存为0,从购物车中删除')
            } else if (stockData.stock > 0 && stockData.stock < cart[i].number) {
              // 商品库存小于购物车所选数量
              stockData.name = cart[i].name
              stockData.number = stockData.stock
              stockData.selected = cart[i].selected
              // newCart.push(stockData)
              resolve(stockData)


            } else {
              stockData.name = cart[i].name
              stockData.number = cart[i].number
              stockData.selected = cart[i].selected
              // newCart.push(stockData)
              resolve(stockData)

            }
          })
        }).catch((err) => {
          console.log('错误', err)
        })
        )

      }
      console.log('最终购物车', newCart)
      Promise.all(newCart).then(res => {
        for (let i in res) {
          if (res[i] == undefined) {
            res.splice(i, 1)
          }
        }

        this.setData({
          cartData: res
        })
        wx.setStorageSync('cart', this.data.cartData)
        console.log('最后缓存中的购物车', wx.getStorageSync('cart'))
        this.countTotalPrice();
        this.hasSelectAll()
        Toast.clear();
      })
    }

    // 2.购物车数据与数据库库存对比
    //  for (let i in cart) {


    //     product_stock.doc(cart[i]._id).get().then(newStock => {
    //       // 获取库存，更新购物车
    //       let stockData = newStock.data

    //       console.log('新库存' + i, stockData)

    //       if (stockData.stock == 0) {
    //         // 库存为0,从购物车中删除
    //         cart.splice(i, 1)
    //       } else if (stockData.stock > 0 && stockData.stock < cart[i].number) {
    //         // 商品库存小于购物车所选数量
    //         stockData.number = stockData.stock
    //         stockData.selected = cart[i].selected
    //         newCart.push(stockData)
    //         console.log('购物车数量太大', newCart)

    //       } else {
    //         stockData.number = cart[i].number
    //         stockData.selected = cart[i].selected
    //         newCart.push(stockData)
    //         console.log('新购物车', newCart)
    //       }
    //     })
    //   }

    // for (let i in cart) {

    //   newCart.push(new Promise((resolve, reject) => {
    //     product_stock.doc(cart[i]._id).get().then(newStock => {
    //       // 获取库存，更新购物车
    //       let stockData = newStock.data

    //       console.log('新库存' + i, stockData)

    //       if (stockData.stock == 0) {
    //         // 库存为0,从购物车中删除
    //         cart.splice(i, 1)
    //         reject('库存为0,从购物车中删除')
    //       } else if (stockData.stock > 0 && stockData.stock < cart[i].number) {
    //         // 商品库存小于购物车所选数量
    //         stockData.name = cart[i].name
    //         stockData.number = stockData.stock
    //         stockData.selected = cart[i].selected
    //         // newCart.push(stockData)
    //         resolve(stockData)


    //       } else {
    //         stockData.name = cart[i].name
    //         stockData.number = cart[i].number
    //         stockData.selected = cart[i].selected
    //         // newCart.push(stockData)
    //         resolve(stockData)

    //       }
    //     })
    //   }).catch((err) => {
    //     console.log('错误', err)
    //   })
    //   )

    // }
    // console.log('最终购物车', newCart)
    // Promise.all(newCart).then(res => {
    //   for (let i in res) {
    //     if (res[i] == undefined) {
    //       res.splice(i, 1)
    //     }
    //   }

    //   this.setData({
    //     cartData: res
    //   })
    //   wx.setStorageSync('cart', this.data.cartData)
    //   console.log('最后缓存中的购物车', wx.getStorageSync('cart'))
    //   this.countTotalPrice();
    //   this.hasSelectAll()
    //   Toast.clear();
    // })



    // 3.判断新购物车是否为空
    // if (newCart.length == 0) {
    //   this.setData({
    //     isEmpty: true,
    //     cartData: newCart
    //   })
    //   return;
    // } else {


    //   this.setData({
    //     isEmpty: false,
    //     cartData: newCart
    //   })
    // }

  },

  //判断是否登录
  getOpenId() {
    if (wx.getStorageSync('storage_info') !== 1) {
      console.log('未授权，手动登录')
      this.setData({
        hasLogin: false,
      })
    } else {
      console.log('已授权，在数据库获取信息')
      wx.cloud.callFunction({
        name: 'getOpenid',
        success: res => {
          console.log('获取openid', res)
          let openid = res.result.openid
          const db = wx.cloud.database()
          db.collection('user-info').where({
            openId: openid
          }).field({
            nickName: true,
            avatarUrl: true,
            gender: true,
            is_admin: true,
            created: true
          }).get().then(res => {
            console.log('已授权的情况下在数据库获取信息', res)
            if (res.data[0]) {
              this.setData({
                userInfo: res.data[0],
                hasLogin: true
              })
              this.getCartData()

            }
          }).then(() => {
            console.log('登录后获取购物车数据')
            // 登录后获取购物车数据
            // this.getCartData()

          })

        }
      })
    }



  },
  //没授权登陆，需要手动登录
  login() {
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (res) => {
        console.log('手动登录获取用户信息', res)
        this.setData({
          userInfo: res.userInfo,
          // hasUserInfo: true
        })
        //手动登录，如果数据库没有该用户信息，注册一个新用户
        wx.cloud.callFunction({
          name: 'getOpenid',
          success: res => {

            let openId = res.result.openid
            const db = wx.cloud.database()
            db.collection('user-info').where({
              openId: openId
            }).get().then(res => {
              console.log('手动登录在数据库获取信息', res)
              //数据库中没有该用户，注册新用户
              if (!res.data[0]) {
                console.log('没有该用户')
                let { userInfo } = this.data
                let to_add_data = {}
                let date = new Date()
                // console.log(date.getFullYear()+'年'+date.getMonth()+'月')

                to_add_data = {
                  nickName: userInfo.nickName,
                  avatarUrl: userInfo.avatarUrl,
                  gender: userInfo.gender,
                  openId: openId,
                  is_admin: 0,
                  created: date.getFullYear() + '年' + date.getMonth() + '月'

                }
                db.collection('user-info').add({
                  data: to_add_data
                }).then(res => {
                  console.log('添加用户成功')
                  db.collection('user-info').where({
                    openId: openId
                  }).field({
                    nickName: true,
                    avatarUrl: true,
                    gender: true,
                    is_admin: true,
                    created: true
                  }).get().then(res => {


                    this.setData({
                      userInfo: res.data[0],
                      hasLogin: true

                    })
                    wx.setStorageSync('storage_info', 1)
                    this.getCartData()
                  })

                })
              } else {
                //用户已存在，更新用户信息
                let { userInfo } = this.data
                db.collection('user-info').where({
                  openId: openId
                }).update({
                  data: {
                    nickName: userInfo.nickName,
                    avatarUrl: userInfo.avatarUrl,
                    gender: userInfo.gender
                  }
                }).then(res => {
                  console.log('更新信息')
                  db.collection('user-info').where({
                    openId: openId
                  }).field({
                    nickName: true,
                    avatarUrl: true,
                    gender: true,
                    is_admin: true,
                    created: true
                  }).get().then(res => {
                    this.setData({
                      userInfo: res.data[0],
                      hasLogin: true
                    })
                    wx.setStorageSync('storage_info', 1)
                    this.getCartData()
                  })


                })

              }
            })
          }
        })
      }
    })
  },

  // 获取并设置商品信息
  async setGoodsInfo(newCart) {

    for (let i in newCart) {
      let res = await goods_info.doc(newCart[i].product_id[0]).get()
      console.log('信息结果', res)
    }
  },

  //切换购物车状态
  switchEdit() {
    let { isEdit } = this.data
    this.setData({
      isEdit: !isEdit
    })
  },

  // 勾选购物车列表
  onChange(event) {
    Toast.loading({
      message: '加载中...',
      forbidClick: true,
    });
    let eventData = event.currentTarget.dataset;
    let index = eventData.index
    let { cartData } = this.data

    cartData[index].selected = event.detail


    this.setData({
      cartData: cartData
    })

    // this.hasSelectAll();
    this.checkCart(this.data.cartData)
    console.log('勾选', this.data.cartData[index].selected)
  },

  // 全选按钮
  selectAll() {
    Toast.loading({
      message: '加载中...',
      forbidClick: true,
    });
    let { isSelectAll, cartData } = this.data
    for (let i in cartData) {
      cartData[i].selected = !isSelectAll
    }

    this.setData({
      cartData: cartData,
      isSelectAll: !isSelectAll
    })
    this.checkCart(this.data.cartData)


  },

  // 判断是否所有商品被选中
  hasSelectAll() {
    let { cartData } = this.data
    for (let i in cartData) {
      if (cartData[i].selected == false) {
        this.setData({ isSelectAll: false })
        return
      }
    }

    this.setData({ isSelectAll: true })
  },

  // 步进器处理
  setStepper(event) {
    // Toast.loading({ forbidClick: true });
    Toast.loading({
      message: '加载中...',
      forbidClick: true,
    });
    console.log('事件', event)
    let number = event.detail
    let index = event.currentTarget.dataset.index
    let { cartData } = this.data
    cartData[index].number = number
    this.setData({
      cartData: cartData
    })
    this.checkCart(this.data.cartData)
  },

  // 计算勾选的商品总价
  countTotalPrice() {
    let cart = wx.getStorageSync('cart') || []
    let totalPrice = 0
    console.log('缓存中的购物车', cart)
    if (cart.length == 0) {
      this.setData({ totalPrice: totalPrice })
      return
    } else {
      for (let i in cart) {
        if (cart[i].selected == true) {
          totalPrice = (cart[i].number * cart[i].price) + totalPrice

        }
      }
      this.setData({ totalPrice: totalPrice.toFixed([2]) })
    }
  },

  // 删除勾选的商品
  deleteGoods() {
    let cart = wx.getStorageSync('cart') || []
    if (cart.length == 0) {
      return
    }

    if (this.data.isSelectAll == true) {
      cart = []
      this.checkCart(cart)
    } else {
      let newCart = cart.filter((item, index) => {
        return item.selected == false
      })

      console.log('删除后的购物车', newCart)
      this.checkCart(newCart)
    }
  },

  // 获取推荐列表
  async getRecommendedData() {
    let res = await goods_info.orderBy('sales_volume', 'desc').limit(6).get()
    console.log('推荐商品', res)
    this.setData({
      recommendedData: res.data
    })
  },

  // 推荐列表跳转
  pushToDetail(event) {
    let eventData = event.currentTarget.dataset;
    console.log('参数', eventData)
    wx.navigateTo({
      url: '../detail/detail?id=' + eventData.id
    })
  },

  // 商品列表跳转至商品详情
  push(event) {
    console.log('参数11111111111111111111', event)
    if (event.target.id === "") {
      wx.navigateTo({
        url: '../detail/detail?id=' + event.currentTarget.dataset.item[0],
      })
    }
  },

  // 商品结算
  settlement() {
    let cart = wx.getStorageSync('cart') || []
    if (cart.length == 0) {
      Toast('您还没选择商品哦');
      return;
    }

    let newCart = cart.filter((item) => {
      return item.selected == true
    })

    if (newCart.length == 0) {
      Toast('您还没选择商品哦');
      return;
    }

    console.log('选中的商品', newCart)
    wx.setStorageSync('back', 'cart')
    wx.navigateTo({
      url: '../order/order?from=' + 'cart',
    })
  },

  // 用户登录后，获取购物车商品数量
  getCartCount() {
    if (wx.getStorageSync('storage_info') == 1) {
      console.log('用户登录后')
      let cart = wx.getStorageSync('cart') || []
      if (cart.length > 0) {
        getApp().globalData.number = cart.length
      } else {
        getApp().globalData.number = ''

      }
    } else {
      getApp().globalData.number = ''
    }
  },
  onLoad: function (options) {
    console.log('第一次加载')
    this.getRecommendedData()
  },
  onShow() {
    this.getTabBar().setData({
      active: 2
    })

    // this.getCartCount()

    this.setData({
      isEdit: false
    },
      () => {
        this.getOpenId()
      }
    )

    Toast.clear();
  },
  onHide() {
    console.log('隐藏')
    Toast.clear();

  },
  // 下拉刷新
  onPullDownRefresh: function () {
    console.log('下拉')
    if (wx.getStorageSync('storage_info') !== 1) {
      console.log('没登陆')
      wx.stopPullDownRefresh()

      return
    }
    let cart = wx.getStorageSync('cart') || []
    if (cart.length == 0) {
      console.log('没货物')
      wx.stopPullDownRefresh()

      return
    }
    this.checkCart(cart)
    wx.stopPullDownRefresh()
  },
})
