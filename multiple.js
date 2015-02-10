var LCSColumnIndex = 0;
var sentenceTopic1ColumnIndex = 1;
var sentenceTopic2ColumnIndex = 2;
var sentenceLCSColumnIndex = 3;
var smallFontSize = 7;
var pairComparisons = [];
var lastHighlighted = -1;
var nSentences = [];
var currentNTopics = 2;

var maxBarLength = 190;
var barsHeight = 10;

var sentenceLCS;

var granularitySentence =true;

//Preprocessing variables
var topicNames = [];
var topicFiles = [];
var pairwiseComparisonFile

function readTopPairComparisons(pairComparisonFilePrefix,nTopics){
	for (var q=1;q<=nTopics;q++){
		readTopPairComp(pairComparisonFilePrefix,q)
	}
}

function readTopPairComp(pairComparisonFilePrefix,indTopic){
	d3.text(pairComparisonFilePrefix.slice(0,-4) + indTopic + pairComparisonFilePrefix.slice(-4),  function(datasetText) {
				pairComparisons[indTopic] = d3.tsv.parseRows(datasetText);
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
		d3.text(topicFiles[1], function(datasetText){
			var topicSmall1 = datasetText;
			d3.text(topicFiles[2], function(datasetText){
				var topicSmall2 = datasetText;
				
				if (granularitySentence){
					//sentence separator
					topicBigList = topicBig.split('.');
					topicSmall1List = topicSmall1.split('.');
					topicSmall2List = topicSmall2.split('.');
				}
				else{
					//paragraph separator
					topicBigList = topicBig.split('</p>');
					topicSmall1List = topicSmall1.split('</p>');
					topicSmall2List = topicSmall2.split('</p>');
				}
				
				topicBigList = removeEmptyElements(topicBigList);
				topicSmall1List = removeEmptyElements(topicSmall1List);
				topicSmall2List = removeEmptyElements(topicSmall2List);
				
				nSentences[1] = topicSmall1List.length;
				nSentences[2] = topicSmall2List.length;
		
				wrapElementTagToList(topicBigList,htmlElement,htmlClass + "_t0_");
				wrapElementTagToList(topicSmall1List,htmlElement,htmlClass + "_t1_");
				wrapElementTagToList(topicSmall2List,htmlElement,htmlClass + "_t2_");
				
				addListToPage(topicBigList,d3.select("#topic1text").select("div"));
				addListToPage(topicSmall1List,d3.select("#smalltopic1text").select("div"));
				addListToPage(topicSmall2List,d3.select("#smalltopic2text").select("div"));
				
				modifyLegendNames(d3.select("#topic1text").select("legend"),topicNames[0]);
				modifyLegendNames(d3.select("#smalltopic1text").select("legend"),topicNames[1]);
				modifyLegendNames(d3.select("#smalltopic2text").select("legend"),topicNames[2]);
				
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
		return "   Similarity: " + topicMetrics[i];//this should be read or computed from a file
	});
}

function drawHistogramsBigTopic(){
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
			if (q==2){
				//This is because the files were prepared in an odd manner
				d3.range(nSentences[q]).forEach(function(elem){
					if (maxSimValue < parseFloat(pairComparisons[q][i*nSentences[q] + elem][LCSColumnIndex])){
						maxSimValue = parseFloat(pairComparisons[q][i*nSentences[q] + elem][LCSColumnIndex]);
						maxSimValueRow = elem;
					}
				});
			}
			else{
				d3.range(nSentences[q]).forEach(function(elem){
					if (maxSimValue < parseFloat(pairComparisons[q][i+nSentencesTopic1 * elem][LCSColumnIndex])){
						maxSimValue = parseFloat(pairComparisons[q][i+nSentencesTopic1 * elem][LCSColumnIndex]);
						maxSimValueRow = elem;
					}
				});
			}
			sentenceLCS[i] = sentenceLCS[i] + maxSimValue/currentNTopics;
		});
	}
	scaleBars = d3.scale.linear()
					.domain([0,1])
					.range([0,maxBarLength]);
					
	scaleOpacity = d3.scale.linear()
					.domain([0,1])
					.range([0,1]);
	
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
	.attr("y1",10)
	.attr("x2",scaleBars(1))
	.attr("y2",10)
	.style("stroke","darkgrey");
	
	/*scaleGroupAppended.append("line")
	.attr("x1",0)
	.attr("y1",10)
	.attr("x2",0)
	.attr("y2",15)
	.style("stroke","darkgrey");*/
	
	scaleGroupAppended.append("line")
	.attr("x1",scaleBars(1))
	.attr("y1",10)
	.attr("x2",scaleBars(1))
	.attr("y2",15)
	.style("stroke","darkgrey");
	
	scaleGroupAppended.append("text")
	.attr("x",scaleBars(1))
	.attr("dx",3)
	.attr("y",15)
	.attr("dy",14)
	.attr("text-anchor","end")
	.text("1")
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
			if (q==2){
				//This is because the files were prepared in an odd manner
				d3.range(nSentences[q]).forEach(function(elem){
					rowsToLookAt.push(i*nSentences[q] + elem);

					if (maxSimValue < parseFloat(pairComparisons[q][i*nSentences[q] + elem][LCSColumnIndex])){
						maxSimValue = parseFloat(pairComparisons[q][i*nSentences[q] + elem][LCSColumnIndex]);
						maxSimValueRow = elem;
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
				d3.range(nSentences[q]).forEach(function(elem){
					rowsToLookAt.push(i+nSentencesTopic1 * elem);
					if (maxSimValue < parseFloat(pairComparisons[q][i+nSentencesTopic1 * elem][LCSColumnIndex])){
						maxSimValue = parseFloat(pairComparisons[q][i+nSentencesTopic1 * elem][LCSColumnIndex]);
						maxSimValueRow = elem;
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
				wordsToHighlightString2 = pairComparisons[q][rowsToLookAt[maxSimValueRow]][sentenceLCSColumnIndex];
				wordsToHighlightString2 = wordsToHighlightString2.slice(1,wordsToHighlightString2.length-1);//remove []
				wordsToHighlightList2 = wordsToHighlightString2.split(",");//separate words
				
				//$(".sentence_t" + q + "_" + maxSimValueRow).highlight($(".sentence_t" + q + "_" + maxSimValueRow).text().split(/\s+/),{className:"biggerFonts"});
				$(".sentence_t" + q + "_" + maxSimValueRow).highlight($(".sentence_t" + q + "_" + maxSimValueRow).text(),{className:"biggerFonts"});
				$(".sentence_t" + q + "_" + maxSimValueRow).highlight(wordsToHighlightList2,{className:"smallTopicsHighLighted"});//To show the same on the other side
			}

			modifySentenceMetric(sentenceLCS[i],0,i,maxSimValueRow);
		}
		
	}
}

function outSentence(d,i){

	lastHighlighted = i;
}

function modifySentenceMetric(maxSimValue,topic,i,maxSimValueRow){
	
	textToAdd = d3.select("#topic"+ (topic+1)+ "barsColumn").select("svg").selectAll(".sentLCSText").data([1])
	.attr("x",function(d){
			return scaleBars(maxSimValue)+10;
	})
	.attr("y",$(".sentence_t0_"+i).position().top - $("table #topic1barsColumn svg").offset().top + barsHeight +($("table #topic1barsColumn").offset().top - $(".upperTable").offset().top))
	.text(maxSimValue.toFixed(4));
	
	textToAdd.enter().append("text")
	.attr("class","sentLCSText")
	.attr("x",function(d){
			return scaleBars(maxSimValue)+10;
	})
	.attr("text-anchor",function(d){
			return "start";
	})
	.attr("y",$(".sentence_t0_"+i).position().top - $("table #topic1barsColumn svg").offset().top + barsHeight +($("table #topic1barsColumn").offset().top - $(".upperTable").offset().top))
	.text(maxSimValue.toFixed(4));
	
}


function nTopicsListener(selection){
	selection.on("change",function(){
		currentNTopics = this.value;
		adjustNumberOfTopics(this.value);
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
		includeText(d+1,topicFiles);
		modifyLegendNames(d3.select("#smalltopic"+(d+1)+"text").select("legend"),topicNames[d+1]);
		return (100/numberOfTopics).toFixed(2)+"%"
	});
	
	topicsToAdd.exit().remove();
	
	var topicsMetricsToAdd = d3.select(".tableSmallTopics").select("#secondRow").selectAll("td").data(d3.range(numberOfTopics));
	
	topicsMetricsToAdd.enter().append("td")
	.style("padding-left","20px")
	.attr("id", "methodMetrics");
	
	topicsMetricsToAdd.exit().remove();
	
	addTopicMetrics();
	drawHistogramsBigTopic();
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
			topic1List = topic1.split('.');
		}
		else{
			topic1List = topic1.split('</p>');
		}
		
		topic1List = removeEmptyElements(topic1List);
		
		nSentences[index] = topic1List.length;

		wrapElementTagToList(topic1List,htmlElement,htmlClass + "_t"+index+"_");
				
		addListToPage(topic1List,d3.select("#smalltopic"+index+"text").select("div"));

	});
}

function wrapElementTagToList(list,element,className){

	list.forEach(function(elem,index){
		list[index] = "<"+element + " class='" + className + index + "'>" + elem + ".</"+element + ">";		
	});
}

function addListToPage(list,selection){
var fullHTML="";
	list.forEach(function(elem){
		fullHTML = fullHTML+elem;
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


function readyWithLoading(){

	var patternToFind = /topic=(\d+),neighbors=\((.*?)\)/;
	
	if (patternToFind.test(window.location.href)){
		//e.g. http://localhost:8708/multiple.html?topic=92,neighbors=(10,23,34,56)
		
		var topicIndex = parseInt(patternToFind.exec(window.location.href)[1]);
		var listOfNeighbors = patternToFind.exec(window.location.href)[2].split(",");
		
		var pathForData = './data/';
		var indexFileName = 'idBookTopic';
		
		var randNumb = Math.floor(Math.random() * 1000);
		d3.text(pathForData + indexFileName + "?" + randNumb, function(datasetText) {
				idBookTopic = d3.csv.parseRows(datasetText);
				topicNames[0] = idBookTopic[topicIndex][2].ltrim();
				topicFiles[0] = pathForData + topicNames[0];
				var neighborTopicName;
				listOfNeighbors.forEach(function(elem, index){
					neighborTopicName = idBookTopic[parseInt(elem)][2].ltrim();
					topicNames.push(neighborTopicName);
					topicFiles.push(pathForData + neighborTopicName);
				})
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