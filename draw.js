//Y-mountain drawing.
//The layout follows the stack mode of MEGAwhYmountain by Naruyoko,
//https://naruyoko.github.io/googology/MEGAwhYmountain/ (used with the author's
//own permission, see THIRD-PARTY.md): the rows are stacked from the highest
//down and every column keeps its place; a node is joined to its right leg (the
//node below it) and to its left leg by one line that goes up from the right
//leg, across to the left leg's column one slot lower, and down to the left leg;
//where the rows change in the coefficient of ω^k (k >= 1) a gap with k lines
//is left. Changes: rewritten for a list of columns instead of the nested
//mountain, fixed sizes instead of the option sliders, and the bad part band
//and the marks below the bottom row are added. The bad root mark and the cut
//mark are the symbols of hydraswipe, which took them from BMSHydraViewer by
//Naruyoko (MIT).
var MountainView=(function (){
var RH=32;          //slot height
var FONT="15px arial";
var NUMTOP=12;      //from the baseline up to the top of a number
var BELOW=4;        //from the baseline down to where a line turns
var MARGIN=16;
var MINCOL=30;      //the narrowest column
var MARKS=26;       //room below the bottom row for the marks
var NOTE=24;        //room for a warning line
var key=function (row){
  return row.join(".");
}
//measure; ctx only needs its font
var measure=function (ctx,cols,o){
  ctx.font=FONT;
  var L={cols:cols,slotOf:{},gaps:[],widths:[],xs:[],nslots:0};
  var rows=[];
  var seen={};
  for(var c=0;c<cols.length;c++){
    for(var i=0;i<cols[c].length;i++){
      var k=key(cols[c][i].row);
      if(!seen[k]){
        seen[k]=true;
        rows.push(cols[c][i].row);
      }
    }
  }
  rows.sort(function (a,b){return WeakY.rowCompare(b,a);}); //highest first
  var slot=0;
  for(var r=0;r<rows.length;r++){
    if(r>0){
      var j=WeakY.jump(rows[r-1],rows[r]);
      if(j>=2){ //a new ω^(j-1) level: a gap with j-1 lines
        L.gaps.push({slot:slot,lines:j-1});
        slot++;
      }
    }
    L.slotOf[key(rows[r])]=slot;
    slot++;
  }
  L.nslots=slot;
  var x=MARGIN;
  for(var c=0;c<cols.length;c++){
    var w=MINCOL;
    for(var i=0;i<cols[c].length;i++)w=Math.max(w,ctx.measureText(String(cols[c][i].value)).width+12);
    L.widths.push(w);
    L.xs.push(x+w/2);
    x+=w;
  }
  if(!cols.length)x+=ctx.measureText("()").width;
  L.w=x+MARGIN;
  L.h=MARGIN+Math.max(L.nslots,1)*RH+MARKS;
  L.note=o.error?"error: "+o.error:o.nonStandard?"(🚨 non-standard)":"";
  if(L.note){
    L.w=Math.max(L.w,MARGIN*2+ctx.measureText(L.note).width);
    L.h+=NOTE;
  }
  L.h+=MARGIN/2;
  L.w=Math.ceil(L.w);
  L.h=Math.ceil(L.h);
  return L;
}
var slotTop=function (s){
  return MARGIN+s*RH;
}
var baseline=function (s){
  return slotTop(s)+RH-8;
}
var render=function (ctx,L,o){
  var cols=L.cols;
  var bottom=slotTop(Math.max(L.nslots,1)); //the bottom edge of the lowest slot
  //the bad part band
  if(o.badRoot>=0){
    for(var c=o.badRoot;c<cols.length-1;c++){
      ctx.fillStyle=o.colors.band;
      ctx.fillRect(L.xs[c]-L.widths[c]/2,MARGIN-4,L.widths[c],bottom-MARGIN+8);
    }
  }
  //level gaps
  ctx.strokeStyle=o.colors.divider;
  ctx.lineWidth=1;
  for(var g=0;g<L.gaps.length;g++){
    var gap=L.gaps[g];
    ctx.beginPath();
    for(var i=0;i<gap.lines;i++){
      var y=Math.round(baseline(gap.slot)-NUMTOP+(NUMTOP+BELOW)*(i+1)/(gap.lines+1))+0.5;
      ctx.moveTo(MARGIN/2,y);
      ctx.lineTo(L.w-MARGIN/2,y);
    }
    ctx.stroke();
  }
  //legs
  ctx.strokeStyle=o.colors.fg;
  ctx.lineWidth=1;
  for(var c=0;c<cols.length;c++){
    for(var i=1;i<cols[c].length;i++){
      var cell=cols[c][i];
      if(!cell.left)continue;
      var leftLeg=cols[cell.left.col]&&cols[cell.left.col][cell.left.idx];
      if(!leftLeg)continue;
      var s=L.slotOf[key(cell.row)];
      var sr=L.slotOf[key(cols[c][i-1].row)];
      var sl=L.slotOf[key(leftLeg.row)];
      var xp=L.xs[cell.left.col];
      ctx.beginPath();
      ctx.moveTo(L.xs[c],baseline(sr)-NUMTOP);
      ctx.lineTo(L.xs[c],baseline(s)+BELOW);
      ctx.lineTo(xp,baseline(s+1)-NUMTOP);
      ctx.lineTo(xp,baseline(sl)-NUMTOP);
      ctx.stroke();
    }
  }
  //numbers
  ctx.fillStyle=o.colors.fg;
  ctx.font=FONT;
  ctx.textAlign="center";
  for(var c=0;c<cols.length;c++){
    for(var i=0;i<cols[c].length;i++){
      ctx.fillText(String(cols[c][i].value),L.xs[c],baseline(L.slotOf[key(cols[c][i].row)]));
    }
  }
  if(!cols.length)ctx.fillText("()",L.w/2,baseline(0));
  ctx.textAlign="start";
  //marks below the bottom row: the bad root and the cut column
  ctx.strokeStyle=o.colors.sym;
  var my=bottom+MARKS-6;
  if(o.badRoot>=0){
    var bx=L.xs[o.badRoot]+7;
    ctx.beginPath();
    ctx.moveTo(bx-10,my+2);
    ctx.lineTo(bx-15,my-2);
    ctx.lineTo(bx-10,my-4);
    ctx.lineTo(bx-12,my-10);
    ctx.lineTo(bx-7,my-8);
    ctx.lineTo(bx-5,my-14);
    ctx.lineTo(bx-0,my-10);
    ctx.stroke();
  }
  if(cols.length&&o.badRoot>=0){
    var rx=L.xs[cols.length-1]-5;
    ctx.beginPath();
    ctx.moveTo(rx+0,my-14);
    ctx.lineTo(rx+10,my-4);
    ctx.moveTo(rx+0,my-4);
    ctx.lineTo(rx+10,my-14);
    ctx.stroke();
  }
  if(L.note){
    ctx.fillStyle=o.colors.sym;
    ctx.font=FONT;
    ctx.fillText(L.note,MARGIN,bottom+MARKS+NOTE-6);
  }
}
return {measure:measure,render:render};
})();
