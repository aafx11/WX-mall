export default function userLogin(that) {

  wx.getUserProfile({
    desc: '用于完善会员资料',
    success: (res) => {
      console.log('手动登录获取用户信息', res)
      that.setData({
        userInfo: res.userInfo,
        // hasUserInfo: true
      })
      //手动登录，如果数据库没有该用户信息，注册一个新用户
      wx.cloud.callFunction({
        name: 'getOpenid',
        success: res => {

          let openId = res.result.openid
          const db = wx.cloud.database()
          db.collection('user-info').where({
            openId: openId
          }).get().then(res => {
            console.log('手动登录在数据库获取信息', res)
            //数据库中没有该用户，注册新用户
            if (!res.data[0]) {
              console.log('没有该用户')
              let { userInfo } = that.data
              let to_add_data = {}
              let date = new Date()
              // console.log(date.getFullYear()+'年'+date.getMonth()+'月')

              to_add_data = {
                nickName: userInfo.nickName,
                avatarUrl: userInfo.avatarUrl,
                gender: userInfo.gender,
                openId: openId,
                is_admin: 0,
                created: date.getFullYear() + '年' + date.getMonth() + '月'

              }
              db.collection('user-info').add({
                data: to_add_data
              }).then(res => {
                console.log('添加用户成功')
                db.collection('user-info').where({
                  openId: openId
                }).field({
                  nickName: true,
                  avatarUrl: true,
                  gender: true,
                  is_admin: true,
                  created: true
                }).get().then(res => {


                  that.setData({
                    userInfo: res.data[0],
                    hasUserInfo: true

                  })
                  wx.setStorageSync('storage_info', 1)
                  wx.navigateBack()
                })

              })
            } else {
              //用户已存在，更新用户信息
              let { userInfo } = that.data
              db.collection('user-info').where({
                openId: openId
              }).update({
                data: {
                  nickName: userInfo.nickName,
                  avatarUrl: userInfo.avatarUrl,
                  gender: userInfo.gender
                }
              }).then(res => {
                console.log('更新信息')
                db.collection('user-info').where({
                  openId: openId
                }).field({
                  nickName: true,
                  avatarUrl: true,
                  gender: true,
                  is_admin: true,
                  created: true
                }).get().then(res => {
                  that.setData({
                    userInfo: res.data[0],
                    hasUserInfo: true
                  })
                  wx.setStorageSync('storage_info', 1)
                  wx.navigateBack()
                })


              })

            }
          })
        }
      })

    }

  })


}