
import React, { Component } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Image,
  AlertIOS,
  ProgressViewIOS,
  AsyncStorage,
  Modal,
  TextInput,
} from 'react-native';
var Button = require('react-native-button').default
var _ = require('lodash')
var ImagePicker = require('NativeModules').ImagePickerManager
var config = require('../common/config')
var Video = require('react-native-video').default;
var request = require('../common/request')
var RNAudio = require('react-native-audio')
var sha1 = require('sha1')
var CountDown = require('react-native-sk-countdown').CountDownText
var Progress = require('react-native-progress')
// var cloudinary = require('cloudinary')
var AudioRecorder = RNAudio.AudioRecorder
var AudioUtils = RNAudio.AudioUtils
// cloudinary.config({
//   cloud_name: 'sample',
//   api_key: '874837483274837',
//   api_secret: 'a676b67565c6767a6767d6767f676fe1'
// });


var width = Dimensions.get('window').width
var height = Dimensions.get('window').height
var options = {
  title: 'Select Video',
  cancelButtonTitle:'cancel',
  takePhotoButtonTitle:'take 10s video',
  chooseFromLibraryButtonTitle:'choose existed videos',
  videoQuality:'medium',
  mediaType:'video',
  durationLimit:10,
  noData:false,
  storageOptions: {
    skipBackup: true,
    path: 'images'
  }
}

var defaultState = {
  previewVideo: null,

  videoId: null,
  audioId: null,

  title: '',
  modalVisible: false,
  publishing: false,
  willPublish: false,
  publishProgress: 0.2,

  // video upload
  video: null,
  videoUploaded: false,
  videoUploading: false,
  videoUploadedProgress: 0.14,

  // video loads
  videoProgress: 0.01,
  videoTotal: 0,
  currentTime: 0,

  // count down
  counting: false,
  recording: false,

  // audio
  audio: null,
  audioPlaying: false,
  recordDone: false,
  audioPath: AudioUtils.DocumentDirectoryPath + '/gougou.aac',

  audioUploaded: false,
  audioUploading: false,
  audioUploadedProgress: 0.14,

  // video player
  rate: 1,
  muted: true,
  resizeMode: 'contain',
  repeat: false
}

