import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
import {browserHistory,Route, Router, IndexRoute} from 'react-router';

ReactDOM.render(
    <Router history={browserHistory}>
      <Route path="/" component={App}>
        <IndexRoute component={App}/>
      </Route>
    </Router>
  ,document.getElementById('root')
);
registerServiceWorker();
