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
      `KDiff3 konnte nicht gestartet werden (${exe}): ${err.message}. ` +
        'Bitte Pfad in den Einstellungen (kdiff3Compare.kdiff3Path) setzen.'
    );
  });
  child.unref();
}

async function pickTwoFiles() {
  const uris = await vscode.window.showOpenDialog({
    canSelectFiles: true,
    canSelectFolders: false,
    canSelectMany: true,
    openLabel: 'Mit KDiff3 vergleichen',
    title: 'Genau zwei Dateien auswählen'
  });
  if (!uris) {
    return;
  }
  if (uris.length !== 2) {
    vscode.window.showWarningMessage('Bitte genau zwei Dateien auswählen.');
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
