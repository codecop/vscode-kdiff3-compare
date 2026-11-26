'use strict';

const vscode = require('vscode');
const { spawn } = require('node:child_process');
const { existsSync, statSync } = require('node:fs');

function kdiff3Exe() {
  const configured = vscode.workspace
    .getConfiguration('kdiff3Compare')
    .get('kdiff3Path');
  if (configured && configured.trim()) {
    return configured.trim();
  }
  return 'kdiff3';
}

function statKind(path) {
  try {
    const stat = statSync(path);
    if (stat.isFile()) {
      return 'file';
    }
    if (stat.isDirectory()) {
      return 'folder';
    }
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

function containsMixedFileAndFolder(paths) {
  let hasFile = false;
  let hasFolder = false;
  for (const path of paths) {
    const kind = statKind(path);
    hasFile ||= kind === 'file';
    hasFolder ||= kind === 'folder';
  }
  return hasFile && hasFolder;
}

const pathSeparator = /[/\\]/u;

function isPathLike(exe) {
  return pathSeparator.test(exe);
}

function launchErrorMessage(paths, exe) {
  if (containsMixedFileAndFolder(paths)) {
    return 'KDiff3 cannot compare a file with a folder. Select only files or only folders.';
  }
  if (isPathLike(exe) && !existsSync(exe)) {
    return `KDiff3 executable not found: ${exe}. Set kdiff3Compare.kdiff3Path.`;
  }
  return undefined;
}

function launchKDiff3(paths) {
  const exe = kdiff3Exe();
  const launchError = launchErrorMessage(paths, exe);
  if (launchError) {
    vscode.window.showErrorMessage(launchError);
    return;
  }
  const child = spawn(exe, paths, {
    detached: true,
    stdio: 'ignore'
  });
  child.on('error', (error) => {
    vscode.window.showErrorMessage(
      `Could not start KDiff3 (${exe}): ${error.message}. ` + 'Set kdiff3Compare.kdiff3Path.'
    );
  });
  child.on('exit', (code) => {
    if (code !== 0) {
      vscode.window.showErrorMessage(`KDiff3 exited with code ${code}.`);
    }
  });
  child.unref();
}

function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'kdiff3.compareSelected',
      (resource, resources) => {
        if (Array.isArray(resources) && resources.length >= 2) {
          if (resources.length > 3) {
            vscode.window.showWarningMessage(
              'More than three items selected - comparing the first three with KDiff3.'
            );
          }
          launchKDiff3(resources.slice(0, 3).map((uri) => uri.fsPath));
        } else {
          vscode.window.showInformationMessage(
            'Select two or three files or folders in the Explorer first.'
          );
        }
      }
    )
  );
}

function deactivate() {
  // nothing to clean up.
}

module.exports = { activate, deactivate };
