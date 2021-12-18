
const db = wx.cloud.database();
const goods_info = db.collection('goods_info')
const product_stock = db.collection('product_stock')

Page({
  data: {
    goodsInfo: {},//商品信息
    stock: {},//库存信息，与已选中的值进行匹配，查看库存
    stockMap: {},
    skuSelect: [],//可选列表，规格类型列表
    selGoodsInfo: {
      selPrice: '-',
      selStock: '-',
      selImage: '',
      hasSel:''
    },
    selectArr: [],//已选的规格
    subIndex: [],//是否选中，将选中的具体规格存入
  },


  onLoad: function (options) {
    this.getGoodsInfoData();
    this.getStockData();
  },
  onShow: function () {
    this.getTabBar().setData({
      active: 4
    })
  },
  //获取货物信息
  async getGoodsInfoData() {
    let res = await goods_info.doc('8e1706526189259a030cbce769617154').get();
    console.log("商品信息", res.data)
    this.setData({
      goodsInfo: res.data
    })
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
    console.log(this.data.skuSelect)
  },

  //获取库存信息
  async getStockData() {
    let res = await product_stock.where({
      product_id: '8e1706526189259a030cbce769617154'
    }).get();
    console.log("商品库存", res)
    this.setData({
      stock: res.data,
      ['selGoodsInfo.selImage']: res.data[0].color_image
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
  selectColor(e) {

    for (let i = 0; i < this.data.goodsInfo.jsonColor.length; i++) {
      this.data.goodsInfo.jsonColor[i].state = ""
    }
    this.setData({
      goodsInfo: this.data.goodsInfo
    })
    let index = e.currentTarget.dataset.index;
    this.data.goodsInfo.jsonColor[index].state = "select"


    this.setData({
      goodsInfo: this.data.goodsInfo
    })

  },
  //选择规格处理
  chouseModelType(event) {
    console.log('参数', event)
    console.log('参数data', this.data)

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
      ['selGoodsInfo.hasSel']:result.join('')
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
      this.setData({
      ['selGoodsInfo.selStock']:stockMap[temp].stock,
      ['selGoodsInfo.selPrice']:stockMap[temp].price,
      ['selGoodsInfo.selImage']:stockMap[temp].color_image,
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

  buy:function(){
    let {selectArr,stockMap} = this.data
    console.log(selectArr)
    let temp = selectArr.join(',')
    // for(let s in selectArr){
    //   if(selectArr[s] == '' ){
    //     console.log('不能购买')
    //   }
    // }
    if(!stockMap[temp]){
      console.log('不能购买')
      Toast('不能购买');
    }
  }
})

