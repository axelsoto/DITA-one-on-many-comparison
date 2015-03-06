var LCSColumnIndex = 0;
var sentenceTopic1ColumnIndex = 1;
var sentenceTopic2ColumnIndex = 2;
var sentenceLCSColumnIndex = 3;
var smallFontSize = 7;
var pairComparisons = [];
var lastHighlighted = -1;
var nSentences = [];
var currentNTopics = 2;

var minWordsPerSentence = 3;

var maxBarLength = 160;
var barsHeight = 10;

var sentenceLCS;



//change this if we are splitting topics by tags
var granularitySentence =false;

//Preprocessing variables
var topicNames = [];
var topicTypes = [];
var topicIds = [];
var topicFiles = [];
var topicMetrics = [];
var firstTopicFirst = [];
var filesSuccessfullyLoaded = 0;
var dictionaryTopic = {};

topicSmallList = [];

function findWordsInCommon(string1,string2){
	var list1 = string1.slice(1,string1.length-1).split(",");
	var list2 = string2.slice(1,string2.length-1).split(",");
	var wic = []
	
	list1.forEach(function(word){
		if (list2.indexOf(word)>=0){
			wic.push(word);
		}
	});
	return wic;
}

function readTopPairComparisons(directory, topicNames, topicIds, nTopics){
	var fileComparison;
	for (var q=1;q<=nTopics;q++){
		if (topicIds[q] > topicIds[0]){
			fileComparison = topicNames[q] + '; ' + topicNames[0]; 
			firstTopicFirst.push(false);
		}
		else{
			fileComparison = topicNames[0] + '; ' + topicNames[q];
			firstTopicFirst.push(true);
		}
		readTopPairComp(directory,fileComparison,q,0,nTopics);
	}
}

function readTopPairComp(directory, pairComparisonFilePrefix,indTopic,trials,numbTopics){
	d3.text(directory + pairComparisonFilePrefix + "?" + Math.floor(Math.random() * 1000), function(error,datasetText) {
		if ((error)&&(trials<=1)){
			firstTopicFirst[indTopic-1]=!firstTopicFirst[indTopic-1];
			readTopPairComp(directory, pairComparisonFilePrefix.split("; ")[1] + "; " + pairComparisonFilePrefix.split("; ")[0],indTopic,trials+1,numbTopics);
		}
		else{
			pairComparisons[indTopic] = d3.tsv.parseRows(datasetText);
			var aux=0;
			
			//This is due to a mistake in the files that come with one blank column for gtm
			if (pairComparisons[indTopic][0][LCSColumnIndex]==""){
				LCSColumnIndex = LCSColumnIndex + 1
				sentenceTopic1ColumnIndex = sentenceTopic1ColumnIndex + 1;
				sentenceTopic2ColumnIndex = sentenceTopic2ColumnIndex + 1;
				sentenceLCSColumnIndex = sentenceLCSColumnIndex + 1;
			}
			pairComparisons[indTopic].forEach(function(elem){
				if ((elem[sentenceTopic1ColumnIndex].split(" ").length >= minWordsPerSentence) && (elem[sentenceTopic2ColumnIndex].split(" ").length >= minWordsPerSentence)){
					aux = d3.max([aux,parseFloat(elem[LCSColumnIndex])]);
				}
			})
			topicMetrics[indTopic-1] = aux;
			filesSuccessfullyLoaded++;
			if (filesSuccessfullyLoaded==(numbTopics)){
				main();
				loadContextGraph();
			}
		}
	});
}

String.prototype.trim = function() {
return this.replace(/^\s*|\s*$/g, "")
}
String.prototype.ltrim = function() {
return this.replace(/^\s*/g, "")
}
String.prototype.rtrim = function() {
return this.replace(/\s*$/g, "")
}


