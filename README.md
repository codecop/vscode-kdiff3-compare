# KDiff3 Compare

100% vibe coded ;-)

Compare two or three selected files or folders with [KDiff3](https://kdiff3.com/) - right from the Explorer context menu, like VS Code's built-in "Compare Selected".

## Features

- Select **two** files or folders in the Explorer -> right-click -> **Compare Selected with KDiff3**: side-by-side diff for files, directory comparison for folders.
- Select **three** items: KDiff3 opens its three-way view.

## Requirements

- KDiff3 installed ([kdiff3.com](https://kdiff3.com/))

## Installation

Download the latest `.vsix` from the [releases](https://github.com/codecop/vscode-kdiff3-compare/releases) and install it via **Extensions -> ... -> Install from VSIX...**.

## Settings

`kdiff3Compare.kdiff3Path` - full path to the KDiff3 executable (the .exe/binary, not a .bat/.cmd):

- Windows: `C:\Program Files\KDiff3\kdiff3.exe`
- Linux/macOS: `/usr/bin/kdiff3` (the default `kdiff3` uses PATH)