var Edit = React.createClass({
  getInitialState(){
    var user = this.props.user || {}
    var state = _.clone(defaultState)

    state.user = user

    return state

  },
  componentDidMount() {
    var that = this
    this._initAudio()

    AsyncStorage.getItem('user')
      .then((data) => {
        var user

        if (data) {
          user = JSON.parse(data)
        }

        if (user && user.accessToken) {
          that.setState({
            user: user
          })
        }
      })

  },
  _initAudio(){
    var audioPath = this.state.audioPath

    console.log('audioPath:'+audioPath)
    AudioRecorder.prepareRecordingAtPath(audioPath, {
      SampleRate: 22050,
      Channels: 1,
      AudioQuality: 'High',
      AudioEncoding: 'aac'
    })

    AudioRecorder.onProgress = (data) => {
      this.setState({
        currentTime: Math.floor(data.currentTime)
      })
    }
    AudioRecorder.onFinished = (data) => {
      this.setState({
        finished: data.finished
      })
      console.log(`Finished recording: ${data.finished}`)
    }
  },
  _preview(){
    console.log(1);
    if (this.state.audioPlaying) {
      AudioRecorder.stopPlaying()
    }
    AudioRecorder.playRecording()
    this.refs.videoPlayer.seek(0)
      this.setState({
        videoProgress:0,
        audioPlaying:true
      })
  },
  _onLoadStart(){
    console.log('_onLoadStart')
  },

  _onLoad(){
    console.log('_onLoad')
  },

  _onProgress(data){

    var duration = data.playableDuration
    var currentTime = data.currentTime
    var percent = Number((currentTime / duration).toFixed(2))

    this.setState({
      videoTotal: duration,
      currentTime: Number(data.currentTime.toFixed(2)),
      videoProgress: percent
    })
    console.log('videoPercent:'+percent);
    console.log('_onProgress')
  },

  _onEnd(){
    if (this.state.recording) {

    AudioRecorder.stopRecording()
    this.setState({
      videoProgress:1,
      recordDone: true,
      recording:false
    })
    console.log('_onEnd')
    }
  },

  _onError(){
    console.log('_onError')
  },
  _getToken(body) {
    var signatureURL = config.api.base + config.api.signature

    body.accessToken = this.state.user.accessToken

    return request.post(signatureURL, body)
  },
  _upload(body, type) {

    var that = this
    var xhr = new XMLHttpRequest()
    var url = config.CLOUDINARY.video

    var state = {}

    state[type + 'UploadedProgress'] = 0
    state[type + 'Uploading'] = true
    state[type + 'Uploaded'] = false

    this.setState(state)
    console.log(state);
    xhr.open('POST', url)
    xhr.onload = () => {
      if (xhr.status !== 200) {
        AlertIOS.alert('request failed')
        console.log(xhr.responseText)

        return
      }
      console.log('responseText'+xhr.responseText);
      if (!xhr.responseText) {
        AlertIOS.alert('request failed')

        return
      }

      var response

      try {
        response = JSON.parse(xhr.response)
      }
      catch (e) {
        console.log(e)
        console.log('parse fails')
      }

      console.log("response:"+JSON.stringify(response))

      if (response) {
        var newState = {}
        newState[type] = response
        newState[type + 'Uploading'] = false
        newState[type + 'Uploaded'] = true

        that.setState(newState)

        var updateURL = config.api.base + config.api.video
        var accessToken = this.state.user.accessToken
        var updateBody = {
          accessToken: accessToken
        }

        updateBody[type] = response

        console.log("updateBody:"+JSON.stringify(updateBody));
        request
          .post(updateURL, updateBody)
          .catch((err) => {
            console.log(err)
            if (type === 'video') {
              AlertIOS.alert('视频同步出错，请重新上传1！')
            }
            else if (type === 'audio') {
              AlertIOS.alert('音频同步出错，请重新上传1！')
            }
          })
          .then((data) => {
            console.log("data:"+JSON.stringify(data));
            if (data && data.success) {
              var mediaState = {}
              mediaState[type + 'Id'] = data.data

              that.setState(mediaState)
            }
            else {
              if (type === 'video') {
                AlertIOS.alert('视频同步出错，请重新上传！')
              }
              else if (type === 'audio') {
                AlertIOS.alert('音频同步出错，请重新上传！')
              }
            }
          })
      }
    }

    if (xhr.upload) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          var percent = Number((event.loaded / event.total).toFixed(2))
          var progressState = {}
          console.log('percent:'+percent);
          progressState[type + 'UploadedProgress'] = percent
          that.setState(progressState)
        }
      }
    }

    xhr.send(body)
  },
  _pickVideo(){
    var that = this

    ImagePicker.showImagePicker(options, (res) => {
      if (res.didCancel) {
        return
      }
        var state = _.clone(defaultState)
        var uri = res.uri
        console.log('res:'+JSON.stringify(res));
        state.previewVideo = uri
        state.user = this.state.user

        let folder = 'video'
        let tags = 'app,video'
        let timestamp = Date.now()

        that.setState(state)

        that._getToken({
          type: 'video'
        })
        .catch((err) => {
          console.log(err)
          AlertIOS.alert('upload error')
        })
        .then((data) => {
          if (data && data.success) {
            var token = data.data
            var body = new FormData()
            var signature = 'folder=' + folder + '&tags=' + tags + '&timestamp=' + timestamp + config.CLOUDINARY.api_secret

            signature = sha1(signature)
            // uri = uri.slice(7)
            console.log('uri:'+uri);
            body.append('folder',folder)
            body.append('signature',signature)
            body.append('tags',tags)
            body.append('timestamp',timestamp)
            body.append('api_key',config.CLOUDINARY.api_key)
            body.append('resource_type','video')
            body.append('token', token)
            // body.append('file',{
            //   type:'video/mp4',
            //   uri:uri
            // })
            body.append('file','http://techslides.com/demos/sample-videos/small.mp4')
            // body.append('file',videoData)


            console.log("body:"+JSON.stringify(body));
            that._upload(body, 'video')
          }
        })
        // request.post(signatureURL,{
        //   accessToken:accessToken,
        //   timestamp:timestamp,
        //   type:'avatar'
        // })
        // .catch((err)=>{
        //   console.log(err);
        // })
        // .then((data)=>{
        //   if (data && data.success) {
        //     // var signature = 'folder=' + folder + '&tags=' + tags + '&timestamp=' + timestamp + CLOUDINARY.api_secret
        //     //
        //     // signature = sha1(signature)
        //
        //     var signature = data.data
        //
        //     var body = new FormData()
        //
        //     body.append('folder',folder)
        //     body.append('signature',signature)// ???????? is it ok three attributes for signature
        //     body.append('tags',tags)
        //     body.append('api_key',CLOUDINARY.api_key)
        //     body.append('timestamp',timestamp)
        //     body.append('resource_type','image')
        //     body.append('file',avatarData)
        //
        //     that._upload(body)
        //
        //   }
        // })
        // let timestamp = Date.now()
        // let tags = 'app,video'
        // let folder = 'video'
        // let signatureURL = config.api.base+config.api.signature
        //
        // request.post(signatureURL,{
        //   accessToken:accessToken,
        //   // key:key,
        //   timestamp:timestamp,
        //   type:'avatar'
        // })
        // .catch((err)=>{
        //   console.log(err)
        // })
        // .then((data)=>{// 得到后台产生的accessToken
        //   console.log("data:"+JSON.stringify(data))
        //   if ( data && data.success) {
        //     var signature = 'folder=' + folder + '&tags=' + tags + '&timestamp=' + timestamp + config.CLOUDINARY.api_secret
        //     var body = new FormData()
        //
        //     signature = sha1(signature)
        //
        //     body.append('folder',folder)
        //     body.append('signature',signature)
        //     body.append('tags',tags)
        //     body.append('timestamp',timestamp)
        //     body.append('api_key',config.CLOUDINARY.api_key)
        //     body.append('resource_type','image')
        //     body.append('file',avatarData)
        //
        //     that._upload(body)//开始上传图片
        //
        //   }
        // })

    });
  },
  // _upload(body){
  //   var xhr = new XMLHttpRequest()
  //   var url = config.CLOUDINARY.video
  //   var that = this
  //
  //   this.setState({
  //     avatarUploading:true,
  //     avatarProgress:0,
  //   })
  //   xhr.open('POST',url)
  //   xhr.onload = () => {
  //     if (xhr.status !== 200) {
  //       AlertIOS.alert('Request failed')
  //       console.log(xhr.responseText);
  //       return
  //     }
  //
  //     if (!xhr.responseText) {
  //       AlertIOS.alert('Request failed')
  //       return
  //     }
  //
  //     var response
  //     try {
  //       response = JSON.parse(xhr.response)
  //     } catch (e) {
  //       console.log(e)
  //       console.log('parse fails')
  //     }
  //     // get the response
  //     if (response && response.public_id) {
  //       var user = this.state.user
  //
  //       user.avatar = avatar(response.public_id,'image')
  //       that.setState({
  //         user:user,
  //         avatarUploading:false,
  //         avatarProgress:0,
  //       })
  //
  //       that._asyncUser(true)
  //     }
  //   }
  //   if (xhr.upload) {
  //     xhr.upload.onprogress=(event)=>{
  //       if (event.lengthComputable) {
  //         var percent = Number((event.loaded/event.total).toFixed(2))
  //         that.setState({
  //           avatarProgress:percent
  //         })
  //       }
  //     }
  //   }
  //
  //   xhr.send(body)
  // },
  _counting(){
    if (!this.state.counting && !this.state.recording) {

    this.setState({
      counting:true
    })

    // this.refs.videoPlayer.seek(0)

  }
  },
  _record(){
    this.setState({
      counting:false,
      recording:true,
      recordDone:false,
      videoProgress:0

    })
    AudioRecorder.startRecording()
    this.refs.videoPlayer.seek(0)
  },
  _uploadAudio(){
    this.setState({
      modalVisible:true,
      audioUploaded:true
    })
  },
  // _uploadAudio(){
  //   var that = this
  //   var tags = 'app,audio'
  //   var folder = 'audio'
  //   var timestamp = Date.now()
  //
  //   this._getToken({
  //     type: 'audio',
  //     timestamp: timestamp,
  //     cloud: 'cloudinary'
  //   })
  //   .catch((err) => {
  //     console.log(err)
  //   })
  //   .then((data) => {
  //     if (data && data.success) {
  //       // data.data
  //       var signature = data.data
  //       var body = new FormData()
  //       console.log('signature:'+signature);
  //       body.append('folder', folder)
  //       body.append('signature', signature)
  //       body.append('tags', tags)
  //       body.append('timestamp', timestamp)
  //       body.append('api_key', config.CLOUDINARY.api_key)
  //       body.append('resource_type', 'video')
  //       body.append('file', {
  //         type: 'video/mp4',
  //         uri: that.state.audioPath,
  //         // name: key
  //       })
  //       console.log("body:"+JSON.stringify(body));
  //       that._upload(body, 'audio')
  //     }
  //   })
  // },
  _closeModal(){
    this.setState({
      modalVisible:false
    })
  },
  render:function(){
    return(
        <View style={styles.container}>
          <View style={styles.toolbar}>
            <Text style={styles.toolbarTitle}>
              {this.state.previewVideo ? 'Click to dub your video ': 'Understand your dog from dubbing'}
            </Text>
            <Text style={styles.toolbarEdit} onPress={this._pickVideo}>Change</Text>
          </View>

          <View style={styles.page}>
            {
              this.state.previewVideo
              ? <View style={styles.videoContainer}>
                  <View style={styles.videoBox}>
                    <Video
                      ref='videoPlayer'
                      source={{uri:this.state.previewVideo}}
                      style={styles.video}
                      volume={5}
                      paused={false}
                      rate={this.state.rate}
                      muted={this.state.muted}
                      resizeMode={this.state.resizeMode}
                      repeat={this.state.repeat}
                      onLoadStart={this._onLoadStart}
                      onLoad={this._onLoad}
                      onProgress={this._onProgress}
                      onEnd={this._onEnd}
                      onError={this._onError}
                      />
                      {
                        !this.state.videoUploaded && this.state.videoUploading
                        ? <View style={styles.progressTipBox}>
                            <ProgressViewIOS style={styles.progressBar} progressTintColor='#ee735c' progress={this.state.videoUploadedProgress} />
                            <Text style={styles.progressTip}>
                              Generating the muted video, {(this.state.videoUploadedProgress * 100).toFixed(2)}% completed
                            </Text>
                          </View>
                        : null
                      }
                      {
                         this.state.recording
                        ? <View style={styles.progressTipBox}>
                            <ProgressViewIOS style={styles.progressBar} progressTintColor='#ee735c' progress={this.state.videoProgress} />
                            <Text style={styles.progressTip}>
                            Audio Recording
                            </Text>
                          </View>
                        : null
                      }
                      {
                        this.state.recordDone
                        ?<TouchableOpacity style={styles.previewBox} onPress={this._preview}>
                            <Icon name='ios-play' style={styles.previewIcon}/>
                            <Text style={styles.previewText}>Preview</Text>
                        </TouchableOpacity>
                        :null
                      }
                  </View>

                </View>
              : <TouchableOpacity style={styles.uploadContainer}
                onPress={this._pickVideo}>
                  <View style={styles.uploadBox}>
                    <Image
                    source={require('../assets/images/record.png')}
                    style={styles.uploadIcon}/>
                    <Text style={styles.uploadTitle}>Click to upload you video</Text>
                    <Text style={styles.uploadDesc}>Better less than 20s</Text>
                  </View>
                </TouchableOpacity>
            }
              {
                this.state.videoUploaded
                ?<View style={styles.recordBox}>
                  <View style={styles.recordIconBox}>
                  { this.state.counting && !this.state.recording
                    ?  <CountDown
                        style={styles.countBtn}
                        countType='seconds'
                        auto={true}
                        afterEnd={this._record}
                        timeLeft={4}
                        step={-1}
                        startText='Ready to record'
                        endText='GO'
                        intervalText={(sec) => {
                          return sec === 0 ? 'GO': sec
                        }} />
                    :<TouchableOpacity onPress={this._counting}>
                      <Icon name='ios-mic' style={styles.recordIcon}/>
                    </TouchableOpacity>
                  }
                    </View>
                  </View>
                :null
              }
              {
                this.state.recordDone && this.state.videoUploaded
                ?<View style={styles.uploadAudioBox}>
                  {
                    !this.state.audioUploaded && !this.state.audioUploading
                    ?<Text style={styles.uploadAudioText} onPress={this._uploadAudio}>Next Step</Text>
                    :null
                  }
                  {
                    this.state.audioUploading
                    ?<Progress.Circle
                    showsText={true}
                    color={'#ee735c'}
                    progress={this.state.audioUploadedProgress}
                    size={60}/>
                    :null
                  }
                </View>
                :null
              }
              <Modal
                animated={false}
                visible={this.state.modalVisible}>
                <View style={styles.modalContainer}>
                  <Icon
                    name='ios-close-outline'
                    onPress={this._closeModal}
                    style={styles.closeIcon} />
                      <View style={styles.fieldBox}>
                          <TextInput
                            placeholder={'Give a title for your video'}
                            style={styles.inputField}
                            autoCapitalize={'none'}
                            autoCorrect={false}
                            defaultValue={this.state.title}
                            onChangeText={(text) => {
                              this.setState({
                                title: text
                              })
                            }}
                          />
                      </View>
                      {
                        !this.state.publishing
                        ? <View style={styles.loadingBox}>
                            <Text style={styles.loadingText}>Video Uploading...</Text>
                            {
                              this.state.willPublish
                              ? <Text style={styles.loadingText}>正在合并视频音频...</Text>
                              : null
                            }

                              <Text style={styles.loadingText}>开始上传喽！...</Text>

                            <Progress.Circle
                              showsText={true}
                              size={60}
                              color={'#ee735c'}
                              progress={this.state.publishProgress} />
                          </View>
                        : null
                      }
                      <View style={styles.submitBox}>
                        {
                          this.state.audioUploaded
                          ? <Button
                            style={styles.btn}
                            onPress={this._submit}>Publish Video</Button>
                          : null
                        }
                      </View>
                </View>
              </Modal>
          </View>
        </View>
    )
  }

})