function main(){
var htmlElement = "div";
var htmlClass = "sentence";

	nTopicsListener(d3.select("#nTopics"));
	
	d3.text(topicFiles[0], function(datasetText){
		var topicBig = datasetText;
		d3.text(topicFiles[1], function(error,datasetText){
			var topicSmall1 = datasetText;
			d3.text(topicFiles[2], function(error,datasetText){
				var topicSmall2 = datasetText;
				
				if (granularitySentence){
					//sentence separator
					topicBigList = topicBig.split('.');
					topicSmallList[1] = topicSmall1.split('.');
					topicSmallList[2] = topicSmall2.split('.');
				}
				else{
					//paragraph separator
					var reParagSep = /<p>|<fig>|<table>|<ul>|<shortdesc>|<\/p>|<\/fig>|<\/table>|<\/ul>|<\/shortdesc>/;
					
					topicBigList = topicBig.split(reParagSep);
					topicSmallList[1] = topicSmall1.split(reParagSep);
					topicSmallList[2] = topicSmall2.split(reParagSep);
					
					//var reParagSepTags = /(<p>|<fig>|<tabl>|<ul>|<shortdesc>|<\/p>|<\/fig>|<\/table>|<\/ul>|<\/shortdesc>)/;
					//topicBigListWTags = removeEmptyElements(topicBig.split(reParagSep));
					//topicSmall1ListWTags = removeEmptyElements(topicSmall1.split(reParagSep));
					//topicSmall2ListWTags = removeEmptyElements(topicSmall2.split(reParagSep));
				}
				
				topicBigList = removeEmptyElements(topicBigList);
				topicSmallList[1] = removeEmptyElements(topicSmallList[1]);
				topicSmallList[2] = removeEmptyElements(topicSmallList[2]);
				
				nSentences[1] = topicSmallList[1].length;
				nSentences[2] = topicSmallList[2].length;

/*wrapElementTagToList(topicBigList, "code", "codeClass" + "_t0_");
wrapElementTagToList(topicSmallList[1], "code", "codeClass" + "_t1_");
wrapElementTagToList(topicSmallList[2], "code", "codeClass" + "_t2_");*/

				wrapElementTagToList(topicBigList,htmlElement,htmlClass + "_t0_");
				wrapElementTagToList(topicSmallList[1],htmlElement,htmlClass + "_t1_");
				wrapElementTagToList(topicSmallList[2],htmlElement,htmlClass + "_t2_");
				
				addListToPage(topicBigList,d3.select("#topic1text").select("div"));
				addListToPage(topicSmallList[1],d3.select("#smalltopic1text").select("div"));
				addListToPage(topicSmallList[2],d3.select("#smalltopic2text").select("div"));
				
				modifyLegendNames(d3.select("#topic1text").select("legend"),"Topic " + topicIds[0] + ": " + topicNames[0]);
				modifyLegendNames(d3.select("#smalltopic1text").select("legend"),"Topic " + topicIds[1] + ": " + topicNames[1]);
				modifyLegendNames(d3.select("#smalltopic2text").select("legend"),"Topic " + topicIds[2] + ": " + topicNames[2]);
				
				addEventToElement(d3.select("#topic1text").select("div"),htmlElement);
				
				drawHistogramsBigTopic();
				
				addTopicMetrics();
				
				
				
			});
		});
	});
}

function addTopicMetrics(){
	d3.selectAll("#methodMetrics")
	.text(function(d,i){
		return "Topic Similarity: " + topicMetrics[i].toFixed(3);//this should be read or computed from a file
	});
}

function updateParagraphMetrics(paragraphMetric,smallTopicIndex,bigTopicSentenceIndex,smallTopicSentenceIndex){
//smallTopicIndex and bigTopicIndex can be used to indicate what it is compared to what
	d3.selectAll("#paragraphMetric")
	.text(function(d,i){
		if (i == smallTopicIndex){
			return "Paragraph Similarity: " + (paragraphMetric==0? "0": paragraphMetric.toFixed(3));//this should be read or computed from a file
		}
		else{
			return d3.select(this).text();
		}
	});
}

