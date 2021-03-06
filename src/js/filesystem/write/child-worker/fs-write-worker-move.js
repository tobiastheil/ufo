//@flow
var fs = require("mz/fs");
var c = require("../fs-write-constants");
import copy from "./fs-write-worker-copy";
import rimraf from "rimraf";
import type { SubTask } from "../fs-write-types";

export default function move(
  subTask: SubTask,
  handleProgress: (subTaskProgress: any) => void
): Promise<*> {
  return new Promise(function(resolve, reject) {
    // Start with the easiest and fastest ways for move files/folders
    // and work up to more expensive ways

    fs.rename(subTask.source, subTask.destination, function(err) {
      if (err) {
        switch (err.code) {
          case c.ERROR_RENAME_CROSS_DEVICE:
            moveWithCopy(subTask);
            return;
          default:
            reject(err);
            return;
        }
      }
      resolve();
    });

    var moveWithCopy = (subTask: SubTask) => {
      copy(subTask, handleProgress)
        .then(() => {
          // Start deleting source
          rimraf(subTask.source, { disableGlob: true }, err => {
            if (err) {
              reject(err);
              return;
            }
            resolve();
          });
        })
        .catch(reject);
    };
  });
}
