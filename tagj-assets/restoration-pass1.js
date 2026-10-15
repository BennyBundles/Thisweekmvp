/* October 2 restoration: isolated form-behavior patch. Original scripts unchanged. */
(function(){
  'use strict';
  const d=document;
  const worldDefaults=[
    [/^#tagj(?:-|$)/i,'TAGJ Custom Clothing Request'],
    [/^#artist(?:-|$)/i,'Feature Request'],
    [/^#producer(?:-|$)/i,'Beat Inquiry'],
    [/^#creative(?:-|$)/i,'Custom Creative Request']
  ];
  function getWizard(){return d.querySelector('#v143Wizard');}
  function alertNode(){
    const wiz=getWizard();
    if(!wiz)return null;
    let node=d.querySelector('#restorationValidationNotice');
    if(node)return node;
    node=d.createElement('p');
    node.id='restorationValidationNotice';
    node.setAttribute('role','alert');
    node.setAttribute('aria-live','assertive');
    node.hidden=true;
    node.style.cssText='color:#fff2da;background:#563027;border:1px solid #d7a66d;border-radius:9px;padding:12px 14px;margin:12px 15px;font:600 13px/1.55 system-ui,sans-serif;box-sizing:border-box;';
    const form=d.querySelector('#v143WizardForm');
    const foot=form?.querySelector('.v143-wizard-foot');
    if(form&&foot)form.insertBefore(node,foot);else wiz.appendChild(node);
    return node;
  }
  function clearNotice(){
    const n=d.querySelector('#restorationValidationNotice');
    if(n){n.textContent='';n.hidden=true;}
    d.querySelectorAll('#v143Wizard [aria-invalid="true"][data-restoration-invalid="1"]').forEach(el=>{
      el.removeAttribute('aria-invalid');el.removeAttribute('data-restoration-invalid');el.removeAttribute('aria-describedby');
    });
  }
  function reportMissing(el){
    const n=alertNode();if(!n)return;
    const id=el.id;
    const label=id?d.querySelector('label[for="'+id+'"]'):null;
    n.textContent='Please choose '+(label?.textContent?.trim()||'the required option')+' before continuing.';
    n.hidden=false;
    el.setAttribute('aria-invalid','true');
    el.setAttribute('data-restoration-invalid','1');
    el.setAttribute('aria-describedby',n.id);
    el.scrollIntoView?.({block:'center',behavior:'auto'});
    el.focus({preventScroll:true});
  }
  // Intercept only generic requests. Explicit service choices remain authoritative.
  d.addEventListener('click',function(event){
    const btn=event.target.closest?.('[data-v143-wizard]');
    if(!btn)return;
    const preset=btn.getAttribute('data-v143-wizard');
    if(preset&&preset!=='General Contact')return;
    const locationHash=window.location.hash||'';
    const mapped=worldDefaults.find(([expr])=>expr.test(locationHash))?.[1];
    if(mapped)btn.setAttribute('data-v143-wizard',mapped);
    clearNotice();
  },true);
  // Only dynamic request-specific selects with a visible "Select..." placeholder
  // are treated as required. Existing optional fields stay optional.
  d.addEventListener('click',function(event){
    const btn=event.target.closest?.('#v143WizardNext');
    const wiz=getWizard();
    if(!btn||!wiz||!wiz.classList.contains('open'))return;
    const step=wiz.querySelector('.v143-step.active');
    if(!step||step.getAttribute('data-step')!=='1')return;
    const required=[...step.querySelectorAll('#v144SpecialFields select')].filter(x=>x.options[0]?.value==='');
    const missing=required.find(x=>!x.value);
    if(!missing){clearNotice();return;}
    event.preventDefault();event.stopImmediatePropagation();
    reportMissing(missing);
  },true);
  d.addEventListener('change',function(event){
    if(event.target.matches?.('#v144SpecialFields select')&&event.target.value)clearNotice();
  },true);
  d.addEventListener('click',function(event){
    if(event.target.closest?.('#v143WizardBack,#v143WizardClose'))clearNotice();
  },true);
})();
