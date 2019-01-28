# fast-markdown-js
Yet another Markdown parser, this time for JavaScript. 
It is a fastest JavaScript Markdown parser.

# Usage

```
var md_txt = "\
|服务器工具表|\n\\
*这是倾斜的文字*内==容|表头|表头\n\\
---|:--:|---:\n\\
**这是倾斜的文字*内==容|内容|内容\n\\
**这是倾斜的文字*内==容|列表**这是加粗的文字***==text==容\n\\
\n";

var htmlTxt = FastMarkDown(md_txt);
$("#preview").html(htmlTxt);
```

# test parse Speed

**10000 times** just cost **1637 millisecond**.
[markdown-js](https://github.com/evilstreak/markdown-js): 100 times cost 10 second

```
var test_txt = "\
![alt](./money.png \"图片title\")\n\
![alt](./money.png)\n\
![]()\n\
[接名](./money.png '超链接title')\n\
**这是倾斜的文字*内==容\n\
|服务器工具表|\n\
*这是倾斜的文字*内==容|表头|表头\n\
---|:--:|---:\n\
**这是倾斜的文字*内==容|内容|内容\n\
**这是倾斜的文字*内==容|列表**这是加粗的文字***这是倾斜的文字*内==text==容\n\
\n\
1. 列表**这是加粗的文字***这是倾斜的文字*内==text==容\n\
1. 列表内容\n\
   + 列表内容\n\
   + 列表内容\n\
1. 列表内容\n\
* 列表内容1\n\
* 列表内容2\n\
* 列表内容3\n\
- 列表内容\n\
- 列表内容\n\
+ 列表内容\n\
   1. 列表内容\n\
   2. 列表内容\n\
\
`asga`\n\
 asd`asga`asdf\n\
![alt](./money.png '图片title')\n\
[接名](地址 '超链接title')\n\
这是加**这是加粗的文字**这wer是加\n\
**这是加粗的文字**这是加\n\
*这是倾斜的文字*\n\
***这是斜体加粗的文字***\n\
~~这是加删除线的文字~~\n\
\n\
fas==text==sfa\n\
\
```javascript\n\
function $initHighlight(block, cls) {\n\
	try {\n\
		if (cls.search(/\bno\-highlight\b/) != -1)\n\
      		return process(block, true, 0x0F) +\n\
            	\` class=\"${cls}\"\`;\n\
  	} catch (e) {\n\
    	/* handle exception */\n\
 	}\
  	for (var i = 0 / 2; i < classes.length; i++) {\n\
    	if (checkCondition(classes[i]) === undefined)\n\
      		console.log('undefined');\n\
  	}\n\
}\n\
\n\
export  $initHighlight;\n\
(```)\n\
\
\n\
---\n\
***\n\
# 这是一级\n\
## 这是二级\n\
\
### 这是三级\n\
#### 这是四级\n\
##### 这是五级\n\
###### 这是六级\n\
>这是引用的内容\n\
\
";

	var startTime = Date.now();
    for (var i = 0; i < 10000; i++) {
        var htmlTxt = FastMarkDown(test_txt);
        // $("#preview").html(htmlTxt);
    }
    var endTime = Date.now();
    console.log("cost time:",endTime-startTime);
    //cost time:1637 millisecond

```