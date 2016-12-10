import React from 'react'
import classnames from 'classnames'
import FsWrite from '../../filesystem/write/fs-write-index'
import { connect } from 'react-redux'
import * as selectors from '../addon-bar-selectors'
import * as actions from '../addon-bar-actions'
import ReactCSSTransitionGroup from 'react-addons-css-transition-group'


@connect(() => {
  return (state, props) => {
    return {
      currentView: selectors.getCurrentView(state)
    }
  }
})
export default class AddonBar extends React.Component {

  constructor(props) {
    super(props)
  }

  render() {

    return(
      <div className="addon-bar">
        <div className="addon-bar__icon-toolbar">
          {this.getViewIcon('search')}
          {this.getViewIcon('fs-write')}
        </div>
        <ReactCSSTransitionGroup
          className="addon-bar__css-transition-group"
          transitionName="addon-bar__view-container--animation"
          transitionEnterTimeout={150}
          transitionLeaveTimeout={150}
        >
          {this.props.currentView ? 
            <div className="addon-bar__view-container">
              {this.getCurrentView()}
            </div>
          : null }
        </ReactCSSTransitionGroup>
      </div>
    )
  }

  getCurrentView = () => {

    
    switch (this.props.currentView) {
      case 'fs-write':
        return <FsWrite.component/>
  
      case 'search':
        return <div className="no-search">
                Sorry, search is not there jet...
              </div>
    
      default:
        return <div>Error</div>
    }
  }

  getViewIcon = (type) => (
    <div className={classnames({
        ['addon-bar__icon-'+type]: true,
        ['addon-bar__icon-'+type+'--active']: (this.props.currentView == type),
      })} 
      onClick={() => {
        this.props.dispatch( actions.toggleView(type) )
      }}
    />
  )
}