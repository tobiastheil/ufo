//@flow

import { Map } from "immutable";
import * as t from "./folder-editor-actiontypes";
import * as c from "./folder-editor-constants";
import SlateFile from "./slate-extensions/slate-file/slate-file-index";
import Preview from "../../view-file/vf-index";
import App from "../../app/app-index";
import Config from "../../config/config-index";
import fsWatch from "../../filesystem/watch/fs-watch-index";
import fsWrite from "../../filesystem/write/fs-write-index";
import { Raw } from "slate";
import _ from "lodash";
import nodePath from "path";

type EditorStore = Map<string, any>;

const INITIAL_STATE: EditorStore = Map({});

export default function folderEditorReducer(
  state: EditorStore = INITIAL_STATE,
  action: any = { type: "" }
) {
  switch (action.type) {
    case t.FOLDER_EDITOR_INIT:
      return state.set(action.payload.path, action.payload.editorState);

    case t.FOLDER_EDITOR_CHANGE:
      return state.set(action.payload.path, action.payload.editorState);

    case t.FOLDER_EDITOR_CLOSE:
      return state.delete(action.payload.path);

    case Config.actiontypes.APP_READ_ONLY_TOGGLE:
      // Collapse All Selections
      state = state.map((editorState, key) => {
        return editorState.transform().collapseToEnd().apply();
      });
      return state;
    // Add file at the end of the Document if not exists
    case fsWatch.actiontypes.FILE_ADD:
      if (action.payload.base == c.INDEX_BASE_NAME) return state;

      // File Exists already ?
      if (
        SlateFile.utils.getFileBlockByBase(
          state.get(action.payload.root),
          action.payload.base
        )
      )
        return state;

      // Add file at the end of the Document
      const document = state.get(action.payload.root).get("document");
      let transformAddFile = state.get(action.payload.root).transform();
      transformAddFile = SlateFile.stateTransforms.insertFileAtEnd(
        transformAddFile,
        document,
        action.payload.base
      );

      return state.set(
        action.payload.root,
        transformAddFile.apply({ save: false })
      );
    // Remove file from document is exists
    case fsWatch.actiontypes.FILE_UNLINK:
      let transformRemoveFile = state.get(action.payload.root).transform();
      transformRemoveFile = SlateFile.stateTransforms.removeExisting(
        transformRemoveFile,
        action.payload.base
      );
      return state.set(
        action.payload.root,
        transformRemoveFile.apply({ save: false })
      );
    // Rename File in Document
    case fsWrite.actiontypes.FS_WRITE_NEW:
      return (() => {
        if (action.payload.type != fsWrite.actiontypes.TASK_RENAME)
          return state;

        const renamingSource = action.payload.sources[0];
        const renamingSourceBase = nodePath.basename(renamingSource);
        const renamingSourceRoot = nodePath.dirname(renamingSource);
        const renamingTarget = action.payload.target;
        const renamingTargetBase = nodePath.basename(renamingTarget);
        const renamingEditor = state.get(renamingSourceRoot);

        if (!renamingEditor) return state;

        return state.set(
          renamingSourceRoot,
          SlateFile.stateTransforms
            .renameFile(
              renamingEditor,
              renamingEditor.transform(),
              renamingSourceBase,
              renamingTargetBase
            )
            .apply({ save: false })
        );
      })();
    // Rename Error, undo the rename in the Document
    case fsWrite.actiontypes.FS_WRITE_ERROR:
      return (() => {
        if (action.payload.type != fsWrite.actiontypes.TASK_RENAME)
          return state;

        const renamingSource = action.payload.sources[0];
        const renamingSourceBase = nodePath.basename(renamingSource);
        const renamingSourceRoot = nodePath.dirname(renamingSource);
        const renamingTarget = action.payload.target;
        const renamingTargetBase = nodePath.basename(renamingTarget);
        const renamingEditor = state.get(renamingSourceRoot);

        if (!renamingEditor) return state;

        return state.set(
          renamingSourceRoot,
          SlateFile.stateTransforms
            .renameFile(
              renamingEditor,
              renamingEditor.transform(),
              renamingTargetBase, // Inverted
              renamingSourceBase // Inverted
            )
            .apply({ save: false })
        );
      })();
    // case App.actiontypes.APP_CHANGE_PATH:
    //   // Set Selection to last folder in pathRoute
    //   if(action.payload.pathRoute.length > 1) {
    //     const selectedBase = nodePath.basename( _.last(action.payload.pathRoute) )
    //     const root = action.payload.pathRoute[ action.payload.pathRoute.length - 2 ]
    //     let editorState = state.get(root)

    //     if(editorState) {
    //       const node = SlateFile.Blocks.getFileBlockByBase(editorState, selectedBase)
    //       const newSelection = SlateFile.Selection.createSelectionForFile(node)
    //       editorState = editorState.transform().select(newSelection).apply({save: false})
    //       state = state.set(root, editorState)
    //     }
    //   }

    //   return state

    // case Preview.actiontypes.SHOW_PREVIEW:
    //   // Select File wich is opend in File Preview
    //   const root = nodePath.dirname(action.payload.path)
    //   const selectedBase = nodePath.basename(action.payload.path)
    //   let editorState = state.get(root)

    //   if(editorState) {
    //     const node = SlateFile.Blocks.getFileBlockByBase(editorState, selectedBase)
    //     const newSelection = SlateFile.Selection.createSelectionForFile(node)
    //     editorState = editorState.transform().select(newSelection).apply({save: false})
    //     state = state.set(root, editorState)
    //   }


    default:
      return state;
  }
}