function drawHistogramsBigTopic(){
	var regulExp = /<.+?>(.+?)<\/.+?>/
	var sentenceBigTopic, sentenceSmallTopic;
	sentenceLCS = [];
	
	mapping1to2 = {}; //This could be used by the hovering algorithms to avoid calculating everything on each hover. Not used
	var nSentencesTopic1 = topicBigList.length;
	
	for (q=1;q<=parseFloat(currentNTopics);q++){
		d3.range(nSentencesTopic1).forEach(function(i){
			if (q==1){
				sentenceLCS[i]=0;
			}
			maxSimValue = 0;
			maxSimValueRow = -1;
			
			//Check whether the topic on the top is on the left or on the right of the text file with the pairwise comparisons
			if (firstTopicFirst[q-1]){//This is because the files were prepared in an odd manner
				//If looking into extracted words
				sentenceBigTopic = pairComparisons[q][i*nSentences[q] + 0][sentenceTopic1ColumnIndex].split(" ");
				//If looking into real words
				/*
				if (regulExp.test(topicBigList[i])){
					sentenceBigTopic = regulExp.exec(topicBigList[i])[1];
				}*/
				
				d3.range(nSentences[q]).forEach(function(elem){
					//If looking into extracted words
					sentenceSmallTopic = pairComparisons[q][i*nSentences[q] + elem][sentenceTopic2ColumnIndex].split(" ");
					//If looking into real words
					/*
					if (regulExp.test(topicSmallList[q][elem])){
						sentenceSmallTopic = regulExp.exec(topicSmallList[q][elem])[1];
					}*/
					if ((sentenceBigTopic.length >= minWordsPerSentence) && (sentenceSmallTopic.length >= minWordsPerSentence)){
						if (maxSimValue < parseFloat(pairComparisons[q][i*nSentences[q] + elem][LCSColumnIndex])){
							maxSimValue = parseFloat(pairComparisons[q][i*nSentences[q] + elem][LCSColumnIndex]);
							maxSimValueRow = elem;
						}
					}
				});
			}
			else{
				//If looking into extracted words
				sentenceBigTopic = pairComparisons[q][i+nSentencesTopic1 * 0][sentenceTopic1ColumnIndex].split(" ");
				//If looking into real words
				/*
				if (regulExp.test(topicBigList[i])){
					sentenceBigTopic = regulExp.exec(topicBigList[i])[1];
				}*/
				
				d3.range(nSentences[q]).forEach(function(elem){
					//If looking into extracted words
					sentenceSmallTopic = pairComparisons[q][i+nSentencesTopic1 * elem][sentenceTopic2ColumnIndex].split(" ");
					//If looking into real words
					/*
					if (regulExp.test(topicSmallList[q][elem])){
						sentenceSmallTopic = regulExp.exec(topicSmallList[q][elem])[1];
					}*/
					if ((sentenceBigTopic.length >= minWordsPerSentence) && (sentenceSmallTopic.length >= minWordsPerSentence)){
						if (maxSimValue < parseFloat(pairComparisons[q][i+nSentencesTopic1 * elem][LCSColumnIndex])){
							maxSimValue = parseFloat(pairComparisons[q][i+nSentencesTopic1 * elem][LCSColumnIndex]);
							maxSimValueRow = elem;
						}
					}
				});
			}
			//Average
			//sentenceLCS[i] = sentenceLCS[i] + maxSimValue/currentNTopics;
			//Max
			sentenceLCS[i] = d3.max([sentenceLCS[i] , maxSimValue]);
		});
	}
	scaleBars = d3.scale.linear()
					.domain([0,1])
					.range([3,maxBarLength]);
					
	scaleOpacity = d3.scale.linear()
					.domain([0,1])
					.range([0.1,1]);
	
	var barsGroup1 = d3.select("#topic1barsColumn").select("svg")
					.attr("x",0)
					.attr("y",0)
					.attr("height",$("#topic1text").height()).selectAll(".barsTopic1").data([1]);
					
	barsGroup1.enter().append("g")
					.attr("class","barsTopic1");
					
	var barsGroup = d3.select("#topic1barsColumn").select("svg").select(".barsTopic1");
	
	
	barsGroupToAdd = barsGroup.selectAll(".barTopic1").data(sentenceLCS)
					.attr("opacity",function(d){
						return scaleOpacity(d);
					})
					.attr("width", function(d){
						return scaleBars(d);
					});
	
	
	barsGroupToAdd.enter().append("rect")
	.attr("fill","green")
	.attr("class","barTopic1")
	.attr("opacity",function(d){
		return scaleOpacity(d);
	})
	.attr("x",0)
	.attr("y",function(d,i){
		return $(".sentence_t0_"+i).position().top - $("table #topic1barsColumn svg").offset().top + ($("table #topic1barsColumn").offset().top - $(".upperTable").offset().top);;
	})
	.attr("height", barsHeight)
	.attr("width", function(d){
		return scaleBars(d);
	});
	
	var scaleGroup = d3.select("#topic1barsColumn").select("svg").selectAll(".scaleGroup").data([1]);
	
	scaleGroupAppended = scaleGroup.enter().append("g").attr("class","scaleGroup");
	
	scaleGroupAppended.append("line")
	.attr("x1",0)
	.attr("y1",12)
	.attr("x2",scaleBars(1))
	.attr("y2",12)
	.style("stroke","darkgrey");
	
	/*scaleGroupAppended.append("line")
	.attr("x1",0)
	.attr("y1",10)
	.attr("x2",0)
	.attr("y2",15)
	.style("stroke","darkgrey");*/
	
	scaleGroupAppended.append("line")
	.attr("x1",scaleBars(1))
	.attr("y1",12)
	.attr("x2",scaleBars(1))
	.attr("y2",17)
	.style("stroke","darkgrey");
	
	scaleGroupAppended.append("text")
	.attr("x",scaleBars(1))
	.attr("dx",3)
	.attr("y",15)
	.attr("dy",16)
	.attr("text-anchor","end")
	.text("1")
	.style("fill","darkgrey");
	
	scaleGroupAppended.append("text")
	.attr("x",scaleBars(0))
	.attr("dx",0)
	.attr("y",0)
	.attr("dy",9)
	.attr("text-anchor","start")
	.style("font-size","11")
	.text("Max. paragraph similarity")
	.style("fill","darkgrey");
}

