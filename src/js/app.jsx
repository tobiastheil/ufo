import React from 'react'
import ReactDOM from 'react-dom'
import {Provider} from 'react-redux'
import {storeSetup} from './store-setup'
import {DevToolsSetup} from './utils/devtools-setup'
import Immutable from 'immutable'
import { List, Map } from 'immutable'
import os from 'os'
import App from './app/app-index'
import Config from './config/config-index'
import { ipcRenderer, remote  } from 'electron'
/* React Components */
import {Foundation} from './general-components/foundation'
import Sidebar from './general-components/sidebar'
import Navbar from './navbar/navbar-index'
import ViewPlacer from './view-placer/vp-index'
import FileSystem from './filesystem/fs-index'
import ToggleBar from './general-components/togglebar'
import Utils from './utils/utils-index'
import setupShortcuts from './shortcuts/sc-renderer'

window.fs = FileSystem

if (process.env.NODE_ENV !== 'production') {
  // execute window.devToolsSetup() on the developer console to install them
  window.devToolsSetup = DevToolsSetup
  require('electron-connect').client.create()
}
const windowID = remote.getCurrentWindow().id
const store = storeSetup();

// INIT APP PATH

store.dispatch(Config.actions.loadPreviousState(windowID))
window.store = store
window.utils = Utils.storage
// setTimeout(function(){ store.dispatch(Navbar.actions.addNavGroup("Favbar", [])) }, 3000);
setupShortcuts(store)

ipcRenderer.on('saveState', function(event) {
  Utils.storage.saveStatetoStorage(store.getState(), windowID, function() {
    ipcRenderer.send('closeWindow', windowID)
  })
})

ReactDOM.render(
      <Provider store={ store }>
      <Foundation>
        <Sidebar>
          <App.components.actionbar></App.components.actionbar>
          <Navbar.components.parent></Navbar.components.parent>
          <ToggleBar></ToggleBar>
        </Sidebar>
        <ViewPlacer.components.parent/>
      </Foundation>
    </Provider>
  ,
  document.getElementById('app')
);
