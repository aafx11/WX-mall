import login from '../../util/login.js';
import Toast from '../../miniprogram_npm/@vant/weapp/toast/toast.js';
const db = wx.cloud.database();
const _ = db.command
const goods_info = db.collection('goods_info')
const goods_attribute = db.collection('goods_attribute')
const product_stock = db.collection('product_stock')
Page({


  data: {
    goodsInfo: {},
    attribute: {},
    skuSelect: [],//可选列表，规格类型列表
    stock: {},//库存信息，与已选中的值进行匹配，查看库存
    stockMap: {},
    selGoodsInfo: {//选中的商品信息
      selPrice: '-',
      selStock: '-',
      selImage: '',
      hasSel: ''
    },
    selectArr: [],//已选的规格
    subIndex: [],//是否选中，将选中的具体规格存入,
    goodsCount: 1,
    previousStock: 0,
    show: false,
    selectShow: false,
    expressShow: false,
    stepperDisable: true,//计数器禁用
    isNormal: false,
    isCart: false,
    isBuy: false,
    cartNumber:''
  },
  showPopup() {
    this.setData({ show: true });
  },

  onClose() {
    this.setData({ show: false });
  },
  showSelect() {
    this.setData({
      selectShow: true,
      isNormal: true,
      isBuy: false,
      isCart: false
    });

  },
  onCloseSelect() {
    this.setData({ selectShow: false });
  },

  showExpress() {
    this.setData({ expressShow: true });

  },
  onCloseExpress() {
    this.setData({ expressShow: false });
  },

  //获取商品信息，包括可选规格
  async getGoodsDetail(id) {
    let res = await goods_info.doc(id).get()
    this.setData({
      goodsInfo: res.data
    })
    console.log('商品信息', this.data.goodsInfo)
    let temp = {
      name: '颜色',
      select: []
    }
    for (let i = 0; i < res.data.jsonColor.length; i++) {
      temp.select.push(res.data.jsonColor[i])
    }
    let temp1 = {
      name: '尺寸',
      select: []
    }
    for (let j = 0; j < res.data.jsonSize.length; j++) {
      temp1.select.push(res.data.jsonSize[j])
    }
    this.data.skuSelect.push(temp)
    this.data.skuSelect.push(temp1)
    this.setData({
      skuSelect: this.data.skuSelect
    })
    console.log('可选规格', this.data.skuSelect)
  },
  //获取商品属性
  async getGoodsAttribute(id) {
    let att = await goods_attribute.where({
      id: _.in([id])
    }).get()

    this.setData({
      attribute: att.data[0]
    })
    console.log('属性', this.data.attribute)
  },

  //获取商品库存
  async getStockData(id) {
    let res = await product_stock.where({
      product_id: id
    }).get();
    console.log("商品库存", res)
    this.setData({
      stock: res.data,
      ['selGoodsInfo.selImage']: res.data[0].color_image,
      ['selGoodsInfo.selPrice']: res.data[0].price,
      ['selGoodsInfo.selStock']: res.data[0].stock
    })


    console.log('图片', this.data.selGoodsInfo.selImage)

    let tempMap = new Map();
    for (let x in res.data) {
      let color = res.data[x].color
      let size = res.data[x].size
      tempMap[`${color},${size}`] = res.data[x]
    }
    this.setData({
      stockMap: tempMap
    })
    console.log('map库存', this.data.stockMap)
  },

  //选择规格处理
  chouseModelType(event) {


    let eventData = event.currentTarget.dataset;
    let name = eventData.name;
    let curIndex = eventData.index;//所选的规格
    let curIndexParent = eventData.parentIndex;//规格类型，0颜色，1尺寸
    let curState = eventData.state;
    let { selectArr, subIndex } = this.data;

    if (curState == 'ban') {
      return;
    }

    if (selectArr[curIndexParent] != name) {
      selectArr[curIndexParent] = name;
      subIndex[curIndexParent] = curIndex;
    } else {
      selectArr[curIndexParent] = "";
      subIndex[curIndexParent] = -1;
    }

    console.log('selectArr:', selectArr);
    console.log('subIndex:', subIndex);
    if (selectArr[0]) {
      console.log('库存', this.data.stock)
      let stock = this.data.stock;
      let color = selectArr[0]
      for (let i in stock) {
        if (color == stock[i].color) {
          this.setData({
            ['selGoodsInfo.selImage']: stock[i].color_image,
          })
          break;
        }
      }
    }
    this.setData({
      selectArr,
      subIndex
    })
    this.checkStock();
  },

  //判断选中的规格是否有库存
  checkStock: function () {
    //                     modelTypeLists, shopItemInfo
    let { selectArr, subIndex, skuSelect, stock, stockMap } = this.data;
    let result = []; //存储被选中的值
    let option = skuSelect;//所有规格选项

    //获取以选的值，有多少个值可以从所有规格选项中获取
    for (let t in option) {
      result[t] = selectArr[t] ? selectArr[t] : '';
    }
    this.setData({
      ['selGoodsInfo.hasSel']: result.join('')
      // ['selGoodsInfo.hasSel']:result.toString()

    })
    //更新规格的state,判断是否有库存
    for (let i in option) {
      let last = result[i];//存储已选中的值
      //在已选一个规格情况下，更新第二个规格的state
      //循环以选规格那一轮是无意义的，直接return false,只有定了一个规格，循环第二个规格时，才能匹配到库存，所以要保存已选的result
      for (let k in option[i].select) {
        result[i] = option[i].select[k].name;
        option[i].select[k].state = this.hasStock(result)
      }
      result[i] = last
    }

    //更新选项状态
    this.setData({
      skuSelect: option
    })

    //更新已选的商品价格，图片，库存等信息
    let temp = result.join(',')
    if (stockMap[temp]) {
      console.log('已选中', stockMap[temp])

      // let cart = wx.getStorageSync('cart') || []
      // let index = cart.findIndex(v => v.product_id[0] === stockMap[temp].product_id[0])

      // if(index === -1){
      //   this.setData({
      //     maxCount:stockMap[temp].stock
      //   })
      // } else{
      //   this.setData({
      //     maxCount: stockMap[temp].stock
      //   })
      // }
      // if(stockMap[temp].stock - this.data.previousStock < 0){
      //   this.setData({
      //     goodsCount: stockMap[temp].stock
      //   })
      // console.log('数量',this.data.goodsCount)

      // }

      if (this.data.goodsCount > stockMap[temp].stock) {
        this.setData({
          goodsCount: stockMap[temp].stock
        })
        console.log('数量', this.data.goodsCount)
      }

      this.setData({
        ['selGoodsInfo.selStock']: stockMap[temp].stock,
        ['selGoodsInfo.selPrice']: stockMap[temp].price,
        // ['selGoodsInfo.selImage']:stockMap[temp].color_image,
        previousStock: stockMap[temp].stock,
        stepperDisable: false,
      })

    } else {
      console.log('没选中')
      this.setData({
        stepperDisable: true,

      })
    }
    console.log(this.data.selGoodsInfo)
  },
  hasStock: function (result) {

    let { stockMap } = this.data;
    for (let y in result) {
      if (result[y] == '') {

        return false;
      }
    }
    let temp = result.join(',')

    return stockMap[temp].stock == 0 ? 'ban' : ''
  },

  //购买
  buy() {
    let { selectArr, stockMap } = this.data
    console.log(selectArr)
    let temp = selectArr.join(',')

    if (!stockMap[temp]) {
      console.log('不能购买', selectArr.join(''))

      if (selectArr.join('') == '') {
        Toast('请选择颜色和尺寸');
        return;
      } else if (!selectArr[0]) {
        Toast('请选择颜色');
        return;
      } else if (!selectArr[1]) {
        Toast('请选择尺寸');
        return;
      }
    }


    let goods = stockMap[temp]
    goods.number = this.data.goodsCount
    goods.name = this.data.goodsInfo.name
    let purchase = []
    purchase.push(goods)

    console.log('购买',purchase)
    
    wx.setStorageSync('purchase', purchase)
    // wx.setStorageSync('back', purchase[0].product_id[0])
    wx.setStorageSync('back', 'detail')

    wx.navigateTo({
      url: '../order/order?from='+ 'buy',
    })
  },

  addToCart() {
    if (wx.getStorageSync('storage_info') !== 1) {
      console.log('未授权，手动登录')
      wx.navigateTo({
        url: "../login/login"
      })
      return
    }

    let { selectArr, stockMap } = this.data
    console.log(selectArr)
    let temp = selectArr.join(',')
    //判断是否已经选好了颜色和尺寸
    if (!stockMap[temp]) {
      console.log('不能购买', selectArr.join(''))

      if (selectArr.join('') == '') {
        Toast('请选择颜色和尺寸');
        return;
      } else if (!selectArr[0]) {
        Toast('请选择颜色');
        return;
      } else if (!selectArr[1]) {
        Toast('请选择尺寸');
        return;
      }
    }
    console.log('已选中', stockMap[temp])
    let cart = wx.getStorageSync('cart') || []

    //1.判断商品对象是否已存在于购物车中
    let index = cart.findIndex(v => v._id === stockMap[temp]._id)
    console.log('是否查询到', index)
    if (index === -1) {
      console.log('商品不存在')

      // 获取商品的name
      goods_info.doc(stockMap[temp].product_id[0]).get().then(res => {

        console.log('加购的商品', res)
        //商品不存在于购物车中,将商品以及所选数量push进数组
        stockMap[temp].name = res.data.name
        stockMap[temp].number = 0
        stockMap[temp].number = this.data.goodsCount
        stockMap[temp].selected = false
        stockMap[temp].disabled = false
        console.log(this.data.stockMap[temp])
        cart.push(stockMap[temp])
        wx.setStorageSync('cart', cart)
        Toast('加购成功');
        console.log('购物车后', wx.getStorageSync('cart'))
        this.getCartCount()
      })



    } else {
      console.log('商品已存在')
      //商品已存在于购物车中，更新购物车中该商品的信息，库存，购买数量
      if (cart[index].number + this.data.goodsCount > stockMap[temp].stock) {
        Toast('商品加购件数(含已加购件数)已超过库存');
      } else {
        stockMap[temp].name = cart[index].name
        stockMap[temp].number = 0
        stockMap[temp].number = cart[index].number + this.data.goodsCount
        // delete cart[index];
        stockMap[temp].selected = false
        stockMap[temp].disabled = false
        cart[index] = stockMap[temp]
        // cart.push(stockMap[temp])
        wx.setStorageSync('cart', cart)
        Toast('加购成功');
        this.getCartCount()
      }
    }
  },

  //添加购买数量
  addCount() {
    console.log('增加')
    let { selectArr, stockMap } = this.data
    console.log(selectArr)
    let temp = selectArr.join(',')
    //判断是否已经选好了颜色和尺寸
    if (!stockMap[temp]) {
      console.log('不能购买', selectArr.join(''))

      if (selectArr.join('') == '') {
        Toast('请选择颜色和尺寸');
        return;
      } else if (!selectArr[0]) {
        Toast('请选择颜色');
        return;
      } else if (!selectArr[1]) {
        Toast('请选择尺寸');
        return;
      }
    }
  },
  onChange(event) {
    this.setData({
      goodsCount: event.detail
    })
    console.log(this.data.goodsCount);

  },
  onLoad: function (options) {
    this.getGoodsDetail(options.id)
    this.getGoodsAttribute(options.id)
    this.getStockData(options.id)
  },
  onShow: function(){
    Toast.clear();
    this.getCartCount()
  },
  openCart() {
    this.setData({
      selectShow: true,
      isNormal: false,
      isBuy: false,
      isCart: true
    });
  },
  openBuy() {
    this.setData({
      selectShow: true,
      isNormal: false,
      isBuy: true,
      isCart: false
    });
  },
  getCartCount(){
    if(wx.getStorageSync('storage_info') == 1){
      let cart = wx.getStorageSync('cart') || []
      if(cart.length != 0){
        this.setData({
          cartNumber:cart.length
        })
      }else{
        this.setData({
          cartNumber:''
        })
      }
    } else{
      this.setData({
        cartNumber:''
      })
    }
  }
})