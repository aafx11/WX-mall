
Page({
  data: {
    addressListData:[],
    from:'' //
  },
  onLoad: function (options) {
  
    console.log('参数',options)
    if(options.from == 'order'){
      this.setData({from:'order'})
    } else {
      this.setData({from:'my'})

    }
    this.getAddressListData()
  },
  onReady: function () {

  },
  onShow: function () {
    this.getAddressListData()

  },


  // 获取用户在微信中存储的地址信息
  getWXAddress(){
    wx.chooseAddress({
      success (res) {
        console.log(res.userName)
        console.log(res.postalCode)
        console.log(res.provinceName)
        console.log(res.cityName)
        console.log(res.countyName)
        console.log(res.detailInfo)
        console.log(res.nationalCode)
        console.log(res.telNumber)
      }
    })
  },

  // 选择地址
  selectAddress(e){
    console.log('选择地址')
    let index = e.currentTarget.dataset.index;
    let {addressListData} = this.data
    addressListData.forEach((item)=>{
      item.selected = false
    })
    addressListData[index].selected = true
    this.setData({
      addressListData:addressListData
    })
    wx.setStorageSync('address', this.data.addressListData)

    wx.navigateBack()
    
  },

  // 点击选择默认地址
  clickDefault(e){
    console.log('地址')
    let index = e.currentTarget.dataset.index;
    this.data.addressListData.forEach((a)=>{
      a.isDefault = false;    
      a.selected = false;
    })
    this.data.addressListData[index].isDefault = true;
    this.data.addressListData[index].selected = true
    // 将选中的默认地址 放置第一位
    let address = this.data.addressListData.splice(index,1)[0] // 将选中的地址单独分割出来
    this.data.addressListData = [address,...this.data.addressListData]
    this.setData({
      addressListData:this.data.addressListData
    })
    wx.setStorageSync('address', this.data.addressListData)
    
    if(this.data.from == 'order'){
      wx.navigateBack()
    }
  },

  // 删除收货地址点击事件
  clickDelete(e){
    let index = e.currentTarget.dataset.index;
    let {addressListData} = this.data
    addressListData.splice(index,1)
    this.setData({
      addressListData:addressListData
    })
    wx.setStorageSync('address', this.data.addressListData)
  },

  // 编辑收货地址点击事件
  clickEdit(e){
    let index = e.currentTarget.dataset.index;
    let address = this.data.addressListData[index]
    wx.navigateTo({
      url: '../address/edit?address=' + JSON.stringify(address),
    })
  },

  // 添加收货地址点击事件
  clickAdd(e){
    wx.navigateTo({
      url: '../address/edit'
    })
  },

  // 从缓存中获取收货地址
  getAddressListData(){
    let addressList = wx.getStorageSync('address') || []
    console.log('缓存中获取的地址',addressList)
    this.setData({
      addressListData:addressList
    })
  }
})