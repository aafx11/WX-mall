import userLogin from '../../util/login.js'
// const util = require('../../util/login.js')
Page({


  data: {

  },


  onLoad: function (options) {

  },

  back(){
    wx.navigateBack()
  },
  login(){
    let that = this
    userLogin(that)
    // userLogin().apply(this)
    // util.userLogin.apply(this)
  }

})