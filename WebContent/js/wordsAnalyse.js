define(["wordsCodes","eleUtil"],function(wordsCodes,eleUtil){
	var wordsAnalyse = {};
	//存放源代码，每一项表示一行
	wordsAnalyse.sourceCodeLines = [];
	//识别出的保留字
	//wordsAnalyse.distinguishedReserved = new Map();
	//识别出的字符分类Map
	//wordsAnalyse.distinguishedWordsMap = new Map();
	wordsAnalyse.distinguishedWordsAry = [];
	//识别出的错误Map
	wordsAnalyse.errorMesAry = [];
	/**
	 * 词法分析函数，主函数
	 */
	wordsAnalyse.analyse = function(sourceCodeLines){
		clearTable();
		//处理
		handResource(sourceCodeLines);
		//处理完成后处理Token表格
		createTokenTable();
		//处理符号表格
		createSymbolTable();
		//处理错误表格
		displayEroMes();
		//.....
		console.log(wordsAnalyse.errorMesAry);
	}
	
	/**
	 * 处理函数
	 */
	function handResource(sourceCodeLines){
		wordsAnalyse.sourceCodeLines = sourceCodeLines;
		//循环获取每一行
		for(let j = 0; j < sourceCodeLines.length; j ++){
			//打印当前行
			//console.log("当前分析第" + i +"行：",sourceCodeLines[i]);
			let currentLineStr = sourceCodeLines[j];
			let parsedStr = currentLineStr.replace(/\s+/g, "");
			//是否为空行
			if(parsedStr){
				let currentLineStrSize = currentLineStr.length;
				let count = 0;
				//去除开始空格
				while(currentLineStr.charAt(count) == ' ' || currentLineStr.charAt(count) == '	'){
					count ++;
				}
				//分析每一行
				for(let i = count; i < currentLineStrSize;){
					//实数
					if(isDigital(currentLineStr.charAt(i))){
						i = distinguishDigital(j,i,currentLineStr,currentLineStrSize);
					}
					//识别字符串常量和字符常量
					else if(currentLineStr.charAt(i) == '"' || currentLineStr.charAt(i) == "'"){
						i = distinguishConstStr(j,i,currentLineStr,currentLineStrSize);
					}
					//识别标识符
					else if(isPartOfIdentifier(currentLineStr.charAt(i))){
						i = distinguishIdentifier(j,i,currentLineStr,currentLineStrSize);
					}
					//边界符
					else if(isBoundaryChar(currentLineStr.charAt(i))){
						i = distinguishBoundaryChar(j,i,currentLineStr,currentLineStrSize);
					}
					//识别运算符
					else if(isBeginOperator(currentLineStr.charAt(i))){
						var t = distinguishOperator(j,i,currentLineStr,currentLineStrSize);
						var s = new Number(t).toLocaleString();
						if(s == "NaN"){
							j = new Number(t.substr(0,t.lastIndexOf(",")));
							break;
						}
						else{
							i = new Number(t);
						}
					}
					else {
						i++;
					}
				}
			}
		}
	}
	
	/**
	 * 识别数字
	 */
	function distinguishDigital(rowNo,colNo,currentLineStr,currentLineStrSize){
		let cwd = "";
		cwd += currentLineStr.charAt(colNo);
		colNo++;
		
		while((colNo <= (currentLineStrSize - 1)) && isPartOfDigital(currentLineStr.charAt(colNo)) && currentLineStr.charAt(colNo) != ' '){
			cwd +=  currentLineStr.charAt(colNo);
			colNo ++;
		}
		//如果数值紧接的是组成标识符的部分，报错处理
//		if(isPartOfIdentifier(currentLineStr.charAt(colNo - 1))){
//			
//		}
//		else{}
		//识别完成，放入数字
		var obj = {text:cwd,rowNo:rowNo+1,colNo:colNo+1,code:101};
		wordsAnalyse.distinguishedWordsAry.push(obj);
		return colNo;
	}
	
	/**
	 * 识别常量字符
	 */
	function distinguishConstStr(rowNo,colNo,currentLineStr,currentLineStrSize){
		let cwd = "";
		//识别常量字符串
		if(currentLineStr.charAt(colNo) == '"'){
			colNo++;
			while((colNo <= (currentLineStrSize - 1)) && currentLineStr.charAt(colNo) != '"'){
				cwd += currentLineStr.charAt(colNo);
				colNo++;
			}
			colNo ++;//这里++是因为后面还有一个"没有识别
			var obj = {text:cwd,rowNo:rowNo+1,colNo:colNo+1,code:103};
			wordsAnalyse.distinguishedWordsAry.push(obj);
			return colNo;
		}
		//识别常量字符
		else{
			colNo++;
			while((colNo <= (currentLineStrSize - 1)) && currentLineStr.charAt(colNo) != "'"){
				cwd += currentLineStr.charAt(colNo);
				colNo++;
			}
			if(cwd.length != 1){
				wordsAnalyse.errorMesAry.push("第" + (rowNo + 1) + "行第" + (colNo+1) + "列"+"请检常量字符的正确性");
			}
			else{
				colNo ++;//这里++是因为后面还有一个'没有识别
				var obj = {text:cwd,rowNo:rowNo+1,colNo:colNo+1,code:105};
				wordsAnalyse.distinguishedWordsAry.push(obj);
				return colNo;
			}
		}
	}
	
	/**
	 * 识别标识符
	 */
	function distinguishIdentifier(rowNo,colNo,currentLineStr,currentLineStrSize){
		let cwd = "";
		cwd += currentLineStr.charAt(colNo);
		colNo++;
		
		while((colNo <= (currentLineStrSize - 1)) && (isPartOfIdentifier(currentLineStr.charAt(colNo)) || isDigital(currentLineStr.charAt(colNo))) && currentLineStr.charAt(colNo) != ' '){
			cwd += currentLineStr.charAt(colNo);
			colNo ++;
		}
		//判断当前识别出来的单词是否为保留字
		if(isSeservedWord(cwd)){
			var obj = {text:cwd,rowNo:rowNo+1,colNo:colNo+1,code:wordsCodes.keywords.get(cwd)};
			wordsAnalyse.distinguishedWordsAry.push(obj);
		}else {
			var obj = {text:cwd,rowNo:rowNo+1,colNo:colNo+1,code:wordsCodes.identifier.get("identifier")};
			wordsAnalyse.distinguishedWordsAry.push(obj);
		}
		return colNo;
	}
	
	/**
	 * 识别操作符和注释
	 */
	function distinguishOperator(rowNo,colNo,currentLineStr,currentLineStrSize){
		let cwd = "";
		cwd += currentLineStr.charAt(colNo);
		colNo++;
		let hasEro = false;
		if(cwd == '/'){
			var next = currentLineStr.charAt(colNo);
			//直接读取下一行数据，这一行忽略
			if(next == '/'){
				return ++currentLineStr.length;
			}
			//多行注释
			else if(next == '*'){
				//使用一个flag来记录/出现的次数
				var flag = 0;
				//记录注释开始的下标
				var rowIndex = rowNo;
				var colIndex = colNo-1;
				var isClose = false;
				while(rowNo < wordsAnalyse.sourceCodeLines.length){
					currentLineStr = wordsAnalyse.sourceCodeLines[rowNo];
					colNo = 0;
					//跳开空格
					while(colNo < currentLineStr.length && (currentLineStr.charAt(colNo) == ' ' || currentLineStr.charAt(colNo) == '	')){
						colNo ++;
					}
					//识别一行
					while(flag != 2 && colNo < currentLineStr.length){
						if(currentLineStr.charAt(colNo) == '/'){
							flag ++;
							//记录一下注释的下标
						}
						colNo ++;
						continue;
					}
					//如果没有结尾
					if(flag != 2){
						rowNo++;
						continue;
					}
					else if(flag == 2 && currentLineStr.charAt(colNo - 2) == '*'){
						isClose = true;
						break;
					}
					else{
						//表示多行注释之间可能有/
						flag --;
						rowNo++
						continue;
					}
				}
				//识别完成，看是否有错误
				if(!isClose){
					wordsAnalyse.errorMesAry.push("第" + (rowIndex+1) + "行第" + (colIndex+1) + "列请检查注释的正确性");
				}
				return rowNo + ",";
			}
		}
		//操作符
		while((colNo <= (currentLineStrSize - 1)) && currentLineStr.charAt(colNo) != ' ' && isPartOfOperator(currentLineStr.charAt(colNo))){
			cwd += currentLineStr.charAt(colNo);
			//如果当前单操作符组成的操作符不合法，做报错处理
			if(!wordsCodes.operators.has(cwd)){
				hasEro = true;
			}
			colNo ++;
		}
		if(hasEro){
			wordsAnalyse.errorMesAry.push("第" + (rowNo+1) + "行第" + (colNo+1) + "列请检查运算符的正确性");
		}
		else{
			var obj = {text:cwd,rowNo:rowNo+1,colNo:colNo+1,code:wordsCodes.operators.get(cwd)};
			wordsAnalyse.distinguishedWordsAry.push(obj);
		}
		return colNo;
	}
	
	/**
	 * 识别边界符
	 */
	function distinguishBoundaryChar(rowNo,colNo,currentLineStr,currentLineStrSize){
		var cht = currentLineStr.charAt(colNo);
		var obj = {text:cht,rowNo:rowNo+1,colNo:colNo+1,code:wordsCodes.boundarys.get(cht)};
		wordsAnalyse.distinguishedWordsAry.push(obj);
		colNo ++;
		return colNo;
	}
	
	/**
	 * 生成token表
	 */
	function createTokenTable(){
		eleUtil.insert(document.getElementById("tokentable"),wordsAnalyse.distinguishedWordsAry);
	}
	
	/**
	 * 生成符号表
	 */
	function createSymbolTable(){
		var tempMap = new Map();
		var tempAry = [];
		for(let i = 0; i < wordsAnalyse.distinguishedWordsAry.length; i ++){
			tempMap.set(wordsAnalyse.distinguishedWordsAry[i].text,wordsAnalyse.distinguishedWordsAry[i]);
		}
		for(let value of tempMap.values()){
			if(isIdentifierOrDigital(value)){
				if(value["code"] == 130){
					type = "标识符";
				}
				if(value["code"] == 101){
					type = "常整数";
				}
				if(value["code"] == 103){
					type = "字符常量";
				}
				if(value["code"] == 104){
					type = "布尔常量";
				}
				if(value["code"] == 105){
					type = "字符串常量";
				}
				var tmoj = {text:value["text"],length:value["text"].length,type:type,code:value["code"]}
				tempAry.push(tmoj);
			}
		}
		eleUtil.insert(document.getElementById("symboltable"),tempAry);
	}
	
	/**
	 * 显示错误信息
	 */
	function displayEroMes(){
		eleUtil.displayEroMes(document.getElementById("erotable"),wordsAnalyse.errorMesAry);
	}
	
	/**
	 * 清除表格
	 */
	function clearTable(){
		wordsAnalyse.distinguishedWordsAry = [];
		wordsAnalyse.errorMesAry = [];
		document.getElementById("tokentable").innerHTML = "";
		document.getElementById("symboltable").innerHTML = "";
	}
	
	//验证字符串是否是数字
	function checkNumber(num) {
	  var reg = /^[0-9]+.?[0-9]*$/;
	  if (reg.test(num)) {
	    return true;
	  }
	  return false;
	}
	
	//验证是否为科学数字
	function checkIfKexueJiShu(num){
		var reg = /^((\\d+.?\\d+)[Ee]{1}(\\d+))$/;
		if(reg.test(num)){
			return true;
		}
		return false;
	}
	
	/**
	 * 是否为标识符和数字
	 */
	function isIdentifierOrDigital(obj){
		if(obj.code == 130 || obj.code == 101 || obj.code == 103 || obj.code == 104 || obj.code == 105){
			return true;
		}
		return false;
	}
	
	/**
	 * 判断是否为保留字（关键字）
	 */
	function isSeservedWord(word){
		//是否为保留字中的一员
		return wordsCodes.keywords.has(word);
	}
	
	/**
	 * 是否是标识符的一部分，数字单独考虑，因为数字不能作为标识符的开头
	 */
	function isPartOfIdentifier(ch){
		return (
				(ch >= 'a' && ch <= 'z') || 
				(ch >= 'A' && ch <= 'Z') ||
				ch== '$' ||
				ch== '_' );
	}
	
	/**
	 * 是否是数字的一部分
	 */
	function isPartOfDigital(ch){
		return (
				(ch >= '0' && ch <= '9') || 
				ch == '.' || 
				ch == "E" || 
				ch == "e" );
	}
	
	/**
	 * 判断是否为数字
	 */
	function isDigital(ch){
		return (ch>= '0' && ch<= '9');
	}
	
	/**
	 * 判断是否为界符
	 */
	function isBoundaryChar(ch){
		return (
				ch == ';' || 
				ch == '‘' || 
				ch == '’' || 
				ch == '“' || 
				ch == '”' || 
				ch == '(' || 
				ch == ')' || 
				ch == '{' || 
				ch == '}' ||
				ch == ';');
	}
	
	/**
	 * 是否为操作符的开始符
	 */
	function isBeginOperator(ch){
		return (
				ch == '=' ||
				ch == '/' ||
				ch == '>' ||
				ch == '<' ||
				ch == '+' || 
				ch == '-' || 
				ch == '*' || 
				ch == '%' ||
				ch == '.' ||
				ch == '&' ||
				ch == '|' ||
				ch == '!' ||
				ch == '~' ||
				ch == '^');
	}
	/**
	 * 是否为操作符的一部分
	 */
	function isPartOfOperator(ch){
		return (
				ch == '=' ||
				ch == '/' ||
				ch == '>' ||
				ch == '<' ||
				ch == '+' || 
				ch == '-' || 
				ch == '*' || 
				ch == '%' ||
				ch == '.' ||
				ch == '&' ||
				ch == '|' ||
				ch == '!' ||
				ch == '~' ||
				ch == '^' ||
				ch == '/' ||
				ch == '?' ||
				ch == ':');
	}
	
	return wordsAnalyse;
});