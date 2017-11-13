import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  Dimensions
} from 'react-native';

import Swiper from 'react-native-swiper'
import Button from 'react-native-button'
const width = Dimensions.get('window').width
const height = Dimensions.get('window').height

var styles = StyleSheet.create({
  wrapper: {
    flex: 1

  },
  slide1: {
    flex: 1,
    width: width,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#9DD6EB',
  },
  slide2: {
    flex: 1,
    width: width,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#97CAE5',
  },
  slide3: {
    flex: 1,
    width: width,
    height:height,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#92BBD9',
  },
  text: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
  },
  btn: {
    position: 'absolute',
    width: width - 20,
    left: -150,
    bottom: -160,
    height: 50,
    padding: 10,
    backgroundColor: '#ee735c',
    borderColor: '#ee735c',
    borderWidth: 1,
    fontSize: 18,
    borderRadius: 3,
    color: '#fff'
  }
})

var Slider = React.createClass({
  _enter:function() {
    this.props.enterSlide()

  },
  render: function() {
    return (
      <Swiper style={styles.wrapper} showsButtons={true}>
        <View style={styles.slide1}>
        <Text>This is the first slider</Text>
        </View>
        <View style={styles.slide2}>
        <Text>This is the second slider</Text>
        </View>
        <View style={styles.slide3}>
        <Text>This is the third slider</Text>
        <Button
        style={styles.btn}
        onPress={this._enter}>Let us get started!</Button>
        </View>
      </Swiper>
    )
  }
})

module.exports = Slider
