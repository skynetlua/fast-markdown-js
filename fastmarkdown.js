var FastWidget = (function() {
	function Widget(name) {
		this._name = name;
	}
	Widget.prototype = {
		set: function() {
			for (var i = 0, len = arguments.length; i < len; i++) {
				var arg = arguments[i];
				if (arg instanceof Widget) {
					this._childs = this._childs || [];
					this._childs.push(arg);
				} else {
					if (typeof(arg) === "string") {
						this._text = arg;
					} else if (typeof(arg) === "object") {
						this._props = this._props || {};
						for (k in arg) {this._props[k] = arg[k];}
					}
				}
			}
			return this;
		},
		concat:function(txts) {
			var empty = "";
			return empty.concat.apply(empty, txts);
		},
		echo: function() {
			var props = "";
			if (this._props) {
				props = [];
				for (k in this._props) {
					if (typeof(this._props[k]) === "string") {
						props.push(" ", k, "=\"", this._props[k], "\"");
					} else {
						props.push(" ", k, "=", this._props[k]);
					}
				}
				props = this.concat(props);
			}
			if (!this._text && !this._childs) {
				return this.concat(["<", this._name, " ", props, " />"]);
			}
			var childs = "";
			if (this._childs) {
				childs = [];
				for (var i = 0, len = this._childs.length; i < len; i++) {
					childs.push(this._childs[i].echo());
				}
				childs = this.concat(childs);
			}
			return this.concat(["<", this._name, props, ">", childs, this._text || "", "</", this._name, ">"]);
		},
		goodecho: function(sep, depth) {
			sep = sep || "\n";
			depth = depth || 0;
			var indent = [];
			for (var i = 0; i < depth; i++) {indent.push("	");}
			indent = this.concat(indent);
			var props = "";
			if (this._props) {
				props = [];
				for (k in this._props) {
					if (typeof(this._props[k]) === "string") {
						props.push(" ", k, "=\"", this._props[k], "\"");
					} else {
						props.push(" ", k, "=", this._props[k]);
					}
				}
				props = this.concat(props);
			}
			if (!this._text && !this._childs) {
				return this.concat([indent, "<", this._name, " ", props, "/>", sep]);
			}
			var preseq = sep;
			var suindent = indent;
			var childs = "";
			if (this._childs) {
				childs = [];
				for (var i = 0, len = this._childs.length; i < len; i++) {
					childs.push(this._childs[i].goodecho(sep, depth + 1));
				}
				childs = this.concat(childs);
			} else {
				preseq = "";suindent = "";
			}
			return this.concat([indent, "<", this._name, props, ">", preseq, childs, this._text || "", suindent, "</", this._name, ">", sep]);
		}
	};
	return function(name) {
		var wgt = new Widget(name);
		for (var i = 1, len = arguments.length; i < len; i++) {
			wgt.set(arguments[i]);
		}
		return wgt;
	};
})();


