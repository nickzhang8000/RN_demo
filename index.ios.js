
import React, { Component } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';

import List from './app/creation/index';
import Edit from './app/edit/index';
import Account from './app/account/index';
import Login from './app/account/login';
import Slider from './app/account/slider';


import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  TabBarIOS,
  Navigator,
  AsyncStorage,
  Dimensions,
  ActivityIndicatorIOS,
} from 'react-native';

const width = Dimensions.get('window').width
const height = Dimensions.get('window').height

class imoocApp extends Component  {
  // constructor() {
  //
  // }
  state = {
    selectedTab: 'list',
    notifCount: 0,
    presses: 0,
    logined:false,
    booted:false,
    entered:false,
  }
  componentDidMount=()=>{
    AsyncStorage.removeItem("entered")
    this._asyncAppStatus()

  }

  _logout=()=>{
    AsyncStorage.removeItem('user')

    this.setState({
      logined:false,
      user:null
    })
  }

  _asyncAppStatus=()=>{
    let that = this
    AsyncStorage.multiGet(['user','entered'])
    .then((data) => {
      let userData = data[0][1]
      let entered = data[1][1]

      let newState = {
        booted:true
      }

      if (userData) {
        user = JSON.parse(userData)
      }
      if (user && user.accessToken) {
        newState.user = user
        newState.logined = true
      }else {
        newState.logined = false
      }

      if (entered === "yes") {
        newState.entered = true
      }
      that.setState(newState)

    })
  }
_afterLogin=(user)=>{
  that = this
  user = JSON.stringify(user)
  AsyncStorage.setItem('user',user)
    .then(()=>{
      that.setState({
        logined:true,
        user:user,
      })
    })
}

_enterSlider=()=>{
  this.setState({
    entered:true
  },function() {
    AsyncStorage.setItem("entered","yes")
  })
}

  render(){
    if (!this.state.entered) {
      return <Slider enterSlide={this._enterSlider}/>
    }
    // if (!this.state.booted) {
    //   return(
    //     <View style={styles.bootedContainer}>
    //       <ActivityIndicatorIOS
    //         color='#ee735c'/>
    //     </View>
    //   )
    // }
    if (!this.state.logined) {
      return <Login afterLogin={this._afterLogin}/>
    }
    // console.log(this.state.user);
    return (
      <TabBarIOS
       tintColor="#ee735c">
       <Icon.TabBarItem
         iconName='ios-videocam-outline'
         selectedIconName='ios-videocam'
         selected={this.state.selectedTab === 'list'}
         onPress = { ()=>{
             this.setState({
               selectedTab: 'list',
             })
           }}>
           <Navigator
            initialRoute={{
              name:'list',
              component:List
            }}
            configureScene = {(route)=>{//change the animation or gesture properties of the scene
              return Navigator.SceneConfigs.FloatFromRight
            }}
            renderScene={(route,navigator)=>{
              let Component = route.component

              return <Component {...route.params} navigator={navigator}
              />
            }}
            />
       </Icon.TabBarItem>

       <Icon.TabBarItem
        iconName='ios-recording-outline'
        selectedIconName='ios-recording'
         badge={this.state.notifCount > 0 ? this.state.notifCount : undefined}
         selected={this.state.selectedTab === 'edit'}
         onPress={() => {
           this.setState({
             selectedTab: 'edit',
             notifCount: this.state.notifCount + 1,
           })
         }}>


        <Edit
        user = {this.state.user}/>
       </Icon.TabBarItem>

       <Icon.TabBarItem
        iconName='ios-more-outline'
        selectedIconName='ios-more'
         title="More"
         selected={this.state.selectedTab === 'account'}
         onPress={() => {
           this.setState({
             selectedTab: 'account',
             presses: this.state.presses + 1
           });
         }}>
         <Account
         logout={this._logout}
         user = {this.state.user}/>

       </Icon.TabBarItem>
     </TabBarIOS>
    )
  }
}
const styles = StyleSheet.create({
  bootedContainer:{
    width:width,
    height:height,
    backgroundColor:'#fff',
    justifyContent:'center',
    alignItems:'center',
  }
})



AppRegistry.registerComponent('imoocApp', () => imoocApp);
