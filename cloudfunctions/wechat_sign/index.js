// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  console.log('获取用户信息', wxContext)

  if (wxContext.OPENID == undefined) {
    var result = {}
    result.errCode = 1
    result.errMsg = '未能正确获取用户的openid，请重试'

    var data = {}
    result.data = data
    return result
  }

  if (event.avatarUrl == undefined) {
    var result = {}
    result.errCode = 2
    result.errMsg = '未能正确获取用户的头像信息，请重试'
    var data = {}
    result.data = data
    return result
  }

  if (event.gender == undefined) {
    var result = {}
    result.errCode = 2
    result.errMsg = '未能正确获取用户的信息，请重试'
    var data = {}
    result.data = data
    return result
  }

  const db = cloud.database()
  var user;
  await db.collection('user-info').where({
    openId: wxContext.OPENID
  }).get()
    .then(res => {
      console.log('获取的数据', res)
      user = res.data[0]
    })
  //数据库中该用户不存在，创建一个新用户
  if (user == undefined) {
    to_add_data = {
      nickName: event.nickName,
      avatarUrl: event.avatarUrl,
      gender: event.gender,
      openId: wxContext.OPENID,
      is_admin: 0
    }

    var add_result = {}
    await db.collection('user-info').add({
      data: to_add_data
    }).then(res => {
      console.log('添加用户成功')
      console.log(res)
      add_result = res._id
    })

  } else {
    //用户已存在，更新用户的信息
    await db.collection('user-info').where({
      openId: wxContext.OPENID
    }).update({
      data: {
        avatarUrl: event.avatarUrl,
        gender: event.gender
      }
    }).then(res => {
      console.log('更新成功', res)
    })

    //获取用户最新信息，返回前端
    await db.collection('user-info').where({
      openId:wxContext.OPENID
    }).field({
      nickName:true,
      avatarUrl:true,
      gender:true,
      is_admin:true,
      _createTime:true
    }).get().then(res=>{
      console('获取最新用户信息',res)
      user = res.data[0]
    })

    var result = {}
    if(add_result){
      result.errCode = 0
      result.errMsg = '添加用户成功'
    } else{
      result.errCode = 0
      result.errMsg = '该用户已注册过，信息已更新'
    }
    var data = {}
    data.user = user 
    result.data = data
    return result
  }



}