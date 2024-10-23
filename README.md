# smart-tab-grouping
Chrome extention of smart-tab-grouping

**作用说明：本地chrome插件**

**实现功能：根据域名对页签进行自动分组并命名**

### background1.js
- 作用：组默认折叠

### background2.js
#### 作用：
- 点开某个组之后展开，其他组折叠，直到点开另一个组，或者主动关上这一组
- 组名后面增加该组下折叠的页签数
- ![image](https://github.com/user-attachments/assets/d97bcd88-2143-48f2-9640-87b86a422953)

### background3.js
- 点开某组的时候，默认进入该组下第一个页面
- 点击关上某组时，折叠该组，但不创建新的空白页签，仍然保留在上一个打开的页签


## 操作步骤
1. 所有文件夹下载到本地放在一个文件夹内
2. 根据效果保留1个“background.js”，并删掉里面的序号，比如保留版本“background**1**.js”，删掉里面的**1**
3. 删掉README.md文件
4. chrome开发者模式“加载已解压的扩展程序”