var FastMarkDown = (function() {
	var HeaderNodes = [
		["ul", "- "],["ul", "+ "],["ul", "* "],["hr", "---"],["hr", "***"],
		["h6", "###### "],["h5", "##### "],["h4", "#### "],["h3", "### "],["h2", "## "],
		["h1", "# "],["pre", "```", "```"],["blockquote", ">"],
	];
	var InlineNodes = [
		["a", null, "[", "](", ")"],
		["img", null, "![", "](", ")"],
		["strong", "em", "***", "***"],
		["strong", null, "**", "**"],
		["code", null, "`", "`"],
		["em", null, "*", "*"],
		["mark", null, "==", "=="],
		["del", null, "~~", "~~"],
	];
	var Nodes = {"p": ["p"],"br": ["br"],"ol": ["ol"],"pre": ["pre"],
		"table": ["table"],"caption": ["caption"],"thead": ["thead"],"th": ["th"],
		"tbody": ["tbody"],"tr": ["tr"],"td": ["td"],"li": ["li"],"div": ["div"],
	};
	var widget = FastWidget;
	function Piece() {}
	Piece.prototype = {
		searchNode: function(txt, idx, len, nodes) {
			var node, pattern;
			for (var i = 0, nlen = nodes.length; i < nlen; i++) {
				node = nodes[i];
				pattern = node[2];
				for (var j = 0, plen = pattern.length; j < plen; j++) {
					if (pattern[j] != txt[idx + j]) {
						node = null;break;
					}
				}
				if (node) {
					this.startIdx = idx + pattern.length;
					return node;
				}
			}
		},
		searchPattern: function(txt, idx, len, pattern) {
			var k, plen = pattern.length;
			for (var i = 0; i < plen; i++) {
				k = idx + i;
				if (k >= len || pattern[i] != txt[k]) {
					return;
				}
			}
			return true;
		},
		isCheckChar: function(txt, idx) {
			var charCode = txt.charCodeAt(idx);
			if (charCode >= 128) {return;}
			if (charCode < 48 || (charCode > 57 && charCode < 65) ||
				(charCode > 90 && charCode < 97) || charCode > 122) {
				return true;
			}
		},
		processNext: function(txt, idx, len) {
			var startIdx = idx,
				pattern = this._node[4];
			while (idx < len) {
				if (this.isCheckChar(txt, idx)) {
					if (this.searchPattern(txt, idx, len, pattern)) {
						this.startIdx1 = startIdx;
						this.endIdx1 = idx;
						this._content1 = txt.substring(this.startIdx1, this.endIdx1);
						idx = idx + pattern.length;
						return idx;
					} else if (this.searchNode(txt, idx, len, InlineNodes)) {
						var piece = new Piece();
						var next = piece.process(txt, idx, len);
						if (next == idx) {break;}
						this._childs = this._childs || [];
						this._childs.push(piece);
						idx = next;
					} else {idx++;}
				} else {idx++;}
			}
			return idx;
		},
		process: function(txt, idx, len) {
			var node, startIdx = idx;
			if (this.isCheckChar(txt, idx)) {
				node = this.searchNode(txt, idx, len, InlineNodes);
			}
			if (node) {
				this._node = node;
				idx = this.startIdx;
				var pattern = node[3];
				while (idx < len) {
					if (this.isCheckChar(txt, idx)) {
						if (this.searchPattern(txt, idx, len, pattern)) {
							this.endIdx = idx;
							idx = idx + pattern.length;
							this._content = txt.substring(this.startIdx, this.endIdx);
							if (node[4]) {
								return this.processNext(txt, idx, len);
							}
							return idx;
						} else if (this.searchNode(txt, idx, len, InlineNodes)) {
							var piece = new Piece();
							var next = piece.process(txt, idx, len);
							if (next == idx) {break;}
							if (piece._node == Nodes["p"]) {
								break;
							}
							this._childs = this._childs || [];
							this._childs.push(piece);
							idx = next;
						} else {idx++;}
					} else {idx++;}
				}
			} else {
				while (idx < len) {
					if (this.isCheckChar(txt, idx)) {
						if (this.searchNode(txt, idx, len, InlineNodes)) {
							this._node = Nodes["p"];
							this.startIdx = startIdx;
							this.endIdx = idx;
							this._content = txt.substring(this.startIdx, this.endIdx);
							return idx;
						}
					}
					idx++;
				}
			}
			this._node = Nodes["p"];
			this.startIdx = startIdx;
			this.endIdx = len;
			this._content = txt.substring(this.startIdx, this.endIdx);
			return startIdx + len;
		},
		render: function(parent) {
			var wdt, node = this._node;
			if (node[4]) {
				var strs = this._content1.split(" ");
				var props = {};
				var url;
				if (strs.length > 1) {
					var lStr = strs[strs.length - 1];
					var len = lStr.length;
					if ((lStr[0] == "'" || lStr[0] == '"') && (lStr[len - 1] == "'" || lStr[len - 1] == '"')) {
						props.title = lStr.substring(1, len - 1);
						url = this._content1.substring(0, this._content1.length - len - 1);
					}
				}
				url = url || this._content1;
				if (node[0] == 'a') {
					props.href = url;
					wdt = widget(node[0], props, this._content || "");
				} else {
					props.src = url;
					props.alt = this._content || "";
					wdt = widget(node[0], props);
				}
			} else {
				wdt = widget(node[0]);
			}
			parent.set(wdt);
			if (this._childs) {
				for (var i = 0; i < this._childs.length; i++) {
					this._childs[i].render(wdt);
				}
			} else if (node[1]) {
				wdt.set(widget(node[1], this._content));
			} else {
				if (!node[4]) {
					wdt.set(this._content);
				}
			}
		}
	}
	function Block() {
		this._childs = [];
	}
	Block.prototype = {
		searchNode: function(txt, idx, len, nodes) {
			var charCode = txt.charCodeAt(idx);
			if (charCode >= 128) {return;}
			if (charCode >= 48 && charCode <= 57) {
				idx = idx + 1;
				for (; idx < len; idx++) {
					charCode = txt.charCodeAt(idx);
					if (charCode < 48 || charCode > 57) {
						if (txt[idx] == "." && txt[idx + 1] == " ") {
							this.startIdx = idx + 2;
							return Nodes["ol"];
						}
						return;
					}
				}
			} else if (charCode < 65 || (charCode > 90 && charCode < 97) || charCode > 122) {
				var node, pattern;
				for (var i = 0, nlen = nodes.length; i < nlen; i++) {
					node = nodes[i];
					pattern = node[1];
					for (var j = 0, plen = pattern.length; j < plen; j++) {
						if (pattern[j] != txt[idx + j]) {
							node = null;break;
						}
					}
					if (node) {
						this.startIdx = idx + pattern.length;
						return node;
					}
				}
			}
		},
		searchPatternTail: function(txt, idx, len, pattern) {
			var charCode = txt.charCodeAt(idx);
			if (charCode >= 128) {return;}
			if (charCode < 48 || (charCode > 57 && charCode < 65) ||
				(charCode > 90 && charCode < 97) || charCode > 122) {
				var k, plen = pattern.length;
				for (var i = plen - 1; i >= 0; i--) {
					k = idx + len - (plen - i);
					if (k < idx || pattern[i] != txt[k]) {
						return;
					}
				}
				return true;
			}
		},
		quickParse: function(lines, point) {
			var txt = lines[point++];
			this._line = txt;
			var idx = 0,
				len = txt.length;
			for (var i = idx; i < len; i++) {
				if (txt[i] != " ") {
					idx = i;break;
				}
			}
			this._spaceNum = idx;
			if (this._spaceNum >= 4) {
				this._node = Nodes["pre"];
				this.startIdx = idx;
				this.endIdx = len;
				return point;
			}
			var node = this.searchNode(txt, idx, len, HeaderNodes);
			if (node) {
				this._node = node;
				idx = this.startIdx;
				var pattern = node[2];
				if (!pattern) {
					this.endIdx = len;return point;
				} else {
					if (idx < len) {
						if (this.searchPatternTail(txt, idx, len, pattern)) {
							this.endIdx = len - pattern.length;
							return point;
						}
					}
					var line, tmps = [];
					for (var i = point; i < lines.length; i++) {
						line = lines[i];
						if (this.searchPatternTail(line, 0, line.length, pattern)) {
							this.endIdx = len;
							this._lines = tmps;
							point = i + 1;
							return point;
						}
						tmps.push(line + "\n");
					}
				}
			}
			this._node = Nodes["p"];
			this.startIdx = 0;
			this.endIdx = len;
			return point
		},
		searchTable: function(txt, idx, len) {
			var char, tr, table = [];
			for (var i = idx; i < len; i++) {
				char = txt[i];
				if (!tr) {
					tr = [];table.push(tr);
				} else {
					if (char == "|") {
						if (!tr.istr) {return;}
						if (tr.length == 1) {tr.push(0);}
						tr = [];table.push(tr);
					}
				}
				if (char == ":") {
					tr.push(1);
				} else if (char == "-") {
					tr.istr = true;
					if (tr.length == 0) {tr.push(0);}
				} else if (char == "|") {} else {
					return;
				}
			}
			tr = table[table.length - 1];
			if (tr.length != 2) {
				table.pop();
			}
			for (var i = 0; i < table.length; i++) {
				tr = table[i];delete tr.istr;
				if (tr.length != 2) return;
			}
			this.table = table;
			this._node = Nodes["table"];
			return true;
		},
		extraProcess: function() {
			if (this._node[0] == "hr") {
				var txt = this._line;
				var len = txt.length;
				var sameChar = this._node[1][0];
				for (var i = 0; i < len; i++) {
					if (txt[i] != sameChar) {
						this._node = Nodes["p"];
						this.startIdx = 0;
						this.endIdx = len;
						break;
					}
				}
			}
			if (this._node[0] == "p") {
				var char = this._line[this._spaceNum];
				if (char == "|" || char == ":" || char == "-") {
					this.searchTable(this._line, this._spaceNum, this.endIdx);
				}
			}
		},
		process: function(lines, point) {
			var line = lines[point];
			if (line.length > 0) {
				point = this.quickParse(lines, point);
				this.extraProcess();
			} else {
				point++;
				this._node = Nodes["br"];
			}
			return point;
		},
		searchPieces: function() {
			if (this._lines || !this._line) {
				return;
			}
			var txt = this._line;
			var idx = this.startIdx;
			var endIdx = this.endIdx;
			var piece, next;
			while (idx < endIdx) {
				piece = new Piece();
				next = piece.process(txt, idx, endIdx);
				this._childs.push(piece);
				if (next == idx) {break;}
				idx = next;
			}
		},
		render: function(parent) {
			var wdt = widget(this._node[0])
			parent.set(wdt);
			if (this._node[0] == "pre") {
				var codeName = this._line.substring(this.startIdx, this.endIdx);
				this._lines.push("\n");
				var codeTxt = "".concat.apply("", this._lines);
				var codes = [],charCode;
				for (var i = 0,len=codeTxt.length; i < len; i++) {
					charCode = codeTxt.charCodeAt(i);
					if (charCode<=255) {
						codes.push("&#"+charCode);
					}else{
						codes.push(codeTxt[i]);
					}
				}
				codeTxt = "".concat.apply("", codes);
				wdt.set(widget("code", {class: codeName}, codeTxt));
				return;
			}
			var childs = this._childs;
			if (!childs || childs.length == 0) {
				return;
			}
			for (var i = 0, len = childs.length; i < len; i++) {
				childs[i].render(wdt);
			}
		}
	};
	function GroupBlock() {}
	var proto = new Block();
	GroupBlock.prototype = proto;
	proto.searchPieces = function() {
		var childs = this._childs;
		if (!childs) {return;}
		for (var i = 0, len = childs.length; i < len; i++) {
			childs[i].searchPieces();
		}
	}
	function ComBlock() {
		this._childs = [];
	}
	var proto = new GroupBlock();
	ComBlock.prototype = proto;
	proto.process = function(blocks, point, len, fblock) {
		this._childs.push(fblock);
		this._node = fblock._node;
		fblock._node = Nodes["li"];
		point++;
		var block, next;
		while (point < len) {
			block = blocks[point]
			if (fblock.level == 1 && block._spaceNum == 3) {
				block.level = 2;
				var comBlock = new ComBlock();
				next = comBlock.process(blocks, point, len, block);
				if (next != point) {
					this._childs.push(comBlock);
					point = next;
					continue;
				}
			}
			if (block._node != this._node) {
				return point;
			}
			block._node = Nodes["li"];
			this._childs.push(block);
			point++;
		}
		return point;
	}
	function TableBlock() {
		this._childs = [];
	}
	var proto = new GroupBlock();
	TableBlock.prototype = proto;
	proto.process = function(blocks, point, len, cbBlocks) {
		var originPoint = point;
		var ctlBlock = blocks[point];
		var num = ctlBlock.table.length;
		var headBlock = cbBlocks[cbBlocks.length - 1];
		if (!headBlock || headBlock._node[0] != "p") {
			return originPoint;
		}
		var ths = headBlock._line.split("|");
		if (ths.length != num) {
			return originPoint;
		}
		this._node = ctlBlock._node;
		this.headBlock = headBlock;
		cbBlocks.pop();
		this.ctlBlock = ctlBlock;

		var trBlock = new TableBlock();
		trBlock._node = Nodes["tr"];
		var pBlock;
		for (var i = 0; i < num; i++) {
			pBlock = new Block();
			pBlock._node = Nodes["th"];
			pBlock._line = ths[i];
			pBlock.startIdx = 0;
			pBlock.endIdx = pBlock._line.length;
			trBlock._childs.push(pBlock);
		}
		var capBlock = cbBlocks[cbBlocks.length - 1];
		if (capBlock && capBlock._node[0] == "p") {
			var m = /^\s*\|(.+)\|\s*$/.exec(capBlock._line);
			if (m && m[1].length > 0) {
				pBlock = new Block();
				pBlock._node = Nodes["caption"];
				pBlock._line = m[1];
				pBlock.startIdx = 0;
				pBlock.endIdx = pBlock._line.length;
				this._childs.push(pBlock);
				this.capBlock = capBlock;
				cbBlocks.pop();
			}
		}
		var theadBlock = new TableBlock();
		theadBlock._node = Nodes["thead"];
		theadBlock._childs.push(trBlock);
		this._childs.push(theadBlock);
		var block;
		point++;
		var tbodyBlock = new TableBlock();
		tbodyBlock._node = Nodes["tbody"];
		while (point < len) {
			block = blocks[point];
			if (block._node[0] == "p") {
				var tds = block._line.split("|");
				if (tds.length >= 2) {
					this.bodyBlocks = this.bodyBlocks || [];
					this.bodyBlocks.push(block);
					trBlock = new TableBlock();
					trBlock._node = Nodes["tr"];
					for (var i = 0; i < tds.length; i++) {
						pBlock = new Block();
						pBlock._node = Nodes["td"];
						pBlock._line = tds[i];
						pBlock.startIdx = 0;
						pBlock.endIdx = pBlock._line.length;
						trBlock._childs.push(pBlock);
					}
					tbodyBlock._childs.push(trBlock);
				} else {
					break;
				}
			} else {
				break;
			}
			point++;
		}
		this._childs.push(tbodyBlock);
		return point;
	}

	function combineBlocks(blocks) {
		var cbBlocks = [];
		var point = 0;
		var len = blocks.length;
		var block, name, next;
		while (point < len) {
			block = blocks[point];
			name = block._node[0];
			if (name == "ul" || name == "ol") {
				var comBlock = new ComBlock();
				block.level = 1;
				next = comBlock.process(blocks, point, len, block);
				if (next != point) {
					cbBlocks.push(comBlock);
					point = next;
					continue;
				} else {
					block._node = Nodes["p"];
				}
			} else {
				if (name == "table") {
					var tableBlock = new TableBlock();
					next = tableBlock.process(blocks, point, len, cbBlocks);
					if (next != point) {
						cbBlocks.push(tableBlock);
						point = next;
						continue;
					} else {
						block._node = Nodes["p"];
					}
				}
			}
			cbBlocks.push(block);
			point++;
		}
		for (var i = 0, len = cbBlocks.length; i < len; i++) {
			block = cbBlocks[i];
			if (block._node == Nodes["p"]) {
				block._node = Nodes["div"];
			}
		}
		return cbBlocks;
	}
	
	function processBlock(txt) {
		var blocks = [];
		var lines = txt.split("\n");
		var point = 0;
		var len = lines.length
		var line, block, next;
		while (point < len) {
			block = new Block();
			next = block.process(lines, point);
			blocks.push(block);
			if (next == point) {
				break;
			}
			point = next;
		}
		blocks = combineBlocks(blocks)
		for (var i = 0; i < blocks.length; i++) {
			blocks[i].searchPieces();
		}
		return blocks;
	}

	function setWidgetsProps(wdt, props) {
		wdt.set(props);
		if (wdt._childs) {
			for (var i = 0, len = wdt._childs.length; i < len; i++) {
				setWidgetsProps(wdt._childs[i], props);
			}
		}
	}
	function showDom(blocks, props) {
		var _root = widget("div");
		for (var i = 0; i < blocks.length; i++) {
			blocks[i].render(_root);
		}
		// props = props || {id: "fmd"};
		setWidgetsProps(_root, props);
		return _root.goodecho();
	}
	return function(text, props) {
		var blocks = processBlock(text);
		return showDom(blocks, props);
	}
})();