/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

// ES5
var React = require('react-native')
var Icon = require('react-native-vector-icons/Ionicons')

var request = require('../common/request')
var config = require('../common/config')
var Detail = require('./detail')

var StyleSheet = React.StyleSheet
var Text = React.Text
var View = React.View
var TouchableHighlight = React.TouchableHighlight
var ListView = React.ListView
var Image = React.Image
var Modal = React.Modal
var Dimensions = React.Dimensions
var TextInput = React.TextInput
var RefreshControl = React.RefreshControl
var ActivityIndicatorIOS = React.ActivityIndicatorIOS
var AlertIOS = React.AlertIOS
var AsyncStorage = React.AsyncStorage
var Video = require('react-native-video').default
import Button from 'react-native-button'

var width = Dimensions.get('window').width

var cachedResults = {
  nextPage: 1,
  items: [],
  total: 0
}
var Item = React.createClass({
  getInitialState() {
    var data = this.props.row
    return {
      data : data,
      ds : new ListView.DataSource({
        rowHasChanged: (r1, r2) => r1 !== r2
      })
    }
  },


render(){
  let data = this.props.row
  return(
    <View style={styles.comment}>
      <Image style={styles.commentAvatar} source={{uri:data.replyBy.avatar}}/>
      <View style={styles.commentBox}>
      <Text style={styles.commentNickname}>{data.replyBy.nickname}</Text>
      <Text style={styles.commentNickname}>{data.content}</Text>
      </View>
    </View>
  )
}
})


var Detail = React.createClass({
  getInitialState() {
    var data = this.props.data
    var ds = new ListView.DataSource({
      rowHasChanged: (r1, r2) => r1 !== r2
    })

    return {
      data: data,

      // comments
      dataSource: ds.cloneWithRows([]),

      dataSource: ds.cloneWithRows([]),
      videoReady : false,
      rate:1,
      muted:true,
      resizeMode:'contain',
      repeat:false,
      isLoadingTail:false,
      modalVisible:false,
      content:'',
      isSending:false,
    }
  },

  _goBack(){
    this.props.navigator.pop()
  },

  _onLoadStart(){
    console.log('_onLoadStart')
  },

  _onLoad(){
    console.log('_onLoad')
  },

  _onProgress(){
    if (!this.state.videoReady) {
      this.setState({
        videoReady:true
      })
    }

    console.log('_onProgress')
  },

  _onEnd(){
    console.log('_onEnd')
  },

  _onError(){
    console.log('_onError')
  },
  componentDidMount(){
    this._fetchData()
  },

  _renderRow(row){
    return(
      <Item
        row={row}
      />
    )
  },
  _hasMore(){
    return cachedResults.items.length < cachedResults.total
  },
  _fetchData(page){// 最核心的function

      this.setState({
        isLoadingTail:true // 正在加载
      })

    let url = config.api.base+config.api.comments
    let params = {accessToken:'abc',id:124}
    let that = this
    request.get(url,params)
    .then((data)=>{
      if (data.success) {
        let comments = cachedResults.items
        comments = comments.concat(data.data)

        cachedResults.items = comments
        cachedResults.total = data.total
        if (comments.length >0) {
          that.setState({
            dataSource:that.state.dataSource.cloneWithRows(cachedResults.items),
            isLoadingTail:false,  //加载完成

          })
        }
      }
    })
    .catch((error)=>{
      console.error(error)
    })
  },
  _fetchMoreData(){  // 下拉到最底部
    if (!this._hasMore() || this.state.isLoadingTail) {
      return
    }
    let page = cachedResults.nextPage

    this._fetchData(page)
  },
  _renderFooter(){
    if (!this._hasMore() && cachedResults.items.length > 0) {
      return(
        <View style={styles.loadingMore}>
          <Text style={styles.loadingText}>No More!</Text>
        </View>
      )}
        return(
          <ActivityIndicatorIOS
            style={[styles.centering,{height:80}]}
            size='large'
          />)
    },
_focus(){
  this._setModalVisible(true)
  this.setState({
    content:''
  })
},
_closeModal(){
  this._setModalVisible(false)
},
_setModalVisible(data){
  this.setState({
    modalVisible:data
  })
},
_renderHeader(){
  let data = this.props.data
  return(
    <View style={styles.scrollView}>

      <View style={styles.infoBox}>
        <Image style={styles.avatar} source={{uri:data.author[0].avatar}}/>
        <View style={styles.descBox}>
        <Text style={styles.nickname}>{data.author[0].nickname}</Text>
        <Text style={styles.nickname}>{data.title}</Text>
        </View>
      </View>

      <View style={styles.addCommentBox}>
        <View style={styles.addComment}>
        <Text>Comment Here</Text>
        <TextInput
        placeholder='put your comment here'
        style={styles.content}
        multiline={true}
        onFocus={this._focus}
        />
        </View>
      </View>

      <View style={styles.commentTitle}>
        <Text>All Comments</Text>
      </View>

    </View>
  )
},
_submit(){
  if (!this.state.content) {
    return AlertIOS.alert('comment can not be empty')
  }
  if (this.state.isSending) {
    return AlertIOS.alert('comment is sending')
  }
  this.setState({
    isSending:true,
  },function() {
    let url = config.api.base+config.api.comments
    let params = {
      accessToken:'abc',
      creation:'123',
      content:this.state.content
    }
    let that = this
    request.post(url,params)
    .then(function(data) {
      console.log(data);
      console.log(2342);
      if (data.success) {
        let items = cachedResults.items
        items =[{
          content:that.state.content,
          replyBy:{
            nickname:'nick',
            avatar:'http://dummyimage.com/640x640/b3296a'
          }
        }].concat(items)
        cachedResults.items = items
        cachedResults.total = cachedResults.total + 1
        that.setState({
          dataSource:that.state.dataSource.cloneWithRows(cachedResults.items),
          modalVisible:false,
          isSending:false
      })
    }
    })
  })
},
  render(){
    let data = this.props.data
    return(
        <View style={styles.container} >

          <View style={styles.header}>
            <TouchableHighlight onPress={this._goBack} style={styles.backBox}>
              <View>
                  <Icon
                  name='ios-arrow-back'
                  size={28}
                  style={styles.backIcon}
                  ></Icon>
                  <Text style={styles.backText}>Back</Text>
              </View>
              </TouchableHighlight>

              <Text style={styles.headerTitle}>Detail Page</Text>

          </View>

          <View style={styles.videoBox}>
          <Video
            ref='videoPlayer'
            source={{uri:data.video}}
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
              !this.state.videoReady && <ActivityIndicatorIOS color='#ee735c' style={styles.loading}/>  // && no meanging
            }
          </View>

          <ListView
                  dataSource={this.state.dataSource}// fetch data from dataSource
                  renderRow={this._renderRow}// render the list with renderRow
                  enableEmptySections={true}
                  automaticallyAdjustContentInsets={false}
                  onEndReached={this._fetchMoreData}
                  onEndReachedThreshold={20}
                  renderHeader={this._renderHeader}
                  renderFooter={this._renderFooter}
                />

          <Modal
          animationType={'fade'}
          visible={this.state.modalVisible}
          onRequestClose={()=>{this._setModalVisible(false)}}>
            <View style={styles.modalContainer}>

              <Icon
              onPress={this._closeModal}
              name='ios-close-outline'
              style={styles.closeIcon}/>

              <View style={styles.addCommentBox}>
                <View style={styles.addComment}>
                <Text>Comment Here</Text>
                <TextInput
                placeholder='put your comment here'
                style={styles.content}
                multiline={true}
                onFocus={this._focus}
                onBlur={this._blur}
                defaultValue={this.state.content}
                onChangeText={(text)=>{
                  this.setState({
                    content:text
                  })
                }}
                />
                </View>
              </View>
              <Button
              onPress={this._submit}
              style={styles.submitBtn}>Submit</Button>
            </View>
          </Modal>
        </View>

    )
  }

})

