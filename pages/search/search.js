const db = wx.cloud.database();
const _ = db.command
const goods_info = db.collection('goods_info')
const product_category = db.collection('product_category')
const product_stock = db.collection('product_stock')




Page({
  data: {
    clothesData: [],
    name: '',
    content: '',
    page: 0,
    searchData: [],
    hasData: false,
    fromSortPage: 1,
    category_id: '',
    order_condition: 'sales_volume',//_createTime,price
    mode: 'sales_volume',//_createTime,price
    option: [
      { name: '热销', state: true, mode: 'sales_volume' },
      { name: '新品', state: false, mode: '_createTime' },
      { name: '价格', state: false, mode: 'price' },

    ],
    isFocus: false,
    isLoading: false,//正在获取数据
    isBottom: false,//更新完所有数据后，底部提示
    hasMoreData: true,
    dataCount: 0//查找的数据总数

  },
  //通过分类id获取数据
  async getSearchDataByUrl(id) {
    if (!this.data.hasMoreData) {
      console.log('没有数据了,不在执行后续')
      return;
    }
    this.setData({ isLoading: true })

    const LIMIT = 6
    let res = await goods_info.where({
      category: _.in([id])

    }).orderBy(this.data.order_condition, 'desc').limit(LIMIT).skip(this.data.page * LIMIT).get()
    if (this.data.page == 0) {
      this.setData({
        searchData: res.data,
        hasData: true
      })
    } else {
      let { searchData } = this.data
      this.setData({
        searchData: [...searchData, ...res.data],
        hasData: true
      })
    }
    if (res.data.length == 0) {
      this.setData({
        isBottom: true,
        hasMoreData: false
      })
    }
    this.setData({ isLoading: false })

    console.log('分类页面跳转结果', this.data.searchData)
  },
  //通过模糊查询获取数据
  async getSearchDataByContent(name) {
    if (!this.data.hasMoreData) {
      console.log('没有数据了,不在执行后续')
      return;
    }

    this.setData({ isLoading: true })
    this.setData({
      fromSortPage: 0,
      content: name
    })

    let id;
    let res;
    const LIMIT = 6
    await product_category.where({
      name: name
    }).field({ _id: true }).get().then(res => {
      console.log('获取的分类信息', res)
      if (res.data.length == 0) {
        id = []
      } else {
        id = res.data[0]._id
      }

    })

    if (id.length !== 0) {
      console.log('有id', id)
      res = await goods_info.where(_.or([
        {
          name: {
            $regex: '.*' + name,
            $options: 'i'
          }
        },
        {
          category: _.in([id])
        }
      ])).orderBy(this.data.order_condition, 'desc').limit(LIMIT).skip(this.data.page * LIMIT)
        .get()
      console.log('有分类id的搜索', res)
      if (res.data.length == 0) {
        this.setData({
          isBottom: true,
          hasMoreData: false
        })
      }
    } else {
      console.log('没有id')
      res = await goods_info.where({
        name: {
          $regex: '.*' + name,
          $options: 'i'
        }
      }).orderBy(this.data.order_condition, 'desc').limit(LIMIT).skip(this.data.page * LIMIT)
        .get()
      console.log('模糊查询', res)
      if (res.data.length == 0) {
        this.setData({
          isBottom: true,
          hasMoreData: false
        })
      }

    }

    if (this.data.page == 0) {
      this.setData({ searchData: res.data })
    } else {
      let { searchData } = this.data
      this.setData({
        searchData: [...searchData, ...res.data]
      })
    }
    this.setData({ isLoading: false })

    console.log('最后的结果', this.data.searchData)
  },

  onLoad: function (options) {
    //通过分类页面过来的
    if (options.name) {
      this.setData({
        name: options.name,
        fromSortPage: 1
      })

      product_category.where({
        select: this.data.name
      }).get().then(res => {
        console.log('获取的name', res.data[0]._id)
        this.setData({
          category_id: res.data[0]._id
        })
        this.getSearchDataByUrl(this.data.category_id)
      })
    } else {
      //用户直接搜索

      console.log('没有参数')
      this.setData({
        fromSortPage: 0,
        isFocus: true
      })
      console.log('搜索参数',options.search)
      let search = ''
      if(options.search){
        search = options.search
      }
      this.getSearchDataByContent(search);

      product_stock.count().then(res => {
        console.log('数目', res)

      })
    }


    // goods_info.orderBy('_createTime','desc').get().then(res=>{
    //   console.log('测试',res)
    // })
    //时间是降序
  },


  onReady: function () {

  },

  onShow: function () {

  },
  onReachBottom() {
    console.log('到底了')
    let { fromSortPage, category_id, content } = this.data

    if (fromSortPage == 1) {
      this.setData({ page: ++this.data.page })
      this.getSearchDataByUrl(category_id)
    } else {
      this.setData({ page: ++this.data.page })
      this.getSearchDataByContent(content)
    }


  },

  pushToDetail(event) {
    let eventData = event.currentTarget.dataset;
    console.log('参数', eventData)


    wx.navigateTo({
      url: '../detail/detail?id=' + eventData.id
    })
  },

  getClothesData(event) {
    let eventData = event.currentTarget.dataset
    let index = eventData.index
    let { option } = this.data
    for (let i in option) {
      option[i].state = false
    }
    option[index].state = true
    this.setData({
      option: option
    })
    console.log('参数', eventData)
    this.setData({
      page: 0,
      order_condition: eventData.mode,
      isBottom:false,
      hasMoreData:true

    })

    if (this.data.fromSortPage == 1) {
      console.log('从url过来')
      this.getSearchDataByUrl(this.data.category_id)
    } else {
      console.log('用户搜索')
      this.getSearchDataByContent(this.data.content)
    }
  },
  searchData(event) {
    this.setData({
      isBottom:false,
      hasMoreData:true
    })
    let content = event.detail.value
    console.log('完成事件', content)
    let { option } = this.data
    for (let i in option) {
      option[i].state = false
    }
    option[0].state = true
    this.setData({
      page: 0,
      order_condition: 'sales_volume',
      option: option
    })

    this.getSearchDataByContent(content)
  }
})