const vscode = require('vscode');
const { spawn } = require('child_process');

function kdiff3Exe() {
  const configured = vscode.workspace
    .getConfiguration('kdiff3Compare')
    .get('kdiff3Path');
  return configured && configured.trim() ? configured.trim() : 'kdiff3';
}

function launchKDiff3(fileA, fileB) {
  const exe = kdiff3Exe();
  const child = spawn(exe, [fileA, fileB], {
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

async function pickTwoFiles() {
  const uris = await vscode.window.showOpenDialog({
    canSelectFiles: true,
    canSelectFolders: false,
    canSelectMany: true,
    openLabel: 'Compare with KDiff3',
    title: 'Select exactly two files'
  });
  if (!uris) {
    return;
  }
  if (uris.length !== 2) {
    vscode.window.showWarningMessage('Please select exactly two files.');
    return;
  }
  launchKDiff3(uris[0].fsPath, uris[1].fsPath);
}

function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'kdiff3.compareSelected',
      (resource, resources) => {
        let files = [];
        if (Array.isArray(resources) && resources.length >= 2) {
          files = resources.slice(0, 2).map((u) => u.fsPath);
        } else if (resource && resource.fsPath) {
          files = [resource.fsPath];
        }
        if (files.length === 2) {
          launchKDiff3(files[0], files[1]);
        } else {
          pickTwoFiles();
        }
      }
    )
  );
}

function deactivate() {}

module.exports = { activate, deactivate };
