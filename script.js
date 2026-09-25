//mt-swiper: the page. The swipe, editor and canvas handling follow hydraswipe
//(https://github.com/koteitan/hydraswipe), the expand button follows
//BMSHydraViewer (https://github.com/koteitan/BMSHydraViewer).
//localStorage namespace: every key of this app lives under "mt-swiper:".
var LS_NS="mt-swiper";
var lsKey=function (name){
  return LS_NS+":"+name;
}
var lsLoad=function (name){
  try{
    var raw=localStorage.getItem(lsKey(name));
    if(raw!==null)return JSON.parse(raw);
  }catch(e){
  }
  return null;
}
var lsSave=function (name,value){
  try{
    localStorage.setItem(lsKey(name),JSON.stringify(value));
  }catch(e){
  }
}
var dg=function (id){
  return document.getElementById(id);
}
//state. text is the whole text of the editor, one sequence per line; every line
//with a digit or a parenthesis is drawn in its own image. focus is the index of
//the image the swipes act on. level L: the swipes stay below (1,L+1), so a swipe
//right on (1) gives (1,L)
var text="(1,3,3)";
var focus=0;
var level=3;
var sys="1y";
var theme="system";
var SYS_KEYS=["1y","wy","wmwy"];
var THEMES=["system","light","dark"];
var seqToString=function (s){
  return "("+s.join(",")+")";
}
//"(1,3,3)", "1 3 3", "1,3,3" -> [1,3,3]; the [..] notes are dropped; never throws
var parseSeq=function (line){
  var m=String(line).replace(/\[[^\]]*\]/g,"").match(/[0-9]+/g);
  return m?m.map(Number):[];
}
//the sequences of the text: [{line, seq}], one per line that has a digit or a parenthesis
var entries=function (){
  var lines=text.split("\n");
  var list=[];
  for(var l=0;l<lines.length;l++){
    var line=lines[l].replace(/\[[^\]]*\]/g,"");
    if(/[0-9()]/.test(line))list.push({line:l,seq:parseSeq(line)});
  }
  return list;
}
var clampFocus=function (list){
  if(focus>=list.length)focus=list.length-1;
  if(focus<0)focus=0;
}
var setLevelFrom=function (s){
  if(s&&s.length>=2)level=Math.max(1,s[1]);
}
var focusedSeq=function (){
  var list=entries();
  clampFocus(list);
  return list.length?list[focus].seq:null;
}
//edits of the focused sequence. each takes the sequence and returns the new one,
//or the same one for no change
var addColumn=function (s){ //the largest term that keeps the sequence standard
  var v=Systems.largestNext(sys,s,level);
  return (typeof v==="number")?s.concat([v]):s;
}
var removeColumn=function (s){
  return s.slice(0,-1);
}
var swipeUp=function (s){ //the next larger standard last term
  var w=Systems.nextLarger(sys,s,level);
  return w===null?s:s.slice(0,-1).concat([w]);
}
var swipeDown=function (s){ //the next smaller standard last term
  var w=Systems.nextSmaller(sys,s);
  return w===null?s:s.slice(0,-1).concat([w]);
}
var levelUp=function (s){
  level++;
  return s;
}
var levelDown=function (s){ //a sequence at or above (1,L+1) becomes (1,L)
  if(level<=1)return s;
  level--;
  return (s.length>=2&&s[1]>level)?[1,level]:s;
}
var apply=function (f){
  var list=entries();
  if(!list.length){ //nothing to act on: start from the empty sequence
    text=text.replace(/\s+$/,"")+(text.trim()?"\n":"")+"()";
    list=entries();
    focus=list.length-1;
  }
  clampFocus(list);
  var entry=list[focus];
  var before=level;
  var next;
  try{
    next=f(entry.seq);
  }catch(e){ //an engine failure leaves the sequence as it is
    console.warn(e);
    return;
  }
  if(next===entry.seq&&level===before)return;
  if(next!==entry.seq){
    var lines=text.split("\n");
    lines[entry.line]=seqToString(next);
    setText(lines.join("\n"));
  }
  refresh();
}
var setText=function (t){ //keep the editor in step when the swipes change the text
  text=t;
  var ta=dg("input");
  if(ta.value!==text){
    ta.value=text;
    fitTextarea();
  }
  expandState=null;
}
var refresh=function (){
  showLevel();
  draw();
  updateURL();
  saveState();
}
var showLevel=function (){
  dg("level-value").textContent=level;
}
var showSystem=function (){
  dg("sys-label").textContent=Systems.SYSTEMS[sys].name;
  document.querySelectorAll('input[name="sys"]').forEach(function (r){r.checked=(r.value===sys);});
}
var applyTheme=function (){
  var root=document.documentElement;
  if(theme==="system")root.removeAttribute("data-theme");
  else root.setAttribute("data-theme",theme);
  document.querySelectorAll('input[name="theme"]').forEach(function (r){r.checked=(r.value===theme);});
  var meta=document.querySelector('meta[name="theme-color"]');
  if(meta)meta.setAttribute("content",cssvar("--background-color")||"#1a1a1a");
}
//state, saved in localStorage and in the url query
var saveState=function (){
  lsSave("state",{text:text,focus:focus,l:level,sys:sys,theme:theme});
}
var restoreState=function (){
  var st=lsLoad("state")||{};
  if(typeof st.text==="string")text=st.text;
  if(typeof st.focus==="number")focus=Math.floor(st.focus);
  if(typeof st.l==="number"&&st.l>=1)level=Math.floor(st.l);
  if(SYS_KEYS.indexOf(st.sys)!==-1)sys=st.sys;
  if(THEMES.indexOf(st.theme)!==-1)theme=st.theme;
}
//?sys=1y&s=1,3,3;1,4 : the sequences of the text, separated by ;
var updateURL=function (){
  var base=location.href.split("#")[0].split("?")[0];
  var s=entries().map(function (e){return e.seq.join(",");}).join(";");
  try{
    history.replaceState(null,"",base+"?sys="+sys+"&s="+s);
  }catch(e){ //Safari throws when replaceState is called too often
  }
}
var loadURL=function (){
  var q=new URLSearchParams(location.search);
  if(SYS_KEYS.indexOf(q.get("sys"))!==-1)sys=q.get("sys");
  var s=q.get("s");
  if(s!==null){
    text=s.split(";").map(function (x){return seqToString(parseSeq(x));}).join("\n");
    focus=0;
    setLevelFrom(focusedSeq());
  }
}
//editor: a double tap shows the textarea, OK hides it
var lineStart=function (lines,l){ //offset of line l in the text
  var o=0;
  for(var i=0;i<l;i++)o+=lines[i].length+1;
  return o;
}
var openEditor=function (){
  var ta=dg("input");
  ta.value=text;
  dg("editor").hidden=false;
  fitTextarea();
  var list=entries();
  clampFocus(list);
  var lines=text.split("\n");
  var caret=list.length?lineStart(lines,list[focus].line)+lines[list[focus].line].length:text.length;
  try{
    ta.setSelectionRange(caret,caret); //the caret on the focused line, before focus() reads it
  }catch(e){
  }
  lastCaret=caret;
  expandState=null;
  ta.focus();
  draw(); //the editor takes room from the images
}
//keep the textarea one line taller than its content, soft-wrapped lines included
var fitTextarea=function (){
  var ta=dg("input");
  if(ta.offsetParent===null)return; //hidden, scrollHeight is 0
  var cs=getComputedStyle(ta);
  var line=parseFloat(cs.lineHeight);
  if(isNaN(line))line=parseFloat(cs.fontSize)*1.2; //"normal"
  var border=parseFloat(cs.borderTopWidth)+parseFloat(cs.borderBottomWidth);
  ta.style.height="0px"; //so scrollHeight shrinks back when lines are deleted
  ta.style.height=(ta.scrollHeight+line+border)+"px"; //scrollHeight = content + padding
}
var closeEditor=function (){
  dg("editor").hidden=true;
  dg("input").blur();
  draw(); //the images get the room of the editor back
}
var isEditing=function (){
  return !dg("editor").hidden;
}
//the entry on the line of the caret, -1 if that line has none
var caretEntry=function (caret){
  var line=text.substr(0,caret).split("\n").length-1;
  var list=entries();
  for(var i=0;i<list.length;i++)if(list[i].line===line)return i;
  return -1;
}
var handleInput=function (){ //live redraw while typing
  text=dg("input").value;
  fitTextarea();
  var i=caretEntry(dg("input").selectionStart);
  if(i>=0)focus=i;
  setLevelFrom(focusedSeq());
  refresh();
}
//the expand button inserts X[1], X[2], X[3], ... one by one under the line X of the caret
var lastCaret=0;      //caret offset as the user last placed it; our own edits never touch it
var expandState=null; //{insertAt, base, n, value}
var trackCaret=function (){ //on every user interaction with the textarea
  lastCaret=dg("input").selectionStart;
  expandState=null;   //the next press starts a new sequence from the caret line
  var i=caretEntry(lastCaret);
  if(i>=0&&i!==focus){ //the caret line becomes the focused image
    focus=i;
    setLevelFrom(focusedSeq());
    showLevel();
    showFocus();
    saveState();
  }
}
var handleExpand=function (){
  var ta=dg("input");
  text=ta.value;
  var lines=text.split("\n");
  var st=expandState;
  if(!(st&&st.value===text)){ //first press, or the text changed since the last one
    var caret=Math.min(lastCaret,text.length);
    var line=text.substr(0,caret).split("\n").length-1;
    var src=(lines[line]||"").replace(/\[[^\]]*\]/g,"");
    if(!/[0-9]/.test(src))return; //no sequence on the caret line
    st={insertAt:line+1,base:parseSeq(src),n:1};
  }
  var e;
  try{
    e=Systems.expand(sys,st.base,st.n); //X[n]
  }catch(err){
    console.warn(err);
    return;
  }
  if(e.length===0)return; //X[n] is empty, nothing to insert
  st.n++;
  lines.splice(st.insertAt,0,seqToString(e)); //right under X[n-1]
  st.insertAt++;
  text=lines.join("\n");
  ta.value=text; //browsers move the caret here, which is why the caret is tracked by trackCaret instead
  st.value=text;
  expandState=st;
  fitTextarea();
  if(document.activeElement===ta){ //still focused (a tap on a phone does not blur it): put the caret back on X
    try{
      ta.setSelectionRange(lastCaret,lastCaret);
    }catch(err){
    }
  }
  var i=caretEntry(lastCaret); //X keeps the focus
  if(i>=0)focus=i;
  refresh();
}
//menu
var isMenuOpen=function (){
  return !dg("menu").hidden;
}
var setMenu=function (open){
  dg("menu").hidden=!open;
  dg("menu-button").setAttribute("aria-expanded",open?"true":"false");
}
//swipe
var SWIPE_MIN=30; //px
var DOUBLE_TAP_MS=350;
var CONTROLS=".level, .editor, .footer, .menu, .menu-button";
var swipeStart=null;
var lastTap=0;
var handlePointerDown=function (e){
  if(isMenuOpen()&&!(e.target.closest&&e.target.closest(".menu, .menu-button"))){ //a tap outside closes the menu
    setMenu(false);
    swipeStart=null;
    return;
  }
  if(e.target.closest&&e.target.closest(CONTROLS))return; //taps on the controls are not swipes
  swipeStart=[e.clientX,e.clientY];
}
//the image under a point, -1 if none
var imageAt=function (x,y){
  var imgs=dg("visualization").querySelectorAll("img");
  for(var i=0;i<imgs.length;i++){
    var r=imgs[i].getBoundingClientRect();
    if(x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom)return i;
  }
  return -1;
}
var handlePointerUp=function (e){
  if(swipeStart===null)return;
  var dx=e.clientX-swipeStart[0];
  var dy=e.clientY-swipeStart[1];
  swipeStart=null;
  if(Math.abs(dx)<SWIPE_MIN&&Math.abs(dy)<SWIPE_MIN){ //a tap focuses an image; two in a row open the editor
    var i=imageAt(e.clientX,e.clientY);
    if(i>=0&&i!==focus){
      focus=i;
      setLevelFrom(focusedSeq());
      showLevel();
      showFocus();
      saveState();
    }
    var now=Date.now();
    if(now-lastTap<DOUBLE_TAP_MS){
      lastTap=0;
      if(!isEditing())openEditor();
    }else{
      lastTap=now;
    }
    return;
  }
  lastTap=0;
  if(isEditing())return; //no swipes while typing
  if(Math.abs(dx)>Math.abs(dy)){
    apply(dx>0?addColumn:removeColumn);
  }else{
    apply(dy<0?swipeUp:swipeDown);
  }
}
var KEYS={ArrowRight:addColumn,ArrowLeft:removeColumn,ArrowUp:swipeUp,ArrowDown:swipeDown,
          d:addColumn,a:removeColumn,w:swipeUp,s:swipeDown,
          "+":levelUp,"-":levelDown}; //cursor keys and wasd do the swipes on a pc, + and - the level buttons
