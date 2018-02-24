import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import request from 'request';
import config from './config.js';
import { browserHistory } from 'react-router';

class App extends Component {
  constructor(props){
    super();
    if(window.location.href.includes('#access_token')){
      let keys = window.location.href.split('&');
      console.log(keys);
      for(let i = 0; i < keys[0].length; i++){
        if(keys[0].charAt(i) == '#') keys[0] = keys[0].replace(keys[0].substring(0,i+1),'');
      }
      let data = {};
      for(let i = 0; i < keys.length; i++){
        for(let g = 0; g < keys[i].length; g++){
          if(keys[i].charAt(g) == '='){ data[`${keys[i].substring(0,g)}`] = keys[i].substring(g+1,keys[i].length); }
        }
      }
      data.preview = false;
      this.state = data;
      console.log(data);

      let options = {
        url: 'https://api.spotify.com/v1/me',
        headers: {
          'Authorization': 'Bearer ' + data.access_token
        },
        json: true
      };

      request.get(options,(err,res,body) => {
        if(!err && res.statusCode == 200){
          console.log(body);
          this.setState({
            userInfo: body
          });
          options = {
            url: 'https://api.spotify.com/v1/me/playlists',
            headers: {
              'Authorization': 'Bearer ' + data.access_token
            },
            json: true
          };
          request.get(options,(e,r,b) =>{
            if(!e && r.statusCode == 200){
              console.log(b);
              let playlistData = b.items;
              let displayPlaylists = b.items.map(obj => {
                return (
                  <tr>
                    <a onClick={this.handlePlaylist.bind(this)}>
                      {obj.images[0].url !== undefined ? <img id={obj.id} src={obj.images[0].url} width="200" height="200"/> : <span></span>}
                    </a>
                    <h4>{obj.name}</h4>
                  </tr>
                );
              });
              this.setState({
                playlists: displayPlaylists,
                playlistData: playlistData
              });
            }
          });
        }
      });

    }else{
      this.state = {};
    }
  }

  cleanPlaylist(){
    let tracks = this.state.currentPlaylist.tracks;
    console.log(tracks);
    let displayClean = [];
    let cleanTracks = [];
    for(let i = 0; i < tracks.length; i++){
      if(!tracks[i].track.explicit){
        displayClean.push((
          <tr>
            <td>
              <img src={tracks[i].track.album.images[0].url} width="200" height="200"/>
            </td>
            <td>
              <h4>{`${tracks[i].track.name} by ${tracks[i].track.artists[0].name}`}</h4>
            </td>
          </tr>
        ));
        cleanTracks.push(tracks[i]);
      }else{
        console.log(`${tracks[i].track.explicit} and ${tracks[i].track.name}`);
      }
    }
    this.setState({
      cleanTracks: cleanTracks,
      tracks: displayClean
    });
  }

  handlePlaylist(event){
    let id = event.target.id;
    let owner = '';
    let curPlay;
    for(let i = 0; i < this.state.playlistData.length; i++){
      if(this.state.playlistData[i].id == id){
        owner = this.state.playlistData[i].owner.id;
        curPlay = this.state.playlistData[i];
        console.log(curPlay);
        break;
      }
    }
    let options = {
      url: `https://api.spotify.com/v1/users/${owner}/playlists/${id}/tracks`,
      headers: {
        'Authorization': 'Bearer ' + this.state.access_token
      },
      json: true
    };
    request.get(options, (err,res,body) => {
      if(!err && res.statusCode == 200){
        let tracks = body.items;
        curPlay.tracks = body.items;
        let trackList = tracks.map(obj => {
          let explicit = '';
          if(!obj.track.explicit) explicit = "NOT ";
          return (
            <tr>
              <td>
                {obj.track.preview_url != null ? <a href={`https://play.spotify.com/track/${obj.track.id}`} target="_blank">
                  <img className="preview" src={obj.track.album.images[0].url} width="200" height="200"/>
                </a> :
                  <img src={obj.track.album.images[0].url} width="200" height="200"/>
                }
              </td>
              <td>
                <h4>{`${obj.track.name} by ${obj.track.artists[0].name} is ${explicit}explicit`}</h4>
              </td>
            </tr>
          );
        });
        this.setState({
          tracks: trackList,
          currentPlaylist: curPlay,
          preview: true
        });
      }
    });
  }

  login(){
    console.log(window.location.href);
    window.location.href = (`https://accounts.spotify.com/authorize?client_id=${config.client_id}&redirect_uri=https:%2F%2Fspotifycleaning-1142f.firebaseapp.com/&scope=user-read-private%20user-read-email%20playlist-read-private%20playlist-modify-private%20playlist-modify-public&response_type=token&state=123`);
  }

  createPlaylist(){
    let options = {
      url: `https://api.spotify.com/v1/users/${this.state.userInfo.id}/playlists`,
      headers: {
        'Authorization': 'Bearer ' + this.state.access_token,
        'Content-Type': 'application/json'
      },
      body: {
        name: 'CLEAN: ' + this.state.currentPlaylist.name,
        public: false,
        description: "Clean playlist made by Ian Carder's cleaning program!"
      },
      json: true
    };
    request.post(options,(err,res,body) => {
      if(!err && (res.statusCode == 200 || res.statusCode == 201)){
        let uris = [];
        for(let i = 0; i < this.state.cleanTracks.length; i++){
          uris.push(this.state.cleanTracks[i].track.uri);
          if(i>=99) break;
        }
        options = {
          url: `https://api.spotify.com/v1/users/${this.state.userInfo.id}/playlists/${body.id}/tracks`,
          headers: {
            'Authorization': 'Bearer ' + this.state.access_token,
            'Content-Type': 'application/json'
          },
          body: {
            uris: uris
          },
          json: true
        };
          request.post(options,(e,r,b)=>{
            if(!e && (r.statusCode == 200 || r.statusCode == 201)){
              console.log(b);
            }
          });
      }
    });
  }

  back(){
    this.setState({
      tracks: undefined,
      currentPlaylist: undefined,
      preview: false,
      cleanTracks: undefined
    });
  }
  render() {
    if(!this.state.preview){
      return (
        <div className="App">
          <header className="App-header">
            <img src={logo} className="App-logo" alt="logo" />
            <h1 className="App-title">Welcome to React</h1>
          </header>
          {this.state.access_token === undefined ? <button className="btn btn-primary" onClick={this.login.bind(this)}>Login</button> :
            <table>
              <tbody>
                {this.state.playlists}
              </tbody>
            </table>
        }
        </div>
      );
    }else{
      return (
        <div className="App">
          <img src={this.state.currentPlaylist.images[0].url} width="200" height="200"/>
          {this.state.cleanTracks === undefined ? <button type="button" className="btn btn-primary" onClick={this.cleanPlaylist.bind(this)}>Clean Playlist</button> :
          <button type="button" className="btn btn-primary" onClick={this.createPlaylist.bind(this)}>Create Playlist</button>}
            <div className="container">
              <table>
                <tbody>
                  {this.state.tracks}
                </tbody>
              </table>
              <button type="button" className="btn btn-primary" onClick={this.back.bind(this)}>Go Back</button>
            </div>
        </div>
      )
    }
  }
}

export default App;
