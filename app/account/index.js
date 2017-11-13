
import React, { Component } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import Login from './login.js';

import {
  StyleSheet,
  Text,
  View,
  AsyncStorage,
  TouchableOpacity,
  Image,
  Dimensions,
  AlertIOS,
  Modal,
  TextInput,
} from 'react-native';
var Progress = require('react-native-progress')
var sha1 = require('sha1')
var request = require('../common/request')
var config = require('../common/config')
var uuid = require('uuid')
var ImagePicker = require('NativeModules').ImagePickerManager
var width = Dimensions.get('window').width
var height = Dimensions.get('window').height
var options = {
  title: 'Select Avatar',
  cancelButtonTitle:'cancel',
  takePhotoButtonTitle:'take photo',
  chooseFromLibraryButtonTitle:"choose from library",
  quality:0.75,
  allowsEditing:true,
  noData:false,
  storageOptions: {
    skipBackup: true,
    path: 'images'
  }
}

function avatar(id,type) {
  if (id.indexOf('http') > -1) {
    return id
  }
  if (id.indexOf('data:image') > -1) {
    return id
  }

  if (id.indexOf('avatar/') > -1) {
    return config.CLOUDINARY.base + '/' + type + '/upload/' + id
  }

}
var Account = React.createClass({
  getInitialState(){
    var user = this.props.user
    return{
      user:user,
      avatarSource:{},
      avatarProgress:0,
      avatarUploading:false,
      modalVisible:false,
    }
  },
  _edit(){
    this.setState({
      modalVisible:true
    })
  },
  _close(){
    this.setState({
      modalVisible:false
    })
  },
  // _getQiniuToken(accessToken,key){
  //   const signatureURL= config.api.base+config.api.signature
  //
  //   return request.post(signatureURL,{
  //     accessToken:accessToken,
  //     key:key
  //   })
  //   .catch((err)=>{
  //     console.log(err);
  //   })
  //
  // },
  _pickPhoto(){
    var that = this
    ImagePicker.showImagePicker(options, (res) => {
        // You can display the image using either data...
        let avatarData = 'data:image/jpeg;base64,' + res.data
        let user = that.state.user
        user.avatar = avatarData
        that.setState({
          user:user
        })
        // upload the image to cloudinary
        let accessToken = that.state.user.accessToken
        //
        // let key = uuid.v4() + '.png'
        // let uri = res.uri

        // that._getQiniuToken(accessToken,key)
        //   .then((data)=>{
        //       console.log(data);
        //       if (data && data.success) {
        //         // var signature = 'folder=' + folder + '&tags=' + tags + '&timestamp=' + timestamp + config.CLOUDINARY.api_secret
        //         //
        //         // signature = sha1(signature)
        //
        //         var token = data.data
        //
        //         var body = new FormData()
        //
        //         body.append('token',token)
        //         body.append('key',key)
        //         body.append('file',{
        //           type:'image/png',
        //           uri:uri,
        //           name:key
        //         })
        //
        //         that._upload(body)
        //
        //       }
        //   })
        let timestamp = Date.now()
        let tags = 'app,avatar'
        let folder = 'avatar'
        let signatureURL = config.api.base+config.api.signature


          request.post(signatureURL,{
            accessToken:accessToken,
            // key:key,
            timestamp:timestamp,
            type:'avatar'
          })
          .catch((err)=>{
            console.log(err)
          })
          .then((data)=>{// 得到后台产生的accessToken
            console.log("data:"+JSON.stringify(data))
            if ( data && data.success) {
              var signature = 'folder=' + folder + '&tags=' + tags + '&timestamp=' + timestamp + config.CLOUDINARY.api_secret
              var body = new FormData()

              signature = sha1(signature)

              body.append('folder',folder)
              body.append('signature',signature)
              body.append('tags',tags)
              body.append('timestamp',timestamp)
              body.append('api_key',config.CLOUDINARY.api_key)
              body.append('resource_type','image')
              body.append('file',avatarData)

              that._upload(body)//开始上传图片

            }
          })
    });
  },
  _upload(body){
    var xhr = new XMLHttpRequest()
    var url = config.CLOUDINARY.image
    var that = this

    this.setState({
      avatarUploading:true,
      avatarProgress:0,
    })
    xhr.open('POST',url)
    xhr.onload = () => {
      if (xhr.status !== 200) {
        AlertIOS.alert('Request failed')
        console.log(xhr.responseText);
        return
      }

      if (!xhr.responseText) {
        AlertIOS.alert('Request failed')
        return
      }

      var response
      try {
        response = JSON.parse(xhr.response)
      } catch (e) {
        console.log(e)
        console.log('parse fails')
      }
      // get the response
      console.log('response:'+JSON.stringify(response));
      if (response && response.public_id) {
        var user = this.state.user

        user.avatar = avatar(response.public_id,'image')
        that.setState({
          user:user,
          avatarUploading:false,
          avatarProgress:0,
        })

        that._asyncUser(true)
      }
    }
    if (xhr.upload) {
      xhr.upload.onprogress=(event)=>{
        if (event.lengthComputable) {
          var percent = Number((event.loaded/event.total).toFixed(2))
          console.log(percent);
          that.setState({
            avatarProgress:percent
          })
        }
      }
    }

    xhr.send(body)
  },
  _asyncUser(isAvatar){
    var that = this
    var user = this.state.user

    if (user && user.accessToken) {
      var url = config.api.base + config.api.update

      request.post(url,user)//user update
        .then((data)=>{
          if (data && data.success) {
            var user = data.data

            if (isAvatar) {
              AlertIOS.alert('avatar changed successfully')
            }
            that.setState({
              user:user
            },function() {
              AsyncStorage.setItem("user",JSON.stringify(user))
            })
          }
        })
    }

  },
  _changeUserState(key,value){
    var user = this.state.user

    user[key] = value
    this.setState({
      user:user
    })
  },
  _submit(){
    this._asyncUser()
    this._close()
  },
  _logout(){
    this.props.logout()
  },
  render:function(){
    var user = this.state.user
    return(
        <View style={styles.container}>
          <View style={styles.toolbar}>
            <Text style={styles.toolbarTitle}>My Account</Text>
            <Text style={styles.toolbarEdit} onPress={this._edit}>Edit</Text>
          </View>
          {
            user.avatar
            ?
            <TouchableOpacity style={styles.avatarContainePort} onPress={this._pickPhoto}>
            <Image
            source={{uri:avatar(user.avatar,'image')}}
            style={styles.avatarContainerAvatar}>
            <View style={styles.avatarBox}>
            {
              this.state.avatarUploading
              ?<Progress.Circle
              showsText={true}
              color={'#ee735c'}
              progress={this.state.avatarProgress}
              size={70}/>
              :<Image
              source={{uri:avatar(user.avatar,'image')}}
              style={styles.avatar}
              />
            }

            <Text style={styles.avatarContaineText}>Click to change your portrait</Text>
            </View>
            </Image>
            </TouchableOpacity>
            :
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarTip}>Add pet name</Text>
              <TouchableOpacity style={styles.avatarBox} onPress={this._pickPhoto}>
              {
                this.state.avatarUploading
                ?<Progress.Circle
                showsText={true}
                color={'#ee735c'}
                progress={this.state.avatarProgress}
                size={70}/>
                :<Icon
                  name="ios-cloud-upload-outline"
                  style={styles.plusIcon}
                />
              }

              </TouchableOpacity>
            </View>
          }
          <Modal
            animated={true}
            visible={this.state.modalVisible}>
            <View style={styles.modalContainer}>
              <Icon
              name='ios-close-outline'
              style={styles.closeIcon}
              onPress={this._close}/>

              <View style={styles.fieldItem}>
                <Text style={styles.label}>nickname</Text>
                <TextInput
                  placeholder='enter your nickname'
                  style={styles.inputField}
                  autoCapitalize={'none'}
                  autoCorrect={false}
                  defaultValue={user.nickname}
                  onChangeText={(text)=>{
                    this._changeUserState('nickname',text)
                  }}
                />
              </View>

              <View style={styles.fieldItem}>
                <Text style={styles.label}>breed</Text>
                <TextInput
                  placeholder='enter the breed'
                  style={styles.inputField}
                  autoCapitalize={'none'}
                  autoCorrect={false}
                  defaultValue={user.breed}
                  onChangeText={(text)=>{
                    this._changeUserState('breed',text)
                  }}
                />
              </View>

              <View style={styles.fieldItem}>
                <Text style={styles.label}>age</Text>
                <TextInput
                  placeholder='enter the age'
                  style={styles.inputField}
                  autoCapitalize={'none'}
                  autoCorrect={false}
                  defaultValue={user.age}
                  onChangeText={(text)=>{
                    this._changeUserState('age',text)
                  }}
                />
              </View>

              <View style={styles.fieldItem}>
                <Text style={styles.label}>gender</Text>
                <Icon.Button
                  name='ios-paw'
                  onPress={()=>{
                    this._changeUserState('gender','male')
                  }}
                  style={[
                    styles.gender,
                    user.gender === 'male' && styles.genderChecked
                  ]}
                >Male</Icon.Button>
                <Icon.Button
                  name='ios-paw-outline'
                  onPress={()=>{
                    this._changeUserState('gender','female')
                  }}
                  style={[
                    styles.gender,
                    user.gender === 'female' && styles.genderChecked
                  ]}
                >female</Icon.Button>
              </View>
              <Text
                style={styles.btn}
                onPress={this._submit}>Save Profile</Text>

            </View>
          </Modal>
          <Text
            style={styles.btn}
            onPress={this._logout}>Log Out</Text>

        </View>
    )
  }

})

