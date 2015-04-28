'use strict';

import React from 'react';
import DocumentTitle from 'react-document-title';
import { RouteHandler } from 'react-router';
import './styles/app.less';
import Navbar from './components/Navbar.react';

class App extends React.Component {
  render() {
    return (
      <DocumentTitle title='Koulurekisteri'>
        <div className='app'>
          <Navbar />
          <div className="container">
            <RouteHandler {...this.props} />
          </div>
        </div>
      </DocumentTitle>
    );
  }
}

export default App;
