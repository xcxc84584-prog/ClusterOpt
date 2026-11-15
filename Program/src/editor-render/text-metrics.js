// v0.0.47 PR-04: read-only editor geometry snapshot.
// This module does not modify editor styles or scroll position.
export function measureTextMetrics(editor, getStyle = element => getComputedStyle(element)) {
  if (!editor || typeof editor !== 'object') return {ok:false,code:400,message:'Missing editor'};
  try {
    const style=getStyle(editor);
    const numeric=name=>Number.parseFloat(style[name]);
    const lineHeight=numeric('lineHeight');
    const fontSize=numeric('fontSize');
    const resolvedLineHeight=Number.isFinite(lineHeight)&&lineHeight>0
      ? lineHeight : (Number.isFinite(fontSize)&&fontSize>0 ? fontSize*1.2 : NaN);
    if (!Number.isFinite(resolvedLineHeight)||resolvedLineHeight<=0)
      return {ok:false,code:422,message:'Unresolved line height'};
    const px=name=>{const value=numeric(name);return Number.isFinite(value)?value:0;};
    const snapshot=Object.freeze({
      fontFamily:String(style.fontFamily??''),
      fontSize:Number.isFinite(fontSize)?fontSize:0,
      fontWeight:String(style.fontWeight??''),
      lineHeight:resolvedLineHeight,
      tabSize:String(style.tabSize??''),
      paddingTop:px('paddingTop'),paddingBottom:px('paddingBottom'),
      paddingLeft:px('paddingLeft'),paddingRight:px('paddingRight'),
      scrollTop:Number(editor.scrollTop)||0,
      scrollLeft:Number(editor.scrollLeft)||0,
      clientHeight:Number(editor.clientHeight)||0,
      clientWidth:Number(editor.clientWidth)||0
    });
    return {ok:true,code:200,data:snapshot};
  } catch(error) {
    return {ok:false,code:500,message:String(error)};
  }
}