var styles = StyleSheet.create({
  avatar:{
    width:60,
    height:60,
    borderRadius:30,
    resizeMode:'cover',
    marginTop:20,
  },
  avatarContaineText:{
    backgroundColor:'transparent',
    fontSize:14,

  },
  avatarContainePort:{
    height:110,
  },
  avatarContainerAvatar:{
    height:110,
  },
container:{
  flex:1,

},
toolbar:{
  backgroundColor:'#ee734c',
  paddingTop:30,
  paddingBottom:15,
},
toolbarTitle:{
  textAlign:'center',
  color:'#fff',
  fontWeight:'600',
},
avatarContainer:{
  height:130,
  backgroundColor:'#eee',
  paddingTop:20,
  paddingBottom:20,
},
avatarTip:{
  textAlign:'center',
  paddingBottom:15,
},
avatarBox:{
  alignItems:'center',
  justifyContent:'center',
},
plusIcon:{
  padding:20,
  textAlign:'center',
  borderRadius:8,
  backgroundColor:'#fff',
  fontSize:20,
  color:'#999',
  overflow: 'hidden',

},
toolbarEdit:{
  position:'absolute',
  top:30,
  color:'#fff',
  right:10,
  fontWeight:'600',
  textAlign:'right',
  fontSize:14
},
modalContainer:{
  flex:1,
  paddingTop:50,
  backgroundColor:'#fff',
},
fieldItem:{
  flexDirection:'row',
  justifyContent:'space-between',
  alignItems:'center',
  height:50,
  paddingLeft:15,
  paddingRight:15,
  borderColor:'#eee',
  borderBottomWidth:1
},
label:{
  color:'#ccc',
  marginRight:10,
},
inputField:{
  height:50,
  flex:1,
  color:'#666',
  fontSize:14
},
closeIcon:{
  position:'absolute',
  width:40,
  height:40,
  fontSize:32,
  top:30,
  right:20,
  color:'#ee735c'
},
gender:{
  backgroundColor:'#ccc'
},
genderChecked:{
  backgroundColor:'#ee735c'
},
btn: {
  marginTop: 25,
  padding: 10,
  backgroundColor: 'transparent',
  borderColor: '#ee735c',
  textAlign: 'center',
  borderWidth: 1,
  borderRadius: 4,
  color: '#ee735c',
  marginLeft:10,
  marginRight:10,
},

});

module.exports = Account;