var handleKey=function (e){
  if(e.key==="Escape"&&isMenuOpen()){
    setMenu(false);
    return;
  }
  if(e.target===dg("input")){ //typing in the editor: Escape closes it
    if(e.key==="Escape")closeEditor();
    return;
  }
  if(e.ctrlKey||e.altKey||e.metaKey)return;
  if(e.target.closest&&e.target.closest(".menu"))return;
  var f=KEYS[e.key.length===1?e.key.toLowerCase():e.key];
  if(!f)return;
  e.preventDefault();
  apply(f);
}
//display
var canvas;
var ctx;
var cssvar=function (name){
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
var canvasColors=function (){
  return {
    bg:cssvar("--canvas-bg")||"#242628",
    fg:cssvar("--canvas-fg")||"#d4d4d4",
    sym:cssvar("--canvas-sym")||"#ff6b6b",
    band:cssvar("--canvas-band")||"rgba(170,40,40,0.35)",
    divider:cssvar("--canvas-divider")||"#6b7177"
  };
}
var MAX_CANVAS=8192; //device pixels on a side
var MIN_SCALE=0.3;   //below this the images overflow and scroll instead
var cache={};        //rendered images by system, colors, pixel ratio and sequence
var cacheKeys=[];
var renderSeq=function (s,colors,dpr){
  var k=[sys,JSON.stringify(colors),dpr,s.join(",")].join("|");
  if(cache[k])return cache[k];
  var cols=[];
  var error="";
  var badRoot=-1;
  var nonStandard=false;
  try{
    cols=Systems.mountain(sys,s);
    nonStandard=Systems.isStandard(sys,s)===false;
  }catch(e){
    cols=[];
    error=e&&e.message?e.message:String(e);
  }
  try{
    if(!error)badRoot=Systems.badRoot(sys,s,cols);
  }catch(e){
  }
  var o={colors:colors,badRoot:badRoot,nonStandard:nonStandard,error:error};
  var L=MountainView.measure(ctx,cols,o);
  var r=Math.min(dpr,MAX_CANVAS/L.w,MAX_CANVAS/L.h);
  canvas.width=Math.max(1,Math.ceil(L.w*r));
  canvas.height=Math.max(1,Math.ceil(L.h*r));
  ctx.setTransform(r,0,0,r,0,0);
  ctx.fillStyle=colors.bg;
  ctx.fillRect(0,0,L.w,L.h);
  MountainView.render(ctx,L,o);
  var out={url:canvas.toDataURL("image/png"),w:L.w,h:L.h};
  cache[k]=out;
  cacheKeys.push(k);
  while(cacheKeys.length>200)delete cache[cacheKeys.shift()];
  return out;
}
var showFocus=function (){
  var imgs=dg("visualization").querySelectorAll("img");
  for(var i=0;i<imgs.length;i++)imgs[i].classList.toggle("focused",i===focus);
}
var draw=function (){
  var colors=canvasColors();
  var dpr=window.devicePixelRatio||1;
  var list=entries();
  clampFocus(list);
  var box=dg("visualization");
  var imgs=box.querySelectorAll("img");
  for(var i=imgs.length;i<list.length;i++){
    var img=document.createElement("img");
    img.alt="";
    img.draggable=false;
    box.appendChild(img);
  }
  for(var i=imgs.length-1;i>=list.length;i--)box.removeChild(imgs[i]);
  imgs=box.querySelectorAll("img");
  var shown=list.map(function (e){return renderSeq(e.seq,colors,dpr);});
  //one scale for all: the largest (at most 1) with which the wrapped images fit in the box
  var gap=8,border=2;
  var aw=box.clientWidth,ah=box.clientHeight;
  var fits=function (s){
    var x=0,rowh=0,y=0;
    for(var i=0;i<shown.length;i++){
      var w=shown[i].w*s+border,h=shown[i].h*s+border;
      if(w>aw)return false;
      if(x>0&&x+gap+w>aw){ //wrap to a new row
        y+=rowh+gap;
        x=0;
        rowh=0;
      }
      x+=(x>0?gap:0)+w;
      rowh=Math.max(rowh,h);
    }
    return y+rowh<=ah;
  }
  var scale=1;
  if(shown.length&&aw>0&&ah>0&&!fits(1)){
    var lo=0,hi=1;
    for(var it=0;it<20;it++){
      var mid=(lo+hi)/2;
      if(fits(mid))lo=mid;
      else hi=mid;
    }
    var maxw=0;
    for(var i=0;i<shown.length;i++)maxw=Math.max(maxw,shown[i].w);
    scale=Math.max(lo,Math.min(MIN_SCALE,(aw-border)/maxw)); //too many: scroll rather than shrink further
  }
  for(var i=0;i<shown.length;i++){
    if(imgs[i].getAttribute("src")!==shown[i].url)imgs[i].src=shown[i].url;
    imgs[i].style.width=(shown[i].w*scale+border)+"px"; //border-box: the border is inside
    imgs[i].style.height=(shown[i].h*scale+border)+"px";
  }
  box.classList.toggle("multi",list.length>1);
  showFocus();
}
window.onload=function (){
  canvas=dg("output");
  ctx=canvas.getContext("2d");
  restoreState();
  loadURL(); //the URL wins over the saved state
  dg("input").value=text;
  applyTheme();
  showSystem();
  refresh();
  dg("level-plus").addEventListener("click",function (){apply(levelUp);});
  dg("level-minus").addEventListener("click",function (){apply(levelDown);});
  dg("menu-button").addEventListener("click",function (){setMenu(!isMenuOpen());});
  document.querySelectorAll('input[name="theme"]').forEach(function (r){
    r.addEventListener("change",function (){
      theme=r.value;
      applyTheme();
      draw();
      saveState();
    });
  });
  document.querySelectorAll('input[name="sys"]').forEach(function (r){
    r.addEventListener("change",function (){
      sys=r.value;
      showSystem();
      refresh();
    });
  });
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",function (){
    applyTheme();
    draw();
  });
  dg("ok-button").addEventListener("click",closeEditor);
  dg("expand-button").addEventListener("click",handleExpand);
  var ta=dg("input");
  ta.addEventListener("input",handleInput);
  ["keyup","click","select","focus"].forEach(function (ev){
    ta.addEventListener(ev,trackCaret);
  });
  ta.addEventListener("input",function (){
    lastCaret=ta.selectionStart;
    expandState=null;
  });
  window.addEventListener("resize",fitTextarea); //soft wrapping changes with the width
  document.addEventListener("dblclick",function (e){ //a mouse double click, iOS sends none
    if(e.target.closest&&e.target.closest(CONTROLS))return;
    e.preventDefault();
    if(!isEditing())openEditor();
  });
  document.addEventListener("pointerdown",handlePointerDown);
  document.addEventListener("pointerup",handlePointerUp);
  document.addEventListener("pointercancel",function (){swipeStart=null;});
  document.addEventListener("keydown",handleKey);
  window.addEventListener("resize",draw); //the pixel ratio and the room can change
}
