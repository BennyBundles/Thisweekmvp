import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync(process.argv[2]||'_site/account/index.html','utf8');
const js=fs.readFileSync(process.argv[3]||'_site/account/app.js','utf8');
const configJs=fs.readFileSync(process.argv[4]||'_site/account/release-config.js','utf8');
const failures=[];const need=(l,c,t)=>{if(!c.includes(t))failures.push(l);};

let config=null;
try{
  const context={globalThis:{}};
  vm.runInNewContext(configJs,context,{timeout:1000});
  config=context.globalThis.THISWEEK_AUTH_RELEASE_CONFIG||null;
}catch(e){failures.push('Auth release config is not executable: '+e.message);}

need('exact Supabase network allowlist',html,'connect-src https://xjtvawmppzwzrooairyx.supabase.co');
need('Turnstile script allowlist',html,'script-src \'self\' https://challenges.cloudflare.com');
need('Turnstile frame allowlist',html,'frame-src https://challenges.cloudflare.com');
need('release config script',html,'<script src="./release-config.js"></script>');
need('Auth release gate UI',html,'id="authReleaseGates"');
need('CAPTCHA mount',html,'id="captchaMount"');
need('account gateway',js,'/functions/v1/thisweek-account-gateway');
need('recoverable signup',js,'/auth/v1/signup');
need('password recovery',js,'/auth/v1/recover');
need('password update',js,"method:'PUT',auth:true");
need('MFA enrollment',js,'/auth/v1/factors');
need('MFA challenge',js,'/challenge');
need('MFA verified-factor session elevation',js,"x.factor_type==='totp'&&x.status==='verified'");
need('MFA distinct missing-factor error',js,'No authenticator factor is available. Enroll one first.');
need('global logout',js,'/auth/v1/logout?scope=global');
need('shared auth session key',js,"thisweek.auth.session.v1");
need('sessionStorage only',js,'sessionStorage');
need('canonical confirmation redirect',js,'CONFIRM_REDIRECT');
need('canonical recovery redirect',js,'RECOVERY_REDIRECT');
need('Supabase CAPTCHA payload',js,'gotrue_meta_security');
need('Turnstile explicit render',js,'turnstile/v0/api.js?render=explicit');
need('signup cooldown',js,"assertCooldown('signup',60000");
need('recovery cooldown',js,"assertCooldown('recover',60000");
need('release readiness renderer',js,'renderReleaseReadiness');
need('typed deletion confirmation',html,'Type DELETE');
need('financial-history retention copy',html,'Financial history exists');
need('legal disclosure list',html,'id="legalList"');
need('legal environment mode',js,'LEGAL_ENVIRONMENT');
need('legal disclosure renderer',js,'renderLegal');
need('immutable acceptance action',js,"accountGateway('accept_legal'");
need('Sandbox legal mode',js,"PARAMS.get('legal')==='sandbox'");
need('cloud privacy inventory surface',html,'id="privacyInventoryList"');
need('cloud export control',html,'id="downloadCloudExport"');
need('privacy inventory action',js,"accountGateway('privacy_inventory')");
need('privacy export start',js,"accountGateway('privacy_export_start')");
need('privacy export page',js,"accountGateway('privacy_export_page'");
need('privacy export completion',js,"accountGateway('privacy_export_complete'");
need('client-side export assembly',js,'thisweek.cloud-export.v1');
need('privacy exclusion disclosure',js,'excludedFromSelfService');
need('local Plan export separation',html,'Export local Plan data');



if(!config)failures.push('Auth release config unavailable');
else{
  const expected='https://bennybundles.github.io/Thisweekmvp/account/';
  if(config.canonicalAccountUrl!==expected)failures.push('canonical Account Center URL mismatch');
  if(config.confirmationRedirect!==expected)failures.push('confirmation redirect must be exact Account Center URL');
  if(config.recoveryRedirect!==expected+'?mode=recovery')failures.push('recovery redirect must be exact Account Center recovery URL');
  const h=config.hostedAuth||{},c=config.captcha||{};
  const allHosted=h.siteUrlVerified===true&&h.redirectAllowlistVerified===true&&h.emailConfirmationsVerified===true&&h.customSmtpVerified===true;
  const captchaReady=c.supabaseProtectionVerified===true&&typeof c.siteKey==='string'&&c.siteKey.length>5;
  if(config.publicAuthReady===true&&!(allHosted&&captchaReady))failures.push('publicAuthReady cannot be true while hosted Auth/CAPTCHA gates are incomplete');
  if(c.supabaseProtectionVerified===true&&!captchaReady)failures.push('CAPTCHA protection marked verified without a public site key');
  if(c.provider!=='turnstile')failures.push('expected Turnstile as configured CAPTCHA provider');
}
if(/service_role|sb_secret_/i.test(html+js+configJs))failures.push('server secret pattern in Account Center');
if(/secret(Key|_key| key)\s*[:=]/i.test(configJs))failures.push('secret-shaped config field in public Auth release config');
if(/localStorage/.test(js))failures.push('Account Center must not persist auth tokens in localStorage');
try{new Function(js);}catch(e){failures.push('Account Center JS syntax: '+e.message);}
if(failures.length){console.error('Account Center check FAILED');failures.forEach(x=>console.error('- '+x));process.exit(1);}
console.log('Account Center check passed');
console.log(JSON.stringify({publicAuthReady:config?.publicAuthReady===true,captchaConfigured:!!(config?.captcha?.siteKey),canonicalAccountUrl:config?.canonicalAccountUrl},null,2));
