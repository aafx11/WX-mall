// pages/sort/sort.js

const db = wx.cloud.database();
const product_category_json = db.collection('product_category_json')
const goods_info = db.collection('goods_info')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    activeKey: 0,
    allData: [],
    firstSort: [],
    selectData: {},
    selectName: '',
    isShow: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getSortData();
  },
  //获取分类信息  
  async getSortData() {
    let res = await product_category_json.get()
    console.log('获取的信息', res)
    this.setData({
      allData: res.data[2].json
    })
    console.log(this.data.allData)
    let sale = await goods_info.orderBy('sales_volume', 'desc').limit(15).get()

    console.log(sale.data[0])
    for (let i = 0; i < sale.data.length; i++) {
      this.data.allData[0].child.push(sale.data[i])
    }

    let newGoods = await goods_info.where({
      is_NewProducts: true
    }).orderBy('_createTime', 'desc').limit(15).get()
    console.log('新品', newGoods)
    for (let j = 0; j < newGoods.data.length; j++) {
      this.data.allData[1].child.push(newGoods.data[j])
    }

    this.setData({
      allData: this.data.allData,
      selectData: this.data.allData[0]
    })
    console.log('热销', this.data.allData)
  },

  selectType(event) {
    let eventData = event.currentTarget.dataset;
    let index = eventData.index;
    let { allData } = this.data;
    this.setData({
      selectData: allData[index]
    })

    console.log('消息', this.data.selectData)


  },
  onChange(event) {
    console.log(event)
  },

  pushToSearchPage(e) {
    const event = e.currentTarget.dataset
    console.log(event)
    let { item } = event
    // let select_name = item.select-name
    // console.log(select_name)
    console.log(item.select)

    wx.navigateTo({
      url: '../search/search?name=' + item.select
    })
  },
  pushToDeatilPage(e){
    const event = e.currentTarget.dataset
    console.log(event)
    
    wx.navigateTo({
      url: '../detail/detail?id=' + event.id
    })
  },
  onShow() {
    this.getTabBar().setData({
      active: 1
    })
  },


})