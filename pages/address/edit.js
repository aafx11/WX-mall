let that;
Page({
  data: {
    address:{
      id:0,
      name:'',
      mobile:'',
      city:'',
      street:''
    }
  },
  onLoad: function (options) {
    that = this
    console.log('接受数据',options)
    if(options.address){
      this.setData({
        address:JSON.parse(options.address)
      })
    }

  },
  onReady: function () {

  },
  onShow: function () {

  },
  inputName(e){
    this.data.address.name = e.detail.value;
    this.setData({
      address:this.data.address
    })
  },
  inputMobile(e){
    this.data.address.mobile = e.detail.value;
    this.setData({
      address:this.data.address
    })
  },
  inputStreet(e){
    this.data.address.street = e.detail.value;
    this.setData({
      address:this.data.address
    })
  },
  bindRegionChange(e){
    let city = e.detail.value;// 省，市，区的数组
    this.data.address.city = city.join(" ")
    this.setData({
      address:this.data.address
    })
  },
  // 选择默认收货地址点击事件
  clickDefault(){
    let {address} = this.data
    if(address.isDefault){
      address.isDefault = false
      address.selected = false
    } else{
      address.isDefault = true
      address.selected = true
    }
    console.log('是否默认地址',address.isDefault)
    console.log('是否选中',address.selected)

    this.setData({
      address:address
    })
  },

  // 保存地址前的验证
  checkAddress(){
    let {address} = this.data
    let tip = ""
    if(address.name.length == 0){
      tip="请填写收货人姓名"
    }
    else if(address.mobile.length == 0){
      tip="请填写收货人手机号"
    }
    else if(address.city.length == 0){
      tip="请选择收货人所在地址"
    }
    else if(address.street.length == 0){
      tip="请填写收货人详细地址"
    }
    if(tip.length == 0){
      return true
    } else{
      wx.showToast({
        icon:'none',
        title: tip,
      })
      return false
    }

  },

  // 保存或添加收货地址
  clickAdd(){
    if(!this.checkAddress()){
      return
    }
    
    let addressList = wx.getStorageSync('address') || [] // 缓存中的地址数组
    let {address} = this.data // 正在操作的地址对象
    let newAddressList = [] // 更新后的地址数组
    let isAdd = false // 是否是添加操作

    console.log('正在编辑的对象',address)
    console.log('获取的地址列表',addressList)

    // 添加地址处理
    if(address.id == 0){
      console.log('添加地址')
      isAdd = true;
      address.id = Math.floor(Math.random()*10000 + 1)
      if(address.isDefault){
        address.selected = true
        for(let i in addressList){
          addressList[i].isDefault = false
          addressList[i].selected = false
        }
        newAddressList = [address,...addressList]
      }else{
        newAddressList = [...addressList,address]
      }
    } else {
    // 编辑地址操作
    isAdd = false
    console.log('编辑地址的列表',addressList)
      for(let i in addressList){
        if(addressList[i].id == address.id){
          addressList[i].name = address.name;
          addressList[i].mobile = address.mobile;
          addressList[i].city = address.city;
          addressList[i].street = address.street

          if(address.isDefault){
            console.log('选为默认地址')
            for(let j in addressList){
              addressList[j].isDefault = false
              addressList[j].selected = false

            }
            addressList[i].isDefault = true
            addressList[i].selected = true
          }else{
            addressList[i].isDefault = false
            addressList[i].selected = false
          }
        }
      }
      newAddressList = addressList
    }
    console.log('最终的地址列表',newAddressList)
    wx.setStorageSync('address', newAddressList)
    wx.showToast({
      icon:'success',
      title: isAdd==true?'添加成功':'保存成功',
      success(){
        wx.navigateBack({
          delta: 0,
        })
      }
    })
  },
  //点击获取所在位置
  clickLocation(){
    wx.authorize({
      scope: 'scope.userLocation',
      success(e){
        wx.getLocation({
          type:'gcj02',
          success(location){
            console.log('第二部',location)
            wx.chooseLocation({
              success(res){
                let city = res.address
                that.data.address.city = city
                that.setData({
                  address:that.data.address
                })
              }
            })
          }
        })
      }
    })
  }

})