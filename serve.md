##  终端连接到CentOS7服务器
```
ssh -l root <ip>
```

## 新增用户
```
// 创建用户
adduser [用户名];
// 修改用户密码
passwd [用户名]
// 添加sudoers文件可写权限
chmod -v u+w /etc/sudoers
// 修改sudoers文件
vim /etc/sudoers 
// 按【i】进入编辑，在root  ALL=(ALL)  ALL下加入
[用户名]  ALL=(ALL)  ALL
// 【esc】退出编辑，【:wq】退出保存
// 收回sudoers文件可写权限
chmod -v u+w /etc/sudoers
// root权限用户添加完成
```