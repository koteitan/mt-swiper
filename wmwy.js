//weak-magma omega-Y sequence: mountain and expansion.
//
//Copyright Phyrion. Licensed under the Apache License, Version 2.0
//(see LICENSE-APACHE and NOTICE).
//
//This file is a JavaScript translation of the executable definitions in
//  Phyrion, omega-Y-Well-Ordering-Lean, https://github.com/Phyrion1343/omega-Y-Well-Ordering-Lean
//  revision 33c16a8ce8f7e01bb3794881f3ff9109474beaed
//    OmegaY/Rows.lean              (jump, bump, B and the row order)
//    OmegaY/Canonical/Build.lean   (the mountain, `build`)
//    OmegaY/Expansion/Build.lean   (the expansion, `expand`)
//Changes by koteitan (2026): translated from Lean 4 to JavaScript. Every Lean
//definition keeps its name and its steps; the Lean error values are thrown as
//exceptions; a row (a finite Cantor sum Σ c_i ω^i) is an array of the
//coefficients c_0, c_1, ... with no trailing zeros. The proofs are not
//translated. `mountain` and `badRoot` are added for the display.
var WeakY=(function (){
//rows (OmegaY/Rows.lean)
var rowOf=function (a){ //drop trailing zeros
  var r=a.slice();
  while(r.length&&r[r.length-1]===0)r.pop();
  return r;
}
var coeff=function (a,i){
  return i<a.length?a[i]:0;
}
var rowEq=function (a,b){
  return jump(a,b)===0;
}
//zero on equal rows; otherwise one plus the highest differing exponent
var jump=function (a,b){
  for(var i=Math.max(a.length,b.length)-1;i>=0;i--){
    if(coeff(a,i)!==coeff(b,i))return i+1;
  }
  return 0;
}
var rowLt=function (a,b){
  var j=jump(a,b);
  return j>0&&coeff(a,j-1)<coeff(b,j-1);
}
var rowLe=function (a,b){
  return !rowLt(b,a);
}
var rowCompare=function (a,b){
  return rowLt(a,b)?-1:rowLt(b,a)?1:0;
}
//ordinal right addition of omega^d
var bump=function (a,d){
  var r=[];
  var n=Math.max(a.length,d+1);
  for(var i=0;i<n;i++)r.push(i<d?0:i===d?coeff(a,i)+1:coeff(a,i));
  return rowOf(r);
}
var B=function (a,b){
  return bump(a,jump(a,b));
}
var ZERO=[];
var isZero=function (a){
  return a.length===0;
}
//canonical mountain (OmegaY/Canonical/Build.lean)
//a mountain is an array of columns, a column an array of cells from the
//row-0 phantom to the top, a cell {row,value,left}, left = {column,index} or null
var fail=function (name){
  throw new Error("weak omega-Y: "+name);
}
var ref=function (column,index){
  return {column:column,index:index};
}
var refEq=function (a,b){
  return a.column===b.column&&a.index===b.index;
}
var cellAt=function (mountain,r){
  var column=mountain[r.column];
  if(!column)fail("invalidReference");
  var cell=column[r.index];
  if(!cell)fail("invalidReference");
  return cell;
}
//climb consecutively while the next row is at most the ceiling
var climb=function (ceiling,index,list){
  for(var i=0;i<list.length;i++){
    if(rowLe(list[i].row,ceiling))index++;
    else break;
  }
  return index;
}
var nextCandidate=function (mountain,current){
  var cell=cellAt(mountain,current);
  var left=cell.left;
  if(!left)fail("missingLeft");
  if(!(left.column<current.column))fail("nonLeftward");
  cellAt(mountain,left);
  var column=mountain[left.column];
  return ref(left.column,climb(cell.row,left.index,column.slice(left.index+1)));
}
var findParentAux=function (mountain,targetValue,fuel,current){
  for(;fuel>0;fuel--){
    var candidate=nextCandidate(mountain,current);
    var cell=cellAt(mountain,candidate);
    if(0<cell.value&&cell.value<targetValue)return candidate;
    current=candidate;
  }
  fail("searchExhausted");
}
var findParent=function (mountain,current){
  var cell=cellAt(mountain,current);
  return findParentAux(mountain,cell.value,current.column,current);
}
var phantom=function (){
  return {row:ZERO,value:0,left:null};
}
var initialColumn=function (column,value){
  return [phantom(),{row:[1],value:value,left:column===0?null:ref(column-1,0)}];
}
var growColumn=function (leftColumns,fuel,column){
  while(true){
    var child=column[column.length-1];
    if(!child)fail("emptyColumn");
    if(child.value===1)return column;
    if(child.value===0)fail("nonpositiveCurrent");
    if(fuel===0)fail("columnExhausted");
    fuel--;
    var mountain=leftColumns.concat([column]);
    var parentRef=findParent(mountain,ref(leftColumns.length,column.length-1));
    var parent=cellAt(mountain,parentRef);
    column=column.concat([{row:B(child.row,parent.row),value:child.value-parent.value,left:parentRef}]);
  }
}
var buildColumn=function (leftColumns,value){
  if(value===0)fail("invalidInput");
  return growColumn(leftColumns,value-1,initialColumn(leftColumns.length,value));
}
//empty sequences, or positive sequences beginning with 1
var build=function (values){
  if(values.length===0)return [];
  if(values[0]!==1)fail("invalidInput");
  for(var i=0;i<values.length;i++){
    if(!(values[i]>0)||values[i]!==Math.floor(values[i]))fail("invalidInput");
  }
  var mountain=[];
  for(var i=0;i<values.length;i++)mountain=mountain.concat([buildColumn(mountain,values[i])]);
  return mountain;
}
//expansion (OmegaY/Expansion/Build.lean)
var lookup=cellAt;
var columnAt=function (mountain,column){
  var r=mountain[column];
  if(!r)fail("missingColumn");
  return r;
}
var top=function (column){
  if(!column.length)fail("missingNode");
  return column[column.length-1];
}
var leftOf=function (cell){
  if(!cell.left)fail("missingLeft");
  return cell.left;
}
//highest node strictly below a ceiling
var below=function (mountain,column,ceiling){
  var nodes=columnAt(mountain,column);
  var chosen=null;
  for(var index=0;index<nodes.length;index++){
    if(rowLt(lookup(mountain,ref(column,index)).row,ceiling))chosen=ref(column,index);
  }
  if(!chosen)fail("missingReference");
  return chosen;
}
//the last applicable reference in the descending boundary list
var referenceAt=function (mountain,references,row){
  var chosen=null;
  for(var i=0;i<references.length;i++){
    var cell=lookup(mountain,references[i]);
    if(rowLe(row,cell.row))chosen=cell.row;
  }
  if(!chosen)fail("missingReference");
  return chosen;
}
//reverse one weak edge: current.above.left, provided its height is unchanged
var weakParent=function (mountain,current){
  var column=columnAt(mountain,current.column);
  var cell=lookup(mountain,current);
  var upper=column[current.index+1];
  if(!upper)return null;
  var parent=leftOf(upper);
  if(!(parent.column<current.column))fail("nonLeftward");
  var parentCell=lookup(mountain,parent);
  if(!rowEq(parentCell.row,cell.row))return null;
  return parent;
}
var weakReaches=function (mountain,root,fuel,current){
  while(true){
    if(fuel===0){
      if(refEq(current,root))return true;
      fail("weakSearchExhausted");
    }
    fuel--;
    if(refEq(current,root))return true;
    if(current.column<=root.column)return false;
    var parent=weakParent(mountain,current);
    if(!parent)return false;
    current=parent;
  }
}
//markers grouped by source column, from high root rows down to the phantom row
var markers=function (mountain,root){
  var result=[];
  for(var i=0;i<mountain.length;i++)result.push([]);
  for(var rootIndex=root.index;rootIndex>=0;rootIndex--){
    var rootRef=ref(root.column,rootIndex);
    var rootCell=lookup(mountain,rootRef);
    for(var column=root.column+1;column<mountain.length;column++){
      var nodes=columnAt(mountain,column);
      for(var index=0;index<nodes.length;index++){
        var r=ref(column,index);
        var cell=lookup(mountain,r);
        if(rowEq(cell.row,rootCell.row)&&weakReaches(mountain,rootRef,column+1,r))result[column].push(r);
      }
    }
  }
  return result;
}
//translate an actual edge
var copyEdge=function (mountain,source,shift,rootColumn,row){
  var cell=lookup(mountain,source);
  if(isZero(cell.row))return {row:row,value:0,left:null};
  var oldParent=leftOf(cell);
  var parent=oldParent.column<rootColumn?oldParent:below(mountain,oldParent.column+shift,row);
  if(!(parent.column<source.column+shift))fail("nonLeftward");
  return {row:row,value:0,left:parent};
}
//copy the segment above one marker, stopping before the next marker or at the value-1 top
var contour=function (mountain,sourceColumn,markerIndices,shift,rootColumn,index,target,current,list){
  var result=[];
  for(var k=0;;k++){
    if(k>=list.length){
      if(current.value===1)return result;
      fail("missingUpper");
    }
    var upper=list[k];
    if(current.value===1||markerIndices.indexOf(index+1)!==-1)return result;
    if(!rowLt(current.row,upper.row))fail("nonIncreasingRows");
    var nextTarget=bump(target,jump(current.row,upper.row)-1);
    result.push(copyEdge(mountain,ref(sourceColumn,index+1),shift,rootColumn,nextTarget));
    index++;
    target=nextTarget;
    current=upper;
  }
}
//insert every successor scale crossed by a reference edge
var fill=function (mountain,source,shift,low,high){
  var sourceCell=lookup(mountain,source);
  var sourceParent=leftOf(sourceCell);
  var parentColumn=sourceParent.column+shift;
  var nodes=columnAt(mountain,parentColumn);
  var result=[];
  for(var index=0;index<nodes.length;index++){
    var parentRef=ref(parentColumn,index);
    var parent=lookup(mountain,parentRef);
    if(rowLe(low,parent.row)&&rowLt(parent.row,high)){
      if(!(parentColumn<source.column+shift))fail("nonLeftward");
      var upper=lookup(mountain,ref(parentColumn,index+1));
      if(!rowLt(parent.row,upper.row))fail("nonIncreasingRows");
      for(var d=jump(parent.row,upper.row)-1;d>=0;d--){
        result.push({row:bump(parent.row,d),value:0,left:parentRef});
      }
    }
  }
  return result;
}
//backfill bottom-to-top cells from their value-1 top; the phantom keeps value zero
var backfill=function (mountain,upper,list){
  var result=[];
  for(var k=0;k<list.length;k++){
    var lower=list[k];
    if(isZero(lower.row)){
      if(k===list.length-1){
        result.push({row:lower.row,value:0,left:lower.left});
        return result;
      }
      fail("missingPhantom");
    }
    var parent=lookup(mountain,leftOf(upper));
    if(parent.value===0)fail("unfinishedParent");
    var next={row:lower.row,value:upper.value+parent.value,left:lower.left};
    result.push(next);
    upper=next;
  }
  return result;
}
var validateColumnRows=function (sorted){
  if(!sorted.length||!isZero(sorted[0].row))fail("missingPhantom");
  for(var i=0;i+1<sorted.length;i++){
    if(rowEq(sorted[i].row,sorted[i+1].row))fail("overlappingRows");
  }
}
var finishSorted=function (mountain,sorted){
  var rev=sorted.slice().reverse();
  if(!rev.length)fail("missingNode");
  var last=rev[0];
  if(isZero(last.row))fail("missingNode");
  var topCell={row:last.row,value:1,left:last.left};
  var lower=backfill(mountain,topCell,rev.slice(1));
  return [topCell].concat(lower).reverse();
}
var finish=function (mountain,cells){
  var sorted=cells.slice().sort(function (a,b){return rowCompare(a.row,b.row);}); //stable, as List.mergeSort
  validateColumnRows(sorted);
  return finishSorted(mountain,sorted);
}
var copyColumn=function (mountain,marked,references,sourceColumn,shift,rootColumn){
  var sources=columnAt(mountain,sourceColumn);
  var sourceMarkers=marked[sourceColumn]||[];
  var markerIndices=sourceMarkers.map(function (r){return r.index;});
  var cells=[];
  for(var i=0;i<sourceMarkers.length;i++){
    var marker=sourceMarkers[i];
    var cell=lookup(mountain,marker);
    var copied=copyEdge(mountain,marker,shift,rootColumn,cell.row);
    var target=referenceAt(mountain,references,cell.row);
    var upperPath=contour(mountain,sourceColumn,markerIndices,shift,rootColumn,marker.index,target,cell,sources.slice(marker.index+1));
    var gapCells=fill(mountain,ref(sourceColumn,marker.index+1),shift,cell.row,target);
    cells=cells.concat([copied],upperPath,gapCells);
  }
  return finish(mountain,cells);
}
var copyBlock=function (mountain,marked,boundaries,rootColumn,width,block){
  var references=boundaries.map(function (row){return below(mountain,mountain.length-1,row);});
  var result=mountain.slice();
  for(var offset=0;offset<width;offset++){
    var sourceColumn=rootColumn+offset+1;
    var shift=block*width;
    if(result.length!==sourceColumn+shift)fail("misplacedFill");
    result.push(copyColumn(result,marked,references,sourceColumn,shift,rootColumn));
  }
  return result;
}
//the complete graph; the temporary final boundary column is cut after all blocks
var expandDiagram=function (values,copies){
  var initial=build(values);
  if(values.length===0||values[values.length-1]===1||copies===0)return initial.slice(0,-1);
  var lastColumn=columnAt(initial,initial.length-1);
  var lastTop=top(lastColumn);
  var root=leftOf(lastTop);
  if(!(root.column<initial.length-1))fail("invalidRoot");
  var rootColumn=columnAt(initial,root.column);
  var rootCell=lookup(initial,root);
  var boundaries=[lastTop.row].concat(rootColumn.slice(0,root.index+1).reverse()
    .filter(function (c){return !isZero(c.row);}).map(function (c){return c.row;}));
  var width=initial.length-1-root.column;
  var reduced=values.slice(0,-1).concat([values[values.length-1]-1]);
  var mountain=build(reduced);
  var restored=lookup(mountain,root);
  if(!rowEq(restored.row,rootCell.row))fail("invalidRoot");
  var marked=markers(mountain,root);
  var result=mountain;
  for(var block=0;block<copies;block++){
    result=copyBlock(result,marked,boundaries,root.column,width,block+1);
  }
  return result.slice(0,-1);
}
var valuesOf=function (mountain){
  return mountain.map(function (column){
    if(!column[1])fail("missingNode");
    return column[1].value;
  });
}
var expand=function (values,copies){
  return valuesOf(expandDiagram(values,copies));
}
//for the display: the bad root column, -1 if none
var badRoot=function (values){
  if(values.length===0||values[values.length-1]===1)return -1;
  var m=build(values);
  return leftOf(top(m[m.length-1])).column;
}
return {build:build,expand:expand,badRoot:badRoot,jump:jump,rowCompare:rowCompare};
})();
if(typeof module!=="undefined")module.exports=WeakY;