var styles = StyleSheet.create({
container:{
  flex:1,
  // justifyContent:'center',
  // alignItems:'center',
},
modalContainer:{
  flex:1,
  paddingTop:45,
  backgroundColor:'#fff',
  alignItems:'center'
},
closeIcon:{
  fontSize:30,
  color:'#ee753c',
},
videoBox:{
  width:width,
  height:width*0.5,
  backgroundColor:'#000'
},
video:{
  height:width*0.5,
  width:width,
  backgroundColor:'#000'
},
loading:{
  position:'absolute',
  // left:0,
  top:60,
  width:width,
  // alignSelf:'center',
  // backgroundColor:'transparent',
},
header:{
  flexDirection:'row',
  width:width,
  height:60,
  alignItems:'flex-end',
  justifyContent:'center',
},
backBox:{
  position:'absolute',
  left:8,
  top:22,
  alignItems:'center',
  flexDirection:'row'
},
backIcon:{
  color:'#eee'
},
backText:{
  position:'relative',
  left:15,
  top:-25,
  color:'#eee',
},
headerTitle:{
  width:width-120,
  textAlign:'center',
  alignItems:'center',
  marginBottom:15,
},
infoBox:{
  width:width,
  flexDirection:'row',
  marginTop:10,
},
avatar:{
  height:60,
  width:60,
  marginLeft:10,
  marginRight:10,
  borderRadius:30,
},
descBox:{
  flex:1
},
title:{
  marginTop:10,
},
scrollView:{
  width:width,
},
comment:{
  flexDirection:'row',
  marginBottom:5,
},
commentAvatar:{
  height:40,
  width:40,
  marginLeft:5,
  marginRight:5,
  marginTop:5,
  borderRadius:20,
},
commentBox:{
  flex:1,
},
loadingText:{
  textAlign:'center',
},
addCommentBox:{
  padding:8,
  width:width,
},
content:{
height: 50,
borderColor: '#ddd',
borderWidth: 1,
borderRadius:4,
fontSize:14,
},
commentTitle:{
marginLeft:8,
width:width,
borderBottomWidth:1,
borderBottomColor:'#eee',
marginBottom:10,
paddingBottom:10,
},
submitBtn:{
  width:width-20,
  height:40,
  paddingTop:10,
  paddingBottom:10,
  marginTop:20,
  marginBottom:20,
  borderWidth:1,
  borderColor:'#ee753c',
  borderRadius:4,
  color:'#000',
},
//   tabContent: {
//     alignItems: 'center',
//   },
//   tabText: {
//     color: 'white',
//   },
});

module.exports = Detail;
