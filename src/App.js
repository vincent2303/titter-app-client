import React, { Component } from 'react';
import './App.css';
import mapboxgl from 'mapbox-gl';
import openSocket from 'socket.io-client';
import TweetDisplayer from './TweetDisplayer/TweetDisplayer'

mapboxgl.accessToken = 'pk.eyJ1IjoiY2FuYXJpIiwiYSI6ImNqbDVvYWV5ZjBqbngzd3FrdHpyNm9vN3IifQ.jBcds_ari8OVhJpIwAkSyA';


class App extends Component {

  map;

  socket;

  state={
    searchWord:"",
    tweetIdList:[],
    tweetNumber: 0,
    locatedTweetNumber:0,
    streaming: false // true if is streaming active
  }

  componentDidMount(){

    // socket.io connection
    this.socket = openSocket('http://localhost:5000');
    this.socket.on("tweet", tweet=>{ // a tweet is {id: ..., coord: ...}
      this.handleTweet(tweet)
    })
    this.socket.on("testi", ()=>{console.log("ddddddd")})

    //create map (needs defined height in style: app.css)
    this.map = new mapboxgl.Map({
      container: this.mapContainer,
      style: 'mapbox://styles/mapbox/dark-v9',
      center: [30, 0],
      zoom: 3
    });


    //ADD CONTROLS
    this.map.addControl(new mapboxgl.NavigationControl());

    //ADD 3D BUILDINGS
    this.map.on('load', ()=>{
      var layers = this.map.getStyle().layers;
      var labelLayerId;
      for (var i = 0; i < layers.length; i++) {
          if (layers[i].type === 'symbol' && layers[i].layout['text-field']) {
              labelLayerId = layers[i].id;
              break;
          }
      }
      this.map.addLayer({ 
        'id': '3d-buildings',
        'source': 'composite',
        'source-layer': 'building',
        'filter': ['==', 'extrude', 'true'],
        'type': 'fill-extrusion',
        'minzoom': 15,
        'paint': {
            'fill-extrusion-color': '#aaa',

            // use an 'interpolate' expression to add a smooth transition effect to the
            // buildings as the user zooms in
            'fill-extrusion-height': [
                "interpolate", ["linear"], ["zoom"],
                15, 0,
                15.05, ["get", "height"]
            ],
            'fill-extrusion-base': [
                "interpolate", ["linear"], ["zoom"],
                15, 0,
                15.05, ["get", "min_height"]
            ],
            'fill-extrusion-opacity': .6
        }
    }, labelLayerId);
  });
  }

  handleKeyPress = (event)=>{
    if (event.key==='Enter' && event.target.value.length >=3) {
      this.setState({
        tweetIdList:[],
        tweetNumber: 0,
        locatedTweetNumber:0,
        streaming: true,
        searchWord: event.target.value
      }, ()=>{
        this.socket.emit("streamRequest", this.state.searchWord)
      })
    }
  }

  setSearch = (event)=>{
    this.setState({searchWord: event.target.value})
  }

  handleBtnStreaming = ()=>{
    if (this.state.streaming) {
      this.socket.emit("pauseRequest")
      this.setState({streaming: !this.state.streaming})
    }
    else{
      if (this.state.searchWord.length>=3) {
        this.socket.emit("streamRequest", this.state.searchWord)
        this.setState({streaming: !this.state.streaming})
      }
    }
  }

  addMarker = (coord)=>{
    new mapboxgl.Marker()
    .setLngLat(coord)
    .addTo(this.map);
  }

  handleTweet = (tweet)=>{
    console.log(tweet)
    let prevIdList = this.state.tweetIdList
    prevIdList.push(tweet.id)
    let prevTweetNumber = this.state.tweetNumber +1
    let prevLocatedTweetNumber = this.state.locatedTweetNumber
    if (tweet.coord !== "no coord") {
      prevLocatedTweetNumber = prevLocatedTweetNumber+1
      this.addMarker(tweet.coord)
    }
    this.setState({
      tweetIdList: prevIdList,
      tweetNumber: prevTweetNumber,
      locatedTweetNumber: prevLocatedTweetNumber
    })
  }

  render() {
    return (
      <div className='col12'>
        <div id="myMap" className="map" ref={el => this.mapContainer = el} />
        <div id="tweetBloc" className="pin-left">
          <div id="tweetIndic" >
              <h3 id="tweetIndicTitle">Live Tweet</h3>
              <div id="tweetIndicElem" className="row" >
                <div className="indicElem" >
                  <button onClick={this.handleBtnStreaming} id="pauseBtn" type="button" className="btn btn-primary">
                    {this.state.streaming ? "Pause": "Stream"}
                  </button>
                </div>
                <div className="indicElem">
                  <label>tweet</label>
                  <p>{this.state.tweetNumber}</p>
                </div>
                <div className="indicElem">
                  <label>located</label>
                  <p>{this.state.locatedTweetNumber}</p>
                </div>
              </div>
          </div>
          <TweetDisplayer idList={this.state.tweetIdList} />
        </div>
        <input onKeyPress={this.handleKeyPress} id="searchBar" className="pin-left form-control form-control-lg" type="text" placeholder="Search"/>
      </div>
    );
  }
}

export default App;
