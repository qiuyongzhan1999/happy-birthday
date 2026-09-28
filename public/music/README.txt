把《生日快乐歌》的音频文件放到本目录，命名为 happy-birthday.mp3，
程序进入后就会自动播放它（放在 public/music/happy-birthday.mp3）。

例如：public/music/happy-birthday.mp3

如果这里没有音频文件，程序会自动用 Web Audio 合成《生日快乐歌》旋律循环播放。
也可以在 src/config.js 的 musicUrl 里填一个音频地址，填了会优先使用它。
