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
var Dimensions = React.Dimensions
var RefreshControl = React.RefreshControl
var ActivityIndicatorIOS = React.ActivityIndicatorIOS
var AlertIOS = React.AlertIOS
var AsyncStorage = React.AsyncStorage

var width = Dimensions.get('window').width

var cachedResults = {
  nextPage: 1,
  items: [],
  total: 0
}

var Item = React.createClass({
  getInitialState() {
    var row = this.props.row
    return {
      up: row.voted,
      row: row
    }
  },

  _up() {
    let up = !this.state.up
    let url = config.api.base+config.api.up
    let params = {
      accessToken:this.props.user.accessToken,
      up:up}
    let that = this
    request.post(url,params)
    .then(function(data) {
      if (data.succ) {
        that.setState({
          up:up
        })
      }
    })
  },

  render() {
    var row = this.state.row

    return (
      <TouchableHighlight onPress={this.props.onSelect}>
        <View style={styles.item}>
          <Text style={styles.title}>{row.title}</Text>
          <Image
          source={{uri:row.thumb}}
            style={styles.thumb}
          >
            <Icon
              name='ios-play'
              size={28}
              style={styles.play} />
          </Image>
          <View style={styles.itemFooter}>
            <View style={styles.handleBox}>
              <Icon
                name={this.state.up ? 'ios-heart' : 'ios-heart-outline'}
                size={28}
                onPress={this._up}
                style={[styles.up, this.state.up ? null : styles.down]} />
              <Text style={styles.handleText} onPress={this._up}>Like</Text>
            </View>
            <View style={styles.handleBox}>
              <Icon
                name='ios-chatboxes-outline'
                size={28}
                style={styles.commentIcon} />
              <Text style={styles.handleText}>Comment</Text>
            </View>
          </View>
        </View>
      </TouchableHighlight>
    )
  }
})

var List = React.createClass({
  getInitialState() {
    var ds = new ListView.DataSource({
      rowHasChanged: (r1, r2) => r1 !== r2
    })

    return {
      isRefreshing: false,
      isLoadingTail: false,
      dataSource: ds.cloneWithRows([]),
    }
  },

  _renderRow(row) {
    console.log("this.state.user"+JSON.stringify(this.state.user));
    return <Item
      user={this.state.user}
      onSelect={() => this._loadPage(row)}
      row={row} />
  },

  componentDidMount() {
    var that = this

    AsyncStorage.getItem('user')
      .then((data) => {
        var user

        if (data) {
          user = JSON.parse(data)
        }

        if (user && user.accessToken) {
          console.log("user.accessToken"+user.accessToken);
          console.log(JSON.stringify(user));
          that.setState({
            user: user
          },function() {
            that._fetchData(1)

          })
        }
      })

  },

  _fetchData(page) {
    if (page == 0) {
      this.setState({
        refreshing:true // 正在刷新
      })
    }else {
      this.setState({
        isLoadingTail:true // 正在加载
      })
    }

    let url = config.api.base + config.api.creations;
    let params = {
      accessToken:this.state.user.accessToken,
      page:page
    };
    request.get(url,params)
    .then((data)=>{
      console.log("data::::"+JSON.stringify(data.data));
      page = data.page
      
      if (data.success) {
        if (page == 0) {// 刷新
          cachedResults.items = data.data.concat(cachedResults.items)
          cachedResults.total = data.total
        }else {          //加载
          cachedResults.items = cachedResults.items.concat(data.data)
          cachedResults.total = data.total
        }

        this.setState({
          isLoadingTail:false,  //加载完成
          refreshing:false,  //刷新完成
          dataSource:this.state.dataSource.cloneWithRows(cachedResults.items)
        })
      }
    })
  },

  _hasMore() {
    return cachedResults.items.length !== cachedResults.total
  },

  _fetchMoreData() {
    if (!this._hasMore() || this.state.isLoadingTail) {

      this.setState({
        isLoadingTail: false
      })

      return
    }

    var page = cachedResults.nextPage

    this._fetchData(page)
  },

  _onRefresh() {
    if (!this._hasMore() || this.state.isRefreshing) {
      return
    }

    this._fetchData(0)
  },

  _renderFooter() {
    if (!this._hasMore() && cachedResults.total !== 0) {
      return (
        <View style={styles.loadingMore}>
          <Text style={styles.loadingText}>No More!</Text>
        </View>
      )
    }

    if (!this.state.isLoadingTail) {
      return <View style={styles.loadingMore} />
    }

    return <ActivityIndicatorIOS style={styles.loadingMore} />
  },

  _loadPage(row) {
    this.props.navigator.push({
      name: 'detail',
      component: Detail,
      params: {
        data: row
      }
    })
  },

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>List Page</Text>
        </View>
        <ListView
          dataSource={this.state.dataSource}
          renderRow={this._renderRow}
          renderFooter={this._renderFooter}
          onEndReached={this._fetchMoreData}
          refreshControl={
            <RefreshControl
              refreshing={this.state.isRefreshing}
              onRefresh={this._onRefresh}
              tintColor='#ff6600'
              title='Loading...'
            />
          }
          onEndReachedThreshold={20}
          enableEmptySections={true}
          showsVerticalScrollIndicator={false}
          automaticallyAdjustContentInsets={false}
        />
      </View>
    )
  }
})

var styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
  },

  header: {
    paddingTop: 25,
    paddingBottom: 12,
    backgroundColor: '#ee735c'
  },

  headerTitle: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600'
  },

  item: {
    width: width,
    marginBottom: 10,
    backgroundColor: '#fff'
  },

  thumb: {
    width: width,
    height: width * 0.56,
    resizeMode: 'cover'
  },

  title: {
    padding: 10,
    fontSize: 18,
    color: '#333'
  },

  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#eee'
  },

  handleBox: {
    padding: 10,
    flexDirection: 'row',
    width: width / 2 - 0.5,
    justifyContent: 'center',
    backgroundColor: '#fff'
  },

  play: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    width: 46,
    height: 46,
    paddingTop: 9,
    paddingLeft: 18,
    backgroundColor: 'transparent',
    borderColor: '#fff',
    borderWidth: 1,
    borderRadius: 23,
    color: '#ed7b66'
  },

  handleText: {
    paddingLeft: 12,
    fontSize: 18,
    color: '#333'
  },

  down: {
    fontSize: 22,
    color: '#333'
  },

  up: {
    fontSize: 22,
    color: '#ed7b66'
  },

  commentIcon: {
    fontSize: 22,
    color: '#333'
  },

  loadingMore: {
    marginVertical: 20
  },

  loadingText: {
    color: '#777',
    textAlign: 'center'
  }
})


module.exports = List
