import { ConnectionProvider } from 'common/Connection';
import React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import Registry from 'registry/Registry';
import Voting from 'registry/Voting';
import Propose from 'registry/Propose';

export default function Routes() {
  return (
    <ConnectionProvider>
      <BrowserRouter basename={'/'}>
        <Switch>
          <Route exact path="/" component={Registry} />
          <Route exact path="/vote" component={Voting} />
          <Route exact path="/propose" component={Propose} />
        </Switch>
      </BrowserRouter>
    </ConnectionProvider>
  );
}