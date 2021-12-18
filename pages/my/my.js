import Toast from '../../miniprogram_npm/@vant/weapp/toast/toast.js';
const db = wx.cloud.database();
const _ = db.command
const orderDB = db.collection('order')

Page({
  data: {
    userInfo: {},
    hasUserInfo: false,
    canIUseGetUserProfile: false,
    count: {
      wait: '', //待付款
      shipment: '', // 待发货
      received: '', // 待收货
      completed: '', //已完成
    },
    showCount: false,
  },
  login() {
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (res) => {
        Toast.loading({
          message: '加载中...',
          forbidClick: true,
        });
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
                      hasUserInfo: true

                    })
                    wx.setStorageSync('storage_info', 1)
                    this.getOrderCount()
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
                      hasUserInfo: true
                    })
                    wx.setStorageSync('storage_info', 1)
                    this.getOrderCount()
                  })


                })

              }
            })
          }
        })
      }
    })
  },
  getOpenId() {
    // console.log('检查')

 

    wx.getStorage({
      key: 'storage_info',
      success: (res) => {
        console.log(res.data)
        if (res.data == 0) {

          console.log('未授权，手动登录')
          this.setData({
            hasUserInfo: false,
          })
          let count = {
            wait: '',
            shipment: '',
            received: '',
            completed: '',
          }


          this.setData({
            count: count
          })
          Toast.clear();

        } else if(res.data == 1) {
          Toast.loading({
            message: '加载中...',
            forbidClick: true,
          });
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
                    hasUserInfo: true
                  })
                }
                this.getOrderCount()
              })

            }
          })
        }
      },
      fail: (res) => {
        console.log('失败')
        wx.setStorage({
          key: 'storage_info',
          data: 0,
          success: () => {
            console.log('添加成功')
            this.setData({
              hasUserInfo: false,
            })
            let count = {
              wait: '',
              shipment: '',
              received: '',
              completed: '',
            }
  
  
            this.setData({
              count: count
            })
            Toast.clear();
          }
        })
      }
    })


    // if (wx.getStorageSync('storage_info') !== 1) {
    //   console.log('未授权，手动登录')
    //   this.setData({
    //     hasUserInfo: false,
    //   })
    //   this.getOrderCount()

    // } else {
    //   console.log('已授权，在数据库获取信息')
    //   wx.cloud.callFunction({
    //     name: 'getOpenid',
    //     success: res => {
    //       console.log('获取openid', res)
    //       let openid = res.result.openid
    //       const db = wx.cloud.database()
    //       db.collection('user-info').where({
    //         openId: openid
    //       }).field({
    //         nickName: true,
    //         avatarUrl: true,
    //         gender: true,
    //         is_admin: true,
    //         created: true
    //       }).get().then(res => {
    //         console.log('已授权的情况下在数据库获取信息', res)
    //         if (res.data[0]) {
    //           this.setData({
    //             userInfo: res.data[0],
    //             hasUserInfo: true
    //           })
    //         }
    //         this.getOrderCount()
    //       })

    //     }
    //   })
    // }



  },
 
  logout() {
    // wx.setStorageSync('storage_info', 0)
    // Toast.loading({
    //   message: '加载中...',
    //   forbidClick: true,
    // });
    wx.setStorage({
      key: "storage_info",
      data: 0,
      success:()=>{
        this.setData({
          // showCount: false,
          hasUserInfo: false
        })
        this.getOrderCount()
      },
      fail:(res1)=>{
        console.log('退出失败',res1)
      }
    })
    // .then(() => {

    // })
    // this.onLoad()


  },

  // 获取各类订单数量
  getOrderCount() {

    wx.getStorage({
      key: 'storage_info',
      success: async (res) => {
        console.log('信息', res)
        if (res.data == 1) {
          let { count } = this.data
          let wait = await orderDB.where({ state: "1" }).count()
          let shipment = await orderDB.where({ state: "2" }).count()
          let received = await orderDB.where({ state: "3" }).count()
          let completed = await orderDB.where({ state: "4" }).count()

          count.wait = wait.total
          count.shipment = shipment.total
          count.received = received.total
          count.completed = completed.total
          console.log('已经登录')
          this.setData({
            count: count,
            // showCount: true
          })
          Toast.clear();
        } else {
          let { count } = this.data
          count.wait = ''
          count.shipment = ''
          count.received = ''
          count.completed = ''
          console.log('没登录')

          this.setData({
            count: count,
            // showCount: false
            // hasUserInfo: false
          })
          Toast.clear();
        }

      },
      fail:()=>{
        wx.setStorage({
          key:'storage_info',
          data:0,
          success:()=>{
            let { count } = this.data
            count.wait = ''
            count.shipment = ''
            count.received = ''
            count.completed = ''
            console.log('没登录')
  
            this.setData({
              count: count,
              // showCount: false
              hasUserInfo: false
            })
            Toast.clear();
          }
        })
      }
    })

    // if (wx.getStorageSync('storage_info') == 1) {
    //   let { count } = this.data
    //   let wait = await orderDB.where({ state: "1" }).count()
    //   let shipment = await orderDB.where({ state: "2" }).count()
    //   let received = await orderDB.where({ state: "3" }).count()
    //   let completed = await orderDB.where({ state: "4" }).count()

    //   count.wait = wait.total
    //   count.shipment = shipment.total
    //   count.received = received.total
    //   count.completed = completed.total

    //   this.setData({
    //     count: count,
    //     showCount: true
    //   })

    // } else {
    //   // let {count} = this.data
    //   // count.wait = ''
    //   // count.shipment = ''
    //   // count.received = ''
    //   // count.completed = ''
    //   this.setData({
    //     // count:count,
    //     showCount: false
    //   })
    // }
  },

  // 跳转至订单列表页面点击事件
  pushToOrderList(event) {
    console.log('event', event)
    if (wx.getStorageSync('storage_info') == 1) {
      let type = event.currentTarget.dataset.type
      wx.navigateTo({
        url: '../orderList/orderList?type=' + type,
      })
    } else {
      wx.navigateTo({
        url: '../login/login',
      })
    }
  },

  // 跳转至地址管理点击事件
  pushToAddress() {
    if (wx.getStorageSync('storage_info') == 1) {
      wx.navigateTo({
        url: '../address/address?from=' + 'my',
      })
    } else{
      wx.navigateTo({
        url: '../login/login',
      })
    }


  },
  onLoad: function (options) {
    // if (wx.getUserProfile) {
    //   this.setData({
    //     canIUseGetUserProfile: true
    //   })
    // }
    // this.getOpenId();

  },
  onShow() {

    this.getOpenId();
    // this.getOrderCount();
    this.getTabBar().setData({
      active: 3
    })
  },
  onHide(){
    Toast.clear();
  }
})