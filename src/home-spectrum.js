import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const finePointer=matchMedia('(hover: hover) and (pointer: fine)');
const toggle=$('.menu-toggle');
const nav=$('#spectrum-nav');
const motionButton=$('.motion-toggle');
let userPaused=false;
let motionContext;
let videoVisible=false;
const video=$('.campaign video');

function closeMenu(){toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Abrir menú');nav.classList.remove('is-open');}
toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú');nav.classList.toggle('is-open',open);});
nav.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});
document.addEventListener('click',e=>{if(!e.target.closest('.color-header')){closeMenu();$$('.color-header details[open]').forEach(d=>d.open=false);}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){const open=toggle.getAttribute('aria-expanded')==='true';closeMenu();$$('.color-header details[open]').forEach(d=>d.open=false);if(open)toggle.focus();}});
$$('.color-header details').forEach(d=>d.addEventListener('toggle',()=>{if(d.open)$$('.color-header details').filter(other=>other!==d).forEach(other=>other.open=false);}));

// The paragraph stays a single accessible sentence while its words take colour.
const manifesto=$('.intro-statement');
const originalText=manifesto.textContent;
manifesto.setAttribute('aria-label',originalText);
manifesto.replaceChildren(...originalText.split(' ').flatMap((word,index)=>{const span=document.createElement('span');span.className='word';span.textContent=word;span.setAttribute('aria-hidden','true');return index?[document.createTextNode(' '),span]:[span];}));
const processHeading=$('.process-visual h2');
const processText=processHeading.innerText;
processHeading.setAttribute('aria-label',processText.replace(/\s+/g,' '));
processHeading.innerHTML=processHeading.innerHTML.split(/<br\s*\/?>/).map(line=>`<span class="process-line" aria-hidden="true">${line}</span>`).join('');

const track=$('.testimonials-track');
function moveTestimonial(direction){const first=$('.testimonial');const gap=parseFloat(getComputedStyle(track).gap)||0;const step=first.getBoundingClientRect().width+gap;const index=Math.round(track.scrollLeft/step);const next=(index+direction+3)%3;track.scrollTo({left:next*step,behavior:reduced.matches||userPaused?'instant':'smooth'});}
$('[data-testimonial-prev]').addEventListener('click',()=>moveTestimonial(-1));
$('[data-testimonial-next]').addEventListener('click',()=>moveTestimonial(1));
track.addEventListener('keydown',e=>{if(e.target!==track)return;if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();moveTestimonial(e.key==='ArrowRight'?1:-1);}});

function syncVideo(){
 const canPlay=videoVisible&&!userPaused&&!reduced.matches&&!document.hidden&&!navigator.connection?.saveData;
 if(canPlay){const source=video.querySelector('source');if(!source.src){source.src=source.dataset.src;video.load();}video.play().catch(()=>{});}else video.pause();
}
new IntersectionObserver(entries=>{videoVisible=entries[0].isIntersecting;syncVideo();},{threshold:.15}).observe(video);
document.addEventListener('visibilitychange',syncVideo);

function setupMotion(){
 motionContext?.revert();
 const paused=userPaused||reduced.matches;
 document.body.classList.toggle('motion-paused',paused);
 motionButton.setAttribute('aria-pressed',String(paused));
 motionButton.setAttribute('aria-label',paused?'Activar animaciones':'Pausar animaciones');
 motionButton.querySelector('span').textContent=paused?'▶':'Ⅱ';
 syncVideo();
 if(paused){$$('.word').forEach(word=>word.classList.remove('is-read'));$$('[data-count]').forEach(el=>el.textContent=el.dataset.count);gsap.killTweensOf('.contact-photo img');gsap.set('.contact-photo img',{clearProps:'all'});return;}
 motionContext=gsap.context(()=>{
  // Entrance and scroll animate different elements so resizing cannot restore an old transform.
  if(window.scrollY<100){
   gsap.from('.hero-heading h1>span',{y:55,opacity:0,duration:1.05,stagger:.1,ease:'power3.out',clearProps:'all'});
   gsap.from('.hero-editorial',{y:20,opacity:0,duration:.7,delay:.2,clearProps:'all'});
   gsap.from('.campaign',{clipPath:'inset(100% 0 0 0)',duration:1.15,stagger:.12,delay:.2,ease:'power3.inOut',clearProps:'clipPath'});
  }
  const words=$$('.intro-statement .word');
  ScrollTrigger.create({trigger:manifesto,start:'top 85%',end:'bottom 45%',onUpdate:self=>{const count=Math.ceil(self.progress*words.length);words.forEach((word,i)=>word.classList.toggle('is-read',i<count));}});
  gsap.utils.toArray('.sector-card,.door,.reason,.case-card,.stats>div').forEach(el=>{
   gsap.from(el,{y:38,opacity:.2,duration:.8,ease:'power2.out',scrollTrigger:{trigger:el,start:'top 94%',once:true},clearProps:'transform,opacity'});
  });
  $$('.process-steps article').forEach((el,index)=>{ScrollTrigger.create({trigger:el,start:'top 65%',end:'bottom 35%',onEnter:()=>setProcess(index),onEnterBack:()=>setProcess(index)});});
  $$('[data-count]').forEach(el=>{const value={n:0};gsap.to(value,{n:Number(el.dataset.count),duration:1.5,ease:'power2.out',scrollTrigger:{trigger:el,start:'top 90%',once:true},onUpdate:()=>el.textContent=Math.round(value.n)});});
  if(finePointer.matches){
   gsap.to('.contact-photo-one',{xPercent:55,rotation:-5,ease:'none',scrollTrigger:{trigger:'.contact-section',start:'top bottom',end:'bottom top',scrub:1}});
   gsap.to('.contact-photo-two',{xPercent:-55,rotation:5,ease:'none',scrollTrigger:{trigger:'.contact-section',start:'top bottom',end:'bottom top',scrub:1}});
  }
 });
 ScrollTrigger.refresh();
}
function setProcess(index){$$('.process-line').forEach((line,i)=>line.classList.toggle('active',i===index));$('.process-number').textContent=String(index+1).padStart(2,'0');}
const contact=$('.contact-section');
contact.addEventListener('pointermove',e=>{
 if(userPaused||reduced.matches||!finePointer.matches)return;
 const rect=contact.getBoundingClientRect();const x=(e.clientX-rect.left)/rect.width-.5;const y=(e.clientY-rect.top)/rect.height-.5;
 gsap.to('.contact-photo img',{x:x*35,y:y*35,scale:1.12,duration:.8,ease:'power2.out',overwrite:true});
});
contact.addEventListener('pointerleave',()=>gsap.to('.contact-photo img',{x:0,y:0,scale:1,duration:.7,overwrite:true}));
motionButton.addEventListener('click',()=>{userPaused=!userPaused;setupMotion();});
reduced.addEventListener('change',setupMotion);
document.fonts.ready.then(setupMotion);
window.addEventListener('load',()=>ScrollTrigger.refresh(),{once:true});
