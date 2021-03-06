//@flow
import React from "react";
import { connect } from "react-redux";
import nodePath from "path";
import classnames from "classnames";
import NavGroupItem from "./navgroup-item";
import NavGroupTitle from "./navgroup-title";
import { remote } from "electron";
import App from "../../app/app-index";
import * as Actions from "../navbar-actions";
import * as c from "../navbar-constants";
import _ from "lodash";
const { Menu, MenuItem } = remote;
import { findDOMNode } from "react-dom";
import NavGroupItemCollapser from "./navgroup-item-collapser";
import * as dragndrop from "../../utils/dragndrop";
import * as types from "../navbar-types";
import { TransitionMotion, spring } from "react-motion";
import ViewFile from "../../view-file/vf-index";

type Props = {
  group: any,
  draggingGroup: types.groupDragData,
  activeItem: number,
  position: number,
  style: Object,
  dispatch: Function,
  setDraggingGroup: (types.groupDragData) => void,
  clearDraggingGroup: Function
};

type State = {
  isDragging: boolean,
  dragOver: boolean,
  draggingItem: types.itemDragData
};

export default class NavGroup extends React.Component {
  props: Props;
  state: State;
  inTransition: boolean;
  constructor(props: Props) {
    super(props);
    this.inTransition = false;
    this.state = {
      isDragging: false,
      dragOver: false,
      draggingItem: false
    };
  }

  render() {
    const { dragOver, isDragging } = this.state;
    const { group, position } = this.props;
    let classname = classnames({
      "nav-bar-group": true,
      "nav-bar-group--collapsed": group.hidden,
      "nav-bar-group--is-dragging": this.props.draggingGroup &&
        this.props.draggingGroup.groupId === group.id,
      "nav-bar-group--drop-target": dragOver
    });

    //Disable dragndrop listener, if transition is in progress
    //this will avoid back and forward bouncing

    return (
      <div
        className={classname}
        draggable={true}
        style={this.props.style}
        onMouseDown={e => e.stopPropagation()} // Avoid preventing event by root event catcher, would prevent dragStart
        onDragStart={this.onDragStart}
        onDragEnd={this.onDragEnd}
        data-key={position}
        {...this.dropZoneListener}
      >
        <NavGroupTitle
          title={group.title}
          isDiskGroup={group.diskGroup}
          hidden={group.hidden}
          onGroupTitleChange={this.handleGroupTitleChange}
          onGroupRemove={this.handleRemoveGroup}
          onToggleGroup={this.handleToggleGroup.bind(this, group.id)}
        />
        <TransitionMotion
          defaultStyles={this.getDefaultStyles()}
          styles={this.getStyles()}
          willLeave={this.willLeave}
          willEnter={this.willEnter}
        >
          {styles => {
            return (
              <NavGroupItemCollapser
                collapsed={this.props.group.collapsed}
                itemCount={this.props.group.items.size}
              >
                {styles.map(({ key, data, style }, position) => {
                  return (
                    <NavGroupItem
                      key={key}
                      item={data.item}
                      style={style}
                      position={position}
                      groupId={this.props.group.id}
                      active={data.item.path === this.props.activeItem}
                      isDiskGroup={this.props.group.diskGroup}
                      onClick={this.handleSelectionChanged.bind(
                        this,
                        data.item
                      )}
                      onItemRemove={this.handleOnItemRemove.bind(
                        this,
                        data.position
                      )}
                      onMoveGroupItem={this.handleMoveGroupItem}
                      draggingItem={this.state.draggingItem}
                      setDraggingItem={this.setDraggingItem}
                      clearDraggingItem={this.clearDraggingItem}
                    />
                  );
                })}
              </NavGroupItemCollapser>
            );
          }}
        </TransitionMotion>
      </div>
    );
  }

  componentWillReceiveProps(nextProps: Props) {
    if (this.props.position != nextProps.position) {
      this.inTransition = true;

      setTimeout(
        () => {
          this.inTransition = false;
        },
        c.ANIMATION_TIME
      );
    }
  }

  getDefaultStyles() {
    return this.props.group.items
      .map((item, position) => ({
        key: item.path,
        data: { item, position },
        style: {
          height: c.ITEM_HEIGHT,
          opacity: 1,
          top: position * c.ITEM_HEIGHT
        }
      }))
      .toJS();
  }

  getStyles() {
    return this.props.group.items
      .map((item, position) => {
        return {
          key: item.path,
          data: { item, position },
          style: {
            height: spring(c.ITEM_HEIGHT),
            opacity: spring(1),
            top: spring(position * c.ITEM_HEIGHT)
          }
        };
      })
      .toJS();
  }

  willEnter(config: any) {
    return {
      height: c.ITEM_HEIGHT,
      opacity: 0,
      top: config.data.position * c.ITEM_HEIGHT
    };
  }

  willLeave(config: any) {
    return {
      height: spring(0),
      opacity: spring(0),
      top: config.data.position * c.ITEM_HEIGHT
    };
  }

  // GROUP EVENTS

