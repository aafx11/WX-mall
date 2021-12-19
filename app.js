// app.js
App({
  onLaunch() {
    wx.cloud.init({
      env: '',// 填自己的环境id
      traceUser: true
    })

    // this.getCartCount()
  },

  globalData: {
    userInfo: null,
    number: ''
  },


})
