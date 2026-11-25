const vscode = require('vscode');
const { spawn } = require('child_process');
const { existsSync, statSync } = require('fs');

function kdiff3Exe() {
  const configured = vscode.workspace
    .getConfiguration('kdiff3Compare')
    .get('kdiff3Path');
  return configured && configured.trim() ? configured.trim() : 'kdiff3';
}

function containsMixedFileAndFolder(paths) {
  let hasFile = false;
  let hasFolder = false;
  for (const p of paths) {
    if (!existsSync(p)) {
      continue;
    }
    const stat = statSync(p);
    hasFile = hasFile || stat.isFile();
    hasFolder = hasFolder || stat.isDirectory();
  }
  return hasFile && hasFolder;
}

function launchKDiff3(paths) {
  const exe = kdiff3Exe();
  if (containsMixedFileAndFolder(paths)) {
    vscode.window.showErrorMessage(
      'KDiff3 cannot compare a file with a folder. Select only files or only folders.'
    );
    return;
  }
  const child = spawn(exe, paths, {
    detached: true,
    stdio: 'ignore'
  });
  child.on('error', (err) => {
    vscode.window.showErrorMessage(
      `Could not start KDiff3 (${exe}): ${err.message}. ` +
        'Set the path in the settings (kdiff3Compare.kdiff3Path).'
    );
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
          paths = resources.slice(0, 3).map((u) => u.fsPath);
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

function deactivate() {}

module.exports = { activate, deactivate };