var styles = StyleSheet.create({
container:{
  flex:1,
},
recordBox: {
  width: width,
  height: 60,
  alignItems: 'center'
},

recordIconBox: {
  width: 68,
  height: 68,
  marginTop: -10,
  borderRadius: 34,
  backgroundColor: '#ee735c',
  borderWidth: 1,
  borderColor: '#fff',
  alignItems: 'center',
  justifyContent: 'center'
},
recordIcon: {
  fontSize: 58,
  backgroundColor: 'transparent',
  color: '#fff'
},

countBtn: {
  fontSize: 32,
  fontWeight: '600',
  color: '#fff'
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
toolbarEdit:{
  position:'absolute',
  top:30,
  color:'#fff',
  right:10,
  fontWeight:'600',
  textAlign:'right',
  fontSize:14
},
page:{
  flex:1,
  alignItems:'center'
},
uploadContainer:{
  marginTop:90,
  width:width-40,
  paddingBottom:10,
  borderColor:'#ee735c',
  alignItems:'center',
  borderRadius:6,
  borderWidth:1,
  backgroundColor:'#fff',
},
uploadBox:{
  flex:1,
  flexDirection:'column',
  justifyContent:'center',
  alignItems:'center'
},
uploadTitle:{
  marginTop:10,
  marginBottom:10,
  textAlign:'center'
},
uploadDesc:{
  textAlign:'center'
},
uploadIcon:{
  marginTop:10,
},
videoContainer:{
  width:width,
  justifyContent:'center',
  alignItems:'flex-start',
},
videoBox:{
  width:width,
  height:height*0.6,
},
video:{
  width:width,
  height:height*0.6,
  backgroundColor:'#333',
},
progressTipBox: {
  width: width,
  height: 30,
  backgroundColor: 'rgba(244,244,244,0.65)'
},

progressTip: {
  color: '#333',
  width: width - 10,
  padding: 5
},

progressBar: {
  width: width
},
previewBox:{
  position:'absolute',
  width:100,
  height:30,
  right:10,
  bottom:10,
  borderWidth:1,
  borderColor:'#ee735c',
  borderRadius:3,
  flexDirection:'row',
  justifyContent:'center',
  alignItems:'center',
},
previewIcon: {
  marginRight: 5,
  fontSize: 20,
  color: '#ee735c',
  backgroundColor: 'transparent'
},

previewText: {
  fontSize: 20,
  color: '#ee735c',
  backgroundColor: 'transparent'
},
uploadAudioBox: {
  width: width,
  height: 60,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center'
},

uploadAudioText: {
  width: width - 20,
  padding: 5,
  borderWidth: 1,
  borderColor: '#ee735c',
  borderRadius: 5,
  textAlign: 'center',
  fontSize: 30,
  color: '#ee735c'
},
modalContainer: {
  width: width,
  height: height,
  paddingTop: 50,
  backgroundColor: '#fff'
},

closeIcon: {
  position: 'absolute',
  fontSize: 32,
  right: 20,
  top: 30,
  color: '#ee735c'
},

loadingBox: {
  width: width,
  height: 50,
  marginTop: 10,
  padding: 15,
  alignItems: 'center'
},

loadingText: {
  marginBottom: 10,
  textAlign: 'center',
  color: '#333'
},

fieldBox: {
  width: width - 40,
  height: 36,
  marginTop: 30,
  marginLeft: 20,
  marginRight: 20,
  borderBottomWidth: 1,
  borderBottomColor: '#eaeaea',
},

inputField: {
  height: 36,
  textAlign: 'center',
  color: '#666',
  fontSize: 14
},

submitBox: {
  marginTop: 50,
  padding: 15
},

btn: {
  marginTop: 65,
  padding: 10,
  marginLeft: 10,
  marginRight: 10,
  backgroundColor: 'transparent',
  borderColor: '#ee735c',
  borderWidth: 1,
  borderRadius: 4,
  color: '#ee735c'
}
});

module.exports = Edit;
