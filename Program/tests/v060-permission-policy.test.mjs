import test from 'node:test';
import assert from 'node:assert/strict';
import {CRUD,parseCrud,evaluateCommand} from '../src/powershell-manager/permission-policy.js';

test('60.1 CRUD binary ordering C R U D',()=>{assert.equal(parseCrud('0100'),CRUD.READ);assert.equal(parseCrud('1111'),15);assert.throws(()=>parseCrud('101'));});
test('60.2 default read allowed, writes pending',()=>{
 assert.equal(evaluateCommand({command:'Get-Content',operation:CRUD.READ}).decision,'ALLOW');
 assert.equal(evaluateCommand({command:'Remove-Item',operation:CRUD.DELETE}).decision,'PENDING');
});
test('60.3 blacklist overrides full allow',()=>{
 const rules=[{targetType:'COMMAND',pattern:'ALL',listType:'ALLOW',level:'FULL'},{targetType:'COMMAND',pattern:'Remove-Item',listType:'DENY',level:'DENY'}];
 assert.equal(evaluateCommand({command:'Remove-Item',operation:CRUD.DELETE,rules}).decision,'DENY');
});
test('60.4 expired rule does not grant access',()=>{
 const rules=[{targetType:'COMMAND',pattern:'ALL',listType:'ALLOW',level:'FULL',expiresAt:'2020-01-01T00:00:00Z'}];
 assert.equal(evaluateCommand({command:'Remove-Item',operation:CRUD.DELETE,rules}).decision,'PENDING');
});
test('60.5 reject shell expressions instead of treating as command names',()=>{
 assert.equal(evaluateCommand({command:'Get-Content;Remove-Item',operation:CRUD.READ}).decision,'DENY');
});
