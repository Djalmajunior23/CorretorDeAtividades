const fs = require('fs');
let s = fs.readFileSync('server.ts', 'utf-8');

const target1 = `  const { language, code, test_cases, studentName, className, rubric } = req.body;

  if (!language || typeof code !== "string") {
    return res.status(400).json({ error: "Language and Code parameters are required" });
  }

  const subId = crypto.randomUUID();
  const submissionData = {
    id: subId,
    teacher_id: "teacher_portal",
    student_name: studentName || null,
    class_name: className || null,
    language,
    code,
    status: "failed"
  };

  try {
    const tests = Array.isArray(test_cases) ? test_cases : [];
    
    // Orchestrate correction through CorrectionService (Engine 2.0)
    const serviceResult = await CorrectionService.run(language, code, tests, rubric, currentLintingSettings, FEATURE_FLAGS.ENABLE_SANDBOX_EXECUTOR);`;

const target2 = `    await persistFullResult(submissionData, serviceResult);

    return res.json(legacyCompatibleResult);`;

const base64Code = `ICAgY29uc3QgeyBsYW5ndWFnZSwgY29kZSwgdGVzdF9jYXNlcywgc3R1ZGVudE5hbWUsIGNsYXNzTmFtZSwgcnVicmljLCBjbGFzc19pZCwgc3R1ZGVudF9pZCB9ID0gcmVxLmJvZHk7CgogIGlmICghbGFuZ3VhZ2UgfHwgdHlwZW9mIGNvZGUgIT09ICJzdHJpbmciKSB7CiAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oeyBlcnJvcjogIkxhbmd1YWdlIGFuZCBDb2RlIHBhcmFtZXRlcnMgYXJlIHJlcXVpcmVkIiB9KTsKICB9CgogIGNvbnN0IHN1YklkID0gY3J5cHRvLnJhbmRvbVVVSUQoKTsKICBjb25zdCB0ZWFjaGVyX2lkID0gcmVxLnF1ZXJ5LnVzZXJJZD8udG9TdHJpbmcoKSB8fCAidGVhY2hlciI7CiAgY29uc3Qgc3VibWlzc2lvbkRhdGEgPSB7CiAgICBpZDogc3ViSWQsCiAgICB0ZWFjaGVyX2lkLAogICAgc3R1ZGVudF9uYW1lOiBzdHVkZW50TmFtZSB8fCBudWxsLAogICAgY2xhc3NfbmFtZTogY2xhc3NOYW1lIHx8IG51bGwsCiAgICBsYW5ndWFnZSwKICAgIGNvZGUsCiAgICBzdGF0dXM6ICJmYWlsZWQiCiAgfTsKCiAgdHJ5IHsKICAgIGNvbnN0IHRlc3RzID0gQXJyYXkuaXNBcnJheSh0ZXN0X2Nhc2VzKSA/IHRlc3RfY2FzZXMgOiBbXTsKICAgCiAgICAvLyBPcmNoZXN0cmF0ZSBjb3JyZWN0aW9uIHRocm91Z2ggQ29ycmVjdGlvblNlcnZpY2UgKEVuZ2luZSAyLjApCiAgICBjb25zdCBzZXJ2aWNlUmVzdWx0ID0gYXdhaXQgQ29ycmVjdGlvblNlcnZpY2UucnVuKGxhbmd1YWdlLCBjb2RlLCB0ZXN0cywgcnVicmljLCBjdXJyZW50TGludGluZ1NldHRpbmdzLCBGRUFUVVJFX0ZMQUdTLkVOQUJMRV9TQU5EQk9YX0VYRUNVVE9SKTs=`;

const base64Code2 = `ICAgIGF3YWl0IHBlcnNpc3RGdWxsUmVzdWx0KHN1Ym1pc3Npb25EYXRhLCBzZXJ2aWNlUmVzdWx0KTsKCiAgICBpZiAoY2xhc3NfaWQgJiYgc3R1ZGVudF9pZCAmJiBwb29sKSB7CiAgICAgIGF3YWl0IHBvb2wucXVlcnkoCiAgICAgICAgIklOU0VSVCBJTlRPIGRfcGVkYWdvZ2ljYWxfZXZpZGVuY2UgKGlkLCB0ZWFjaGVyX2lkLCBjbGFzc19pZCwgc3R1ZGVudF9pZCwgc291cmNlX3R5cGUsIHNvdXJjZV9pZCwgdGl0bGUsIGRlc2NyaXB0aW9uLCBzY29yZSwgZmVlZGJhY2spIFZBTFVFUyAoJDEsICQyLCAkMywgJDQsICQ1LCAkNiwgJDcsICQ4LCAkOSwgJDEwKSIsCiAgICAgICAgW2NyeXB0by5yYW5kb21VVUlEKCksIHRlYWNoZXJfaWQsIGNsYXNzX2lkLCBzdHVkZW50X2lkLCAiY29ycmVjdGlvbl9tYW51YWwiLCBzdWJJZCwgIkNvcnJlY8Onw6NvIEluZGl2aWR1YWwiICwgc2VydmljZVJlc3VsdC5mZWVkYmFjay5zdW1tYXJ5LCBzZXJ2aWNlUmVzdWx0LmZpbmFsX3Njb3JlLCB1bmlmaWVkRmVlZGJhY2tTdHJpbmddCiAgICAgICk7CiAgICB9CgogICAgcmV0dXJuIHJlcy5qc29uKGxlZ2FjeUNvbXBhdGlibGVSZXN1bHQpOw==`;

s = s.replace(target1, Buffer.from(base64Code, 'base64').toString('utf-8'));
s = s.replace(target2, Buffer.from(base64Code2, 'base64').toString('utf-8'));

fs.writeFileSync('server.ts', s);
console.log('Done patching server.ts');
