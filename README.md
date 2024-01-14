# bs-quest-song-manager [wip]

App to manage songs for the Beat Saber Quest.

## Usage

This app does not use adb. You have to mount android storage to pc.

There are serveral ways to do it.

1. Use [primitive-ftpd](https://github.com/wolpi/prim-ftpd)

Install app to quest3 and mount sftp server to pc using something like rclone.

2. Use sshd on termux

Termux can also be used to mount android storage to pc using sftp.

## Features

- [x] Load playlist and songs
- [x] Download missing songs in playlist
- [x] Add songs
- [x] Delete songs
- [ ] Edit playlist
