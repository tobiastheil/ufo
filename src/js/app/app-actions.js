import * as t from './app-actiontypes'
import _ from 'underscore'
import nodePath from 'path'
import FileSystem from '../filesystem/fs-index'

let pathRoute = []

/**
 * change the path of folders that is displayed in the app
 * Should be called by user actions (Click on a folder) or by walking through the history
 * If you call it the first the, you need to Provied fromPath and toPath.
 * After that only of them is possible.
 * 
 * @param  {string} fromPath The first folder of the pathRout that will be displayed is optional
 * @param  {string} toPath   The last folder of the pathRout that will be displayed is optional
 */
export function changeAppPath(fromPath, toPath) {

  return dispatch => {

    if(fromPath && !toPath) { toPath = fromPath }
    fromPath = fromPath   ||  _.first(pathRoute)
    toPath =   toPath     ||  _.last(pathRoute)

    if(!fromPath || !toPath) { throw "Set 'from' and 'to' at the first call of changeAppPath()"}
    let newPathRoute = buildPathRoute(fromPath, toPath)

    dispatch({
      type: t.APP_CHANGE_PATH,
      payload: {
        pathRoute : newPathRoute
      }
    })

    let closeFsWatcher = _.difference(pathRoute, newPathRoute)
    closeFsWatcher.forEach((path, index) => {
      dispatch( FileSystem.actions.watcherClose(path) )
      pathRoute.splice( pathRoute.indexOf(path), 1 )
    })

    let createFsWatcher = _.difference(newPathRoute, pathRoute)
    createFsWatcher.forEach((path, index) => {
      dispatch( FileSystem.actions.watcherRequest(path) )
      pathRoute.push(path)
    })

    var testDiff = _.difference(newPathRoute, pathRoute)
    if(testDiff.length > 0) {
      throw "missmatch ahhh!"
    }
  }
}

/**
 * pure helper function that takes to paths and creates every "path step" between them
 * @param  {string} fromPath
 * @param  {string} toPath
 * @returns {[string]}
 */
function buildPathRoute(fromPath, toPath) {
  let newPathRoute = []
  let pathStep = toPath
  while (pathStep != fromPath) {
    newPathRoute.unshift(pathStep)
    pathStep = nodePath.dirname(pathStep)
  }
  newPathRoute.unshift(fromPath)
  return newPathRoute
}