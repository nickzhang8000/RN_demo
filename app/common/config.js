'user strict'

module.exports = {
  header:{
    method:'POST',
    headers:{
      'Accept':'application/json',
      'Content-Type':'application/json',
    }
  },
  qiniu:{
    upload:'http://upload.qiniu.com',
  },
 CLOUDINARY:{
    'cloud_name': 'nickscloud',
    'api_key': '661751512516569',
    'api_secret': '_QICJIlWZnJEejVKiurS2iAwRJw',
    'base':'http://res.cloudinary.com/nickscloud',
    'image':'https://api.cloudinary.com/v1_1/nickscloud/image/upload',
    'video':'https://api.cloudinary.com/v1_1/nickscloud/video/upload',
    'audio':'https://api.cloudinary.com/v1_1/nickscloud/audio/upload'
  },
  api:{
    // base:'http://localhost:1234/', 
    base:'http://rapapi.org/mockjs/20595/', //使用这个的时候accessToken不能验证所以无法上传
    creations:'api/creations',
    up:'api/up',
    comments:'api/comments',
    video:'api/creations/video',
    signup:'api/u/signup',
    verify:'api/u/verify',
    signature:'api/signature',
    update:'api/u/update'
  }

}
