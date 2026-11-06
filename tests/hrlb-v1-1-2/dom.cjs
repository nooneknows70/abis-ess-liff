'use strict';
// Small synthetic DOM with parsed nodes, connected IDs, parentage and mutation
// tracking. Runs the real bundle/adapter; no browser, network or provider calls.
const VOID=new Set(['input','br','hr','img','meta','link','area','base','embed','source','wbr']);
const decode=s=>String(s).replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
class Element {
 constructor(tag,doc){this.tagName=tag.toUpperCase();this.doc=doc;this.children=[];this.parentNode=null;this.attrs={};this.style={setProperty:(k,v)=>this.style[k]=v};this.dataset={};this._text='';this._value=undefined;this.innerWrites=0;this.listeners={};const self=this;this.classList={contains:c=>self.className.split(/\s+/).includes(c),add(...cs){self.className=[...new Set(self.className.split(/\s+/).concat(cs))].filter(Boolean).join(' ');},remove(...cs){self.className=self.className.split(/\s+/).filter(c=>!cs.includes(c)).join(' ');},toggle(c,on){if(on===undefined)on=!this.contains(c);on?this.add(c):this.remove(c);return on;}};}
 setAttribute(k,v){this.attrs[k]=String(v);if(k==='style')String(v).split(';').forEach(x=>{const at=x.indexOf(':');if(at>0)this.style[x.slice(0,at).trim()]=x.slice(at+1).trim();});if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=String(v);}
 getAttribute(k){return Object.hasOwn(this.attrs,k)?this.attrs[k]:null;}
 removeAttribute(k){delete this.attrs[k];}
 get id(){return this.attrs.id||'';}set id(v){this.attrs.id=v;}
 get className(){return this.attrs.class||'';}set className(v){this.attrs.class=String(v);}
 get disabled(){return Object.hasOwn(this.attrs,'disabled');}set disabled(v){v?this.attrs.disabled='':delete this.attrs.disabled;}
 get hidden(){return Object.hasOwn(this.attrs,'hidden');}set hidden(v){v?this.attrs.hidden='':delete this.attrs.hidden;}
 get isConnected(){return !!this.parentNode||this===this.doc.documentElement;}
 get value(){if(this._value!==undefined)return this._value;if(this.tagName==='SELECT'){const opts=this.children.filter(x=>x.tagName==='OPTION');return (opts.find(x=>Object.hasOwn(x.attrs,'selected'))||opts[0])?.getAttribute('value')||'';}if(this.tagName==='TEXTAREA')return this.textContent;return this.attrs.value||'';}set value(v){this._value=String(v);}
 appendChild(el){if(el.parentNode)el.remove();this.children.push(el);el.parentNode=this;return el;}
 append(...els){els.forEach(e=>this.appendChild(e));}
 remove(){if(this.parentNode){this.parentNode.children=this.parentNode.children.filter(x=>x!==this);this.parentNode=null;}}
 get textContent(){return this._text+this.children.map(x=>x.textContent).join('');}set textContent(v){this.children.forEach(x=>x.parentNode=null);this.children=[];this._text=String(v);}
 get innerHTML(){return this._html===undefined?this._text+this.children.map(x=>x.outerHTML).join(''):this._html;}set innerHTML(v){this.innerWrites++;this.children.forEach(x=>x.parentNode=null);this.children=[];this._text='';this._html=String(v);parse(String(v),this);}
 get outerHTML(){return '<'+this.tagName.toLowerCase()+Object.entries(this.attrs).map(([k,v])=>' '+k+'="'+v+'"').join('')+'>'+this.innerHTML+'</'+this.tagName.toLowerCase()+'>';}
 querySelectorAll(selector){return all(this).filter(x=>matches(x,selector));}querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
 closest(selector){for(let x=this;x;x=x.parentNode)if(matches(x,selector))return x;return null;}
 addEventListener(name,fn){this.listeners[name]=fn;}focus(){this.doc.activeElement=this;this.doc.focus.push(this.id);}
 getBoundingClientRect(){return {top:0,left:0,width:400,height:48};}
}
function all(root){return root.children.flatMap(x=>[x,...all(x)]);}
function matches(e,selector){return selector.split(',').some(s=>{s=s.trim();if(!s)return false;const attr=/^([\w-]*)\[([\w-]+)="([^"]*)"\]$/.exec(s);if(attr)return (!attr[1]||e.tagName===attr[1].toUpperCase())&&e.getAttribute(attr[2])===attr[3];if(s.includes(' '))s=s.split(/\s+/).at(-1);const m=/^([\w-]+)?(?:#([\w-]+))?(?:\.([\w-]+))?$/.exec(s);if(m)return (!m[1]||e.tagName===m[1].toUpperCase())&&(!m[2]||e.id===m[2])&&(!m[3]||e.classList.contains(m[3]));return false;});}
function parse(html,root){const stack=[root],tokens=html.match(/<!--[\s\S]*?-->|<[^>]+>|[^<]+/g)||[];for(const token of tokens){if(token.startsWith('<!--'))continue;if(token.startsWith('</')){if(stack.length>1)stack.pop();continue;}if(token.startsWith('<')){const m=/^<([\w-]+)/.exec(token);if(!m)continue;const el=new Element(m[1],root.doc);const body=token.slice(m[0].length,token.length-1);for(const a of body.matchAll(/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g))el.setAttribute(a[1],decode(a[2]??a[3]??a[4]??''));stack.at(-1).appendChild(el);if(!VOID.has(m[1].toLowerCase())&&!token.endsWith('/>'))stack.push(el);}else stack.at(-1)._text+=decode(token);}}
function makeDocument(){const d={focus:[],activeElement:null,createElement:tag=>new Element(tag,d),addEventListener(){},querySelectorAll:s=>all(d.documentElement).filter(e=>matches(e,s)),querySelector:s=>d.querySelectorAll(s)[0]||null,getElementById:id=>all(d.documentElement).find(e=>e.id===id)||null};d.documentElement=new Element('html',d);d.head=d.documentElement.appendChild(new Element('head',d));d.body=d.documentElement.appendChild(new Element('body',d));for(const id of ['accountContent','account','app','home','opStatus']){const e=d.createElement('div');e.id=id;d.body.appendChild(e);}return d;}
module.exports={makeDocument};
