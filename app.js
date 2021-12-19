// app.js
App({
  onLaunch() {
    wx.cloud.init({
      env: '',
      traceUser: true
    })

    // this.getCartCount()
  },

  globalData: {
    userInfo: null,
    number: ''
  },


})