  handleToggleGroup = () => {
    this.props.dispatch(Actions.groupToggle(this.props.position));
  };

  handleRemoveGroup = () => {
    this.props.dispatch(Actions.groupRemove(this.props.position));
  };

  // GROUP TITLE EVENTS

  handleGroupTitleChange = (newTitle: string) => {
    this.props.dispatch(
      Actions.groupTitleChange(this.props.position, newTitle)
    );
  };

  /**
   * Drag Listener
   * to Drag the Group arround the sort them in the other Group
   */

  onDragStart = (event: SyntheticDragEvent) => {
    // Store ids of this Group, to access them in other Groups onDragOver
    const dragData: types.groupDragData = {
      groupId: this.props.group.id,
      groupPosition: this.props.position
    };
    setTimeout(
      () => {
        // Wait, to do not apply the dragging css to the dragging image
        this.props.setDraggingGroup(dragData);
      },
      1
    );
    // We use the DataType of the event, but we cant access the data in dragOver.. useless
    event.dataTransfer.setData(c.DnDTypes.NAVGROUP, "uselesData");
  };

  // Clear the stored
  onDragEnd = () => {
    this.props.clearDraggingGroup();
  };

  /**
   * Dropzone
   * the Navbar-Group can handle two type of Drops
   * the first is a file drop: The files will be added to to the Items of the Group
   * the second is a Navbar-Group Drag for sorting the Navbars.
   */

  dropZoneListener = dragndrop.getEnhancedDropZoneListener({
    acceptableTypes: [
      c.DnDTypes.NAVGROUP,
      !this.props.group.diskGroup ? dragndrop.constants.TYPE_FILE : ""
    ],
    possibleEffects: dragndrop.constants.effects.ALL,

    dragHover: (event, cursorPosition) => {
      if (this.inTransition) return;
      event.preventDefault();

      if (dragndrop.shouldAcceptDrop(event, dragndrop.constants.TYPE_FILE)) {
        // File DROP
        if (this.state.dragOver == true) return;
        this.setState({
          dragOver: true
        });
      } else if (dragndrop.shouldAcceptDrop(event, c.DnDTypes.NAVGROUP)) {
        // Navgroup Drag

        if (!this.props.draggingGroup) {
          return; // no needed data, jet
        }

        const draggingOriginPosition = this.props.draggingGroup.groupPosition;
        const overPosition = this.props.position;

        // Don't replace items with themselves
        if (draggingOriginPosition === overPosition) {
          return;
        }

        if (
          draggingOriginPosition < overPosition &&
          cursorPosition == dragndrop.constants.CURSOR_POSITION_TOP
        ) {
          return; // Not over 50% Group height downwards, do nothing for now
        }
        if (
          draggingOriginPosition > overPosition &&
          cursorPosition == dragndrop.constants.CURSOR_POSITION_BOTTOM
        ) {
          return; // Not over 50% Group height upwards, do nothing for now
        }

        // Time to actually perform the action
        this.props.setDraggingGroup({
          groupId: this.props.draggingGroup.groupId,
          groupPosition: overPosition
        });

        this.props.dispatch(
          Actions.groupMove(draggingOriginPosition, overPosition)
        );
      }
    },

    dragOut: () => {
      if (this.state.dragOver === false || this.inTransition) return;
      this.setState({
        dragOver: false
      });
    },

    drop: (event, cursorPosition) => {
      event.preventDefault(); // Success Animation
      event.stopPropagation(); // Avoid new Group in navbar
      if (dragndrop.shouldAcceptDrop(event, dragndrop.constants.TYPE_FILE)) {
        // Filedrop, add File to Group

        if (this.props.isDiskGroup) return;
        const fileList = dragndrop.getFilePathArray(event);
        if (fileList.length > 0) {
          this.props.dispatch(
            Actions.itemsCreate_fromPath(this.props.position, fileList)
          );
        }
      } else if (dragndrop.shouldAcceptDrop(event, c.DnDTypes.NAVGROUP)) {
        this.props.clearDraggingGroup();
      }
    }
  });

  // GROUP ITEM EVENTS

  handleOnItemRemove = (itemIndex: number, e: SyntheticMouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    this.props.dispatch(Actions.itemRemove(this.props.position, itemIndex));
  };

  handleSelectionChanged = (item: any, e: SyntheticMouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (item.type == c.ITEM_TYPE_FILE) {
      this.props.dispatch(
        App.actions.changeAppPath(nodePath.dirname(item.path), null)
      );
      this.props.dispatch(ViewFile.actions.showPreview(item.path));
    } else {
      this.props.dispatch(App.actions.changeAppPath(item.path));
    }
  };

  handleMoveGroupItem = (
    draggingItemPosition: number,
    overItemPosition: number
  ) => {
    this.props.dispatch(
      Actions.itemMove(
        this.props.position,
        draggingItemPosition,
        overItemPosition
      )
    );
  };

  setDraggingItem = (dragData: types.itemDragData) => {
    this.setState({
      draggingItem: dragData
    });
  };

  clearDraggingItem = () => {
    this.setState({
      draggingItem: false
    });
  };
}
