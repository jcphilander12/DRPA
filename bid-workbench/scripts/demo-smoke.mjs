import assert from 'node:assert/strict';
import {createRuntime,identity} from './test-runtime.mjs';
import {seedDemo} from './demo-seed.mjs';
const mf=await createRuntime();
try{
 await seedDemo(mf);await seedDemo(mf);
 for(const [email,role]of [['master@example.test','master'],['writer@example.test','writer'],['checker@example.test','checker']]){
  const response=await mf.dispatchFetch('http://127.0.0.1:4180/api/workspace',{headers:identity(email)});const state=await response.json();
  assert.equal(response.status,200);assert.equal(state.collaboration.me.role,role);assert.equal(state.workspace.projects[0].id,'demo-bid');assert.equal(state.workspace.projects[0].questions.length,2);assert.equal(state.workspace.sources.length,2);assert.equal(state.workspace.projects[0].fmt.mappings.length,6);
  assert.ok(state.workspace.sources.every(source=>source.text.includes('synthetic')||source.text.includes('SYNTHETIC')||source.text.includes('Illustrative')));
 }
 console.log('PASS: local demo seeds idempotently with synthetic documents, assigned users and a sample FMT.');
}finally{await mf.dispose();}
