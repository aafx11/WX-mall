// app.js
App({
  onLaunch() {
    wx.cloud.init({
      env: '', //填自己的cloudId
      traceUser: true
    })

    // this.getCartCount()
  },

  globalData: {
    userInfo: null,
    number: ''
  },

  // 用户登录后，获取购物车商品数量
  getCartCount() {
    if (wx.getStorageSync('storage_info') == 1) {
      console.log('用户登录后')
      let cart = wx.getStorageSync('cart') || []
      if (cart.length > 0) {
        this.globalData.number = cart.length
      } else {
        this.globalData.number = ''

      }
    } else{
      this.globalData.number = ''
    }
  }
})
