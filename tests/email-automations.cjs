const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function load(path, mocks) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('require', 'exports', code)(name => mocks[name], exports);
  return exports;
}
function setup({ taps=5, sent=false, verified=true, claimed=true, failure=false }={}) {
  const queries=[];let sends=0;
  const responses=[{data:{id:'CARD',label:'Review card',taps,owner_profile_id:'OWNER',amazon_review_request_email_sent_at:sent?'sent':null}},{data:{auth_user_id:'USER'}},{data:claimed?{id:'CARD'}:null},{error:null}];
  const db={from(table){const query={table,filters:[]};queries.push(query);const chain={select(){return chain;},eq(...args){query.filters.push(args);return chain;},gte(){return chain;},is(){return chain;},update(value){query.update=value;return chain;},maybeSingle(){return Promise.resolve(responses.shift());},then(resolve,reject){return Promise.resolve(responses.shift()).then(resolve,reject);}};return chain;},auth:{admin:{getUserById:async()=>({data:{user:{email:'test@example.com',email_confirmed_at:verified?'verified':null}}})}}};
  const mod=load('lib/review-email-trigger.ts',{'@/lib/supabase/server':{createSupabaseAdminClient:()=>db},'@/lib/email':{sendAmazonReviewRequestEmail:async args=>{sends++;assert.equal(args.idempotencyKey,'card-review/CARD');if(failure)throw Error('quota exceeded');}}});
  return {run:()=>mod.sendReviewEmailForCard('CARD'),queries,get sends(){return sends;}};
}
test('fifth tap sends without activation age requirement',async()=>{const s=setup();assert.equal(await s.run(),true);assert.equal(s.sends,1);});
for(const [name,options] of [['four taps',{taps:4}],['already sent',{sent:true}],['unverified owner',{verified:false}],['another tap holds the claim',{claimed:false}]]) test(name+' does not send',async()=>{const s=setup(options);assert.equal(await s.run(),false);assert.equal(s.sends,0);});
test('provider failure releases only its own claim for retry',async()=>{const s=setup({failure:true});await assert.rejects(s.run(),/quota/);const release=s.queries.at(-1);assert.deepEqual(release.update,{amazon_review_request_email_sent_at:null});assert.ok(release.filters.some(([key,value])=>key==='amazon_review_request_email_sent_at'&&value));});
test('daily automation no longer sends review emails',async()=>{
  const mod=load('app/api/automations/emails/route.ts',{
    'next/server':{NextResponse:{json:(body,options)=>({body,status:options?.status??200})}},
    '@/lib/abandoned-checkout-automation':{runAbandonedCheckoutAutomation:async()=>({sent:0,failed:0})},
    '@/lib/email':{},
    '@/lib/supabase/email-automations':{readEmailVerificationReminderCandidates:async()=>[]}
  });
  const result=await mod.GET(new Request('https://example.com',{headers:{'x-vercel-cron':'1'}}));assert.equal(result.status,200);assert.equal(result.body.ok,true);assert.equal('reviewRequestsSent' in result.body,false);
});
