// app.js
App({
  onLaunch() {
    wx.cloud.init({
      env: '123',
      traceUser: true
    })

    // this.getCartCount()
  },

  globalData: {
    userInfo: null,
    number: ''
  },


})
