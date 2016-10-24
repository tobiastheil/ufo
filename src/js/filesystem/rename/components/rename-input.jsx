"use strict"
import React from 'react'
import ReactDOM from 'react-dom'
import classNames from 'classnames'
import * as actions from '../rename-actions'
import nodePath from 'path'
import { Shortcuts } from 'react-shortcuts'

export default class RenameInput extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      fileName: nodePath.basename(this.props.path)
    }
  }

  render() {
    return (
      <Shortcuts name="renameInput" handler={this.shortcutHandler}>
        <input
          ref="editField"
          className="edit"
          value={this.state.fileName}
          onMouseDown={this.onMouseDown}
          onMouseUp={this.onMouseUp}
          onBlur={this.onBlur}
          onChange={this.onChange}
        />
      </Shortcuts>
    )
  }

  componentDidMount(prevProps, prevState) {
    // Select text in input
    var node = ReactDOM.findDOMNode(this.refs["editField"]);
    node.focus();
    node.setSelectionRange(0, node.value.length);
  }

  shortcutHandler = (action, event) => {
    switch (action) {
      case "cancel":
        this.renameCancel()
        break;
      case "save":
        this.renameSave(event);
        break;
    }
  }

  onMouseDown = (event) => { event.stopPropagation() }
  onMouseUp = (event) => { event.stopPropagation() }
  onBlur = (event) => { this.renameSave(event) }
  onChange = (event) => {
    this.setState({'fileName': event.target.value})
  }

  renameSave = (event) => {
    var val = this.state.fileName.trim()
    if (val != nodePath.basename(this.props.path)) {
      this.props.dispatch( actions.renameSave( this.props.path, val) )
    } else {
      this.renameCancel()
    }
  }

  renameCancel = () => {
    this.props.dispatch( actions.renameCancel( this.props.path) )
  }
}