function addEventToElement(selection,htmlElement){
	selection.selectAll(htmlElement)
	.style("cursor","pointer")
	.on("mouseover",overSentence)
	.on("mouseout",outSentence);
}

function overSentence(d,i){
//console.log(this);
//console.log(i);
	
	var nSentencesTopic1 = topicBigList.length;
	
	
	
	if (lastHighlighted!=i){
	
		chunkText = d3.select(this).text();
			
		//$(".sentence_t1_"+lastHighlighted).unhighlight();
		//$(".sentence_t2_"+lastHighlightedOpposite).unhighlight(); It is better to unhighlight all in the other side
		$("#topic1text div div").unhighlight();
	
		for (q=1;q<=parseFloat(currentNTopics);q++){
			$("#smalltopic"+q+"text div div").unhighlight({className:"smallTopicsHighLighted"});
			$("#smalltopic"+q+"text div div").unhighlight({className:"biggerFonts"});
			
			rowsToLookAt = [];
			maxSimValue = 0;
			maxSimValueRow = -1;
			//Check whether the topic on the top is on the left or on the right of the text file with the pairwise comparisons
			if (firstTopicFirst[q-1]){//This is because the files were prepared in an odd manner
				//If looking into extracted words
				sentenceBigTopic = pairComparisons[q][i*nSentences[q] + 0][sentenceTopic1ColumnIndex].split(" ");
				//If looking into real words
				/*
				if (regulExp.test(topicBigList[i])){
					sentenceBigTopic = regulExp.exec(topicBigList[i])[1];
				}*/
				
				
				d3.range(nSentences[q]).forEach(function(elem){
					//If looking into extracted words
					sentenceSmallTopic = pairComparisons[q][i*nSentences[q] + elem][sentenceTopic2ColumnIndex].split(" ");
					//If looking into real words
					/*
					if (regulExp.test(topicSmallList[q][elem])){
						sentenceSmallTopic = regulExp.exec(topicSmallList[q][elem])[1];
					}*/
					
					rowsToLookAt.push(i*nSentences[q] + elem);
					if ((sentenceBigTopic.length >= minWordsPerSentence) && (sentenceSmallTopic.length >= minWordsPerSentence)){
						if (maxSimValue < parseFloat(pairComparisons[q][i*nSentences[q] + elem][LCSColumnIndex])){
							maxSimValue = parseFloat(pairComparisons[q][i*nSentences[q] + elem][LCSColumnIndex]);
							maxSimValueRow = elem;
						}
					}
				});
				if (maxSimValueRow>=0){
					wordsToHighlightString = pairComparisons[q][rowsToLookAt[maxSimValueRow]][sentenceTopic1ColumnIndex];
				}
				else{
					wordsToHighlightString = pairComparisons[q][rowsToLookAt[0]][sentenceTopic1ColumnIndex];
				}
			}
			else{
				//If looking into extracted words
				sentenceBigTopic = pairComparisons[q][i+nSentencesTopic1 * 0][sentenceTopic1ColumnIndex].split(" ");
				//If looking into real words
				/*
				if (regulExp.test(topicBigList[i])){
					sentenceBigTopic = regulExp.exec(topicBigList[i])[1];
				}*/
				
				d3.range(nSentences[q]).forEach(function(elem){
					//If looking into extracted words
					sentenceSmallTopic = pairComparisons[q][i+nSentencesTopic1 * elem][sentenceTopic2ColumnIndex].split(" ");
					//If looking into real words
					/*
					if (regulExp.test(topicSmallList[q][elem])){
						sentenceSmallTopic = regulExp.exec(topicSmallList[q][elem])[1];
					}*/
					
					rowsToLookAt.push(i+nSentencesTopic1 * elem);
					if ((sentenceBigTopic.length >= minWordsPerSentence) && (sentenceSmallTopic.length >= minWordsPerSentence)){
						if (maxSimValue < parseFloat(pairComparisons[q][i+nSentencesTopic1 * elem][LCSColumnIndex])){
							maxSimValue = parseFloat(pairComparisons[q][i+nSentencesTopic1 * elem][LCSColumnIndex]);
							maxSimValueRow = elem;
						}
					}
				});
				if (maxSimValueRow>=0){
					wordsToHighlightString = pairComparisons[q][rowsToLookAt[maxSimValueRow]][sentenceTopic2ColumnIndex];
				}
				else{
					wordsToHighlightString = pairComparisons[q][rowsToLookAt[0]][sentenceTopic2ColumnIndex];
				}
			}
			
			wordsToHighlightString = wordsToHighlightString.slice(1,wordsToHighlightString.length-1);//remove []
			wordsToHighlightList = wordsToHighlightString.split(",");//separate words
			
			$(".sentence_t0_" + i).highlight(wordsToHighlightList);
			//$(".sentence_t2_" + maxSimValueRow).highlight(wordsToHighlightList);//To show the same on the other side
			
			if (maxSimValueRow>=0){
				//Check if there is an extra column for words in common
				if (sentenceLCSColumnIndex < pairComparisons[q][rowsToLookAt[maxSimValueRow]].length){
					wordsToHighlightString2 = pairComparisons[q][rowsToLookAt[maxSimValueRow]][sentenceLCSColumnIndex];
					wordsToHighlightString2 = wordsToHighlightString2.slice(1,wordsToHighlightString2.length-1);//remove []
					wordsToHighlightList2 = wordsToHighlightString2.split(",");//separate words
				}
				else{
					wordsToHighlightList2 = findWordsInCommon(pairComparisons[q][rowsToLookAt[maxSimValueRow]][sentenceTopic1ColumnIndex], pairComparisons[q][rowsToLookAt[maxSimValueRow]][sentenceTopic2ColumnIndex]);
				}
				
				//$(".sentence_t" + q + "_" + maxSimValueRow).highlight($(".sentence_t" + q + "_" + maxSimValueRow).text().split(/\s+/),{className:"biggerFonts"});
				$(".sentence_t" + q + "_" + maxSimValueRow).highlight($(".sentence_t" + q + "_" + maxSimValueRow).text(),{className:"biggerFonts"});
				$(".sentence_t" + q + "_" + maxSimValueRow).highlight(wordsToHighlightList2,{className:"smallTopicsHighLighted"});//To show the same on the other side
			}

			modifySentenceMetric(sentenceLCS[i],0,i,maxSimValueRow);
			updateParagraphMetrics(maxSimValue,q-1,i,maxSimValueRow);
		}
		
	}
}

