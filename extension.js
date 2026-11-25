const vscode = require('vscode');
const { spawn } = require('child_process');

function kdiff3Exe() {
  const configured = vscode.workspace
    .getConfiguration('kdiff3Compare')
    .get('kdiff3Path');
  return configured && configured.trim() ? configured.trim() : 'kdiff3';
}

function launchKDiff3(pathA, pathB) {
  const exe = kdiff3Exe();
  const child = spawn(exe, [pathA, pathB], {
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
  launchKDiff3(uris[0].fsPath, uris[1].fsPath);
}

function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'kdiff3.compareSelected',
      (resource, resources) => {
        let paths = [];
        if (Array.isArray(resources) && resources.length >= 2) {
          paths = resources.slice(0, 2).map((u) => u.fsPath);
        } else if (resource && resource.fsPath) {
          paths = [resource.fsPath];
        }
        if (paths.length === 2) {
          launchKDiff3(paths[0], paths[1]);
        } else {
          pickTwoPaths();
        }
      }
    )
  );
}

function deactivate() {}

module.exports = { activate, deactivate };
