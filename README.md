# bs-quest-song-manager [wip]

App to manage songs for the Beat Saber Quest.

**This app is very early in development and not usable yet.**

## Usage

This app can be used through filesystem mounted to pc or adb.

### Filesystem

Filesystem method is faster and more reliable.

1. Use [primitive-ftpd](https://github.com/wolpi/prim-ftpd)

Install app to quest3 and mount sftp server to pc using something like rclone.

2. Use sshd on termux

Termux can also be used to mount android storage to pc using sftp.

### adb

You have to install adb command. Only one device must be connected. Also, it is
recommended to start adb server in advance by executing `adb devices` or so on.

## Features

- [x] Load playlist and songs
- [x] Download missing songs in playlist
- [ ] Add songs
- [ ] Delete songs
- [ ] Edit playlist
