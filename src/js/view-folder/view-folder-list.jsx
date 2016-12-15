import React from 'react'
import { connect } from 'react-redux'
import * as FsMergedSelector from  '../filesystem/fs-merged-selectors'
import FileItem from '../file-item/components/file-item'
import FilterTypeInput from '../filesystem/filter/components/filter-type-input'
import Filter from '../filesystem/filter/filter-index'
import App from '../app/app-index'
import classnames from 'classnames'
import nodePath from 'path'
import {Map} from 'immutable'
import {dragndrop} from '../utils/utils-index'
import Button from '../general-components/button'
import fsWrite from '../filesystem/write/fs-write-index'
import ReactCSSTransitionGroup from 'react-addons-css-transition-group'

@connect(() => {
  const getFilesMergedOf = FsMergedSelector.getFilesMergedOf_Factory()
  return (state, props) => {
    return {
      focused: Filter.selectors.isFocused(state, props),
      folder: getFilesMergedOf(state, props)
    }
  }
})
export default class DisplayList extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      data: Map({
        dropTarget: false
      })
    }
    this.dragInOutCount = 0
  }

  render() {

    let items = ""
    if(this.props.folder) {
      items = this.props.folder.valueSeq().map((file, index) => {
        return ( <FileItem
          key={file.get('path')}
          file={file}
          className="folder-list-item"
          dispatch={this.props.dispatch}
        /> )
      })
    }

    return(
      <div className={
          classnames({
            'folder-display-list': true,
            'folder-display-list--drop-target': this.state.data.get('dropTarget'),
            'folder-display-list--focused': this.props.focused
          })
        }
        onDrop={this.onDrop}
        onDragOver={this.onDragOver}
        onDragEnter={this.onDragEnter}
        onDragLeave={this.onDragLeave}
        onMouseUp={this.focus}
      > 
        <div className="folder-display-list__toolbar-top">
          <div className="folder-display-list__name">
            {nodePath.basename(this.props.path)}
          </div>
        </div>
        <div className="folder-display-list__item-container">
          {(this.props.ready) ?
            <ReactCSSTransitionGroup
              transitionName="folder-list-item--animation"
              transitionEnterTimeout={250}
              transitionLeaveTimeout={250}
            >
              {(items.size > 0) ? 
                items
                :
                <div className="folder-display-list__empty-text">Folder is empty</div>
              }
            </ReactCSSTransitionGroup>
          :
            null
          }
        </div>
        <div className="folder-display-list__toolbar-bottom">
          <button
            className="folder-display-list__button-add-folder" 
            onClick={() => {
              this.props.dispatch( fsWrite.actions.newFolder(this.props.path) )
            }}
          />
          <FilterTypeInput path={this.props.path} />
        </div>
      </div>
    )
  }

  shouldComponentUpdate (nextProps, nextState) {
    return (
      nextProps.folder !== this.props.folder || 
      nextProps.focused !== this.props.focused || 
      nextProps.ready !== this.props.ready || 
      nextState.data !== this.state.data
    )
  }
  
  setImmState(fn) {
    // https://github.com/facebook/immutable-js/wiki/Immutable-as-React-state
    return this.setState(({data}) => ({
      data: fn(data)
    }));
  }


  /**
   * Filedrop to this Folder
   * with Hover drop-target state
  **/
  onDragOver = (event) => {
    event.preventDefault()
    event.stopPropagation()
    event.dataTransfer.dropEffect = "copy"
    this.setImmState((prevState) => (prevState.set('dropTarget', true)))
  }
  onDragEnter = (event) => {
    event.preventDefault()
    event.stopPropagation()
    this.dragInOutCount++
    this.setImmState((prevState) => (prevState.set('dropTarget', true)))
  }
  onDragLeave = (event) => {
    event.preventDefault()
    event.stopPropagation()
    this.dragInOutCount--
    if(this.dragInOutCount < 1) {
      this.setImmState((prevState) => (prevState.set('dropTarget', false)))
    }
  }
  onDrop = (event) => {
    event.preventDefault()
    event.stopPropagation()
    this.setImmState((prevState) => (prevState.set('dropTarget', false)))
    dragndrop.handleFileDrop(event, this.props.path)
  }

  onMouseDown = () => {
    
  }
  
  /**
   * focus
   * @memberOf DisplayList
   * A click in the "Whitespace" of a Folderview 
   * "Focus" the Folder show that one as the last one
   * (behaviour from finder)
   */
  focus = (event) => {
    this.props.dispatch( App.actions.changeAppPath(null, this.props.path) )
  }
}
