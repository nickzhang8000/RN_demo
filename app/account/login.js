
import React, { Component } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  StyleSheet,
  Text,
  View,
  AsyncStorage,
  TextInput,
  Button,
  AlertIOS,
} from 'react-native';
import request from '../common/request'
import config from '../common/config'
var CountDown = require('react-native-sk-countdown').CountDownText

class Login extends Component{
  constructor(){
    super()
    this.state={
      codeSent:false,
      verifyCode:'',
      phoneNumber:'',
      countingDone:false,
    }
  }
_countingDone=()=> {
  this.setState({
    countingDone: true
  })
}

_showVerifyCode=()=>{
    this.setState({
      codeSent:true
    })
}

_checkNumber=()=>{
  let phoneNumber = this.state.phoneNumber

  if (phoneNumber.toString().length === 9) {
    phoneNumber =  '61'+phoneNumber
  }else if (phoneNumber.toString().length === 10) {
    phoneNumber =  '61'+phoneNumber.toString().slice(1)
  }

  this.setState({
    phoneNumber:phoneNumber
  })
}

_sendVerifyCode=()=>{

  this._checkNumber()
  let phoneNumber = this.state.phoneNumber

  if (!phoneNumber) {
    AlertIOS.alert('Please enter your number')
    return
  }

  let url = config.api.base+config.api.signup
  let body={phoneNumber:phoneNumber}
  let that = this
  request.post(url,body)
  .then((data)=>{
    if (data.success) {
      that._showVerifyCode()
    }else {
      AlertIOS.alert('Failed to get verify code, Please check your number')

    }
  })
  .catch((err)=>{
    AlertIOS.alert('Failed to get verify code, Please check your network')
  })
}

_submit=()=>{
  let phoneNumber = this.state.phoneNumber

  console.log(phoneNumber);
  console.log(verifyCode);
  let verifyCode = this.state.verifyCode
  let that = this
  if (!verifyCode) {
    AlertIOS.alert("Please enter your verify code")
    return
  }
  // login data analyze
  let url = config.api.base + config.api.verify
  let body = {
    phoneNumber:phoneNumber,
    verifyCode:verifyCode
  }
  request.post(url,body)
  .then((data)=>{
    if (data.success) {
      that.props.afterLogin(data.data)
    }else {
      AlertIOS.alert("Please check your mobile number and verify code")
    }
  })
    .catch((err)=>{
      AlertIOS.alert("Failed to login,Please check your network")
  })
}
  render(){
    return(
        <View style={styles.container}>
          <View style={styles.signupBox}>
            <Text style={styles.title}>Quick Login</Text>
            <TextInput
              placeholder='Please enter your phone number'
              autoCaptialize={'none'}
              autoCorrect={false}
              keyboardType={'number-pad'}
              style={styles.inputField}
              onChangeText={(text)=>{
                this.setState({
                  phoneNumber:text
                })
              }}
            />
            {
              this.state.codeSent
              ? <View style={styles.verifyCodeBox}>
                  <TextInput
                    placeholder='Enter the verify code'
                    autoCaptialize={'none'}
                    autoCorrect={false}
                    keyboardType={'number-pad'}
                    style={styles.inputField}
                    onChangeText={(text) => {
                      this.setState({
                        verifyCode: text
                      })
                    }}
                  />

                  {
                    this.state.countingDone
                    ? <Text
                      style={styles.countBtn}
                      onPress={this._sendVerifyCode}>Get verify code</Text>
                    : <CountDown
                        style={styles.countBtn}
                        countType='seconds' // 计时类型：seconds / date
                        auto={true} // 自动开始
                        afterEnd={this._countingDone} // 结束回调
                        timeLeft={60} // 正向计时 时间起点为0秒
                        step={-1} // 计时步长，以秒为单位，正数则为正计时，负数为倒计时
                        startText='获取验证码' // 开始的文本
                        endText='获取验证码' // 结束的文本
                        intervalText={(sec) => '剩余秒数:' + sec} // 定时的文本回调
                      />

                  }
              </View>
              : null
            }
            {
              this.state.codeSent
              ? <Text
                style={styles.btn}
                onPress={this._submit}>Login</Text>
              : <Text
                style={styles.btn}
                onPress={this._sendVerifyCode}>Get verify code</Text>
            }

          </View>
        </View>
    )
  }

}

const styles = StyleSheet.create({
container:{
  flex:1,
  padding:10,
  backgroundColor:'#f9f9f9',
},
signupBox:{
  marginTop:30,

},
title:{
  marginBottom:20,
  color:'#333',
  fontSize:20,
  textAlign:'center',
},
inputField:{
  borderWidth:1,
  borderColor:'#fff',
  height:60,
  padding:5,
  color:'#666',
  fontSize:16,
  backgroundColor:'#fff',
  borderRadius:4,
},
btn:{
  borderWidth:1,
  borderColor:'#eee',
  marginTop:10,
},
verifyArea:{
  borderWidth:1,
  borderColor:'#fff',
  height:60,
  padding:5,
  color:'#666',
  fontSize:16,
  backgroundColor:'#fff',
  borderRadius:4,
},
btn: {
  marginTop: 10,
  padding: 10,
  backgroundColor: 'transparent',
  borderColor: '#ee735c',
  textAlign: 'center',
  borderWidth: 1,
  borderRadius: 4,
  color: '#ee735c'
},
countBtn: {
  width: 110,
  height: 40,
  padding: 10,
  marginLeft: 8,
  backgroundColor: '#ee735c',
  borderColor: '#ee735c',
  color: '#fff',
  textAlign: 'center',
  fontWeight: '600',
  fontSize: 15,
  borderRadius: 2,
  position:'absolute',
  right:10,
  top:10
},
//   tabContent: {
//     alignItems: 'center',
//   },
//   tabText: {
//     color: 'white',
//   },
});

module.exports = Login;