function outSentence(d,i){

	lastHighlighted = i;
}

function modifySentenceMetric(maxSimValue,topic,i,maxSimValueRow){
	
	textToAdd = d3.select("#topic"+ (topic+1)+ "barsColumn").select("svg").selectAll(".sentLCSText").data([1])
	.attr("dx",5)
	.attr("x",function(d){
			return scaleBars(maxSimValue);
	})
	.attr("y",$(".sentence_t0_"+i).position().top - $("table #topic1barsColumn svg").offset().top + barsHeight +($("table #topic1barsColumn").offset().top - $(".upperTable").offset().top))
	.text(function(){
		if (parseFloat(maxSimValue)<0.001){ 
			return "0";
		}
		else{
			return maxSimValue.toFixed(3);
		}
	});
	
	textToAdd.enter().append("text")
	.attr("class","sentLCSText")
	.attr("dx",5)
	.attr("x",function(d){
			return scaleBars(maxSimValue);
	})
	.attr("text-anchor",function(d){
			return "start";
	})
	.attr("y",$(".sentence_t0_"+i).position().top - $("table #topic1barsColumn svg").offset().top + barsHeight +($("table #topic1barsColumn").offset().top - $(".upperTable").offset().top))
	.text(function(){
		if (parseFloat(maxSimValue)<0.001){ 
			return "0";
		}
		else{
			return maxSimValue.toFixed(3);
		}
	});
	
}


