(function(){
  const VERSION='login-v3-2026-09-14';

  function setMessage(text,type=''){
    const el=document.querySelector('#loginMessage');
    if(!el)return;
    el.textContent=text||'';
    el.className='msg'+(type?' '+type:'');
  }

  async function requestLogin(email,password){
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),15000);
    try{
      const response=await fetch('/api/admin-auth',{
        method:'POST',
        headers:{'Content-Type':'application/json','X-Portfolio-Login-Version':VERSION},
        body:JSON.stringify({email,password}),
        signal:controller.signal,
        cache:'no-store',
        credentials:'same-origin'
      });
      const text=await response.text();
      let data={};
      try{data=text?JSON.parse(text):{}}catch{}
      if(!response.ok)throw new Error(data.error||text||`Sign in failed (${response.status}).`);
      if(!data.authenticated)throw new Error('The server did not create an admin session.');
      return data;
    }catch(error){
      if(error?.name==='AbortError')throw new Error('Login request timed out after 15 seconds. The live admin deployment may be stale or its API is not responding.');
      throw error;
    }finally{
      clearTimeout(timer);
    }
  }

  function install(){
    const form=document.querySelector('#loginForm');
    if(!form||form.dataset.failSafeLogin==='true')return;
    form.dataset.failSafeLogin='true';
    form.dataset.loginVersion=VERSION;

    const button=form.querySelector('button[type="submit"]');
    if(button)button.title='Secure admin login';

    form.addEventListener('submit',async(event)=>{
      // This capture-phase handler deliberately replaces the older two-step
      // browser Firebase login. Authentication now happens through one bounded
      // request to the same-origin Vercel API.
      event.preventDefault();
      event.stopImmediatePropagation();

      const email=document.querySelector('#email')?.value?.trim()||'';
      const password=document.querySelector('#password')?.value||'';
      if(!email)return setMessage('Enter the admin email.','error');
      if(!password)return setMessage('Enter the admin password.','error');

      const original=button?.textContent||'Sign in securely';
      if(button){button.disabled=true;button.textContent='Signing in…'}
      setMessage('Checking secure admin access…');

      try{
        await requestLogin(email,password);
        if(document.querySelector('#password'))document.querySelector('#password').value='';
        setMessage('Access confirmed. Opening Command Center…','ok');
        // Reloading makes the existing startup code verify the newly issued
        // HttpOnly cookie and open the dashboard from a clean state.
        window.location.reload();
      }catch(error){
        setMessage(error?.message||'Unable to sign in.','error');
        if(button){button.disabled=false;button.textContent=original}
      }
    },true);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
