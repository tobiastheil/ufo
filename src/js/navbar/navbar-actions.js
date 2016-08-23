import * as t from './navbar-actiontypes'

export function changeGroupName(groupID, newName) {
  return {
    type: t.NAVBAR_CHANGE_GROUP_TITLE,
    payload: {groupID: groupID, newName: newName}
  };
}

export function hideGroup(groupID) { // Action Creator
  return { // action
    type: t.NAVBAR_HIDE_GROUP,
    payload: {groupID: groupID}
  };
}

export function changeGroupTitle(groupID, newTitle) { // Action Creator
  return { // action
    type: t.NAVBAR_CHANGE_GROUP_TITLE,
    payload: {groupID: groupID, newTitle: newTitle}
  };
}

export function removeGroupItem(groupID, itemID) { // Action Creator
  return { // action
    type: t.NAVBAR_REMOVE_GROUP_ITEM,
    payload: {
      groupID: groupID,
      itemID: itemID}
  };
}