function nTopicsListener(selection){
	selection.on("change",function(){
		currentNTopics = this.value;
		includeText(currentNTopics, topicFiles);
	});
}

function adjustNumberOfTopics(numberOfTopics){
	var topicsToAdd = d3.select(".tableSmallTopics").select("#firstRow").selectAll("td").data(d3.range(numberOfTopics))
						.attr("width",(100/numberOfTopics).toFixed(2)+"%");
					
	topicsToAdd.enter().append("td")
	.attr("id", function (d){
		return "smalltopic"+(d+1)+"text";
	})
	.html(function(d){
		return "<fieldset><legend>Small topic " + (d+1) + "</legend><div class='smallTopics'></div></fieldset>"
	})
	.attr("width",function(d){
		modifyLegendNames(d3.select("#smalltopic"+(d+1)+"text").select("legend"),"Topic " + topicIds[d+1] + ": " + topicNames[d+1]);
		return (100/numberOfTopics).toFixed(2)+"%"
	});
	
	topicsToAdd.exit().remove();
	
	addListToPage(topicSmallList[numberOfTopics],d3.select("#smalltopic" + numberOfTopics + "text").select("div"));
	
	var topicsMetricsToAdd = d3.select(".tableSmallTopics").select("#secondRow").selectAll("td").data(d3.range(numberOfTopics));
	
	topicsMetricsToAdd.enter().append("td")
	.style("padding-left","20px")
	.attr("id", "methodMetrics");
	
	topicsMetricsToAdd.exit().remove();
	
	var paragraphMetricsToAdd = d3.select(".tableSmallTopics").select("#paragraphSimilarityRow").selectAll("td").data(d3.range(numberOfTopics));
	
	paragraphMetricsToAdd.enter().append("td")
	.style("padding-left","20px")
	.attr("id", "paragraphMetric");
	
	paragraphMetricsToAdd.exit().remove();
	
	addTopicMetrics();
	drawHistogramsBigTopic();
	
	graphObj.updateGraph();
}

function modifyLegendNames(selection,name){
	selection.text(name);
}

function includeText(index,fileNames){
var htmlElement = "div";
var htmlClass = "sentence";

	d3.text(fileNames[index], function(datasetText){
		var topic1 = datasetText;
		
		if (granularitySentence){
			topicSmallList[index] = topic1.split('.');
		}
		else{
			//paragraph separator
			var reParagSep = /<p>|<fig>|<table>|<ul>|<shortdesc>|<\/p>|<\/fig>|<\/table>|<\/ul>|<\/shortdesc>/;
			
			topicSmallList[index] = topic1.split(reParagSep);
			
			//var reParagSepTags = /(<p>|<fig>|<tabl>|<ul>|<shortdesc>|<\/p>|<\/fig>|<\/table>|<\/ul>|<\/shortdesc>)/;
			//topicSmallList[index] = topic1.split(reParagSepTags);
		}
		
		topicSmallList[index] = removeEmptyElements(topicSmallList[index]);
		
		nSentences[index] = topicSmallList[index].length;

		wrapElementTagToList(topicSmallList[index],htmlElement,htmlClass + "_t"+index+"_");
				
		adjustNumberOfTopics(index);

	});
}

function wrapElementTagToList(list,element,className){

	list.forEach(function(elem,index){
		list[index] = "<"+element + " class='" + className + index + "'>" + elem + "</"+element + ">";		
	});
}

function addListToPage(list,selection){
var fullHTML="";
	list.forEach(function(elem){
		fullHTML = fullHTML+ elem;
	});
	selection.html(fullHTML);
}

function removeEmptyElements(list){
var newList = [];
var re = /^\s*$/
	list.forEach(function(elem,index){
		if (!re.test(elem)){
			newList.push(elem);
		}
	});
	return newList;
}

