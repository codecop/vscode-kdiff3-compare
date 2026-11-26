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

function looksLikePath(exe) {
  return exe.includes('/') || exe.includes(String.raw`\`);
}

function launchKDiff3(paths) {
  if (containsMixedFileAndFolder(paths)) {
    vscode.window.showErrorMessage(
      'KDiff3 cannot compare a file with a folder. Select only files or only folders.'
    );
    return;
  }
  const exe = kdiff3Exe();
  if (looksLikePath(exe) && !existsSync(exe)) {
    vscode.window.showErrorMessage(
      `KDiff3 executable not found: ${exe}. Set the path in the settings (kdiff3Compare.kdiff3Path).`
    );
    return;
  }
  const child = spawn(exe, paths, {
    detached: true,
    stdio: 'ignore'
  });
  child.on('error', (error) => {
    vscode.window.showErrorMessage(
      `Could not start KDiff3 (${exe}): ${error.message}. ` +
        'Set the path in the settings (kdiff3Compare.kdiff3Path).'
    );
  });
  child.on('exit', (code) => {
    if (code !== 0) {
      vscode.window.showErrorMessage(`KDiff3 exited with code ${code}.`);
    }
  });
  child.unref();
}

async function pickTwoPaths() {
  const uris = await vscode.window.showOpenDialog({
    canSelectFiles: true,
    canSelectFolders: true,
    canSelectMany: true,
    openLabel: 'Compare with KDiff3',
    title: 'Select exactly two files or folders'
  });
  if (!uris) {
    return;
  }
  if (uris.length !== 2) {
    vscode.window.showWarningMessage('Please select exactly two files or folders.');
    return;
  }
  launchKDiff3([uris[0].fsPath, uris[1].fsPath]);
}

function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'kdiff3.compareSelected',
      (resource, resources) => {
        let paths = [];
        if (Array.isArray(resources) && resources.length >= 2) {
          if (resources.length > 3) {
            vscode.window.showWarningMessage(
              'More than three items selected — comparing the first three with KDiff3.'
            );
          }
          paths = resources.slice(0, 3).map((uri) => uri.fsPath);
        } else if (resource && resource.fsPath) {
          paths = [resource.fsPath];
        }
        if (paths.length >= 2) {
          launchKDiff3(paths);
        } else {
          pickTwoPaths();
        }
      }
    )
  );
}

function deactivate() {
  // Nothing to clean up.
}

module.exports = { activate, deactivate };
