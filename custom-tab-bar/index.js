// let number = getApp().globalData.number
Page({
  data: {
    active:0,
    list:[
      {
        "pagePath": "/pages/index/index",
        "text":"首页",
        "iconPath": "wap-home-o",
        "selectedIconPath": "wap-home"
      },
      {
        "pagePath": "/pages/sort/sort",
        "text":"分类",
        "iconPath": "apps-o",
        "selectedIconPath": "apps"
      },
      {
        "pagePath": "/pages/cart/cart",
        "text":"购物车",
        "iconPath": "cart-o",
        "selectedIconPath": "cart",
        // "info":"5"
      },
      {
        "pagePath": "/pages/my/my",
        "text":"我的",
        "iconPath": "contact",
        "selectedIconPath": "contact"
      }
    ]
  },
  
    onChange(e){
      let index = e.detail;
      this.setData({
        active:index
      })

      wx.switchTab({
        url: this.data.list[index].pagePath,
      })
    },
 
  onLoad: function (options) {
    console.log('加载')
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow(){
    
    this.getTabBar().setData({
      active:0
    })

  console.log('底部栏')
  },



})