function graph(){
	//var contextForce;
	var width = 200;
	var height = 200;
	
	var nodes = [];
	var weights = [];
	
	var svg;

	this.insertGraph = function(selection,nodes,weights) {
		
		svg = d3.select(selection).append("svg")
			.attr("width", width)
			.attr("height", height);
		
		var globalMax = d3.max(weights.map(function(d){return d.value;}));
		var globalMin = d3.min(weights.map(function(d){return d.value;}));
		
		var scaleDist = d3.scale.linear()
						.domain([1,0])
						.range([20,60]);
						
		var scaleEdgeThickness = d3.scale.linear()
						.domain([0,1])
						.range([0.5,3]);
						
		
		
		contextForce = d3.layout.force()
			.charge(-200)
			//.linkDistance(300)
			.size([width, height]);
		
		contextForce
			.nodes(nodes)
			.links(weights)
			//.friction(0.3)
			.linkDistance(function(link, index){
				//console.log(link.value)
				return scaleDist(link.value);
			});
		
		var link = svg.append("g").attr("class","all_context_links").selectAll(".context_link")
					.data(weights)
					.enter().append("line")
					.attr("class", "context_link")
					.style("stroke-width", function(d) { return scaleEdgeThickness(d.value); });
					
		var node = svg.append("g").attr("class","all_context_nodes").selectAll(".context_node")
					.data(nodes)
					//.enter().append("circle")
					.enter().append("path")
					.attr("class", "context_node")
					.attr("d", d3.svg.symbol()
								.size(function(d,i){
									return 100;
								})
								.type(function(d,i){
									return d3.svg.symbolTypes[dictionaryTopic[topicTypes[i]]];
								})
					)
					.attr("transform",function(d){
						return "translate(" + d.x + "," + d.y + ")";
					})
					//.attr("r", function(d,i)
					.style("fill", function(d,i) { 
						//return color(dictionaryTopic[topic_type[i][0]]);
						//return color(dictionaryBook[idBookTopic_name[i][1]]);
						if (i == 0){
							return "blue";
						}
						else if (i <= currentNTopics){
							return "green";
						}
						else{
							return "lightgrey";
						}
					});/*
					.on("mousedown",function(d){
						thisObject.topicClicked(d,d3.event)
					})
					.on("mouseup",topicReleased)
					.on("mouseover",topicHovered)
					.on("mouseout",topicHoveredEnd);*/
		
		node.append("title")
				.text(function(d) { return d.name;});
					
		contextForce.on("tick", function() {
			node.attr("transform", function(d) {
				d.x = d3.max([d3.min([d.x,width-20]),20]);
				d.y = d3.max([d3.min([d.y,height-20]),20]);
				return "translate(" + d.x + "," + d.y + ")"; });
				
			link.attr("x1", function(d) { return d.source.x; })
				.attr("y1", function(d) { return d.source.y; })
				.attr("x2", function(d) { return d.target.x; })
				.attr("y2", function(d) { return d.target.y; });
				
		});
		contextForce.start();
	}
	
	this.insertText = function(text){
		var textToAdd = svg.selectAll(".textInGraph").data([text])
		.text(text);
		
		textToAdd.enter().append("text")
		.attr("class","textInGraph")
		.attr("x",width/2)
		.attr("y",height - 15)
		.style("text-anchor", "middle")
		.style("font-size", "9pt")
		.text(text);
		
	}
	
	this.updateGraph = function(){
		svg.selectAll(".context_node")
			.data(d3.range(topicNames.length))
			.style("fill", function(d,i) { 
				//return color(dictionaryTopic[topic_type[i][0]]);
				//return color(dictionaryBook[idBookTopic_name[i][1]]);
				if (i == 0){
					return "blue";
				}
				else if (i <= currentNTopics){
					return "green";
				}
				else{
					return "lightgrey";
				}
			});
	}
	
	this.prepareNodes = function(topicNames, topicIds, topicTypes){
		var nodes = []
		topicNames.forEach(function(elem,idx){
			nodes.push({"name":"Topic " + parseInt(topicIds[idx])+" - Topic: " + elem + " (type: " + topicTypes[idx] + ")","x": width/2 ,"y": height/2});
		});
		return nodes;
	}
	
	this.prepareWeights = function(distances){

		distances.forEach(function(elem,idx){
			var contentLink = new Object();
			contentLink.source = 0;
			contentLink.target = idx+1;
			if ((idx+1) > currentNTopics){
				contentLink.value = 0.1;
			}
			else{
				contentLink.value = elem;
			}
			weights.push(contentLink);
		});
		return weights;
	}
}

