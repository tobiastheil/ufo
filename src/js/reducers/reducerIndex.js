import { combineReducers } from 'redux'
// import { counterReducer } from './counterReducer'
import { appReducer } from './appReducer'
import { configReducer } from './configReducer'
import { navbarReducer } from './navbarReducer'
import { viewContainerReducer } from './view-container-reducer'
import { List, Map } from 'immutable'

export const rootReducer = combineReducers({
  app: appReducer,
  config: configReducer,
  navbar: navbarReducer,
  viewContainer: viewContainerReducer
})
