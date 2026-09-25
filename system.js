//the three sequence systems behind one interface, and the standard-form search.
//a sequence is an array of positive integers; [] is the empty sequence.
var Systems=(function (){
var g=typeof window!=="undefined"?window:global;
var toArray=function (s){
  return s===""?[]:String(s).split(",").map(Number);
}
//a mountain for the display: cols[c] = the cells of column c from the bottom up,
//a cell = {row, value, left}, row = the coefficients c_0,c_1,.. of Σ c_i ω^i
//(only their order is used), left = {col,idx} of the left leg or null
var trimRow=function (a){
  var r=a.slice();
  while(r.length&&r[r.length-1]===0)r.pop();
  return r;
}
var sortColumns=function (cols){
  for(var c=0;c<cols.length;c++){
    cols[c].sort(function (a,b){return g.WeakY.rowCompare(a.row,b.row);});
  }
}
//1-Y: row k of YNySequence's mountain holds the node of column c at position c-k.
//the layers above are the mountains of the diagonals (calcDiagonal: the top node
//of every column, with the parents it inherits), as YNySequence climbs them to
//find the bad root; they stop at a layer of one row. row k of layer L is k+L*ω
var MAX_LAYERS=32;
var mountain1Y=function (s){
  var cols=s.map(function (){return [];});
  var m=g.YNy.calcMountain(s.join(","));
  for(var layer=0;layer<MAX_LAYERS;layer++){
    var base=cols.map(function (c){return c.length;}); //cells below this layer
    for(var k=0;k<m.length;k++){
      for(var i=0;i<m[k].length;i++){
        var node=m[k][i];
        var c=node.position+k;
        var left=null;
        if(k>0){ //the left leg is the parent, in row k-1, of this column's node in row k-1
          var below=null;
          for(var j=0;j<m[k-1].length;j++)if(m[k-1][j].position+k-1===c)below=m[k-1][j];
          if(below&&below.parentIndex>=0){
            var p=m[k-1][below.parentIndex].position+k-1;
            left={col:p,idx:base[p]+k-1};
          }
        }
        cols[c].push({row:[k,layer],value:node.value,left:left});
      }
    }
    if(m.length<2)break; //a single row is its own diagonal
    m=g.YNy.calcMountain(g.YNy.calcDiagonal(m));
  }
  return cols;
}
//omega-Y: every node of StudyAndExpandSequence's nested mountain, row = coord[1..]
var mountainOmegaY=function (s){
  var m=g.OmegaY.calcMountain(s.join(","));
  var nodes=[];
  var walk=function (x){
    if(x.dim===0)nodes.push(x);
    else for(var i=0;i<x.arr.length;i++)walk(x.arr[i]);
  }
  walk(m);
  var cols=s.map(function (){return [];});
  var byCoord={};
  for(var i=0;i<nodes.length;i++){
    var cell={row:trimRow(nodes[i].coord.slice(1)),value:nodes[i].value,left:null,node:nodes[i]};
    cols[nodes[i].position].push(cell);
    byCoord[trimRow(nodes[i].coord).join(",")]=cell;
  }
  sortColumns(cols);
  for(var c=0;c<cols.length;c++){
    for(var i=0;i<cols[c].length;i++){
      cols[c][i].col=c;
      cols[c][i].idx=i;
    }
  }
  for(var c=0;c<cols.length;c++){
    for(var i=0;i<cols[c].length;i++){
      var cell=cols[c][i];
      var ll=cell.node.leftLegCoord&&byCoord[trimRow(cell.node.leftLegCoord).join(",")];
      if(ll)cell.left={col:ll.col,idx:ll.idx};
    }
  }
  for(var c=0;c<cols.length;c++){
    for(var i=0;i<cols[c].length;i++){
      delete cols[c][i].node;
      delete cols[c][i].col;
      delete cols[c][i].idx;
    }
  }
  return cols;
}
//weak-magma omega-Y: the canonical mountain without the row-0 phantoms
var mountainWeak=function (s){
  var m=g.WeakY.build(s);
  return m.map(function (column){
    return column.slice(1).map(function (cell,i){
      return {row:cell.row,value:cell.value,left:(i>0&&cell.left)?{col:cell.left.column,idx:cell.left.index-1}:null};
    });
  });
}
//an omega-level sheet is the set of rows that agree above the coefficient of ω^0.
//as in the 1-Y layers, every sheet above the base gets a bottom row that copies,
//in each column, the top node below the sheet; the sheet's own rows move up by
//one. the legs that cross into a sheet all leave its lowest row and land on those
//top nodes, so they are moved onto the copies
var sheetKey=function (row){
  return trimRow(row.slice(1)).join(".");
}
var addCopyRows=function (cols){
  var cmp=g.WeakY.rowCompare;
  var bottoms={}; //sheet key -> its lowest row
  for(var c=0;c<cols.length;c++){
    for(var i=0;i<cols[c].length;i++){
      var r=cols[c][i].row,k=sheetKey(r);
      if(k&&(!bottoms[k]||cmp(r,bottoms[k])<0))bottoms[k]=r;
    }
  }
  var shift=function (row){ //one row up inside a sheet above the base
    if(!sheetKey(row))return row;
    var r=row.slice();
    r[0]=(r[0]||0)+1;
    return r;
  }
  var out=cols.map(function (){return [];});
  var moved=cols.map(function (col){return col.map(function (){return null;});}); //old -> new cell
  var copies={}; //sheet key + "|" + column -> copy cell
  for(var c=0;c<cols.length;c++){
    for(var i=0;i<cols[c].length;i++){
      var x=cols[c][i];
      var y={row:shift(x.row),value:x.value,left:x.left};
      moved[c][i]=y;
      out[c].push(y);
    }
    for(var k in bottoms){
      var top=null;
      for(var i=0;i<cols[c].length;i++)if(cmp(cols[c][i].row,bottoms[k])<0)top=cols[c][i];
      if(top){
        var copy={row:bottoms[k].slice(),value:top.value,left:null};
        copies[k+"|"+c]=copy;
        out[c].push(copy);
      }
    }
  }
  //the legs, still as old references; the ones crossing into a sheet go to its copies
  var target=function (x,c,i){
    var k=sheetKey(x.row);
    if(!x.left)return null;
    var ll=cols[x.left.col][x.left.idx];
    if(k&&ll&&sheetKey(ll.row)!==k)return copies[k+"|"+x.left.col]||null;
    return moved[x.left.col][x.left.idx];
  }
  var targets=[];
  for(var c=0;c<cols.length;c++){
    for(var i=0;i<cols[c].length;i++)targets.push([moved[c][i],target(cols[c][i],c,i)]);
  }
  sortColumns(out);
  var where=new Map(); //new cell -> {col,idx}
  for(var c=0;c<out.length;c++){
    for(var i=0;i<out[c].length;i++)where.set(out[c][i],{col:c,idx:i});
  }
  for(var j=0;j<targets.length;j++){
    targets[j][0].left=targets[j][1]?where.get(targets[j][1]):null;
  }
  return out;
}
var SYSTEMS={
  "1y":{
    name:"1-Y",
    expand:function (s,n){return toArray(g.YNy.expand(s.join(","),n,true));},
    mountain:mountain1Y
  },
  "wy":{
    name:"ω-Y",
    expand:function (s,n){return toArray(g.OmegaY.expand(s.join(","),n,false,true));},
    mountain:function (s){return addCopyRows(mountainOmegaY(s));}
  },
  "wmwy":{
    name:"weak-magma ω-Y",
    expand:function (s,n){return g.WeakY.expand(s,n);},
    mountain:function (s){return addCopyRows(mountainWeak(s));}
  }
};
var isLegal=function (s){
  if(s.length===0)return true;
  if(s[0]!==1)return false;
  for(var i=0;i<s.length;i++)if(!(s[i]>=1)||s[i]!==Math.floor(s[i]))return false;
  return true;
}
var expand=function (sys,s,n){
  if(s.length===0)return [];
  if(!isLegal(s))throw new Error("a sequence starts with 1 and has positive integers only");
  return SYSTEMS[sys].expand(s,n);
}
var mountain=function (sys,s){
  if(s.length===0)return [];
  if(!isLegal(s))throw new Error("a sequence starts with 1 and has positive integers only");
  return SYSTEMS[sys].mountain(s);
}
//the bad root column, -1 if none. in omega-Y and weak-magma omega-Y it is the
//column of the left leg of the last column's top; 1-Y finds it through the diagonal
var badRoot=function (sys,s,cols){
  if(s.length<2||s[s.length-1]===1)return -1;
  if(sys==="1y"){
    var r=g.YNy.getBadRoot(s.join(","));
    return typeof r==="number"?r:-1;
  }
  if(!cols.length)return -1;
  var last=cols[cols.length-1];
  var top=last[last.length-1];
  return top&&top.left?top.left.col:-1;
}
var startsWith=function (e,p){
  if(e.length<p.length)return false;
  for(var i=0;i<p.length;i++)if(e[i]!==p[i])return false;
  return true;
}
//cur[n] with n just large enough for the length to reach needLen (or the longest there is)
var MAX_BRACKET=1000;
var expandTo=function (sys,cur,needLen){
  var e1=expand(sys,cur,1);
  if(e1.length>=needLen)return e1;
  var e2=expand(sys,cur,2);
  var k=e2.length-e1.length;
  if(k<=0)return e2;
  var n=2+Math.ceil((needLen-e2.length)/k);
  if(n>MAX_BRACKET)throw new Error("too long");
  var e=expand(sys,cur,n);
  while(e.length<needLen&&n<MAX_BRACKET)e=expand(sys,cur,++n);
  return e;
}
//descend from a standard cur, which is above target, to a standard sequence that
//starts with target and has at least needLen terms. cur[n] grows with n by
//appending, so every standard t < cur is at most cur[n] for some n; cutting
//cur[n] just after its first term above target keeps it above target.
//returns the sequence, null if there is none, undefined if it gives up
var DESCEND_STEPS=3000;
var DESCEND_MS=400;
var descend=function (sys,target,cur,needLen){
  var t0=Date.now();
  for(var step=0;step<DESCEND_STEPS&&Date.now()-t0<DESCEND_MS;step++){
    var e=expandTo(sys,cur,needLen);
    var i=0;
    while(i<e.length&&i<target.length&&e[i]===target[i])i++;
    if(i<e.length&&i<target.length){
      if(e[i]<target[i])return null;
      cur=e.slice(0,i+1);
      continue;
    }
    return e.length>=needLen?e:null;
  }
  return undefined;
}
var seed=function (s,level){ //(1,L+1), above every sequence whose 2nd term is at most L
  var l=Math.max(level,s.length>=2?s[1]:0);
  return [1,l+1];
}
//true / false, or null if it gives up
var isStandard=function (sys,s){
  if(!isLegal(s))return false;
  if(s.length<=1)return true;
  try{
    var e=descend(sys,s,seed(s,1),s.length);
    return e===undefined?null:e!==null;
  }catch(err){
    return null;
  }
}
//the largest v with s+(v) standard and below (1,L+1); null if none
var largestNext=function (sys,s,level){
  if(s.length===0)return 1;
  var e=descend(sys,s,seed(s,level),s.length+1);
  return e?e[s.length]:null;
}
//the largest w < last with (s without last)+(w) standard; null if none
var nextSmaller=function (sys,s){
  if(s.length<=1)return null;
  var p=s.slice(0,-1);
  var e=expandTo(sys,s,s.length);
  if(e.length<s.length||!startsWith(e,p))return null;
  var w=e[p.length];
  return w<s[s.length-1]?w:null;
}
//the smallest w > last with (s without last)+(w) standard and below (1,L+1); null if none
var nextLarger=function (sys,s,level){
  if(s.length<=1)return null;
  var p=s.slice(0,-1);
  var v=s[s.length-1];
  var w=largestNext(sys,p,level);
  if(w===null||w<=v)return null;
  var t0=Date.now();
  while(Date.now()-t0<2000){
    var w2=nextSmaller(sys,p.concat([w]));
    if(w2===null||w2<=v)return w;
    w=w2;
  }
  return null;
}
return {SYSTEMS:SYSTEMS,expand:expand,mountain:mountain,badRoot:badRoot,isLegal:isLegal,
        isStandard:isStandard,largestNext:largestNext,nextSmaller:nextSmaller,nextLarger:nextLarger};
})();
if(typeof module!=="undefined")module.exports=Systems;