function loadContextGraph(){
	graphObj = new graph();
	var nodes = graphObj.prepareNodes(topicNames, topicIds, topicTypes);
	var weights = graphObj.prepareWeights(topicMetrics);
	graphObj.insertGraph("#contextGraph", nodes, weights);
	graphObj.insertText("Showing top " + (topicNames.length - 1) + " neighbors of Topic " + topicIds[0]);
}

function readyWithLoading(){

	var patternToFind = /book=(\w+),topic=(\d+),neighbors=\((.*?)\),similarity=(\w+)/;
	
	if (patternToFind.test(window.location.href)){
		//e.g. http://localhost:8708/multiple.html?book=blabla,topic=92,neighbors=(10,23,34,56),similarity=qwe
		
		var bookName = patternToFind.exec(window.location.href)[1];
		var topicIndex = parseInt(patternToFind.exec(window.location.href)[2]);
		var listOfNeighbors = patternToFind.exec(window.location.href)[3].split(",");
		var similarity = patternToFind.exec(window.location.href)[4]
		
		var bookDir;
		if (bookName == 'CORDAPContentDeveloper'){
			bookDir = bookName+'/'
		}
		
		var pathForData = './data/';
		var indexFileName = 'idBookTopic';
		
		var randNumb = Math.floor(Math.random() * 1000);
		d3.text(pathForData + bookDir +  indexFileName + "?" + randNumb, function(datasetText) {
				idBookTopic = d3.csv.parseRows(datasetText);
				
				dictionaryTopic = {};
				dictionaryTopic["nTypes"] = 0;
				topicNames[0] = idBookTopic[topicIndex][2].ltrim();
				topicTypes[0] = idBookTopic[topicIndex][3].trim();
				topicIds[0] = parseInt(topicIndex);
				topicFiles[0] = pathForData + bookDir + 'in'+ bookDir + topicNames[0];
				var neighborTopicName;
				listOfNeighbors.forEach(function(elem, index){
					neighborTopicName = idBookTopic[parseInt(elem)][2].ltrim();
					topicNames.push(neighborTopicName);
					neighborTopicType = idBookTopic[elem][3].trim();
					topicTypes.push(neighborTopicType);
					topicIds.push(parseInt(elem));
					topicFiles.push(pathForData + bookDir + 'in'+ bookDir + neighborTopicName);
					if (dictionaryTopic[neighborTopicType]==undefined){
								dictionaryTopic[neighborTopicType] = dictionaryTopic["nTypes"];
								dictionaryTopic["nTypes"] = dictionaryTopic["nTypes"]+1;
							}
				})
				if (window.opener.dictionaryTopic != undefined){
					dictionaryTopic = window.opener.dictionaryTopic;
				}
				
				var nTopics = listOfNeighbors.length;
				d3.select("#nTopics").attr("max",nTopics);
				var comparisonDirectory = pathForData + bookDir + 'out' + bookName + '_' + similarity + '/';
				
				readTopPairComparisons(comparisonDirectory,topicNames,topicIds,nTopics);
				
				/*
				Compute pairwise comparison with topicIndex and listOfNeighbors as arguments
				and get a sentenceComparison.tsv file and topicMetrics(which contains the overall similarity)
				*/
				
				
		})
		
	}
	else{
		topicFiles = ['./example/cordap_tk_work-package-updating','./example/cordap_gt_work-package-mgmt','./example/cordap_tk_work-packages-changing-view','./example/cordap_rf_work-flow-fields','./example/cordap_cn_work-package-email-notification','./example/cordap_rf_rates'];

		topicNames = ['cordap_tk_work-package-updating','cordap_gt_work-package-mgmt','cordap_gt_work-package-changing-view','cordap_rf_work-flow-fields','cordap_cn_work-package-email-notification','cordap_rf_rates'];


		pairwiseComparisonFile = './example/sentenceComparison.tsv';

		topicMetrics = [0.4511,0.3649,0.348,0.3046,0.24];

		readTopPairComparisons(pairwiseComparisonFile,5)
		main();
	}
	
}

readyWithLoading();